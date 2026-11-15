// =========================================================================
// Hooks dos portais de marca — estende portal_share.js (0.0.259):
//  - GET  /backend/v1/portals/share/{token}       -> já existe em portal_share.js
//  - GET  /backend/v1/portals/pages/{token}       -> páginas internas (público)
//  - POST /backend/v1/portals/visits/{token}      -> registra visita (público)
//  - GET  /backend/v1/portals/metrics/{portalId}  -> analytics de visitas (dono)
//  - POST /backend/v1/portals/theme               -> salva a cor por marca (dono)
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

  const items = []
  for (const p of pages) {
    let content = {}
    try {
      content = JSON.parse(p.getString('content') || '{}')
    } catch (_) {
      content = { text: p.getString('content') || '' }
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

  const visitsCollection = $app.findCollectionByNameOrId('portal_visits')
  const visit = new Record(visitsCollection)
  visit.set('user', portal.getString('user'))
  visit.set('portal', portal.id)
  visit.set('brand', portal.getString('brand'))
  visit.set('page_slug', pageSlug)
  visit.set('referrer', referrer)
  $app.save(visit)

  return e.json(200, { success: true })
})

// ---------- Analytics: métricas de visitas (SÓ O DONO) ----------
routerAdd('GET', '/backend/v1/portals/metrics/{portalId}', (e) => {
  const userId = e.auth?.id
  if (!userId) return e.unauthorizedError('Autenticação necessária.')
  const portalId = e.request.pathValue('portalId') || ''

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

  let total = 0
  let last24h = 0
  let last7d = 0
  let last30d = 0
  try {
    total = $app.countRecords('portal_visits', 'portal = {:id}', { id: portalId })
  } catch (_) {
    total = 0
  }
  try {
    last24h = $app.countRecords('portal_visits', 'portal = {:id} && created >= {:h24}', {
      id: portalId,
      h24,
    })
    last7d = $app.countRecords('portal_visits', 'portal = {:id} && created >= {:d7}', {
      id: portalId,
      d7,
    })
    last30d = $app.countRecords('portal_visits', 'portal = {:id} && created >= {:d30}', {
      id: portalId,
      d30,
    })
  } catch (_) {
    last24h = last7d = last30d = 0
  }

  let recent = []
  try {
    recent = $app.findRecordsByFilter('portal_visits', 'portal = {:id}', '-created', 10, 0, {
      id: portalId,
    })
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
      'portal = {:id} && created >= {:d30}',
      '-created',
      10000,
      0,
      {
        id: portalId,
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

  return e.json(200, {
    success: true,
    total,
    last_24h: last24h,
    last_7d: last7d,
    last_30d: last30d,
    daily_series,
    recent: recentItems,
  })
})

// ---------- Cor do tema por marca (SÓ O DONO) ----------
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
    return e.forbidden('Só o dono da marca pode mudar a cor do tema.')
  }

  // Aceita '#RRGGBB' ou 'RRGGBB' — sanitiza antes de persistir.
  const raw = String(body.accentColor || '')
    .trim()
    .replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) {
    return e.badRequest('accentColor deve ser um hex de 6 dígitos (ex: #7C3AED).')
  }
  brand.set('accent_color', '#' + raw.toUpperCase())

  // Se a marca já tem portal publicado, sincroniza o snapshot do tema.
  let portal = null
  try {
    portal = $app.findFirstRecordByFilter('brand_portals', 'brand = {:brand}', { brand: brandId })
  } catch (_) {
    portal = null
  }
  if (portal) {
    let theme = {}
    try {
      theme = JSON.parse(portal.getString('theme_snapshot') || '{}')
    } catch (_) {
      theme = {}
    }
    theme.accent_color = '#' + raw.toUpperCase()
    portal.set('theme_snapshot', JSON.stringify(theme))
    $app.save(portal)
  }
  $app.save(brand)

  return e.json(200, { success: true, accent_color: '#' + raw.toUpperCase() })
})
