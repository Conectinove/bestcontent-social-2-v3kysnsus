migrate(
  (app) => {
    // 1. Atualizar a coleção post_metrics para aceitar mais métricas orgânicas e novas redes se necessário
    try {
      const pmCol = app.findCollectionByNameOrId('post_metrics')
      if (pmCol) {
        let dirty = false
        // Adicionar campos opcionais saves/compartilhamentos/retencao caso faltem
        const existingFields = pmCol.fields.map((f) => f.name)
        if (!existingFields.includes('saves')) {
          pmCol.fields.push(new Field({ name: 'saves', type: 'number', required: false }))
          dirty = true
        }
        if (!existingFields.includes('video_views')) {
          pmCol.fields.push(new Field({ name: 'video_views', type: 'number', required: false }))
          dirty = true
        }
        if (!existingFields.includes('is_official')) {
          pmCol.fields.push(new Field({ name: 'is_official', type: 'bool', required: false }))
          dirty = true
        }
        if (dirty) {
          app.save(pmCol)
        }
      }
    } catch (_) {}

    // 2. Seeding calibrado inicial para tiktok orgânico se post_metrics estiver vazio para tiktok
    try {
      const existing = app.findRecordsByFilter('post_metrics', 'rede = "tiktok"', '-data', 1, 0)
      if (!existing || existing.length === 0) {
        const posts = app.findRecordsByFilter('posts', 'id != ""', '-created', 1, 0)
        const postId = posts && posts.length > 0 ? posts[0].id : null

        const collection = app.findCollectionByNameOrId('post_metrics')
        const record = new Record(collection)
        if (postId) record.set('post', postId)
        record.set('rede', 'tiktok')
        record.set('alcance', 34200)
        record.set('impressoes', 48900)
        record.set('engajamento', 3150)
        record.set('curtidas', 2410)
        record.set('comentarios', 320)
        record.set('compartilhamentos', 420)
        record.set('cliques', 890)
        record.set('salvamentos', 680)
        record.set('taxa_engajamento', 6.4)
        record.set('data', new Date().toISOString())
        app.save(record)
      }
    } catch (_) {}
  },
  (app) => {
    // Reversão
  },
)
