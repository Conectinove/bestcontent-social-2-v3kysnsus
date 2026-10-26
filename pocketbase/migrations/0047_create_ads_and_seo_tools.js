migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const brandsCol = app.findCollectionByNameOrId('brands')
    const postsCol = app.findCollectionByNameOrId('posts')

    // 1. Coleção 'ad_campaigns' (Gestor de Anúncios da plataforma)
    let adsCol
    try {
      adsCol = app.findCollectionByNameOrId('ad_campaigns')
    } catch (_) {
      adsCol = new Collection({
        name: 'ad_campaigns',
        type: 'base',
        listRule: '@request.auth.id != "" && user = @request.auth.id',
        viewRule: '@request.auth.id != "" && user = @request.auth.id',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != "" && user = @request.auth.id',
        deleteRule: '@request.auth.id != "" && user = @request.auth.id',
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'brand',
            type: 'relation',
            required: false,
            collectionId: brandsCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'name',
            type: 'text',
            required: true,
          },
          {
            name: 'network',
            type: 'select',
            required: true,
            values: ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin'],
            maxSelect: 1,
          },
          {
            name: 'objective',
            type: 'select',
            required: true,
            values: ['trafego', 'vendas', 'reconhecimento', 'leads', 'engajamento'],
            maxSelect: 1,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['rascunho', 'ativa', 'pausada', 'concluida'],
            maxSelect: 1,
          },
          {
            name: 'daily_budget',
            type: 'number',
            required: true,
          },
          {
            name: 'total_budget',
            type: 'number',
            required: false,
          },
          {
            name: 'start_date',
            type: 'date',
            required: false,
          },
          {
            name: 'end_date',
            type: 'date',
            required: false,
          },
          {
            name: 'target_audience',
            type: 'json',
            required: false, // { ageMin, ageMax, genders, regions, interests }
          },
          {
            name: 'ad_copy',
            type: 'json',
            required: false, // { headline, primaryText, description, cta, tone }
          },
          {
            name: 'projections',
            type: 'json',
            required: false, // { reach, impressions, clicks, cpc, cpm, ctr }
          },
          {
            name: 'destination_url',
            type: 'text',
            required: false,
          },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE INDEX idx_ad_campaigns_user ON ad_campaigns (user)',
          'CREATE INDEX idx_ad_campaigns_brand ON ad_campaigns (brand)',
          'CREATE INDEX idx_ad_campaigns_status ON ad_campaigns (status)',
          'CREATE INDEX idx_ad_campaigns_network ON ad_campaigns (network)',
        ],
      })
      app.save(adsCol)
    }

    // 2. Adicionar campo seo_score e seo_data em posts se ainda não existirem
    if (!postsCol.fields.getByName('seo_score')) {
      postsCol.fields.add(
        new NumberField({
          name: 'seo_score',
          required: false,
          min: 0,
          max: 100,
        }),
      )
    }
    if (!postsCol.fields.getByName('seo_analysis')) {
      postsCol.fields.add(
        new JSONField({
          name: 'seo_analysis',
          required: false,
        }),
      )
    }
    app.save(postsCol)

    // 3. Coleção 'seo_audits' (Histórico e ferramentas de SEO do usuário)
    let seoCol
    try {
      seoCol = app.findCollectionByNameOrId('seo_audits')
    } catch (_) {
      seoCol = new Collection({
        name: 'seo_audits',
        type: 'base',
        listRule: '@request.auth.id != "" && user = @request.auth.id',
        viewRule: '@request.auth.id != "" && user = @request.auth.id',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != "" && user = @request.auth.id',
        deleteRule: '@request.auth.id != "" && user = @request.auth.id',
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'brand',
            type: 'relation',
            required: false,
            collectionId: brandsCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'post',
            type: 'relation',
            required: false,
            collectionId: postsCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'network',
            type: 'select',
            required: true,
            values: ['instagram', 'tiktok', 'youtube', 'linkedin', 'facebook', 'twitter'],
            maxSelect: 1,
          },
          {
            name: 'niche',
            type: 'text',
            required: false,
          },
          {
            name: 'title_or_hook',
            type: 'text',
            required: false,
          },
          {
            name: 'caption',
            type: 'text',
            required: true,
          },
          {
            name: 'score',
            type: 'number',
            required: true,
          },
          {
            name: 'breakdown',
            type: 'json',
            required: false, // { hook, length, cta, readability, keywords, hashtags }
          },
          {
            name: 'recommendations',
            type: 'json',
            required: false,
          },
          {
            name: 'suggested_keywords',
            type: 'json',
            required: false,
          },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE INDEX idx_seo_audits_user ON seo_audits (user)',
          'CREATE INDEX idx_seo_audits_brand ON seo_audits (brand)',
        ],
      })
      app.save(seoCol)
    }
  },
  (app) => {
    try {
      const seoCol = app.findCollectionByNameOrId('seo_audits')
      app.delete(seoCol)
    } catch (_) {}

    try {
      const adsCol = app.findCollectionByNameOrId('ad_campaigns')
      app.delete(adsCol)
    } catch (_) {}
  },
)
