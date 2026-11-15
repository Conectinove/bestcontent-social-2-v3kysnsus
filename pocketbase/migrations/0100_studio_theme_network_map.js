/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0100 — Mapa compartilhado rede→tema (studio_theme_network_map).
 *
 * Um record por equipe (company): guarda qual TEMA COMPLETO cada rede usa
 * quando um post dela é aberto. Todos os membros da mesma company leem o
 * mesmo mapa — o tema/rede escolhido por um aparece para a equipe inteira.
 *
 * Campos:
 *  - user (relation users, OBRIGATÓRIO — padrão das migrations 00090/00092:
 *    todo record da coleção exige user, regra da casa).
 *  - company (text): chave do mapa compartilhado da equipe.
 *  - theme_map (json): { "instagram": { "themeId": "...", "accent": "..." }, ... }
 *
 * Regras (padrão 0097/0099):
 *  - list/view: dono OU qualquer membro da mesma company;
 *  - create: dono (user = auth);
 *  - update/delete: dono OU admin/gestor (ou plan max/enterprise) da company.
 *
 * Toda lógica é inline no callback (limitação do JSVM do PocketBase).
 */
migrate(
  (app) => {
    const collection = new Collection({
      name: 'studio_theme_network_map',
      type: 'base',
      listRule:
        '@request.auth.id != "" && (user = @request.auth.id || (@request.auth.record.company != "" && @request.auth.record.company = company))',
      viewRule:
        '@request.auth.id != "" && (user = @request.auth.id || (@request.auth.record.company != "" && @request.auth.record.company = company))',
      createRule: '@request.auth.id != "" && @request.body.user = @request.auth.id',
      updateRule:
        '@request.auth.id != "" && (user = @request.auth.id || (@request.auth.record.company != "" && @request.auth.record.company = company && (@request.auth.record.role = "admin" || @request.auth.record.role = "gestor" || @request.auth.record.plan = "max" || @request.auth.record.plan = "enterprise")))',
      deleteRule:
        '@request.auth.id != "" && (user = @request.auth.id || (@request.auth.record.company != "" && @request.auth.record.company = company && (@request.auth.record.role = "admin" || @request.auth.record.role = "gestor" || @request.auth.record.plan = "max" || @request.auth.record.plan = "enterprise")))',
      fields: [
        { name: 'company', type: 'text', required: false, max: 255 },
        { name: 'theme_map', type: 'json', required: false, maxSize: 2000000 },
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
      const collection = app.findCollectionByNameOrId('studio_theme_network_map')
      app.delete(collection)
    } catch (_) {}
  },
)
