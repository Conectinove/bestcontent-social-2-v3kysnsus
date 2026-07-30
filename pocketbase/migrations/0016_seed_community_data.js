migrate(
  (app) => {
    const catCol = app.findCollectionByNameOrId('community_categories')
    const categoriesData = [
      { name: 'Avisos', slug: 'avisos', color: 'bg-blue-500' },
      { name: 'Tutoriais', slug: 'tutoriais', color: 'bg-emerald-500' },
      { name: 'Dúvidas', slug: 'duvidas', color: 'bg-amber-500' },
      { name: 'Sugestões', slug: 'sugestoes', color: 'bg-purple-500' },
      { name: 'Cases de Sucesso', slug: 'cases-de-sucesso', color: 'bg-teal-500' },
      { name: 'Trends', slug: 'trends', color: 'bg-pink-500' },
      { name: 'Offtopic', slug: 'offtopic', color: 'bg-slate-500' },
      { name: 'Novidades', slug: 'novidades', color: 'bg-indigo-500' },
    ]

    const catMap = {}
    for (var i = 0; i < categoriesData.length; i++) {
      var item = categoriesData[i]
      try {
        var existing = app.findFirstRecordByData('community_categories', 'slug', item.slug)
        catMap[item.slug] = existing.id
      } catch (_) {
        var rec = new Record(catCol)
        rec.set('name', item.name)
        rec.set('slug', item.slug)
        rec.set('color', item.color)
        app.save(rec)
        catMap[item.slug] = rec.id
      }
    }

    var userRec
    try {
      userRec = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
    } catch (_) {
      var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      userRec = new Record(usersCol)
      userRec.setEmail('ronaldoconectinove@gmail.com')
      userRec.setPassword('Skip@Pass')
      userRec.setVerified(true)
      userRec.set('name', 'Adenilson Santos')
      app.save(userRec)
    }

    const topicCol = app.findCollectionByNameOrId('community_topics')
    const seedTopics = [
      {
        title: '🎓 Chegou a BestContent Academy, e ela já tá no ar pra você.',
        content:
          'Galera, novidade grande: lançamos oficialmente a BestContent Academy. 🚀 Se a BestContent te ajuda a produzir conteúdo, a Academy é onde você aprende a dominar o jogo inteiro, da ideia que vira roteiro até o post chegando na pessoa certa, na hora certa.\n\nComo começar? É de graça e leva menos de 2 minutos. Entra com a mesma conta que você já usa na BestContent:\n\n👉 academy.bestcontent.ai/academy\n\nA gente tá começando com trilhas como Criação de Conteúdo com IA usando a BestContent e vem muito mais por aí.\n\nDepois que der uma volta lá, volta aqui e conta o que achou. 👇',
        categorySlug: 'novidades',
        tags: ['Novidades', 'Destaque', 'Fixado'],
        views_count: 325,
        likes_count: 6,
        is_pinned: true,
      },
      {
        title: 'Novos modelos chegando no BestContent Chat 🔥',
        content:
          '🚀 CHEGARAM OS NOVOS MODELOS MAIS PODEROSOS DO MERCADO NO BC CHAT! Preparamos uma atualização pra você criar, programar e analisar com ainda mais inteligência: 🌍 GPT 5.6 TERRA (disponível a partir do plano PRO) O parceiro do dia a dia: rápido, equilibrado e ótimo em tarefas pontuais e revisões rápidas. 🌟 GPT 5.6...',
        categorySlug: 'novidades',
        tags: ['Novidades', 'Destaque'],
        views_count: 36,
        likes_count: 5,
        is_pinned: false,
      },
      {
        title: '🚀 Roadmap — O que vem por aí na BestContent (Março a Junho)',
        content:
          'Quero compartilhar com vocês, de forma direta, o que estamos construindo nas próximas semanas e para onde o produto está evoluindo: 1. Mais qualidade nos posts (março e abril) ✅ Estamos focados em melhorar significativamente a qualidade dos conteúdos gerados, atuando em três frentes principais: Melhorias na geração da IA...',
        categorySlug: 'novidades',
        tags: ['Novidades', 'Fixado'],
        views_count: 816,
        likes_count: 22,
        is_pinned: true,
      },
      {
        title: '💡 Como otimizar engajamento nos Reels em 2026 com hooks inteligentes',
        content:
          'Separamos um passo a passo prático para estruturar hooks nos primeiros 3 segundos do seu vídeo e prender a atenção do público de forma orgânica. Aplique no seu próximo roteiro!',
        categorySlug: 'tutoriais',
        tags: ['Tutoriais', 'Destaque'],
        views_count: 420,
        likes_count: 14,
        is_pinned: false,
      },
      {
        title: '🔥 Case de Sucesso: Escalando de 2k para 45k seguidores em 60 dias',
        content:
          'Usando a aba Descobrir do BestContent para mapear tendências e gerar 3 reels por dia com o Guiado da IA. O segredo principal foi manter constância nas pautas quentes!',
        categorySlug: 'cases-de-sucesso',
        tags: ['Cases de Sucesso', 'Destaque'],
        views_count: 1250,
        likes_count: 48,
        is_pinned: false,
      },
    ]

    var replyCol = app.findCollectionByNameOrId('community_replies')

    for (var j = 0; j < seedTopics.length; j++) {
      var t = seedTopics[j]
      try {
        app.findFirstRecordByData('community_topics', 'title', t.title)
      } catch (_) {
        var topicRec = new Record(topicCol)
        topicRec.set('user', userRec.id)
        topicRec.set('category', catMap[t.categorySlug] || catMap['novidades'])
        topicRec.set('title', t.title)
        topicRec.set('content', t.content)
        topicRec.set('tags', t.tags)
        topicRec.set('views_count', t.views_count)
        topicRec.set('likes_count', t.likes_count)
        topicRec.set('is_pinned', t.is_pinned)
        app.save(topicRec)

        if (j === 0) {
          var r1 = new Record(replyCol)
          r1.set('user', userRec.id)
          r1.set('topic', topicRec.id)
          r1.set(
            'content',
            'Interessante! Conhecimento é sempre bem vindo, assim que tiver um tempinho dou uma olhadinha e falo o que eu achei 😌',
          )
          app.save(r1)

          var r2 = new Record(replyCol)
          r2.set('user', userRec.id)
          r2.set('topic', topicRec.id)
          r2.set('content', 'Demais! Já acessei a Academy e as trilhas de IA estão excelentes!')
          app.save(r2)
        }
      }
    }
  },
  (app) => {},
)
