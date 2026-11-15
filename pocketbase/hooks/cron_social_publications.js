/// <reference path="../pb_data/types.d.ts" />
// Cron: processa a fila social_publications e dispara publicações pendentes
// usando a conta de CADA usuário (per-user, $connectors.executeAsUser) — nunca a do builder.
// IMPORTANTE: a JSVM do PocketBase executa callbacks em pool separado — toda a lógica
// precisa viver DENTRO do corpo do callback, sem funções de nível superior.
cronAdd('social_publications_queue', '*/5 * * * *', () => {
  const due = $app.findRecordsByFilter(
    'social_publications',
    "status = 'pending' && scheduled_at <= @now",
    'scheduled_at',
    20,
    0,
  )

  for (const pub of due) {
    const userId = pub.get('user') + ''
    const network = pub.get('network') + ''
    const postId = pub.get('post') + ''
    let caption = ''
    let mediaUrls = []

    // markFailed inline (com limite de 3 tentativas)
    const markFailed = (message) => {
      const attempts = pub.getInt('attempts') || 0
      pub.set('attempts', attempts + 1)
      if (attempts + 1 >= 3) {
        pub.set('error_message', String(message).slice(0, 2000))
        pub.set('status', 'failed')
      }
      $app.save(pub)
    }

    try {
      const post = $app.findRecordById('posts', postId)
      caption = (post.get('caption') || post.get('content') || '') + ''
      const mediaField = post.get('media')
      if (Array.isArray(mediaField)) {
        mediaUrls = mediaField.map((f) => f + '')
      } else if (mediaField) {
        mediaUrls = [mediaField + '']
      }
    } catch (e) {
      markFailed('Post associado não encontrado: ' + e)
      continue
    }

    try {
      let res = null
      if (network === 'instagram') {
        res = $connectors.executeAsUser(userId, 'instagram', 'INSTAGRAM_CREATE_POST', {
          caption: caption,
          image_urls: mediaUrls,
        })
      } else if (network === 'facebook') {
        res = $connectors.executeAsUser(userId, 'facebook', 'FACEBOOK_CREATE_PAGE_POST', {
          message: caption,
        })
      } else {
        markFailed('Rede não suportada para disparo automático: ' + network)
        continue
      }

      if (res && res.successful) {
        pub.set('status', 'published')
        pub.set('published_at', new Date().toISOString())
        pub.set('error_message', '')
        const data = res.data || {}
        const extId = data.id || data.post_id || data.postId || (data.data && data.data.id) || ''
        if (extId) pub.set('external_post_id', extId + '')
        $app.save(pub)
      } else {
        const msg = (res && res.error) || 'Falha desconhecida no conector ' + network
        markFailed(msg)
      }
    } catch (e) {
      markFailed('Erro no disparo: ' + e)
    }
  }
})
