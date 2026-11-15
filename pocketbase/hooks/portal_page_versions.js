// =========================================================================
// Hooks de versões das páginas do portal — pedido "historico de versoes".
// Snapshot por salvamento na coleção portal_page_versions (migration 0119):
//  - onRecordCreateRequest('portal_pages')  -> cria a v1
//  - onRecordUpdateRequest('portal_pages')  -> snapshot da versão anterior
// Restaurar é só salvar o content antigo de volta na página (update comum).
// Regra da casa: TODA lógica INLINE dentro do callback (JSVM não enxerga
// funções de nível superior — 'Hook scoping error').
// =========================================================================

onRecordCreateRequest('portal_pages', (e) => {
  e.next()
  const page = e.record
  if (!page || !page.id) return
  try {
    const col = $app.findCollectionByNameOrId('portal_page_versions')
    const v = new Record(col)
    v.set('user', page.getString('user'))
    v.set('page', page.id)
    v.set('brand', page.getString('brand'))
    v.set('title', page.getString('title'))
    v.set('content', page.getString('content') || '{}')
    v.set('note', 'Criação da página')
    v.set('version', 1)
    $app.save(v)
  } catch (_) {
    // falha ao versionar não deve bloquear a criação da página
  }
})

onRecordUpdateRequest('portal_pages', (e) => {
  e.next()
  try {
    const page = e.record
    if (!page || !page.id) return
    const original = page.original()
    if (!original || original.isEmpty()) return
    const before = original.getString('content') || '{}'
    const after = page.getString('content') || '{}'
    if (before === after) return // só mudou título/agendamento: não cria versão
    const col = $app.findCollectionByNameOrId('portal_page_versions')
    const count = $app.countRecords('portal_page_versions', 'page = {:page}', { page: page.id })
    const v = new Record(col)
    v.set('user', page.getString('user'))
    v.set('page', page.id)
    v.set('brand', page.getString('brand'))
    v.set('title', original.getString('title'))
    v.set('content', before)
    v.set('note', 'Versão anterior ao salvamento')
    v.set('version', Number(count) + 1)
    $app.save(v)
  } catch (_) {
    // falha ao versionar não deve bloquear o salvamento da página
  }
})
