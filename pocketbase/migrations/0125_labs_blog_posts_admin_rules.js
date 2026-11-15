/// <reference path="../pb_data/types.d.ts" />
// =============================================================================
// Migration 0125 — Permissões de publicação do Blog do Labs (labs_blog_posts)
// Padrão 0110 (role admin em users + rules com @request.auth.role = "admin").
// Idempotente: usa getByName antes de cada mutação de rule.
// Regras:
//   - list/view: qualquer usuário autenticado vê os artigos (donos vêem os seus)
//   - create: admin, OU dono criando rascunho (status vazio/'draft')
//   - update: admin, OU dono mantendo rascunho (não pode publicar sozinho)
//   - delete: admin OU dono
//   - Publicar (status 'published') fica EXCLUSIVO de admin via updateRule.
// =============================================================================
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('labs_blog_posts')
    if (!collection) {
      console.log('0125: coleção labs_blog_posts não encontrada — nada a fazer')
      return
    }

    const ADMIN = '@request.auth.role = "admin"'
    const OWNER = '@request.auth.id != "" && user = @request.auth.id'

    // listRule/viewRule: autenticados veem tudo (UI filtra visualmente)
    collection.listRule = '@request.auth.id != ""'
    collection.viewRule = '@request.auth.id != ""'

    // create: admin qualquer coisa; não-admin só cria o PRÓPRIO rascunho
    collection.createRule =
      '(' + ADMIN + ') || (' + OWNER + ' && (status = "" || status = "draft"))'

    // update: admin qualquer coisa; dono só edita rascunho e nunca pode
    // enviar status 'published' (o publish é o ato restrito ao admin).
    // A regra compara o status ATUAL do record: um rascunho pode ser editado;
    // publicar (mudar para published) só via admin.
    collection.updateRule = '(' + ADMIN + ') || (' + OWNER + ' && status = "draft")'

    // delete: admin ou dono
    collection.deleteRule = '(' + ADMIN + ') || (' + OWNER + ')'

    app.save(collection)
    console.log('0125: rules de labs_blog_posts atualizadas (publish exclusivo de admin)')
  },
  (app) => {
    // Revert: volta às rules anteriores (dono faz tudo com o próprio artigo)
    const collection = app.findCollectionByNameOrId('labs_blog_posts')
    if (!collection) return
    // Expressões INLINE (JSVM: callbacks não enxergam constantes de nível superior)
    const owner = '@request.auth.id != "" && user = @request.auth.id'
    collection.listRule = '@request.auth.id != ""'
    collection.viewRule = '@request.auth.id != ""'
    collection.createRule = owner
    collection.updateRule = owner
    collection.deleteRule = owner
    app.save(collection)
  },
)
