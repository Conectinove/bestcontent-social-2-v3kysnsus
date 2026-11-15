// =========================================================================
// Endpoint: "Redator de Legendas" — agente nativo (caption-writer-agent,
// migration 0106, padrão da 0012/social_studio.js). Recebe o texto/tema do
// post, a rede e o tom de voz e devolve legenda pronta + variantes, com
// fallback determinístico se a IA falhar.
// =========================================================================
routerAdd(
  'POST',
  '/backend/v1/ai/caption-writer',
  (e) => {
    const body = e.requestInfo().body || {}
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('Autenticação necessária.')

    const content = (body.content || '').trim()
    const network = (body.network || 'Instagram').trim()
    const tone = (body.tone || 'descontraído e profissional').trim()
    const goal = (body.goal || 'engajar').trim()
    const hashtagsCount = Math.min(Math.max(Number(body.hashtagsCount) || 5, 3), 10)

    // Fallback determinístico INLINE no callback (JSVM não enxerga funções
    // de nível superior dentro de callbacks de hooks — 'Hook scoping error').
    const fallbackResponse = () => {
      const hook =
        network === 'LinkedIn'
          ? 'O que ninguém te conta sobre ' + (content.slice(0, 40) || 'este tema') + ':'
          : 'Pare de rolar: ' + (content.slice(0, 40) || 'isso muda seu jogo')
      const caption =
        hook +
        '\n\n' +
        (content || 'Conteúdo do post') +
        '\n\nO que isso significa na prática:\n• Comece pelo problema real do seu público\n• Mostre o caminho em passos simples\n• Prove com um resultado ou exemplo\n\n' +
        (goal === 'vender'
          ? 'Quer aplicar isso no seu negócio? Chame na DM.'
          : goal === 'educar'
            ? 'Salve este post para consultar depois.'
            : 'Comente aqui o que você achou.') +
        '\n\n' +
        ['#conteudo', '#marketingdigital', '#socialmedia', '#dicas', '#midiasocial']
          .slice(0, hashtagsCount)
          .join(' ')
      return {
        success: true,
        source: 'fallback',
        caption,
        hook,
        cta: 'Chame na DM / comente abaixo',
        hashtags: [
          '#conteudo',
          '#marketingdigital',
          '#socialmedia',
          '#dicas',
          '#midiasocial',
        ].slice(0, hashtagsCount),
        variants: [
          (content || 'Post') + ' — o essencial em 3 linhas. Salva pra não perder!',
          'Dica rápida: ' + (content.slice(0, 60) || 'aplique hoje') + ' ✅',
        ],
        summary:
          'Legenda gerada pelo modelo determinístico (IA indisponível): gancho + corpo + CTA + hashtags.',
      }
    }

    if (!content) {
      return e.json(400, {
        success: false,
        source: 'fallback',
        error: 'Informe o texto/tema do post para gerar a legenda.',
      })
    }

    try {
      const prompt =
        `ESCREVA A LEGENDA DO POST:\n` +
        `- Conteúdo/tema: ${content}\n` +
        `- Rede de destino: ${network}\n` +
        `- Tom de voz: ${tone}\n` +
        `- Objetivo: ${goal}\n` +
        `- Quantidade de hashtags: ${hashtagsCount}\n\n` +
        `Responda EXCLUSIVAMENTE com JSON nos campos "caption", "hook", "cta", "hashtags", "variants" e "summary".`

      const result = $ai.agent('caption-writer-agent').chat({
        user_id: userId,
        conversation_id: null,
        message: prompt,
      })

      const raw = (result.content || '').trim()
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        if (parsed && typeof parsed.caption === 'string' && parsed.caption.trim()) {
          return e.json(200, {
            success: true,
            source: 'agent',
            caption: parsed.caption.trim(),
            hook: (parsed.hook || '').trim(),
            cta: (parsed.cta || '').trim(),
            hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 12) : [],
            variants: Array.isArray(parsed.variants) ? parsed.variants.slice(0, 3) : [],
            summary: parsed.summary || '',
          })
        }
      }

      return e.json(200, fallbackResponse())
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        console.log('[caption-writer] IA não configurada:', err.message)
      else if (err instanceof SkipAiAgentsError)
        console.log('[caption-writer] erro do agente:', err.message)
      else if (err instanceof SkipAiError)
        console.log('[caption-writer] erro do gateway de IA:', err.message)
      else console.log('[caption-writer] erro inesperado:', err)
      return e.json(200, fallbackResponse())
    }
  },
  $apis.requireAuth(),
)
