migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('onboarding_completed')) {
      users.fields.add(new BoolField({ name: 'onboarding_completed' }))
    }
    app.save(users)

    // Seed/adjust sample brands to match reference 2 exactly:
    // 1. MudarCurso ("MudarCurso é uma plataforma de curs...")
    // 2. Ronaldo Barreto ("Ronaldo Barreto é um empreendedor, mento...")
    // 3. 36 Copa Rotary/Cresol 2026 ("A Copa Rotary é um evento esportivo benefi...")
    // 4. Conectinove Profissões Lucrativas ("A Conectinove se dedica a capacitar indivíd...")
    // 5. MudarCurso.com.br ("A Jornada Começa Dentro de Você Você qu...")
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
      if (admin) {
        const brandsCol = app.findCollectionByNameOrId('brands')

        const demoBrands = [
          {
            name: 'MudarCurso',
            description:
              'MudarCurso é uma plataforma de cursos e desenvolvimento de novos caminhos profissionais.',
            color_theme: '#7C3AED',
            website: 'https://www.mudarcurso.com.br',
            website_url: 'https://www.mudarcurso.com.br',
            instagram: '@mudarcurso',
          },
          {
            name: 'Ronaldo Barreto',
            description:
              'Ronaldo Barreto é um empreendedor, mentor e estrategista de inovação e educação.',
            color_theme: '#2563EB',
            website: 'https://www.ronaldobarreto.com.br',
            website_url: 'https://www.ronaldobarreto.com.br',
            instagram: '@ronaldobarreto',
          },
          {
            name: '36 Copa Rotary/Cresol 2026',
            description:
              'A Copa Rotary é um evento esportivo beneficente tradicional de integração comunitária.',
            color_theme: '#EA580C',
            website: 'https://www.coparotary.org.br',
            website_url: 'https://www.coparotary.org.br',
            instagram: '@coparotary2026',
          },
          {
            name: 'Conectinove Profissões Lucrativas',
            description:
              'A Conectinove se dedica a capacitar indivíduos para o mercado digital e profissões em alta.',
            color_theme: '#DB2777',
            website: 'https://www.conectinove.com.br',
            website_url: 'https://www.conectinove.com.br',
            instagram: '@conectinove',
          },
          {
            name: 'MudarCurso.com.br',
            description:
              'A Jornada Começa Dentro de Você Você que quer transformar seu futuro agora.',
            color_theme: '#6D28D9',
            website: 'https://www.mudarcurso.com.br',
            website_url: 'https://www.mudarcurso.com.br',
            instagram: '@mudarcurso.oficial',
          },
        ]

        for (const b of demoBrands) {
          try {
            const existing = app.findFirstRecordByData('brands', 'name', b.name)
            if (existing) {
              existing.set('description', b.description)
              existing.set('color_theme', b.color_theme)
              existing.set('website', b.website)
              existing.set('website_url', b.website_url)
              if (b.instagram) existing.set('instagram', b.instagram)
              app.save(existing)
            }
          } catch (_) {
            const rec = new Record(brandsCol)
            rec.set('user', admin.id)
            rec.set('name', b.name)
            rec.set('description', b.description)
            rec.set('color_theme', b.color_theme)
            rec.set('website', b.website)
            rec.set('website_url', b.website_url)
            rec.set('instagram', b.instagram)
            app.save(rec)
          }
        }
      }
    } catch (_) {}
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const f = users.fields.getByName('onboarding_completed')
    if (f) {
      users.fields.remove(f)
      app.save(users)
    }
  },
)
