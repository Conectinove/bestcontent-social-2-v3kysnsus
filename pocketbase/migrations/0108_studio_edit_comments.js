/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0108 — Comentários da colaboração em tempo real
 * (coleção studio_edit_comments).
 *
 * Enquanto duas pessoas editam a mesma mídia/post/doc (useLiveEditCollaboration,
 * migration 0103), agora também podem TROCAR COMENTÁRIOS em tempo real:
 * cada comentário é ancorado no material editado via target_key (mesma chave
 * "creation:<id>" / "post:<id>" / doc id já usada pelo histórico de versões).
 *
 * Campos:
 *  - target_key (text, obrigatório): chave do material comentado — idêntica
 *    à usada por studio_edit_versions, então todos que editam o mesmo
 *    material veem os mesmos comentários.
 *  - body (text, obrigatório): texto do comentário (pt-BR).
 *  - parent (relation studio_edit_comments, opcional): comentário respondido.
 *  - author_name (text): nome para exibir no feed (fallback: expand user).
 *  - company (text, opcional): mesma lógica de company da 0103.
 *  - user (relation users, OBRIGATÓRIO — padrão das migrations 00090/00092).
 *
 * Regras (padrão 0100/0101/0103): cada usuário lista/cria/apaga os próprios;
 * membros da mesma company também leem (colaboração).
 *
 * Toda lógica é inline no callback (limitação do JSVM do PocketBase).
 */
migrate(
  (app) => {
    const collection = new Collection({
      name: 'studio_edit_comments',
      type: 'base',
      listRule:
        '@request.auth.id != "" && (user = @request.auth.id || (@request.auth.record.company != "" && company = @request.auth.record.company))',
      viewRule:
        '@request.auth.id != "" && (user = @request.auth.id || (@request.auth.record.company != "" && company = @request.auth.record.company))',
      createRule: '@request.auth.id != "" && @request.body.user = @request.auth.id',
      updateRule: '@request.auth.id != "" && user = @request.auth.id',
      deleteRule: '@request.auth.id != "" && user = @request.auth.id',
      fields: [
        { name: 'target_key', type: 'text', required: true, max: 500 },
        { name: 'body', type: 'text', required: true, min: 1, max: 2000 },
        { name: 'author_name', type: 'text', required: false, max: 160 },
        { name: 'company', type: 'text', required: false, max: 255 },
      ],
      indexes: [
        'CREATE INDEX idx_studio_edit_comments_target ON studio_edit_comments (target_key)',
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

    // 1º save: a coleção precisa existir para o campo "parent" referenciar
    // a si mesma (o id só é gerado ao salvar — 'sql: no rows in result set'
    // se resolver antes).
    app.save(collection)

    // 2º passo: adiciona a autorreferência de respostas (comentário→comentário).
    const saved = app.findCollectionByNameOrId('studio_edit_comments')
    if (!saved.fields.getByName('parent')) {
      saved.fields.add(
        new RelationField({
          name: 'parent',
          required: false,
          collectionId: saved.id,
          maxSelect: 1,
          cascadeDelete: true,
        }),
      )
      app.save(saved)
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('studio_edit_comments')
      app.delete(collection)
    } catch (_) {}
  },
)
