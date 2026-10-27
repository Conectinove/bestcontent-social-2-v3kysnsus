/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('performance_reports')
      if (!collection) return

      let changed = false

      // Adiciona campo report_type se não existir
      if (!collection.fields.getByName('report_type')) {
        collection.fields.addAt(
          4,
          new TextField({
            name: 'report_type',
            required: false,
          }),
        )
        changed = true
      }

      // Adiciona campo engagement_data_json se não existir
      if (!collection.fields.getByName('engagement_data_json')) {
        collection.fields.add(
          new JSONField({
            name: 'engagement_data_json',
            required: false,
          }),
        )
        changed = true
      }

      if (changed) {
        app.save(collection)
      }
    } catch (err) {
      console.log('[Migration 0066] Erro ao atualizar performance_reports:', err)
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('performance_reports')
      if (!collection) return

      let changed = false
      const f1 = collection.fields.getByName('report_type')
      if (f1) {
        collection.fields.remove(f1)
        changed = true
      }

      const f2 = collection.fields.getByName('engagement_data_json')
      if (f2) {
        collection.fields.remove(f2)
        changed = true
      }

      if (changed) {
        app.save(collection)
      }
    } catch (_) {}
  },
)
