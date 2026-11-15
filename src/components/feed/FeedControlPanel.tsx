import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Compass,
  DownloadCloud,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Share2,
  FolderPlus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Flame,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Post } from '@/types'
import { computeFeedInsights, computeEngagement } from '@/lib/feed-metrics'
import { FeedTrendBadge } from '@/components/feed/FeedTrendBadge'
import type { CommunityTopic } from '@/types/community'

interface FeedTopicSummary {
  id: string
  title: string
  content?: string
  image_url?: string
  created?: string
  network?: string
  category?: string
  expand?: any
}

interface FeedControlPanelProps {
  topics: FeedTopicSummary[]
  libraryPosts: Post[]
  selectedCount: number
  onImportSelected: () => void
  onImportAllPending: () => void
  onClearSelection: () => void
  isImporting: boolean
}

export function FeedControlPanel({
  topics,
  libraryPosts,
  selectedCount,
  onImportSelected,
  onImportAllPending,
  onClearSelection,
  isImporting,
}: FeedControlPanelProps) {
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(true)
  const [periodFilter, setPeriodFilter] = useState<'7d' | '30d' | '90d' | 'all'>('7d')

  // Filtro de período (7/30/90 dias ou tudo) sobre os itens do feed
  const filteredTopics = useMemo(() => {
    if (periodFilter === 'all') return topics
    const days = periodFilter === '7d' ? 7 : periodFilter === '30d' ? 30 : 90
    const minTs = Date.now() - days * 24 * 60 * 60 * 1000
    return topics.filter((t) => {
      const ts = t.created ? new Date(t.created).getTime() : 0
      return ts === 0 || ts >= minTs
    })
  }, [topics, periodFilter])

  // Identifica quais itens do feed já estão importados na biblioteca
  const { importedCount, pendingCount, recentImports, networkDistribution } = useMemo(() => {
    // Mapeia os feed_item_id existentes na biblioteca
    const existingFeedItemIds = new Set<string>()
    const existingTitles = new Set<string>()

    libraryPosts.forEach((p) => {
      if ((p as any).feed_item_id) {
        existingFeedItemIds.add((p as any).feed_item_id)
      }
      if (p.caption) {
        existingTitles.add(p.caption.trim().toLowerCase().slice(0, 40))
      }
    })

    let imported = 0
    let pending = 0
    const netCounts: Record<string, number> = {
      Instagram: 0,
      LinkedIn: 0,
      TikTok: 0,
      'X/Twitter': 0,
      Outros: 0,
    }

    filteredTopics.forEach((t) => {
      const isAlreadyImported =
        existingFeedItemIds.has(t.id) ||
        existingTitles.has((t.title || '').trim().toLowerCase().slice(0, 40))

      if (isAlreadyImported) {
        imported++
      } else {
        pending++
      }

      // Distribuição por rede ou categoria
      const cat = (t.expand?.category?.name || t.category || '').toLowerCase()
      if (cat.includes('insta') || cat.includes('reels')) {
        netCounts.Instagram++
      } else if (cat.includes('linked') || cat.includes('b2b')) {
        netCounts.LinkedIn++
      } else if (cat.includes('tiktok') || cat.includes('video') || cat.includes('shorts')) {
        netCounts.TikTok++
      } else if (cat.includes('twitter') || cat.includes('x') || cat.includes('thread')) {
        netCounts['X/Twitter']++
      } else {
        netCounts.Outros++
      }
    })

    // Últimos itens da biblioteca importados do feed
    const recents = libraryPosts.filter((p) => !!(p as any).feed_item_id).slice(0, 3)

    return {
      importedCount: imported,
      pendingCount: pending,
      recentImports: recents,
      networkDistribution: netCounts,
    }
  }, [filteredTopics, libraryPosts])

  // Consolida engajamento, média do período e top itens da semana (dados já carregados no Feed)
  const feedInsights = useMemo(
    () => computeFeedInsights(filteredTopics as unknown as CommunityTopic[]),
    [filteredTopics],
  )

  const totalNetworkItems = useMemo(
    () => Object.values(networkDistribution).reduce((acc, n) => acc + n, 0) || 1,
    [networkDistribution],
  )

  const networkBarColors: Record<string, string> = {
    Instagram: 'bg-pink-500',
    LinkedIn: 'bg-sky-500',
    TikTok: 'bg-slate-900 dark:bg-slate-100',
    'X/Twitter': 'bg-slate-700 dark:bg-slate-300',
    Outros: 'bg-primary',
  }

  const weeklyTopItems = useMemo(() => {
    return feedInsights.weeklyTopIds
      .map((id) => filteredTopics.find((t) => t.id === id))
      .filter((t): t is FeedTopicSummary => Boolean(t))
  }, [feedInsights.weeklyTopIds, filteredTopics])

  const periodLabel =
    periodFilter === '7d'
      ? 'últimos 7 dias'
      : periodFilter === '30d'
        ? 'últimos 30 dias'
        : periodFilter === '90d'
          ? 'últimos 90 dias'
          : 'todo o histórico'

  return (
    <Card className="hi-card border-border/80 bg-gradient-to-br from-card via-card to-purple-500/5 overflow-hidden">
      <CardContent className="p-4 md:p-5 space-y-4">
        {/* Cabeçalho do Painel de Controle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="hi-kicker text-primary bg-primary/10 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Centro de Comando
              </span>
              <Badge
                variant="outline"
                className="text-[10px] bg-background/80 font-bold border-purple-500/30 text-purple-600 dark:text-purple-400"
              >
                <Compass className="w-2.5 h-2.5 mr-1" />
                Painel do Feed
              </Badge>
            </div>
            <h3 className="hi-title text-base md:text-lg font-black text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Painel de Controle do Feed & Curadoria
            </h3>
            <p className="text-xs text-muted-foreground">
              Monitore itens disponíveis, posts já incorporados à sua biblioteca e importe em 1
              clique.
            </p>
          </div>

          {/* Filtro de período das métricas do painel */}
          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className="text-muted-foreground font-semibold hidden sm:inline">Período:</span>
            <div className="inline-flex rounded-xl p-0.5 bg-muted/60 border border-border/60">
              {(['7d', '30d', '90d', 'all'] as const).map((per) => (
                <button
                  key={per}
                  onClick={() => setPeriodFilter(per)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    periodFilter === per
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {per === '7d'
                    ? '7 dias'
                    : per === '30d'
                      ? '30 dias'
                      : per === '90d'
                        ? '90 dias'
                        : 'Tudo'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/library')}
              className="text-xs h-8 gap-1.5 font-bold border-border/80 hover:border-primary"
            >
              <span>Ir para Biblioteca</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Conteúdo Expansível */}
        {isExpanded && (
          <div className="space-y-4 pt-1 animate-fade-in">
            {/* Contagens Resumidas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-card border border-border/70 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold">
                  <span>Itens no Feed</span>
                  <Compass className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="text-xl md:text-2xl font-black text-foreground">
                  {filteredTopics.length}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Descoberta ativa ({periodLabel})
                </p>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/70 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold">
                  <span>Na Biblioteca</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {importedCount}
                </div>
                <p className="text-[10px] text-muted-foreground">Deduplicados e salvos</p>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/70 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold">
                  <span>Pendentes de Curadoria</span>
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="text-xl md:text-2xl font-black text-amber-600 dark:text-amber-400">
                  {pendingCount}
                </div>
                <p className="text-[10px] text-muted-foreground">Prontos para importar</p>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/70 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold">
                  <span>Selecionados</span>
                  <FolderPlus className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400">
                  {selectedCount}
                </div>
                <p className="text-[10px] text-muted-foreground">Itens marcados no feed</p>
              </div>
            </div>

            {/* Ações Rápidas & Distribuição por Rede */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Barra de Ações Rápidas */}
              <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-2.5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Ações Rápidas de Curadoria
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Agilize o fluxo de trabalho enviando pautas e criativos diretamente para a
                    Biblioteca de Mídias.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={onImportSelected}
                    disabled={selectedCount === 0 || isImporting}
                    className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    Importar Selecionados ({selectedCount})
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onImportAllPending}
                    disabled={pendingCount === 0 || isImporting}
                    className="text-xs font-bold gap-1.5 border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-purple-600" />
                    Importar Todos Pendentes ({pendingCount})
                  </Button>

                  {selectedCount > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onClearSelection}
                      className="text-xs text-muted-foreground hover:text-foreground h-8"
                    >
                      Limpar Seleção
                    </Button>
                  )}
                </div>
              </div>

              {/* Distribuição por Rede Social & Atividade Recente */}
              <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-primary" />
                    Distribuição & Canais no Feed
                  </h4>
                  <span className="text-[10px] text-muted-foreground">
                    {filteredTopics.length} pautas ({periodLabel})
                  </span>
                </div>

                {/* Barras de progresso por rede social */}
                <div className="space-y-2">
                  {Object.entries(networkDistribution).map(([net, count]) => {
                    const pct = Math.round((count / totalNetworkItems) * 100)
                    return (
                      <div key={net} className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                          <span className="text-foreground">{net}</span>
                          <span>
                            {count} item{count === 1 ? '' : 's'} · {pct}%
                          </span>
                        </div>
                        <div
                          className="h-2 w-full rounded-full bg-muted overflow-hidden"
                          role="img"
                          aria-label={`${net}: ${count} de ${filteredTopics.length} itens (${pct}%)`}
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              networkBarColors[net] || 'bg-primary'
                            }`}
                            style={{ width: `${count > 0 ? Math.max(pct, 2) : 0}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Top Itens da Semana */}
                <div className="pt-1 border-t border-border/40 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Top Itens da Semana (7 dias):
                  </span>
                  {weeklyTopItems.length > 0 ? (
                    <div className="space-y-1">
                      {weeklyTopItems.map((item, idx) => {
                        const metric = feedInsights.metrics[item.id]
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 text-[11px] p-1.5 rounded-md bg-amber-500/5 border border-amber-500/20"
                          >
                            <span className="shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center text-[10px] font-black">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-foreground truncate flex-1">
                              {item.title || 'Sem título'}
                            </span>
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 shrink-0">
                              🔥 {Math.round(metric?.engagement || 0)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">
                      Nenhum item com engajamento nos últimos 7 dias.
                    </p>
                  )}
                </div>

                {/* Atividade Recente */}
                <div className="pt-1 border-t border-border/40 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Últimas Importações para a Biblioteca:
                  </span>
                  {recentImports.length > 0 ? (
                    <div className="space-y-1">
                      {recentImports.map((rec) => (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between text-[11px] p-1.5 rounded-md bg-muted/30"
                        >
                          <span className="font-semibold text-foreground truncate max-w-[220px]">
                            {rec.caption || 'Post importado'}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold shrink-0">
                            ✓ Salvo
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">
                      Nenhum post importado recentemente nesta sessão.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
