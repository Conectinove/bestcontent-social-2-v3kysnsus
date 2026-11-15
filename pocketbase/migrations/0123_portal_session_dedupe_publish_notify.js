/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0123 — dedupe de plays/visitas por sessão + notificação de
 * publicação agendada:
 *  1. portal_video_plays.session_id (text): sessão do visitante no portal —
 *     navegar entre páginas e voltar não cria play novo (nova sessão soma).
 *  2. portal_visits.session_id (text): 1 visita por sessão por portal
 *     (upsert no hook em vez de record novo por carregamento).
 *  3. portal_pages.published_notified (bool): flag do cron que notifica
 *     quando o publish_at de uma página agendada chega.
 *  4. notifications.type ganha o valor 'page_published'.
 * Padrão idempotente da casa (getByName check — migrations 00090/0111/0122).
 */
migrate(
  (app) => {
    try {
      const playsCol = app.findCollectionByNameOrId('portal_video_plays')
      if (!playsCol.fields.getByName('session_id')) {
        playsCol.fields.add(new TextField({ name: 'session_id' }))
      }
      app.save(playsCol)
    } catch (e) {
      console.log('0123: erro ao expandir portal_video_plays: ' + e)
    }

    try {
      const visitsCol = app.findCollectionByNameOrId('portal_visits')
      if (!visitsCol.fields.getByName('session_id')) {
        visitsCol.fields.add(new TextField({ name: 'session_id' }))
      }
      app.save(visitsCol)
    } catch (e) {
      console.log('0123: erro ao expandir portal_visits: ' + e)
    }

    try {
      const pagesCol = app.findCollectionByNameOrId('portal_pages')
      if (!pagesCol.fields.getByName('published_notified')) {
        pagesCol.fields.add(new BoolField({ name: 'published_notified' }))
      }
      app.save(pagesCol)
    } catch (e) {
      console.log('0123: erro ao expandir portal_pages: ' + e)
    }

    try {
      const notifCol = app.findCollectionByNameOrId('notifications')
      const typeField = notifCol.fields.getByName('type')
      if (typeField && typeField.values.indexOf('page_published') === -1) {
        typeField.values.push('page_published')
        app.save(notifCol)
      }
    } catch (e) {
      console.log('0123: erro ao estender notifications.type: ' + e)
    }
  },
  (app) => {
    try {
      const notifCol = app.findCollectionByNameOrId('notifications')
      const typeField = notifCol.fields.getByName('type')
      if (typeField) {
        const idx = typeField.values.indexOf('page_published')
        if (idx !== -1) {
          typeField.values.splice(idx, 1)
          app.save(notifCol)
        }
      }
    } catch (_) {}
    try {
      const pagesCol = app.findCollectionByNameOrId('portal_pages')
      if (pagesCol.fields.getByName('published_notified')) {
        pagesCol.fields.removeByName('published_notified')
        app.save(pagesCol)
      }
    } catch (_) {}
    try {
      const visitsCol = app.findCollectionByNameOrId('portal_visits')
      if (visitsCol.fields.getByName('session_id')) {
        visitsCol.fields.removeByName('session_id')
        app.save(visitsCol)
      }
    } catch (_) {}
    try {
      const playsCol = app.findCollectionByNameOrId('portal_video_plays')
      if (playsCol.fields.getByName('session_id')) {
        playsCol.fields.removeByName('session_id')
        app.save(playsCol)
      }
    } catch (_) {}
  },
)
