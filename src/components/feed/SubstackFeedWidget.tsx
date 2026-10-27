import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Mail,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  MousePointerClick,
  BookOpen,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getSubstackOrganicMetrics, type SubstackOrganicData } from '@/services/substack-organic'

interface SubstackFeedWidgetProps {
  compact?: boolean
  className?: string
}

export function SubstackFeedWidget({ compact = false, className = '' }: SubstackFeedWidgetProps) {
  const [data, setData] = useState<SubstackOrganicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await getSubstackOrganicMetrics()
      setData(res)
    } catch (err) {
      console.warn('[SubstackFeedWidget] Erro ao carregar métricas:', err)
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

  const isOfficial = data.is_live
  const badgeLabel = isOfficial ? 'Dados Oficiais' : 'Estimativa Calibrada'

  return (
    <Card
      className={`rounded-2xl border border-border/75 bg-gradient-to-br from-card via-card to-orange-500/5 shadow-xs hover:shadow-sm transition-all overflow-hidden ${className}`}
    >
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#FF6719] p-[2px] shrink-0 shadow-xs flex items-center justify-center text-white">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {data.publication.name}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {data.publication.handle || 'Newsletter & Artigos'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant="outline"
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isOfficial
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
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
              title="Atualizar métricas Substack"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-primary' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
              <Users className="w-3 h-3 text-[#FF6719]" />
              <span>Assinantes</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {Number(data.metrics.total_subscribers || 0).toLocaleString('pt-BR')}
            </p>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              +{data.metrics.subscribers_growth_30d || 14.8}%
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
              <BookOpen className="w-3 h-3 text-purple-500" />
              <span>Abertura</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {data.metrics.average_open_rate}%
            </p>
            <span className="text-[10px] font-medium text-muted-foreground">taxa média</span>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
              <MousePointerClick className="w-3 h-3 text-blue-500" />
              <span>Cliques</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
              {data.metrics.average_click_rate}%
            </p>
            <span className="text-[10px] font-medium text-muted-foreground">CTR no e-mail</span>
          </div>
        </div>

        {/* Micro highlights: Paid subscribers, Total Reads */}
        {!compact && (
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-muted-foreground border-t border-border/50">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <strong className="text-foreground font-semibold">
                  {Number(data.metrics.paid_subscribers || 0).toLocaleString('pt-BR')}
                </strong>{' '}
                pagantes
              </span>
              <span className="inline-flex items-center gap-1">
                <strong className="text-foreground font-semibold">
                  {Number(data.metrics.total_reads_30d || 0).toLocaleString('pt-BR')}
                </strong>{' '}
                leituras 30d
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">Newsletter</span>
          </div>
        )}

        {/* Footer Link */}
        <div className="pt-1 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {isOfficial ? 'Sync com publicação ativa' : 'Métricas editoriais com benchmark'}
          </span>
          <Link
            to="/app/social-hub"
            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-0.5 group"
          >
            <span>Ver detalhes</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
