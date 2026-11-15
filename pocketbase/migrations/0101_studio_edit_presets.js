/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0101 — Presets de edição avançada (studio_edit_presets).
 *
 * Guarda combinações nomeadas de ajustes do painel de Edição Avançada
 * (AdvancedCustomizationState em JSON) para reaproveitar depois.
 *
 * Campos:
 *  - name (text, obrigatório): nome dado pelo usuário ao preset.
 *  - settings (json): o AdvancedCustomizationState completo serializado.
 *  - user (relation users, OBRIGATÓRIO — padrão das migrations 00090/00092:
 *    todo record da coleção exige user, regra da casa).
 *
 * Regras (padrão 0100): cada usuário só vê/edita os próprios presets.
 *
 * Toda lógica é inline no callback (limitação do JSVM do PocketBase).
 */
migrate(
  (app) => {
    const collection = new Collection({
      name: 'studio_edit_presets',
      type: 'base',
      listRule: '@request.auth.id != "" && user = @request.auth.id',
      viewRule: '@request.auth.id != "" && user = @request.auth.id',
      createRule: '@request.auth.id != "" && @request.body.user = @request.auth.id',
      updateRule: '@request.auth.id != "" && user = @request.auth.id',
      deleteRule: '@request.auth.id != "" && user = @request.auth.id',
      fields: [
        { name: 'name', type: 'text', required: true, max: 120 },
        { name: 'settings', type: 'json', required: false, maxSize: 2000000 },
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
      const collection = app.findCollectionByNameOrId('studio_edit_presets')
      app.delete(collection)
    } catch (_) {}
  },
)
