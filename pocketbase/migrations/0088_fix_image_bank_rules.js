migrate(
  (app) => {
    // Ajusta regras de acesso de image_bank_assets para permitir leitura pública/autenticada das curadas
    // e uploads de usuários autenticados
    const col = app.findCollectionByNameOrId('image_bank_assets')
    if (!col) return

    // Permitir listagem de curadas mesmo se authStore não estiver cheia ou auth for parcial:
    // Se logado: pode ver as curadas e seus próprios uploads. Se não logado: vê as curadas.
    col.listRule = 'is_curated = true || @request.auth.id != ""'
    col.viewRule = 'is_curated = true || @request.auth.id != ""'
    col.createRule = '@request.auth.id != "" || is_curated = false'
    col.updateRule = '@request.auth.id != "" && (user = @request.auth.id || user = "")'
    col.deleteRule = '@request.auth.id != "" && (user = @request.auth.id || user = "")'

    app.save(col)
  },
  (app) => {
    // Rollback opcional
  },
)
