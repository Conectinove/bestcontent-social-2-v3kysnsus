migrate(
  (app) => {
    try {
      app.findCollectionByNameOrId('brand_kit_materials')
    } catch (_) {
      const collection = new Collection({
        name: 'brand_kit_materials',
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
          { name: 'title', type: 'text', required: true },
          { name: 'subtitle', type: 'text', required: false },
          { name: 'category', type: 'text', required: false },
          { name: 'kind_slug', type: 'text', required: false },
          { name: 'file_name_custom', type: 'text', required: false },
          { name: 'primary_color', type: 'text', required: false },
          { name: 'secondary_color', type: 'text', required: false },
          { name: 'mono_color', type: 'text', required: false },
          { name: 'symbol_size', type: 'number', required: false },
          { name: 'logo_position', type: 'text', required: false },
          { name: 'alt_text', type: 'text', required: false },
          { name: 'custom_text', type: 'text', required: false },
          { name: 'tagline', type: 'text', required: false },
          { name: 'layout_type', type: 'text', required: false },
          { name: 'show_safe_area', type: 'bool', required: false },
          { name: 'draft_watermark', type: 'bool', required: false },
          { name: 'transparent_bg', type: 'bool', required: false },
          { name: 'svg_raw', type: 'text', required: false },
          { name: 'config_json', type: 'json', required: false },
          {
            name: 'uploaded_file',
            type: 'file',
            required: false,
            maxSelect: 1,
            maxSize: 10485760,
            mimeTypes: ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'],
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_brand_materials_user ON brand_kit_materials (user)'],
      })
      app.save(collection)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('brand_kit_materials')
      app.delete(col)
    } catch (_) {}
  },
)
