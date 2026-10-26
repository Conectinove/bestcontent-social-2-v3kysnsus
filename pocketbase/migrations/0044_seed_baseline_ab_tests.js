migrate(
  (app) => {
    // =========================================================================
    // Migration 0044: Semear testes A/B baseline para marcas existentes
    // Garante que o usuário veja testes concluídos e em andamento com variantes
    // reais ou rascunhos associados.
    // =========================================================================
    const abCol = app.findCollectionByNameOrId('ab_tests')
    const postsCol = app.findCollectionByNameOrId('posts')

    try {
      const usersList = app.findRecordsByFilter('users', '', '-created', 50, 0)

      for (let u = 0; u < usersList.length; u++) {
        const userRec = usersList[u]
        const userId = userRec.id

        // Verificar se já possui algum teste cadastrado
        const existingTests = app.findRecordsByFilter(
          'ab_tests',
          `user = "${userId}"`,
          '-created',
          10,
          0,
        )

        if (existingTests.length === 0) {
          // Buscar posts do usuário ou criar dois posts de teste
          let userPosts = app.findRecordsByFilter('posts', `user = "${userId}"`, '-created', 10, 0)

          let postAId = ''
          let postBId = ''

          if (userPosts.length >= 2) {
            postAId = userPosts[0].id
            postBId = userPosts[1].id
          } else {
            // Buscar marcas do usuário para associar
            const userBrands = app.findRecordsByFilter(
              'brands',
              `user = "${userId}"`,
              '-created',
              1,
              0,
            )
            const brandId = userBrands.length > 0 ? userBrands[0].id : null

            // Criar Post A
            const pA = new Record(postsCol)
            pA.set('user', userId)
            if (brandId) pA.set('brand', brandId)
            pA.set('title', 'Variante A: Gancho Direto com Pergunta')
            pA.set(
              'caption',
              'Você comete esse erro clássico no seu marketing? Descubra o método dos top 1%. 🚀',
            )
            pA.set('platform', 'instagram')
            pA.set('status', 'published')
            pA.set('tags', JSON.stringify(['marketing', 'dicas', 'crescimento']))
            app.save(pA)
            postAId = pA.id

            // Criar Post B
            const pB = new Record(postsCol)
            pB.set('user', userId)
            if (brandId) pB.set('brand', brandId)
            pB.set('title', 'Variante B: Storytelling e Prova Social')
            pB.set(
              'caption',
              'Como saímos do zero a mais de 10k seguidores sem gastar um real com anúncios. Passo a passo detalhado no carrossel!',
            )
            pB.set('platform', 'instagram')
            pB.set('status', 'published')
            pB.set('tags', JSON.stringify(['storytelling', 'autoridade', 'estratégia']))
            app.save(pB)
            postBId = pB.id
          }

          // Criar Teste A/B Concluído (Variante B Venceu)
          const test1 = new Record(abCol)
          test1.set('user', userId)
          test1.set('post_a', postAId)
          test1.set('post_b', postBId)
          test1.set('status', 'completed')
          test1.set('goal', 'clicks')
          test1.set('winner', postBId)
          test1.set('start_date', '2025-01-10')
          test1.set('end_date', '2025-01-17')
          app.save(test1)

          // Criar Teste A/B Em Andamento
          const test2 = new Record(abCol)
          test2.set('user', userId)
          test2.set('post_a', postAId)
          test2.set('post_b', postBId)
          test2.set('status', 'running')
          test2.set('goal', 'conversions')
          test2.set('start_date', '2025-02-01')
          test2.set('end_date', '2025-02-08')
          app.save(test2)
        }
      }
    } catch (e) {
      console.log('Erro ao semear ab_tests baseline:', e)
    }
  },
  (app) => {
    // Reversão limpa
  },
)
