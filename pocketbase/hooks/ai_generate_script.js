routerAdd(
  'POST',
  '/backend/v1/ai/script',
  (e) => {
    const body = e.requestInfo().body || {}
    const prompt = body.prompt || ''
    const duration = Number(body.duration) || 15
    const brandName = body.brandName || 'Minha Marca'
    const objective = body.objective || 'engajamento'

    const systemMessage =
      'Você é um roteirista expert em vídeos curtos para redes sociais (Reels, TikTok, Shorts). Retorne APENAS um JSON válido exatamente nesta estrutura (sem markdown, sem preâmbulo):\n' +
      '{\n' +
      '  "title": "Título chamativo do vídeo",\n' +
      '  "caption": "Legenda completa do post com gancho, corpo e CTA",\n' +
      '  "hashtags": ["#tag1", "#tag2", "#tag3"],\n' +
      '  "takes": [\n' +
      '    {\n' +
      '      "take_number": 1,\n' +
      '      "duration_sec": 3,\n' +
      '      "visual_description": "Descrição do visual e ângulo de câmera",\n' +
      '      "voiceover": "Texto falado pelo criador",\n' +
      '      "text_overlay": "Texto em destaque na tela"\n' +
      '    }\n' +
      '  ]\n' +
      '}'

    const userMessage = `Crie um roteiro de vídeo de ${duration} segundos para a marca "${brandName}". Objetivo principal: ${objective}. Prompt do usuário: "${prompt}"`

    try {
      const res = $ai.chat({
        model: 'fast',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
      })
      const content = res.choices[0].message.content
      const jsonStart = content.indexOf('{')
      const jsonEnd = content.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(content.substring(jsonStart, jsonEnd + 1))
        return e.json(200, parsed)
      }
      return e.json(200, {
        title: `Roteiro: ${prompt.slice(0, 30) || 'Vídeo de Alta Conversão'}`,
        caption: `${prompt}\n\nConfira o link na bio para saber mais!`,
        hashtags: ['#bestcontent', '#reels', '#viral'],
        takes: [
          {
            take_number: 1,
            duration_sec: Math.max(2, Math.round(duration * 0.3)),
            visual_description: 'Criador olhando direto para a câmera com expressão entusiasmada',
            voiceover: prompt || 'Você já parou para pensar sobre isso?',
            text_overlay: 'Atenção aqui! 🚀',
          },
          {
            take_number: 2,
            duration_sec: Math.max(3, Math.round(duration * 0.7)),
            visual_description: 'Corte rápido mostrando os bastidores ou a solução prática',
            voiceover: 'Com a estratégia certa você transforma seus resultados no MudarCurso.',
            text_overlay: 'Saiba mais no link 💡',
          },
        ],
      })
    } catch (err) {
      return e.json(500, { error: String(err) })
    }
  },
  $apis.requireAuth(),
)
