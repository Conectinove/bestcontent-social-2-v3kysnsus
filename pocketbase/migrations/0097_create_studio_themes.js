/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0097 — Coleção studio_themes
 * Temas do Estúdio criados pelo usuário, com:
 * - user: relation obrigatória (padrão 0073/00090) — dono do tema
 * - network: rede social associada (opcional; mesmos valores do enum user_integrations)
 * - accent_override: variação de cor de destaque por rede (HSL tokens "h s% l%")
 * - is_shared: compartilhado com a equipe (mesma company no users)
 *
 * Escopo "equipe" = usuários cujo campo `company` no users seja igual ao do dono.
 * Regras: dono tem controle total; temas compartilhados são visíveis (read-only)
 * para usuários autenticados da mesma company.
 */
migrate(
  (app) => {
    const collection = new Collection({
      type: 'base',
      name: 'studio_themes',
      listRule:
        '@request.auth.id != "" && (user = @request.auth.id || (is_shared = true && user.company = @request.auth.record.company))',
      viewRule:
        '@request.auth.id != "" && (user = @request.auth.id || (is_shared = true && user.company = @request.auth.record.company))',
      createRule: '@request.auth.id != "" && @request.body.user = @request.auth.id',
      updateRule: '@request.auth.id != "" && user = @request.auth.id',
      deleteRule: '@request.auth.id != "" && user = @request.auth.id',
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        {
          name: 'network',
          type: 'select',
          required: false,
          maxSelect: 1,
          values: [
            'instagram',
            'tiktok',
            'linkedin',
            'facebook',
            'youtube',
            'x',
            'threads',
            'pinterest',
            'kwai',
            'telegram',
            'bluesky',
            'snapchat',
          ],
        },
        { name: 'mode', type: 'select', required: false, maxSelect: 1, values: ['light', 'dark'] },
        { name: 'color_background', type: 'text', required: false },
        { name: 'color_surface', type: 'text', required: false },
        { name: 'color_primary', type: 'text', required: false },
        { name: 'color_text', type: 'text', required: false },
        { name: 'accent_override', type: 'text', required: false },
        { name: 'is_shared', type: 'bool', required: false },
        { name: 'remote_id', type: 'text', required: false },
      ],
    })

    collection.indexes = [
      'CREATE INDEX idx_studio_themes_user ON studio_themes (user)',
      'CREATE INDEX idx_studio_themes_network ON studio_themes (network)',
      'CREATE INDEX idx_studio_themes_shared ON studio_themes (is_shared)',
      'CREATE INDEX idx_studio_themes_remote_id ON studio_themes (remote_id)',
    ]

    app.save(collection)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('studio_themes'))
    } catch (_) {}
  },
)
