migrate(
  (app) => {
    let usersCol
    try {
      usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    } catch (_) {
      usersCol = app.findCollectionByNameOrId('users')
    }

    if (!app.hasTable('funnel_deals')) {
      const dealsCol = new Collection({
        name: 'funnel_deals',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'title', type: 'text', required: true },
          { name: 'company', type: 'text', required: false },
          { name: 'value', type: 'number', required: false, min: 0 },
          {
            name: 'stage',
            type: 'select',
            required: true,
            values: [
              'lead_captado',
              'contato_feito',
              'proposta_enviada',
              'negociacao',
              'fechado_ganho',
              'fechado_perdido',
            ],
            maxSelect: 1,
          },
          {
            name: 'source',
            type: 'select',
            required: false,
            values: ['Instagram', 'TikTok', 'LinkedIn', 'Indicacao', 'Site', 'Outro'],
            maxSelect: 1,
          },
          { name: 'responsible', type: 'text', required: false },
          { name: 'expected_close_date', type: 'date', required: false },
          { name: 'notes', type: 'text', required: false },
          { name: 'priority', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_funnel_deals_stage ON funnel_deals (stage)',
          'CREATE INDEX idx_funnel_deals_source ON funnel_deals (source)',
          'CREATE INDEX idx_funnel_deals_user ON funnel_deals (user)',
          'CREATE INDEX idx_funnel_deals_created ON funnel_deals (created)',
        ],
      })
      app.save(dealsCol)
    }

    // Exemplos idempotentes
    const initialDeals = [
      {
        title: 'Mentoria Executiva de Social Media & Branding',
        company: 'Escola Conecta Educacional',
        value: 4800,
        stage: 'negociacao',
        source: 'Instagram',
        responsible: 'Ronaldo Barreto',
        expected_close_date: '2026-03-05 18:00:00.000Z',
        notes: 'Interesse forte na reformulação do posicionamento orgânico e conversão de alunos.',
        priority: 'alta',
      },
      {
        title: 'Pacote Produção de Conteúdo Multicanal (Trimestral)',
        company: 'Clínica Bella Pele Estética',
        value: 7500,
        stage: 'proposta_enviada',
        source: 'Indicacao',
        responsible: 'Camila Albuquerque',
        expected_close_date: '2026-03-12 15:00:00.000Z',
        notes: 'Proposta de 12 vídeos/mês + 8 carrosséis estratégicos enviada em PDF.',
        priority: 'media',
      },
      {
        title: 'Assinatura MudarCurso Corporate — 15 Licenças Pro',
        company: 'Agência Alpha Growth',
        value: 12900,
        stage: 'fechado_ganho',
        source: 'LinkedIn',
        responsible: 'Ronaldo Barreto',
        expected_close_date: '2026-02-18 12:00:00.000Z',
        notes: 'Contrato fechado com pagamento à vista via PIX/Asaas. Alunos já integrados.',
        priority: 'alta',
      },
      {
        title: 'Consultoria de Tráfego & Funil de Lançamento',
        company: 'Dra. Vanessa Nutrição & Saúde',
        value: 3200,
        stage: 'lead_captado',
        source: 'TikTok',
        responsible: 'Juliana Pires',
        expected_close_date: '2026-03-20 20:00:00.000Z',
        notes: 'Veio por vídeo viral sobre estratégias de captação de clientes locais.',
        priority: 'media',
      },
    ]

    const col = app.findCollectionByNameOrId('funnel_deals')
    let defaultUserId = ''
    try {
      const firstUser = app.findFirstRecordByFilter('users', 'id != ""')
      if (firstUser) defaultUserId = firstUser.id
    } catch (_) {}

    initialDeals.forEach((deal) => {
      try {
        const existing = app.findFirstRecordByFilter(
          'funnel_deals',
          `title = "${deal.title}" && company = "${deal.company}"`,
        )
        if (!existing) {
          const rec = new Record(col, {
            ...deal,
            user: defaultUserId || undefined,
          })
          app.save(rec)
        }
      } catch (_) {
        const rec = new Record(col, {
          ...deal,
          user: defaultUserId || undefined,
        })
        app.save(rec)
      }
    })
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('funnel_deals')
      app.delete(col)
    } catch (_) {}
  },
)
