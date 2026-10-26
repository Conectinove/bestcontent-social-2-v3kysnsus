migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('posts')

    // 1. tags (json ou text com lista/array)
    if (!col.fields.getByName('tags')) {
      col.fields.add(
        new JSONField({
          name: 'tags',
          required: false,
        }),
      )
    }

    // 2. target_networks (json ou select multi-redes de destino)
    if (!col.fields.getByName('target_networks')) {
      col.fields.add(
        new JSONField({
          name: 'target_networks',
          required: false,
        }),
      )
    }

    // 3. width explícito
    if (!col.fields.getByName('width')) {
      col.fields.add(
        new NumberField({
          name: 'width',
          required: false,
        }),
      )
    }

    // 4. height explícito
    if (!col.fields.getByName('height')) {
      col.fields.add(
        new NumberField({
          name: 'height',
          required: false,
        }),
      )
    }

    // 5. is_favorite (bool) - NUNCA required
    if (!col.fields.getByName('is_favorite')) {
      col.fields.add(
        new BoolField({
          name: 'is_favorite',
          required: false,
        }),
      )
    }

    // 6. is_archived (bool) - NUNCA required
    if (!col.fields.getByName('is_archived')) {
      col.fields.add(
        new BoolField({
          name: 'is_archived',
          required: false,
        }),
      )
    }

    // 7. revision_count (number)
    if (!col.fields.getByName('revision_count')) {
      col.fields.add(
        new NumberField({
          name: 'revision_count',
          required: false,
        }),
      )
    }

    // 8. approval_level (text ou number)
    if (!col.fields.getByName('approval_level')) {
      col.fields.add(
        new TextField({
          name: 'approval_level',
          required: false,
        }),
      )
    }

    app.save(col)

    // Índices auxiliares
    col.addIndex('idx_posts_favorite', false, 'is_favorite', '')
    col.addIndex('idx_posts_archived', false, 'is_archived', '')
    app.save(col)

    // 9. Backfill idempotente nos registros existentes
    const existingPosts = app.findRecordsByFilter('posts', '1=1', '-created', 500, 0)
    for (let i = 0; i < existingPosts.length; i++) {
      const post = existingPosts[i]
      let needsSave = false

      // Tags backfill
      const currentTags = post.getString('tags')
      if (!currentTags || currentTags === 'null' || currentTags === '') {
        const plat = (post.getString('platform') || 'Geral').toLowerCase()
        const defaultTags = [plat, 'destaque', 'social2']
        post.set('tags', JSON.stringify(defaultTags))
        needsSave = true
      }

      // Target networks backfill
      const currentNets = post.getString('target_networks')
      if (!currentNets || currentNets === 'null' || currentNets === '') {
        const plat = (post.getString('platform') || 'Instagram').toLowerCase()
        post.set('target_networks', JSON.stringify([plat]))
        needsSave = true
      }

      // Width & height backfill baseados na proporção ou tipo
      if (!post.getInt('width') || post.getInt('width') === 0) {
        const isVid = post.getInt('duration') > 0
        if (isVid) {
          post.set('width', 1080)
          post.set('height', 1920)
        } else {
          post.set('width', 1080)
          post.set('height', 1350)
        }
        needsSave = true
      }

      // revision_count inicial
      if (post.getInt('revision_count') === undefined || post.getInt('revision_count') === null) {
        post.set('revision_count', 1)
        needsSave = true
      }

      // approval_level
      if (!post.getString('approval_level')) {
        const st = post.getString('status')
        post.set(
          'approval_level',
          st === 'approved' ? 'Nível 2 (Aprovado)' : 'Nível 1 (Em Revisão)',
        )
        needsSave = true
      }

      if (needsSave) {
        app.save(post)
      }
    }
  },
  (app) => {
    // Revert opcional
    try {
      const col = app.findCollectionByNameOrId('posts')
      col.removeIndex('idx_posts_favorite')
      col.removeIndex('idx_posts_archived')
      app.save(col)
    } catch (_) {}
  },
)
