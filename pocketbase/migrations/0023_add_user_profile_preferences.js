migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('bio')) {
      users.fields.add(new TextField({ name: 'bio', max: 500 }))
    }
    if (!users.fields.getByName('profession')) {
      users.fields.add(new TextField({ name: 'profession', max: 100 }))
    }
    if (!users.fields.getByName('company')) {
      users.fields.add(new TextField({ name: 'company', max: 100 }))
    }
    if (!users.fields.getByName('instagram')) {
      users.fields.add(new TextField({ name: 'instagram', max: 100 }))
    }
    if (!users.fields.getByName('website')) {
      users.fields.add(new TextField({ name: 'website', max: 200 }))
    }
    if (!users.fields.getByName('menu_layout')) {
      users.fields.add(new TextField({ name: 'menu_layout', max: 50 }))
    }
    if (!users.fields.getByName('app_color')) {
      users.fields.add(new TextField({ name: 'app_color', max: 50 }))
    }
    if (!users.fields.getByName('share_community')) {
      users.fields.add(new BoolField({ name: 'share_community' }))
    }
    if (!users.fields.getByName('notif_app')) {
      users.fields.add(new BoolField({ name: 'notif_app' }))
    }
    if (!users.fields.getByName('notif_email')) {
      users.fields.add(new BoolField({ name: 'notif_email' }))
    }
    if (!users.fields.getByName('notif_push')) {
      users.fields.add(new BoolField({ name: 'notif_push' }))
    }
    if (!users.fields.getByName('referral_code')) {
      users.fields.add(new TextField({ name: 'referral_code', max: 50 }))
    }

    app.save(users)

    // Seed default values for existing users if any
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
      if (admin) {
        if (!admin.getString('name') || admin.getString('name') === 'Admin') {
          admin.set('name', 'Ronaldo Barreto')
        }
        if (!admin.getString('referral_code')) {
          admin.set('referral_code', 'RONALDD89L')
        }
        if (!admin.getString('menu_layout')) {
          admin.set('menu_layout', 'sidebar')
        }
        if (!admin.getString('app_color')) {
          admin.set('app_color', 'purple')
        }
        admin.set('share_community', true)
        admin.set('notif_app', true)
        admin.set('notif_email', true)
        admin.set('notif_push', false)
        app.save(admin)
      }
    } catch (_) {}
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const fieldNames = [
      'bio',
      'profession',
      'company',
      'instagram',
      'website',
      'menu_layout',
      'app_color',
      'share_community',
      'notif_app',
      'notif_email',
      'notif_push',
      'referral_code',
    ]
    fieldNames.forEach((fieldName) => {
      const f = users.fields.getByName(fieldName)
      if (f) users.fields.remove(f)
    })
    app.save(users)
  },
)
