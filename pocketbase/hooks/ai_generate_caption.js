routerAdd(
  'POST',
  '/backend/v1/ai/caption',
  (e) => {
    const body = e.requestInfo().body || {}
    const content = (body.content || '').trim()
    const platform = body.platform || 'Instagram'
    if (!content) return e.badRequestError('content is required')
    try {
      const reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Voce e um redator de legendas para redes sociais. Escreva legendas envolventes em portugues do Brasil. Retorne APENAS o texto da legenda, sem explicacoes.',
          },
          { role: 'user', content: 'Escreva uma legenda para ' + platform + ' sobre: ' + content },
        ],
      })
      return e.json(200, { caption: reply.choices[0].message.content })
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        return e.json(503, { error: 'IA temporariamente indisponivel' })
      if (err instanceof SkipAiError) return e.json(502, { error: 'Falha ao gerar legenda' })
      throw err
    }
  },
  $apis.requireAuth(),
)
