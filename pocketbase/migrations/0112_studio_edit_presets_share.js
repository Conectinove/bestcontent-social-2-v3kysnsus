/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0112 — Compartilhar presets de edição com a equipe.
 *
 * Adiciona `is_shared` (bool) à coleção studio_edit_presets (0101) e relaxa
 * as regras de leitura: além dos próprios presets, o usuário também vê
 * presets compartilhados por membros da mesma empresa (company do user).
 *
 * Padrão idempotente da casa: Field + getByName check. Id >= 0112.
 *
 * Regras finais:
 *  - list/view: próprios presets OU (compartilhado E mesma company).
 *  - create: user = auth.
 *  - update/delete: só o dono (o dono pode des-compartilhar).
 *
 * Toda lógica é inline no callback (limitação do JSVM do PocketBase).
 */
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('studio_edit_presets')

    // Campo is_shared (bool) — idempotente.
    if (!collection.fields.getByName('is_shared')) {
      collection.fields.add(new BoolField({ name: 'is_shared' }))
    }

    // Índice leve para o filtro de compartilhados da empresa.
    const idxName = 'idx_studio_edit_presets_shared'
    const hasIndex = (collection.indexes || []).some((idx) => idx.includes(idxName))
    if (!hasIndex) {
      collection.indexes = (collection.indexes || []).concat([
        'CREATE INDEX idx_studio_edit_presets_shared ON studio_edit_presets (is_shared)',
      ])
    }

    // Regras: próprios OU compartilhados da mesma company (padrão 0098/0099).
    const ownFilter = 'user = @request.auth.id'
    const sharedFilter =
      'is_shared = true && @request.auth.company != "" && user.company = @request.auth.company'
    collection.listRule = `@request.auth.id != "" && (${ownFilter} || (${sharedFilter}))`
    collection.viewRule = `@request.auth.id != "" && (${ownFilter} || (${sharedFilter}))`
    collection.createRule = '@request.auth.id != "" && @request.body.user = @request.auth.id'
    // update: dono; ao editar via regra o PocketBase exige que o record case com a regra.
    collection.updateRule = '@request.auth.id != "" && user = @request.auth.id'
    collection.deleteRule = '@request.auth.id != "" && user = @request.auth.id'

    app.save(collection)
  },
  (app) => {
    // Down: volta às regras restritas da 0101 e remove o campo.
    try {
      const collection = app.findCollectionByNameOrId('studio_edit_presets')
      collection.listRule = '@request.auth.id != "" && user = @request.auth.id'
      collection.viewRule = '@request.auth.id != "" && user = @request.auth.id'
      try {
        const f = collection.fields.getByName('is_shared')
        if (f) collection.fields.removeByName('is_shared')
      } catch (_) {}
      app.save(collection)
    } catch (_) {}
  },
)
