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

export async function getAsaasConfigStatus(): Promise<{
  configured: boolean
  environment: string
}> {
  try {
    const res = await pb.send('/backend/v1/asaas/status', {
      method: 'GET',
    })
    return res
  } catch {
    return { configured: false, environment: 'sandbox' }
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

export async function getUserPayments(userId: string) {
  try {
    return await pb.collection('payments').getFullList({
      filter: `user = "${userId}"`,
      sort: '-created',
    })
  } catch {
    return []
  }
}
