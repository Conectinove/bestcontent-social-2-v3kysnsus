/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0099 — Gestão de temas da equipe + tema padrão da organização.
 *
 * 1) users.role (select opcional: member | admin | gestor):
 *    admin/gestor da mesma company podem editar e excluir temas compartilhados
 *    de outros membros. Fallback: plan "max" ou "enterprise" também é tratado
 *    como admin (a coleção users não tinha campo de role).
 *
 * 2) studio_themes.is_org_default (bool, opcional): marca o tema padrão da
 *    organização — só admins podem definir (a regra de update já exige admin
 *    para registros de terceiros).
 *
 * 3) Regras update/delete de studio_themes relaxadas: dono OU admin/gestor
 *    (ou plan max/enterprise) da MESMA company, para temas não-personais.
 *
 * Toda lógica é inline no callback (limitação do JSVM do PocketBase).
 */
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          required: false,
          maxSelect: 1,
          values: ['member', 'admin', 'gestor'],
        }),
      )
    }
    app.save(users)

    const themes = app.findCollectionByNameOrId('studio_themes')

    if (!themes.fields.getByName('is_org_default')) {
      themes.fields.add(new BoolField({ name: 'is_org_default', required: false }))
    }

    const adminRule =
      '@request.auth.id != "" && (user = @request.auth.id || (@request.auth.record.company != "" && @request.auth.record.company = user.company && scope != "personal" && (@request.auth.record.role = "admin" || @request.auth.record.role = "gestor" || @request.auth.record.plan = "max" || @request.auth.record.plan = "enterprise")))'
    themes.updateRule = adminRule
    themes.deleteRule = adminRule

    app.save(themes)
  },
  (app) => {
    const themes = app.findCollectionByNameOrId('studio_themes')
    themes.updateRule = '@request.auth.id != "" && user = @request.auth.id'
    themes.deleteRule = '@request.auth.id != "" && user = @request.auth.id'
    try {
      themes.fields.removeByName('is_org_default')
    } catch (_) {}
    app.save(themes)
  },
)
