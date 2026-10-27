migrate(
  (app) => {
    // 1. Atualizar a coleção post_metrics para aceitar campos específicos se necessário
    try {
      const pmCol = app.findCollectionByNameOrId('post_metrics')
      if (pmCol) {
        if (!pmCol.fields.getByName('stories_visualizacoes')) {
          pmCol.fields.add(new NumberField({ name: 'stories_visualizacoes' }))
        }
        if (!pmCol.fields.getByName('reels_reproducoes')) {
          pmCol.fields.add(new NumberField({ name: 'reels_reproducoes' }))
        }
        app.save(pmCol)
      }
    } catch (_) {}

    // 2. Seeding calibrado inicial para instagram orgânico em post_metrics se estiver vazio
    try {
      const existing = app.findRecordsByFilter('post_metrics', 'rede = "instagram"', '-data', 1, 0)
      if (!existing || existing.length === 0) {
        const posts = app.findRecordsByFilter('posts', 'id != ""', '-created', 1, 0)
        const postId = posts && posts.length > 0 ? posts[0].id : null

        const collection = app.findCollectionByNameOrId('post_metrics')
        const record = new Record(collection)
        if (postId) record.set('post', postId)
        record.set('rede', 'instagram')
        record.set('alcance', 28600)
        record.set('impressoes', 41200)
        record.set('engajamento', 2340)
        record.set('curtidas', 1780)
        record.set('comentarios', 285)
        record.set('compartilhamentos', 340)
        record.set('cliques', 620)
        record.set('salvamentos', 890)
        record.set('taxa_engajamento', 5.68)
        record.set('data', new Date().toISOString())
        app.save(record)
      }
    } catch (_) {}
  },
  (app) => {
    // Reversão limpa
  },
)
