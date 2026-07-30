migrate(
  (app) => {
    const brands = app.findCollectionByNameOrId('brands')
    if (!brands.fields.getByName('objective')) {
      brands.fields.add(
        new SelectField({
          name: 'objective',
          required: false,
          maxSelect: 1,
          values: ['sales', 'authority', 'engagement', 'leads'],
        }),
      )
    }
    if (!brands.fields.getByName('target_audience')) {
      brands.fields.add(new TextField({ name: 'target_audience', required: false }))
    }
    if (!brands.fields.getByName('visual_style')) {
      brands.fields.add(new TextField({ name: 'visual_style', required: false }))
    }
    if (!brands.fields.getByName('brand_voice')) {
      brands.fields.add(new TextField({ name: 'brand_voice', required: false }))
    }
    if (!brands.fields.getByName('website_url')) {
      brands.fields.add(new TextField({ name: 'website_url', required: false }))
    }
    app.save(brands)

    const posts = app.findCollectionByNameOrId('posts')
    if (!posts.fields.getByName('duration')) {
      posts.fields.add(new NumberField({ name: 'duration', required: false }))
    }
    if (!posts.fields.getByName('script_json')) {
      posts.fields.add(new JSONField({ name: 'script_json', required: false }))
    }
    if (!posts.fields.getByName('template_id')) {
      posts.fields.add(new TextField({ name: 'template_id', required: false }))
    }
    app.save(posts)
  },
  (app) => {
    // down migration optional
  },
)
