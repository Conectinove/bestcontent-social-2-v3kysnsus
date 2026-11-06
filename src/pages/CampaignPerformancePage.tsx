import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, RefreshCw, Users, Eye, Heart, ChevronRight, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { getCampaignsPerformance, type CampaignPerformance } from '@/services/campaign-performance'

const statusBadge: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Rascunho', cls: 'bg-muted text-muted-foreground' },
  em_revisao: { label: 'Em revisão', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  approved: { label: 'Aprovado', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  scheduled: { label: 'Agendado', cls: 'bg-blue-500/15 text-blue-700 dark:text-blue-400' },
  published: { label: 'Publicado', cls: 'bg-purple-500/15 text-purple-700 dark:text-purple-400' },
}

function fmt(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return Number(n || 0).toLocaleString('pt-BR')
}

export default function CampaignPerformancePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<CampaignPerformance[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const list = await getCampaignsPerformance(user?.id)
    setData(list)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const totals = data.reduce(
    (acc, c) => ({
      reach: acc.reach + c.totals.reach,
      impressions: acc.impressions + c.totals.impressions,
      engagement: acc.engagement + c.totals.engagement,
      posts: acc.posts + c.totals.posts,
    }),
    { reach: 0, impressions: 0, engagement: 0, posts: 0 },
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black tracking-widest uppercase bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white px-2.5 py-1 rounded-md shadow-xs">
              PERF
            </span>
            <h1 className="font-black text-xl sm:text-2xl tracking-tight uppercase font-[Archivo_Black]">
              Performance de Campanhas
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Posts vinculados, alcance, impressões, engajamento e status de aprovação por campanha.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          className="shrink-0 rounded-xl font-semibold self-start"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" /> Atualizar
        </Button>
      </div>

      {/* KPIs agregados */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Posts vinculados',
              value: fmt(totals.posts),
              icon: FileText,
              cls: 'text-primary',
            },
            {
              label: 'Alcance total',
              value: fmt(totals.reach),
              icon: Users,
              cls: 'text-purple-600',
            },
            {
              label: 'Impressões',
              value: fmt(totals.impressions),
              icon: Eye,
              cls: 'text-blue-600',
            },
            {
              label: 'Engajamento',
              value: fmt(totals.engagement),
              icon: Heart,
              cls: 'text-pink-600',
            },
          ].map((k) => (
            <Card key={k.label} className="shadow-xs rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <k.icon className={`w-3.5 h-3.5 ${k.cls}`} />
                  {k.label}
                </div>
                <p className="text-xl sm:text-2xl font-black tracking-tight mt-1">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lista de campanhas */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : data.length === 0 ? (
        <Card className="shadow-xs rounded-2xl border-dashed">
          <CardContent className="py-14 text-center space-y-3">
            <Megaphone className="w-10 h-10 mx-auto text-muted-foreground/50" />
            <p className="font-bold text-foreground">Nenhuma campanha ainda</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Crie uma campanha no Dashboard de Campanhas e vincule posts a ela para acompanhar
              alcance, impressões, engajamento e progresso de aprovação aqui.
            </p>
            <Button
              size="sm"
              onClick={() => navigate('/app/campaigns-dashboard')}
              className="rounded-xl font-bold"
            >
              Ir para Campanhas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((camp) => (
            <Card key={camp.id} className="shadow-xs rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <CardTitle className="text-base sm:text-lg font-black tracking-tight truncate">
                      {camp.name}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {camp.objective || 'Campanha de conteúdo'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {camp.estimates && (
                      <Badge variant="outline" className="text-[10px]">
                        Estimativa Calibrada
                      </Badge>
                    )}
                    <Badge className="text-[10px] bg-primary/15 text-primary hover:bg-primary/20">
                      {camp.progressPct}% aprovado
                    </Badge>
                  </div>
                </div>
                {/* Progresso de aprovação */}
                <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-500"
                    style={{ width: `${Math.min(100, Math.max(3, camp.progressPct))}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-muted/50 border border-border/60">
                    <p className="text-[10px] font-semibold text-muted-foreground">Posts</p>
                    <p className="text-sm font-black">{camp.totals.posts}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/50 border border-border/60">
                    <p className="text-[10px] font-semibold text-muted-foreground">Alcance</p>
                    <p className="text-sm font-black">{fmt(camp.totals.reach)}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/50 border border-border/60">
                    <p className="text-[10px] font-semibold text-muted-foreground">Impressões</p>
                    <p className="text-sm font-black">{fmt(camp.totals.impressions)}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/50 border border-border/60">
                    <p className="text-[10px] font-semibold text-muted-foreground">Engajamento</p>
                    <p className="text-sm font-black">{fmt(camp.totals.engagement)}</p>
                  </div>
                </div>

                {/* Contagem por status de aprovação */}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">
                    {camp.totals.drafts} rascunho
                  </Badge>
                  <Badge className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25">
                    {camp.totals.inReview} em revisão
                  </Badge>
                  <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25">
                    {camp.totals.approved} aprovado
                  </Badge>
                  <Badge className="text-[10px] bg-purple-500/15 text-purple-700 dark:text-purple-400 hover:bg-purple-500/25">
                    {camp.totals.published} publicado
                  </Badge>
                </div>

                {/* Posts da campanha, clicáveis rumo ao detalhe */}
                {camp.posts.length > 0 && (
                  <div className="divide-y divide-border/70 rounded-xl border border-border/60 overflow-hidden">
                    {camp.posts.slice(0, 8).map((p) => {
                      const st = statusBadge[p.status] || statusBadge.draft
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => navigate(`/app/editor/${p.id}`)}
                          className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-[10px] font-bold uppercase text-muted-foreground w-20 shrink-0 truncate">
                            {p.platform || 'Post'}
                          </span>
                          <span className="text-xs truncate flex-1 min-w-0">
                            {p.caption || p.content || 'Post sem legenda'}
                          </span>
                          <Badge className={`text-[9px] shrink-0 ${st.cls} hover:${st.cls}`}>
                            {st.label}
                          </Badge>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        </button>
                      )
                    })}
                    {camp.posts.length > 8 && (
                      <p className="px-3 py-1.5 text-[10px] text-muted-foreground">
                        + {camp.posts.length - 8} posts nesta campanha
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
