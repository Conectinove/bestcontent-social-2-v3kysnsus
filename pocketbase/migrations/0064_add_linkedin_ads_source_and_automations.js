migrate(
  (app) => {
    // 1. Atualizar select de source em funnel_deals para incluir 'LinkedIn Ads'
    try {
      const dealsCol = app.findCollectionByNameOrId('funnel_deals')
      const sourceField = dealsCol.fields.getByName('source')
      if (sourceField) {
        sourceField.values = [
          'Google Ads',
          'Meta Ads',
          'YouTube Ads',
          'TikTok Ads',
          'LinkedIn Ads',
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
      console.log('[Migration 0064] Note: updating funnel_deals sources:', err)
    }

    // 2. Adicionar regras de automação comercial para LinkedIn Ads (se funnel_automations existir)
    let defaultUserId = ''
    try {
      const firstUser = app.findFirstRecordByFilter('users', 'id != ""')
      if (firstUser) defaultUserId = firstUser.id
    } catch (_) {}

    try {
      const automationsCol = app.findCollectionByNameOrId('funnel_automations')
      const newRules = [
        {
          rule_key: 'auto_inbound_linkedin_ads',
          name: 'Entrada Automática: LinkedIn Ads',
          description:
            'Leads gerados via campanhas do LinkedIn Ads (Lead Gen Forms / Sponsored InMail) entram automaticamente no estágio "Lead captado".',
          enabled: true,
          action_type: 'create_deal',
          target_stage: 'lead_captado',
          days_inactive: 0,
        },
        {
          rule_key: 'linkedin_ads_stale_followup',
          name: 'Alerta Follow-up B2B: Lead LinkedIn Ads (> 3 dias)',
          description:
            'Leads B2B qualificados via LinkedIn Ads sem movimentação há 3 dias recebem sinalização prioritária de follow-up com decisor.',
          enabled: true,
          action_type: 'flag_followup',
          target_stage: 'contato_feito',
          days_inactive: 3,
        },
        {
          rule_key: 'linkedin_ads_proposal_priority',
          name: 'Prioridade Alta: Proposta LinkedIn Ads (> 5 dias)',
          description:
            'Propostas comerciais B2B enviadas para leads originados de LinkedIn Ads há 5+ dias sem retorno têm prioridade elevada para Alta.',
          enabled: true,
          action_type: 'high_priority_elevation',
          target_stage: 'proposta_enviada',
          days_inactive: 5,
        },
      ]

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
      console.log('[Migration 0064] Error creating LinkedIn Ads automations:', err)
    }
  },
  (app) => {
    try {
      const keys = [
        'auto_inbound_linkedin_ads',
        'linkedin_ads_stale_followup',
        'linkedin_ads_proposal_priority',
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
