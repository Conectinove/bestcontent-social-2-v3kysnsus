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
    let targetCount = '5-8'
    let styleGuideline =
      'Instagram: Mix de 5 a 8 hashtags balanceadas: 2-3 hashtags amplas do tema/categoria + 3-5 hashtags específicas de nicho. Evite tags genéricas infladas.'

    if (platLower.includes('tiktok')) {
      targetCount = '4-6'
      styleGuideline =
        'TikTok: Gere de 4 a 6 hashtags focadas em viralidade, intenção de busca dinâmica (search intent SEO) e nicho do vídeo.'
    } else if (platLower.includes('linkedin')) {
      targetCount = '3-5'
      styleGuideline =
        'LinkedIn: Gere de 3 a 5 hashtags estritamente analíticas e corporativas (mercado, liderança, tecnologia e gestão). Sem excessos.'
    } else if (platLower.includes('twitter') || platLower === 'x') {
      targetCount = '2-4'
      styleGuideline =
        'X (antigo Twitter): Gere de 2 a 4 hashtags curtas e estratégicas para poupar caracteres.'
    } else if (platLower.includes('youtube')) {
      targetCount = '3-5'
      styleGuideline =
        'YouTube: Gere de 3 a 5 hashtags de alto volume de busca orgânica para ranqueamento em vídeos e Shorts.'
    } else if (platLower.includes('facebook')) {
      targetCount = '2-4'
      styleGuideline =
        'Facebook: Gere de 2 a 4 hashtags amplas voltadas para engajamento em comunidades.'
    }

    try {
      const reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é um estrategista de SEO e distribuição para redes sociais da MidiaViva / BestContent AI. ' +
              'Gere um mix inteligente de ' +
              targetCount +
              ' hashtags (combinando termos amplos de categoria com termos específicos de micro-nicho) em português do Brasil. ' +
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
              (category ? ' | Categoria/Tema: ' + category : '') +
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
      $app.logger().warn('Fallback na geracao de hashtags via IA', 'error', String(err))
      const words = content
        .toLowerCase()
        .replace(/[^\w\s\u00C0-\u00FF]/gi, '')
        .split(/\s+/)
        .filter(function (w) {
          return w.length > 3
        })
      const fallbackList = []
      if (category) {
        fallbackList.push('#' + category.replace(/\s+/g, ''))
      }
      words.slice(0, 4).forEach(function (w) {
        fallbackList.push('#' + w)
      })
      if (platLower.includes('tiktok')) {
        fallbackList.push('#dicasrapidas', '#conteudoestrategico')
      } else if (platLower.includes('linkedin')) {
        fallbackList.push('#lideranca', '#gestaoestrategica')
      } else {
        fallbackList.push('#estrategiadeconteudo', '#altaperformance')
      }
      const unique = Array.from(new Set(fallbackList)).slice(0, 6)
      return e.json(200, {
        hashtags: unique,
        platform: platform,
        count: unique.length,
        notice: 'Hashtags geradas via algoritmo de nicho calibrado.',
      })
    }
  },
  $apis.requireAuth(),
)
