// =========================================================================
// Cron de publicação agendada do portal (pedido "notificar quando pagina
// agendada for publicada"): detecta páginas cujo publish_at chegou, ainda
// não notificadas (published_notified = false), e cria uma notificação no
// app para o dono da organização (coleção notifications).
// Roda a cada 10 minutos. Toda lógica INLINE no callback (regra da casa —
// JSVM não enxerga funções de nível superior).
// =========================================================================
cronAdd('portal_publish_notify', '*/10 * * * *', () => {
  const nowIso = new Date().toISOString().replace('T', ' ')

  let pages = []
  try {
    pages = $app.findRecordsByFilter(
      'portal_pages',
      'publish_at != "" && publish_at <= {:now} && published_notified = false && is_visible = true',
      '-created',
      50,
      0,
      { now: nowIso },
    )
  } catch (e) {
    console.log('portal_publish_notify: erro ao buscar páginas: ' + e)
    pages = []
  }

  for (const page of pages) {
    try {
      // Dono da página = usuário que recebe a notificação no app.
      const owner = page.getString('user') || ''
      if (!owner) continue

      // Sem duplicar: se já existe notificação desta página, só marca a flag.
      let already = []
      try {
        already = $app.findRecordsByFilter(
          'notifications',
          'type = "page_published" && message ~ {:pageId}',
          '-created',
          1,
          0,
          { pageId: page.id },
        )
      } catch (_) {
        already = []
      }

      if (already.length === 0) {
        const title = page.getString('title') || 'Página sem título'
        const notifCol = $app.findCollectionByNameOrId('notifications')
        const notif = new Record(notifCol)
        notif.set('user', owner)
        notif.set('type', 'page_published')
        notif.set('message', 'A página "' + title + '" entrou no ar no portal (agendamento).')
        notif.set('actor_name', 'Portal')
        notif.set('is_read', false)
        $app.save(notif)
      }

      // Flag na própria página (idempotência do cron — nunca re-notifica).
      page.set('published_notified', true)
      $app.save(page)
    } catch (e) {
      console.log('portal_publish_notify: erro na página ' + page.id + ': ' + e)
    }
  }
})
