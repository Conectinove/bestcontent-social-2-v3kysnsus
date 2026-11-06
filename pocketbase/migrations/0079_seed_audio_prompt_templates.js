migrate(
  (app) => {
    // Seed idempotente de modelos de prompt adicionais para Áudio no PocketBase
    const templateCol = app.findCollectionByNameOrId('studio_prompt_templates')
    if (!templateCol) return

    const usersCol = app.findCollectionByNameOrId('users')
    const users = app.findRecordsByFilter('users', 'id != ""', '-created', 1, 0)
    const firstUserId = users && users.length > 0 ? users[0].id : null

    const audioSeedTemplates = [
      {
        name: 'Locução Promocional com Prosódia Natural',
        description: 'Narração de 15s para reels, stories ou vinheta de podcast.',
        category: 'audio',
        template_text:
          'Locução dinâmica e envolvente em português brasileiro para {produto}: "Você já parou para pensar em como {tema} pode transformar sua rotina? Descubra o método definitivo agora mesmo."',
        default_model_id: 'gemini-3-8-flash-tts',
        placeholders: ['produto', 'tema'],
        is_favorite: true,
        usage_count: 18,
      },
      {
        name: 'Jingle Comercial & Assinatura Sonora',
        description: 'Roteiro sonoro rítmico com gancho marcante e tagline cantada.',
        category: 'audio',
        template_text:
          'Jingle comercial contagiante e memorável para {produto}. Ritmo {ritmo}, tom {tom}. Letra curta focada no benefício de {tema}, finalizando com o slogan de 3 segundos em alta energia.',
        default_model_id: 'gemini-3-8-flash-tts',
        placeholders: ['produto', 'ritmo', 'tom', 'tema'],
        is_favorite: true,
        usage_count: 15,
      },
      {
        name: 'Narrativa Documental / Storytelling Intimista',
        description: 'Voz profunda e cadenciada para vídeos reflexivos e institucionais.',
        category: 'audio',
        template_text:
          'Locução em tom confessional e cinematográfico sobre {tema}. Respiração suave, pausas dramáticas para ressaltar o impacto de {produto}. Ambiente sonoro envolvente no tom {tom}.',
        default_model_id: 'gemini-3-8-flash-tts',
        placeholders: ['tema', 'produto', 'tom'],
        is_favorite: false,
        usage_count: 12,
      },
      {
        name: 'Anúncio Falado de Venda Rápida (Direct Response)',
        description: 'Spot de áudio de 30s com estrutura Dor → Solução → Oferta Urgente.',
        category: 'audio',
        template_text:
          'Spot publicitário em áudio para rádio e streaming. Locutor dinâmico no tom {tom}: "Cansado de perder tempo com {problema}? Apresentamos {produto}, a forma mais rápida de dominar {tema}. Acesse o link agora."',
        default_model_id: 'gemini-3-8-flash-tts',
        placeholders: ['problema', 'produto', 'tema', 'tom'],
        is_favorite: false,
        usage_count: 14,
      },
      {
        name: 'Vinheta de Abertura / Podcast Intro',
        description: 'Intro energética com apresentação do host, tema do episódio e patrocinador.',
        category: 'audio',
        template_text:
          'Abertura curta e profissional de podcast: "Seja muito bem-vindo ao podcast oficial! Hoje desvendamos os segredos de {tema} com o apoio especial de {produto}. Prepare-se para insights práticos no tom {tom}."',
        default_model_id: 'gemini-3-8-flash-tts',
        placeholders: ['tema', 'produto', 'tom'],
        is_favorite: false,
        usage_count: 10,
      },
    ]

    if (firstUserId) {
      audioSeedTemplates.forEach((seed) => {
        try {
          const existing = app.findRecordsByFilter(
            'studio_prompt_templates',
            `name = "${seed.name.replace(/"/g, '\\"')}"`,
            '',
            1,
            0,
          )
          if (!existing || existing.length === 0) {
            const record = new Record(templateCol)
            record.set('user', firstUserId)
            record.set('name', seed.name)
            record.set('description', seed.description)
            record.set('category', seed.category)
            record.set('template_text', seed.template_text)
            record.set('default_model_id', seed.default_model_id)
            record.set('placeholders', seed.placeholders)
            record.set('is_favorite', seed.is_favorite)
            record.set('usage_count', seed.usage_count)
            app.save(record)
          }
        } catch (err) {
          console.log('Aviso ao semear template de áudio:', err.message)
        }
      })
    }
  },
  (app) => {
    // Reversão graciosa
    try {
      const records = app.findRecordsByFilter(
        'studio_prompt_templates',
        'category = "audio"',
        '',
        50,
        0,
      )
      records.forEach((rec) => {
        try {
          app.delete(rec)
        } catch (_) {}
      })
    } catch (_) {}
  },
)
