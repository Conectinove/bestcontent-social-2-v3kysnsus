migrate(
  (app) => {
    // 1. Criar coleção response_templates
    const responseTemplates = new Collection({
      name: 'response_templates',
      type: 'base',
      listRule: "@request.auth.id != '' && (user = @request.auth.id || is_global = true)",
      viewRule: "@request.auth.id != '' && (user = @request.auth.id || is_global = true)",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          required: true,
          values: ['agradecimento', 'objecao_preco', 'suporte', 'spam', 'fora_escopo', 'geral'],
          maxSelect: 1,
        },
        {
          name: 'network',
          type: 'select',
          required: false,
          values: ['todas', 'instagram', 'facebook', 'twitter', 'whatsapp', 'linkedin', 'tiktok'],
          maxSelect: 1,
        },
        { name: 'shortcut', type: 'text', required: false },
        { name: 'is_global', type: 'bool', required: false },
        { name: 'usage_count', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_resp_templates_user ON response_templates (user)',
        'CREATE INDEX idx_resp_templates_cat ON response_templates (category)',
      ],
    })
    app.save(responseTemplates)

    // 2. Expandir scheduled_posts com suporte a agendamento recorrente e janela
    const schedCol = app.findCollectionByNameOrId('scheduled_posts')
    if (!schedCol.fields.getByName('recurrence')) {
      schedCol.fields.add(
        new SelectField({
          name: 'recurrence',
          required: false,
          values: ['none', 'daily', 'weekly', 'biweekly', 'monthly'],
          maxSelect: 1,
        }),
      )
    }
    if (!schedCol.fields.getByName('recurrence_days')) {
      schedCol.fields.add(new JSONField({ name: 'recurrence_days', required: false }))
    }
    if (!schedCol.fields.getByName('recurrence_time')) {
      schedCol.fields.add(new TextField({ name: 'recurrence_time', required: false }))
    }
    if (!schedCol.fields.getByName('target_network')) {
      schedCol.fields.add(new TextField({ name: 'target_network', required: false }))
    }
    if (!schedCol.fields.getByName('queue_position')) {
      schedCol.fields.add(new NumberField({ name: 'queue_position', required: false }))
    }
    if (!schedCol.fields.getByName('next_run_at')) {
      schedCol.fields.add(new DateField({ name: 'next_run_at', required: false }))
    }
    app.save(schedCol)

    // 3. Seed inicial com ~8 templates úteis em PT-BR
    const defaultTemplates = [
      {
        title: 'Agradecimento carinhoso',
        category: 'agradecimento',
        network: 'todas',
        shortcut: '/obrigado',
        content:
          'Olá {nome}! Muito obrigado pelo carinho e por acompanhar nosso conteúdo. É um prazer ter você por aqui! ✨💛',
      },
      {
        title: 'Objeção de preço com valor e condições',
        category: 'objecao_preco',
        network: 'todas',
        shortcut: '/preco',
        content:
          'Oi {nome}, tudo bem? Compreendemos sua consideração! Nossos planos incluem suporte dedicado, atualizações contínuas e garantia de satisfação. Te chamei no direct/DM para mostrar uma condição especial personalizada para você!',
      },
      {
        title: 'Suporte e direcionamento para atendimento',
        category: 'suporte',
        network: 'todas',
        shortcut: '/suporte',
        content:
          'Olá {nome}! Sentimos muito por qualquer inconveniente. Nossa equipe de suporte está pronta para te ajudar a resolver isso agora mesmo. Por favor, envie os detalhes no nosso WhatsApp ou via DM com seu e-mail de cadastro!',
      },
      {
        title: 'Spam ou comentário impróprio educado',
        category: 'spam',
        network: 'todas',
        shortcut: '/spam',
        content:
          'Agradecemos a visita, mas lembramos que este espaço é reservado para conversas e dúvidas sobre nosso conteúdo. Links e divulgações externas não são permitidos por aqui.',
      },
      {
        title: 'Fora do escopo / Encaminhamento amigável',
        category: 'fora_escopo',
        network: 'todas',
        shortcut: '/escopo',
        content:
          'Olá {nome}! Essa dúvida é super relevante, porém foge um pouco do escopo deste post. Sugerimos conferir nosso link na bio ou nosso canal de suporte para um atendimento mais aprofundado sobre o assunto!',
      },
      {
        title: 'Convidar para o Direct / WhatsApp',
        category: 'geral',
        network: 'todas',
        shortcut: '/direct',
        content:
          'Oi {nome}! Adoramos sua pergunta. Para te passar todas as informações e tirar dúvidas em detalhes, te mandamos uma mensagem no direct. Dá uma olhada lá! 📲',
      },
      {
        title: 'Elogio recíproco e engajamento',
        category: 'agradecimento',
        network: 'todas',
        shortcut: '/elogio',
        content:
          '{nome}, que comentário incrível! Feedbacks como o seu nos motivam a produzir conteúdos cada vez melhores. Já compartilhou com alguém que também precisa ver isso hoje? 🚀',
      },
      {
        title: 'Dúvida sobre horário e prazos',
        category: 'suporte',
        network: 'todas',
        shortcut: '/horario',
        content:
          'Olá {nome}! Nosso atendimento funciona de segunda a sexta, das 09h às 18h. Se sua mensagem foi enviada fora desse período, responderemos assim que abrirmos com prioridade total!',
      },
    ]

    for (const t of defaultTemplates) {
      const record = new Record(responseTemplates)
      record.set('title', t.title)
      record.set('content', t.content)
      record.set('category', t.category)
      record.set('network', t.network)
      record.set('shortcut', t.shortcut)
      record.set('is_global', true)
      record.set('usage_count', 0)
      app.save(record)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('response_templates')
      app.delete(col)
    } catch (_) {}
  },
)
