routerAdd(
  'POST',
  '/backend/v1/ai/carousel-guidelines',
  (e) => {
    const body = e.requestInfo().body || {}
    const theme = (body.theme || body.prompt || '5 Passos para Escalar').trim()
    const brandName = (body.brandName || 'Sua Marca').trim()
    const brandVoice = (body.brandVoice || 'Profissional e inspirador').trim()
    const brandColors = (body.brandColors || 'Violeta Elétrico, Roxo e Branco').trim()
    const funnelObjective = (body.funnelObjective || 'Autoridade').trim()
    const carouselFormat = (body.format || 'carrossel_educativo').trim()
    const slideCount = Number(body.slideCount) || 6

    // Diretrizes de estilo para carrosséis de alta retenção:
    // 1. Slide 1 como Capa-Gancho magnética
    // 2. 1 ideia central por slide (sem sobrecarga cognitiva)
    // 3. Máximo de 35-45 palavras por slide (escaneável)
    // 4. Último slide com CTA decisivo e indicação de arraste/salve
    // 5. Ritmo progressivo e consistência visual com cores do Brand Kit
    let specificGuidelines =
      'Carrossel Educativo Passo a Passo: cada slide entrega uma etapa acionável com clareza cirúrgica.'
    if (carouselFormat.includes('antes_depois')) {
      specificGuidelines =
        'Carrossel Antes & Depois: contraste visual e estratégico entre a dor/erro comum e a solução transformada.'
    } else if (carouselFormat.includes('erros') || carouselFormat.includes('mitos')) {
      specificGuidelines =
        'Carrossel de Erros & Mitos: quebra de objeções progressiva com gancho forte na capa.'
    } else if (carouselFormat.includes('checklist')) {
      specificGuidelines =
        'Carrossel Checklist Rápido: itens objetivos para salvamento e consulta recorrente.'
    }

    const systemPrompt =
      'Você é o estrategista-chefe de carrosséis e formatos estáticos da plataforma MidiaViva / BestContent AI. Seu objetivo é estruturar carrosséis com psicologia de retenção slide a slide.\n\n' +
      'REGRAS OBRIGATÓRIAS DO CARROSSEL:\n' +
      '1. SLIDE 1 (CAPA-GANCHO): O título e gancho DEVEM gerar curiosidade imediata ou prometer transformação clara. Deve conter indicação visual sutil de "arraste para o lado 👉".\n' +
      '2. UMA IDEIA POR SLIDE: Nunca misture dois conceitos no mesmo slide. Menos é mais.\n' +
      '3. LIMITE DE TEXTO: Máximo de 35 a 45 palavras por slide. Frases curtas, palavras em destaque (negrito/letras maiúsculas nas palavras-chave).\n' +
      '4. SLIDE FINAL (CTA): Chamada para ação clara ("Toque em Salvar", "Comente X no direct", "Compartilhe com um parceiro").\n' +
      '5. HARMONIA VISUAL: Indicar como usar as cores do Brand Kit e hierarquia tipográfica.\n\n' +
      'Retorne EXCLUSIVAMENTE um JSON válido com o seguinte formato:\n' +
      '{\n' +
      '  "title": "Título magnético do carrossel",\n' +
      '  "recommended_slides_count": 6,\n' +
      '  "caption": "Legenda completa com gancho, corpo e CTA",\n' +
      '  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4"],\n' +
      '  "brand_kit_visual_direction": "Orientação de cores, contraste e fontes",\n' +
      '  "slides": [\n' +
      '    {\n' +
      '      "slide_number": 1,\n' +
      '      "role": "capa_gancho",\n' +
      '      "headline": "Título do slide",\n' +
      '      "body_text": "Texto escaneável curto",\n' +
      '      "visual_cue": "Dica visual (ícone, ilustração, badge arraste)",\n' +
      '      "brand_color_focus": "Cor predominante sugerida"\n' +
      '    }\n' +
      '  ]\n' +
      '}'

    const userPrompt =
      `DADOS DO CARROSSEL:\n` +
      `- Tema: ${theme}\n` +
      `- Marca: ${brandName}\n` +
      `- Tom de voz: ${brandVoice}\n` +
      `- Cores do Brand Kit: ${brandColors}\n` +
      `- Objetivo de Funil: ${funnelObjective}\n` +
      `- Formato: ${specificGuidelines}\n` +
      `- Quantidade de slides: ${slideCount}\n\n` +
      `Gere a estrutura completa do carrossel com exatamente ${slideCount} slides atendendo todas as regras.`

    // Fallback estruturado caso AI offline
    const fallbackSlides = [
      {
        slide_number: 1,
        role: 'capa_gancho',
        headline: theme,
        body_text:
          'O método comprovado que quase ninguém ensina da forma correta. Arraste para o lado 👉',
        visual_cue:
          'Capa de alto impacto com tipografia ousada, fundo contrastante e selo "Guia Prático"',
        brand_color_focus: 'Fundo escuro com acento nas cores principais da marca',
      },
      {
        slide_number: 2,
        role: 'problema_contexto',
        headline: 'O Erro que Passa Despercebido',
        body_text:
          'A maioria tenta resolver o sintoma, mas esquece que o gargalo está na falta de processo consistente no início da jornada.',
        visual_cue: 'Caixa de destaque em tom suave com ícone de alerta sutil',
        brand_color_focus: 'Destaque tipográfico secundário',
      },
      {
        slide_number: 3,
        role: 'virada_chave',
        headline: 'A Virada de Chave em 1 Decisão',
        body_text:
          'Em vez de gastar horas improvisando, implemente uma rotina enxuta de 3 etapas com foco em entrega e qualidade.',
        visual_cue: 'Divisão clara em 3 marcadores visuais numerados',
        brand_color_focus: 'Foco na cor primária da marca',
      },
      {
        slide_number: 4,
        role: 'aplicacao_pratica',
        headline: 'O Ajuste que Destrava o Resultado',
        body_text:
          '1. Elimine ruído\n2. Padronize templates e tom de voz\n3. Meça retenção semanal em vez de métricas de vaidade.',
        visual_cue: 'Checklist visual com marcadores preenchidos',
        brand_color_focus: 'Paleta harmônica do Brand Kit',
      },
      {
        slide_number: 5,
        role: 'exemplo_real',
        headline: 'Resultado no Mundo Real',
        body_text:
          'Menos volume desordenado, mais intenção estratégica. O resultado é retenção 2x maior da audiência mais qualificada.',
        visual_cue: 'Gráfico ou indicador de crescimento ascendente',
        brand_color_focus: 'Contraste com cor de apoio',
      },
      {
        slide_number: 6,
        role: 'cta_final',
        headline: 'Salve Este Guia Agora 📌',
        body_text:
          'Toque na bandeirinha abaixo para consultar sempre que for criar novos conteúdos. Deixe nos comentários qual passo você aplica hoje!',
        visual_cue:
          'Ícone de salvar em destaque, seta apontando para baixo e botão visual de engajamento',
        brand_color_focus: 'Destaque vibrante com a cor primária da marca',
      },
    ]

    const fallbackResponse = {
      title: theme,
      recommended_slides_count: slideCount,
      caption: `Você já sentiu que está trabalhando o dobro para ter metade do resultado? Deslize para o lado para conferir a anatomia completa de um processo sustentável! 👉\n\n📌 Salve para consultar na sua próxima produção!\n💬 Qual o maior desafio da sua rotina hoje? Compartilhe abaixo!`,
      hashtags: ['#carrossel', '#conteudoestrategico', '#produtividade', '#autoridade'],
      brand_kit_visual_direction: `Utilize as cores do Brand Kit (${brandColors}), fontes legíveis em caixas amplas, espaçamento generoso e 1 ideia por slide.`,
      slides: fallbackSlides.slice(0, slideCount),
    }

    try {
      const res = $ai.chat({
        model: 'fast',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      })
      const content = res.choices[0].message.content
      const jsonStart = content.indexOf('{')
      const jsonEnd = content.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(content.substring(jsonStart, jsonEnd + 1))
        return e.json(200, parsed)
      }
      return e.json(200, fallbackResponse)
    } catch (err) {
      return e.json(200, fallbackResponse)
    }
  },
  $apis.requireAuth(),
)
