routerAdd(
  'POST',
  '/backend/v1/social-studio/chat',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária.')
      if (!body.message?.trim()) return e.badRequestError('Mensagem é obrigatória.')

      const result = $ai.agent('social-studio-agent').chat({
        user_id: userId,
        conversation_id: body.conversation_id || null,
        message: body.message,
      })

      return e.json(200, {
        conversation_id: result.conversation_id,
        content: result.content,
        citations: result.citations,
        message_id: result.message_id,
      })
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        return e.json(503, { error: 'IA temporariamente indisponível' })
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Falha na resposta do assistente' : err.message,
        })
      }
      if (err instanceof SkipAiError) {
        const status = err.status || 502
        return e.json(status, { error: 'Serviço de IA indisponível no momento' })
      }
      throw err
    }
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/social-studio/generate-structure',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const topic = body.topic || 'Plano de Bordo Realizador'
      const approach = body.approach || 'Storytelling'

      const prompt = `Gere uma estrutura de post de alta conversão para redes sociais sobre "${topic}" com abordagem "${approach}".
Retorne um JSON válido sem marcações markdown contendo:
{
  "goal": "Objetivo principal do post",
  "layout": "Descrição visual do layout (ex: 9:16 vertical com fundo degradê)",
  "headline": "Headline chamativa e emocional",
  "body": "Texto do corpo em tópicos ou parágrafo persuasivo",
  "offer": "Preço ou condição especial (ex: De R$ 1.299,99 por R$ 0,00)",
  "cta": "Texto do botão de chamada para ação",
  "footer": "Identificação ou handle do rodapé"
}`

      const res = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é um assistente gerador de estrutura de artes socias. Responda estritamente em formato JSON.',
          },
          { role: 'user', content: prompt },
        ],
      })

      let jsonStr = res.choices[0].message.content.trim()
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr
          .replace(/^```(json)?/, '')
          .replace(/```$/, '')
          .trim()
      }

      let parsed
      try {
        parsed = JSON.parse(jsonStr)
      } catch (_) {
        parsed = {
          goal: 'Vender o Plano de Bordo Realizador para MudarCurso.com.br',
          layout:
            'Vertical (9:16) em degradê roxo/dourado com bússola e imagem central inspiradora',
          headline: 'Cansado de apenas existir? Chegou a hora de viver a sua vocação.',
          body: "A jornada para a sua 'Vida Boa' começa com um mapa real. Chega de se sentir estagnado ou sem direção em 2026. Com o Plano de Bordo Realizador, você domina sua rotina e encontra propósito.",
          offer: 'Acesso imediato: Oportunidade especial de R$ 1.299,99 por R$ 0,00',
          cta: 'TOQUE AQUI E MUDE TUDO',
          footer: '@ronaldo.barreto1',
        }
      }

      return e.json(200, parsed)
    } catch (err) {
      return e.json(200, {
        goal: "Vender o 'Plano de Bordo Realizador' como ferramenta de transformação definitiva do MudarCurso.com.br",
        layout:
          'Vertical (9:16), aspecto mapa de viagem/bússola, pessoa olhando horizonte fascinado',
        headline: 'Cansado de apenas existir? Chegou a hora de viver a sua vocação.',
        body: "A jornada para a sua 'Vida Boa' começa com um mapa real.\n\nChega de se sentir estagnado ou sem direção em 2026.\n\nCom o Plano de Bordo Realizador, você domina sua rotina e encontra seu propósito.",
        offer: 'Acesso imediato: Oportunidade especial de R$ 1.299,99 por R$ 0,00',
        cta: 'TOQUE AQUI E MUDE TUDO',
        footer: '@ronaldo.barreto1',
      })
    }
  },
  $apis.requireAuth(),
)
