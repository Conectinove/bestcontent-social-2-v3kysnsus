migrate(
  (app) => {
    let usersCol
    try {
      usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    } catch (_) {
      usersCol = app.findCollectionByNameOrId('users')
    }

    // 1. Atualizar select de source em funnel_deals para suportar 'Google Ads' e 'Meta Ads'
    try {
      const dealsCol = app.findCollectionByNameOrId('funnel_deals')
      const sourceField = dealsCol.fields.getByName('source')
      if (sourceField) {
        sourceField.values = [
          'Google Ads',
          'Meta Ads',
          'Instagram',
          'TikTok',
          'LinkedIn',
          'Indicacao',
          'Site',
          'Outro',
        ]
        app.save(dealsCol)
      }
    } catch (err) {
      console.log('[Migration 0060] Note: updating funnel_deals sources:', err)
    }

    // 2. Criar coleção funnel_automations para persistir regras de automação
    if (!app.hasTable('funnel_automations')) {
      const autoCol = new Collection({
        name: 'funnel_automations',
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
          { name: 'rule_key', type: 'text', required: true },
          { name: 'name', type: 'text', required: true },
          { name: 'description', type: 'text', required: false },
          { name: 'enabled', type: 'bool', required: false },
          { name: 'days_inactive', type: 'number', required: false, min: 1 },
          { name: 'action_type', type: 'text', required: false },
          { name: 'target_stage', type: 'text', required: false },
          { name: 'config_json', type: 'json', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_funnel_auto_user ON funnel_automations (user)',
          'CREATE INDEX idx_funnel_auto_key ON funnel_automations (rule_key)',
          'CREATE INDEX idx_funnel_auto_enabled ON funnel_automations (enabled)',
        ],
      })
      app.save(autoCol)
    }

    // 3. Regras padrão iniciais para o usuário principal
    const defaultRules = [
      {
        rule_key: 'auto_inbound_ads',
        name: 'Entrada Automática: Google Ads & Campanhas',
        description:
          'Leads gerados via Google Ads ou formulários entram diretamente no estágio "Lead captado".',
        enabled: true,
        action_type: 'create_deal',
        target_stage: 'lead_captado',
        days_inactive: 0,
      },
      {
        rule_key: 'stale_proposal_followup',
        name: 'Alerta de Proposta Parada (> 5 dias)',
        description:
          'Se uma proposta ficar mais de 5 dias sem resposta, marcar prioridade alta e gerar alerta de follow-up.',
        enabled: true,
        action_type: 'flag_followup',
        target_stage: 'proposta_enviada',
        days_inactive: 5,
      },
      {
        rule_key: 'stale_lead_reminder',
        name: 'Aceleração de Primeiro Contato (> 2 dias)',
        description:
          'Criar lembrete in-app para leads captados sem contato feito há mais de 48 horas.',
        enabled: true,
        action_type: 'in_app_reminder',
        target_stage: 'lead_captado',
        days_inactive: 2,
      },
      {
        rule_key: 'auto_negotiation_close',
        name: 'Sinalizar Fechamento em Negociação (> 10 dias)',
        description:
          'Negociações em andamento por mais de 10 dias recebem sugestão de bônus ou desconto de fechamento.',
        enabled: false,
        action_type: 'prescribe_closing_offer',
        target_stage: 'negociacao',
        days_inactive: 10,
      },
    ]

    let defaultUserId = ''
    try {
      const firstUser = app.findFirstRecordByFilter('users', 'id != ""')
      if (firstUser) defaultUserId = firstUser.id
    } catch (_) {}

    const automationsCol = app.findCollectionByNameOrId('funnel_automations')
    defaultRules.forEach((rule) => {
      try {
        const existing = app.findFirstRecordByFilter(
          'funnel_automations',
          `rule_key = "${rule.rule_key}"`,
        )
        if (!existing) {
          const rec = new Record(automationsCol, {
            ...rule,
            user: defaultUserId || undefined,
          })
          app.save(rec)
        }
      } catch (_) {
        const rec = new Record(automationsCol, {
          ...rule,
          user: defaultUserId || undefined,
        })
        app.save(rec)
      }
    })
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('funnel_automations')
      app.delete(col)
    } catch (_) {}
  },
)
