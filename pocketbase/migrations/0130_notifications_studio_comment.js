/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0130 — Notificação de novos comentários de material do Studio.
 * Adiciona o valor 'studio_comment' ao select notifications.type (padrão
 * idempotente da migration 0123 — getByName check antes de push).
 */
migrate(
  (app) => {
    try {
      const notifCol = app.findCollectionByNameOrId('notifications')
      const typeField = notifCol.fields.getByName('type')
      if (typeField && typeField.values.indexOf('studio_comment') === -1) {
        typeField.values.push('studio_comment')
        app.save(notifCol)
      }
    } catch (e) {
      console.log('0130: erro ao estender notifications.type: ' + e)
    }
  },
  (app) => {
    try {
      const notifCol = app.findCollectionByNameOrId('notifications')
      const typeField = notifCol.fields.getByName('type')
      if (typeField) {
        const idx = typeField.values.indexOf('studio_comment')
        if (idx !== -1) {
          typeField.values.splice(idx, 1)
          app.save(notifCol)
        }
      }
    } catch (_) {}
  },
)
