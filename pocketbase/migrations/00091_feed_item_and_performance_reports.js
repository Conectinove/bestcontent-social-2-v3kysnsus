migrate(
  (app) => {
    const posts = app.findCollectionByNameOrId('posts')
    if (!posts.fields.getByName('feed_item_id')) {
      posts.fields.add(
        new TextField({
          name: 'feed_item_id',
          required: false,
        }),
      )
      posts.addIndex('idx_posts_feed_item_id', false, 'feed_item_id', '')
      app.save(posts)
    }

    // Verificar se precisamos de campos adicionais em performance_reports ou saved_report_templates
    const perfReports = app.findCollectionByNameOrId('performance_reports')
    if (!perfReports.fields.getByName('metrics_chosen')) {
      perfReports.fields.add(
        new JSONField({
          name: 'metrics_chosen',
          required: false,
        }),
      )
    }
    if (!perfReports.fields.getByName('filters_json')) {
      perfReports.fields.add(
        new JSONField({
          name: 'filters_json',
          required: false,
        }),
      )
    }
    app.save(perfReports)
  },
  (app) => {
    try {
      const posts = app.findCollectionByNameOrId('posts')
      posts.fields.removeByName('feed_item_id')
      posts.removeIndex('idx_posts_feed_item_id')
      app.save(posts)
    } catch (_) {}
  },
)
