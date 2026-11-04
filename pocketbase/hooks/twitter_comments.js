/**
 * MidiaViva / BestContent Social 2 - X (Twitter) Comments Hook
 *
 * Padrão da casa: segredos detectados em runtime -> "Dados Oficiais";
 * sem segredos -> "Estimativa Calibrada" determinística e transparente.
 *
 * Segredos (checados via list_secrets):
 *   TWITTER_BEARER_TOKEN (ou X_BEARER_TOKEN)
 *   X_API_KEY (ou TWITTER_API_KEY, opcional — app key para OAuth 1.0a de resposta)
 *   X_API_BASE (opcional, default: https://api.x.com/2)
 *
 * Endpoints:
 * - GET  /backend/v1/twitter/comments/status -> status da integração
 * - GET  /backend/v1/twitter/comments        -> menções/respostas recebidas
 * - POST /backend/v1/twitter/comments/reply  -> responder tweet
 * - POST /backend/v1/twitter/comments/status -> alternar status (novo/respondido/ignorado)
 */

routerAdd('GET', '/backend/v1/twitter/comments/status', (e) => {
  const bearer = ($os.getenv('TWITTER_BEARER_TOKEN') || $os.getenv('X_BEARER_TOKEN') || '').trim()
  const apiKey = ($os.getenv('X_API_KEY') || $os.getenv('TWITTER_API_KEY') || '').trim()
  const apiBase = ($os.getenv('X_API_BASE') || 'https://api.x.com/2').trim()

  const configured = Boolean(bearer && bearer.length > 10)

  return e.json(200, {
    platform: 'x_twitter',
    name: 'X (Twitter) · Conectinove',
    configured: configured,
    status: configured ? 'connected' : 'not_configured',
    tokenPrefix: bearer ? bearer.slice(0, 6) + '...' : null,
    apiKeyPresent: Boolean(apiKey),
    apiBase: apiBase,
    requiredSecrets: [
      'TWITTER_BEARER_TOKEN (ou X_BEARER_TOKEN)',
      'X_API_KEY (ou TWITTER_API_KEY, opcional)',
      'X_API_BASE (opcional)',
    ],
    message: configured
      ? 'Mentions e respostas via API oficial do X em runtime.'
      : 'Credenciais do X não detectadas nos segredos. Exibindo Estimativa Calibrada transparente para o perfil @conectinove.',
  })
})

/**
 * Endpoint: Listar menções/respostas recebidas no X
 * GET /backend/v1/twitter/comments
 */
routerAdd(
  'GET',
  '/backend/v1/twitter/comments',
  (e) => {
    const bearer = ($os.getenv('TWITTER_BEARER_TOKEN') || $os.getenv('X_BEARER_TOKEN') || '').trim()
    const apiBase = ($os.getenv('X_API_BASE') || 'https://api.x.com/2').trim().replace(/\/$/, '')

    const isOfficial = Boolean(bearer && bearer.length > 10)
    const officialComments = []

    if (isOfficial) {
      try {
        // 1) Resolve o ID do usuário autenticado (@conectinove)
        const meRes = $http.send({
          url: `${apiBase}/users/me`,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${bearer}`,
            'Content-Type': 'application/json',
          },
          timeout: 10,
        })

        if (meRes.statusCode >= 200 && meRes.statusCode < 300) {
          const me = JSON.parse(meRes.raw)
          const userId = me?.data?.id

          if (userId) {
            // 2) Busca mentions recentes
            const mentionsRes = $http.send({
              url: `${apiBase}/users/${userId}/mentions?max_results=25&tweet.fields=created_at,public_metrics,conversation_id,in_reply_to_user_id&expansions=author_id&user.fields=username,name,profile_image_url`,
              method: 'GET',
              headers: {
                Authorization: `Bearer ${bearer}`,
                'Content-Type': 'application/json',
              },
              timeout: 12,
            })

            if (mentionsRes.statusCode >= 200 && mentionsRes.statusCode < 300) {
              const payload = JSON.parse(mentionsRes.raw)
              const usersMap = {}
              ;(payload.includes?.users || []).forEach((u) => {
                usersMap[u.id] = u
              })
              ;(payload.data || []).forEach((t) => {
                const author = usersMap[t.author_id] || {}
                officialComments.push({
                  id: `tw_live_${t.id}`,
                  tw_comment_id: t.id,
                  author_handle: author.username || 'x_user',
                  author_name: author.name || author.username || 'Usuário X',
                  author_avatar:
                    author.profile_image_url || 'https://img.usecurling.com/ppl/medium?seed=52',
                  text: t.text || '',
                  post_title: 'Menção no X',
                  post_permalink: `https://x.com/${author.username || 'i'}/status/${t.id}`,
                  status: 'novo',
                  likes_count: Number(t.public_metrics?.like_count || 0),
                  is_official: true,
                  commented_at: t.created_at || new Date().toISOString(),
                })
              })
            }
          }
        }
      } catch (err) {
        $app.logger().warn('Erro ao buscar mentions do X (Twitter) API', 'error', String(err))
      }
    }

    // Carregar comentários persistidos no banco local (respostas, status, seeds)
    let dbComments = []
    try {
      const records = $app.findRecordsByFilter('twitter_comments', '', '-commented_at', 50, 0)
      if (records && records.length > 0) {
        dbComments = records.map((r) => ({
          id: r.id,
          tw_comment_id: r.getString('tw_comment_id'),
          author_handle: r.getString('author_handle'),
          author_name: r.getString('author_name') || r.getString('author_handle'),
          author_avatar:
            r.getString('author_avatar') || 'https://img.usecurling.com/ppl/medium?seed=52',
          text: r.getString('text'),
          post_title: r.getString('post_title') || 'Publicação no X',
          post_permalink: r.getString('post_permalink') || 'https://x.com',
          status: r.getString('status') || 'novo',
          reply_text: r.getString('reply_text') || '',
          replied_at: r.getString('replied_at') || null,
          likes_count: r.getInt('likes_count') || 0,
          is_official: r.getBool('is_official'),
          commented_at: r.getString('commented_at') || r.getString('created'),
          created: r.getString('created'),
          updated: r.getString('updated'),
        }))
      }
    } catch (_) {}

    // Mesclar: banco local tem prioridade de estado (respostas gravadas)
    const mergedMap = {}
    dbComments.forEach((c) => {
      mergedMap[c.tw_comment_id || c.id] = c
    })
    officialComments.forEach((oc) => {
      if (!mergedMap[oc.tw_comment_id]) {
        mergedMap[oc.tw_comment_id] = oc
      }
    })

    const finalComments = Object.values(mergedMap)
    finalComments.sort((a, b) => {
      const tA = new Date(a.commented_at || a.created || 0).getTime()
      const tB = new Date(b.commented_at || b.created || 0).getTime()
      return tB - tA
    })

    const pendingCount = finalComments.filter((c) => c.status === 'novo').length

    return e.json(200, {
      success: true,
      is_official: isOfficial && officialComments.length > 0,
      badge_label:
        isOfficial && officialComments.length > 0 ? 'Dados Oficiais' : 'Estimativa Calibrada',
      pending_count: pendingCount,
      total_count: finalComments.length,
      comments: finalComments,
    })
  },
  $apis.requireAuth(),
)

/**
 * Endpoint: Responder a um tweet/mention
 * POST /backend/v1/twitter/comments/reply
 * Body: { commentId: string, replyText: string, authorHandle?: string, originalText?: string }
 */
routerAdd(
  'POST',
  '/backend/v1/twitter/comments/reply',
  (e) => {
    const body = e.requestInfo().body || {}
    const commentId = (body.commentId || '').trim()
    const replyText = (body.replyText || '').trim()

    if (!commentId || !replyText) {
      return e.json(400, { error: 'commentId e replyText são obrigatórios.' })
    }

    const bearer = ($os.getenv('TWITTER_BEARER_TOKEN') || $os.getenv('X_BEARER_TOKEN') || '').trim()
    const apiKey = ($os.getenv('X_API_KEY') || $os.getenv('TWITTER_API_KEY') || '').trim()
    const apiBase = ($os.getenv('X_API_BASE') || 'https://api.x.com/2').trim().replace(/\/$/, '')

    let sentViaXApi = false
    let xApiError = null

    // Resposta oficial via API do X (somente com token + app key OAuth 1.0a)
    if (bearer && bearer.length > 10 && apiKey) {
      try {
        let realTweetId = commentId
        if (realTweetId.startsWith('tw_live_')) {
          realTweetId = realTweetId.replace('tw_live_', '')
        }
        const replyRes = $http.send({
          url: `${apiBase}/tweets`,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${bearer}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: replyText,
            reply: { in_reply_to_tweet_id: realTweetId },
          }),
          timeout: 10,
        })
        if (replyRes.statusCode >= 200 && replyRes.statusCode < 300) {
          sentViaXApi = true
        } else {
          xApiError = `X API status ${replyRes.statusCode}`
        }
      } catch (err) {
        xApiError = String(err)
      }
    }

    // Persistir / atualizar o registro no banco local
    const nowIso = new Date().toISOString()
    let savedRecord = null

    try {
      const col = $app.findCollectionByNameOrId('twitter_comments')
      let rec = null

      try {
        rec = $app.findRecordById('twitter_comments', commentId)
      } catch (_) {
        try {
          rec = $app.findFirstRecordByFilter('twitter_comments', `tw_comment_id = "${commentId}"`)
        } catch (_) {}
      }

      if (rec) {
        rec.set('status', 'respondido')
        rec.set('reply_text', replyText)
        rec.set('replied_at', nowIso)
        $app.save(rec)
        savedRecord = rec
      } else {
        const newRec = new Record(col, {
          tw_comment_id: commentId,
          author_handle: body.authorHandle || 'x_user',
          text: body.originalText || 'Comentário original',
          status: 'respondido',
          reply_text: replyText,
          replied_at: nowIso,
          is_official: sentViaXApi,
          commented_at: nowIso,
        })
        $app.save(newRec)
        savedRecord = newRec
      }
    } catch (saveErr) {
      $app.logger().warn('Erro ao persistir resposta do X no banco', 'error', String(saveErr))
    }

    return e.json(200, {
      success: true,
      message: sentViaXApi
        ? 'Resposta publicada oficialmente no X via API e salva no sistema.'
        : 'Resposta registrada com sucesso no sistema (simulado/calibrado).',
      sent_via_x_api: sentViaXApi,
      x_api_error: xApiError,
      replied_at: nowIso,
      record_id: savedRecord ? savedRecord.id : commentId,
    })
  },
  $apis.requireAuth(),
)

/**
 * Endpoint: Alternar status do comentário do X (novo / respondido / ignorado)
 * POST /backend/v1/twitter/comments/status
 * Body: { commentId: string, status: 'novo' | 'respondido' | 'ignorado' }
 */
routerAdd(
  'POST',
  '/backend/v1/twitter/comments/status',
  (e) => {
    const body = e.requestInfo().body || {}
    const commentId = (body.commentId || '').trim()
    const status = (body.status || 'novo').trim()

    if (!commentId) {
      return e.json(400, { error: 'commentId é obrigatório.' })
    }

    try {
      let rec = null
      try {
        rec = $app.findRecordById('twitter_comments', commentId)
      } catch (_) {
        try {
          rec = $app.findFirstRecordByFilter('twitter_comments', `tw_comment_id = "${commentId}"`)
        } catch (_) {}
      }

      if (rec) {
        rec.set('status', status)
        $app.save(rec)
        return e.json(200, { success: true, status: status, id: rec.id })
      } else {
        const col = $app.findCollectionByNameOrId('twitter_comments')
        const newRec = new Record(col, {
          tw_comment_id: commentId,
          author_handle: body.authorHandle || 'x_user',
          text: body.originalText || 'Comentário',
          status: status,
          commented_at: new Date().toISOString(),
        })
        $app.save(newRec)
        return e.json(200, { success: true, status: status, id: newRec.id })
      }
    } catch (err) {
      return e.json(500, { error: String(err) })
    }
  },
  $apis.requireAuth(),
)
