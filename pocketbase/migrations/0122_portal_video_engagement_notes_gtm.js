/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0122 — engajamento de vídeo + anotações em versões + GTM:
 *  1. portal_video_plays: progress (int 0..100, % concluído) e watched_seconds
 *     (int, tempo assistido) — engajamento além do play simples.
 *  2. portal_page_versions.annotations (json): anotações curtas ligadas à
 *     versão, exibidas na comparação lado a lado.
 *  3. brand_portals.gtm_container_id (text): ID do contêiner GTM (GTM-XXXXXX)
 *     injetado na página pública, no mesmo padrão do ga_measurement_id.
 * Padrão idempotente da casa (getByName check / findCollectionByNameOrId).
 */
migrate(
  (app) => {
    // ---- 1. engajamento em portal_video_plays ------------------------------
    try {
      const playsCol = app.findCollectionByNameOrId('portal_video_plays')
      if (!playsCol.fields.getByName('progress')) {
        playsCol.fields.add(new TextField({ name: 'progress' }))
      }
      if (!playsCol.fields.getByName('watched_seconds')) {
        playsCol.fields.add(new TextField({ name: 'watched_seconds' }))
      }
      app.save(playsCol)
    } catch (e) {
      console.log('0122: erro ao expandir portal_video_plays: ' + e)
    }

    // ---- 2. anotações em portal_page_versions ------------------------------
    try {
      const versionsCol = app.findCollectionByNameOrId('portal_page_versions')
      if (!versionsCol.fields.getByName('annotations')) {
        versionsCol.fields.add(new TextField({ name: 'annotations' }))
      }
      app.save(versionsCol)
    } catch (e) {
      console.log('0122: erro ao expandir portal_page_versions: ' + e)
    }

    // ---- 3. GTM em brand_portals -------------------------------------------
    try {
      const portalsCol = app.findCollectionByNameOrId('brand_portals')
      if (!portalsCol.fields.getByName('gtm_container_id')) {
        portalsCol.fields.add(new TextField({ name: 'gtm_container_id' }))
      }
      app.save(portalsCol)
    } catch (e) {
      console.log('0122: erro ao expandir brand_portals: ' + e)
    }
  },
  (app) => {
    try {
      const portalsCol = app.findCollectionByNameOrId('brand_portals')
      if (portalsCol.fields.getByName('gtm_container_id')) {
        portalsCol.fields.removeByName('gtm_container_id')
        app.save(portalsCol)
      }
    } catch (_) {}
    try {
      const versionsCol = app.findCollectionByNameOrId('portal_page_versions')
      if (versionsCol.fields.getByName('annotations')) {
        versionsCol.fields.removeByName('annotations')
        app.save(versionsCol)
      }
    } catch (_) {}
    try {
      const playsCol = app.findCollectionByNameOrId('portal_video_plays')
      if (playsCol.fields.getByName('progress')) {
        playsCol.fields.removeByName('progress')
      }
      if (playsCol.fields.getByName('watched_seconds')) {
        playsCol.fields.removeByName('watched_seconds')
      }
      app.save(playsCol)
    } catch (_) {}
  },
)
