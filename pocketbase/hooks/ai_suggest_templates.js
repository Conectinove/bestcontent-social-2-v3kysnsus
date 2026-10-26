routerAdd(
  'POST',
  '/backend/v1/ai/suggest-templates',
  (e) => {
    const body = e.requestInfo().body || {}
    const brandName = (body.brandName || '').trim()
    const brandVoice = (body.brandVoice || '').trim()
    const objective = (body.objective || '').trim() // 'vender' | 'engajar' | 'leads' | 'authority'
    const approach = (body.approach || '').trim() // 'oferta' | 'storytelling' | 'prova_social' | 'viral' | 'educativo' | 'comunidade'
    const network = (body.network || 'instagram').toLowerCase().trim()
    const format = (body.format || '').trim()

    // 1. Buscar templates disponíveis no catálogo PocketBase
    let templates = []
    try {
      templates = $app.findRecordsByFilter(
        'post_templates',
        'is_shared = true || is_favorite = true',
        '-created',
        60,
      )
    } catch (_) {
      templates = []
    }

    if (!templates || templates.length === 0) {
      return e.json(200, { suggestions: [] })
    }

    // Helper interno para fallback por regras caso a IA falhe
    const generateFallback = () => {
      const normNet = (network || 'instagram').toLowerCase()
      const isVender = (objective || '').toLowerCase().includes('vend')

      const matches = templates.filter((t) => {
        const tNet = t.getString('network').toLowerCase()
        return tNet === normNet || tNet === 'all' || tNet === 'todas'
      })

      const pool = matches.length >= 3 ? matches : templates
      return pool.slice(0, 4).map((t) => {
        let layoutData = {}
        let styleSettings = {}
        try {
          layoutData = JSON.parse(t.getString('layout_data')) || {}
        } catch (_) {}
        try {
          styleSettings = JSON.parse(t.getString('style_settings')) || {}
        } catch (_) {}

        return {
          id: t.id,
          name: t.getString('name'),
          network: t.getString('network'),
          category: t.getString('category'),
          type: t.getString('type'),
          aspect_ratio: t.getString('aspect_ratio'),
          dimensions: t.getString('dimensions'),
          is_favorite: t.getBool('is_favorite'),
          layout_data: layoutData,
          style_settings: styleSettings,
          ai_reason: isVender
            ? 'Modelo calibrado com chamada para ação clara, perfeito para converter seguidores em compradores.'
            : 'Estrutura desenhada para prender atenção nos primeiros segundos e gerar compartilhamento orgânico.',
        }
      })
    }

    // Simplificar lista de candidatos para o prompt
    const candidates = templates.map((t) => ({
      id: t.id,
      name: t.getString('name'),
      network: t.getString('network'),
      category: t.getString('category'),
      type: t.getString('type'),
      aspect_ratio: t.getString('aspect_ratio'),
    }))

    // Preparar prompt da IA
    const systemPrompt =
      'Você é um estrategista de marketing e design especializado em redes sociais da plataforma BestContent Social 2. Seu papel é analisar o perfil e o objetivo de uma marca e selecionar de 3 a 5 modelos do catálogo com uma justificativa persuasiva, curta e prática explicando por que cada um foi escolhido.'

    const userPrompt =
      'CONTEXTO DO CRIADOR:\n' +
      `- Marca: ${brandName || 'Não especificada'}\n` +
      `- Tom de voz da marca: ${brandVoice || 'Equilibrado / profissional'}\n` +
      `- Objetivo principal: ${objective || 'engajar / vender'}\n` +
      `- Abordagem: ${approach || 'Geral'}\n` +
      `- Rede social prioritária: ${network}\n` +
      `- Formato: ${format || 'Feed / Story'}\n\n` +
      'CATÁLOGO DE MODELOS CANDIDATOS:\n' +
      JSON.stringify(candidates.slice(0, 30)) +
      '\n\n' +
      'Selecione entre 3 e 5 modelos que melhor atendem a essa estratégia e objetivo. Para cada modelo selecionado, elabore uma "reason" (1 a 2 frases curtas em português explicando por que esse modelo vai performar bem neste contexto).\n\n' +
      'Retorne EXCLUSIVAMENTE em formato JSON com o seguinte schema:\n' +
      '{\n' +
      '  "suggestions": [\n' +
      '    {\n' +
      '      "templateId": "...",\n' +
      '      "reason": "..."\n' +
      '    }\n' +
      '  ]\n' +
      '}'

    try {
      const reply = $ai.chat({
        model: 'fast',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      })

      const raw = (reply.choices[0].message.content || '').trim()
      let parsed = null
      try {
        const match = raw.match(/\{[\s\S]*\}/)
        if (match) parsed = JSON.parse(match[0])
      } catch (_) {}

      if (parsed && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
        // Enriquecer sugestões com os dados completos do template
        const enriched = []
        for (let i = 0; i < parsed.suggestions.length; i++) {
          const s = parsed.suggestions[i]
          const matchTpl = templates.find((t) => t.id === s.templateId)
          if (matchTpl) {
            let layoutData = {}
            let styleSettings = {}
            try {
              layoutData = JSON.parse(matchTpl.getString('layout_data')) || {}
            } catch (_) {}
            try {
              styleSettings = JSON.parse(matchTpl.getString('style_settings')) || {}
            } catch (_) {}

            enriched.push({
              id: matchTpl.id,
              name: matchTpl.getString('name'),
              network: matchTpl.getString('network'),
              category: matchTpl.getString('category'),
              type: matchTpl.getString('type'),
              aspect_ratio: matchTpl.getString('aspect_ratio'),
              dimensions: matchTpl.getString('dimensions'),
              is_favorite: matchTpl.getBool('is_favorite'),
              layout_data: layoutData,
              style_settings: styleSettings,
              ai_reason: s.reason,
            })
          }
        }

        if (enriched.length > 0) {
          return e.json(200, { suggestions: enriched })
        }
      }

      // Fallback inteligente
      return e.json(200, {
        suggestions: generateFallback(),
      })
    } catch (_) {
      // Fallback em caso de erro na IA
      return e.json(200, {
        suggestions: generateFallback(),
      })
    }
  },
  $apis.requireAuth(),
)
