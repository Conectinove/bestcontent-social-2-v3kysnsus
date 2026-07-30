migrate(
  (app) => {
    var trendsData = [
      {
        title: 'Estratégias de Marketing de Conteúdo para 2025',
        description:
          'As principais tendências de marketing digital incluem vídeos curtos, IA generativa e personalização em massa para engajar audiências.',
        source_url: 'https://exemplo.com/marketing-2025',
        image_url: 'https://img.usecurling.com/p/400/300?q=marketing%20strategy',
        categorySlug: 'marketing',
        popularity_score: 92,
      },
      {
        title: 'Inteligência Artificial no Atendimento ao Cliente',
        description:
          'Chatbots com IA estão transformando o atendimento, reduzindo custos e melhorando a experiência do usuário em até 60%.',
        source_url: 'https://exemplo.com/ia-atendimento',
        image_url: 'https://img.usecurling.com/p/400/300?q=artificial%20intelligence',
        categorySlug: 'tecnologia',
        popularity_score: 88,
      },
      {
        title: 'Moda Sustentável: Tendências do Verão 2025',
        description:
          'Marcas de moda focam em tecidos reciclados e produção ética. Consumidores buscam transparência na cadeia de suprimentos.',
        source_url: 'https://exemplo.com/moda-sustentavel',
        image_url: 'https://img.usecurling.com/p/400/300?q=sustainable%20fashion',
        categorySlug: 'moda',
        popularity_score: 75,
      },
      {
        title: 'Receitas de Comida Confort para o Inverno',
        description:
          'Pratos quentes e nutritivos ganham destaque nas redes sociais. Vídeos de receitas rápidas acumulam milhões de visualizações.',
        source_url: 'https://exemplo.com/comida-inverno',
        image_url: 'https://img.usecurling.com/p/400/300?q=comfort%20food',
        categorySlug: 'food',
        popularity_score: 81,
      },
      {
        title: 'Roteiros de Viagem Econômicos pela América do Sul',
        description:
          'Destinos como Colômbia e Bolília ganham popularidade entre viajantes que buscam experiências autênticas com baixo orçamento.',
        source_url: 'https://exemplo.com/viagem-sulamerica',
        image_url: 'https://img.usecurling.com/p/400/300?q=south%20america%20travel',
        categorySlug: 'viagem',
        popularity_score: 67,
      },
      {
        title: 'Benefícios da Meditação para a Saúde Mental',
        description:
          'Estudos recentes confirmam que 15 minutos diários de meditação reduzem ansiedade em 40% e melhoram a qualidade do sono.',
        source_url: 'https://exemplo.com/meditacao-saude',
        image_url: 'https://img.usecurling.com/p/400/300?q=meditation%20wellness',
        categorySlug: 'saude',
        popularity_score: 84,
      },
      {
        title: 'Investimentos para Iniciantes em 2025',
        description:
          'Tesouro Direto, ETFs e investimentos em startups são as opções mais buscadas por quem está começando a investir este ano.',
        source_url: 'https://exemplo.com/investimentos-iniciantes',
        image_url: 'https://img.usecurling.com/p/400/300?q=financial%20investment',
        categorySlug: 'financas',
        popularity_score: 79,
      },
      {
        title: 'Cursos Online que estão em Alta em 2025',
        description:
          'Programação, design UX e marketing digital lideram as buscas por educação a distância com certificação reconhecida.',
        source_url: 'https://exemplo.com/cursos-online-2025',
        image_url: 'https://img.usecurling.com/p/400/300?q=online%20education',
        categorySlug: 'educacao',
        popularity_score: 73,
      },
      {
        title: 'Streamings que vão Dominar 2025',
        description:
          'Plataformas de streaming investem em conteúdo local e interativo. Expectativa de crescimento de 35% no mercado brasileiro.',
        source_url: 'https://exemplo.com/streamings-2025',
        image_url: 'https://img.usecurling.com/p/400/300?q=streaming%20platform',
        categorySlug: 'entretenimento',
        popularity_score: 86,
      },
      {
        title: 'Futevôlei: O Esporte que Cresce nas Praias Brasileiras',
        description:
          'Modalidade ganha novos praticantes e torneios profissionais. Influenciadores esportivos ajudam a popularizar o esporte.',
        source_url: 'https://exemplo.com/futevolei-praias',
        image_url: 'https://img.usecurling.com/p/400/300?q=beach%20soccer',
        categorySlug: 'esportes',
        popularity_score: 65,
      },
    ]

    var trendCol = app.findCollectionByNameOrId('trends')
    for (var i = 0; i < trendsData.length; i++) {
      var t = trendsData[i]
      try {
        app.findFirstRecordByData('trends', 'title', t.title)
      } catch (_) {
        var cat
        try {
          cat = app.findFirstRecordByData('categories', 'slug', t.categorySlug)
        } catch (_) {
          continue
        }
        var record = new Record(trendCol)
        record.set('title', t.title)
        record.set('description', t.description)
        record.set('source_url', t.source_url)
        record.set('image_url', t.image_url)
        record.set('category', cat.id)
        record.set('popularity_score', t.popularity_score)
        app.save(record)
      }
    }
  },
  (app) => {
    var trendRecords = app.findRecordsByFilter('trends', '1=1', '', 100, 0)
    for (var i = 0; i < trendRecords.length; i++) {
      app.delete(trendRecords[i])
    }
  },
)
