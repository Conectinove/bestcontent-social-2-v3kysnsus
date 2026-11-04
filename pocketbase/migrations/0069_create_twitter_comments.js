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

    if (!app.hasTable('twitter_comments')) {
      const commentsCol = new Collection({
        name: 'twitter_comments',
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
          { name: 'tw_comment_id', type: 'text', required: false },
          { name: 'author_handle', type: 'text', required: true },
          { name: 'author_name', type: 'text', required: false },
          { name: 'author_avatar', type: 'text', required: false },
          { name: 'text', type: 'text', required: true },
          { name: 'post_title', type: 'text', required: false },
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
          'CREATE INDEX idx_tw_comments_status ON twitter_comments (status)',
          'CREATE INDEX idx_tw_comments_author ON twitter_comments (author_handle)',
          'CREATE INDEX idx_tw_comments_created ON twitter_comments (created)',
        ],
      })
      app.save(commentsCol)
    }

    // Seeding inicial calibrado idempotente coerente com Ronaldo Adriano Barretos · Conectinove
    const col = app.findCollectionByNameOrId('twitter_comments')
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
        tw_comment_id: 'tw_comm_301',
        author_handle: 'juliana.digitais',
        author_name: 'Juliana Prado',
        author_avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=52',
        text: 'O thread da Conectinove sobre funis de vendas com IA foi o melhor conteúdo que li essa semana. Quando vem a parte 2?',
        post_title: 'Funis de Vendas com IA: o guia prático para negócios locais',
        post_permalink: 'https://x.com/conectinove/status/1789301',
        status: 'novo',
        likes_count: 14,
        is_official: false,
        commented_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      },
      {
        tw_comment_id: 'tw_comm_302',
        author_handle: 'rafa.lojista',
        author_name: 'Rafael Nogueira',
        author_avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=17',
        text: 'Vocês atendem comércio pequeno em Barretos ou só empresas grandes? Quero automatizar o atendimento do WhatsApp.',
        post_title: 'Atendimento automatizado: como começar sem quebrar o caixa',
        post_permalink: 'https://x.com/conectinove/status/1789312',
        status: 'novo',
        likes_count: 6,
        is_official: false,
        commented_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      },
      {
        tw_comment_id: 'tw_comm_303',
        author_handle: 'ana.metricas',
        author_name: 'Ana Beatriz Lima',
        author_avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=29',
        text: 'Já usei o painel de métricas de vocês por 30 dias e o relatório semanal virou pauta fixa da reunião da minha agência. Recomendo!',
        post_title: 'Relatórios que o cliente entende: o fim do prints no WhatsApp',
        post_permalink: 'https://x.com/conectinove/status/1789330',
        status: 'respondido',
        reply_text:
          'Olá Ana! Que ótimo saber que os relatórios estão ajudando sua agência. Temos novidades no painel saindo essa semana — aguarde! 🚀',
        replied_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        likes_count: 21,
        is_official: false,
        commented_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      },
      {
        tw_comment_id: 'tw_comm_304',
        author_handle: 'geek.promocoes',
        author_name: 'Promo Turbo',
        author_avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=91',
        text: 'Seguidores baratos! DM agora e receba 10 mil followers no X por preço de banana. Link na bio!',
        post_title: 'Funis de Vendas com IA: o guia prático para negócios locais',
        post_permalink: 'https://x.com/conectinove/status/1789301',
        status: 'ignorado',
        likes_count: 0,
        is_official: false,
        commented_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      },
    ]

    seedComments.forEach((item) => {
      try {
        const existing = app.findFirstRecordByFilter(
          'twitter_comments',
          `author_handle = "${item.author_handle}" && tw_comment_id = "${item.tw_comment_id}"`,
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
      const col = app.findCollectionByNameOrId('twitter_comments')
      app.delete(col)
    } catch (_) {}
  },
)
