migrate(
  (app) => {
    var existingPosts = app.findRecordsByFilter('posts', 'id != ""', '-created', 0, 0)

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

    for (var i = 0; i < existingPosts.length; i++) {
      try {
        var currentStatus = existingPosts[i].getString('status') || 'draft'
        existingPosts[i].set('status', currentStatus)
        app.saveNoValidate(existingPosts[i])
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
