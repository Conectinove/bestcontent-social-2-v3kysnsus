migrate(
  (app) => {
    let usersCol
    try {
      usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    } catch (_) {
      usersCol = app.findCollectionByNameOrId('users')
    }

    if (!app.hasTable('students')) {
      const studentsCol = new Collection({
        name: 'students',
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
          { name: 'name', type: 'text', required: true },
          { name: 'email', type: 'email', required: false },
          { name: 'phone', type: 'text', required: false },
          { name: 'course', type: 'text', required: true },
          { name: 'cohort', type: 'text', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['ativo', 'concluido', 'em_risco', 'pausado', 'cancelado'],
            maxSelect: 1,
          },
          { name: 'enrollment_date', type: 'date', required: false },
          { name: 'progress', type: 'number', required: false, min: 0, max: 100 },
          { name: 'last_access_at', type: 'date', required: false },
          { name: 'notes', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_students_status ON students (status)',
          'CREATE INDEX idx_students_course ON students (course)',
          'CREATE INDEX idx_students_user ON students (user)',
          'CREATE INDEX idx_students_enrollment_date ON students (enrollment_date)',
        ],
      })
      app.save(studentsCol)
    }

    // Popula registros de exemplo idempotentes para o dashboard não ficar vazio
    const initialStudents = [
      {
        name: 'Camila Albuquerque Silva',
        email: 'camila.albuquerque@email.com',
        phone: '(11) 98765-4321',
        course: 'MudarCurso: Formação Copywriter & Social Media Pro',
        cohort: 'Turma Alpha 2026',
        status: 'ativo',
        enrollment_date: '2026-01-10 14:00:00.000Z',
        progress: 82,
        last_access_at: '2026-02-18 10:30:00.000Z',
        notes: 'Aluna altamente engajada, concluindo módulo de automação editorial.',
      },
      {
        name: 'Rodrigo Medeiros Fontes',
        email: 'rodrigo.fontes@techbrand.com',
        phone: '(21) 97654-3210',
        course: 'MudarCurso: Formação Copywriter & Social Media Pro',
        cohort: 'Turma Alpha 2026',
        status: 'ativo',
        enrollment_date: '2026-01-14 09:15:00.000Z',
        progress: 68,
        last_access_at: '2026-02-19 14:20:00.000Z',
        notes: 'Participa das mentorias ao vivo semanalmente.',
      },
      {
        name: 'Juliana Pires Rezende',
        email: 'juliana.rezende@designstudio.art',
        phone: '(31) 99123-4567',
        course: 'Branding & Identidade Visual de Alto Impacto',
        cohort: 'Turma Express Jan/26',
        status: 'concluido',
        enrollment_date: '2025-11-20 16:45:00.000Z',
        progress: 100,
        last_access_at: '2026-02-15 18:00:00.000Z',
        notes: 'Certificado emitido e portfólio validado com nota 9.8.',
      },
      {
        name: 'Lucas Ferreira Guimarães',
        email: 'lucas.guimaraes@agenciacriativa.com.br',
        phone: '(41) 98877-6655',
        course: 'Growth Orgânico & Tráfego Pago Multi-Plataforma',
        cohort: 'Turma Beta Fev/26',
        status: 'ativo',
        enrollment_date: '2026-02-01 11:00:00.000Z',
        progress: 45,
        last_access_at: '2026-02-19 08:45:00.000Z',
        notes: 'Implementando campanhas práticas com Pixel e UTMs.',
      },
      {
        name: 'Mariana Duarte Souza',
        email: 'mariana.duarte@educaonline.io',
        phone: '(19) 97112-3344',
        course: 'MudarCurso: Formação Copywriter & Social Media Pro',
        cohort: 'Turma Alpha 2026',
        status: 'em_risco',
        enrollment_date: '2026-01-08 15:30:00.000Z',
        progress: 18,
        last_access_at: '2026-01-26 19:10:00.000Z',
        notes: 'Sem acessos nos últimos 20 dias; disparo de e-mail de reativação pendente.',
      },
      {
        name: 'Felipe Barreto Lima',
        email: 'felipe.barreto@creatorhub.com',
        phone: '(81) 99881-2233',
        course: 'Branding & Identidade Visual de Alto Impacto',
        cohort: 'Turma Express Jan/26',
        status: 'concluido',
        enrollment_date: '2025-12-02 10:00:00.000Z',
        progress: 100,
        last_access_at: '2026-02-10 11:20:00.000Z',
        notes: 'Concluiu projeto prático de reformulação de marca.',
      },
      {
        name: 'Beatriz Vasconcelos Ramos',
        email: 'beatriz.vasconcelos@midiaedu.com',
        phone: '(61) 98456-7890',
        course: 'Growth Orgânico & Tráfego Pago Multi-Plataforma',
        cohort: 'Turma Beta Fev/26',
        status: 'ativo',
        enrollment_date: '2026-02-05 14:10:00.000Z',
        progress: 32,
        last_access_at: '2026-02-18 21:00:00.000Z',
        notes: 'Aluna da turma recente, avançando nos módulos de TikTok e Reels.',
      },
      {
        name: 'Thiago Nogueira Ramos',
        email: 'thiago.nogueira@vendasexpress.com',
        phone: '(48) 99654-1122',
        course: 'MudarCurso: Formação Copywriter & Social Media Pro',
        cohort: 'Turma Alpha 2026',
        status: 'pausado',
        enrollment_date: '2026-01-12 17:00:00.000Z',
        progress: 25,
        last_access_at: '2026-02-02 12:00:00.000Z',
        notes: 'Trancou matrícula temporariamente por motivo de viagem.',
      },
    ]

    const col = app.findCollectionByNameOrId('students')
    let defaultUserId = ''
    try {
      const firstUser = app.findFirstRecordByFilter('users', 'id != ""')
      if (firstUser) defaultUserId = firstUser.id
    } catch (_) {}

    initialStudents.forEach((st) => {
      try {
        const existing = app.findFirstRecordByFilter(
          'students',
          `email = "${st.email}" && course = "${st.course}"`,
        )
        if (!existing) {
          const rec = new Record(col, {
            ...st,
            user: defaultUserId || undefined,
          })
          app.save(rec)
        }
      } catch (_) {
        const rec = new Record(col, {
          ...st,
          user: defaultUserId || undefined,
        })
        app.save(rec)
      }
    })
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('students')
      app.delete(col)
    } catch (_) {}
  },
)
