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

    if (!app.hasTable('instagram_comments')) {
      const commentsCol = new Collection({
        name: 'instagram_comments',
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
          { name: 'ig_comment_id', type: 'text', required: false },
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
          'CREATE INDEX idx_ig_comments_status ON instagram_comments (status)',
          'CREATE INDEX idx_ig_comments_author ON instagram_comments (author_handle)',
          'CREATE INDEX idx_ig_comments_created ON instagram_comments (created)',
        ],
      })
      app.save(commentsCol)
    }

    // Seeding inicial calibrado idempotente
    const col = app.findCollectionByNameOrId('instagram_comments')
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
        ig_comment_id: 'ig_comm_101',
        author_handle: 'lucas.growth',
        author_name: 'Lucas Martins',
        author_avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=14',
        text: 'Qual ferramenta vocês usaram para gerar a identidade visual do carrossel? Ficou muito profissional!',
        post_title: '5 Erros Silenciosos de IA na Carreira',
        post_thumbnail: 'https://img.usecurling.com/p/300/300?q=branding&color=purple',
        post_permalink: 'https://instagram.com/p/DF29xL12',
        status: 'novo',
        likes_count: 7,
        is_official: false,
        commented_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
      },
      {
        ig_comment_id: 'ig_comm_102',
        author_handle: 'dra.marianaazevedo',
        author_name: 'Dra. Mariana Azevedo',
        author_avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=22',
        text: 'Adorei a dica do gancho dos 3 segundos! Quero implementar na minha clínica. Vocês prestam consultoria personalizada?',
        post_title: 'O Gancho Magnético dos 3 Segundos no Reels',
        post_thumbnail: 'https://img.usecurling.com/p/300/300?q=creator&color=rose',
        post_permalink: 'https://instagram.com/p/DF31kM88',
        status: 'novo',
        likes_count: 14,
        is_official: false,
        commented_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      },
      {
        ig_comment_id: 'ig_comm_103',
        author_handle: 'thiago.devlead',
        author_name: 'Thiago Rocha',
        author_avatar: 'https://img.usecurling.com/ppl/medium?gender=male&seed=39',
        text: 'Sensacional essa análise de métricas comparativas entre Reels e Carrossel! Faz muito sentido.',
        post_title: 'Estudo de Caso: Do Zero a 48 Clientes Qualificados',
        post_thumbnail: 'https://img.usecurling.com/p/300/300?q=analytics&color=blue',
        post_permalink: 'https://instagram.com/p/DF18qN04',
        status: 'respondido',
        reply_text:
          'Obrigado pelo feedback, Thiago! Em nossa operação, os carrosséis geram 34% mais retenção.',
        replied_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        likes_count: 5,
        is_official: false,
        commented_at: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
      },
      {
        ig_comment_id: 'ig_comm_104',
        author_handle: 'carol.contentcreator',
        author_name: 'Carolina Santos',
        author_avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=55',
        text: 'Como vocês lidam com a consistência de posts sem sobrecarregar a equipe?',
        post_title: 'A Maior Mentira que Te Contaram Sobre Consistência',
        post_thumbnail: 'https://img.usecurling.com/p/300/300?q=workspace&color=orange',
        post_permalink: 'https://instagram.com/p/DF09jK77',
        status: 'novo',
        likes_count: 11,
        is_official: false,
        commented_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      },
      {
        ig_comment_id: 'ig_comm_105',
        author_handle: 'bot_promo_2984',
        author_name: 'Promote Here',
        author_avatar: 'https://img.usecurling.com/ppl/medium?gender=female&seed=90',
        text: 'Send pic on @promoter_hub to get featured now 🚀',
        post_title: '5 Erros Silenciosos de IA na Carreira',
        post_thumbnail: 'https://img.usecurling.com/p/300/300?q=branding&color=purple',
        post_permalink: 'https://instagram.com/p/DF29xL12',
        status: 'ignorado',
        likes_count: 0,
        is_official: false,
        commented_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      },
    ]

    seedComments.forEach((item) => {
      try {
        const existing = app.findFirstRecordByFilter(
          'instagram_comments',
          `author_handle = "${item.author_handle}" && ig_comment_id = "${item.ig_comment_id}"`,
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
      const col = app.findCollectionByNameOrId('instagram_comments')
      app.delete(col)
    } catch (_) {}
  },
)
