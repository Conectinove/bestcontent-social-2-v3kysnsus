import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Megaphone,
  Plus,
  DollarSign,
  TrendingUp,
  Users,
  MousePointer,
  AlertCircle,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  Target,
  RefreshCw,
  Eye,
} from 'lucide-react'
import {
  getAdCampaigns,
  updateAdCampaign,
  deleteAdCampaign,
  getAllAdsMetrics,
  seedMetricsIfMissing,
  getAdsPlatformsStatus,
  getPlatformOfficialMetrics,
  type AdCampaignRecord,
  type AdDailyMetric,
  type PlatformsStatusResponse,
  type PlatformOfficialMetricsResult,
} from '@/services/ads'
import { CreateAdModal } from '@/components/ads/CreateAdModal'
import { useSocial } from '@/context/SocialContext'
import { toast } from '@/hooks/use-toast'

export function AdsPage() {
  const { brands } = useSocial()
  const [campaigns, setCampaigns] = useState<AdCampaignRecord[]>([])
  const [metricsMap, setMetricsMap] = useState<Record<string, AdDailyMetric[]>>({})
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [platformsStatus, setPlatformsStatus] = useState<PlatformsStatusResponse | null>(null)
  const [officialMetrics, setOfficialMetrics] = useState<
    Record<string, PlatformOfficialMetricsResult | null>
  >({
    meta: null,
    google: null,
    tiktok: null,
  })

  const loadData = async () => {
    setLoading(true)
    const [camps, allMetrics, platStatus] = await Promise.all([
      getAdCampaigns(),
      getAllAdsMetrics(),
      getAdsPlatformsStatus(),
    ])
    setPlatformsStatus(platStatus)

    // Se alguma plataforma estiver conectada, buscar métricas oficiais
    if (platStatus?.platforms?.meta?.configured) {
      getPlatformOfficialMetrics('meta').then((m) =>
        setOfficialMetrics((prev) => ({ ...prev, meta: m })),
      )
    }
    if (platStatus?.platforms?.google?.configured) {
      getPlatformOfficialMetrics('google').then((m) =>
        setOfficialMetrics((prev) => ({ ...prev, google: m })),
      )
    }
    if (platStatus?.platforms?.tiktok?.configured) {
      getPlatformOfficialMetrics('tiktok').then((m) =>
        setOfficialMetrics((prev) => ({ ...prev, tiktok: m })),
      )
    }

    // Mapear métricas por campanha
    const byCamp: Record<string, AdDailyMetric[]> = {}
    allMetrics.forEach((m) => {
      const cId = m.campaign
      if (!byCamp[cId]) byCamp[cId] = []
      byCamp[cId].push(m)
    })

    // Se alguma campanha não tiver métricas no banco, gerar/semear baseline
    for (const c of camps) {
      if (!byCamp[c.id] || byCamp[c.id].length === 0) {
        try {
          const seeded = await seedMetricsIfMissing(c)
          byCamp[c.id] = seeded
        } catch {
          /* intentionally ignored */
        }
      }
    }

    setCampaigns(camps)
    setMetricsMap(byCamp)
    if (camps.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(camps[0].id)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const selectedCampaign = useMemo(() => {
    return campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0] || null
  }, [campaigns, selectedCampaignId])

  const selectedMetrics = useMemo(() => {
    if (!selectedCampaign) return []
    return (metricsMap[selectedCampaign.id] || []).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
  }, [metricsMap, selectedCampaign])

  // Consolidação de métricas da campanha selecionada
  const campAggregates = useMemo(() => {
    if (!selectedCampaign || selectedMetrics.length === 0) {
      return {
        totalSpent: 0,
        totalImpressions: 0,
        totalReach: 0,
        totalClicks: 0,
        totalConversions: 0,
        avgCtr: 0,
        avgCpc: 0,
        budgetPercent: 0,
      }
    }

    const totalSpent = selectedMetrics.reduce((acc, m) => acc + (m.spent || 0), 0)
    const totalImpressions = selectedMetrics.reduce((acc, m) => acc + (m.impressions || 0), 0)
    const totalReach = selectedMetrics.reduce((acc, m) => acc + (m.reach || 0), 0)
    const totalClicks = selectedMetrics.reduce((acc, m) => acc + (m.clicks || 0), 0)
    const totalConversions = selectedMetrics.reduce((acc, m) => acc + (m.conversions || 0), 0)

    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const avgCpc = totalClicks > 0 ? totalSpent / totalClicks : 0
    const budgetLimit = selectedCampaign.total_budget || selectedCampaign.daily_budget * 7
    const budgetPercent = budgetLimit > 0 ? Math.min(100, (totalSpent / budgetLimit) * 100) : 0

    return {
      totalSpent,
      totalImpressions,
      totalReach,
      totalClicks,
      totalConversions,
      avgCtr,
      avgCpc,
      budgetPercent,
    }
  }, [selectedCampaign, selectedMetrics])

  // Métricas Consolidadas Globais
  const globalTotalBudget = campaigns.reduce(
    (acc, c) => acc + (c.total_budget || c.daily_budget * 7),
    0,
  )
  const globalTotalSpent = Object.values(metricsMap)
    .flat()
    .reduce((acc, m) => acc + (m.spent || 0), 0)
  const globalTotalReach = Object.values(metricsMap)
    .flat()
    .reduce((acc, m) => acc + (m.reach || 0), 0)
  const globalTotalClicks = Object.values(metricsMap)
    .flat()
    .reduce((acc, m) => acc + (m.clicks || 0), 0)
  const activeCount = campaigns.filter((c) => c.status === 'ativa').length

  const handleToggleStatus = async (campaign: AdCampaignRecord) => {
    const nextStatus = campaign.status === 'ativa' ? 'pausada' : 'ativa'
    try {
      await updateAdCampaign(campaign.id, { status: nextStatus })
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? { ...c, status: nextStatus } : c)),
      )
      toast({
        title: `Campanha ${nextStatus === 'ativa' ? 'ativada' : 'pausada'}!`,
        description:
          nextStatus === 'ativa'
            ? 'Métricas estimadas voltaram a evoluir em ritmo normal.'
            : 'Campanha em pausa. Consumo de orçamento e projeções congelados.',
      })
    } catch {
      toast({ title: 'Erro ao alterar status', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha de anúncio?')) return
    try {
      await deleteAdCampaign(id)
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
      if (selectedCampaignId === id) {
        setSelectedCampaignId(null)
      }
      toast({ title: 'Campanha removida!' })
    } catch {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Megaphone className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-foreground">Gestor de Anúncios</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Planejamento estratégico de tráfego pago, criativos com IA e acompanhamento analítico
            com métricas calibradas por dia
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="h-10 text-xs rounded-2xl gap-1.5"
            title="Atualizar dados"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-2xl text-xs h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Campanha de Anúncio</span>
          </Button>
        </div>
      </div>

      {/* Indicadores de Conexão das Plataformas de Anúncios (Meta, Google, TikTok) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-foreground">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Status das Plataformas de Tráfego Pago</span>
          </span>
          <span className="text-[11px] text-muted-foreground">
            Ativação automática via Segredos Skip Cloud (sem quebrar a aplicação)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* META ADS CARD */}
          {(() => {
            const meta = platformsStatus?.platforms?.meta
            const isConn = meta?.configured
            return (
              <div
                className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  isConn
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-foreground'
                    : 'bg-muted/40 border-border/70 text-foreground'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs">Meta Ads</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold ${
                        isConn
                          ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
                          : 'border-purple-500/30 text-purple-600 bg-purple-500/5'
                      }`}
                    >
                      {isConn ? '● Conectado (API Oficial)' : 'Em configuração'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {isConn
                      ? `Graph API ativa · ${meta?.accountIdPrefix ? `Conta ${meta.accountIdPrefix}` : 'Conta Oficial'}`
                      : 'Exibindo estimativas baseline (Instagram & Facebook)'}
                  </p>
                  <span className="text-[9px] font-mono text-muted-foreground block">
                    Segredos: META_ADS_ACCESS_TOKEN
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-[9px] font-bold shrink-0 uppercase ${
                    isConn ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isConn ? 'Oficial' : 'Estimativa'}
                </Badge>
              </div>
            )
          })()}

          {/* GOOGLE ADS CARD */}
          {(() => {
            const google = platformsStatus?.platforms?.google
            const isConn = google?.configured
            return (
              <div
                className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  isConn
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-foreground'
                    : 'bg-muted/40 border-border/70 text-foreground'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs">Google Ads</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold ${
                        isConn
                          ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
                          : 'border-purple-500/30 text-purple-600 bg-purple-500/5'
                      }`}
                    >
                      {isConn ? '● Conectado (API Oficial)' : 'Em configuração'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {isConn
                      ? `Google Ads API ativa · ${google?.customerIdPrefix ? `Cliente ${google.customerIdPrefix}` : 'Conta Oficial'}`
                      : 'Exibindo estimativas baseline (Google Search & Display)'}
                  </p>
                  <span className="text-[9px] font-mono text-muted-foreground block">
                    Segredos: GOOGLE_ADS_DEVELOPER_TOKEN
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-[9px] font-bold shrink-0 uppercase ${
                    isConn ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isConn ? 'Oficial' : 'Estimativa'}
                </Badge>
              </div>
            )
          })()}

          {/* TIKTOK ADS CARD */}
          {(() => {
            const tiktok = platformsStatus?.platforms?.tiktok
            const isConn = tiktok?.configured
            return (
              <div
                className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  isConn
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-foreground'
                    : 'bg-muted/40 border-border/70 text-foreground'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs">TikTok Ads</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold ${
                        isConn
                          ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
                          : 'border-purple-500/30 text-purple-600 bg-purple-500/5'
                      }`}
                    >
                      {isConn ? '● Conectado (API Oficial)' : 'Em configuração'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {isConn
                      ? `TikTok Marketing API ativa · ${tiktok?.advertiserIdPrefix ? `Adv ${tiktok.advertiserIdPrefix}` : 'Conta Oficial'}`
                      : 'Exibindo estimativas baseline (TikTok Feed & Spark)'}
                  </p>
                  <span className="text-[9px] font-mono text-muted-foreground block">
                    Segredos: TIKTOK_ADS_ACCESS_TOKEN
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-[9px] font-bold shrink-0 uppercase ${
                    isConn ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isConn ? 'Oficial' : 'Estimativa'}
                </Badge>
              </div>
            )
          })()}

          {/* YOUTUBE ANALYTICS CARD */}
          {(() => {
            const youtube = platformsStatus?.platforms?.youtube
            const isConn = youtube?.configured
            return (
              <div
                className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  isConn
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-foreground'
                    : 'bg-muted/40 border-border/70 text-foreground'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs">YouTube Analytics</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold ${
                        isConn
                          ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
                          : 'border-purple-500/30 text-purple-600 bg-purple-500/5'
                      }`}
                    >
                      {isConn ? '● Conectado (API Oficial)' : 'Em configuração'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {isConn
                      ? `YouTube Analytics API ativa · ${youtube?.channelIdPrefix ? `Canal ${youtube.channelIdPrefix}` : 'Canal Oficial'}`
                      : 'Exibindo estimativas baseline (YouTube Videos & Shorts)'}
                  </p>
                  <span className="text-[9px] font-mono text-muted-foreground block">
                    Segredos: YOUTUBE_ACCESS_TOKEN
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-[9px] font-bold shrink-0 uppercase ${
                    isConn ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isConn ? 'Oficial' : 'Estimativa'}
                </Badge>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Aviso de Transparência da Plataforma (Estimativas vs APIs Oficiais) */}
      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-foreground flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-purple-700 dark:text-purple-300">
            Métricas Estimadas & Baseline Calibrado (Mercado Brasil) vs Dados Oficiais
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Os dados de performance diária (impressões, alcance, cliques, CTR, CPC e gasto) são{' '}
            <strong>estimativas baseline inteligentes</strong> calibradas com base nos benchmarks do
            mercado brasileiro para o seu nicho e rede. Quando você adiciona suas chaves oficiais de
            API (Meta Ads, Google Ads ou TikTok Ads) nos{' '}
            <strong>Segredos do Painel Skip Cloud</strong>, o sistema substitui as estimativas por{' '}
            <strong>dados oficiais sincronizados em tempo de execução</strong> automaticamente sem
            necessidade de rebuild.
          </p>
        </div>
      </div>

      {/* Grid de KPIs Consolidados Globais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 rounded-2xl border-border bg-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">
              Campanhas Ativas
            </span>
            <Megaphone className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-foreground">{activeCount}</p>
          <span className="text-[10px] text-muted-foreground block">
            {campaigns.length} total &middot;{' '}
            {campaigns.filter((c) => c.status === 'pausada').length} pausadas
          </span>
        </Card>

        <Card className="p-4 rounded-2xl border-border bg-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">
              Gasto Acumulado / Orçamento
            </span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-foreground">
            R${' '}
            {globalTotalSpent.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <span className="text-[10px] text-muted-foreground block truncate">
            de R${' '}
            {globalTotalBudget.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            planejados
          </span>
        </Card>

        <Card className="p-4 rounded-2xl border-border bg-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">
              Alcance Total Estimado
            </span>
            <Users className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {globalTotalReach.toLocaleString('pt-BR')}
          </p>
          <span className="text-[10px] text-muted-foreground block">Pessoas impactadas</span>
        </Card>

        <Card className="p-4 rounded-2xl border-border bg-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">
              Cliques Acumulados
            </span>
            <MousePointer className="w-3.5 h-3.5 text-pink-600" />
          </div>
          <p className="text-2xl font-black text-foreground">
            {globalTotalClicks.toLocaleString('pt-BR')}
          </p>
          <span className="text-[10px] text-muted-foreground block">Tráfego direcionado</span>
        </Card>
      </div>

      {/* PAINEL DE DETALHES & EVOLUÇÃO DIÁRIA DA CAMPANHA SELECIONADA */}
      {selectedCampaign && (
        <Card className="p-6 rounded-3xl border-purple-500/30 bg-card space-y-6 shadow-md">
          {/* Cabeçalho do Detalhe da Campanha */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/80">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-xs font-bold uppercase border-purple-500/40 text-purple-600 dark:text-purple-300"
                >
                  {selectedCampaign.network}
                </Badge>
                <Badge
                  className={`text-xs font-bold border-0 ${
                    selectedCampaign.status === 'ativa'
                      ? 'bg-emerald-600 text-white'
                      : selectedCampaign.status === 'pausada'
                        ? 'bg-amber-500 text-white'
                        : 'bg-muted-foreground text-card'
                  }`}
                >
                  {selectedCampaign.status}
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-xs font-semibold capitalize bg-purple-500/10 text-purple-700 dark:text-purple-300"
                >
                  Objetivo: {selectedCampaign.objective}
                </Badge>

                {/* Badge Oficial vs Estimativa */}
                {(() => {
                  const net = selectedCampaign.network
                  const isMeta = net === 'instagram' || net === 'facebook'
                  const isYouTube = net === 'youtube'
                  const isTikTok = net === 'tiktok'
                  const isOfficial =
                    (isMeta && platformsStatus?.platforms?.meta?.configured) ||
                    (isYouTube &&
                      (platformsStatus?.platforms?.youtube?.configured ||
                        platformsStatus?.platforms?.google?.configured)) ||
                    (isTikTok && platformsStatus?.platforms?.tiktok?.configured)

                  return (
                    <Badge
                      className={`text-[10px] font-bold border-0 ${
                        isOfficial
                          ? 'bg-emerald-600/90 text-white'
                          : 'bg-purple-600/10 text-purple-700 dark:text-purple-300'
                      }`}
                    >
                      {isOfficial ? '✓ Dados Oficiais' : '~ Estimativa Calibrada'}
                    </Badge>
                  )
                })()}
              </div>

              <h2 className="text-xl font-black text-foreground">{selectedCampaign.name}</h2>
              <p className="text-xs text-muted-foreground">
                Orçamento: R$ {selectedCampaign.daily_budget}/dia &middot; Total planejado: R${' '}
                {(
                  selectedCampaign.total_budget || selectedCampaign.daily_budget * 7
                ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(selectedCampaign)}
                className="rounded-xl text-xs font-bold gap-1.5 h-9"
              >
                {selectedCampaign.status === 'ativa' ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pausar Campanha</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Ativar Campanha</span>
                  </>
                )}
              </Button>

              {selectedCampaign.destination_url && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold gap-1.5 h-9"
                >
                  <a
                    href={selectedCampaign.destination_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Destino</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Comparativo Projetado vs Estimado & Progresso do Orçamento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Consumo do Orçamento */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Consumo do Orçamento
                </span>
                <span className="text-foreground">{campAggregates.budgetPercent.toFixed(1)}%</span>
              </div>
              <Progress value={campAggregates.budgetPercent} className="h-2 rounded-full" />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  Gasto: R${' '}
                  {campAggregates.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span>
                  Limite: R${' '}
                  {(
                    selectedCampaign.total_budget || selectedCampaign.daily_budget * 7
                  ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Projetado vs Real: Alcance */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1">
                <Users className="w-3 h-3 text-purple-600" /> Alcance (Projetado vs Estimado)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-foreground">
                  {campAggregates.totalReach.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs text-muted-foreground">
                  / ~{(selectedCampaign.projections?.reach || 0).toLocaleString('pt-BR')} projetado
                </span>
              </div>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold block">
                {selectedCampaign.projections?.reach
                  ? `${(
                      (campAggregates.totalReach / selectedCampaign.projections.reach) *
                      100
                    ).toFixed(0)}% da meta de alcance atingida`
                  : 'Em evolução'}
              </span>
            </div>

            {/* Projetado vs Real: Cliques & CTR */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1">
                <MousePointer className="w-3 h-3 text-pink-600" /> Cliques & CTR Médio
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-foreground">
                  {campAggregates.totalClicks.toLocaleString('pt-BR')} cliques
                </span>
                <span className="text-xs text-muted-foreground">
                  (CTR {campAggregates.avgCtr.toFixed(2)}%)
                </span>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                CPC médio: R$ {campAggregates.avgCpc.toFixed(2)} &middot;{' '}
                {campAggregates.totalConversions} conversões
              </span>
            </div>
          </div>

          {/* Gráfico Visual de Evolução Diária (Barras CSS estilizadas) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span>Evolução Diária de Performance no Período</span>
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] border-purple-500/30 text-purple-600 font-semibold"
              >
                Últimos {selectedMetrics.length} dias
              </Badge>
            </div>

            {selectedMetrics.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Nenhuma métrica diária registrada para esta campanha.
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/70 space-y-4">
                {/* Barras de Alcance & Cliques por dia */}
                <div className="grid grid-cols-7 gap-2 items-end min-h-[140px] pt-4">
                  {selectedMetrics.map((m) => {
                    const maxReach = Math.max(...selectedMetrics.map((x) => x.reach || 1), 1)
                    const heightPercent = Math.max(15, Math.round((m.reach / maxReach) * 100))
                    const dateFormatted = new Date(m.date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                    })

                    return (
                      <div
                        key={m.id}
                        className="flex flex-col items-center gap-1.5 h-full justify-end group"
                      >
                        {/* Tooltip de hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] p-1.5 rounded-lg border border-border shadow-md whitespace-nowrap pointer-events-none mb-1">
                          <p className="font-bold">{dateFormatted}</p>
                          <p>Alcance: {m.reach.toLocaleString('pt-BR')}</p>
                          <p>Cliques: {m.clicks}</p>
                          <p>Gasto: R$ {m.spent.toFixed(2)}</p>
                        </div>

                        {/* Barra */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[42px] rounded-t-xl bg-gradient-to-t from-purple-700 to-purple-500 group-hover:from-purple-600 group-hover:to-pink-500 transition-all shadow-xs relative"
                        >
                          <div className="absolute top-1 left-0 right-0 text-[9px] font-black text-white text-center">
                            {m.clicks}
                          </div>
                        </div>

                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {dateFormatted}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-600 inline-block" />
                    <span>Altura da barra = Alcance diário</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-purple-600 font-bold">Número topo</span>
                    <span>= Cliques no dia</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Lista de Todas as Campanhas */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">
            Todas as Campanhas ({campaigns.length})
          </h3>
          <span className="text-xs text-muted-foreground">
            Clique em uma campanha para visualizar os KPIs e o gráfico detalhado
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Carregando campanhas e métricas...
          </div>
        ) : campaigns.length === 0 ? (
          <Card className="p-10 text-center rounded-3xl border-dashed border-2 border-border/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 mx-auto flex items-center justify-center">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Nenhuma campanha criada</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Crie sua primeira campanha para projetar resultados e gerar criativos de alto
                impacto.
              </p>
            </div>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="rounded-xl text-xs h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              Criar Primeira Campanha
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((camp) => {
              const campMetrics = metricsMap[camp.id] || []
              const totalCampSpent = campMetrics.reduce((acc, m) => acc + (m.spent || 0), 0)
              const totalCampClicks = campMetrics.reduce((acc, m) => acc + (m.clicks || 0), 0)
              const isSelected = selectedCampaignId === camp.id

              return (
                <Card
                  key={camp.id}
                  onClick={() => setSelectedCampaignId(camp.id)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-4 shadow-xs flex flex-col justify-between ${
                    isSelected
                      ? 'border-purple-600 ring-2 ring-purple-600/30 bg-purple-50/10 dark:bg-purple-950/15'
                      : 'border-border bg-card hover:border-purple-400/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold uppercase border-purple-500/30 text-purple-600"
                          >
                            {camp.network}
                          </Badge>
                          <Badge
                            className={`text-[9px] font-bold border-0 ${
                              camp.status === 'ativa'
                                ? 'bg-emerald-600 text-white'
                                : camp.status === 'pausada'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-muted-foreground text-card'
                            }`}
                          >
                            {camp.status}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-black text-foreground mt-1 line-clamp-1">
                          {camp.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(camp)}
                          className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground"
                          title={camp.status === 'ativa' ? 'Pausar' : 'Ativar'}
                        >
                          {camp.status === 'ativa' ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(camp.id)}
                          className="w-7 h-7 rounded-lg text-muted-foreground hover:text-rose-600"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Copy Resumo */}
                    {camp.ad_copy && (
                      <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-1">
                        <p className="font-bold text-foreground text-[11px] line-clamp-1">
                          "{camp.ad_copy.headline}"
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {camp.ad_copy.primaryText}
                        </p>
                      </div>
                    )}

                    {/* Projeções & Métricas Reais */}
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs pt-1">
                      <div className="p-1.5 rounded-xl bg-card border border-border/60">
                        <span className="text-[9px] text-muted-foreground block">Orçamento</span>
                        <span className="font-bold text-foreground">R$ {camp.daily_budget}/d</span>
                      </div>

                      <div className="p-1.5 rounded-xl bg-card border border-border/60">
                        <span className="text-[9px] text-muted-foreground block">Gasto Est.</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          R$ {totalCampSpent.toFixed(0)}
                        </span>
                      </div>

                      <div className="p-1.5 rounded-xl bg-card border border-border/60">
                        <span className="text-[9px] text-muted-foreground block">Cliques Est.</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {totalCampClicks || camp.projections?.clicks || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
                    <span className="text-purple-600 font-bold flex items-center gap-1">
                      <span>Ver métricas</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                    {camp.destination_url && (
                      <a
                        href={camp.destination_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                      >
                        <span>Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      <CreateAdModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        brands={brands}
        onSuccess={async (newCamp) => {
          // Semear métricas iniciais para a nova campanha
          const seeded = await seedMetricsIfMissing(newCamp)
          setCampaigns((prev) => [newCamp, ...prev])
          setMetricsMap((prev) => ({ ...prev, [newCamp.id]: seeded }))
          setSelectedCampaignId(newCamp.id)
        }}
      />
    </div>
  )
}
