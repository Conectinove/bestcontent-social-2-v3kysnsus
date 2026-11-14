routerAdd(
  'POST',
  '/backend/v1/ai/report-insights',
  (e) => {
    const body = e.requestInfo().body || {}
    const metrics = body.metrics || {}
    const periodLabel = String(body.periodLabel || 'período')

    const prompt =
      'Voce e um analista de performance de redes sociais. Analise os dados a seguir e responda APENAS com JSON valido (sem markdown) no formato: ' +
      '{"summary": "resumo de 1-2 frases", "doingWell": ["..."], "worsened": ["..."], "recommendations": ["...","...","..."]}. ' +
      'doingWell: o que esta indo bem. worsened: o que piorou (use a variacao %). recommendations: exatamente 3 acoes acionaveis e especificas. ' +
      'Escreva em portugues brasileiro, direto ao ponto, tom profissional. Dados: ' +
      JSON.stringify({ periodLabel: periodLabel, metrics: metrics })

    try {
      const reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Voce e um analista de performance senior de marketing digital. Retorne APENAS JSON valido, sem texto extra.',
          },
          { role: 'user', content: prompt },
        ],
      })
      const raw = String(reply.choices[0].message.content || '').trim()
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) return e.json(502, { error: 'Resposta da IA invalida' })
      const parsed = JSON.parse(match[0])
      return e.json(200, {
        insights: {
          summary: String(parsed.summary || ''),
          doingWell: Array.isArray(parsed.doingWell) ? parsed.doingWell.map(String) : [],
          worsened: Array.isArray(parsed.worsened) ? parsed.worsened.map(String) : [],
          recommendations: Array.isArray(parsed.recommendations)
            ? parsed.recommendations.map(String)
            : [],
        },
        source: 'ai',
      })
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        return e.json(503, { error: 'IA temporariamente indisponivel' })
      if (err instanceof SkipAiError) return e.json(502, { error: 'Falha na analise de IA' })
      throw err
    }
  },
  $apis.requireAuth(),
)
