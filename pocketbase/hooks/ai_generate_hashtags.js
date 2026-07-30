routerAdd(
  'POST',
  '/backend/v1/ai/hashtags',
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
              'Voce e um especialista em hashtags para redes sociais. Gere 8-12 hashtags relevantes em portugues e ingles. Retorne APENAS as hashtags separadas por espaco.',
          },
          { role: 'user', content: 'Gere hashtags para: ' + content },
        ],
      })
      var text = reply.choices[0].message.content
      var hashtags =
        text.match(/#\w+/g) ||
        text
          .split(/\s+/)
          .filter(function (w) {
            return w.length > 0
          })
          .map(function (w) {
            return w.charAt(0) === '#' ? w : '#' + w
          })
      return e.json(200, { hashtags: hashtags })
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        return e.json(503, { error: 'IA temporariamente indisponivel' })
      if (err instanceof SkipAiError) return e.json(502, { error: 'Falha ao gerar hashtags' })
      throw err
    }
  },
  $apis.requireAuth(),
)
