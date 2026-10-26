routerAdd(
  'POST',
  '/backend/v1/ai/caption',
  (e) => {
    const body = e.requestInfo().body || {}
    const content = (body.content || '').trim()
    const platform = body.platform || 'Instagram'
    const objective = (body.objective || '').trim() // 'vender' | 'engajar'
    const approach = (body.approach || '').trim() // 'oferta' | 'storytelling' | 'prova_social' | 'viral' | 'educativo' | 'comunidade'
    const brandName = (body.brandName || '').trim()
    const brandVoice = (body.brandVoice || '').trim()
    const tone = (body.tone || '').trim() // 'profissional' | 'descontraido' | 'inspirador' | 'divertido' | 'direto' | 'empatico' | 'provocativo'
    const formatName = (body.formatName || '').trim()
    const headline = (body.headline || '').trim()
    const generateVariations = Boolean(body.variations)

    if (!content && !headline) return e.badRequestError('content or headline is required')

    const subject = content || headline
    let systemPrompt =
      'Você é um estrategista sênior de conteúdo e copywriting especializado em redes sociais (Instagram, Facebook, LinkedIn, TikTok, WhatsApp, YouTube, X). Escreva em português do Brasil de altíssima conversão, com excelente ritmo, pontuação precisa e vocabulário alinhado ao tom de voz solicitado.'

    const toneDescriptions = {
      profissional:
        'PROFISSIONAL: Vocabulário maduro, confiável, corporativo, sem gírias, estrutura impecável e autoridade serena.',
      descontraido:
        'DESCONTRAÍDO: Tom leve, acessível, conversa entre amigos, emojis moderados, linguagem natural e calorosa.',
      inspirador:
        'INSPIRADOR: Tom motivador, focado em superação, visão de futuro, energia positiva e reflexão transformadora.',
      divertido:
        'DIVERTIDO: Bem-humorado, perspicaz, ritmo rápido, pitadas de ironia leve ou humor relacionável do dia a dia.',
      direto:
        'DIRETO AO PONTO: Frases curtas e objetivas, sem rodeios ou floreios, benefício imediato e clareza cirúrgica.',
      empatico:
        'EMPÁTICO: Acolhedor, compreensivo, focado na dor ou sentimento do leitor, gerando conexão humana profunda.',
      provocativo:
        'PROVOCATIVO: Quebra de padrões, desafiador, questiona o senso comum, gancho instigante e forte debate.',
    }

    let contextDesc = 'Plataforma: ' + platform + '\nTema/Contexto: ' + subject
    if (headline) contextDesc += '\nTítulo/Headline da arte: ' + headline
    if (brandName) contextDesc += '\nMarca ativa: ' + brandName
    if (brandVoice) contextDesc += '\nVoz da marca: ' + brandVoice
    if (tone) {
      contextDesc += '\nTom de voz exigido: ' + (toneDescriptions[tone] || tone)
    }
    if (formatName) contextDesc += '\nFormato da publicação: ' + formatName
    if (objective) {
      contextDesc +=
        '\nObjetivo do post: ' +
        (objective === 'vender'
          ? 'VENDER (foco em conversão, proposta de valor irresistível, clareza dos benefícios e CTA forte para direct/link/compra)'
          : 'ENGAJAR (foco em retenção, identificação, debate, salvar post, comentários e compartilhamento)')
    }
    if (approach) {
      const approachNames = {
        oferta: 'OFERTA (urgência, benefício tangível, condições especiais, sem rodeios)',
        storytelling:
          'STORYTELLING (jornada, momento de virada, gancho emocional e lição aplicável)',
        prova_social:
          'PROVA SOCIAL (resultados concretos, validação de mercado, depoimentos e autoridade)',
        viral:
          'VIRAL (gancho magnético, quebra de expectativa, curiosidade e alta taxa de compartilhamento)',
        educativo:
          'EDUCATIVO (passo a passo claro, playbook prático, valor imediato que faz salvar)',
        comunidade:
          'COMUNIDADE (pergunta aberta, debate genuíno, conexão e senso de pertencimento)',
      }
      contextDesc += '\nAbordagem estratégica: ' + (approachNames[approach] || approach)
    }

    try {
      if (generateVariations) {
        // Gerar 3 variações estruturadas para o usuário escolher
        const userPrompt =
          contextDesc +
          '\n\nGere 3 opções de legendas distintas e envolventes para este post (Opção 1, Opção 2 e Opção 3) respeitando rigorosamente o tom de voz especificado, além de um CTA direcionado e 5 a 10 hashtags estratégicas.\n' +
          'Retorne EXCLUSIVAMENTE em formato JSON com o seguinte schema:\n' +
          '{\n' +
          '  "variations": [\n' +
          '    { "title": "Opção 1 (Direta & Convincente)", "text": "...", "cta": "..." },\n' +
          '    { "title": "Opção 2 (Storytelling & Conexão)", "text": "...", "cta": "..." },\n' +
          '    { "title": "Opção 3 (Educativa & Alto Engajamento)", "text": "...", "cta": "..." }\n' +
          '  ],\n' +
          '  "hashtags": ["#tag1", "#tag2", "#tag3"]\n' +
          '}'

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

        if (parsed && Array.isArray(parsed.variations) && parsed.variations.length > 0) {
          const defaultCaption = parsed.variations[0].text || ''
          const defaultCta = parsed.variations[0].cta || ''
          const finalCaption = defaultCta ? defaultCaption + '\n\n👉 ' + defaultCta : defaultCaption
          return e.json(200, {
            caption: finalCaption,
            variations: parsed.variations,
            hashtags: parsed.hashtags || [],
          })
        }
        return e.json(200, { caption: raw, variations: [] })
      }

      // Modo padrão direto
      const userPrompt =
        contextDesc +
        '\n\nEscreva uma legenda completa e engajadora com:\n' +
        '1. Gancho forte nos primeiros 100 caracteres;\n' +
        '2. Desenvolvimento fluido e legível (parágrafos curtos) no tom de voz selecionado;\n' +
        '3. Chamada para ação (CTA) alinhada ao objetivo;\n' +
        '4. Sem clichês. Retorne APENAS o texto pronto para ser postado, sem notas explicativas.'

      const reply = $ai.chat({
        model: 'fast',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
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
