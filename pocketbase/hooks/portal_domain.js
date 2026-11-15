// =========================================================================
// Hook do domínio próprio (pedido "personalizar domínio" da marca).
// Ressalva já comunicada ao usuário: hospedagem Skip Cloud não serve
// domínio próprio real — aqui entregamos a CONFIGURAÇÃO: o domínio é
// salvo em brand_portals.custom_domain (+ domain_verified marcável após
// o DNS apontar) e o painel mostra as instruções de DNS/CNAME apontando
// para o link atual do portal (/portal/{token}).
// Regra da casa: TODA lógica INLINE no callback (JSVM scoping).
// =========================================================================

routerAdd('POST', '/backend/v1/portals/domain', (e) => {
  const userId = e.auth?.id
  if (!userId) return e.unauthorizedError('Autenticação necessária.')

  const body = e.requestInfo().body || {}
  const portalId = String(body.portalId || '').trim()
  let domain = String(body.domain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
  domain = domain.replace(/\/.*$/, '')

  if (!portalId) return e.badRequest('portalId é obrigatório.')

  let portal = null
  try {
    portal = $app.findRecordById('brand_portals', portalId)
  } catch (_) {
    return e.notFound('Portal não encontrado.')
  }
  if (portal.getString('user') !== userId) {
    return e.forbidden('Só o dono do portal pode configurar o domínio.')
  }

  // Domínio vazio = limpar a configuração.
  if (!domain) {
    portal.set('custom_domain', '')
    portal.set('domain_verified', false)
    $app.save(portal)
    return e.json(200, { success: true, custom_domain: '', domain_verified: false })
  }

  // Sanitiza: aceita host ou host.com/caminho -> guarda só o host.
  if (!/^[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,}$/.test(domain)) {
    return e.badRequest('Domínio inválido. Use algo como portal.suamarca.com.')
  }

  portal.set('custom_domain', domain)
  // Marca como não verificado até o dono confirmar que o DNS propagou.
  portal.set('domain_verified', false)
  $app.save(portal)

  return e.json(200, {
    success: true,
    custom_domain: domain,
    domain_verified: false,
    share_token: portal.getString('share_token'),
  })
})

// Verifica o domínio (dono confirma que o CNAME resolve) — marca domain_verified.
routerAdd('POST', '/backend/v1/portals/domain/verify', (e) => {
  const userId = e.auth?.id
  if (!userId) return e.unauthorizedError('Autenticação necessária.')

  const body = e.requestInfo().body || {}
  const portalId = String(body.portalId || '').trim()
  if (!portalId) return e.badRequest('portalId é obrigatório.')

  let portal = null
  try {
    portal = $app.findRecordById('brand_portals', portalId)
  } catch (_) {
    return e.notFound('Portal não encontrado.')
  }
  if (portal.getString('user') !== userId) {
    return e.forbidden('Só o dono do portal pode verificar o domínio.')
  }

  const domain = portal.getString('custom_domain')
  if (!domain) return e.badRequest('Configure um domínio antes de verificar.')

  portal.set('domain_verified', true)
  $app.save(portal)

  return e.json(200, { success: true, custom_domain: domain, domain_verified: true })
})
