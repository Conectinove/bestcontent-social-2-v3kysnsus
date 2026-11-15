/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0118 — Portal por marca, rodada 2 (pedidos do usuário):
 *  1. Cores extras do portal: bg_color, text_color, button_color em brand_portals
 *     (o accent_color por marca já vive em brands.accent_color, migration 0115).
 *  2. Logo própria por marca no portal: file field `logo_file`.
 *  3. Google Analytics: text field `ga_measurement_id` (ex: G-XXXXXXXXXX).
 *
 * Padrão idempotente da casa (getByName check) sobre a coleção existente
 * brand_portals (migration 0114) — nunca recria a coleção.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('brand_portals')

    if (!col.fields.getByName('bg_color')) {
      col.fields.add(new TextField({ name: 'bg_color' }))
    }
    if (!col.fields.getByName('text_color')) {
      col.fields.add(new TextField({ name: 'text_color' }))
    }
    if (!col.fields.getByName('button_color')) {
      col.fields.add(new TextField({ name: 'button_color' }))
    }
    if (!col.fields.getByName('logo_file')) {
      col.fields.add(
        new FileField({
          name: 'logo_file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
        }),
      )
    }
    if (!col.fields.getByName('ga_measurement_id')) {
      col.fields.add(new TextField({ name: 'ga_measurement_id', max: 40 }))
    }

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('brand_portals')
      for (const name of ['bg_color', 'text_color', 'button_color', 'ga_measurement_id']) {
        if (col.fields.getByName(name)) col.fields.removeByName(name)
      }
      if (col.fields.getByName('logo_file')) col.fields.removeByName('logo_file')
      app.save(col)
    } catch (_) {}
  },
)
