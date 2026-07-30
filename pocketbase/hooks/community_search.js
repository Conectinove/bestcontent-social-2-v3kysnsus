routerAdd(
  'POST',
  '/backend/v1/community/search',
  (e) => {
    const body = e.requestInfo().body || {}
    const query = (body.query || '').trim()
    if (!query) return e.badRequestError('A busca é obrigatória')

    try {
      const embedRes = $ai.embed({ input: query })
      const queryVector = embedRes.data[0].embedding
      const results = $vectors.search(e, 'community_topics', {
        field: 'vector',
        query: queryVector,
        k: body.k || 20,
        expand: ['user', 'category'],
      })
      return e.json(200, results)
    } catch (err) {
      return e.json(500, { error: err.message || 'Erro na busca semântica' })
    }
  },
  $apis.requireAuth(),
)
