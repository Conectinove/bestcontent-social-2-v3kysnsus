import { useEffect, useState } from 'react'
import {
  MessageSquare,
  Users,
  Send,
  TrendingUp,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  PhoneCall,
  Eye,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchWhatsAppOrganicData, type WhatsAppOrganicData } from '@/services/whatsapp-organic'

interface WhatsAppFeedWidgetProps {
  compact?: boolean
  className?: string
}

export function WhatsAppFeedWidget({ compact = false, className = '' }: WhatsAppFeedWidgetProps) {
  const [data, setData] = useState<WhatsAppOrganicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await fetchWhatsAppOrganicData()
      setData(res)
    } catch (err) {
      console.warn('[WhatsAppFeedWidget] Erro ao carregar métricas:', err)
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
      className={`rounded-2xl border border-border/75 bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-xs hover:shadow-sm transition-all overflow-hidden ${className}`}
    >
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-500 p-[2px] shrink-0 shadow-xs flex items-center justify-center text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {data.account_name}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{data.phone_number}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant="outline"
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isOfficial
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
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
              <Users className="w-3 h-3 text-emerald-600" />
              <span>Contatos VIP</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {Number(data.metrics.total_contacts || 0).toLocaleString('pt-BR')}
            </p>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              base ativa
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
              <Eye className="w-3 h-3 text-teal-600" />
              <span>Taxa Leitura</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {data.metrics.open_rate}%
            </p>
            <span className="text-[10px] font-medium text-muted-foreground">abertura direta</span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>Taxa Clique</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {data.metrics.click_through_rate}%
            </p>
            <span className="text-[10px] font-medium text-muted-foreground">CTA e links</span>
          </div>
        </div>

        {/* Detailed KPI Blocks */}
        {!compact && (
          <div className="space-y-2 pt-1 border-t border-border/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
              <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Conversas (30d)</span>
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {Number(data.metrics.active_conversations_30d || 0).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Alcance Listas</span>
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {Number(data.metrics.broadcast_reach || 0).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Tempo de Resposta</span>
                <span className="text-xs sm:text-sm font-bold text-foreground flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  {data.metrics.average_response_time_minutes} min
                </span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Conversão</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-600">
                  {data.metrics.conversion_rate}%
                </span>
              </div>
            </div>

            {/* Listas recentes */}
            {data.recent_broadcasts && data.recent_broadcasts.length > 0 && (
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-[11px] font-bold text-foreground block mb-1.5">
                  Últimos Disparos de Transmissão
                </span>
                <div className="space-y-1.5">
                  {data.recent_broadcasts.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-card border border-border/40"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-foreground truncate">{b.title}</p>
                        <p className="text-[10px] text-muted-foreground">{b.sent_at}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                        <span className="text-emerald-600 font-semibold">
                          {b.read_rate}% leitura
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          ({b.clicks} cliques)
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
