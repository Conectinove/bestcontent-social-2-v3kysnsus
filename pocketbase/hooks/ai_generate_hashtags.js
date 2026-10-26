routerAdd(
  'POST',
  '/backend/v1/ai/hashtags',
  (e) => {
    const body = e.requestInfo().body || {}
    const content = (body.content || '').trim()
    const platform = (body.platform || 'Instagram').trim()
    const objective = (body.objective || '').trim()
    const category = (body.category || '').trim()
    if (!content) return e.badRequestError('content is required')

    const platLower = platform.toLowerCase()
    let targetCount = '8-12'
    let styleGuideline =
      'Instagram: Equilibre 8 a 12 hashtags entre nicho, termos locais/específicos da área e comunidade. Evite hashtags banidas ou genéricas demais.'

    if (platLower.includes('tiktok')) {
      targetCount = '4-6'
      styleGuideline =
        'TikTok: Gere de 4 a 6 hashtags focadas em viralidade, tendências da plataforma (#fyp, #foryou quando contextual) e palavras de busca dinâmica de vídeos curtos.'
    } else if (platLower.includes('linkedin')) {
      targetCount = '3-5'
      styleGuideline =
        'LinkedIn: Gere de 3 a 5 hashtags estritamente profissionais, corporativas e de liderança intelectual. Evite informalidade excessiva.'
    } else if (platLower.includes('twitter') || platLower === 'x') {
      targetCount = '2-4'
      styleGuideline =
        'X (antigo Twitter): Gere de 2 a 4 hashtags concisas, diretas e com foco em assuntos do momento ou termos curtos para economizar caracteres.'
    } else if (platLower.includes('youtube')) {
      targetCount = '3-5'
      styleGuideline =
        'YouTube Shorts/Vídeo: Gere de 3 a 5 hashtags com foco em palavras-chave de busca (SEO) que as pessoas digitam na barra de pesquisa do YouTube.'
    } else if (platLower.includes('facebook')) {
      targetCount = '2-4'
      styleGuideline =
        'Facebook: Gere de 2 a 4 hashtags amplas e acessíveis voltadas para grupos e comunidades.'
    }

    try {
      const reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é um estrategista de SEO e distribuição para redes sociais. ' +
              'Gere exatamente ' +
              targetCount +
              ' hashtags altamente relevantes e hipercontextuais em português (ou termos técnicos amplamente aceitos). ' +
              styleGuideline +
              ' ' +
              'Retorne APENAS as hashtags separadas por espaço, começando com #, sem introduções ou explicações.',
          },
          {
            role: 'user',
            content:
              'Rede Social: ' +
              platform +
              (objective ? ' | Objetivo: ' + objective : '') +
              (category ? ' | Categoria: ' + category : '') +
              '\nConteúdo/Tema: ' +
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
      return e.json(200, { hashtags: hashtags, platform: platform, count: hashtags.length })
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        return e.json(503, { error: 'IA temporariamente indisponivel' })
      if (err instanceof SkipAiError) return e.json(502, { error: 'Falha ao gerar hashtags' })
      throw err
    }
  },
  $apis.requireAuth(),
)
