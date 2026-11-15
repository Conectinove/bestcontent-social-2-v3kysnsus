import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  Heart,
  MessageCircle,
  MousePointerClick,
  Eye,
  Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { pb } from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

/**
 * Métricas de engajamento por post (aba Post do Labs).
 * Lê a coleção real `post_metrics` (curtidas=engajamento, comentários=cliques,
 * alcance=alcance). Estado vazio honesto quando não há dados — os números são
 * gravados pelo cron cron_process_scheduled_posts.js quando o post é publicado.
 */

export interface LabsPostMetricsRow {
  post: string
  rede: string
  alcance: number
  impressoes: number
  cliques: number
  salvamentos: number
  engajamento: number
  taxa_engajamento: number
}

export interface LabsPostForMetrics {
  id: string
  platform: string
  caption: string
  content?: string
  status: string
}

interface RawMetric {
  id: string
  post: string
  rede: string
  alcance: number
  impressoes: number
  cliques: number
  salvamentos: number
  engajamento: number
  taxa_engajamento: number
}

export function LabsPostMetrics({
  posts,
  reloadKey,
}: {
  posts: LabsPostForMetrics[]
  reloadKey?: number
}) {
  const [metrics, setMetrics] = useState<RawMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (posts.length === 0) {
        setMetrics([])
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const ids = posts.slice(0, 30).map((p) => p.id)
        const filters = ids.map((id) => `post = "${id}"`).join(' || ')
        const recs = await pb
          .collection('post_metrics')
          .getFullList({ filter: filters, sort: '-created' })
        if (!cancelled) setMetrics(recs.map(mapRaw))
      } catch {
        if (!cancelled) setError('Não foi possível carregar as métricas de engajamento.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [posts, reloadKey])

  const byPost = useMemo(() => {
    const map = new Map<string, RawMetric>()
    for (const m of metrics) if (!map.has(m.post)) map.set(m.post, m)
    return map
  }, [metrics])

  const totals = useMemo(() => {
    return metrics.reduce(
      (acc, m) => ({
        alcance: acc.alcance + (m.alcance || 0),
        impressoes: acc.impressoes + (m.impressoes || 0),
        cliques: acc.cliques + (m.cliques || 0),
        salvamentos: acc.salvamentos + (m.salvamentos || 0),
        engajamento: acc.engajamento + (m.engajamento || 0),
      }),
      { alcance: 0, impressoes: 0, cliques: 0, salvamentos: 0, engajamento: 0 },
    )
  }, [metrics])

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando métricas de engajamento…
      </Card>
    )
  }

  if (error) {
    return <Card className="p-4 text-xs text-destructive">{error}</Card>
  }

  const isEmpty = metrics.length === 0

  return (
    <div className="space-y-4">
      {/* Painel de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <MetricTile icon={Eye} label="Alcance" value={totals.alcance} />
        <MetricTile icon={Activity} label="Impressões" value={totals.impressoes} />
        <MetricTile icon={Heart} label="Curtidas/Reações" value={totals.engajamento} />
        <MetricTile icon={MessageCircle} label="Comentários/Cliques" value={totals.cliques} />
        <MetricTile icon={MousePointerClick} label="Salvamentos" value={totals.salvamentos} />
      </div>

      {isEmpty ? (
        <Card className="p-6 text-center space-y-1.5">
          <BarChart3 className="w-5 h-5 mx-auto text-muted-foreground/50" />
          <p className="text-xs font-semibold text-foreground">Sem métricas ainda</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            As métricas de engajamento são gravadas quando o post é publicado (pelo cron de
            agendamento ou manualmente). Publique um post para começar a coletar dados reais.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {posts.slice(0, 30).map((post) => {
            const m = byPost.get(post.id)
            const label = post.caption || post.content || post.id
            return (
              <Card key={post.id} className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground truncate flex-1">{label}</p>
                  <Badge variant="outline" className="text-[9px] uppercase font-bold shrink-0">
                    {post.platform || '—'}
                  </Badge>
                </div>
                {m ? (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      <span>
                        Alcance: <b className="text-foreground">{fmt(m.alcance)}</b>
                      </span>
                      <span>
                        Impressões: <b className="text-foreground">{fmt(m.impressoes)}</b>
                      </span>
                      <span>
                        Curtidas: <b className="text-foreground">{fmt(m.engajamento)}</b>
                      </span>
                      <span>
                        Comentários: <b className="text-foreground">{fmt(m.cliques)}</b>
                      </span>
                      <span>
                        Salvamentos: <b className="text-foreground">{fmt(m.salvamentos)}</b>
                      </span>
                      <span>
                        Taxa:{' '}
                        <b className="text-foreground">
                          {m.taxa_engajamento?.toFixed(1) ?? '0.0'}%
                        </b>
                      </span>
                    </div>
                    <Progress value={Math.min(100, m.taxa_engajamento * 10)} className="h-1.5" />
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">
                    Sem métricas para este post ainda.
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Heart
  label: string
  value: number
}) {
  return (
    <Card className={cn('p-3 space-y-1')}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="text-lg font-black text-foreground">{fmt(value)}</p>
    </Card>
  )
}

function fmt(n: number | undefined): string {
  const v = n || 0
  return v >= 1000 ? `${(v / 1000).toFixed(1).replace('.0', '')}k` : String(v)
}

function mapRaw(rec: Record<string, unknown>): RawMetric {
  return {
    id: String(rec.id || ''),
    post: String(rec.post || ''),
    rede: String(rec.rede || ''),
    alcance: Number(rec.alcance || 0),
    impressoes: Number(rec.impressoes || 0),
    cliques: Number(rec.cliques || 0),
    salvamentos: Number(rec.salvamentos || 0),
    engajamento: Number(rec.engajamento || 0),
    taxa_engajamento: Number(rec.taxa_engajamento || 0),
  }
}
