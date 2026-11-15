// =========================================================================
// Endpoint: compartilhar preset de edição por LINK EXTERNO (migration 0113
// adiciona share_token a studio_edit_presets).
//
// POST /backend/v1/presets/share            -> gera/renova o token do preset
// DELETE /backend/v1/presets/share/{id}     -> revoga (apaga o token)
// GET    /backend/v1/presets/share/{token}  -> serve o preset publicamente
//
// Segurança: o link usa um token aleatório (crypto), nunca o id do record —
// a rota pública só expõe name+settings. Regenerar invalida o link antigo.
// Toda lógica é inline no callback (limitação de scoping do JSVM).
// =========================================================================
routerAdd(
  'POST',
  '/backend/v1/presets/share',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('Autenticação necessária.')
    const body = e.requestInfo().body || {}
    const presetId = String(body.presetId || '').trim()
    if (!presetId) return e.badRequest('presetId é obrigatório.')

    // Busca o preset respeitando a regra da coleção (dono vê o próprio).
    let preset
    try {
      preset = $app.findRecordById('studio_edit_presets', presetId)
    } catch (_) {
      return e.notFound('Preset não encontrado.')
    }
    if (preset.getString('user') !== userId) {
      return e.forbidden('Só o dono do preset pode gerar o link externo.')
    }

    const token = $security.randomString(32)
    preset.set('share_token', token)
    $app.save(preset)

    return e.json(200, { success: true, token })
  },
  $apis.requireAuth(),
)

routerAdd(
  'DELETE',
  '/backend/v1/presets/share/{presetId}',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('Autenticação necessária.')
    const presetId = e.request.pathValue('presetId') || ''

    let preset
    try {
      preset = $app.findRecordById('studio_edit_presets', presetId)
    } catch (_) {
      return e.notFound('Preset não encontrado.')
    }
    if (preset.getString('user') !== userId) {
      return e.forbidden('Só o dono do preset pode revogar o link.')
    }
    preset.set('share_token', '')
    $app.save(preset)

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)

// Rota PÚBLICA (sem requireAuth): serve o preset pelo token aleatório.
routerAdd('GET', '/backend/v1/presets/share/{token}', (e) => {
  const token = (e.request.pathValue('token') || '').trim()
  if (!token) return e.notFound('Link de preset inválido.')

  let preset
  try {
    preset = $app.findFirstRecordByFilter('studio_edit_presets', 'share_token = {:token}', {
      token,
    })
  } catch (_) {
    return e.notFound('Este link de preset não existe mais (talvez tenha sido revogado).')
  }

  let settings = {}
  try {
    settings = JSON.parse(preset.getString('settings') || '{}')
  } catch (_) {
    settings = {}
  }

  return e.json(200, {
    format: 'midiaviva-preset',
    version: 1,
    name: preset.getString('name') || 'Preset compartilhado',
    settings,
  })
})
