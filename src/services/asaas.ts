import pb from '@/lib/pocketbase/client'

export interface CreateAsaasPaymentInput {
  type: 'plan' | 'credits'
  itemId: string
  itemTitle: string
  amount: number
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO'
  creditsAmount?: number
  cycle?: 'monthly' | 'annual'
}

export interface AsaasPaymentResult {
  success: boolean
  mockMode?: boolean
  paymentId?: string
  asaasId?: string
  status: string
  message?: string
  details?: {
    billingType: string
    amount: number
    itemTitle: string
    pix?: {
      copyPaste?: string
      qrCodeUrl?: string
      qrCodeBase64?: string
    } | null
    bankSlipUrl?: string | null
    invoiceUrl?: string | null
  }
}

export interface AsaasConfigStatus {
  configured: boolean
  environment: 'production' | 'sandbox'
  mode: 'production' | 'sandbox' | 'not_configured'
  canSimulate: boolean
  keyPrefix?: string | null
}

export async function getAsaasConfigStatus(): Promise<AsaasConfigStatus> {
  try {
    const res = await pb.send('/backend/v1/asaas/status', {
      method: 'GET',
    })
    return res as AsaasConfigStatus
  } catch {
    return {
      configured: false,
      environment: 'sandbox',
      mode: 'not_configured',
      canSimulate: true,
      keyPrefix: null,
    }
  }
}

export async function createAsaasPayment(
  data: CreateAsaasPaymentInput,
): Promise<AsaasPaymentResult> {
  const res = await pb.send('/backend/v1/asaas/create-payment', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return res as AsaasPaymentResult
}

export async function simulateConfirmPayment(
  paymentId: string,
): Promise<{ success: boolean; message: string }> {
  const res = await pb.send('/backend/v1/asaas/simulate-confirm', {
    method: 'POST',
    body: JSON.stringify({ paymentId }),
  })
  return res as { success: boolean; message: string }
}

export interface UserPaymentRecord {
  id: string
  type: 'plan' | 'credits'
  itemId: string
  itemTitle?: string
  amount: number
  billingType: string
  status: 'pending' | 'paid' | 'confirmed' | 'overdue' | 'refunded' | 'cancelled' | 'failed'
  asaasPaymentId?: string
  asaasInvoiceUrl?: string
  bankSlipUrl?: string
  creditsAmount?: number
  paidAt?: string
  created?: string
}

export async function getUserPayments(userId?: string): Promise<UserPaymentRecord[]> {
  try {
    // Tenta primeiro endpoint backend dedicado
    const res = await pb.send('/backend/v1/asaas/my-payments', {
      method: 'GET',
    })
    if (res?.payments) {
      return res.payments as UserPaymentRecord[]
    }
  } catch {
    /* intentionally ignored */
  }

  // Fallback SDK collection direto
  try {
    const authId = userId || pb.authStore.record?.id
    if (!authId) return []
    const records = await pb.collection('payments').getFullList({
      filter: `user = "${authId}"`,
      sort: '-created',
    })
    return records.map((r: any) => ({
      id: r.id,
      type: r.type,
      itemId: r.item_id,
      itemTitle: r.item_title,
      amount: r.amount,
      billingType: r.billing_type,
      status: r.status,
      asaasPaymentId: r.asaas_payment_id,
      asaasInvoiceUrl: r.asaas_invoice_url,
      bankSlipUrl: r.bank_slip_url,
      creditsAmount: r.credits_amount,
      paidAt: r.paid_at,
      created: r.created,
    }))
  } catch {
    return []
  }
}
