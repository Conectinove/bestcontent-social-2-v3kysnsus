migrate(
  (app) => {
    var collection = new Collection({
      name: 'premium_elements',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['icon', 'texture', 'shape'],
        },
        { name: 'data', type: 'text', required: true },
        { name: 'category', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_premium_elements_type ON premium_elements (type)',
        'CREATE INDEX idx_premium_elements_category ON premium_elements (category)',
      ],
    })
    app.save(collection)

    var col = app.findCollectionByNameOrId('premium_elements')

    var icons = [
      {
        name: 'Flash Neon',
        category: 'neon',
        data: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
      },
      {
        name: 'Star Neon',
        category: 'neon',
        data: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
      },
      {
        name: 'Heart Neon',
        category: 'neon',
        data: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      },
      {
        name: 'Fire Neon',
        category: 'neon',
        data: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
      },
      {
        name: 'Crown Neon',
        category: 'neon',
        data: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>',
      },
    ]

    var textures = [
      {
        name: 'Gradient Mesh Purple',
        category: 'gradient',
        data: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      {
        name: 'Gradient Mesh Ocean',
        category: 'gradient',
        data: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      },
      {
        name: 'Gradient Mesh Sunset',
        category: 'gradient',
        data: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      },
      {
        name: 'Gradient Mesh Forest',
        category: 'gradient',
        data: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      },
      {
        name: 'Gradient Mesh Fire',
        category: 'gradient',
        data: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      },
    ]

    var shapes = [
      {
        name: 'Circle Outline',
        category: 'geometric',
        data: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
      },
      {
        name: 'Triangle Bold',
        category: 'geometric',
        data: '<svg viewBox="0 0 100 100"><polygon points="50,10 90,90 10,90" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
      },
      {
        name: 'Hexagon Neon',
        category: 'geometric',
        data: '<svg viewBox="0 0 100 100"><polygon points="50,5 95,27 95,72 50,95 5,72 5,27" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
      },
      {
        name: 'Wave Curve',
        category: 'geometric',
        data: '<svg viewBox="0 0 100 50"><path d="M0,25 Q25,5 50,25 T100,25" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
      },
      {
        name: 'Star Burst',
        category: 'geometric',
        data: '<svg viewBox="0 0 100 100"><path d="M50,5 L55,40 L90,30 L60,55 L80,90 L50,65 L20,90 L40,55 L10,30 L45,40 Z" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
      },
    ]

    var all = icons.concat(textures).concat(shapes)
    for (var i = 0; i < all.length; i++) {
      var el = all[i]
      var typeVal =
        i < icons.length ? 'icon' : i < icons.length + textures.length ? 'texture' : 'shape'
      try {
        app.findFirstRecordByData('premium_elements', 'name', el.name)
      } catch (_) {
        var record = new Record(col)
        record.set('name', el.name)
        record.set('type', typeVal)
        record.set('data', el.data)
        record.set('category', el.category || '')
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      var col = app.findCollectionByNameOrId('premium_elements')
      app.delete(col)
    } catch (_) {}
  },
)
