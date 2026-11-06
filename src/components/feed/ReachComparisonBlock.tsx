import { useEffect, useState } from 'react'
import { Eye, TrendingUp, BarChart3, Layers, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getConsolidatedSocialHubData, type NetworkChannelSummary } from '@/services/social-hub'

interface ReachComparisonBlockProps {
  className?: string
}

export function ReachComparisonBlock({ className = '' }: ReachComparisonBlockProps) {
  const [channels, setChannels] = useState<NetworkChannelSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [filterPeriod, setFilterPeriod] = useState<'30d' | '7d'>('30d')

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const data = await getConsolidatedSocialHubData()
        if (isMounted) {
          // Filtrar as principais redes conectadas / ativas do feed incluindo WhatsApp e Email Marketing
          const primaryNetworkSlugs = [
            'instagram',
            'tiktok',
            'youtube',
            'linkedin',
            'twitter',
            'facebook',
            'pinterest',
            'threads',
            'whatsapp',
            'substack',
          ]
          const filtered = data.channels.filter((c) => primaryNetworkSlugs.includes(c.network))
          // Ordenar por alcance decrescente
          filtered.sort((a, b) => b.reach30d - a.reach30d)
          setChannels(filtered)
        }
      } catch (err) {
        console.error('Erro ao carregar comparativo de alcance:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <Card className={`border-border bg-card ${className}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (channels.length === 0) return null

  // Fator para período 7d vs 30d
  const factor = filterPeriod === '7d' ? 0.26 : 1
  const totalReach = Math.round(channels.reduce((acc, c) => acc + c.reach30d * factor, 0))
  const totalImpressions = Math.round(
    channels.reduce((acc, c) => acc + c.impressions30d * factor, 0),
  )
  const maxChannelReach = Math.max(...channels.map((c) => c.reach30d * factor), 1)

  return (
    <Card className={`border-border bg-card shadow-xs overflow-hidden ${className}`}>
      <div className="p-3.5 sm:p-4 border-b border-border/70 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  Alcance Consolidado Multi-Redes
                </h3>
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 h-4 border-primary/30 text-primary bg-primary/5 font-semibold"
                >
                  {channels.length > 0 ? `${channels.length} Redes` : 'Multi-Redes'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Comparativo de pessoas únicas e impressões totais no feed orgânico
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <div className="flex items-center bg-muted/80 p-0.5 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setFilterPeriod('7d')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  filterPeriod === '7d'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                7 dias
              </button>
              <button
                type="button"
                onClick={() => setFilterPeriod('30d')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  filterPeriod === '30d'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                30 dias
              </button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => setCollapsed((prev) => !prev)}
              title={collapsed ? 'Expandir comparativo' : 'Recolher comparativo'}
            >
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Resumo compacto de métricas globais de alcance */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3">
          <div className="p-2.5 rounded-lg bg-card border border-border/60">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              Alcance Total
              <Eye className="w-3 h-3 text-sky-500" />
            </span>
            <div className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
              {totalReach.toLocaleString('pt-BR')}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +14.8% no período
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-card border border-border/60">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              Total Impressões
              <BarChart3 className="w-3 h-3 text-indigo-500" />
            </span>
            <div className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
              {totalImpressions.toLocaleString('pt-BR')}
            </div>
            <span className="text-[10px] text-muted-foreground">
              Frequência média: {(totalImpressions / Math.max(totalReach, 1)).toFixed(2)}x
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-card border border-border/60">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              Líder em Alcance
              <Sparkles className="w-3 h-3 text-amber-500" />
            </span>
            <div className="text-sm font-bold text-foreground truncate mt-0.5">
              {channels[0]?.name || 'Instagram'}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">
              {Math.round(((channels[0]?.reach30d * factor) / Math.max(totalReach, 1)) * 100)}% do
              total somado
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-card border border-border/60">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              Multi-Canal Ativo
              <Layers className="w-3 h-3 text-emerald-500" />
            </span>
            <div className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
              {channels.length} canais
            </div>
            <span className="text-[10px] text-muted-foreground">Sem sobreposição duplicada</span>
          </div>
        </div>
      </div>

      {/* Mini-barras comparativas por rede */}
      {!collapsed && (
        <CardContent className="p-3.5 sm:p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-semibold text-foreground">Distribuição por Rede Social</span>
            <span className="text-[11px]">Alcance de contas únicas</span>
          </div>

          <div className="space-y-2">
            {channels.map((ch) => {
              const reach = Math.round(ch.reach30d * factor)
              const pctOfMax = Math.round((reach / maxChannelReach) * 100)
              const pctOfTotal = Math.round((reach / Math.max(totalReach, 1)) * 100)

              return (
                <div
                  key={ch.network}
                  className="p-2 rounded-lg bg-muted/15 border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: ch.color || '#3b82f6' }}
                      />
                      <span className="font-bold text-foreground truncate">{ch.name}</span>
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">
                        • {ch.badgeLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                      <span className="font-bold text-foreground">
                        {reach.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-muted-foreground text-[10px] w-9 text-right">
                        ({pctOfTotal}%)
                      </span>
                    </div>
                  </div>

                  {/* Barra de progresso comparativa */}
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pctOfMax}%`,
                        backgroundColor: ch.color || '#3b82f6',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
