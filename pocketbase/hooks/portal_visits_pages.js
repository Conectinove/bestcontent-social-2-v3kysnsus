// =========================================================================
// Hooks dos portais de marca — estende portal_share.js (0.0.259):
//  - GET  /backend/v1/portals/share/{token}       -> já existe em portal_share.js
//  - GET  /backend/v1/portals/pages/{token}       -> páginas internas (público)
//  - POST /backend/v1/portals/visits/{token}      -> registra visita (público)
//  - GET  /backend/v1/portals/metrics/{portalId}  -> analytics de visitas (dono)
//  - GET  /backend/v1/portals/visits-export/{id}  -> exporta visitas (dono)
//  - POST /backend/v1/portals/video-plays/{token} -> registra play de vídeo (público)
//  - POST /backend/v1/portals/theme               -> salva as cores por marca (dono)
// Regra da casa: TODA lógica INLINE dentro do callback (JSVM não enxerga
// funções de nível superior — 'Hook scoping error').
// =========================================================================

// ---------- Páginas internas: leitura PÚBLICA por token ----------
routerAdd('GET', '/backend/v1/portals/pages/{token}', (e) => {
  const token = (e.request.pathValue('token') || '').trim()
  if (!token) return e.notFound('Link de portal inválido.')

  let portal = null
  try {
    portal = $app.findFirstRecordByFilter(
      'brand_portals',
      'share_token = {:token} && published = true',
      { token },
    )
  } catch (_) {
    return e.notFound('Este portal não existe mais ou foi despublicado.')
  }

  const brandId = portal.getString('brand')
  let pages = []
  try {
    pages = $app.findRecordsByFilter(
      'portal_pages',
      'brand = {:brand} && is_visible = true',
      'sort_order asc, created asc',
      50,
      0,
      { brand: brandId },
    )
  } catch (_) {
    pages = []
  }

  const nowMs = Date.now()
  const items = []
  for (const p of pages) {
    // ---- Agendamento (pedido "agendar publicação de páginas"): página com
    // publish_at no futuro NÃO aparece na pública (nem na navegação). ----
    const publishRaw = p.getString('publish_at') || ''
    if (publishRaw) {
      let publishMs = NaN
      try {
        publishMs = new Date(publishRaw.replace(' ', 'T')).getTime()
      } catch (_) {
        publishMs = NaN
      }
      if (!isNaN(publishMs) && publishMs > nowMs) continue
    }

    let content = {}
    try {
      content = JSON.parse(p.getString('content') || '{}')
    } catch (_) {
      content = { text: p.getString('content') || '' }
    }

    // ---- Vídeo próprio (pedido "upload de vídeo próprio"): blocos de vídeo
    // com mediaId resolvem a URL pública do arquivo em portal_media. ----
    const blocks = content && content.blocks
    if (Array.isArray(blocks)) {
      for (const b of blocks) {
        if (!b || b.type !== 'video' || !b.mediaId) continue
        try {
          const media = $app.findRecordById('portal_media', String(b.mediaId))
          const file = media.getString('file')
          if (file) {
            const fileUrl = '/api/files/portal_media/' + media.id + '/' + file
            b.url = fileUrl
            b.mediaUrl = fileUrl
          }
        } catch (_) {
          // mídia removida: deixa a url como está (ou vazia)
        }
      }
    }

    items.push({
      id: p.id,
      title: p.getString('title'),
      slug: p.getString('slug'),
      content,
    })
  }

  return e.json(200, { success: true, pages: items })
})

// ---------- Analytics: registra visita (PÚBLICO, sem dados pessoais) ----------
routerAdd('POST', '/backend/v1/portals/visits/{token}', (e) => {
  const token = (e.request.pathValue('token') || '').trim()
  if (!token) return e.badRequest('Token ausente.')

  let portal = null
  try {
    portal = $app.findFirstRecordByFilter(
      'brand_portals',
      'share_token = {:token} && published = true',
      { token },
    )
  } catch (_) {
    return e.notFound('Portal não encontrado.')
  }

  const body = e.requestInfo().body || {}
  const pageSlug = String(body.pageSlug || '').slice(0, 120)
  const referrer = String(body.referrer || '').slice(0, 400)
  // Analytics por página (pedido "filtrar analytics por pagina"): resolve o id
  // da página interna a partir do slug (home = vazio).
  let pageId = String(body.pageId || '').slice(0, 20)
  if (!pageId && pageSlug && pageSlug !== 'home' && pageSlug !== 'principal') {
    try {
      const page = $app.findFirstRecordByFilter(
        'portal_pages',
        'brand = {:brand} && slug = {:slug}',
        { brand: portal.getString('brand'), slug: pageSlug },
      )
      pageId = page.id
    } catch (_) {
      pageId = ''
    }
  }

  const visitsCollection = $app.findCollectionByNameOrId('portal_visits')
  const visit = new Record(visitsCollection)
  visit.set('user', portal.getString('user'))
  visit.set('portal', portal.id)
  visit.set('brand', portal.getString('brand'))
  visit.set('page_slug', pageSlug)
  visit.set('page_id', pageId)
  visit.set('referrer', referrer)
  $app.save(visit)

  return e.json(200, { success: true })
})

// ---------- Vídeo: registra play de vídeo próprio (PÚBLICO) ----------
// Pedido "adicionar metricas de video": um record em portal_video_plays por
// play, com página e mídia. Igual às visitas — sem exigir login.
routerAdd('POST', '/backend/v1/portals/video-plays/{token}', (e) => {
  const token = (e.request.pathValue('token') || '').trim()
  if (!token) return e.badRequest('Token ausente.')

  let portal = null
  try {
    portal = $app.findFirstRecordByFilter(
      'brand_portals',
      'share_token = {:token} && published = true',
      { token },
    )
  } catch (_) {
    return e.notFound('Portal não encontrado.')
  }

  const body = e.requestInfo().body || {}
  const pageSlug = String(body.pageSlug || '').slice(0, 120)
  const mediaId = String(body.mediaId || '').slice(0, 20)
  if (!mediaId) return e.badRequest('mediaId é obrigatório.')

  let pageId = String(body.pageId || '').slice(0, 20)
  if (!pageId && pageSlug && pageSlug !== 'home' && pageSlug !== 'principal') {
    try {
      const page = $app.findFirstRecordByFilter(
        'portal_pages',
        'brand = {:brand} && slug = {:slug}',
        { brand: portal.getString('brand'), slug: pageSlug },
      )
      pageId = page.id
    } catch (_) {
      pageId = ''
    }
  }

  const playsCollection = $app.findCollectionByNameOrId('portal_video_plays')
  const play = new Record(playsCollection)
  play.set('user', portal.getString('user'))
  play.set('portal', portal.id)
  play.set('brand', portal.getString('brand'))
  play.set('page_slug', pageSlug)
  play.set('page_id', pageId)
  play.set('media', mediaId)
  $app.save(play)

  return e.json(200, { success: true })
})

// ---------- Analytics: métricas de visitas (SÓ O DONO) ----------
routerAdd('GET', '/backend/v1/portals/metrics/{portalId}', (e) => {
  const userId = e.auth?.id
  if (!userId) return e.unauthorizedError('Autenticação necessária.')
  const portalId = e.request.pathValue('portalId') || ''
  const pageFilter = String(e.requestInfo().query.pageId || '').slice(0, 20)

  let portal = null
  try {
    portal = $app.findRecordById('brand_portals', portalId)
  } catch (_) {
    return e.notFound('Portal não encontrado.')
  }
  if (portal.getString('user') !== userId) {
    return e.forbidden('Só o dono do portal vê as métricas.')
  }

  const now = new Date()
  const h24 = new Date(now.getTime() - 24 * 3600 * 1000).toISOString().replace('T', ' ')
  const d7 = new Date(now.getTime() - 7 * 86400000).toISOString().replace('T', ' ')
  const d30 = new Date(now.getTime() - 30 * 86400000).toISOString().replace('T', ' ')

  // Filtro por página (pedido "filtrar analytics por pagina"): pageId na query
  // restringe totais, série e lista àquela página ('' = todas).
  const filterExtra = pageFilter ? ' && page_id = {:page}' : ''
  const baseParams = pageFilter ? { id: portalId, page: pageFilter } : { id: portalId }

  let total = 0
  let last24h = 0
  let last7d = 0
  let last30d = 0
  try {
    total = $app.countRecords('portal_visits', 'portal = {:id}' + filterExtra, baseParams)
  } catch (_) {
    total = 0
  }
  try {
    last24h = $app.countRecords(
      'portal_visits',
      'portal = {:id}' + filterExtra + ' && created >= {:h24}',
      {
        id: baseParams.id,
        page: baseParams.page,
        h24,
      },
    )
    last7d = $app.countRecords(
      'portal_visits',
      'portal = {:id}' + filterExtra + ' && created >= {:d7}',
      {
        id: baseParams.id,
        page: baseParams.page,
        d7,
      },
    )
    last30d = $app.countRecords(
      'portal_visits',
      'portal = {:id}' + filterExtra + ' && created >= {:d30}',
      {
        id: baseParams.id,
        page: baseParams.page,
        d30,
      },
    )
  } catch (_) {
    last24h = last7d = last30d = 0
  }

  let recent = []
  try {
    recent = $app.findRecordsByFilter(
      'portal_visits',
      'portal = {:id}' + filterExtra,
      '-created',
      10,
      0,
      baseParams,
    )
  } catch (_) {
    recent = []
  }

  const recentItems = []
  for (const r of recent) {
    recentItems.push({
      at: r.get('created'),
      page_slug: r.getString('page_slug') || 'principal',
      referrer: r.getString('referrer') || '',
    })
  }

  // ---- Série diária dos últimos 30 dias (pedido: "gráfico de visitas por dia") ----
  // Conta por dia via findRecordsByFilter (created >= d30) e buckets em memória:
  // o JSVM do PocketBase não expõe GROUP BY direto ao hooks.
  const seriesMap = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    seriesMap[key] = 0
  }
  let dayVisits = []
  try {
    dayVisits = $app.findRecordsByFilter(
      'portal_visits',
      'portal = {:id} && created >= {:d30}' + filterExtra,
      '-created',
      10000,
      0,
      {
        id: baseParams.id,
        page: baseParams.page,
        d30,
      },
    )
  } catch (_) {
    dayVisits = []
  }
  for (const v of dayVisits) {
    // created vem em UTC ("2026-02-03 14:22:01.123Z"): desloca para o fuso local
    // do servidor antes de agrupar por dia, para o bucket bater com o dia local.
    const offMin = now.getTimezoneOffset()
    let created = v.getString('created') || ''
    if (created.indexOf('T') === -1) created = created.replace(' ', 'T')
    let dLocal = null
    try {
      dLocal = new Date(created.replace('Z', '') + 'Z')
    } catch (_) {
      dLocal = null
    }
    if (!dLocal || isNaN(dLocal.getTime())) continue
    const local = new Date(dLocal.getTime() - offMin * 60000)
    const key = local.toISOString().slice(0, 10)
    if (seriesMap[key] !== undefined) seriesMap[key] = seriesMap[key] + 1
  }
  const daily_series = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    daily_series.push({ date: key, count: seriesMap[key] || 0 })
  }

  // ---- Métricas de vídeo (pedido "adicionar metricas de video") ----
  // Total de plays + ranking por vídeo (media + página onde está o bloco).
  let videoTotal = 0
  let videoRanking = []
  try {
    const plays = $app.findRecordsByFilter(
      'portal_video_plays',
      'portal = {:id}' + filterExtra,
      '-created',
      10000,
      0,
      baseParams,
    )
    videoTotal = plays.length
    const perMedia = {}
    const mediaMeta = {}
    for (const p of plays) {
      const mid = p.getString('media') || 'desconhecido'
      perMedia[mid] = (perMedia[mid] || 0) + 1
      if (!mediaMeta[mid]) {
        mediaMeta[mid] = {
          page_slug: p.getString('page_slug') || 'principal',
          page_id: p.getString('page_id') || '',
          last_play_at: p.get('created'),
        }
      }
    }
    videoRanking = Object.keys(perMedia)
      .sort((a, b) => perMedia[b] - perMedia[a])
      .slice(0, 20)
      .map((mid) => ({
        media_id: mid,
        plays: perMedia[mid],
        page_slug: mediaMeta[mid].page_slug,
        page_id: mediaMeta[mid].page_id,
        last_play_at: mediaMeta[mid].last_play_at,
      }))
  } catch (_) {
    videoTotal = 0
    videoRanking = []
  }

  return e.json(200, {
    success: true,
    total,
    last_24h: last24h,
    last_7d: last7d,
    last_30d: last30d,
    daily_series,
    recent: recentItems,
    video_total: videoTotal,
    video_ranking: videoRanking,
  })
})

// ---------- Analytics: exportação das visitas (SÓ O DONO) ----------
// Pedido "exportar relatorio de analytics": devolve TODOS os registros de
// visita (até 10 mil, mais recentes primeiro) para o frontend montar o CSV/PDF.
// pageId na query restringe ao filtro de página ativo no painel.
routerAdd('GET', '/backend/v1/portals/visits-export/{portalId}', (e) => {
  const userId = e.auth?.id
  if (!userId) return e.unauthorizedError('Autenticação necessária.')
  const portalId = e.request.pathValue('portalId') || ''
  const pageFilter = String(e.requestInfo().query.pageId || '').slice(0, 20)
  const filterExtra = pageFilter ? ' && page_id = {:page}' : ''
  const baseParams = pageFilter ? { id: portalId, page: pageFilter } : { id: portalId }

  let portal = null
  try {
    portal = $app.findRecordById('brand_portals', portalId)
  } catch (_) {
    return e.notFound('Portal não encontrado.')
  }
  if (portal.getString('user') !== userId) {
    return e.forbidden('Só o dono do portal pode exportar as visitas.')
  }

  let visits = []
  try {
    visits = $app.findRecordsByFilter(
      'portal_visits',
      'portal = {:id}' + filterExtra,
      '-created',
      10000,
      0,
      baseParams,
    )
  } catch (_) {
    visits = []
  }

  const items = []
  for (const v of visits) {
    items.push({
      at: v.get('created'),
      page_slug: v.getString('page_slug') || 'principal',
      page_id: v.getString('page_id') || '',
      referrer: v.getString('referrer') || '',
    })
  }

  return e.json(200, { success: true, count: items.length, visits: items })
})

// ---------- Cores do tema por marca (SÓ O DONO) ----------
// Pedidos "personalizar cores do portal por marca": além do accent (que vive em
// brands.accent_color), aceita e sincroniza no snapshot as cores extras —
// fundo (bgColor), texto (textColor) e botões (buttonColor). Toda lógica INLINE.
routerAdd('POST', '/backend/v1/portals/theme', (e) => {
  const userId = e.auth?.id
  if (!userId) return e.unauthorizedError('Autenticação necessária.')
  const body = e.requestInfo().body || {}
  const brandId = String(body.brandId || '').trim()
  if (!brandId) return e.badRequest('brandId é obrigatório.')

  let brand = null
  try {
    brand = $app.findRecordById('brands', brandId)
  } catch (_) {
    return e.notFound('Marca não encontrada.')
  }
  if (brand.getString('user') !== userId) {
    return e.forbidden('Só o dono da marca pode mudar as cores do portal.')
  }

  // Aceita '#RRGGBB' ou 'RRGGBB' — sanitiza antes de persistir; vazio = tema padrão.
  const hex6 = /^[0-9a-fA-F]{6}$/
  const sanitize = (v) => {
    const raw = String(v || '')
      .trim()
      .replace('#', '')
    if (!raw) return ''
    if (!hex6.test(raw)) return null
    return '#' + raw.toUpperCase()
  }

  const accent = sanitize(body.accentColor)
  if (accent === null) {
    return e.badRequest('accentColor deve ser um hex de 6 dígitos (ex: #7C3AED).')
  }
  const bg = sanitize(body.bgColor)
  if (bg === null) return e.badRequest('bgColor deve ser um hex de 6 dígitos ou vazio.')
  const txt = sanitize(body.textColor)
  if (txt === null) return e.badRequest('textColor deve ser um hex de 6 dígitos ou vazio.')
  const btn = sanitize(body.buttonColor)
  if (btn === null) return e.badRequest('buttonColor deve ser um hex de 6 dígitos ou vazio.')

  if (accent) brand.set('accent_color', accent)

  // Se a marca já tem portal publicado, sincroniza o snapshot do tema.
  let portal = null
  try {
    portal = $app.findFirstRecordByFilter('brand_portals', 'brand = {:brand}', { brand: brandId })
  } catch (_) {
    portal = null
  }
  if (portal) {
    // Vazio = reset (a página pública cai pro fallback do accent).
    portal.set('bg_color', bg)
    portal.set('text_color', txt)
    portal.set('button_color', btn)
    let theme = {}
    try {
      theme = JSON.parse(portal.getString('theme_snapshot') || '{}')
    } catch (_) {
      theme = {}
    }
    if (accent) theme.accent_color = accent
    theme.bg_color = bg
    theme.text_color = txt
    theme.button_color = btn
    portal.set('theme_snapshot', JSON.stringify(theme))
    $app.save(portal)
  }
  $app.save(brand)

  return e.json(200, {
    success: true,
    accent_color: accent,
    bg_color: bg,
    text_color: txt,
    button_color: btn,
  })
})
