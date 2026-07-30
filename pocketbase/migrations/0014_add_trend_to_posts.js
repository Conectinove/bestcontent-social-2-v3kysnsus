migrate(
  (app) => {
    const trendsColId = app.findCollectionByNameOrId('trends').id
    const col = app.findCollectionByNameOrId('posts')
    if (!col.fields.getByName('trend')) {
      col.fields.add(
        new RelationField({
          name: 'trend',
          required: false,
          collectionId: trendsColId,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('posts')
    const field = col.fields.getByName('trend')
    if (field) {
      col.fields.remove(field)
      app.save(col)
    }
  },
)
