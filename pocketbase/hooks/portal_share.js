// =========================================================================
// Endpoint: portal público de marca (pedidos "gerar portais" + "incorporar").
// Espelha o padrão do preset_share.js (link por token aleatório, rota
// pública GET sem requireAuth retornando JSON).
//
// POST /backend/v1/portals/share        -> gera/renova o token do portal
// DELETE /backend/v1/portals/share/{id} -> revoga (apaga o token, despublica)
// GET /backend/v1/portals/share/{token} -> serve marca+tema publicamente
//
// Toda lógica é inline no callback (limitação de scoping do JSVM).
// =========================================================================
routerAdd(
  'POST',
  '/backend/v1/portals/share',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('Autenticação necessária.')
    const body = e.requestInfo().body || {}
    const brandId = String(body.brandId || '').trim()
    if (!brandId) return e.badRequest('brandId é obrigatório.')

    // Marca tem de pertencer ao usuário (só o dono gera o portal).
    let brand
    try {
      brand = $app.findRecordById('brands', brandId)
    } catch (_) {
      return e.notFound('Marca não encontrada.')
    }
    if (brand.getString('user') !== userId) {
      return e.forbidden('Só o dono da marca pode gerar o portal.')
    }

    // Procura portal existente da marca — se houver, regenera o token.
    let portal = null
    try {
      portal = $app.findFirstRecordByFilter('brand_portals', 'brand = {:brand}', { brand: brandId })
    } catch (_) {
      portal = null
    }

    const token = $security.randomString(32)
    if (portal) {
      portal.set('share_token', token)
      portal.set('published', true)
      $app.save(portal)
      return e.json(200, { success: true, token, portalId: portal.id, regenerated: true })
    }

    // Cria o portal já com o snapshot do tema da marca.
    const snapshot = {
      name: brand.getString('name'),
      color_theme: brand.getString('color_theme'),
      logo: brand.getString('logo'),
      description: brand.getString('description'),
    }
    const portalCollection = $app.findCollectionByNameOrId('brand_portals')
    const created = new Record(portalCollection)
    created.set('user', userId)
    created.set('brand', brandId)
    created.set('share_token', token)
    created.set('theme_snapshot', JSON.stringify(snapshot))
    created.set('published', true)
    $app.save(created)

    return e.json(200, { success: true, token, portalId: created.id, regenerated: false })
  },
  $apis.requireAuth(),
)

routerAdd(
  'DELETE',
  '/backend/v1/portals/share/{portalId}',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('Autenticação necessária.')
    const portalId = e.request.pathValue('portalId') || ''

    let portal
    try {
      portal = $app.findRecordById('brand_portals', portalId)
    } catch (_) {
      return e.notFound('Portal não encontrado.')
    }
    if (portal.getString('user') !== userId) {
      return e.forbidden('Só o dono do portal pode revogar o link.')
    }
    portal.set('share_token', '')
    portal.set('published', false)
    $app.save(portal)

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)

// Rota PÚBLICA (sem requireAuth): serve a marca+tema pelo token aleatório.
routerAdd('GET', '/backend/v1/portals/share/{token}', (e) => {
  const token = (e.request.pathValue('token') || '').trim()
  if (!token) return e.notFound('Link de portal inválido.')

  let portal
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
  let brand
  try {
    brand = $app.findRecordById('brands', brandId)
  } catch (_) {
    return e.notFound('A marca deste portal não existe mais.')
  }

  let theme = {}
  try {
    theme = JSON.parse(portal.getString('theme_snapshot') || '{}')
  } catch (_) {
    theme = {}
  }

  let accentColor = brand.getString('accent_color')
  if (!accentColor) {
    try {
      accentColor = theme.accent_color || ''
    } catch (_) {
      accentColor = ''
    }
  }

  // Cores extras do portal (migration 0118) — vazio cai pro fallback do frontend.
  const bgColor = portal.getString('bg_color')
  const textColor = portal.getString('text_color')
  const buttonColor = portal.getString('button_color')
  const gaId = portal.getString('ga_measurement_id')
  // Google Tag Manager (pedido "integar com google tag manager"): ID do
  // contêiner GTM-XXXXXX injetado na página pública, no padrão do GA.
  const gtmId = portal.getString('gtm_container_id')

  // Logo do portal: arquivo próprio (migration 0118) ou o logo da marca.
  // Sem arquivo próprio, monta a URL do logo da marca (filename -> caminho /api/files).
  const brandLogoFile = brand.getString('logo')
  let logoUrl = ''
  if (brandLogoFile) {
    logoUrl = '/api/files/brands/' + brandId + '/' + brandLogoFile
  }
  const logoFile = portal.getString('logo_file')
  if (logoFile) {
    logoUrl = '/api/files/brand_portals/' + portal.id + '/' + logoFile
  }

  return e.json(200, {
    format: 'midiaviva-portal',
    version: 2,
    brand_id: brandId,
    name: brand.getString('name'),
    description: brand.getString('description'),
    logo: logoUrl,
    logo_file: logoFile,
    website: brand.getString('website'),
    color_theme: brand.getString('color_theme'),
    accent_color: accentColor,
    bg_color: bgColor,
    text_color: textColor,
    button_color: buttonColor,
    ga_measurement_id: gaId,
    gtm_container_id: gtmId,
    theme,
    portal_id: portal.id,
  })
})
