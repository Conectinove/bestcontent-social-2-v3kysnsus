/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0103 — Histórico de edições (studio_edit_versions).
 *
 * A cada salvamento da Edição Avançada de uma mídia/post é gravada UMA
 * versão (snapshot) do estado aplicado, permitindo listar versões anteriores
 * e restaurar qualquer uma delas depois.
 *
 * Campos:
 *  - target_key (text, obrigatório): chave da mídia/post versionado
 *    (ex.: "creation:<id>" ou "media:<url>" — mesmo key compartilhado por
 *    todos que editam o mesmo material).
 *  - title (text): rótulo curto exibido na lista de versões.
 *  - settings (json): o AdvancedCustomizationState serializado do snapshot.
 *  - text_layers (json): camadas de texto do snapshot (array, pode ser vazio).
 *  - aspect_ratio (text): proporção usada no snapshot (16:9, 1:1, 4:5, 9:16).
 *  - preview_url (text): URL da mídia resultante (data URL grande vai aqui
 *    NÃO — ver nota abaixo; o data URL fica em result_data_url apenas se couber).
 *  - result_url (text): URL/data URL do resultado rasterizado do salvamento.
 *  - user_name (text): nome de quem salvou (para exibir na lista).
 *  - user (relation users, OBRIGATÓRIO — padrão das migrations 00090/00092).
 *
 * Regras (padrão 0100/0101): cada usuário vê as versões dos próprios saves;
 * membros da mesma company também leem (colaboração).
 *
 * Toda lógica é inline no callback (limitação do JSVM do PocketBase).
 */
migrate(
  (app) => {
    const collection = new Collection({
      name: 'studio_edit_versions',
      type: 'base',
      listRule:
        '@request.auth.id != "" && (user = @request.auth.id || company != "" && company = @request.auth.record.company)',
      viewRule:
        '@request.auth.id != "" && (user = @request.auth.id || (@request.auth.record.company != "" && company = @request.auth.record.company))',
      createRule: '@request.auth.id != "" && @request.body.user = @request.auth.id',
      updateRule: '@request.auth.id != "" && user = @request.auth.id',
      deleteRule: '@request.auth.id != "" && user = @request.auth.id',
      fields: [
        { name: 'target_key', type: 'text', required: true, max: 500 },
        { name: 'title', type: 'text', required: false, max: 255 },
        { name: 'settings', type: 'json', required: false, maxSize: 2000000 },
        { name: 'text_layers', type: 'json', required: false, maxSize: 2000000 },
        { name: 'aspect_ratio', type: 'text', required: false, max: 10 },
        { name: 'preview_url', type: 'text', required: false, max: 0 },
        { name: 'result_url', type: 'text', required: false, max: 0 },
        { name: 'user_name', type: 'text', required: false, max: 160 },
        { name: 'company', type: 'text', required: false, max: 255 },
      ],
    })

    collection.fields.add(
      new RelationField({
        name: 'user',
        required: true,
        collectionId: '_pb_users_auth_',
        maxSelect: 1,
        cascadeDelete: true,
      }),
    )

    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('studio_edit_versions')
      app.delete(collection)
    } catch (_) {}
  },
)
