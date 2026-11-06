migrate(
  (app) => {
    // 1. Coleção studio_prompt_history
    let historyCol
    try {
      historyCol = app.findCollectionByNameOrId('studio_prompt_history')
    } catch (_) {
      historyCol = null
    }

    if (!historyCol) {
      const col = new Collection({
        name: 'studio_prompt_history',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'user',
            type: 'text',
            required: false,
          },
          {
            name: 'prompt',
            type: 'text',
            required: true,
          },
          {
            name: 'media_type',
            type: 'text',
            required: false,
          },
          {
            name: 'model_id',
            type: 'text',
            required: false,
          },
          {
            name: 'model_name',
            type: 'text',
            required: false,
          },
          {
            name: 'quality_tier',
            type: 'text',
            required: false,
          },
          {
            name: 'relative_cost',
            type: 'number',
            required: false,
          },
          {
            name: 'aspect_ratio',
            type: 'text',
            required: false,
          },
        ],
      })
      app.save(col)
    }

    // 2. Coleção studio_projects
    let projectsCol
    try {
      projectsCol = app.findCollectionByNameOrId('studio_projects')
    } catch (_) {
      projectsCol = null
    }

    if (!projectsCol) {
      const col2 = new Collection({
        name: 'studio_projects',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'user',
            type: 'text',
            required: false,
          },
          {
            name: 'title',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            type: 'text',
            required: false,
          },
          {
            name: 'current_type',
            type: 'text',
            required: false,
          },
          {
            name: 'prompt',
            type: 'text',
            required: false,
          },
          {
            name: 'model_id',
            type: 'text',
            required: false,
          },
          {
            name: 'quality_tier',
            type: 'text',
            required: false,
          },
          {
            name: 'attached_assets',
            type: 'json',
            required: false,
          },
          {
            name: 'collaborators',
            type: 'json',
            required: false,
          },
          {
            name: 'comments',
            type: 'json',
            required: false,
          },
          {
            name: 'status',
            type: 'text',
            required: false,
          },
        ],
      })
      app.save(col2)
    }

    // 3. Adicionar novos templates de vídeo em studio_prompt_templates
    let templateCol
    try {
      templateCol = app.findCollectionByNameOrId('studio_prompt_templates')
    } catch (_) {
      templateCol = null
    }

    if (templateCol) {
      const extraTemplates = [
        {
          name: 'Antes e Depois de Transformação',
          description: 'Efeito Split Screen revelando o contraste do problema e o resultado final.',
          category: 'video',
          template_text:
            'Cena dividida de Antes e Depois em {nicho}: lado esquerdo em tons frios mostrando a frustração com {problema}, lado direito com transição luminosa dinâmica revelando a transformação espetacular com {produto}. Tom {tom} e gancho final com CTA direto.',
          default_model_id: 'kling-4-0',
          placeholders: ['nicho', 'problema', 'produto', 'tom'],
          is_favorite: true,
        },
        {
          name: 'Depoimento de Cliente Satisfeito (Prova Social)',
          description: 'Entrevista espontânea com B-roll do produto em uso e legendas cinéticas.',
          category: 'video',
          template_text:
            'Depoimento espontâneo em plano médio de cliente falando sobre {produto}: "No começo eu duvidava de {tema}, mas em poucas semanas vi resultados reais". Cortes com B-roll demonstrando o uso em {ambiente}, iluminação aconchegante e CTA convidando para conhecer.',
          default_model_id: 'semente-2-5',
          placeholders: ['produto', 'tema', 'ambiente'],
          is_favorite: true,
        },
        {
          name: 'Unboxing Estético & Textura de Produto',
          description:
            'Abertura de embalagem em slow-motion com som imersivo e acabamento premium.',
          category: 'video',
          template_text:
            'Unboxing cinematográfico de {produto} em superfície minimalista de mármore. Câmera macro 60fps focando na retirada do lacre, textura do material e revelação do design. Iluminação suave de estúdio em tom {tom} e logotipo animado ao final.',
          default_model_id: 'video-flux-3',
          placeholders: ['produto', 'tom'],
          is_favorite: false,
        },
        {
          name: 'Storytelling de Marca & Manifesto de Agência',
          description: 'Roteiro inspirador com cortes dinâmicos conectando propósito e resultado.',
          category: 'video',
          template_text:
            'Vídeo institucional estilo manifesto sobre a missão de {marca}. Sequência de cenas urbanas e de equipe em ritmo acelerado demonstrando a superação em {mercado}. Narração forte em tom {tom} com trilha épica crescente e assinatura final: "{slogan}".',
          default_model_id: 'kling-4-0',
          placeholders: ['marca', 'mercado', 'tom', 'slogan'],
          is_favorite: true,
        },
      ]

      for (const t of extraTemplates) {
        try {
          const rec = new Record(templateCol)
          rec.set('name', t.name)
          rec.set('description', t.description)
          rec.set('category', t.category)
          rec.set('template_text', t.template_text)
          rec.set('default_model_id', t.default_model_id)
          rec.set('placeholders', t.placeholders)
          rec.set('is_favorite', t.is_favorite)
          app.save(rec)
        } catch (_) {}
      }
    }
  },
  (app) => {
    try {
      const hCol = app.findCollectionByNameOrId('studio_prompt_history')
      if (hCol) app.delete(hCol)
    } catch (_) {}
    try {
      const pCol = app.findCollectionByNameOrId('studio_projects')
      if (pCol) app.delete(pCol)
    } catch (_) {}
  },
)
