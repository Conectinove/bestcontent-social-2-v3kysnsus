migrate(
  (app) => {
    // 1. Atualizar select de source em funnel_deals para incluir 'YouTube Ads'
    try {
      const dealsCol = app.findCollectionByNameOrId('funnel_deals')
      const sourceField = dealsCol.fields.getByName('source')
      if (sourceField) {
        sourceField.values = [
          'Google Ads',
          'Meta Ads',
          'YouTube Ads',
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
      console.log('[Migration 0062] Note: updating funnel_deals sources:', err)
    }

    // 2. Expandir regras de automações comerciais de vendas
    let defaultUserId = ''
    try {
      const firstUser = app.findFirstRecordByFilter('users', 'id != ""')
      if (firstUser) defaultUserId = firstUser.id
    } catch (_) {}

    const newRules = [
      {
        rule_key: 'auto_inbound_youtube_ads',
        name: 'Entrada Automática: YouTube Ads',
        description:
          'Leads gerados via campanhas de vídeo do YouTube Ads entram automaticamente no estágio "Lead captado".',
        enabled: true,
        action_type: 'create_deal',
        target_stage: 'lead_captado',
        days_inactive: 0,
      },
      {
        rule_key: 'deal_won_congrats_upsell',
        name: 'Deal Ganho: Parabenizar & Sugerir Upsell/Case',
        description:
          'Quando um negócio é fechado como ganho, sugerir contato de onboarding, coleta de depoimento em vídeo e oferta de upsell.',
        enabled: true,
        action_type: 'won_upsell_reminder',
        target_stage: 'fechado_ganho',
        days_inactive: 0,
      },
      {
        rule_key: 'deal_lost_reactivation_30d',
        name: 'Deal Perdido: Agendar Reativação em 30 Dias',
        description:
          'Oportunidades perdidas são programadas para follow-up de reativação com novas ofertas após 30 dias.',
        enabled: true,
        action_type: 'schedule_reactivation',
        target_stage: 'fechado_perdido',
        days_inactive: 30,
      },
      {
        rule_key: 'negotiation_stale_urgent_alert',
        name: 'Negociação Parada (> 7 dias): Alerta Urgente',
        description:
          'Negociações retendo receita há mais de 7 dias sem avanço recebem prioridade alta e alerta imediato.',
        enabled: true,
        action_type: 'urgent_manager_alert',
        target_stage: 'negociacao',
        days_inactive: 7,
      },
      {
        rule_key: 'pipeline_cold_alert_7d',
        name: 'Pipeline Frio: Nenhum Novo Lead em 7 Dias',
        description:
          'Disparar alerta estratégico quando não houver novos leads captados nos últimos 7 dias, recomendando ativação de anúncios.',
        enabled: true,
        action_type: 'cold_pipeline_warning',
        target_stage: 'lead_captado',
        days_inactive: 7,
      },
      {
        rule_key: 'high_value_deal_priority',
        name: 'Deal de Alto Valor (> Ticket Médio): Prioridade VIP',
        description:
          'Oportunidades com valor superior ao ticket médio da empresa são sinalizadas como Prioridade Alta automaticamente.',
        enabled: true,
        action_type: 'vip_deal_elevation',
        target_stage: 'all',
        days_inactive: 0,
      },
    ]

    try {
      const automationsCol = app.findCollectionByNameOrId('funnel_automations')
      newRules.forEach((rule) => {
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
    } catch (err) {
      console.log('[Migration 0062] Error creating automations:', err)
    }
  },
  (app) => {
    try {
      const keys = [
        'auto_inbound_youtube_ads',
        'deal_won_congrats_upsell',
        'deal_lost_reactivation_30d',
        'negotiation_stale_urgent_alert',
        'pipeline_cold_alert_7d',
        'high_value_deal_priority',
      ]
      keys.forEach((k) => {
        try {
          const rec = app.findFirstRecordByFilter('funnel_automations', `rule_key = "${k}"`)
          if (rec) app.delete(rec)
        } catch (_) {}
      })
    } catch (_) {}
  },
)
