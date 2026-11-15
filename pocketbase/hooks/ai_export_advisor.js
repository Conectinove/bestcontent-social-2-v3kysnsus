// =========================================================================
// Endpoint: "Consultor de Exportação" — agente nativo (export-advisor-agent,
// migration 0107, padrão da 0012/social_studio.js). Recebe o estado atual da
// edição + destino do arquivo e recomenda ajustes finais ANTES de baixar,
// com fallback determinístico se a IA falhar.
// =========================================================================
routerAdd(
  'POST',
  '/backend/v1/ai/export-advisor',
  (e) => {
    const body = e.requestInfo().body || {}
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('Autenticação necessária.')

    const network = (body.network || 'Instagram').trim()
    const aspectRatio = (body.aspectRatio || '16:9').trim()
    const contentType = (body.contentType || 'post estático').trim()
    const settings = body.settings && typeof body.settings === 'object' ? body.settings : {}

    // Fallback determinístico INLINE no callback (JSVM não enxerga funções
    // de nível superior dentro de callbacks de hooks — 'Hook scoping error').
    const fallbackResponse = () => {
      const tips = []
      if (Number(settings.blur || 0) > 0) {
        tips.push(
          'Zere o blur antes de exportar: o desfoque fica gravado no arquivo final e reduz a nitidez no feed.',
        )
      }
      if (Number(settings.overlayOpacity || 0) > 45) {
        tips.push(
          'O overlay está em ' +
            Number(settings.overlayOpacity || 0) +
            '% e escurece a arte: baixe para ~30% para o arquivo exportado não ficar pesado.',
        )
      }
      if (Number(settings.contrast || 100) < 105) {
        tips.push(
          'Suba o contraste para ~115: o título ganha legibilidade no feed (modo claro e escuro).',
        )
      }
      const ratioByNetwork = {
        Instagram: '4:5',
        TikTok: '9:16',
        WhatsApp: '9:16',
        LinkedIn: '1:1',
        YouTube: '16:9',
      }
      const recommendedRatio = ratioByNetwork[network] || aspectRatio
      tips.push(
        'Proporção recomendada para ' +
          network +
          ': ' +
          recommendedRatio +
          ' (atual: ' +
          aspectRatio +
          ').',
      )
      return {
        success: true,
        source: 'fallback',
        tips: tips.slice(0, 3),
        recommendedFormat: 'PNG',
        recommendedRatio,
        summary: 'Checklist padrão de exportação aplicado com base no estado atual.',
      }
    }

    try {
      const prompt =
        `AVALIE A EXPORTAÇÃO DESTA ARTE:\n` +
        `- Rede de destino: ${network}\n` +
        `- Proporção atual: ${aspectRatio}\n` +
        `- Tipo de conteúdo: ${contentType}\n\n` +
        `ESTADO ATUAL DA EDIÇÃO (JSON):\n` +
        JSON.stringify(settings) +
        `\n\n` +
        `Dê até 3 dicas de ajuste final ANTES de baixar o arquivo (campo "tips"), o formato ideal ("recommendedFormat") e a proporção ideal ("recommendedRatio"). Responda EXCLUSIVAMENTE com JSON.`

      const result = $ai.agent('export-advisor-agent').chat({
        user_id: userId,
        conversation_id: null,
        message: prompt,
      })

      const raw = (result.content || '').trim()
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        if (parsed && Array.isArray(parsed.tips) && parsed.tips.length > 0) {
          return e.json(200, {
            success: true,
            source: 'agent',
            tips: parsed.tips.slice(0, 5),
            recommendedFormat: parsed.recommendedFormat || 'PNG',
            recommendedRatio: parsed.recommendedRatio || aspectRatio,
            summary: parsed.summary || '',
          })
        }
      }

      return e.json(200, fallbackResponse())
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        console.log('[export-advisor] IA não configurada:', err.message)
      else if (err instanceof SkipAiAgentsError)
        console.log('[export-advisor] erro do agente:', err.message)
      else if (err instanceof SkipAiError)
        console.log('[export-advisor] erro do gateway de IA:', err.message)
      else console.log('[export-advisor] erro inesperado:', err)
      return e.json(200, fallbackResponse())
    }
  },
  $apis.requireAuth(),
)
