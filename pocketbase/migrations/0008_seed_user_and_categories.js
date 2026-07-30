migrate(
  (app) => {
    // Seed admin user
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
    } catch (_) {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const record = new Record(usersCol)
      record.setEmail('ronaldoconectinove@gmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin')
      app.save(record)
    }

    // Seed categories
    var categories = [
      { name: 'Marketing', slug: 'marketing' },
      { name: 'Tecnologia', slug: 'tecnologia' },
      { name: 'Moda', slug: 'moda' },
      { name: 'Food', slug: 'food' },
      { name: 'Viagem', slug: 'viagem' },
      { name: 'Saúde', slug: 'saude' },
      { name: 'Finanças', slug: 'financas' },
      { name: 'Educação', slug: 'educacao' },
      { name: 'Entretenimento', slug: 'entretenimento' },
      { name: 'Esportes', slug: 'esportes' },
    ]

    var catCol = app.findCollectionByNameOrId('categories')
    for (var i = 0; i < categories.length; i++) {
      var c = categories[i]
      try {
        app.findFirstRecordByData('categories', 'slug', c.slug)
      } catch (_) {
        var record = new Record(catCol)
        record.set('name', c.name)
        record.set('slug', c.slug)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      var user = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
      app.delete(user)
    } catch (_) {}

    var catRecords = app.findRecordsByFilter('categories', '1=1', '', 100, 0)
    for (var i = 0; i < catRecords.length; i++) {
      app.delete(catRecords[i])
    }
  },
)
