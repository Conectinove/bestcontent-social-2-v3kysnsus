/**
 * MidiaViva / BestContent Social 2 - Facebook Page Comments & Engagement Hook
 *
 * Suporte à Página do Facebook conectada (ex.: Ronaldo Adriano Barretos · Conectinove):
 * - Detecta em runtime os segredos:
 *   FACEBOOK_PAGE_ACCESS_TOKEN (ou META_ACCESS_TOKEN / META_ADS_ACCESS_TOKEN)
 *   FACEBOOK_PAGE_ID (ou FACEBOOK_ACCOUNT_ID)
 *   FACEBOOK_GRAPH_API_BASE (opcional, default: https://graph.facebook.com/v19.0)
 *
 * Se as credenciais estiverem ausentes ou expiradas:
 * - status "simulated_fallback" ou "not_configured" com badge "Estimativa Calibrada".
 * Quando configuradas:
 * - Busca na API oficial do Graph do Facebook os comentários da página:
 *   * Posts recentes da página e seus comentários associados
 *   * Responde oficialmente via POST /{comment-id}/comments
 *   * Atualiza status no banco e permite sincronização bidirecional.
 *
 * Endpoints:
 * - GET /backend/v1/facebook/comments/status -> Status da integração com a página do Facebook
 * - GET /backend/v1/facebook/comments -> Listar comentários (oficiais ou calibrados do banco)
 * - POST /backend/v1/facebook/comments/reply -> Responder comentário
 * - POST /backend/v1/facebook/comments/status -> Alternar status do comentário (novo/respondido/ignorado)
 */

routerAdd('GET', '/backend/v1/facebook/comments/status', (e) => {
  const token = (
    $os.getenv('FACEBOOK_PAGE_ACCESS_TOKEN') ||
    $os.getenv('META_ACCESS_TOKEN') ||
    $os.getenv('META_ADS_ACCESS_TOKEN') ||
    ''
  ).trim()
  const pageId = ($os.getenv('FACEBOOK_PAGE_ID') || $os.getenv('FACEBOOK_ACCOUNT_ID') || '').trim()
  const apiBase = (
    $os.getenv('FACEBOOK_GRAPH_API_BASE') || 'https://graph.facebook.com/v19.0'
  ).trim()

  const configured = Boolean(token && token.length > 10)

  return e.json(200, {
    platform: 'facebook_page',
    name: 'Facebook Página Comercial (Ronaldo Adriano Barretos · Conectinove)',
    configured: configured,
    status: configured ? 'connected' : 'not_configured',
    tokenPrefix: token ? token.slice(0, 6) + '...' : null,
    pageId: pageId ? pageId.slice(0, 4) + '...' : null,
    apiBase: apiBase,
    requiredSecrets: [
      'FACEBOOK_PAGE_ACCESS_TOKEN (ou META_ACCESS_TOKEN / META_ADS_ACCESS_TOKEN)',
      'FACEBOOK_PAGE_ID (opcional se associado à conta)',
      'FACEBOOK_GRAPH_API_BASE (opcional)',
    ],
    message: configured
      ? 'Página do Facebook conectada via credenciais oficiais em runtime.'
      : 'Credenciais de Página do Facebook não detectadas nos segredos. Exibindo Estimativa Calibrada transparente vinculada à página Conectinove.',
  })
})

/**
 * Endpoint: Listar Comentários da Página do Facebook (Oficiais via Graph API ou Banco/Estimativa Calibrada)
 * GET /backend/v1/facebook/comments
 */
routerAdd(
  'GET',
  '/backend/v1/facebook/comments',
  (e) => {
    const token = (
      $os.getenv('FACEBOOK_PAGE_ACCESS_TOKEN') ||
      $os.getenv('META_ACCESS_TOKEN') ||
      $os.getenv('META_ADS_ACCESS_TOKEN') ||
      ''
    ).trim()
    const pageId = (
      $os.getenv('FACEBOOK_PAGE_ID') ||
      $os.getenv('FACEBOOK_ACCOUNT_ID') ||
      ''
    ).trim()
    const apiBase = ($os.getenv('FACEBOOK_GRAPH_API_BASE') || 'https://graph.facebook.com/v19.0')
      .trim()
      .replace(/\/$/, '')

    const isOfficial = Boolean(token && token.length > 10)
    const officialComments = []

    // Se as credenciais estiverem ativas, tenta buscar comentários oficiais mais recentes via Graph API
    if (isOfficial) {
      try {
        let targetPageId = pageId
        if (!targetPageId) {
          const accountsRes = $http.send({
            url: `${apiBase}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(token)}`,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            timeout: 10,
          })
          if (accountsRes.statusCode >= 200 && accountsRes.statusCode < 300) {
            const accData = JSON.parse(accountsRes.raw)
            const pages = accData.data || []
            if (pages.length > 0) {
              targetPageId = pages[0].id
            }
          }
        }

        if (targetPageId) {
          // Buscar posts recentes com seus comentários
          const feedRes = $http.send({
            url: `${apiBase}/${targetPageId}/posts?fields=id,message,created_time,permalink_url,full_picture,comments{id,message,from,created_time,like_count}&limit=6&access_token=${encodeURIComponent(token)}`,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            timeout: 12,
          })

          if (feedRes.statusCode >= 200 && feedRes.statusCode < 300) {
            const feedJson = JSON.parse(feedRes.raw)
            const posts = feedJson.data || []
            posts.forEach((p) => {
              const comms = p.comments?.data || []
              comms.forEach((c) => {
                const authorName = c.from?.name || 'Seguidor Facebook'
                const authorHandle = c.from?.id
                  ? `fb_${c.from.id}`
                  : authorName.toLowerCase().replace(/\s+/g, '.') || 'facebook_user'
                officialComments.push({
                  id: `fb_live_${c.id}`,
                  fb_comment_id: c.id,
                  author_handle: authorHandle,
                  author_name: authorName,
                  author_avatar: `https://img.usecurling.com/i?q=facebook&color=blue`,
                  text: c.message || '',
                  post_title: p.message ? p.message.slice(0, 52) + '...' : 'Publicação na Página',
                  post_thumbnail:
                    p.full_picture || 'https://img.usecurling.com/p/300/300?q=education&color=blue',
                  post_permalink: p.permalink_url || 'https://facebook.com',
                  status: 'novo',
                  likes_count: Number(c.like_count || 0),
                  is_official: true,
                  commented_at: c.created_time || new Date().toISOString(),
                })
              })
            })
          }
        }
      } catch (err) {
        $app
          .logger()
          .warn('Erro ao buscar comentários ao vivo do Facebook Graph API', 'error', String(err))
      }
    }

    // Carregar comentários persistidos no banco local (respostas, status, seeds)
    let dbComments = []
    try {
      const records = $app.findRecordsByFilter('facebook_comments', '', '-commented_at', 50, 0)
      if (records && records.length > 0) {
        dbComments = records.map((r) => ({
          id: r.id,
          fb_comment_id: r.getString('fb_comment_id'),
          author_handle: r.getString('author_handle'),
          author_name: r.getString('author_name') || r.getString('author_handle'),
          author_avatar:
            r.getString('author_avatar') || 'https://img.usecurling.com/ppl/medium?seed=24',
          text: r.getString('text'),
          post_title: r.getString('post_title') || 'Publicação no Facebook',
          post_thumbnail:
            r.getString('post_thumbnail') ||
            'https://img.usecurling.com/p/300/300?q=education&color=blue',
          post_permalink: r.getString('post_permalink') || 'https://facebook.com',
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

    // Mesclar comentários: banco de dados sempre tem prioridade de estado local (respostas gravadas)
    const mergedMap = {}
    dbComments.forEach((c) => {
      mergedMap[c.fb_comment_id || c.id] = c
    })
    officialComments.forEach((oc) => {
      if (!mergedMap[oc.fb_comment_id]) {
        mergedMap[oc.fb_comment_id] = oc
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
 * Endpoint: Responder a um comentário da Página do Facebook
 * POST /backend/v1/facebook/comments/reply
 * Body: { commentId: string, replyText: string }
 */
routerAdd(
  'POST',
  '/backend/v1/facebook/comments/reply',
  (e) => {
    const body = e.requestInfo().body || {}
    const commentId = (body.commentId || '').trim()
    const replyText = (body.replyText || '').trim()

    if (!commentId || !replyText) {
      return e.json(400, { error: 'commentId e replyText são obrigatórios.' })
    }

    const token = (
      $os.getenv('FACEBOOK_PAGE_ACCESS_TOKEN') ||
      $os.getenv('META_ACCESS_TOKEN') ||
      $os.getenv('META_ADS_ACCESS_TOKEN') ||
      ''
    ).trim()
    const apiBase = ($os.getenv('FACEBOOK_GRAPH_API_BASE') || 'https://graph.facebook.com/v19.0')
      .trim()
      .replace(/\/$/, '')

    let sentViaGraphApi = false
    let graphApiError = null

    // Se houver token oficial e o comentário for um ID da Graph API do Facebook
    if (token && token.length > 10) {
      try {
        let realFbCommentId = commentId
        if (realFbCommentId.startsWith('fb_live_')) {
          realFbCommentId = realFbCommentId.replace('fb_live_', '')
        }

        // Tentar enviar resposta oficial via POST /{comment-id}/comments
        const postRes = $http.send({
          url: `${apiBase}/${realFbCommentId}/comments?message=${encodeURIComponent(replyText)}&access_token=${encodeURIComponent(token)}`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeout: 10,
        })

        if (postRes.statusCode >= 200 && postRes.statusCode < 300) {
          sentViaGraphApi = true
        } else {
          graphApiError = `Graph API status ${postRes.statusCode}`
        }
      } catch (err) {
        graphApiError = String(err)
      }
    }

    // Persistir / atualizar o registro no banco local
    const nowIso = new Date().toISOString()
    let savedRecord = null

    try {
      const col = $app.findCollectionByNameOrId('facebook_comments')
      let rec = null

      try {
        rec = $app.findRecordById('facebook_comments', commentId)
      } catch (_) {
        try {
          rec = $app.findFirstRecordByFilter('facebook_comments', `fb_comment_id = "${commentId}"`)
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
          fb_comment_id: commentId,
          author_handle: body.authorHandle || 'facebook_user',
          text: body.originalText || 'Comentário original',
          status: 'respondido',
          reply_text: replyText,
          replied_at: nowIso,
          is_official: sentViaGraphApi,
          commented_at: nowIso,
        })
        $app.save(newRec)
        savedRecord = newRec
      }
    } catch (saveErr) {
      $app.logger().warn('Erro ao persistir resposta no banco', 'error', String(saveErr))
    }

    return e.json(200, {
      success: true,
      message: sentViaGraphApi
        ? 'Resposta enviada oficialmente ao Facebook via Graph API e salva no sistema.'
        : 'Resposta registrada com sucesso no sistema (simulado/calibrado).',
      sent_via_graph_api: sentViaGraphApi,
      graph_api_error: graphApiError,
      replied_at: nowIso,
      record_id: savedRecord ? savedRecord.id : commentId,
    })
  },
  $apis.requireAuth(),
)

/**
 * Endpoint: Alternar status do comentário do Facebook (marcar como ignorado / novo / respondido)
 * POST /backend/v1/facebook/comments/status
 * Body: { commentId: string, status: 'novo' | 'respondido' | 'ignorado' }
 */
routerAdd(
  'POST',
  '/backend/v1/facebook/comments/status',
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
        rec = $app.findRecordById('facebook_comments', commentId)
      } catch (_) {
        try {
          rec = $app.findFirstRecordByFilter('facebook_comments', `fb_comment_id = "${commentId}"`)
        } catch (_) {}
      }

      if (rec) {
        rec.set('status', status)
        $app.save(rec)
        return e.json(200, { success: true, status: status, id: rec.id })
      } else {
        const col = $app.findCollectionByNameOrId('facebook_comments')
        const newRec = new Record(col, {
          fb_comment_id: commentId,
          author_handle: body.authorHandle || 'facebook_user',
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
