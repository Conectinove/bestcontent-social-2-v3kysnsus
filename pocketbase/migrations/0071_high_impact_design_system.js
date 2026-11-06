migrate(
  (app) => {
    // =====================================================================
    // 1. posts: novo status 'em_revisao' + campo campaign_style (preset High Impact)
    // =====================================================================
    try {
      const postsCol = app.findCollectionByNameOrId('posts')
      let changed = false

      const statusField = postsCol.fields.getByName('status')
      if (statusField && !statusField.values.includes('em_revisao')) {
        statusField.values = [...statusField.values, 'em_revisao']
        changed = true
      }

      if (!postsCol.fields.getByName('campaign_style')) {
        postsCol.fields.add(new JSONField({ name: 'campaign_style', required: false }))
        changed = true
      }

      if (changed) app.save(postsCol)
    } catch (e) {
      console.warn('0071: falha ao expandir posts:', e)
    }

    // =====================================================================
    // 2. campaigns: diretrizes visuais persistidas (style_guidelines + style_pattern)
    // =====================================================================
    try {
      const campaignsCol = app.findCollectionByNameOrId('campaigns')
      let changed = false

      if (!campaignsCol.fields.getByName('style_guidelines')) {
        campaignsCol.fields.add(new JSONField({ name: 'style_guidelines', required: false }))
        changed = true
      }
      if (!campaignsCol.fields.getByName('style_pattern')) {
        campaignsCol.fields.add(
          new SelectField({
            name: 'style_pattern',
            required: false,
            values: ['grid_split', 'floating', 'high_impact', 'classico'],
            maxSelect: 1,
          }),
        )
        changed = true
      }

      if (changed) app.save(campaignsCol)
    } catch (e) {
      console.warn('0071: falha ao expandir campaigns:', e)
    }

    // =====================================================================
    // 3. Nova coleção review_comments: comentários da equipe no fluxo "Em Revisão"
    // =====================================================================
    let usersCol
    try {
      usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    } catch (_) {
      usersCol = app.findCollectionByNameOrId('users')
    }

    let postsColRef = null
    try {
      postsColRef = app.findCollectionByNameOrId('posts')
    } catch (_) {}

    if (!app.hasTable('review_comments')) {
      const commentsCol = new Collection({
        name: 'review_comments',
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
          ...(postsColRef
            ? [
                {
                  name: 'post',
                  type: 'relation',
                  required: false,
                  collectionId: postsColRef.id,
                  cascadeDelete: false,
                  maxSelect: 1,
                },
              ]
            : []),
          { name: 'author_id', type: 'text', required: false },
          { name: 'author_name', type: 'text', required: true },
          { name: 'text', type: 'text', required: true },
          { name: 'iteration', type: 'number', required: false, min: 0 },
          {
            name: 'kind',
            type: 'select',
            required: false,
            values: ['comentario', 'ajuste_solicitado', 'aprovacao'],
            maxSelect: 1,
          },
          {
            name: 'status',
            type: 'select',
            required: false,
            values: ['aberto', 'resolvido'],
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_review_comments_post ON review_comments (post)',
          'CREATE INDEX idx_review_comments_created ON review_comments (created)',
        ],
      })
      app.save(commentsCol)
    }

    // =====================================================================
    // 4. Modelos de campanha High Impact: "divisão de grids" e "elementos flutuantes"
    //    (Feed e Stories, prontos para receber conteúdo)
    // =====================================================================
    const tplCol = app.findCollectionByNameOrId('post_templates')

    let ownerId = ''
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
      if (admin) ownerId = admin.id
    } catch (_) {}
    if (!ownerId) {
      try {
        const firstUser = app.findFirstRecordByFilter('users', 'id != ""')
        if (firstUser) ownerId = firstUser.id
      } catch (_) {}
    }
    if (!ownerId) return

    const highImpactTemplates = [
      // ------------------------------------------------------------------
      // FEED — Grade Dividida (split-grid)
      // ------------------------------------------------------------------
      {
        name: 'High Impact — Grade Dividida Promo (Feed)',
        network: 'instagram',
        category: 'promo',
        type: 'feed',
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        layout_data: {
          pattern: 'grid_split',
          grid: 'high-impact-split',
          headline: 'OFERTA QUE NÃO ESPERA',
          subhead: 'Condição especial válida apenas nesta semana para novos clientes.',
          badge: 'ALTA CONVERSÃO',
          ctaText: 'Garanta agora pelo link da bio',
          cells: [
            { span: 'headline', label: 'TÍTULO EM DESTAQUE' },
            { span: 'media', label: 'IMAGEM PRINCIPAL' },
            { span: 'sub', label: 'SUPORTE DE TEXTO' },
            { span: 'cta', label: 'CHAMADA FINAL' },
          ],
        },
        style_settings: {
          designSystem: 'high_impact',
          fontFamily: 'Archivo Black',
          bgColor: '#0B0B0F',
          accentColor: '#7C3AED',
          ctaColor: '#FACC15',
          textColor: '#FFFFFF',
          cardBg: 'rgba(255,255,255,0.07)',
          borderStyle: '2px solid rgba(255,255,255,0.35)',
          shadow: 'colored-dynamic',
          gradient: 'linear-gradient(135deg, #0B0B0F 0%, #2E1065 100%)',
        },
      },
      {
        name: 'High Impact — Grade Dividida Autoridade (Feed)',
        network: 'all',
        category: 'autoridade',
        type: 'feed',
        aspect_ratio: '1:1',
        dimensions: '1080x1080',
        layout_data: {
          pattern: 'grid_split',
          grid: 'high-impact-authority',
          headline: 'O MÉTODO POR TRÁS DOS RESULTADOS',
          subhead: '3 pilares que separam amadores de profissionais de verdade.',
          badge: 'PLAYBOOK',
          ctaText: 'Salve para aplicar na sua operação',
          cells: [
            { span: 'badge', label: 'SELO' },
            { span: 'stat', label: 'NÚMERO DE IMPACTO' },
            { span: 'headline', label: 'TÍTULO' },
            { span: 'list', label: 'PILARES' },
          ],
        },
        style_settings: {
          designSystem: 'high_impact',
          fontFamily: 'Archivo Black',
          bgColor: '#0A0E1A',
          accentColor: '#F59E0B',
          ctaColor: '#10B981',
          textColor: '#FFFFFF',
          cardBg: 'rgba(255,255,255,0.08)',
          borderStyle: '3px solid #F59E0B',
          shadow: 'colored-dynamic',
          gradient: 'linear-gradient(135deg, #0A0E1A 0%, #1E1B4B 100%)',
        },
      },
      // ------------------------------------------------------------------
      // STORIES — Elementos Flutuantes (floating)
      // ------------------------------------------------------------------
      {
        name: 'High Impact — Elementos Flutuantes Promo (Stories)',
        network: 'instagram',
        category: 'promo',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          pattern: 'floating',
          grid: 'high-impact-floating-promo',
          headline: 'SÓ HOJE: CONDIÇÃO DE LANCAMENTO',
          subhead: 'Arraste para cima e garanta antes do encerramento.',
          badge: 'URGENTE',
          ctaText: 'Arraste para participar',
          floaters: [
            { shape: 'sticker-star', label: 'OFERTA', shadow: true },
            { shape: 'pill', label: '-40%', shadow: true },
            { shape: 'circle', label: 'NOVO', shadow: true },
          ],
        },
        style_settings: {
          designSystem: 'high_impact',
          fontFamily: 'Archivo Black',
          bgColor: '#12051F',
          accentColor: '#EC4899',
          ctaColor: '#FACC15',
          textColor: '#FFFFFF',
          cardBg: 'rgba(236,72,153,0.12)',
          borderStyle: '2px solid rgba(236,72,153,0.6)',
          shadow: 'floating-colored',
          gradient: 'linear-gradient(180deg, #12051F 0%, #4C0519 100%)',
        },
      },
      {
        name: 'High Impact — Elementos Flutuantes Engajamento (Stories)',
        network: 'all',
        category: 'engajamento',
        type: 'story',
        aspect_ratio: '9:16',
        dimensions: '1080x1920',
        layout_data: {
          pattern: 'floating',
          grid: 'high-impact-floating-poll',
          headline: 'VOCÊ ESTÁ NO TIME CERTO?',
          subhead: 'Responda a enquete e descubra o próximo passo ideal para você.',
          badge: 'ENQUETE',
          ctaText: 'Vote no adesivo acima',
          floaters: [
            { shape: 'pill', label: 'SIM, QUERO', shadow: true },
            { shape: 'pill', label: 'AINDA NÃO', shadow: true },
            { shape: 'sticker-star', label: 'DESTAQUE', shadow: true },
          ],
        },
        style_settings: {
          designSystem: 'high_impact',
          fontFamily: 'Archivo Black',
          bgColor: '#051018',
          accentColor: '#22D3EE',
          ctaColor: '#A3E635',
          textColor: '#FFFFFF',
          cardBg: 'rgba(34,211,238,0.1)',
          borderStyle: '3px solid #22D3EE',
          shadow: 'floating-colored',
          gradient: 'linear-gradient(180deg, #051018 0%, #164E63 100%)',
        },
      },
    ]

    for (let i = 0; i < highImpactTemplates.length; i++) {
      const item = highImpactTemplates[i]
      try {
        // Idempotência por nome e rede
        app.findFirstRecordByFilter(
          'post_templates',
          `name = "${item.name}" && network = "${item.network}"`,
        )
      } catch (_) {
        const record = new Record(tplCol)
        record.set('user', ownerId)
        record.set('name', item.name)
        record.set('network', item.network)
        record.set('category', item.category)
        record.set('type', item.type)
        record.set('aspect_ratio', item.aspect_ratio)
        record.set('dimensions', item.dimensions)
        record.set('is_shared', true)
        record.set('is_favorite', false)
        record.set('layout_data', JSON.stringify(item.layout_data))
        record.set('style_settings', JSON.stringify(item.style_settings))
        app.save(record)
      }
    }
  },
  (app) => {
    // Reverso: remove somente o que esta migration adicionou
    try {
      const postsCol = app.findCollectionByNameOrId('posts')
      const statusField = postsCol.fields.getByName('status')
      if (statusField) {
        statusField.values = statusField.values.filter((v) => v !== 'em_revisao')
        app.save(postsCol)
      }
      if (postsCol.fields.getByName('campaign_style')) {
        postsCol.fields.removeByName('campaign_style')
        app.save(postsCol)
      }
    } catch (_) {}
    try {
      const campaignsCol = app.findCollectionByNameOrId('campaigns')
      if (campaignsCol.fields.getByName('style_guidelines')) {
        campaignsCol.fields.removeByName('style_guidelines')
        app.save(campaignsCol)
      }
      if (campaignsCol.fields.getByName('style_pattern')) {
        campaignsCol.fields.removeByName('style_pattern')
        app.save(campaignsCol)
      }
    } catch (_) {}
    try {
      if (app.hasTable('review_comments')) {
        const col = app.findCollectionByNameOrId('review_comments')
        app.delete(col)
      }
    } catch (_) {}
  },
)
