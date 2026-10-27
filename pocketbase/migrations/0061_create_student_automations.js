migrate(
  (app) => {
    let usersCol
    try {
      usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    } catch (_) {
      usersCol = app.findCollectionByNameOrId('users')
    }

    // Criar coleção student_automations se não existir
    if (!app.hasTable('student_automations')) {
      const autoCol = new Collection({
        name: 'student_automations',
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
          { name: 'days_threshold', type: 'number', required: false, min: 0 },
          { name: 'threshold_value', type: 'number', required: false, min: 0 },
          { name: 'action_type', type: 'text', required: false },
          { name: 'config_json', type: 'json', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_student_auto_user ON student_automations (user)',
          'CREATE INDEX idx_student_auto_key ON student_automations (rule_key)',
          'CREATE INDEX idx_student_auto_enabled ON student_automations (enabled)',
        ],
      })
      app.save(autoCol)
    }

    // Regras padrão pedidas na especificação
    const defaultStudentRules = [
      {
        rule_key: 'at_risk_alert',
        name: 'Aluno em Risco → Alerta In-App Automático',
        description:
          'Identifica alunos com status "em_risco" e gera alerta prioritário na central de notificações.',
        enabled: true,
        action_type: 'in_app_alert',
        days_threshold: 0,
        threshold_value: 0,
      },
      {
        rule_key: 'no_progress_14d',
        name: 'Aluno Sem Progresso há 14+ Dias → Lembrete de Retomada',
        description:
          'Dispara notificação de reengajamento para alunos ativos sem evolução recente há mais de 14 dias.',
        enabled: true,
        action_type: 'reminder_push',
        days_threshold: 14,
        threshold_value: 0,
      },
      {
        rule_key: 'new_student_welcome',
        name: 'Novo Aluno Matriculado → Mensagem de Boas-Vindas',
        description:
          'Envia mensagem calorosa de boas-vindas com orientações da trilha letiva para alunos recém-inscritos.',
        enabled: true,
        action_type: 'welcome_message',
        days_threshold: 3,
        threshold_value: 0,
      },
      {
        rule_key: 'high_progress_next_course',
        name: 'Aluno com Progresso >= 90% → Sugestão de Certificado & Próximo Curso',
        description:
          'Orienta emissão de certificado e recomenda curso de continuidade ou upsell quando o aluno atinge 90%+ do curso.',
        enabled: true,
        action_type: 'upsell_certificate',
        days_threshold: 0,
        threshold_value: 90,
      },
      {
        rule_key: 'low_completion_manager_summary',
        name: 'Taxa de Conclusão Abaixo da Meta (X%) → Resumo Semanal para o Gestor',
        description:
          'Sinaliza a liderança e equipe pedagógica quando a taxa média de conclusão da turma estiver abaixo do percentual configurado.',
        enabled: true,
        action_type: 'manager_weekly_digest',
        days_threshold: 7,
        threshold_value: 65,
      },
    ]

    let defaultUserId = ''
    try {
      const firstUser = app.findFirstRecordByFilter('users', 'id != ""')
      if (firstUser) defaultUserId = firstUser.id
    } catch (_) {}

    const automationsCol = app.findCollectionByNameOrId('student_automations')
    defaultStudentRules.forEach((rule) => {
      try {
        const existing = app.findFirstRecordByFilter(
          'student_automations',
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
      const col = app.findCollectionByNameOrId('student_automations')
      app.delete(col)
    } catch (_) {}
  },
)
