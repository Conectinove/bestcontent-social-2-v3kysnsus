// =========================================================================
// Endpoint: "Assistente de Edição" — agente nativo (edit-assistant-agent,
// migration 0104, padrão da 0012/social_studio.js). Recebe o estado atual da
// Edição Avançada + contexto da mídia e devolve sugestões concretas de
// melhoria, com fallback determinístico se a IA falhar.
// =========================================================================
routerAdd(
  'POST',
  '/backend/v1/ai/edit-assistant',
  (e) => {
    const body = e.requestInfo().body || {}
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('Autenticação necessária.')

    const mediaTitle = (body.mediaTitle || 'mídia sem título').trim()
    const mediaPrompt = (body.mediaPrompt || '').trim()
    const network = (body.network || 'Instagram').trim()
    const aspectRatio = (body.aspectRatio || '16:9').trim()
    const userQuestion = (body.question || '').trim()
    const settings = body.settings && typeof body.settings === 'object' ? body.settings : {}

    // Fallback determinístico (mesma resposta usada quando a IA falha)
    const fallbackResponse = () => {
      const advice = []
      if (Number(settings.overlayOpacity || 0) > 45) {
        advice.push(
          'O overlay está pesado (acima de 45%): reduza para ~30% para o fundo respirar sem perder a legibilidade do texto.',
        )
      }
      if (Number(settings.brightness || 100) > 115) {
        advice.push(
          'Brilho muito alto estoura detalhes da foto: traga para 100-108 e compense com contraste ~115 para dar "punch" no celular.',
        )
      }
      if (Number(settings.blur || 0) > 6) {
        advice.push(
          'Blur acima de 6px compete com a leitura: use no máximo 3px, e só se precisar destacar texto sobre a imagem.',
        )
      }
      if (Number(settings.vignette || 0) < 10) {
        advice.push(
          'Uma vinheta leve (~15%) ajuda a guiar o olhar para o centro e melhora a leitura de texto na borda.',
        )
      }
      advice.push(
        'Mantenha o contraste do texto contra o fundo: título em peso extrabold, corpo em normal, e evite mais de 2 famílias tipográficas por arte.',
      )
      return {
        success: true,
        source: 'fallback',
        summary: 'Direcionamento visual padrão aplicado com base no estado atual da edição.',
        advice: advice.slice(0, 3),
        suggestedSettings: {
          brightness: 105,
          contrast: 115,
          saturation: 110,
          blur: 0,
          vignette: 15,
          overlayOpacity: 30,
          rotation: 0,
          borderWidth: 0,
          shadow: 0,
          layerOpacity: 100,
          letterSpacing: 0,
          lineHeight: 1.4,
        },
      }
    }

    try {
      const prompt =
        `CONTEXTO DA MÍDIA:\n` +
        `- Título: ${mediaTitle}\n` +
        `- Tema/prompt original: ${mediaPrompt || 'não informado'}\n` +
        `- Rede: ${network}\n` +
        `- Proporção: ${aspectRatio}\n\n` +
        `ESTADO ATUAL DA EDIÇÃO (JSON):\n` +
        JSON.stringify(settings) +
        `\n\n` +
        (userQuestion ? `PERGUNTA DO USUÁRIO: ${userQuestion}\n\n` : '') +
        `Sugira até 3 melhorias concretas e aplicáveis (campo "advice") e, se fizer sentido, proponha valores em "suggestedSettings" apenas para os campos que valem a pena mudar. Responda EXCLUSIVAMENTE com JSON.`

      const result = $ai.agent('edit-assistant-agent').chat({
        user_id: userId,
        conversation_id: null,
        message: prompt,
      })

      const raw = (result.content || '').trim()
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        if (parsed && (Array.isArray(parsed.advice) || parsed.suggestedSettings)) {
          return e.json(200, {
            success: true,
            source: 'agent',
            summary: parsed.summary || '',
            advice: Array.isArray(parsed.advice) ? parsed.advice.slice(0, 5) : [],
            suggestedSettings:
              parsed.suggestedSettings && typeof parsed.suggestedSettings === 'object'
                ? parsed.suggestedSettings
                : null,
          })
        }
      }

      return e.json(200, fallbackResponse())
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        console.log('[edit-assistant] IA não configurada:', err.message)
      else if (err instanceof SkipAiAgentsError)
        console.log('[edit-assistant] erro do agente:', err.message)
      else if (err instanceof SkipAiError)
        console.log('[edit-assistant] erro do gateway de IA:', err.message)
      else console.log('[edit-assistant] erro inesperado:', err)
      return e.json(200, fallbackResponse())
    }
  },
  $apis.requireAuth(),
)
