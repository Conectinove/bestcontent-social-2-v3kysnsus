import { useState, useEffect } from 'react'
import {
  CreditCard,
  Crown,
  Zap,
  Shield,
  Plus,
  RefreshCw,
  Gift,
  ExternalLink,
  Check,
  CheckCircle2,
  Lock,
  History,
  Clock,
  AlertCircle,
  FileText,
  BadgeCheck,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { BuyCreditsModal } from '@/components/subscription/BuyCreditsModal'
import { AsaasCheckoutModal } from '@/components/subscription/AsaasCheckoutModal'
import { getUserPayments, type UserPaymentRecord } from '@/services/asaas'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/hooks/use-toast'

interface PlanTier {
  id: 'pro' | 'max' | 'enterprise'
  name: string
  icon: typeof Zap
  iconColor: string
  iconBg: string
  description: string
  monthlyPrice: string
  annualPrice: string
  isCurrent?: boolean
  badge?: string
  includedFromPrevious?: string
  ctaText: string
  ctaVariant: 'purple' | 'current' | 'outline'
  benefits: string[]
}

const PLANS: PlanTier[] = [
  {
    id: 'pro',
    name: 'Pro',
    icon: Zap,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100 dark:bg-purple-950/60',
    description: 'Para criadores e pequenos times que publicam com frequência.',
    monthlyPrice: 'R$ 69,90',
    annualPrice: 'R$ 48,23', // -31% approx
    ctaText: 'Fazer Downgrade',
    ctaVariant: 'purple',
    benefits: [
      '800 créditos por mês',
      '6 edições gratuitas por post',
      'Até 10 slides por carrossel',
      'Até 5 marcas',
      '1 usuário (uso individual)',
      'Agendamento automático de posts',
      'Geração e Edição com IA',
      'Inspirações ilimitadas',
      'Analytics de posts',
      'Suporte por chat',
    ],
  },
  {
    id: 'max',
    name: 'Max',
    icon: Crown,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-950/60',
    description: 'Para agências e produtores de alto volume que precisam de mais...',
    monthlyPrice: 'R$ 129,90',
    annualPrice: 'R$ 89,63', // -31% approx
    isCurrent: true,
    badge: 'Seu plano',
    ctaText: 'Plano atual',
    ctaVariant: 'current',
    includedFromPrevious: 'Tudo do Pro',
    benefits: [
      '1800 créditos por mês',
      '12 edições gratuitas por post',
      'Até 20 slides por carrossel',
      'Até 20 marcas',
      'Até 5 pessoas no time',
      'Dashboards global de marcas',
      'Analytics completo',
      'Análise de concorrência',
      'Relatórios de consumo de crédito',
      'Portal do cliente',
      'Suporte Dedicado',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Shield,
    iconColor: 'text-sky-600',
    iconBg: 'bg-sky-100 dark:bg-sky-950/60',
    description: 'Para operações grandes que precisam de volume customizado,...',
    monthlyPrice: 'Sob medida',
    annualPrice: 'Sob medida',
    ctaText: 'Falar com vendas',
    ctaVariant: 'outline',
    includedFromPrevious: 'Tudo do Max',
    benefits: [
      'Créditos sob medida',
      'Edições gratuitas ilimitadas',
      'Slides por carrossel sob demanda',
      'Marcas ilimitadas',
      'Pessoas no time ilimitadas',
      'SLA dedicado e faturamento PJ',
      'Gerente de conta exclusivo',
      'Onboarding e treinamento da equipe',
    ],
  },
]

export default function Subscription() {
  const { user } = useAuth()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [checkoutItem, setCheckoutItem] = useState<{
    type: 'plan' | 'credits'
    id: string
    title: string
    price: string
    numericAmount: number
    creditsAmount?: number
    cycle?: 'monthly' | 'annual'
  } | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  // Histórico de pagamentos
  const [paymentsHistory, setPaymentsHistory] = useState<UserPaymentRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const data = await getUserPayments(user?.id)
      setPaymentsHistory(data)
    } catch {
      setPaymentsHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [user?.id])

  // Real or fallback credit numbers matching reference screenshot:
  // Total: 3400 | Plan: 1800/1800 | Extra: 1600 | Used: 0
  const [creditsState, setCreditsState] = useState({
    total: 3400,
    planCredits: 1800,
    planMax: 1800,
    extraCredits: 1600,
    renewalDays: 18,
    usedInPeriod: 0,
  })

  const handleBuyCredits = (amount: number) => {
    setCreditsState((prev) => ({
      ...prev,
      total: prev.total + amount,
      extraCredits: prev.extraCredits + amount,
    }))
  }

  const handleManageStripe = () => {
    toast({
      title: 'Portal de Pagamentos',
      description: 'Gerenciamento de faturas integrado com Asaas.',
    })
  }

  const handlePlanAction = (plan: PlanTier) => {
    if (plan.isCurrent) return
    if (plan.id === 'enterprise') {
      toast({
        title: 'Falar com Vendas',
        description: 'Um consultor entrará em contato pelo e-mail cadastrado.',
      })
      return
    }

    // Preços exatos: Pro R$ 69,90/mês (ou R$ 48,23 * 12 = R$ 578,76 anual), Max R$ 129,90/mês
    const numeric =
      plan.id === 'pro'
        ? billingCycle === 'annual'
          ? 578.76
          : 69.9
        : billingCycle === 'annual'
          ? 1075.56
          : 129.9

    const priceLabel =
      billingCycle === 'annual' ? `${plan.annualPrice}/mês (anual)` : `${plan.monthlyPrice}/mês`

    setCheckoutItem({
      type: 'plan',
      id: plan.id,
      title: `Plano ${plan.name}`,
      price: priceLabel,
      numericAmount: numeric,
      cycle: billingCycle,
    })
    setIsCheckoutOpen(true)
  }

  return (
    <div className="animate-fade-in space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
          <CreditCard className="w-5 h-5" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Minha Assinatura
        </h1>
      </div>

      {/* Top Section: 2 columns (Seu Plano & Seus Créditos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Seu Plano (Left) */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Top row: Label + Max pill */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Seu Plano</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                <span>👑</span> Max
              </span>
            </div>

            {/* Plan Info */}
            <div className="flex items-center gap-3 mt-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center text-lg shadow-inner shrink-0">
                👑
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-foreground leading-tight">Max</h3>
                <p className="text-xs text-muted-foreground font-medium">Anual</p>
              </div>
            </div>

            {/* Dates: Início e Expira */}
            <div className="space-y-1.5 mt-5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Início do plano</span>
                <span className="font-semibold text-foreground">23 de junho de 2026</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Expira em</span>
                <span className="font-semibold text-foreground">23 de junho de 2027</span>
              </div>
            </div>

            {/* 2x2 Mini-cards grid */}
            <div className="grid grid-cols-2 gap-2.5 mt-6">
              <div className="p-3 rounded-xl bg-muted/60 border border-border/40 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Slides</span>
                <span className="text-base font-extrabold text-foreground">20</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/60 border border-border/40 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Marcas</span>
                <span className="text-base font-extrabold text-foreground">20</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/60 border border-border/40 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Edições/post</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-extrabold text-foreground">12</span>
                  <span className="text-[11px] text-muted-foreground font-medium">/ post</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/60 border border-border/40 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Time</span>
                <span className="text-base font-extrabold text-foreground">5</span>
              </div>
            </div>
          </div>

          {/* Manage Subscription & Payments Button */}
          <div className="mt-6 pt-2">
            <Button
              variant="outline"
              onClick={handleManageStripe}
              className="w-full h-11 rounded-xl text-xs sm:text-sm font-semibold border-border hover:bg-muted text-foreground flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              <span>Gerenciar Assinatura e Pagamentos</span>
            </Button>
          </div>
        </div>

        {/* Card: Seus Créditos (Right) */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Top row: Label + + Recarregar button */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Seus Créditos</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="h-8 px-3 rounded-lg text-xs font-bold border-border/80 hover:border-primary/50 text-foreground flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span>Recarregar</span>
              </Button>
            </div>

            {/* Total Disponível Box (lilac highlight) */}
            <div className="mt-3 p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
              <span className="text-xs font-medium text-muted-foreground">Total Disponível</span>
              <div className="text-4xl sm:text-5xl font-black text-foreground tracking-tight mt-1">
                {creditsState.total.toLocaleString('pt-BR')}
              </div>
            </div>

            {/* Two horizontal sub-cards: Créditos do Plano & Créditos Extras */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {/* Plan credits */}
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border/40 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <RefreshCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Créditos do Plano</span>
                </div>
                <div className="text-lg font-extrabold text-foreground">
                  {creditsState.planCredits}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    / {creditsState.planMax}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium pt-0.5">
                  <span>♻️</span>
                  <span>Renovam em {creditsState.renewalDays} dias</span>
                </div>
              </div>

              {/* Extra credits */}
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border/40 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Gift className="w-3.5 h-3.5 text-amber-500" />
                  <span>Créditos Extras</span>
                </div>
                <div className="text-lg font-extrabold text-foreground">
                  {creditsState.extraCredits}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium pt-0.5">
                  <Lock className="w-3 h-3 text-amber-600/80" />
                  <span>Nunca expiram</span>
                </div>
              </div>
            </div>

            {/* Info note */}
            <p className="text-[11px] text-center text-muted-foreground mt-4">
              Seus créditos do plano renovam para {creditsState.planMax} a cada ciclo mensal.
            </p>
          </div>

          {/* Bottom line: Usados neste período — 0 créditos */}
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Usados neste período</span>
            <span className="text-amber-500 font-bold">{creditsState.usedInPeriod} créditos</span>
          </div>
        </div>
      </div>

      {/* Seção: Histórico de Pagamentos e Faturas Asaas */}
      <Card className="rounded-3xl border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">
                Histórico de Cobranças & Faturas
              </h3>
              <p className="text-xs text-muted-foreground">
                Registro de transações sincronizadas em tempo real via Webhook Asaas
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
            disabled={loadingHistory}
            className="text-xs h-8 rounded-xl gap-1 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
        </div>

        {paymentsHistory.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Clock className="w-8 h-8 text-muted-foreground/50 mx-auto" />
            <p className="text-xs font-semibold text-muted-foreground">
              Nenhuma transação registrada até o momento.
            </p>
            <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
              Ao assinar um plano ou recarregar créditos via PIX, Cartão ou Boleto, seus recibos e
              status aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {paymentsHistory.map((pay) => {
              const isPaid = pay.status === 'paid' || pay.status === 'confirmed'
              const isPending = pay.status === 'pending'
              const isOverdue = pay.status === 'overdue'
              const isRefunded = pay.status === 'refunded'
              const isFailed = pay.status === 'failed' || pay.status === 'cancelled'

              return (
                <div
                  key={pay.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-foreground text-sm">
                        {pay.itemTitle ||
                          (pay.type === 'plan'
                            ? `Plano ${pay.itemId}`
                            : `${pay.creditsAmount || 0} Créditos`)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          isPaid
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            : isPending
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                              : isOverdue
                                ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                                : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isPaid && 'Pago / Confirmado'}
                        {isPending && 'Pendente'}
                        {isOverdue && 'Vencido'}
                        {isRefunded && 'Estornado'}
                        {isFailed && 'Falhou / Cancelado'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                      <span>
                        Método: <strong className="text-foreground">{pay.billingType}</strong>
                      </span>
                      <span>&middot;</span>
                      <span>
                        Data:{' '}
                        <strong className="text-foreground">
                          {pay.created ? new Date(pay.created).toLocaleDateString('pt-BR') : 'Hoje'}
                        </strong>
                      </span>
                      {pay.asaasPaymentId && (
                        <>
                          <span>&middot;</span>
                          <span className="font-mono text-[10px]">ID: {pay.asaasPaymentId}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-sm font-black text-foreground font-mono">
                      R$ {Number(pay.amount).toFixed(2).replace('.', ',')}
                    </span>

                    {pay.asaasInvoiceUrl && (
                      <a
                        href={pay.asaasInvoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline px-2 py-1 rounded-lg bg-purple-500/10"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Fatura</span>
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Planos disponíveis section */}
      <div className="pt-4 space-y-6">
        {/* Section title + Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Planos disponíveis
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Escolha o plano ideal para seu volume de criação.
            </p>
          </div>

          {/* Mensal / Anual toggle with -31% badge */}
          <div className="inline-flex items-center p-1 rounded-xl bg-muted border border-border/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-card text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                billingCycle === 'annual'
                  ? 'bg-card text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Anual</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-extrabold">
                -31%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Plans Grid (Pro, Max, Enterprise) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const isCurrent = plan.isCurrent
            const Icon = plan.icon
            const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 border bg-card ${
                  isCurrent
                    ? 'border-purple-500 ring-1 ring-purple-500/40 shadow-lg'
                    : 'border-border/80 hover:border-border shadow-xs'
                }`}
              >
                {/* Top Badge: "Seu plano" */}
                {plan.badge && (
                  <div className="absolute top-6 right-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-purple-600 text-white shadow-xs">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Icon + Title */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${plan.iconBg} ${plan.iconColor} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-foreground">{plan.name}</h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground mt-3 min-h-[34px] leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Pricing */}
                  <div className="mt-5 pb-5 border-b border-border/60">
                    {plan.id === 'enterprise' ? (
                      <div>
                        <div className="text-3xl font-black text-foreground tracking-tight">
                          Sob medida
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Preço negociável, baseado no tamanho da operação
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-foreground tracking-tight">
                            {price}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">/mês</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {billingCycle === 'annual'
                            ? 'cobrado anualmente (-31%)'
                            : 'cobrado mensalmente'}
                        </p>
                      </div>
                    )}

                    {/* CTA Button */}
                    <div className="mt-4">
                      {plan.ctaVariant === 'current' ? (
                        <Button
                          disabled
                          className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
                        >
                          {plan.ctaText}
                        </Button>
                      ) : plan.ctaVariant === 'purple' ? (
                        <Button
                          onClick={() => handlePlanAction(plan)}
                          className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                        >
                          {plan.ctaText}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => handlePlanAction(plan)}
                          className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold border-border hover:bg-muted text-foreground"
                        >
                          {plan.ctaText}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Included header pill (e.g. "✓ Tudo do Pro") */}
                  {plan.includedFromPrevious && (
                    <div className="mt-5">
                      <div className="w-full py-1.5 px-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>{plan.includedFromPrevious}</span>
                      </div>
                    </div>
                  )}

                  {/* Benefits checklist */}
                  <ul className="space-y-2.5 mt-4 text-xs text-muted-foreground">
                    {plan.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-foreground/90 font-medium leading-relaxed">
                          {benefit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Buy Credits Modal */}
      <BuyCreditsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onBuyCredits={handleBuyCredits}
      />

      {/* Asaas Checkout Modal para Planos */}
      <AsaasCheckoutModal
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        item={checkoutItem}
        onPaymentSuccess={() => {
          loadHistory()
          toast({
            title: 'Plano atualizado com sucesso!',
            description: 'Sua conta agora tem acesso a todos os recursos contratados.',
          })
        }}
      />
    </div>
  )
}
