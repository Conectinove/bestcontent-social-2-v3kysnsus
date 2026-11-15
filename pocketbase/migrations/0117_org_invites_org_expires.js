/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0117 — completa a org_invites criada na 0116 (imutável):
 *  - `org` text: nome/identificador da organização do convidador;
 *  - `expires` date: validade do convite (default +30 dias, setado no hook).
 * Idempotente (getByName check) — padrão da casa.
 */
migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('org_invites')
      if (!col.fields.getByName('org')) {
        col.fields.add(new TextField({ name: 'org' }))
      }
      if (!col.fields.getByName('expires')) {
        col.fields.add(new DateField({ name: 'expires' }))
      }
      app.save(col)
    } catch (e) {
      console.log('0117: erro ao expandir org_invites: ' + e)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('org_invites')
      for (const name of ['expires', 'org']) {
        try {
          col.fields.removeByName(name)
        } catch (_) {}
      }
      app.save(col)
    } catch (_) {}
  },
)
