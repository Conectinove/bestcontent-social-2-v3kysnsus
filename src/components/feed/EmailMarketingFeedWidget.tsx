import { useEffect, useState } from 'react'
import {
  Mail,
  Send,
  Users,
  Eye,
  MousePointerClick,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  UserX,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  fetchEmailMarketingData,
  type EmailMarketingData,
} from '@/services/email-marketing-organic'

interface EmailMarketingFeedWidgetProps {
  compact?: boolean
  className?: string
}

export function EmailMarketingFeedWidget({
  compact = false,
  className = '',
}: EmailMarketingFeedWidgetProps) {
  const [data, setData] = useState<EmailMarketingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await fetchEmailMarketingData()
      setData(res)
    } catch (err) {
      console.warn('[EmailMarketingFeedWidget] Erro ao carregar métricas:', err)
    } finally {
      setLoading(false)
      if (isManual) setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <Card className={`rounded-2xl border border-border/70 bg-card shadow-xs ${className}`}>
        <CardContent className="p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="w-24 h-3.5" />
                <Skeleton className="w-16 h-2.5" />
              </div>
            </div>
            <Skeleton className="w-20 h-5 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const isOfficial = data.is_official
  const badgeLabel = data.badge_label || (isOfficial ? 'Dados Oficiais' : 'Estimativa Calibrada')

  return (
    <Card
      className={`rounded-2xl border border-border/75 bg-gradient-to-br from-card via-card to-violet-500/5 shadow-xs hover:shadow-sm transition-all overflow-hidden ${className}`}
    >
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-violet-600 p-[2px] shrink-0 shadow-xs flex items-center justify-center text-white">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {data.account_name}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Provedor: {data.provider} (Resend API)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant="outline"
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isOfficial
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30'
              }`}
            >
              {isOfficial ? (
                <ShieldCheck className="w-2.5 h-2.5 mr-1 inline" />
              ) : (
                <Sparkles className="w-2.5 h-2.5 mr-1 inline" />
              )}
              {badgeLabel}
            </Badge>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              title="Atualizar métricas"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-primary' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
              <Users className="w-3 h-3 text-violet-600" />
              <span>Assinantes</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {Number(data.metrics.total_subscribers || 0).toLocaleString('pt-BR')}
            </p>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {data.metrics.delivery_rate}% entregabilidade
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
              <Eye className="w-3 h-3 text-indigo-600" />
              <span>Taxa Abertura</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {data.metrics.open_rate}%
            </p>
            <span className="text-[10px] font-medium text-muted-foreground">30 dias</span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
              <MousePointerClick className="w-3 h-3 text-violet-600" />
              <span>Taxa Clique (CTR)</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {data.metrics.click_through_rate}%
            </p>
            <span className="text-[10px] font-medium text-muted-foreground">engajamento</span>
          </div>
        </div>

        {/* Detailed KPI Blocks */}
        {!compact && (
          <div className="space-y-2 pt-1 border-t border-border/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
              <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Disparados (30d)</span>
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {Number(data.metrics.emails_sent_30d || 0).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Entregues</span>
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {Number(data.metrics.emails_delivered || 0).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Bounce</span>
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {data.metrics.bounce_rate}%
                </span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Descadastros</span>
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {data.metrics.unsubscribe_rate}%
                </span>
              </div>
            </div>

            {/* Performance por Formato */}
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-foreground">
                  Performance por Tipo de E-mail
                </span>
                <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">
                  Transacionais lideram abertura (64.2%)
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="p-1.5 rounded-lg bg-card border border-border/40">
                  <span className="text-[10px] text-muted-foreground block truncate">
                    Newsletter
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {data.format_performance.newsletter.open_rate}%
                  </span>
                  <span className="text-[9px] text-muted-foreground block">abertura</span>
                </div>
                <div className="p-1.5 rounded-lg bg-card border border-border/40">
                  <span className="text-[10px] text-muted-foreground block truncate">
                    Promocional
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {data.format_performance.promocional.open_rate}%
                  </span>
                  <span className="text-[9px] text-muted-foreground block">abertura</span>
                </div>
                <div className="p-1.5 rounded-lg bg-card border border-border/40">
                  <span className="text-[10px] text-muted-foreground block truncate">
                    Onboarding
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {data.format_performance.onboarding.open_rate}%
                  </span>
                  <span className="text-[9px] text-muted-foreground block">abertura</span>
                </div>
                <div className="p-1.5 rounded-lg bg-card border border-border/40">
                  <span className="text-[10px] text-muted-foreground block truncate">
                    Transacional
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {data.format_performance.transacional.open_rate}%
                  </span>
                  <span className="text-[9px] text-muted-foreground block">abertura</span>
                </div>
              </div>
            </div>

            {/* Campanhas recentes */}
            {data.recent_campaigns && data.recent_campaigns.length > 0 && (
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-[11px] font-bold text-foreground block mb-1.5">
                  Últimos Disparos de E-mail
                </span>
                <div className="space-y-1.5">
                  {data.recent_campaigns.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-card border border-border/40"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-foreground truncate">{c.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {c.sent_at} • {c.recipients} destinatários
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                        <span className="text-violet-600 font-semibold">
                          {c.open_rate}% abertura
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          ({c.click_rate}% clique)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
