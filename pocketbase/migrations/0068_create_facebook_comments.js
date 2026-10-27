migrate(
  (app) => {
    let usersCol
    try {
      usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    } catch (_) {
      usersCol = app.findCollectionByNameOrId('users')
    }

    let postsCol = null
    try {
      postsCol = app.findCollectionByNameOrId('posts')
    } catch (_) {}

    if (!app.hasTable('facebook_comments')) {
      const commentsCol = new Collection({
        name: 'facebook_comments',
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
          ...(postsCol
            ? [
                {
                  name: 'post',
                  type: 'relation',
                  required: false,
                  collectionId: postsCol.id,
                  cascadeDelete: false,
                  maxSelect: 1,
                },
              ]
            : []),
          { name: 'fb_comment_id', type: 'text', required: false },
          { name: 'author_handle', type: 'text', required: true },
          { name: 'author_name', type: 'text', required: false },
          { name: 'author_avatar', type: 'text', required: false },
          { name: 'text', type: 'text', required: true },
          { name: 'post_title', type: 'text', required: false },
          { name: 'post_thumbnail', type: 'text', required: false },
          { name: 'post_permalink', type: 'text', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['novo', 'respondido', 'ignorado'],
            maxSelect: 1,
          },
          { name: 'reply_text', type: 'text', required: false },
          { name: 'replied_at', type: 'date', required: false },
          { name: 'likes_count', type: 'number', required: false, min: 0 },
          { name: 'is_official', type: 'bool', required: false },
          { name: 'commented_at', type: 'date', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_fb_comments_status ON facebook_comments (status)',
          'CREATE INDEX idx_fb_comments_author ON facebook_comments (author_handle)',
          'CREATE INDEX idx_fb_comments_created ON facebook_comments (created)',
        ],
      })
      app.save(commentsCol)
    }

    // Seeding inicial calibrado idempotente coerente com Ronaldo Adriano Barretos · Conectinove
    const col = app.findCollectionByNameOrId('facebook_comments')
    let defaultUserId = ''
    try {
      const firstUser = app.findFirstRecordByFilter('users', 'id != ""')
      if (firstUser) defaultUserId = firstUser.id
    } catch (_) {}

    let samplePostId = ''
    try {
      const samplePost = app.findFirstRecordByFilter('posts', 'id != ""')
      if (samplePost) samplePostId = samplePost.id
    } catch (_) {}

    const seedComments = [
      {
        fb_comment_id: 'fb_comm_201',
        author_handle: 'carlos.alberto.educ',
        author_name: 'Carlos Alberto Mendes',
        author_avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=61',
        text: 'Excelente iniciativa da Conectinove em Barretos! Quando abrem as novas turmas de capacitação prática em IA e negócios digitais?',
        post_title: 'Transformação Digital: O Futuro da Educação e Empreendedorismo em Barretos',
        post_thumbnail: 'https://img.usecurling.com/p/300/300?q=education&color=blue',
        post_permalink: 'https://facebook.com/conectinove/posts/849201948',
        status: 'novo',
        likes_count: 9,
        is_official: false,
        commented_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      },
      {
        fb_comment_id: 'fb_comm_202',
        author_handle: 'patricia.fonseca.agro',
        author_name: 'Patrícia Fonseca',
        author_avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=44',
        text: 'Parabéns Ronaldo e equipe! Estamos aplicando os funis de atendimento pelo WhatsApp na nossa empresa e a taxa de conversão dobrou.',
        post_title: 'Como Empresas Locais Estão Escalando Vendas com Automação Inteligente',
        post_thumbnail: 'https://img.usecurling.com/p/300/300?q=business&color=blue',
        post_permalink: 'https://facebook.com/conectinove/posts/849202055',
        status: 'novo',
        likes_count: 18,
        is_official: false,
        commented_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
      {
        fb_comment_id: 'fb_comm_203',
        author_handle: 'marcos.vinicius.tech',
        author_name: 'Marcos Vinícius Silva',
        author_avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=73',
        text: 'Ronaldo, vocês emitem certificado reconhecido para empresas parceiras no final do treinamento?',
        post_title: 'Certificação Executiva em Estratégia de Conteúdo e Automação',
        post_thumbnail: 'https://img.usecurling.com/p/300/300?q=technology&color=cyan',
        post_permalink: 'https://facebook.com/conectinove/posts/849202110',
        status: 'respondido',
        reply_text:
          'Olá Marcos! Sim, todos os nossos cursos contam com certificação oficial emitida pela Conectinove com validação nacional.',
        replied_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        likes_count: 8,
        is_official: false,
        commented_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      },
      {
        fb_comment_id: 'fb_comm_204',
        author_handle: 'renata.consultoria',
        author_name: 'Renata Castro',
        author_avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=31',
        text: 'Conteúdo de altíssimo valor para o comércio de Barretos e região! Já compartilhei na página da nossa associação comercial.',
        post_title: '5 Gatilhos para o Comércio Local Vender Todo Santo Dia nas Redes',
        post_thumbnail: 'https://img.usecurling.com/p/300/300?q=marketing&color=blue',
        post_permalink: 'https://facebook.com/conectinove/posts/849202240',
        status: 'novo',
        likes_count: 12,
        is_official: false,
        commented_at: new Date(Date.now() - 15 * 3600 * 1000).toISOString(),
      },
      {
        fb_comment_id: 'fb_comm_205',
        author_handle: 'spam_marketing_auto',
        author_name: 'Super Leads Bot',
        author_avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=88',
        text: 'Ganhe seguidores agora no Facebook! Acesse o link na bio para receber 5.000 curtidas grátis.',
        post_title: 'Transformação Digital: O Futuro da Educação e Empreendedorismo em Barretos',
        post_thumbnail: 'https://img.usecurling.com/p/300/300?q=education&color=blue',
        post_permalink: 'https://facebook.com/conectinove/posts/849201948',
        status: 'ignorado',
        likes_count: 0,
        is_official: false,
        commented_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
      },
    ]

    seedComments.forEach((item) => {
      try {
        const existing = app.findFirstRecordByFilter(
          'facebook_comments',
          `author_handle = "${item.author_handle}" && fb_comment_id = "${item.fb_comment_id}"`,
        )
        if (!existing) {
          const rec = new Record(col, {
            ...item,
            user: defaultUserId || undefined,
            post: samplePostId || undefined,
          })
          app.save(rec)
        }
      } catch (_) {
        const rec = new Record(col, {
          ...item,
          user: defaultUserId || undefined,
          post: samplePostId || undefined,
        })
        app.save(rec)
      }
    })
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('facebook_comments')
      app.delete(col)
    } catch (_) {}
  },
)
