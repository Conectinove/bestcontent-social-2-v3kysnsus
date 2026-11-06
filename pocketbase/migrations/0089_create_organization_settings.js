migrate(
  (app) => {
    let col = null
    try {
      col = app.findCollectionByNameOrId('organization_settings')
    } catch (_) {
      // não existe
    }

    if (col) return

    let brandsColId = ''
    try {
      brandsColId = app.findCollectionByNameOrId('brands').id
    } catch (_) {
      // ignora
    }

    col = new Collection({
      name: 'organization_settings',
      type: 'base',
      fields: [
        {
          name: 'user',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
        },
        {
          name: 'brand',
          type: 'relation',
          collectionId: brandsColId,
          cascadeDelete: false,
        },
        {
          name: 'custom_webhook_url',
          type: 'text',
        },
        {
          name: 'custom_webhook_secret',
          type: 'text',
        },
        {
          name: 'webhook_events',
          type: 'json',
        },
        {
          name: 'google_ads_id',
          type: 'text',
        },
        {
          name: 'meta_pixel_id',
          type: 'text',
        },
        {
          name: 'tiktok_pixel_id',
          type: 'text',
        },
        {
          name: 'linkedin_partner_id',
          type: 'text',
        },
        {
          name: 'pinterest_tag_id',
          type: 'text',
        },
        {
          name: 'extra_settings',
          type: 'json',
        },
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    })

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('organization_settings')
      if (col) app.delete(col)
    } catch (_) {}
  },
)
