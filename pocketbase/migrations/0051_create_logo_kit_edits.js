migrate(
  (app) => {
    // 1. Criar collection logo_kit_edits se não existir
    try {
      app.findCollectionByNameOrId('logo_kit_edits')
    } catch (_) {
      const collection = new Collection({
        name: 'logo_kit_edits',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'brand',
            type: 'relation',
            required: false,
            collectionId: app.findCollectionByNameOrId('brands').id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'variation_kind',
            type: 'select',
            required: true,
            values: ['primary', 'light', 'mono-dark', 'mark'],
            maxSelect: 1,
          },
          { name: 'primary_color', type: 'text', required: false },
          { name: 'secondary_color', type: 'text', required: false },
          { name: 'mono_color', type: 'text', required: false },
          { name: 'symbol_size', type: 'number', required: false },
          { name: 'logo_position', type: 'text', required: false },
          { name: 'alt_text', type: 'text', required: false },
          { name: 'file_name_custom', type: 'text', required: false },
          { name: 'show_safe_area', type: 'bool', required: false },
          { name: 'draft_watermark', type: 'bool', required: false },
          { name: 'transparent_bg', type: 'bool', required: false },
          { name: 'config_json', type: 'json', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_logo_kit_user_var ON logo_kit_edits (user, variation_kind)'],
      })
      app.save(collection)
    }

    // 2. Criar collection logo_kit_checklists para salvar estados do checklist se não existir
    try {
      app.findCollectionByNameOrId('logo_kit_checklists')
    } catch (_) {
      const checklistCol = new Collection({
        name: 'logo_kit_checklists',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'project_name', type: 'text', required: false },
          { name: 'checked_items', type: 'json', required: false },
          { name: 'metadata', type: 'json', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_logo_kit_checklist_user ON logo_kit_checklists (user)'],
      })
      app.save(checklistCol)
    }
  },
  (app) => {
    try {
      const c1 = app.findCollectionByNameOrId('logo_kit_edits')
      app.delete(c1)
    } catch (_) {}
    try {
      const c2 = app.findCollectionByNameOrId('logo_kit_checklists')
      app.delete(c2)
    } catch (_) {}
  },
)
