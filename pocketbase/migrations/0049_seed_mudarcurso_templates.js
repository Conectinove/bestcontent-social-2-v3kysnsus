migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('post_templates')
    let admin = null
    try {
      admin = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
    } catch (_) {}

    const adminId = admin ? admin.id : ''

    // Novos modelos inspirados na identidade visual do sistema MudarCurso:
    // - Dark mode elegante (#0F0B1F, #1E1B4B, #1B0A4D)
    // - Violeta elétrico / magenta pulse (#5B1FE0, #6D28D9, #C44BFF, #FF7BC1)
    // - Proporções: 9:16 (Reels/Shorts/Stories), 1:1 (Feed), 16:9 (Banner/OG Image)
    // - Fotografia com overlay roxo e tipografia display impactante
    const templates = [
      // 1. Reels / Shorts 9:16 - Frame Editorial Violeta
      {
        name: 'MudarCurso Reels 9:16 — Luz Violeta & Decisão',
        network: 'instagram',
        category: 'autoridade',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'mudarcurso-reels-luz',
          headline: 'MUDAR É O VERBO. ASSUMA A SUA ROTA.',
          subhead: 'Como virar a chave da sua carreira criativa em menos de 90 dias',
          ctaText: 'Assista até o final →',
          brandingMark: 'MUDARCURSO',
          overlay:
            'linear-gradient(180deg, rgba(15,11,31,0.2) 0%, rgba(91,31,224,0.65) 75%, #0F0B1F 100%)',
        },
        style_settings: {
          bgColor: '#0F0B1F',
          accentColor: '#5B1FE0',
          ctaColor: '#C44BFF',
          pinkColor: '#FF7BC1',
          textColor: '#FFFFFF',
          badgeText: '9:16 · REELS / SHORTS',
          cardBg: 'rgba(91, 31, 224, 0.15)',
          gradient: 'linear-gradient(180deg, #0F0B1F 0%, #2B0A8A 55%, #5B1FE0 100%)',
          photoOverlay: true,
          photoQuery: 'woman programmer laptop purple light',
        },
      },
      // 2. Reels / Shorts 9:16 - Estudo & Foco Noturno
      {
        name: 'MudarCurso Shorts 9:16 — Estudo & Alta Performance',
        network: 'tiktok',
        category: 'educativo',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'mudarcurso-shorts-study',
          headline: '3 HÁBITOS QUE SEPARAM QUEM APENAS SONHA DE QUEM REALIZA',
          subhead: 'O método prático para dominar ferramentas de IA e tecnologia',
          ctaText: 'Comente ROTA para receber o guia',
          brandingMark: 'MUDARCURSO',
        },
        style_settings: {
          bgColor: '#0B081A',
          accentColor: '#6D28D9',
          ctaColor: '#C44BFF',
          textColor: '#FFFFFF',
          badgeText: '9:16 · TIKTOK & SHORTS',
          cardBg: 'rgba(109, 40, 217, 0.18)',
          gradient: 'linear-gradient(180deg, #0B081A 0%, #1E1B4B 60%, #6D28D9 100%)',
          photoOverlay: true,
          photoQuery: 'young professional working computer neon purple',
        },
      },
      // 3. Stories 9:16 - Manifesto Neon
      {
        name: 'MudarCurso Stories 9:16 — Manifesto Neon',
        network: 'instagram',
        category: 'storytelling',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          grid: 'mudarcurso-story-manifesto',
          headline: 'MUDAR DE CURSO É POSSÍVEL.',
          subhead: 'Você não precisa continuar no caminho que não faz mais sentido pra você.',
          ctaText: 'Arraste para cima e mude a rota',
          brandingMark: 'MUDARCURSO',
        },
        style_settings: {
          bgColor: '#0F0B1F',
          accentColor: '#7C3AED',
          ctaColor: '#FF7BC1',
          textColor: '#FFFFFF',
          badgeText: 'STORIES · MANIFESTO',
          cardBg: 'rgba(124, 58, 237, 0.2)',
          gradient: 'linear-gradient(180deg, #0F0B1F 0%, #1B0A4D 50%, #C44BFF 100%)',
        },
      },
      // 4. Feed 1:1 - Carreira & Retrato em Violeta Vibrante
      {
        name: 'MudarCurso Feed 1:1 — Retrato Carreira Vibrante',
        network: 'instagram',
        category: 'autoridade',
        type: 'feed',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: {
          grid: 'mudarcurso-feed-carreira',
          headline: 'SEU SUCESSO PEDE PASSAGEM',
          subhead: 'O próximo passo profissional começa com clareza e ferramentas certas',
          ctaText: 'Conheça o Programa',
          brandingMark: 'MUDARCURSO',
        },
        style_settings: {
          bgColor: '#1B0A4D',
          accentColor: '#5B1FE0',
          ctaColor: '#C44BFF',
          pinkColor: '#FF7BC1',
          textColor: '#FFFFFF',
          badgeText: '1:1 · FEED OFICIAL',
          cardBg: 'rgba(91, 31, 224, 0.25)',
          gradient: 'linear-gradient(135deg, #1B0A4D 0%, #5B1FE0 60%, #C44BFF 100%)',
          photoOverlay: true,
          photoQuery: 'smiling professional woman laptop violet background',
        },
      },
      // 5. Feed 1:1 - Estudo & Ondas Geométricas
      {
        name: 'MudarCurso Feed 1:1 — Plano de Bordo & Estudo',
        network: 'instagram',
        category: 'educativo',
        type: 'feed',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: {
          grid: 'mudarcurso-feed-study',
          headline: '9 PASSOS PARA TRANSFORMAR DESCONHECIDOS EM FÃS',
          subhead: 'Como estruturar sua comunicação diária com consistência radical',
          ctaText: 'Salve este post',
          brandingMark: 'MUDARCURSO',
        },
        style_settings: {
          bgColor: '#0F0B1F',
          accentColor: '#6D28D9',
          ctaColor: '#FF7BC1',
          textColor: '#FFFFFF',
          badgeText: '1:1 · FEED EDUCATIVO',
          cardBg: 'rgba(239, 230, 255, 0.08)',
          gradient: 'linear-gradient(135deg, #0F0B1F 0%, #1E1B4B 50%, #2B0A8A 100%)',
          photoOverlay: true,
          photoQuery: 'student taking notes desk violet ambience',
        },
      },
      // 6. Feed 1:1 - Três Palavras Âncora
      {
        name: 'MudarCurso Feed 1:1 — Manifesto 3 Palavras',
        network: 'instagram',
        category: 'engajamento',
        type: 'feed',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: {
          grid: 'mudarcurso-feed-three-words',
          headline: 'MUDAR. CURSO. AGORA.',
          subhead: 'Uma plataforma construída para quem decidiu trocar a rota',
          ctaText: 'Qual a sua próxima escolha?',
          brandingMark: 'MUDARCURSO',
        },
        style_settings: {
          bgColor: '#0F0B1F',
          accentColor: '#C44BFF',
          ctaColor: '#5B1FE0',
          textColor: '#FFFFFF',
          badgeText: '1:1 · FEED MANIFESTO',
          cardBg: 'rgba(196, 75, 255, 0.12)',
          gradient: 'linear-gradient(135deg, #0F0B1F 0%, #1E1B4B 70%, #5B1FE0 100%)',
        },
      },
      // 7. Banner / OG Image 16:9 - Hero do Portal MudarCurso
      {
        name: 'MudarCurso Banner 16:9 — Hero Oficial do Portal',
        network: 'linkedin',
        category: 'promo',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1920x640',
        layout_data: {
          grid: 'mudarcurso-hero-banner',
          headline: 'PLATAFORMA QUE MUDA SUA ROTA.',
          subhead: '15+ setores criativos · 200+ trilhas · 107+ profissões pra você escolher',
          ctaText: 'Começar agora →',
          brandingMark: 'MUDARCURSO',
        },
        style_settings: {
          bgColor: '#0F0B1F',
          accentColor: '#5B1FE0',
          ctaColor: '#C44BFF',
          textColor: '#FFFFFF',
          badgeText: '16:9 · BANNER & HERO',
          cardBg: 'rgba(91, 31, 224, 0.2)',
          gradient: 'linear-gradient(90deg, #0F0B1F 0%, #1E1B4B 40%, #5B1FE0 100%)',
        },
      },
      // 8. Open Graph 16:9 / Compartilhamento de Link
      {
        name: 'MudarCurso OG Image — Compartilhamento Social',
        network: 'facebook',
        category: 'promo',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1200x630',
        layout_data: {
          grid: 'mudarcurso-og-share',
          headline: 'VISUAL IDENTITY SYSTEM & EDUCAÇÃO',
          subhead: 'O violeta elétrico mantém a consistência em cada ponto de contato',
          ctaText: 'Acessar Brand Hub',
          brandingMark: 'MUDARCURSO',
        },
        style_settings: {
          bgColor: '#0B081A',
          accentColor: '#7C3AED',
          ctaColor: '#FF7BC1',
          textColor: '#FFFFFF',
          badgeText: 'OG IMAGE · 1200x630',
          cardBg: 'rgba(124, 58, 237, 0.15)',
          gradient: 'linear-gradient(135deg, #0B081A 0%, #2B0A8A 60%, #C44BFF 100%)',
        },
      },
      // 9. Slide Deck / Apresentação 16:9 - Slide Institucional
      {
        name: 'MudarCurso Apresentação 16:9 — Slide Deck & Pitch',
        network: 'linkedin',
        category: 'educativo',
        type: 'feed',
        aspect_ratio: '16:9',
        dimensions: '1920x1080',
        layout_data: {
          grid: 'mudarcurso-slide-deck',
          headline: 'SISTEMA DE IDENTIDADE EM MOVIMENTO',
          subhead: 'Consistência visual do produto digital às redes sociais e eventos',
          ctaText: 'Baixar Brand Kit PDF',
          brandingMark: 'MUDARCURSO',
        },
        style_settings: {
          bgColor: '#0F0B1F',
          accentColor: '#5B1FE0',
          ctaColor: '#C44BFF',
          textColor: '#FFFFFF',
          badgeText: '16:9 · SLIDE DECK',
          cardBg: 'rgba(239, 230, 255, 0.06)',
          gradient: 'linear-gradient(135deg, #0F0B1F 0%, #1E1B4B 75%, #3B0764 100%)',
        },
      },
      // 10. Feed 4:5 - Proposta Comercial & Carreira
      {
        name: 'MudarCurso Feed 4:5 — Carrossel Curva Violeta',
        network: 'instagram',
        category: 'storytelling',
        type: 'feed',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: {
          grid: 'mudarcurso-carousel-curve',
          headline: 'O QUE VOCÊ VAI CRIAR NOS PRÓXIMOS 12 MESES?',
          subhead: 'O violeta em dose certa: acento para conduzir o olhar e converter',
          ctaText: 'Deslize para ver o plano →',
          brandingMark: 'MUDARCURSO',
        },
        style_settings: {
          bgColor: '#0B081A',
          accentColor: '#6D28D9',
          ctaColor: '#C44BFF',
          textColor: '#FFFFFF',
          badgeText: '4:5 · CARROSSEL RETRATO',
          cardBg: 'rgba(109, 40, 217, 0.16)',
          gradient: 'linear-gradient(180deg, #0B081A 0%, #1E1B4B 60%, #5B1FE0 100%)',
        },
      },
    ]

    for (let i = 0; i < templates.length; i++) {
      const item = templates[i]
      try {
        app.findFirstRecordByFilter('post_templates', `name = "${item.name}"`)
      } catch (_) {
        const record = new Record(col)
        if (adminId) record.set('user', adminId)
        record.set('name', item.name)
        record.set('network', item.network)
        record.set('category', item.category)
        record.set('type', item.type)
        record.set('aspect_ratio', item.aspect_ratio)
        record.set('dimensions', item.dimensions)
        record.set('layout_data', JSON.stringify(item.layout_data))
        record.set('style_settings', JSON.stringify(item.style_settings))
        record.set('is_shared', true)
        record.set('is_favorite', false)
        app.save(record)
      }
    }
  },
  (app) => {
    const names = [
      'MudarCurso Reels 9:16 — Luz Violeta & Decisão',
      'MudarCurso Shorts 9:16 — Estudo & Alta Performance',
      'MudarCurso Stories 9:16 — Manifesto Neon',
      'MudarCurso Feed 1:1 — Retrato Carreira Vibrante',
      'MudarCurso Feed 1:1 — Plano de Bordo & Estudo',
      'MudarCurso Feed 1:1 — Manifesto 3 Palavras',
      'MudarCurso Banner 16:9 — Hero Oficial do Portal',
      'MudarCurso OG Image — Compartilhamento Social',
      'MudarCurso Apresentação 16:9 — Slide Deck & Pitch',
      'MudarCurso Feed 4:5 — Carrossel Curva Violeta',
    ]
    for (let i = 0; i < names.length; i++) {
      try {
        const rec = app.findFirstRecordByFilter('post_templates', `name = "${names[i]}"`)
        app.delete(rec)
      } catch (_) {}
    }
  },
)
