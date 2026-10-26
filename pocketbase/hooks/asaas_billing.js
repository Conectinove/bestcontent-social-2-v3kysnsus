/**
 * MidiaViva / BestContent Social 2 - Asaas Integration Hooks
 * - POST /backend/v1/asaas/create-payment (inicia cobrança Asaas ou fallback amigável caso ASAAS_API_KEY não esteja configurada)
 * - POST /backend/v1/asaas/webhook (recebe eventos PAYMENT_RECEIVED / PAYMENT_CONFIRMED do Asaas e credita plano ou créditos)
 * - GET /backend/v1/asaas/status (verifica se gateway está configurado)
 */

routerAdd('GET', '/backend/v1/asaas/status', (e) => {
  const apiKey = ($os.getenv('ASAAS_API_KEY') || '').trim()
  const envRaw = ($os.getenv('ASAAS_ENV') || '').trim().toLowerCase()
  const isPrd =
    envRaw === 'production' ||
    envRaw === 'prd' ||
    envRaw === 'live' ||
    apiKey.startsWith('$aact_prod_')
  const environment = isPrd ? 'production' : 'sandbox'
  const isConfigured = Boolean(apiKey && apiKey.length > 5)

  return e.json(200, {
    configured: isConfigured,
    environment: environment,
    mode: isConfigured ? (isPrd ? 'production' : 'sandbox') : 'not_configured',
    canSimulate: !isConfigured || !isPrd,
    keyPrefix: isConfigured ? apiKey.slice(0, 6) + '...' : null,
  })
})

routerAdd(
  'POST',
  '/backend/v1/asaas/create-payment',
  (e) => {
    const authRecord = e.auth
    if (!authRecord) {
      return e.json(401, { error: 'Não autorizado' })
    }

    const body = e.requestInfo().body || {}
    const type = body.type || 'credits' // 'credits' | 'plan'
    const itemId = String(body.itemId || '')
    const itemTitle = String(body.itemTitle || '')
    const amount = Number(body.amount || 0)
    const billingType = String(body.billingType || 'PIX').toUpperCase() // 'PIX' | 'CREDIT_CARD' | 'BOLETO'
    const creditsAmount = Number(body.creditsAmount || 0)
    const cycle = body.cycle || 'monthly' // para planos

    if (!amount || amount <= 0) {
      return e.json(400, { error: 'Valor da cobrança inválido' })
    }

    const apiKey = ($os.getenv('ASAAS_API_KEY') || '').trim()
    const asaasEnv = ($os.getenv('ASAAS_ENV') || '').trim().toLowerCase()
    const isLive =
      asaasEnv === 'production' ||
      asaasEnv === 'prd' ||
      asaasEnv === 'live' ||
      apiKey.startsWith('$aact_prod_')
    const asaasBaseUrl = isLive ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3'

    const paymentsCol = e.app.findCollectionByNameOrId('payments')
    const usersCol = e.app.findCollectionByNameOrId('_pb_users_auth_')
    const user = e.app.findRecordById(usersCol.id, authRecord.id)

    // Se a chave Asaas ainda não foi cadastrada nos segredos pelo usuário:
    if (!apiKey) {
      // Registra a tentativa de pagamento como 'pending' no banco local
      // e devolve resposta amigável de configuração com dados simulados/amigáveis
      const localPayment = new Record(paymentsCol)
      localPayment.set('user', user.id)
      localPayment.set('type', type)
      localPayment.set('item_id', itemId)
      localPayment.set(
        'item_title',
        itemTitle || (type === 'plan' ? `Plano ${itemId}` : `${creditsAmount} créditos`),
      )
      localPayment.set('amount', amount)
      localPayment.set('billing_type', billingType)
      localPayment.set('status', 'pending')
      localPayment.set('credits_amount', creditsAmount)
      localPayment.set(
        'metadata',
        JSON.stringify({
          source: 'midiaviva_checkout',
          mockMode: true,
          reason: 'asaas_key_not_configured',
          cycle: cycle,
        }),
      )
      e.app.save(localPayment)

      return e.json(200, {
        success: true,
        mockMode: true,
        environment: 'sandbox',
        paymentId: localPayment.id,
        status: 'pending',
        message:
          'Checkout em modo de configuração/demonstração. Insira a chave ASAAS_API_KEY no painel do Skip Cloud para ativar pagamentos reais.',
        details: {
          billingType,
          amount,
          itemTitle:
            itemTitle || (type === 'plan' ? `Plano ${itemId}` : `${creditsAmount} Créditos Extras`),
          pix:
            billingType === 'PIX'
              ? {
                  copyPaste:
                    '00020126580014br.gov.bcb.pix0136midiaviva-bestcontent-asaas-checkout520400005303986540' +
                    amount.toFixed(2) +
                    '5802BR5915MIDIAVIVA BESTC6009SAO PAULO62070503***6304E8A2',
                  qrCodeUrl:
                    'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=midiaviva-asaas-checkout-' +
                    localPayment.id,
                }
              : null,
          bankSlipUrl:
            billingType === 'BOLETO'
              ? 'https://sandbox.asaas.com/b/pdf/demo-' + localPayment.id
              : null,
          invoiceUrl: 'https://sandbox.asaas.com/i/demo-' + localPayment.id,
        },
      })
    }

    // Se temos apiKey, comunica com a API oficial do Asaas
    try {
      // 1. Localizar ou criar cliente no Asaas
      let asaasCustomerId = user.getString('asaas_customer_id')
      if (!asaasCustomerId) {
        const customerPayload = {
          name: user.getString('name') || 'Cliente MidiaViva',
          email: user.getString('email') || `user_${user.id}@midiaviva.app`,
          externalReference: user.id,
        }

        const custRes = $http.send({
          url: asaasBaseUrl + '/customers',
          method: 'POST',
          headers: {
            access_token: apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customerPayload),
          timeout: 20,
        })

        if (custRes.statusCode >= 200 && custRes.statusCode < 300) {
          const custData = JSON.parse(custRes.raw)
          asaasCustomerId = custData.id
          user.set('asaas_customer_id', asaasCustomerId)
          e.app.save(user)
        }
      }

      if (!asaasCustomerId) {
        asaasCustomerId = 'cus_guest'
      }

      // 2. Data de vencimento (hoje + 3 dias)
      const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // 3. Criar a cobrança no Asaas
      const paymentPayload = {
        customer: asaasCustomerId,
        billingType: billingType,
        value: amount,
        dueDate: dueDate,
        description:
          itemTitle || `MidiaViva - ${type === 'plan' ? 'Plano' : 'Créditos'} (${itemId})`,
        externalReference: user.id + '|' + type + '|' + itemId + '|' + creditsAmount,
      }

      const payRes = $http.send({
        url: asaasBaseUrl + '/payments',
        method: 'POST',
        headers: {
          access_token: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPayload),
        timeout: 20,
      })

      if (payRes.statusCode < 200 || payRes.statusCode >= 300) {
        console.log('Asaas Payment Error:', payRes.raw)
        return e.json(502, {
          error: 'Erro ao gerar cobrança no Asaas. Verifique sua chave de API.',
        })
      }

      const asaasPayment = JSON.parse(payRes.raw)
      const asaasId = asaasPayment.id

      // 4. Se for PIX, buscar QR Code e copia e cola
      let pixQrCode = ''
      let pixCopyPaste = ''
      if (billingType === 'PIX' && asaasId) {
        try {
          const qrRes = $http.send({
            url: asaasBaseUrl + '/payments/' + asaasId + '/pixQrCode',
            method: 'GET',
            headers: {
              access_token: apiKey,
            },
            timeout: 15,
          })
          if (qrRes.statusCode >= 200 && qrRes.statusCode < 300) {
            const qrData = JSON.parse(qrRes.raw)
            pixQrCode = qrData.encodedImage || ''
            pixCopyPaste = qrData.payload || ''
          }
        } catch (qrErr) {
          console.log('Asaas PixQrCode Error:', qrErr)
        }
      }

      // 5. Salvar na coleção local de payments
      const newPayment = new Record(paymentsCol)
      newPayment.set('user', user.id)
      newPayment.set('type', type)
      newPayment.set('item_id', itemId)
      newPayment.set('item_title', itemTitle)
      newPayment.set('amount', amount)
      newPayment.set('billing_type', billingType)
      newPayment.set('status', 'pending')
      newPayment.set('asaas_payment_id', asaasId)
      newPayment.set('asaas_invoice_url', asaasPayment.invoiceUrl || '')
      newPayment.set('bank_slip_url', asaasPayment.bankSlipUrl || '')
      newPayment.set('pix_qr_code', pixQrCode)
      newPayment.set('pix_copy_paste', pixCopyPaste)
      newPayment.set('credits_amount', creditsAmount)
      newPayment.set(
        'metadata',
        JSON.stringify({
          asaasPayload: asaasPayment,
          cycle: cycle,
        }),
      )
      e.app.save(newPayment)

      return e.json(200, {
        success: true,
        mockMode: false,
        environment: isLive ? 'production' : 'sandbox',
        paymentId: newPayment.id,
        asaasId: asaasId,
        status: 'pending',
        details: {
          billingType,
          amount,
          itemTitle,
          pix:
            billingType === 'PIX'
              ? {
                  copyPaste: pixCopyPaste,
                  qrCodeBase64: pixQrCode,
                }
              : null,
          bankSlipUrl: asaasPayment.bankSlipUrl || null,
          invoiceUrl: asaasPayment.invoiceUrl || null,
        },
      })
    } catch (err) {
      console.log('Asaas Fatal Error:', err)
      return e.json(500, { error: 'Falha na comunicação com o gateway Asaas' })
    }
  },
  $apis.requireAuth(),
)

/**
 * Webhook do Asaas (chamado pelo Asaas em POST /backend/v1/asaas/webhook)
 * Eventos suportados:
 * - PAYMENT_CREATED: cobrança criada no Asaas
 * - PAYMENT_CONFIRMED / PAYMENT_RECEIVED: pagamento aprovado → credita créditos ou ativa plano (idempotente)
 * - PAYMENT_RECEIVED_IN_CASH_UNDONE_CHANGED: recebimento desfeito
 * - PAYMENT_OVERDUE: cobrança vencida
 * - PAYMENT_REFUNDED / PAYMENT_REFUND_IN_PROGRESS: cobrança estornada
 * - PAYMENT_DELETED / PAYMENT_FAILED: cobrança removida ou falha
 */
routerAdd('POST', '/backend/v1/asaas/webhook', (e) => {
  const body = e.requestInfo().body || {}
  const event = String(body.event || '').toUpperCase()
  const payment = body.payment || {}
  const asaasPaymentId = payment.id || ''

  console.log('[Asaas Webhook] Evento recebido:', event, 'PaymentId:', asaasPaymentId)

  if (!asaasPaymentId) {
    return e.json(200, { received: true, note: 'no payment id' })
  }

  const paymentsCol = e.app.findCollectionByNameOrId('payments')
  const usersCol = e.app.findCollectionByNameOrId('_pb_users_auth_')

  let paymentRecord = null
  try {
    paymentRecord = e.app.findFirstRecordByData('payments', 'asaas_payment_id', asaasPaymentId)
  } catch (_) {
    console.log('[Asaas Webhook] Pagamento não localizado pelo asaas_payment_id:', asaasPaymentId)
  }

  // Se não achou pelo asaas_payment_id, tenta pelo externalReference se disponível
  if (!paymentRecord) {
    const extRef = payment.externalReference || ''
    if (extRef && extRef.includes('|')) {
      const parts = extRef.split('|')
      const userId = parts[0]
      const type = parts[1]
      const itemId = parts[2]
      const credits = Number(parts[3] || 0)
      try {
        const userRec = e.app.findRecordById(usersCol.id, userId)
        paymentRecord = new Record(paymentsCol)
        paymentRecord.set('user', userRec.id)
        paymentRecord.set('type', type)
        paymentRecord.set('item_id', itemId)
        paymentRecord.set('amount', payment.value || 0)
        paymentRecord.set('billing_type', payment.billingType || 'PIX')
        paymentRecord.set('status', 'pending')
        paymentRecord.set('asaas_payment_id', asaasPaymentId)
        paymentRecord.set('credits_amount', credits)
        paymentRecord.set('asaas_invoice_url', payment.invoiceUrl || '')
        paymentRecord.set('bank_slip_url', payment.bankSlipUrl || '')
        e.app.save(paymentRecord)
      } catch (recErr) {
        console.log('[Asaas Webhook] Erro ao criar registro fallback:', recErr)
      }
    }
  }

  if (!paymentRecord) {
    return e.json(200, { received: true, note: 'payment record not found' })
  }

  const isConfirmed = event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED'
  const isCreated = event === 'PAYMENT_CREATED'
  const isOverdue = event === 'PAYMENT_OVERDUE'
  const isRefunded =
    event === 'PAYMENT_REFUNDED' ||
    event === 'PAYMENT_REFUND_IN_PROGRESS' ||
    event === 'PAYMENT_RECEIVED_IN_CASH_UNDONE_CHANGED'
  const isFailedOrDeleted = event === 'PAYMENT_DELETED' || event === 'PAYMENT_FAILED'

  const currentStatus = paymentRecord.getString('status')
  const userId = paymentRecord.getString('user')
  const type = paymentRecord.getString('type')
  const itemId = paymentRecord.getString('item_id')
  const creditsAmount = paymentRecord.getInt('credits_amount') || 0

  // 1. EVENTO: PAGAMENTO CONFIRMADO
  if (isConfirmed) {
    // IDEMPOTÊNCIA: Se já foi marcado como pago/confirmado, não credita novamente!
    if (currentStatus === 'paid' || currentStatus === 'confirmed') {
      console.log('[Asaas Webhook] Pagamento já processado anteriormente:', asaasPaymentId)
      return e.json(200, { received: true, alreadyProcessed: true })
    }

    paymentRecord.set('status', 'paid')
    paymentRecord.set('paid_at', new Date().toISOString())
    e.app.save(paymentRecord)

    try {
      const userRec = e.app.findRecordById(usersCol.id, userId)
      if (type === 'credits' && creditsAmount > 0) {
        const currentExtra = userRec.getInt('extra_credits') || 0
        userRec.set('extra_credits', currentExtra + creditsAmount)
        e.app.save(userRec)
        console.log(
          '[Asaas Webhook] Creditados',
          creditsAmount,
          'créditos extras para o usuário',
          userId,
        )
      } else if (type === 'plan') {
        userRec.set('plan', itemId)
        e.app.save(userRec)
        console.log('[Asaas Webhook] Plano atualizado para', itemId, 'para o usuário', userId)
      }
    } catch (userErr) {
      console.log('[Asaas Webhook] Erro ao creditar usuário:', userErr)
    }

    return e.json(200, { success: true, processed: true, event: 'paid' })
  }

  // 2. EVENTO: COBRANÇA CRIADA
  if (isCreated) {
    if (paymentRecord.getString('status') !== 'paid') {
      paymentRecord.set('status', 'pending')
      if (payment.invoiceUrl) paymentRecord.set('asaas_invoice_url', payment.invoiceUrl)
      if (payment.bankSlipUrl) paymentRecord.set('bank_slip_url', payment.bankSlipUrl)
      e.app.save(paymentRecord)
    }
    return e.json(200, { received: true, event: 'pending' })
  }

  // 3. EVENTO: COBRANÇA VENCIDA (OVERDUE)
  if (isOverdue) {
    paymentRecord.set('status', 'overdue')
    e.app.save(paymentRecord)
    console.log('[Asaas Webhook] Pagamento marcado como vencido:', asaasPaymentId)
    return e.json(200, { received: true, event: 'overdue' })
  }

  // 4. EVENTO: COBRANÇA ESTORNADA OU DESFEITA
  if (isRefunded) {
    paymentRecord.set('status', 'refunded')
    e.app.save(paymentRecord)
    console.log('[Asaas Webhook] Pagamento marcado como estornado:', asaasPaymentId)
    return e.json(200, { received: true, event: 'refunded' })
  }

  // 5. EVENTO: CANCELADO OU FALHOU
  if (isFailedOrDeleted) {
    paymentRecord.set('status', 'failed')
    e.app.save(paymentRecord)
    console.log('[Asaas Webhook] Pagamento cancelado/falhou no Asaas:', asaasPaymentId)
    return e.json(200, { received: true, event: 'failed' })
  }

  return e.json(200, { received: true, note: 'unhandled event ' + event })
})

/**
 * Endpoint para listar histórico de pagamentos do usuário autenticado
 * GET /backend/v1/asaas/my-payments
 */
routerAdd(
  'GET',
  '/backend/v1/asaas/my-payments',
  (e) => {
    const authRecord = e.auth
    if (!authRecord) {
      return e.json(401, { error: 'Não autorizado' })
    }

    try {
      const records = e.app.findRecordsByFilter(
        'payments',
        `user = "${authRecord.id}"`,
        '-created',
        50,
        0,
      )

      const items = records.map((r) => ({
        id: r.id,
        type: r.getString('type'),
        itemId: r.getString('item_id'),
        itemTitle: r.getString('item_title'),
        amount: r.getFloat('amount'),
        billingType: r.getString('billing_type'),
        status: r.getString('status'),
        asaasPaymentId: r.getString('asaas_payment_id'),
        asaasInvoiceUrl: r.getString('asaas_invoice_url'),
        bankSlipUrl: r.getString('bank_slip_url'),
        creditsAmount: r.getInt('credits_amount'),
        paidAt: r.getString('paid_at'),
        created: r.getString('created'),
      }))

      return e.json(200, { payments: items })
    } catch (err) {
      console.log('Erro ao buscar pagamentos do usuário:', err)
      return e.json(200, { payments: [] })
    }
  },
  $apis.requireAuth(),
)

/**
 * Rota auxiliar para simulação/teste do usuário no painel quando em modo sandbox/configuração
 * Permite marcar um pagamento pendente como pago para testar o fluxo de créditos em tela
 */
routerAdd(
  'POST',
  '/backend/v1/asaas/simulate-confirm',
  (e) => {
    const authRecord = e.auth
    if (!authRecord) return e.json(401, { error: 'Não autorizado' })

    const body = e.requestInfo().body || {}
    const paymentId = body.paymentId
    if (!paymentId) return e.json(400, { error: 'paymentId é obrigatório' })

    const paymentsCol = e.app.findCollectionByNameOrId('payments')
    const usersCol = e.app.findCollectionByNameOrId('_pb_users_auth_')

    const pay = e.app.findRecordById(paymentsCol.id, paymentId)
    if (pay.getString('user') !== authRecord.id) {
      return e.json(403, { error: 'Não autorizado para este pagamento' })
    }

    if (pay.getString('status') === 'paid') {
      return e.json(200, { success: true, message: 'Já estava pago' })
    }

    pay.set('status', 'paid')
    pay.set('paid_at', new Date().toISOString())
    e.app.save(pay)

    const userRec = e.app.findRecordById(usersCol.id, authRecord.id)
    const type = pay.getString('type')
    const credits = pay.getInt('credits_amount') || 0
    const itemId = pay.getString('item_id')

    if (type === 'credits' && credits > 0) {
      const cur = userRec.getInt('extra_credits') || 0
      userRec.set('extra_credits', cur + credits)
      e.app.save(userRec)
    } else if (type === 'plan') {
      userRec.set('plan', itemId)
      e.app.save(userRec)
    }

    return e.json(200, {
      success: true,
      message: 'Pagamento confirmado e saldo creditado com sucesso!',
    })
  },
  $apis.requireAuth(),
)
