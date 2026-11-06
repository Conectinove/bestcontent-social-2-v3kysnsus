migrate(
  (app) => {
    // =====================================================================
    // 1. posts: atribuição de revisor + flag de solicitação de revisão
    //    (estende o workflow "Em Revisão" da migration 0071)
    // =====================================================================
    try {
      const postsCol = app.findCollectionByNameOrId('posts')
      let changed = false

      let usersCol = null
      try {
        usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      } catch (_) {
        try {
          usersCol = app.findCollectionByNameOrId('users')
        } catch (_) {}
      }

      if (!postsCol.fields.getByName('reviewer')) {
        postsCol.fields.add(
          new RelationField({
            name: 'reviewer',
            required: false,
            collectionId: usersCol ? usersCol.id : undefined,
            cascadeDelete: false,
            maxSelect: 1,
          }),
        )
        changed = true
      }

      if (!postsCol.fields.getByName('reviewer_name')) {
        postsCol.fields.add(new TextField({ name: 'reviewer_name', required: false }))
        changed = true
      }

      if (!postsCol.fields.getByName('review_requested')) {
        postsCol.fields.add(new BoolField({ name: 'review_requested', required: false }))
        changed = true
      }

      if (changed) app.save(postsCol)
    } catch (e) {
      console.warn('0072: falha ao expandir posts:', e)
    }

    // =====================================================================
    // 2. Novos modelos de campanha no padrão High Impact (mesmo espírito 0071)
    //    Carrossel grid-split · Capa com elemento flutuante · Antes/Depois
    // =====================================================================
    const highImpactModels = [
      {
        name: 'Carrossel Grid-Split High Impact',
        type: 'feed',
        aspect: '4:5',
        dims: '1080x1350',
        category: 'educativo',
        layout: {
          pattern: 'grid_split',
          slides: 5,
          zones: [
            { id: 'kicker', label: 'Chamada curta (2-4 palavras)', area: 'top-left' },
            { id: 'headline', label: 'Título Archivo Black grande', area: 'left-half' },
            { id: 'visual', label: 'Imagem/ícone de alto contraste', area: 'right-half' },
            { id: 'numbering', label: 'Numeração 01/05 com badge', area: 'bottom-left' },
          ],
          shadow: 'dynamic_layers',
          border: 'strong',
        },
        style: {
          font_headline: 'Archivo Black',
          shadow: 'dynamic_layers',
          border: 'strong',
          contrast: 'high',
          palette: ['#0F0A1E', '#7C3AED', '#F5F3FF'],
        },
      },
      {
        name: 'Capa Elemento Flutuante High Impact',
        type: 'story',
        aspect: '9:16',
        dims: '1080x1920',
        category: 'promo',
        layout: {
          pattern: 'floating',
          zones: [
            {
              id: 'floating_shape',
              label: 'Elemento flutuante sobreposto ao fundo',
              area: 'center',
            },
            { id: 'headline', label: 'Headline em caixa alta', area: 'top-third' },
            { id: 'cta_badge', label: 'Selo/CTA em destaque', area: 'bottom-third' },
          ],
          shadow: 'dynamic_layers',
          border: 'strong',
          depth: 'elevated',
        },
        style: {
          font_headline: 'Archivo Black',
          shadow: 'dynamic_layers',
          border: 'strong',
          contrast: 'high',
          palette: ['#120B24', '#A855F7', '#FFFFFF'],
        },
      },
      {
        name: 'Comparativo Antes/Depois High Impact',
        type: 'feed',
        aspect: '1:1',
        dims: '1080x1080',
        category: 'autoridade',
        layout: {
          pattern: 'before_after',
          zones: [
            { id: 'before', label: 'Bloco "Antes" com dados reais', area: 'left-half' },
            { id: 'after', label: 'Bloco "Depois" com resultado', area: 'right-half' },
            { id: 'divider', label: 'Divisor em ângulo com sombra em camadas', area: 'center' },
            { id: 'proof', label: 'Faixa de prova social/numérica', area: 'bottom' },
          ],
          shadow: 'dynamic_layers',
          border: 'strong',
        },
        style: {
          font_headline: 'Archivo Black',
          shadow: 'dynamic_layers',
          border: 'strong',
          contrast: 'high',
          palette: ['#0B1020', '#22D3EE', '#F8FAFC'],
        },
      },
    ]

    try {
      const tplCol = app.findCollectionByNameOrId('post_templates')
      let owner = null
      try {
        owner = app.findFirstRecordByFilter('users', 'id != ""')
      } catch (_) {}

      if (owner) {
        for (const m of highImpactModels) {
          let exists = null
          try {
            exists = app.findFirstRecordByFilter(tplCol, `name = "${m.name}"`)
          } catch (_) {}
          if (exists) continue

          const rec = new Record(tplCol)
          rec.set('user', owner.id)
          rec.set('name', m.name)
          rec.set('type', m.type)
          rec.set('network', 'all')
          rec.set('category', m.category)
          rec.set('aspect_ratio', m.aspect)
          rec.set('dimensions', m.dims)
          rec.set('layout_data', m.layout)
          rec.set('style_settings', m.style)
          rec.set('is_favorite', false)
          rec.set('is_shared', true)
          app.save(rec)
        }
      } else {
        console.warn('0072: nenhum usuário encontrado — seed de modelos pulado')
      }
    } catch (e) {
      console.warn('0072: falha ao semear modelos High Impact:', e)
    }
  },
  (app) => {
    // Rollback: remove apenas os modelos criados por esta migration
    const seededNames = [
      'Carrossel Grid-Split High Impact',
      'Capa Elemento Flutuante High Impact',
      'Comparativo Antes/Depois High Impact',
    ]
    for (const name of seededNames) {
      try {
        const rec = app.findFirstRecordByFilter('post_templates', `name = "${name}"`)
        if (rec) app.delete(rec)
      } catch (_) {}
    }
  },
)
