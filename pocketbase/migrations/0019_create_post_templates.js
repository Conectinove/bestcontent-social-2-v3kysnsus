migrate(
  (app) => {
    const usersColId = '_pb_users_auth_'
    const brandsColId = app.findCollectionByNameOrId('brands').id

    const collection = new Collection({
      name: 'post_templates',
      type: 'base',
      listRule: '@request.auth.id != "" && (user = @request.auth.id || is_shared = true)',
      viewRule: '@request.auth.id != "" && (user = @request.auth.id || is_shared = true)',
      createRule: '@request.auth.id = user',
      updateRule: '@request.auth.id = user',
      deleteRule: '@request.auth.id = user',
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: usersColId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'brand',
          type: 'relation',
          required: false,
          collectionId: brandsColId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'name', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['feed', 'story'],
        },
        { name: 'layout_data', type: 'json', required: false, maxSize: 5242880 },
        { name: 'style_settings', type: 'json', required: false, maxSize: 5242880 },
        { name: 'is_favorite', type: 'bool', required: false },
        { name: 'is_shared', type: 'bool', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_post_templates_user ON post_templates (user)',
        'CREATE INDEX idx_post_templates_brand ON post_templates (brand)',
        'CREATE INDEX idx_post_templates_type ON post_templates (type)',
      ],
    })
    app.save(collection)

    var userId = ''
    try {
      var user = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
      userId = user.id
    } catch (_) {}

    var brandId = ''
    try {
      var brands = app.findRecordsByFilter('brands', '1=1', '-created', 1, 0)
      if (brands.length > 0) brandId = brands[0].id
    } catch (_) {}

    var tplCol = app.findCollectionByNameOrId('post_templates')

    var feedTemplates = [
      {
        name: 'Promo Grid Bold',
        type: 'feed',
        layout_data: JSON.stringify({
          grid: '2x2',
          sections: [
            { id: 'main', position: 'left-top', span: '1x2', type: 'media' },
            {
              id: 'cta',
              position: 'right-top',
              span: '1x1',
              type: 'button',
              text: 'COMPRAR AGORA',
            },
            { id: 'price', position: 'right-bottom', span: '1x1', type: 'text', text: 'R$ 49,90' },
          ],
          floating: [
            { type: 'circle', position: 'top-right', color: '#37DBFF', size: 80 },
            { type: 'badge', position: 'bottom-left', color: '#BF2A95', text: 'NOVO' },
          ],
        }),
        style_settings: JSON.stringify({
          bgColor: '#0A0A0A',
          textColor: '#FFFFFF',
          accentColor: '#BF2A95',
          highlightColor: '#37DBFF',
          shadow: '0 10px 40px rgba(191,42,149,0.4)',
          fontFamily: 'Poppins',
          fontWeight: 900,
          buttonStyle: 'rounded-full',
          buttonBg: '#BF2A95',
          buttonTextSize: 'text-lg',
        }),
      },
      {
        name: 'Minimal Bold Quote',
        type: 'feed',
        layout_data: JSON.stringify({
          grid: '1x1',
          sections: [
            {
              id: 'quote',
              position: 'center',
              span: '1x1',
              type: 'text',
              text: 'FRASE DE IMPACTO',
            },
            {
              id: 'author',
              position: 'bottom-center',
              span: '1x1',
              type: 'text',
              text: '@sua marca',
            },
          ],
          floating: [
            { type: 'line', position: 'top', color: '#37DBFF', width: 60 },
            { type: 'line', position: 'bottom', color: '#BF2A95', width: 60 },
          ],
        }),
        style_settings: JSON.stringify({
          bgColor: '#FFFFFF',
          textColor: '#0A0A0A',
          accentColor: '#BF2A95',
          highlightColor: '#37DBFF',
          shadow: '0 4px 24px rgba(0,0,0,0.12)',
          fontFamily: 'Inter',
          fontWeight: 900,
          buttonStyle: 'rounded-none',
          buttonBg: '#0A0A0A',
          buttonTextSize: 'text-base',
        }),
      },
      {
        name: 'Carousel Highlight',
        type: 'feed',
        layout_data: JSON.stringify({
          grid: '3x1',
          sections: [
            { id: 'item1', position: 'left', span: '1x1', type: 'media' },
            { id: 'item2', position: 'center', span: '1x1', type: 'media' },
            { id: 'item3', position: 'right', span: '1x1', type: 'media' },
            {
              id: 'cta',
              position: 'bottom-center',
              span: '3x1',
              type: 'button',
              text: 'VER COLEÇÃO',
            },
          ],
          floating: [{ type: 'arrow', position: 'center-right', color: '#37DBFF' }],
        }),
        style_settings: JSON.stringify({
          bgColor: '#0F0F0F',
          textColor: '#FFFFFF',
          accentColor: '#37DBFF',
          highlightColor: '#BF2A95',
          shadow: '0 8px 32px rgba(55,219,255,0.3)',
          fontFamily: 'Poppins',
          fontWeight: 800,
          buttonStyle: 'rounded-lg',
          buttonBg: '#37DBFF',
          buttonTextSize: 'text-lg',
        }),
      },
    ]

    var storyTemplates = [
      {
        name: 'Story Promo Flash',
        type: 'story',
        layout_data: JSON.stringify({
          grid: 'full',
          sections: [
            { id: 'bg', position: 'full', span: '1x1', type: 'media' },
            {
              id: 'offer',
              position: 'top-center',
              span: '1x1',
              type: 'text',
              text: 'OFERTA RELÂMPAGO',
            },
            {
              id: 'cta',
              position: 'bottom-center',
              span: '1x1',
              type: 'button',
              text: 'DESLIZE PARA COMPRAR',
            },
          ],
          floating: [
            { type: 'circle', position: 'top-left', color: '#BF2A95', size: 120 },
            { type: 'badge', position: 'center-right', color: '#37DBFF', text: '-50%' },
          ],
        }),
        style_settings: JSON.stringify({
          bgColor: '#0A0A0A',
          textColor: '#FFFFFF',
          accentColor: '#BF2A95',
          highlightColor: '#37DBFF',
          shadow: '0 12px 48px rgba(191,42,149,0.5)',
          fontFamily: 'Poppins',
          fontWeight: 900,
          buttonStyle: 'rounded-full',
          buttonBg: '#BF2A95',
          buttonTextSize: 'text-xl',
        }),
      },
      {
        name: 'Story Countdown',
        type: 'story',
        layout_data: JSON.stringify({
          grid: 'full',
          sections: [
            {
              id: 'title',
              position: 'top-center',
              span: '1x1',
              type: 'text',
              text: 'FALTA POUCO!',
            },
            { id: 'timer', position: 'center', span: '1x1', type: 'text', text: '24:00:00' },
            {
              id: 'cta',
              position: 'bottom-center',
              span: '1x1',
              type: 'button',
              text: 'ATIVAR LEMBRETE',
            },
          ],
          floating: [
            { type: 'line', position: 'left', color: '#37DBFF', width: 4 },
            { type: 'line', position: 'right', color: '#BF2A95', width: 4 },
          ],
        }),
        style_settings: JSON.stringify({
          bgColor: '#FFFFFF',
          textColor: '#0A0A0A',
          accentColor: '#37DBFF',
          highlightColor: '#BF2A95',
          shadow: '0 6px 28px rgba(0,0,0,0.15)',
          fontFamily: 'Inter',
          fontWeight: 900,
          buttonStyle: 'rounded-full',
          buttonBg: '#0A0A0A',
          buttonTextSize: 'text-lg',
        }),
      },
      {
        name: 'Story Quote Bold',
        type: 'story',
        layout_data: JSON.stringify({
          grid: 'full',
          sections: [
            {
              id: 'quote',
              position: 'center',
              span: '1x1',
              type: 'text',
              text: 'TRANSFORME SUA REALIDADE',
            },
            {
              id: 'brand',
              position: 'bottom-center',
              span: '1x1',
              type: 'text',
              text: '@sua marca',
            },
            { id: 'cta', position: 'bottom', span: '1x1', type: 'button', text: 'SAIBA MAIS' },
          ],
          floating: [
            { type: 'circle', position: 'bottom-right', color: '#BF2A95', size: 100 },
            { type: 'circle', position: 'top-left', color: '#37DBFF', size: 60 },
          ],
        }),
        style_settings: JSON.stringify({
          bgColor: '#0F0F0F',
          textColor: '#FFFFFF',
          accentColor: '#37DBFF',
          highlightColor: '#BF2A95',
          shadow: '0 10px 40px rgba(55,219,255,0.35)',
          fontFamily: 'Poppins',
          fontWeight: 900,
          buttonStyle: 'rounded-lg',
          buttonBg: '#37DBFF',
          buttonTextSize: 'text-lg',
        }),
      },
    ]

    var allTemplates = feedTemplates.concat(storyTemplates)
    for (var i = 0; i < allTemplates.length; i++) {
      var t = allTemplates[i]
      try {
        app.findFirstRecordByData('post_templates', 'name', t.name)
      } catch (_) {
        var record = new Record(tplCol)
        record.set('user', userId)
        if (brandId) record.set('brand', brandId)
        record.set('name', t.name)
        record.set('type', t.type)
        record.set('layout_data', t.layout_data)
        record.set('style_settings', t.style_settings)
        record.set('is_favorite', false)
        record.set('is_shared', true)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      var col = app.findCollectionByNameOrId('post_templates')
      app.delete(col)
    } catch (_) {}
  },
)
