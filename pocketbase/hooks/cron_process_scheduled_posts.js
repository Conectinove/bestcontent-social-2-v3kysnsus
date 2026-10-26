// =========================================================================
// Hook: Processador de Agendamento de Posts (cronAdd)
// Executa a cada minuto:
// 1. Varre posts com status 'scheduled' cuja scheduled_date <= agora
// 2. Transiciona status para 'published'
// 3. Grava post_metrics baseline e atualiza scheduled_posts pendentes
// 4. Também oferece rota manual /backend/v1/posts/process-scheduled para teste imediato
// =========================================================================

// Agendar cron periódico para rodar a cada minuto: '* * * * *'
cronAdd('process_scheduled_posts_job', '* * * * *', () => {
  const now = new Date()
  const nowIso = now.toISOString()

  try {
    const scheduledPosts = $app.findRecordsByFilter(
      'posts',
      'status = "scheduled"',
      'scheduled_date',
      100,
      0,
    )

    let postMetricsCol = null
    try {
      postMetricsCol = $app.findCollectionByNameOrId('post_metrics')
    } catch (_) {}

    for (let i = 0; i < scheduledPosts.length; i++) {
      const post = scheduledPosts[i]
      const scheduledDateStr = post.getString('scheduled_date')

      if (!scheduledDateStr) {
        continue
      }

      const postDate = new Date(scheduledDateStr.replace(' ', 'T'))
      if (isNaN(postDate.getTime())) {
        continue
      }

      if (postDate.getTime() <= now.getTime()) {
        post.set('status', 'published')
        $app.save(post)

        try {
          const spRecords = $app.findRecordsByFilter(
            'scheduled_posts',
            `post = "${post.id}" && status = "pending"`,
            '-created',
            5,
            0,
          )
          for (let s = 0; s < spRecords.length; s++) {
            const sp = spRecords[s]
            sp.set('status', 'published')
            $app.save(sp)
          }
        } catch (_) {}

        if (postMetricsCol) {
          try {
            $app.findFirstRecordByFilter('post_metrics', `post = "${post.id}"`)
          } catch (_) {
            try {
              const rec = new Record(postMetricsCol)
              rec.set('post', post.id)
              rec.set('user', post.getString('user'))

              const rawPlat = (post.getString('platform') || 'instagram').toLowerCase()
              let rede = 'instagram'
              if (rawPlat.includes('tik')) rede = 'tiktok'
              else if (rawPlat.includes('link')) rede = 'linkedin'
              else if (rawPlat.includes('you')) rede = 'youtube'
              else if (rawPlat.includes('face')) rede = 'facebook'
              else if (rawPlat.includes('twit') || rawPlat === 'x') rede = 'twitter'

              const seed = (post.id.charCodeAt(0) * 13 + i * 23) % 100
              const alcance = 1100 + seed * 35
              const impressoes = Math.round(alcance * 1.32)
              const cliques = Math.round(alcance * 0.042)
              const salvamentos = Math.round(alcance * 0.028)
              const engajamento = Math.round(alcance * 0.065)
              const taxa = Number(((engajamento / Math.max(impressoes, 1)) * 100).toFixed(2))

              rec.set('rede', rede)
              rec.set('alcance', alcance)
              rec.set('impressoes', impressoes)
              rec.set('cliques', cliques)
              rec.set('salvamentos', salvamentos)
              rec.set('engajamento', engajamento)
              rec.set('taxa_engajamento', taxa)
              rec.set('is_simulated', true)
              rec.set('data', nowIso)
              $app.save(rec)
            } catch (_) {}
          }
        }
      }
    }
  } catch (err) {
    $app.logger().error('Erro ao processar posts agendados no cron', 'error', String(err))
  }
})

// Rota para disparo manual ou verificação sob demanda
routerAdd(
  'POST',
  '/backend/v1/posts/process-scheduled',
  (e) => {
    const now = new Date()
    const nowIso = now.toISOString()
    let processedCount = 0

    try {
      const scheduledPosts = $app.findRecordsByFilter(
        'posts',
        'status = "scheduled"',
        'scheduled_date',
        100,
        0,
      )

      let postMetricsCol = null
      try {
        postMetricsCol = $app.findCollectionByNameOrId('post_metrics')
      } catch (_) {}

      for (let i = 0; i < scheduledPosts.length; i++) {
        const post = scheduledPosts[i]
        const scheduledDateStr = post.getString('scheduled_date')

        if (!scheduledDateStr) {
          continue
        }

        const postDate = new Date(scheduledDateStr.replace(' ', 'T'))
        if (isNaN(postDate.getTime())) {
          continue
        }

        if (postDate.getTime() <= now.getTime()) {
          post.set('status', 'published')
          $app.save(post)
          processedCount++

          try {
            const spRecords = $app.findRecordsByFilter(
              'scheduled_posts',
              `post = "${post.id}" && status = "pending"`,
              '-created',
              5,
              0,
            )
            for (let s = 0; s < spRecords.length; s++) {
              const sp = spRecords[s]
              sp.set('status', 'published')
              $app.save(sp)
            }
          } catch (_) {}

          if (postMetricsCol) {
            try {
              $app.findFirstRecordByFilter('post_metrics', `post = "${post.id}"`)
            } catch (_) {
              try {
                const rec = new Record(postMetricsCol)
                rec.set('post', post.id)
                rec.set('user', post.getString('user'))

                const rawPlat = (post.getString('platform') || 'instagram').toLowerCase()
                let rede = 'instagram'
                if (rawPlat.includes('tik')) rede = 'tiktok'
                else if (rawPlat.includes('link')) rede = 'linkedin'
                else if (rawPlat.includes('you')) rede = 'youtube'
                else if (rawPlat.includes('face')) rede = 'facebook'
                else if (rawPlat.includes('twit') || rawPlat === 'x') rede = 'twitter'

                const seed = (post.id.charCodeAt(0) * 13 + i * 23) % 100
                const alcance = 1100 + seed * 35
                const impressoes = Math.round(alcance * 1.32)
                const cliques = Math.round(alcance * 0.042)
                const salvamentos = Math.round(alcance * 0.028)
                const engajamento = Math.round(alcance * 0.065)
                const taxa = Number(((engajamento / Math.max(impressoes, 1)) * 100).toFixed(2))

                rec.set('rede', rede)
                rec.set('alcance', alcance)
                rec.set('impressoes', impressoes)
                rec.set('cliques', cliques)
                rec.set('salvamentos', salvamentos)
                rec.set('engajamento', engajamento)
                rec.set('taxa_engajamento', taxa)
                rec.set('is_simulated', true)
                rec.set('data', nowIso)
                $app.save(rec)
              } catch (_) {}
            }
          }
        }
      }
    } catch (err) {
      $app.logger().error('Erro manual ao processar posts agendados', 'error', String(err))
      return e.json(500, { error: String(err) })
    }

    return e.json(200, {
      success: true,
      processedCount: processedCount,
      timestamp: nowIso,
      message: `Processamento concluído. ${processedCount} post(s) transicionados para publicado.`,
    })
  },
  $apis.requireAuth(),
)
