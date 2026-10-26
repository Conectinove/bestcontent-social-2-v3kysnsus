migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Garantir campos de créditos e plano em users se ainda não existirem
    if (!usersCol.fields.getByName('plan')) {
      usersCol.fields.add(
        new SelectField({
          name: 'plan',
          required: false,
          values: ['free', 'pro', 'max', 'enterprise'],
          maxSelect: 1,
        }),
      )
    }

    if (!usersCol.fields.getByName('plan_cycle')) {
      usersCol.fields.add(
        new SelectField({
          name: 'plan_cycle',
          required: false,
          values: ['monthly', 'annual'],
          maxSelect: 1,
        }),
      )
    }

    if (!usersCol.fields.getByName('extra_credits')) {
      usersCol.fields.add(
        new NumberField({
          name: 'extra_credits',
          required: false,
          min: 0,
        }),
      )
    }

    if (!usersCol.fields.getByName('plan_credits')) {
      usersCol.fields.add(
        new NumberField({
          name: 'plan_credits',
          required: false,
          min: 0,
        }),
      )
    }

    if (!usersCol.fields.getByName('asaas_customer_id')) {
      usersCol.fields.add(
        new TextField({
          name: 'asaas_customer_id',
          required: false,
        }),
      )
    }

    app.save(usersCol)

    // 2. Criar coleção 'payments'
    let paymentsCol
    try {
      paymentsCol = app.findCollectionByNameOrId('payments')
    } catch (_) {
      paymentsCol = new Collection({
        name: 'payments',
        type: 'base',
        listRule: '@request.auth.id != "" && user = @request.auth.id',
        viewRule: '@request.auth.id != "" && user = @request.auth.id',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != "" && user = @request.auth.id',
        deleteRule: null, // histórico financeiro imutável por usuário comum
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'type',
            type: 'select',
            required: true,
            values: ['plan', 'credits'],
            maxSelect: 1,
          },
          {
            name: 'item_id',
            type: 'text',
            required: true,
          },
          {
            name: 'item_title',
            type: 'text',
            required: false,
          },
          {
            name: 'amount',
            type: 'number',
            required: true,
          },
          {
            name: 'billing_type',
            type: 'select',
            required: true,
            values: ['PIX', 'CREDIT_CARD', 'BOLETO', 'UNDEFINED'],
            maxSelect: 1,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['pending', 'paid', 'confirmed', 'overdue', 'refunded', 'cancelled', 'failed'],
            maxSelect: 1,
          },
          {
            name: 'asaas_payment_id',
            type: 'text',
            required: false,
          },
          {
            name: 'asaas_invoice_url',
            type: 'text',
            required: false,
          },
          {
            name: 'pix_qr_code',
            type: 'text',
            required: false,
          },
          {
            name: 'pix_copy_paste',
            type: 'text',
            required: false,
          },
          {
            name: 'bank_slip_url',
            type: 'text',
            required: false,
          },
          {
            name: 'credits_amount',
            type: 'number',
            required: false,
          },
          {
            name: 'metadata',
            type: 'json',
            required: false,
          },
          {
            name: 'paid_at',
            type: 'date',
            required: false,
          },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE INDEX idx_payments_user ON payments (user)',
          'CREATE INDEX idx_payments_status ON payments (status)',
          'CREATE INDEX idx_payments_asaas_id ON payments (asaas_payment_id)',
        ],
      })
      app.save(paymentsCol)
    }
  },
  (app) => {
    try {
      const paymentsCol = app.findCollectionByNameOrId('payments')
      app.delete(paymentsCol)
    } catch (_) {}
  },
)
