migrate(
  (app) => {
    var rows = app.db().newQuery('SELECT id, status FROM posts').all()

    var col = app.findCollectionByNameOrId('posts')
    var oldField = col.fields.getByName('status')
    col.fields.remove(oldField)
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
      app
        .db()
        .newQuery('UPDATE posts SET status = {:s} WHERE id = {:id}')
        .bind({ s: rows[i]['status'] || 'draft', id: rows[i]['id'] })
        .execute()
    }
  },
  (app) => {
    var col = app.findCollectionByNameOrId('posts')
    var oldField = col.fields.getByName('status')
    col.fields.remove(oldField)
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
