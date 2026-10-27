migrate(
  (app) => {
    // 1. Atualizar a coleção post_metrics para aceitar mais campos de métricas do LinkedIn orgânico se necessário
    try {
      const pmCol = app.findCollectionByNameOrId('post_metrics')
      if (pmCol) {
        let dirty = false
        const existingFields = pmCol.fields.map((f) => f.name)
        if (!existingFields.includes('reacoes')) {
          pmCol.fields.push(new Field({ name: 'reacoes', type: 'number', required: false }))
          dirty = true
        }
        if (!existingFields.includes('novos_seguidores')) {
          pmCol.fields.push(
            new Field({ name: 'novos_seguidores', type: 'number', required: false }),
          )
          dirty = true
        }
        if (dirty) {
          app.save(pmCol)
        }
      }
    } catch (_) {}

    // 2. Seeding calibrado inicial para linkedin orgânico se post_metrics estiver vazio para linkedin
    try {
      const existing = app.findRecordsByFilter('post_metrics', 'rede = "linkedin"', '-data', 1, 0)
      if (!existing || existing.length === 0) {
        const posts = app.findRecordsByFilter('posts', 'id != ""', '-created', 1, 0)
        const postId = posts && posts.length > 0 ? posts[0].id : null

        const collection = app.findCollectionByNameOrId('post_metrics')
        const record = new Record(collection)
        if (postId) record.set('post', postId)
        record.set('rede', 'linkedin')
        record.set('alcance', 14800)
        record.set('impressoes', 21400)
        record.set('engajamento', 1150)
        record.set('curtidas', 840)
        record.set('comentarios', 190)
        record.set('compartilhamentos', 120)
        record.set('cliques', 460)
        record.set('salvamentos', 310)
        record.set('taxa_engajamento', 5.37)
        record.set('data', new Date().toISOString())
        app.save(record)
      }
    } catch (_) {}
  },
  (app) => {
    // Reversão limpa
  },
)
