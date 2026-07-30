routerAdd(
  'POST',
  '/backend/v1/ai/improve',
  (e) => {
    const body = e.requestInfo().body || {}
    const content = (body.content || '').trim()
    if (!content) return e.badRequestError('content is required')
    try {
      const reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Voce e um editor de texto especializado em conteudo para redes sociais. Melhore o texto para clareza e engajamento, mantendo o significado original. Retorne APENAS o texto melhorado.',
          },
          { role: 'user', content: 'Melhore este texto: ' + content },
        ],
      })
      return e.json(200, { content: reply.choices[0].message.content })
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        return e.json(503, { error: 'IA temporariamente indisponivel' })
      if (err instanceof SkipAiError) return e.json(502, { error: 'Falha ao melhorar texto' })
      throw err
    }
  },
  $apis.requireAuth(),
)
