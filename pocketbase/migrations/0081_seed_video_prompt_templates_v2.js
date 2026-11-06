migrate(
  (app) => {
    // Seed idempotente de modelos de prompt para Vídeo no PocketBase (Studio /app/studio)
    const templateCol = app.findCollectionByNameOrId('studio_prompt_templates')
    if (!templateCol) return

    const usersCol = app.findCollectionByNameOrId('users')
    let users = []
    try {
      users = app.findRecordsByFilter('users', 'id != ""', '-created', 1, 0)
    } catch (_) {
      users = []
    }
    const firstUserId = users && users.length > 0 ? users[0].id : null

    const videoSeedTemplates = [
      {
        name: 'Reels / TikTok Viral Dinâmico (UGC Hook)',
        description:
          'Abertura em primeira pessoa com gancho em 3 segundos, cortes rápidos e chamada direta.',
        category: 'video',
        template_text:
          'Vídeo vertical 9:16 de alta energia para {nicho}. Criador segura {produto} em primeiro plano com iluminação de estúdio natural. Gancho magnético nos primeiros 3s: "{gancho}". Edição dinâmica com cortes a cada 1.5s, legendas cinéticas flutuantes e encerramento com CTA: "{cta}".',
        default_model_id: 'runway-gen3-alpha-turbo',
        placeholders: ['nicho', 'produto', 'gancho', 'cta'],
        is_favorite: true,
        usage_count: 32,
      },
      {
        name: 'Comercial Cinematográfico de Produto (Macro Glow)',
        description:
          'Cenas em câmera lenta 60fps com iluminação volumétrica e transição fluida para branding premium.',
        category: 'video',
        template_text:
          'Comercial cinematográfico de 15 segundos para {produto}. Câmera com lente anamórfica em movimento slow-motion circular suave revelando textura, reflexos sofisticados e atmosfera {estilo}. Iluminação volumétrica em tons {paleta}, partículas no ar e transição final para logo minimalista.',
        default_model_id: 'sora-2-pro',
        placeholders: ['produto', 'estilo', 'paleta'],
        is_favorite: true,
        usage_count: 27,
      },
      {
        name: 'Tutorial Passo a Passo em 3 Atos',
        description:
          'Estrutura didática Dor → Solução Rápida → Resultado Prático, perfeita para autoridade.',
        category: 'video',
        template_text:
          'Vídeo explicativo e didático sobre {tema}. Ato 1: demonstrar o erro comum que causa {dor}. Ato 2: tela dividida mostrando o método correto com {ferramenta} em 3 passos simples. Ato 3: tela com o resultado final e convite para salvar o conteúdo.',
        default_model_id: 'luma-dream-machine',
        placeholders: ['tema', 'dor', 'ferramenta'],
        is_favorite: false,
        usage_count: 19,
      },
      {
        name: 'Vlog Pessoal / Storytelling de Bastidores',
        description:
          'Tom documental autêntico, câmera na mão e estética natural de rotina de criador/agência.',
        category: 'video',
        template_text:
          'Vídeo no estilo vlog de bastidores em {ambiente}. Câmera na mão com leve tremor orgânico e ângulo documental. O criador compartilha a rotina de produção de {projeto}, alternando entre tela de trabalho e reflexão sincera em tom {tom}.',
        default_model_id: 'kling-1-5-pro',
        placeholders: ['ambiente', 'projeto', 'tom'],
        is_favorite: false,
        usage_count: 15,
      },
      {
        name: 'Anúncio de Impacto para Tráfego Pago (Direct Response)',
        description:
          'Gancho de quebra de padrão nos primeiros 2s, demonstração de valor e CTA urgente.',
        category: 'video',
        template_text:
          'Criativo de anúncio de alta conversão para {publico_alvo}. Tela com gancho visual disruptivo: "{problema_urgente}". Transição ágil para demonstração dos 3 benefícios de {oferta}, texto de apoio em alto contraste e botão de ação pulsante: "{cta_final}".',
        default_model_id: 'runway-gen3-alpha-turbo',
        placeholders: ['publico_alvo', 'problema_urgente', 'oferta', 'cta_final'],
        is_favorite: false,
        usage_count: 22,
      },
    ]

    // Se temos usuário, associamos a ele; de qualquer modo garantimos que os registros existam
    videoSeedTemplates.forEach((seed) => {
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
          if (firstUserId) {
            record.set('user', firstUserId)
          }
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
        console.log('Aviso ao semear template de vídeo 0081:', err.message)
      }
    })
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter(
        'studio_prompt_templates',
        'category = "video"',
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
