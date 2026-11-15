/// <reference path="../pb_data/types.d.ts" />
// Cron: processa a fila social_publications e dispara publicações pendentes
// usando a conta de CADA usuário (per-user, $connectors.executeAsUser) — nunca a do builder.
// IMPORTANTE (JSVM do PocketBase): callbacks de cronAdd/hooks NÃO enxergam funções ou
// constantes de nível superior — TODO o código abaixo vive inline dentro do callback,
// sem closures auxiliares e sem referências externas.
cronAdd('social_publications_queue', '*/5 * * * *', () => {
  const due = $app.findRecordsByFilter(
    'social_publications',
    "status = 'pending' && scheduled_at <= @now",
    'scheduled_at',
    20,
    0,
  )

  for (let i = 0; i < due.length; i++) {
    const pub = due[i]
    const userId = pub.get('user') + ''
    const network = pub.get('network') + ''
    const postId = pub.get('post') + ''
    let caption = ''
    let mediaUrls = []

    try {
      const post = $app.findRecordById('posts', postId)
      caption = (post.get('caption') || post.get('content') || '') + ''
      const mediaField = post.get('media')
      if (Array.isArray(mediaField)) {
        mediaUrls = mediaField.map(function (f) {
          return f + ''
        })
      } else if (mediaField) {
        mediaUrls = [mediaField + '']
      }
    } catch (e) {
      // markFailed inline: limite de 3 tentativas
      const attemptsFail = pub.getInt('attempts') || 0
      pub.set('attempts', attemptsFail + 1)
      pub.set('error_message', ('Post associado não encontrado: ' + e).slice(0, 2000))
      if (attemptsFail + 1 >= 3) {
        pub.set('status', 'failed')
      }
      $app.save(pub)
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
        // markFailed inline: rede não suportada → falha definitiva
        const attemptsNet = pub.getInt('attempts') || 0
        pub.set('attempts', attemptsNet + 1)
        pub.set(
          'error_message',
          ('Rede não suportada para disparo automático: ' + network).slice(0, 2000),
        )
        pub.set('status', 'failed')
        $app.save(pub)
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
        // markFailed inline: erro reportado pelo conector
        const attemptsErr = pub.getInt('attempts') || 0
        pub.set('attempts', attemptsErr + 1)
        pub.set(
          'error_message',
          String((res && res.error) || 'Falha desconhecida no conector ' + network).slice(0, 2000),
        )
        if (attemptsErr + 1 >= 3) {
          pub.set('status', 'failed')
        }
        $app.save(pub)
      }
    } catch (e) {
      // markFailed inline: exceção no disparo
      const attemptsExc = pub.getInt('attempts') || 0
      pub.set('attempts', attemptsExc + 1)
      pub.set('error_message', ('Erro no disparo: ' + e).slice(0, 2000))
      if (attemptsExc + 1 >= 3) {
        pub.set('status', 'failed')
      }
      $app.save(pub)
    }
  }
})
