/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration 0075 — Coleções do CRM (crm_contacts e crm_interactions)
 * - crm_contacts: dados do lead/cliente, empresa, email, telefone, canal/origem, estágio do funil, valor estimado, campos personalizados em JSON, notas, tags e vínculo com usuário
 * - crm_interactions: histórico de atividades/interações (tipo, descrição, data, contato relacionado, usuário)
 */
migrate(
  (app) => {
    // 1. Coleção crm_contacts
    const contacts = new Collection({
      name: 'crm_contacts',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'company', type: 'text', required: false },
        { name: 'email', type: 'text', required: false },
        { name: 'phone', type: 'text', required: false },
        {
          name: 'source',
          type: 'select',
          required: false,
          values: [
            'Instagram',
            'WhatsApp',
            'Google Ads',
            'Meta Ads',
            'LinkedIn',
            'TikTok',
            'YouTube Ads',
            'Indicacao',
            'Site',
            'Outro',
          ],
          maxSelect: 1,
        },
        {
          name: 'stage',
          type: 'select',
          required: true,
          values: [
            'lead_captado',
            'contato_feito',
            'proposta_enviada',
            'negociacao',
            'fechado_ganho',
            'fechado_perdido',
          ],
          maxSelect: 1,
        },
        { name: 'value', type: 'number', required: false },
        {
          name: 'priority',
          type: 'select',
          required: false,
          values: ['baixa', 'media', 'alta'],
          maxSelect: 1,
        },
        { name: 'responsible', type: 'text', required: false },
        { name: 'notes', type: 'text', required: false },
        { name: 'custom_fields', type: 'json', required: false },
        { name: 'tags', type: 'json', required: false },
        { name: 'last_interaction_at', type: 'date', required: false },
        { name: 'expected_close_date', type: 'date', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_crm_contacts_user ON crm_contacts (user)',
        'CREATE INDEX idx_crm_contacts_stage ON crm_contacts (stage)',
        'CREATE INDEX idx_crm_contacts_source ON crm_contacts (source)',
      ],
    })
    app.save(contacts)

    // 2. Coleção crm_interactions
    const interactions = new Collection({
      name: 'crm_interactions',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'contact',
          type: 'relation',
          required: true,
          collectionId: contacts.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: [
            'whatsapp',
            'email',
            'ligacao',
            'reuniao',
            'nota',
            'proposta',
            'mudanca_estagio',
          ],
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'interaction_date', type: 'date', required: false },
        { name: 'metadata', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_crm_interactions_user ON crm_interactions (user)',
        'CREATE INDEX idx_crm_interactions_contact ON crm_interactions (contact)',
        'CREATE INDEX idx_crm_interactions_type ON crm_interactions (type)',
      ],
    })
    app.save(interactions)
  },
  (app) => {
    try {
      const interCol = app.findCollectionByNameOrId('crm_interactions')
      app.delete(interCol)
    } catch (_) {}
    try {
      const contactsCol = app.findCollectionByNameOrId('crm_contacts')
      app.delete(contactsCol)
    } catch (_) {}
  },
)
