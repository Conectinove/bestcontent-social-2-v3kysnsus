migrate(
  (app) => {
    // 1. Atualizar select de source em funnel_deals para incluir 'TikTok Ads'
    try {
      const dealsCol = app.findCollectionByNameOrId('funnel_deals')
      const sourceField = dealsCol.fields.getByName('source')
      if (sourceField) {
        sourceField.values = [
          'Google Ads',
          'Meta Ads',
          'YouTube Ads',
          'TikTok Ads',
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
      console.log('[Migration 0063] Note: updating funnel_deals sources:', err)
    }

    // 2. Adicionar regra de automação comercial para TikTok Ads (se funnel_automations existir)
    let defaultUserId = ''
    try {
      const firstUser = app.findFirstRecordByFilter('users', 'id != ""')
      if (firstUser) defaultUserId = firstUser.id
    } catch (_) {}

    try {
      const automationsCol = app.findCollectionByNameOrId('funnel_automations')
      const rule = {
        rule_key: 'auto_inbound_tiktok_ads',
        name: 'Entrada Automática: TikTok Ads',
        description:
          'Leads gerados via campanhas do TikTok Ads (Spark Ads / Lead Gen Form) entram automaticamente no estágio "Lead captado".',
        enabled: true,
        action_type: 'create_deal',
        target_stage: 'lead_captado',
        days_inactive: 0,
      }

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
    } catch (err) {
      console.log('[Migration 0063] Error creating TikTok Ads automation:', err)
    }
  },
  (app) => {
    try {
      const rec = app.findFirstRecordByFilter(
        'funnel_automations',
        'rule_key = "auto_inbound_tiktok_ads"',
      )
      if (rec) app.delete(rec)
    } catch (_) {}
  },
)
