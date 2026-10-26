/**
 * MidiaViva / BestContent Social 2 - Asaas Integration Hooks
 * - POST /backend/v1/asaas/create-payment (inicia cobrança Asaas ou fallback amigável caso ASAAS_API_KEY não esteja configurada)
 * - POST /backend/v1/asaas/webhook (recebe eventos PAYMENT_RECEIVED / PAYMENT_CONFIRMED do Asaas e credita plano ou créditos)
 * - GET /backend/v1/asaas/status (verifica se gateway está configurado)
 */

routerAdd('GET', '/backend/v1/asaas/status', (e) => {
  const apiKey = $os.getenv('ASAAS_API_KEY') || ''
  const env = $os.getenv('ASAAS_ENV') || 'sandbox'
  return e.json(200, {
    configured: Boolean(apiKey && apiKey.trim().length > 5),
    environment: env,
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
    const asaasEnv = ($os.getenv('ASAAS_ENV') || 'sandbox').trim()
    const isLive = asaasEnv === 'production' || asaasEnv === 'prd'
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
        paymentId: localPayment.id,
        status: 'pending',
        message: 'Checkout pronto e aguardando chave oficial do Asaas.',
        details: {
          billingType,
          amount,
          itemTitle:
            itemTitle || (type === 'plan' ? `Plano ${itemId}` : `${creditsAmount} Créditos Extras`),
          // Dados de demonstração enquanto a chave não é informada
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
 * Eventos principais:
 * - PAYMENT_RECEIVED
 * - PAYMENT_CONFIRMED
 * Idempotente: só credita se status não for 'paid' ou 'confirmed'.
 */
routerAdd('POST', '/backend/v1/asaas/webhook', (e) => {
  const body = e.requestInfo().body || {}
  const event = body.event || ''
  const payment = body.payment || {}
  const asaasPaymentId = payment.id || ''

  console.log('[Asaas Webhook] Evento recebido:', event, 'PaymentId:', asaasPaymentId)

  if (!asaasPaymentId) {
    return e.json(200, { received: true, note: 'no payment id' })
  }

  const validEvents = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED']
  if (!validEvents.includes(event)) {
    return e.json(200, { received: true, note: 'unhandled event ' + event })
  }

  const paymentsCol = e.app.findCollectionByNameOrId('payments')
  const usersCol = e.app.findCollectionByNameOrId('_pb_users_auth_')

  let paymentRecord = null
  try {
    paymentRecord = e.app.findFirstRecordByData('payments', 'asaas_payment_id', asaasPaymentId)
  } catch (_) {
    console.log('[Asaas Webhook] Pagamento não localizado pelo asaas_payment_id:', asaasPaymentId)
  }

  if (!paymentRecord) {
    // Se não achou pelo asaas_payment_id, tenta pelo externalReference se disponível
    const extRef = payment.externalReference || ''
    if (extRef && extRef.includes('|')) {
      const parts = extRef.split('|')
      const userId = parts[0]
      const type = parts[1]
      const itemId = parts[2]
      const credits = Number(parts[3] || 0)
      try {
        const userRec = e.app.findRecordById(usersCol.id, userId)
        // Cria registro de pagamento e credita
        paymentRecord = new Record(paymentsCol)
        paymentRecord.set('user', userRec.id)
        paymentRecord.set('type', type)
        paymentRecord.set('item_id', itemId)
        paymentRecord.set('amount', payment.value || 0)
        paymentRecord.set('billing_type', payment.billingType || 'PIX')
        paymentRecord.set('status', 'paid')
        paymentRecord.set('asaas_payment_id', asaasPaymentId)
        paymentRecord.set('credits_amount', credits)
        paymentRecord.set('paid_at', new Date().toISOString())
        e.app.save(paymentRecord)

        // Credita usuário
        if (type === 'credits' && credits > 0) {
          const currentExtra = userRec.getInt('extra_credits') || 0
          userRec.set('extra_credits', currentExtra + credits)
          e.app.save(userRec)
        } else if (type === 'plan') {
          userRec.set('plan', itemId)
          e.app.save(userRec)
        }
        return e.json(200, { success: true, processed: true, createdFromWebhook: true })
      } catch (recErr) {
        console.log('[Asaas Webhook] Erro ao criar registro fallback:', recErr)
      }
    }
    return e.json(200, { received: true, note: 'payment record not found' })
  }

  // IDEMPOTÊNCIA: Se já foi pago, não credita novamente
  const currentStatus = paymentRecord.getString('status')
  if (currentStatus === 'paid' || currentStatus === 'confirmed') {
    return e.json(200, { received: true, alreadyProcessed: true })
  }

  // Atualiza status do pagamento
  paymentRecord.set('status', 'paid')
  paymentRecord.set('paid_at', new Date().toISOString())
  e.app.save(paymentRecord)

  // Credita na conta do usuário
  const userId = paymentRecord.getString('user')
  const type = paymentRecord.getString('type')
  const itemId = paymentRecord.getString('item_id')
  const creditsAmount = paymentRecord.getInt('credits_amount') || 0

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
    console.log('[Asaas Webhook] Erro ao atualizar usuário:', userErr)
  }

  return e.json(200, { success: true, processed: true })
})

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
