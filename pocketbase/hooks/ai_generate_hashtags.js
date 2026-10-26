routerAdd(
  'POST',
  '/backend/v1/ai/hashtags',
  (e) => {
    const body = e.requestInfo().body || {}
    const content = (body.content || '').trim()
    const platform = body.platform || 'Instagram'
    const objective = (body.objective || '').trim()
    const category = (body.category || '').trim()
    if (!content) return e.badRequestError('content is required')

    let targetCount = '8-12'
    if (platform.toLowerCase() === 'linkedin') targetCount = '3-5'
    else if (platform.toLowerCase() === 'tiktok') targetCount = '4-6'
    else if (platform.toLowerCase().includes('twitter') || platform.toLowerCase() === 'x')
      targetCount = '2-4'
    else if (platform.toLowerCase() === 'youtube') targetCount = '5-8'

    try {
      const reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é um estrategista de SEO e distribuição para redes sociais. Gere exatamente ' +
              targetCount +
              ' hashtags altamente relevantes e hipercontextuais em português (e termos globais se aplicável). ' +
              'Equilibre hashtags de nicho, tendências e comunidade. ' +
              'Retorne APENAS as hashtags separadas por espaço, começando com #, sem explicações.',
          },
          {
            role: 'user',
            content:
              'Plataforma: ' +
              platform +
              (objective ? ' | Objetivo: ' + objective : '') +
              (category ? ' | Categoria: ' + category : '') +
              '\nConteúdo: ' +
              content,
          },
        ],
      })
      var text = reply.choices[0].message.content
      var hashtags =
        text.match(/#[\w\u00C0-\u00FF]+/g) ||
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
