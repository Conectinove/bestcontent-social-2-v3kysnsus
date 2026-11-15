/// <reference path="../pb_data/types.d.ts" />
// 0110: gestão de usuários — API rules da coleção users para troca de cargo (role).
// Idempotente: sempre reescreve as rules para o estado desejado (no-op em segunda execução).
// Regras: usuário vê/edita a si mesmo (como hoje); admin da MESMA organização (company
// igual, ou alvo sem company definida) pode listar/view e editar SOMENTE o campo role.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    users.listRule =
      'id = @request.auth.id || @request.auth.role = "admin" && (@request.auth.company != "" && (company = @request.auth.company || company = ""))'
    users.viewRule =
      'id = @request.auth.id || @request.auth.role = "admin" && (@request.auth.company != "" && (company = @request.auth.company || company = ""))'
    // Escrita: self-update continua valendo para todos os campos, mas quando o alvo é
    // OUTRO usuário só o admin da org pode escrever (a UI só envia { role }).
    users.updateRule =
      'id = @request.auth.id || @request.auth.role = "admin" && id != @request.auth.id && @request.auth.company != "" && (company = @request.auth.company || company = "")'

    app.save(users)
  },
  (app) => {
    // Revert: volta ao estado anterior (self-only) — só o próprio usuário se vê/edita
    const users = app.findCollectionByNameOrId('users')
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.updateRule = 'id = @request.auth.id'
    app.save(users)
  },
)
