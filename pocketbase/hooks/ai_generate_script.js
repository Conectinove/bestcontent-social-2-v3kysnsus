routerAdd(
  'POST',
  '/backend/v1/ai/script',
  (e) => {
    const body = e.requestInfo().body || {}
    const prompt = body.prompt || ''
    const duration = Number(body.duration) || 15
    const brandName = body.brandName || 'Minha Marca'
    const objective = body.objective || 'engajamento'
    const videoFormat = body.format || body.videoFormat || 'reels_shorts'
    const visualStyle =
      body.visualStyle || 'Cores vibrantes da marca, ritmo dinâmico e cortes rápidos'
    const brandVoice = body.brandVoice || 'Profissional e magnético'
    const brandColors = body.brandColors || 'Violeta Elétrico, Roxo e Branco'
    const trackEnergy = body.trackEnergy || 'Energia alta / batida ritmada moderna'

    // Regras de formato e ritmo
    let formatGuidelines =
      'Vídeo vertical 9:16 (Reels/Shorts/TikTok ~15-60s). Gancho explosivo nos primeiros 3 segundos, estrutura hook -> desenvolvimento -> CTA inegociável.'
    if (String(videoFormat).includes('talking_head')) {
      formatGuidelines =
        'Talking Head (pessoa falando para a câmera em plano médio/close). Olhar fixo na lente, corte rápido a cada 3-4s com zoom sutil, texto na tela reforçando palavras-chave.'
    } else if (String(videoFormat).includes('audiograma')) {
      formatGuidelines =
        'Audiograma / Podcast snippet com waveform animada e legendas grandes dinâmicas destacando insights profundos.'
    } else if (String(videoFormat).includes('collab_duo')) {
      formatGuidelines =
        'Collab Duo: dinâmica de diálogo ou reação entre dois criadores/especialistas com tela dividida ou cortes alternados.'
    } else if (
      String(videoFormat).includes('roteiro_master') ||
      String(videoFormat).includes('live')
    ) {
      formatGuidelines =
        'Live com Roteiro Master: estrutura modular com abertura de impacto, 3 blocos temáticos com retenção e encerramento com oferta.'
    } else if (String(videoFormat).includes('youtube_longo')) {
      formatGuidelines =
        'YouTube Horizontal 16:9 longo. Gancho cinematográfico de 30s, vinheta rápida e tópicos com aprofundamento.'
    }

    const systemMessage =
      'Você é o diretor criativo e roteirista sênior de vídeo da MidiaViva / BestContent AI. Crie roteiros de altíssima retenção com psicologia de atenção nos primeiros 3 segundos, ritmo acelerado e aplicação visual do Brand Kit da marca.\n\n' +
      'DIRETRIZES DE ESTILO DE VÍDEO:\n' +
      `- Formato de vídeo: ${formatGuidelines}\n` +
      `- Duração recomendada: ${duration} segundos\n` +
      `- Energia da trilha sonora: ${trackEnergy}\n` +
      `- Tom de voz da marca: ${brandVoice}\n` +
      `- Identidade visual do Brand Kit: ${visualStyle} (Paleta: ${brandColors})\n\n` +
      'Retorne APENAS um JSON válido exatamente nesta estrutura (sem markdown, sem preâmbulo):\n' +
      '{\n' +
      '  "title": "Título chamativo do vídeo",\n' +
      '  "caption": "Legenda completa do post com gancho, corpo e CTA",\n' +
      '  "hashtags": ["#tag1", "#tag2", "#tag3"],\n' +
      '  "track_suggestion": "Sugestão de estilo de trilha sonora / áudio em alta",\n' +
      '  "hook_3s": "Frase exata e ação do gancho nos primeiros 3 segundos",\n' +
      '  "brand_visual_note": "Aplicação de cores e estilo visual da marca",\n' +
      '  "takes": [\n' +
      '    {\n' +
      '      "take_number": 1,\n' +
      '      "duration_sec": 3,\n' +
      '      "visual_description": "Descrição do visual, ângulo e movimento",\n' +
      '      "voiceover": "Texto falado ou narração",\n' +
      '      "text_overlay": "Texto em destaque na tela"\n' +
      '    }\n' +
      '  ]\n' +
      '}'

    const userMessage = `Crie um roteiro de vídeo de ${duration} segundos para a marca "${brandName}". Formato: ${videoFormat}. Objetivo: ${objective}. Ideia/Tema: "${prompt}"`

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
        track_suggestion: trackEnergy || 'Batida moderna lo-fi ou synthwave acelerado com punch',
        hook_3s: `Pare de cometer esse erro com ${prompt.slice(0, 30) || 'sua estratégia'}!`,
        brand_visual_note: `Paleta ${brandColors} aplicada em textos vazados e iluminação de fundo.`,
        takes: [
          {
            take_number: 1,
            duration_sec: 3,
            visual_description:
              'Plano médio com aproximação rápida (zoom in), olhar cravado na lente e texto roxo em caixa alta.',
            voiceover: prompt
              ? `Se você trabalha com ${prompt.slice(0, 35)}, pare tudo por 20 segundos!`
              : 'Você comete esse erro todos os dias sem perceber!',
            text_overlay: 'PARE AGORA 🛑',
          },
          {
            take_number: 2,
            duration_sec: Math.max(5, Math.round(duration * 0.5)),
            visual_description:
              'Corte dinâmico para demonstração na tela ou bastidores, alternando com b-roll.',
            voiceover:
              'O jeito tradicional só consome tempo e energia. O ajuste real está na simplificação de 3 etapas com consistência.',
            text_overlay: '3 PASSOS PRÁTICOS ⚡',
          },
          {
            take_number: 3,
            duration_sec: Math.max(4, Math.round(duration * 0.35)),
            visual_description:
              'Retorno para a câmera com sorriso seguro e gesto apontando para a bio/comentários.',
            voiceover:
              'Salve esse vídeo para aplicar na sua produção e mande uma mensagem no direct para receber o guia!',
            text_overlay: 'SALVE E COMENTE 👇',
          },
        ],
      })
    } catch (err) {
      return e.json(500, { error: String(err) })
    }
  },
  $apis.requireAuth(),
)
