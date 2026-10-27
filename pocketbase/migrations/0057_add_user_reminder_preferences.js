migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Campos de preferências de lembretes personalizados
    if (!users.fields.getByName('reminder_daily_post')) {
      users.fields.add(new BoolField({ name: 'reminder_daily_post' }))
    }
    if (!users.fields.getByName('reminder_daily_time')) {
      users.fields.add(new TextField({ name: 'reminder_daily_time', max: 10 }))
    }
    if (!users.fields.getByName('reminder_weekly_summary')) {
      users.fields.add(new BoolField({ name: 'reminder_weekly_summary' }))
    }
    if (!users.fields.getByName('reminder_weekly_time')) {
      users.fields.add(new TextField({ name: 'reminder_weekly_time', max: 10 }))
    }
    if (!users.fields.getByName('reminder_client_approval')) {
      users.fields.add(new BoolField({ name: 'reminder_client_approval' }))
    }
    if (!users.fields.getByName('reminder_best_times')) {
      users.fields.add(new BoolField({ name: 'reminder_best_times' }))
    }
    if (!users.fields.getByName('reminder_channel')) {
      users.fields.add(
        new SelectField({
          name: 'reminder_channel',
          values: ['in_app', 'email', 'push', 'all'],
          maxSelect: 1,
        }),
      )
    }

    app.save(users)

    // Inicializa valores padrão caso exista usuário admin/demo
    try {
      const records = app.findRecordsByFilter('_pb_users_auth_', '', '-created', 10, 0)
      for (let i = 0; i < records.length; i++) {
        const u = records[i]
        let changed = false
        if (!u.getString('reminder_daily_time')) {
          u.set('reminder_daily_post', true)
          u.set('reminder_daily_time', '09:00')
          changed = true
        }
        if (!u.getString('reminder_weekly_time')) {
          u.set('reminder_weekly_summary', true)
          u.set('reminder_weekly_time', '18:00')
          changed = true
        }
        if (u.get('reminder_client_approval') === undefined) {
          u.set('reminder_client_approval', true)
          changed = true
        }
        if (u.get('reminder_best_times') === undefined) {
          u.set('reminder_best_times', true)
          changed = true
        }
        if (!u.getString('reminder_channel')) {
          u.set('reminder_channel', 'all')
          changed = true
        }
        if (changed) {
          app.save(u)
        }
      }
    } catch (_) {}
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const fieldsToRemove = [
      'reminder_daily_post',
      'reminder_daily_time',
      'reminder_weekly_summary',
      'reminder_weekly_time',
      'reminder_client_approval',
      'reminder_best_times',
      'reminder_channel',
    ]
    fieldsToRemove.forEach((fName) => {
      const f = users.fields.getByName(fName)
      if (f) users.fields.remove(f)
    })
    app.save(users)
  },
)
