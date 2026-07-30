migrate(
  (app) => {
    var rows = app.db().newQuery('SELECT id, status FROM posts').all()

    var col = app.findCollectionByNameOrId('posts')
    var oldField = col.fields.getByName('status')
    col.fields.removeById(oldField.getId())
    col.fields.add(
      new SelectField({
        name: 'status',
        required: true,
        maxSelect: 1,
        values: ['draft', 'scheduled', 'published', 'approved'],
      }),
    )
    app.save(col)

    for (var i = 0; i < rows.length; i++) {
      try {
        var record = app.findRecordById('posts', rows[i]['id'])
        record.set('status', rows[i]['status'] || 'draft')
        app.saveNoValidate(record)
      } catch (_) {}
    }
  },
  (app) => {
    var col = app.findCollectionByNameOrId('posts')
    var oldField = col.fields.getByName('status')
    col.fields.removeById(oldField.getId())
    col.fields.add(
      new SelectField({
        name: 'status',
        required: true,
        maxSelect: 1,
        values: ['draft', 'scheduled', 'published'],
      }),
    )
    app.save(col)

    app.db().newQuery("UPDATE posts SET status = 'draft' WHERE status = 'approved'").execute()
  },
)
