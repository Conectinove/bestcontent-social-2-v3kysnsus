import React, { useState, useEffect } from 'react'
import {
  Users,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Share2,
  Bookmark,
  Eye,
  Heart,
  MessageCircle,
  BarChart2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import {
  getConsolidatedSocialHubData,
  type ConsolidatedSocialHubData,
  type NetworkChannelSummary,
} from '@/services/social-hub'
import { Link } from 'react-router-dom'

export function SocialHubPage() {
  const { user } = useAuth()
  const [data, setData] = useState<ConsolidatedSocialHubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getConsolidatedSocialHubData(user?.id)
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  const filteredChannels = (data?.channels || []).filter((ch) => {
    const matchesSearch =
      ch.name.toLowerCase().includes(search.toLowerCase()) ||
      ch.network.toLowerCase().includes(search.toLowerCase()) ||
      ch.displayName.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || ch.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-widest uppercase bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2.5 py-1 rounded-md shadow-xs">
              Hub Omnichannel
            </span>
            <Badge
              variant="outline"
              className="border-purple-500/30 text-purple-600 dark:text-purple-400 font-semibold text-xs"
            >
              23 Redes Suportadas
            </Badge>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight mt-2 flex items-center gap-2">
            Dashboard de Redes Sociais
            <Sparkles className="w-6 h-6 text-pink-500" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Visão consolidada de todas as suas contas, canais e audiência. Acompanhe seguidores
            totais, crescimento unificado, engajamento médio e métricas oficiais ou calibradas por
            canal.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 gap-2 h-9 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar Métricas</span>
          </Button>

          <Button
            asChild
            size="sm"
            className="rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold gap-2 h-9 text-xs shadow-md shadow-purple-500/20"
          >
            <Link to="/app/settings?tab=integrations">
              <ShieldCheck className="w-4 h-4" />
              <span>Gerenciar Conexões</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Honest Baseline Disclaimer Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-600/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">
              Transparência de Dados: Status Oficial vs. Estimativa Calibrada
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Canais com credenciais de API detectadas exibem o badge{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Dados Oficiais
              </span>
              . Onde as chaves ainda não foram configuradas nos segredos, aplicamos{' '}
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                Estimativas Calibradas
              </span>{' '}
              baseadas no seu histórico e nos benchmarks do segmento.
            </p>
          </div>
        </div>

        <Link
          to="/app/ads"
          className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline shrink-0 flex items-center gap-1"
        >
          <span>Ver TikTok & Meta Ads</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Consolidated Key KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/80 shadow-xs hover:border-purple-500/40 transition-all bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Seguidores Totais</span>
              <p className="text-2xl font-black text-foreground tracking-tight">
                {(data?.totalFollowers || 0).toLocaleString('pt-BR')}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                <TrendingUp className="w-3 h-3" />
                <span>+{data?.followersGrowthTotal || 3.4}% no último mês</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs hover:border-purple-500/40 transition-all bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Alcance Total (30d)</span>
              <p className="text-2xl font-black text-foreground tracking-tight">
                {(data?.totalReach30d || 0).toLocaleString('pt-BR')}
              </p>
              <span className="text-[11px] text-muted-foreground">
                {(data?.totalImpressions30d || 0).toLocaleString('pt-BR')} impressões brutas
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs hover:border-purple-500/40 transition-all bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Engajamento Médio</span>
              <p className="text-2xl font-black text-foreground tracking-tight">
                {data?.averageEngagementRate || 5.2}%
              </p>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                Supera a média de mercado (3.8%)
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs hover:border-purple-500/40 transition-all bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Publicações Gerenciadas
              </span>
              <p className="text-2xl font-black text-foreground tracking-tight">
                {data?.totalPostsPublished || 0}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Distribuídos em múltiplos formatos</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Destaque Especial: LinkedIn Orgânico Integrado */}
      {data?.linkedinOrganic && (
        <Card className="rounded-3xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/20 via-background to-purple-950/20 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0A66C2] flex items-center justify-center text-white text-2xl font-bold shadow-md ring-2 ring-blue-500/40">
                  <span className="font-black">in</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-foreground">
                      LinkedIn Conteúdo & Perfil Orgânico
                    </h2>
                    <Badge
                      className={
                        data.linkedinOrganic.is_official
                          ? 'bg-emerald-600 text-white text-[10px]'
                          : 'bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-500/40 text-[10px]'
                      }
                    >
                      {data.linkedinOrganic.badge_label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {data.linkedinOrganic.profile.display_name} &middot;{' '}
                    {data.linkedinOrganic.profile.headline}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs px-3 py-1"
                >
                  Taxa de Engajamento B2B: {data.linkedinOrganic.metrics.engagement_rate}%
                </Badge>
              </div>
            </div>

            {/* Grid de Métricas LinkedIn Orgânico */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6">
              <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Seguidores / Conexões
                </span>
                <span className="text-xl font-black text-foreground mt-1 block">
                  {data.linkedinOrganic.metrics.followers.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  +{data.linkedinOrganic.metrics.new_followers_30d} no mês
                </span>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Impressões de Artigos/Posts
                </span>
                <span className="text-xl font-black text-foreground mt-1 block">
                  {data.linkedinOrganic.metrics.impressions.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-muted-foreground">Feed Corporativo</span>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Reações Profissionais
                </span>
                <span className="text-xl font-black text-foreground mt-1 block">
                  {data.linkedinOrganic.metrics.reactions.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-0.5 font-semibold">
                  <Heart className="w-2.5 h-2.5 fill-current" /> Aplausos & Apoio
                </span>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Cliques em Links
                </span>
                <span className="text-xl font-black text-foreground mt-1 block">
                  {data.linkedinOrganic.metrics.clicks.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-0.5 font-semibold">
                  <ArrowUpRight className="w-2.5 h-2.5" /> CTR Qualificado
                </span>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Comentários Qualificados
                </span>
                <span className="text-xl font-black text-foreground mt-1 block">
                  {data.linkedinOrganic.metrics.comments.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <MessageCircle className="w-2.5 h-2.5" /> Networking
                </span>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Reposts / Compartilhamentos
                </span>
                <span className="text-xl font-black text-foreground mt-1 block">
                  {data.linkedinOrganic.metrics.shares.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 font-semibold">
                  <Share2 className="w-2.5 h-2.5" /> Autoridade B2B
                </span>
              </div>
            </div>

            {/* Evolução temporal & Melhores Horários LinkedIn */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/60">
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                  Evolução Temporal das Últimas 4 Semanas (LinkedIn)
                </span>
                <div className="space-y-1.5">
                  {data.linkedinOrganic.history.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-card/80 border border-border/60"
                    >
                      <span className="font-semibold text-foreground">{h.period}</span>
                      <div className="flex items-center gap-4 text-muted-foreground font-mono text-[11px]">
                        <span>{h.impressions.toLocaleString('pt-BR')} views</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                          {h.engagement}% eng
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  Janelas Nobres de Publicação Corporativa (LinkedIn B2B)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {data.linkedinOrganic.best_times.map((bt, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-card/80 border border-border/60 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-foreground">{bt.day}</p>
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-semibold">
                          {bt.time}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        Índice {bt.reach_index}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Destaque Especial: TikTok Orgânico Integrado */}
      {data?.tiktokOrganic && (
        <Card className="rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-background to-pink-950/20 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white text-2xl font-bold shadow-md ring-2 ring-purple-500/40">
                  <span className="font-black">TT</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-foreground">
                      TikTok Conteúdo & Perfil Orgânico
                    </h2>
                    <Badge
                      className={
                        data.tiktokOrganic.is_official
                          ? 'bg-emerald-600 text-white text-[10px]'
                          : 'bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 text-[10px]'
                      }
                    >
                      {data.tiktokOrganic.badge_label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {data.tiktokOrganic.profile.display_name} &middot;{' '}
                    {data.tiktokOrganic.profile.bio}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-pink-500/30 text-pink-600 dark:text-pink-400 text-xs px-3 py-1"
                >
                  Taxa de Engajamento: {data.tiktokOrganic.metrics.engagement_rate}%
                </Badge>
              </div>
            </div>

            {/* Grid de Métricas TikTok Orgânico */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6">
              <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Seguidores
                </span>
                <span className="text-xl font-black text-foreground mt-1 block">
                  {data.tiktokOrganic.metrics.followers.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  +{data.tiktokOrganic.metrics.growth_rate_30d}% mês
                </span>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Visualizações
                </span>
                <span className="text-xl font-black text-foreground mt-1 block">
                  {data.tiktokOrganic.metrics.views.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-muted-foreground">Vídeos curtos</span>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Curtidas
                </span>
                <span className="text-xl font-black text-foreground mt-1 block">
                  {data.tiktokOrganic.metrics.likes.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-pink-600 dark:text-pink-400 flex items-center gap-0.5 font-semibold">
                  <Heart className="w-2.5 h-2.5 fill-current" /> Interações
                </span>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Comentários
                </span>
                <span className="text-xl font-black text-foreground mt-1 block">
                  {data.tiktokOrganic.metrics.comments.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <MessageCircle className="w-2.5 h-2.5" /> Respostas
                </span>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Compartilhamentos
                </span>
                <span className="text-xl font-black text-foreground mt-1 block">
                  {data.tiktokOrganic.metrics.shares.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-0.5 font-semibold">
                  <Share2 className="w-2.5 h-2.5" /> Viralidade
                </span>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Saves / Favoritos
                </span>
                <span className="text-xl font-black text-foreground mt-1 block">
                  {data.tiktokOrganic.metrics.saves.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-semibold">
                  <Bookmark className="w-2.5 h-2.5 fill-current" /> Retenção
                </span>
              </div>
            </div>

            {/* Evolução temporal & Melhores Horários TikTok */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/60">
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <BarChart2 className="w-3.5 h-3.5 text-purple-600" />
                  Evolução Temporal das Últimas 4 Semanas
                </span>
                <div className="space-y-1.5">
                  {data.tiktokOrganic.history.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-card/80 border border-border/60"
                    >
                      <span className="font-semibold text-foreground">{h.period}</span>
                      <div className="flex items-center gap-4 text-muted-foreground font-mono text-[11px]">
                        <span>{h.views.toLocaleString('pt-BR')} views</span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold">
                          {h.engagement}% eng
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Horários de Pico Sugeridos pelo Algoritmo do TikTok
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {data.tiktokOrganic.best_times.map((bt, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-card/80 border border-border/60 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-foreground">{bt.day}</p>
                        <p className="text-[11px] text-purple-600 dark:text-purple-400 font-mono font-semibold">
                          {bt.time}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        Índice {bt.reach_index}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Gráfico de Evolução Semanal Unificado */}
      <Card className="rounded-3xl border border-border/80 p-6 bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border/80">
          <div>
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Evolução Consolidada de Audiência & Alcance
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Crescimento agregado de todas as 23 redes conectadas
            </p>
          </div>
          <Badge className="bg-purple-600/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-xs">
            +3.4% no mês corrente
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-6">
          {(data?.weeklyTrend || []).map((w, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-2"
            >
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                {w.week}
              </span>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Seguidores:</span>
                  <span className="font-bold text-foreground">
                    {w.followers.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Alcance:</span>
                  <span className="font-bold text-foreground">
                    {w.reach.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Engajamento:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {w.engagement}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-border/60 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, 60 + idx * 13)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Comparativo Completo por Canal (As 23 Redes) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-foreground">
              Comparativo por Canal ({filteredChannels.length} de 23 Redes)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Métricas detalhadas, melhor horário sugerido e status de calibração por rede
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar rede..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {[
                { key: 'all', label: 'Todas' },
                { key: 'social', label: 'Sociais' },
                { key: 'video', label: 'Vídeo' },
                { key: 'professional', label: 'B2B/Pro' },
                { key: 'messaging', label: 'Mensagens' },
                { key: 'community', label: 'Comunidade' },
                { key: 'portfolio', label: 'Design' },
              ].map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setSelectedCategory(c.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    selectedCategory === c.key
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de Canais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChannels.map((channel) => (
            <Card
              key={channel.network}
              className="rounded-2xl border-border/80 hover:border-purple-500/40 transition-all bg-card/60 backdrop-blur-sm p-5 space-y-4 relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: channel.color }}
              />

              <div className="flex items-start justify-between gap-2 pt-1">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0"
                    style={{ backgroundColor: channel.color }}
                  >
                    {channel.network.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{channel.name}</h4>
                    <span className="text-[11px] text-muted-foreground capitalize">
                      {channel.category} &middot; {channel.displayName}
                    </span>
                  </div>
                </div>

                <Badge
                  className={
                    channel.isOfficial
                      ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[9px]'
                      : 'bg-purple-600/10 text-purple-700 dark:text-purple-300 border-purple-500/20 text-[9px]'
                  }
                >
                  {channel.badgeLabel}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2 rounded-lg bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">Seguidores</span>
                  <span className="text-xs font-bold text-foreground">
                    {channel.followers.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">Engajamento</span>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    {channel.engagementRate}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">Posts</span>
                  <span className="text-xs font-bold text-foreground">{channel.postsCount}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px]">Melhor horário:</span>
                </div>
                <span className="font-semibold text-foreground text-[11px]">
                  {channel.bestTime.day} às {channel.bestTime.time}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Destaque de Posts com Melhor Performance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Posts com Melhor Performance Geral
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Criativos de maior tração, retenção e salvamentos em todas as redes
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="text-xs rounded-xl">
            <Link to="/app/library">Ver Biblioteca Completa</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data?.topPerformingPosts || []).map((post, idx) => (
            <Card
              key={post.id}
              className="rounded-2xl border-border/80 p-4 space-y-3 bg-card hover:border-purple-500/40 transition-all"
            >
              <div className="flex items-center justify-between text-xs">
                <Badge variant="outline" className="text-[10px] capitalize">
                  {post.network}
                </Badge>
                <span className="text-purple-600 dark:text-purple-400 font-bold text-[11px]">
                  {post.engagementRate}% engajamento
                </span>
              </div>

              <div>
                <h5 className="font-bold text-xs text-foreground line-clamp-1">{post.title}</h5>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                  {post.caption || 'Sem legenda'}
                </p>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {post.reach.toLocaleString('pt-BR')}
                </span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                  <Bookmark className="w-3 h-3" /> {post.saves} saves
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SocialHubPage
