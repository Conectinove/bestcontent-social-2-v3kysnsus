// =========================================================================
// Hooks de convite de membros por email (pedido 4).
//  - POST /backend/v1/org/invites            -> dono/admin cria o convite
//  - GET  /backend/v1/org/invites/list       -> lista os convites do usuário
//  - GET  /backend/v1/org/invites/{token}    -> dados do convite (público)
//  - POST /backend/v1/org/invites/{token}/accept -> aceita (aplica org_role)
// Regra da casa: TODA lógica INLINE no callback (JSVM não enxerga funções
// de nível superior — 'Hook scoping error').
// =========================================================================

// ---------- Criar convite (SÓ autenticado; qualquer membro logado pode convidar) ----------
routerAdd(
  'POST',
  '/backend/v1/org/invites',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('Autenticação necessária.')

    const body = e.requestInfo().body || {}
    const email = String(body.email || '')
      .trim()
      .toLowerCase()
    const role = String(body.role || 'viewer')
      .trim()
      .toLowerCase()
    const org = String(body.org || '')
      .trim()
      .slice(0, 200)

    if (!email || email.indexOf('@') === -1) {
      return e.badRequest('Informe um email válido para convidar.')
    }
    if (['owner', 'admin', 'editor', 'viewer'].indexOf(role) === -1) {
      return e.badRequest('Cargo inválido. Use owner, admin, editor ou viewer.')
    }

    // Convidando a si mesmo não faz sentido.
    if (email === String(e.auth.get('email') || '').toLowerCase()) {
      return e.badRequest('Este email já faz parte da organização.')
    }

    // Já existe convite pendente para este email deste usuário? Renova o token.
    let existing = null
    try {
      existing = $app.findFirstRecordByFilter(
        'org_invites',
        'user = {:user} && email = {:email} && status = {:status}',
        { user: userId, email, status: 'pending' },
      )
    } catch (_) {
      existing = null
    }

    const token = $security.randomString(32)
    const expires = new Date(Date.now() + 30 * 86400000).toISOString().replace('T', ' ')

    let invite
    if (existing) {
      existing.set('token', token)
      existing.set('org_role', role)
      existing.set('org', org || existing.getString('org'))
      existing.set('expires', expires)
      $app.save(existing)
      invite = existing
    } else {
      const col = $app.findCollectionByNameOrId('org_invites')
      invite = new Record(col)
      invite.set('user', userId)
      invite.set('email', email)
      invite.set('token', token)
      invite.set('org_role', role)
      invite.set('org', org)
      invite.set('status', 'pending')
      invite.set('expires', expires)
      $app.save(invite)
    }

    return e.json(200, {
      success: true,
      token,
      org_role: role,
      email,
      expires,
      id: invite.id,
    })
  },
  $apis.requireAuth(),
)

// ---------- Listar convites do usuário (SÓ autenticado) ----------
routerAdd(
  'GET',
  '/backend/v1/org/invites/list',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('Autenticação necessária.')

    let invites = []
    try {
      invites = $app.findRecordsByFilter('org_invites', 'user = {:user}', '-created', 50, 0, {
        user: userId,
      })
    } catch (_) {
      invites = []
    }

    const items = []
    for (const inv of invites) {
      const status = inv.getString('status') || 'pending'
      if (status === 'accepted') continue
      // Marca expirados (30 dias) — o GET público também valida.
      const expires = inv.getString('expires') || ''
      let expired = false
      if (expires) {
        try {
          expired = new Date(expires.replace(' ', 'T') + 'Z').getTime() < Date.now()
        } catch (_) {
          expired = false
        }
      }
      items.push({
        id: inv.id,
        email: inv.getString('email'),
        org_role: inv.getString('org_role') || 'viewer',
        org: inv.getString('org'),
        status: expired ? 'expired' : status,
        expires,
        token: inv.getString('token'),
        created: inv.get('created'),
      })
    }

    return e.json(200, { success: true, invites: items })
  },
  $apis.requireAuth(),
)

// ---------- Dados do convite (PÚBLICO, pelo token) ----------
routerAdd('GET', '/backend/v1/org/invites/{token}', (e) => {
  const token = (e.request.pathValue('token') || '').trim()
  if (!token) return e.notFound('Convite inválido.')

  let invite = null
  try {
    invite = $app.findFirstRecordByFilter('org_invites', 'token = {:token}', { token })
  } catch (_) {
    return e.notFound('Convite não encontrado. Peça um novo link ao administrador.')
  }

  const status = invite.getString('status') || 'pending'
  if (status === 'accepted') {
    return e.badRequest('Este convite já foi aceito.')
  }
  if (status === 'expired') {
    return e.badRequest('Este convite expirou. Peça um novo link ao administrador.')
  }

  const expires = invite.getString('expires') || ''
  if (expires) {
    try {
      if (new Date(expires.replace(' ', 'T') + 'Z').getTime() < Date.now()) {
        return e.badRequest('Este convite expirou. Peça um novo link ao administrador.')
      }
    } catch (_) {}
  }

  // Nome da organização: usa o `org` salvo ou o nome do convidador.
  let orgName = invite.getString('org')
  if (!orgName) {
    try {
      const inviter = $app.findRecordById('users', invite.getString('user'))
      orgName = inviter.getString('name') || inviter.getString('email') || ''
    } catch (_) {
      orgName = ''
    }
  }

  return e.json(200, {
    success: true,
    email: invite.getString('email'),
    org_role: invite.getString('org_role') || 'viewer',
    org: orgName,
    expires,
    status,
  })
})

// ---------- Aceitar convite (PÚBLICO — exige sessão do convidado) ----------
routerAdd('POST', '/backend/v1/org/invites/{token}/accept', (e) => {
  const authUser = e.auth
  if (!authUser || !authUser.id) {
    return e.unauthorizedError('Entre na sua conta para aceitar o convite.')
  }
  const token = (e.request.pathValue('token') || '').trim()
  if (!token) return e.notFound('Convite inválido.')

  let invite = null
  try {
    invite = $app.findFirstRecordByFilter('org_invites', 'token = {:token}', { token })
  } catch (_) {
    return e.notFound('Convite não encontrado. Peça um novo link ao administrador.')
  }

  if ((invite.getString('status') || 'pending') === 'accepted') {
    return e.badRequest('Este convite já foi aceito.')
  }

  const expires = invite.getString('expires') || ''
  if (expires) {
    try {
      if (new Date(expires.replace(' ', 'T') + 'Z').getTime() < Date.now()) {
        invite.set('status', 'expired')
        $app.save(invite)
        return e.badRequest('Este convite expirou. Peça um novo link ao administrador.')
      }
    } catch (_) {}
  }

  let role = invite.getString('org_role') || 'viewer'
  if (['owner', 'admin', 'editor', 'viewer'].indexOf(role) === -1) role = 'viewer'

  // Aplica o cargo na organização do convidado. owner fica restrito a admin
  // quando concedido por convite (não há transferência de propriedade aqui).
  const effectiveRole = role === 'owner' ? 'admin' : role
  const invited = $app.findRecordById('users', authUser.id)
  invited.set('org_role', effectiveRole)
  $app.save(invited)

  invite.set('status', 'accepted')
  $app.save(invite)

  return e.json(200, {
    success: true,
    org_role: effectiveRole,
    email: invite.getString('email'),
  })
})
