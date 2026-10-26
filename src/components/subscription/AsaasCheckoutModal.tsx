import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  QrCode,
  CreditCard,
  Barcode,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import {
  createAsaasPayment,
  simulateConfirmPayment,
  type AsaasPaymentResult,
} from '@/services/asaas'
import { toast } from '@/hooks/use-toast'

export interface CheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: {
    type: 'plan' | 'credits'
    id: string
    title: string
    price: string
    numericAmount: number
    creditsAmount?: number
    cycle?: 'monthly' | 'annual'
  } | null
  onPaymentSuccess?: (creditsCredited?: number) => void
}

export function AsaasCheckoutModal({
  open,
  onOpenChange,
  item,
  onPaymentSuccess,
}: CheckoutModalProps) {
  const [billingType, setBillingType] = useState<'PIX' | 'CREDIT_CARD' | 'BOLETO'>('PIX')
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<AsaasPaymentResult | null>(null)
  const [copied, setCopied] = useState(false)

  if (!item) return null

  const handleStartPayment = async () => {
    setLoading(true)
    try {
      const res = await createAsaasPayment({
        type: item.type,
        itemId: item.id,
        itemTitle: item.title,
        amount: item.numericAmount,
        billingType,
        creditsAmount: item.creditsAmount,
        cycle: item.cycle,
      })
      setResult(res)
      toast({
        title: 'Cobrança gerada!',
        description: res.mockMode
          ? 'Gateway pronto (chave Asaas em configuração). Prossiga com as instruções de teste.'
          : 'Cobrança oficial criada no Asaas com sucesso.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar pagamento',
        description: err?.message || 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPix = () => {
    const code = result?.details?.pix?.copyPaste
    if (code) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      toast({ title: 'Código Copiado!', description: 'Cole no aplicativo do seu banco.' })
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const handleSimulatePayment = async () => {
    if (!result?.paymentId) return
    setConfirming(true)
    try {
      await simulateConfirmPayment(result.paymentId)
      toast({
        title: 'Pagamento confirmado!',
        description:
          item.type === 'credits'
            ? `+${item.creditsAmount?.toLocaleString('pt-BR')} créditos adicionados aos seus Créditos Extras!`
            : `Plano ${item.title} ativado com sucesso!`,
      })
      if (onPaymentSuccess) {
        onPaymentSuccess(item.creditsAmount)
      }
      onOpenChange(false)
      setResult(null)
    } catch (err: any) {
      toast({
        title: 'Falha ao confirmar',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setConfirming(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-6 rounded-3xl bg-card border border-border shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Checkout Asaas
            </span>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-purple-500/30 text-primary"
            >
              100% Seguro
            </Badge>
          </div>
          <DialogTitle className="text-xl font-extrabold text-foreground">{item.title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {item.type === 'plan'
              ? `Assinatura de plano (${item.cycle === 'annual' ? 'Ciclo Anual -31%' : 'Ciclo Mensal'})`
              : `Pacote de ${item.creditsAmount?.toLocaleString('pt-BR')} Créditos Extras que nunca expiram`}
          </DialogDescription>
        </DialogHeader>

        {/* Resumo do Pedido */}
        <div className="p-4 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium">Valor total</span>
            <div className="text-2xl font-black text-foreground">{item.price}</div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-muted-foreground">Processado por</span>
            <div className="text-xs font-bold text-foreground flex items-center gap-1 justify-end">
              <span>Asaas Payments</span>
            </div>
          </div>
        </div>

        {/* Seleção do método quando ainda não gerou cobrança */}
        {!result && (
          <div className="space-y-4 pt-1">
            <label className="text-xs font-bold text-foreground block">
              Escolha a forma de pagamento:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBillingType('PIX')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  billingType === 'PIX'
                    ? 'border-purple-600 bg-purple-500/10 text-primary font-bold shadow-xs'
                    : 'border-border/70 hover:border-border text-muted-foreground'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs">Pix</span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                  Imediato
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBillingType('CREDIT_CARD')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  billingType === 'CREDIT_CARD'
                    ? 'border-purple-600 bg-purple-500/10 text-primary font-bold shadow-xs'
                    : 'border-border/70 hover:border-border text-muted-foreground'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Cartão</span>
                <span className="text-[9px] text-muted-foreground">Até 12x</span>
              </button>

              <button
                type="button"
                onClick={() => setBillingType('BOLETO')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  billingType === 'BOLETO'
                    ? 'border-purple-600 bg-purple-500/10 text-primary font-bold shadow-xs'
                    : 'border-border/70 hover:border-border text-muted-foreground'
                }`}
              >
                <Barcode className="w-5 h-5" />
                <span className="text-xs">Boleto</span>
                <span className="text-[9px] text-muted-foreground">1-2 dias</span>
              </button>
            </div>

            <Button
              onClick={handleStartPayment}
              disabled={loading}
              className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-xs gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>Prosseguir para Pagamento</span>
            </Button>
          </div>
        )}

        {/* Exibição da cobrança gerada */}
        {result && (
          <div className="space-y-4 pt-1">
            {result.mockMode && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-bold">Pagamento em Configuração</p>
                  <p className="text-[11px] opacity-90">
                    O checkout está 100% pronto. Cole sua chave de API do Asaas nos Segredos da
                    plataforma para cobranças reais.
                  </p>
                </div>
              </div>
            )}

            {/* Pix Detalhes */}
            {billingType === 'PIX' && (
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/40 border border-border/80 text-center space-y-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  Escaneie o QR Code no app do seu banco:
                </span>

                <div className="w-48 h-48 bg-white p-2 rounded-2xl shadow-inner flex items-center justify-center border border-border">
                  {result.details?.pix?.qrCodeBase64 ? (
                    <img
                      src={`data:image/png;base64,${result.details.pix.qrCodeBase64}`}
                      alt="Pix QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : result.details?.pix?.qrCodeUrl ? (
                    <img
                      src={result.details.pix.qrCodeUrl}
                      alt="Pix QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <QrCode className="w-32 h-32 text-purple-900" />
                  )}
                </div>

                {result.details?.pix?.copyPaste && (
                  <div className="w-full space-y-1.5">
                    <span className="text-[11px] text-muted-foreground">
                      Ou use o Copia e Cola:
                    </span>
                    <div className="flex items-center gap-1.5 bg-background p-1.5 rounded-xl border border-border">
                      <input
                        type="text"
                        readOnly
                        value={result.details.pix.copyPaste}
                        className="bg-transparent text-[10px] font-mono text-muted-foreground flex-1 outline-none px-1 truncate"
                      />
                      <Button
                        size="sm"
                        onClick={handleCopyPix}
                        className="h-7 text-xs px-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shrink-0 gap-1 font-semibold"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Boleto Detalhes */}
            {billingType === 'BOLETO' && (
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-center space-y-3">
                <Barcode className="w-10 h-10 mx-auto text-primary" />
                <div>
                  <p className="text-sm font-bold text-foreground">Boleto Bancário Gerado</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Vencimento em 3 dias úteis. A compensação ocorre em até 48 horas.
                  </p>
                </div>
                {result.details?.bankSlipUrl && (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-10 text-xs font-bold gap-2 rounded-xl"
                  >
                    <a href={result.details.bankSlipUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir Boleto em PDF
                    </a>
                  </Button>
                )}
              </div>
            )}

            {/* Cartão de Crédito Detalhes */}
            {billingType === 'CREDIT_CARD' && (
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-center space-y-3">
                <CreditCard className="w-10 h-10 mx-auto text-primary" />
                <div>
                  <p className="text-sm font-bold text-foreground">Pagamento com Cartão</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Prossiga pelo link seguro de pagamento do Asaas com criptografia de ponta a
                    ponta.
                  </p>
                </div>
                {result.details?.invoiceUrl && (
                  <Button
                    asChild
                    className="w-full h-10 text-xs font-bold gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <a href={result.details.invoiceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" /> Pagar no Asaas Seguro
                    </a>
                  </Button>
                )}
              </div>
            )}

            {/* Ações de simulação/teste do usuário */}
            <div className="pt-2 border-t border-border/60 space-y-2">
              <Button
                onClick={handleSimulatePayment}
                disabled={confirming}
                variant="outline"
                className="w-full h-10 rounded-xl border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 text-xs font-bold gap-2"
              >
                {confirming ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Confirmar Pagamento Realizado (Creditar Saldo)</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
