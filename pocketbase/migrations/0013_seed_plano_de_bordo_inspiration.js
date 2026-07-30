/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const categories = app.findCollectionByNameOrId('categories')
    let catId = ''
    try {
      const existing = app.findFirstRecordByData('categories', 'slug', 'mudarcurso')
      catId = existing.id
    } catch (_) {
      const cat = new Record(categories)
      cat.set('name', 'MudarCurso')
      cat.set('slug', 'mudarcurso')
      app.save(cat)
      catId = cat.id
    }

    const trends = app.findCollectionByNameOrId('trends')
    try {
      app.findFirstRecordByData('trends', 'title', 'Plano de Bordo Realizador')
    } catch (_) {
      const trend = new Record(trends)
      trend.set('category', catId)
      trend.set('title', 'Plano de Bordo Realizador')
      trend.set(
        'description',
        'Sua Jornada Para a Vida Boa - Estratégia de Vendas e Storytelling para MudarCurso.com.br',
      )
      trend.set('source_url', 'https://mudarcurso.com.br')
      trend.set(
        'image_url',
        'https://img.usecurling.com/p/600/900?q=wanderer%20mountain%20compass&color=purple',
      )
      trend.set('popularity_score', 99)
      app.save(trend)
    }
  },
  (app) => {
    try {
      const trend = app.findFirstRecordByData('trends', 'title', 'Plano de Bordo Realizador')
      app.delete(trend)
    } catch (_) {}
  },
)
