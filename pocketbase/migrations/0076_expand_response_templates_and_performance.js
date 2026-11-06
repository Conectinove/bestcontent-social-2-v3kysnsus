migrate(
  (app) => {
    // 1. Expandir response_templates com campos de métricas de performance
    const respTemplates = app.findCollectionByNameOrId('response_templates')

    if (!respTemplates.fields.getByName('replies_count')) {
      respTemplates.fields.add(
        new NumberField({
          name: 'replies_count',
          required: false,
        }),
      )
    }

    if (!respTemplates.fields.getByName('response_rate')) {
      respTemplates.fields.add(
        new NumberField({
          name: 'response_rate',
          required: false,
        }),
      )
    }

    if (!respTemplates.fields.getByName('last_used_at')) {
      respTemplates.fields.add(
        new DateField({
          name: 'last_used_at',
          required: false,
        }),
      )
    }

    // Atualizar category para TextField ou SelectField com novas categorias
    // Como SelectField existente tem valores fixos, podemos substituir o campo ou redefinir values
    const oldCat = respTemplates.fields.getByName('category')
    if (oldCat) {
      respTemplates.fields.removeByName('category')
      respTemplates.fields.add(
        new SelectField({
          name: 'category',
          required: true,
          values: [
            'agradecimento',
            'objecao_preco',
            'suporte',
            'spam',
            'fora_escopo',
            'geral',
            'follow_up',
            'promocao',
            'pos_venda',
            'reativacao',
            'depoimento',
            'comentario_negativo',
            'indicacao',
          ],
          maxSelect: 1,
        }),
      )
    }

    // Expandir redes permitidas
    const oldNet = respTemplates.fields.getByName('network')
    if (oldNet) {
      respTemplates.fields.removeByName('network')
      respTemplates.fields.add(
        new SelectField({
          name: 'network',
          required: false,
          values: [
            'todas',
            'instagram',
            'facebook',
            'twitter',
            'whatsapp',
            'linkedin',
            'tiktok',
            'youtube',
            'pinterest',
            'threads',
            'bluesky',
            'snapchat',
          ],
          maxSelect: 1,
        }),
      )
    }

    app.save(respTemplates)

    // 2. Novos templates de resposta prontos cobrindo situações demandadas
    const newTemplates = [
      {
        title: 'Follow-up atencioso pós-atendimento',
        category: 'follow_up',
        network: 'todas',
        shortcut: '/followup',
        content:
          'Olá {nome}! Passando para saber se deu tudo certo com a sua solicitação anterior. Se ainda restar qualquer dúvida ou se precisar de mais detalhes, estamos à disposição por aqui! 💬✨',
        usage_count: 5,
        replies_count: 4,
        response_rate: 80.0,
      },
      {
        title: 'Promoção e lançamento exclusivo',
        category: 'promocao',
        network: 'todas',
        shortcut: '/promo',
        content:
          'Oi {nome}! Que bom que gostou! Estamos com uma condição exclusiva de lançamento por tempo limitado para nossa comunidade. Te mandamos o cupom especial e o link de acesso direto no seu direct/DM! 🎁🚀',
        usage_count: 9,
        replies_count: 7,
        response_rate: 77.8,
      },
      {
        title: 'Agradecimento pós-venda caloroso',
        category: 'pos_venda',
        network: 'todas',
        shortcut: '/posvenda',
        content:
          '{nome}, ficamos imensamente felizes em ter você como cliente da {empresa}! Nosso compromisso é com o seu sucesso diário. Conte com nosso time em cada etapa da sua jornada! 🤝💙',
        usage_count: 14,
        replies_count: 12,
        response_rate: 85.7,
      },
      {
        title: 'Reativação de cliente inativo com convite',
        category: 'reativacao',
        network: 'todas',
        shortcut: '/reativar',
        content:
          'Olá {nome}, estávamos com saudades de ver você por aqui! Preparamos novidades incríveis e novos recursos que vão acelerar seus resultados. Quando puder, nos mande um "oi" na DM que temos um presente para você! ✨',
        usage_count: 6,
        replies_count: 4,
        response_rate: 66.7,
      },
      {
        title: 'Coleta de depoimento e feedback sincero',
        category: 'depoimento',
        network: 'todas',
        shortcut: '/depoimento',
        content:
          'Oi {nome}! Seu relato nos deixou com o coração aquecido! Podemos compartilhar esse feedback nos nossos stories/destaques mantendo você marcado(a)? Seria uma honra inspirar outras pessoas com a sua história! 🌟',
        usage_count: 11,
        replies_count: 10,
        response_rate: 90.9,
      },
      {
        title: 'Resposta desarmadora a comentário negativo',
        category: 'comentario_negativo',
        network: 'todas',
        shortcut: '/ouvir',
        content:
          'Olá {nome}, lamentamos sinceramente que sua experiência não tenha atingido o padrão que prezamos. Queremos ouvir você com total atenção e resolver essa questão de forma prioritária. Te chamamos no direct agora mesmo para cuidar disso pessoalmente.',
        usage_count: 7,
        replies_count: 6,
        response_rate: 85.7,
      },
      {
        title: 'Indicação premiada e indicação recompensada',
        category: 'indicacao',
        network: 'todas',
        shortcut: '/indica',
        content:
          '{nome}, sabia que ao indicar um amigo ou colega para a {empresa}, vocês dois ganham benefícios exclusivos na nossa plataforma? Acesse nosso link ou fale conosco no WhatsApp para resgatar sua recompensa de indicação! 🎁🔥',
        usage_count: 4,
        replies_count: 3,
        response_rate: 75.0,
      },
    ]

    for (const t of newTemplates) {
      try {
        const existing = app.findFirstRecordByFilter(
          'response_templates',
          `title = "${t.title.replace(/"/g, '\\"')}"`,
        )
        if (existing) continue
      } catch (_) {
        // não encontrado, pode criar
      }

      const record = new Record(respTemplates)
      record.set('title', t.title)
      record.set('content', t.content)
      record.set('category', t.category)
      record.set('network', t.network)
      record.set('shortcut', t.shortcut)
      record.set('is_global', true)
      record.set('usage_count', t.usage_count)
      record.set('replies_count', t.replies_count)
      record.set('response_rate', t.response_rate)
      app.save(record)
    }
  },
  (app) => {
    // Rollback
  },
)
