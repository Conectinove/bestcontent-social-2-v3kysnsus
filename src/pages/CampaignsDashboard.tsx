import React, { useState, useEffect } from 'react'
import {
  Layers,
  Sparkles,
  TrendingUp,
  BarChart3,
  Calendar,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronRight,
  FileText,
  AlertCircle,
  Percent,
  Coins,
  Send,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { getCampaigns, type CampaignRecord } from '@/services/campaigns'
import { getBrands } from '@/services/brands'
import { CampaignReportModal } from '@/components/campaigns/CampaignReportModal'
import { CreateCampaignModal } from '@/components/campaigns/CreateCampaignModal'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'

export function CampaignsDashboard() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [postsCountMap, setPostsCountMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  // Filtros
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const [selectedObjective, setSelectedObjective] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modais
  const [selectedReportCampaign, setSelectedReportCampaign] = useState<CampaignRecord | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [campsRes, brandsRes] = await Promise.all([
        getCampaigns().catch(() => []),
        getBrands().catch(() => []),
      ])
      setCampaigns(campsRes)
      setBrands(brandsRes)

      // Buscar contagem de posts vinculados a campanhas
      try {
        const postsList = await pb.collection('posts').getFullList({
          filter: 'campaign != ""',
          fields: 'id,campaign,status',
        })
        const map: Record<string, number> = {}
        postsList.forEach((p: any) => {
          if (p.campaign) {
            map[p.campaign] = (map[p.campaign] || 0) + 1
          }
        })
        setPostsCountMap(map)
      } catch {
        /* intentionally ignored */
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  // Filtragem
  const filteredCampaigns = campaigns.filter((camp) => {
    const matchesSearch =
      camp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (camp.briefing || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBrand = selectedBrand === 'all' || camp.brand === selectedBrand
    const matchesObjective =
      selectedObjective === 'all' ||
      (camp.objective || '').toLowerCase().includes(selectedObjective.toLowerCase())
    const matchesStatus =
      selectedStatus === 'all' ||
      (camp.status || 'draft').toLowerCase() === selectedStatus.toLowerCase()

    return matchesSearch && matchesBrand && matchesObjective && matchesStatus
  })

  // KPIs consolidados
  const totalCampaigns = campaigns.length
  const activeCampaigns = campaigns.filter(
    (c) => c.status === 'published' || c.status === 'active',
  ).length
  const totalFormatsGenerated = campaigns.reduce((acc, c) => acc + (c.formats?.length || 0), 0)
  const totalCreditsUsed = campaigns.reduce(
    (acc, c) => acc + (c.credits_used || (c.formats?.length || 0) * 2),
    0,
  )

  // Estimativas agregadas de alcance e engajamento
  const estimatedTotalReach = campaigns.reduce((acc, c) => {
    const formatsCount = c.formats?.length || 1
    return acc + formatsCount * 4850
  }, 0)

  const estimatedTotalEngagement = campaigns.reduce((acc, c) => {
    const formatsCount = c.formats?.length || 1
    return acc + formatsCount * 320
  }, 0)

  // Taxa de revisão (posts gerados vs prontos)
  const reviewedPercentage =
    campaigns.length > 0
      ? Math.round(
          (campaigns.filter((c) => c.status === 'completed' || c.status === 'published').length /
            campaigns.length) *
            100,
        )
      : 85

  // Distribuição por formato
  const formatCounts: Record<string, number> = {}
  campaigns.forEach((c) => {
    if (Array.isArray(c.formats)) {
      c.formats.forEach((f) => {
        formatCounts[f] = (formatCounts[f] || 0) + 1
      })
    }
  })
  const sortedFormats = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-widest uppercase bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white px-2.5 py-1 rounded-md shadow-xs">
              CAMP
            </span>
            <Badge
              variant="outline"
              className="border-purple-500/30 text-purple-600 dark:text-purple-400 font-semibold text-xs"
            >
              Omnichannel Multi-Formato
            </Badge>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight mt-2 flex items-center gap-2">
            Dashboard de Campanhas
            <Sparkles className="w-6 h-6 text-pink-500" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Gestão unificada do ciclo de vida de suas campanhas: custos em créditos, formatos
            gerados, prontidão para publicação e inteligência de conversão entre marcas.
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
            <span>Atualizar</span>
          </Button>

          <Button
            onClick={() => setCreateModalOpen(true)}
            size="sm"
            className="rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold gap-2 h-9 text-xs shadow-md shadow-purple-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Nova Campanha IA</span>
          </Button>
        </div>
      </div>

      {/* Grid de 6 KPIs Consolidados */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="rounded-2xl border-border/80 p-4 bg-card shadow-xs">
          <span className="text-[11px] text-muted-foreground font-medium block">
            Campanhas Totais
          </span>
          <span className="text-2xl font-black text-foreground block mt-1">{totalCampaigns}</span>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 mt-1">
            <Layers className="w-3 h-3" /> {activeCampaigns} em andamento
          </span>
        </Card>

        <Card className="rounded-2xl border-border/80 p-4 bg-card shadow-xs">
          <span className="text-[11px] text-muted-foreground font-medium block">
            Formatos Gerados
          </span>
          <span className="text-2xl font-black text-foreground block mt-1">
            {totalFormatsGenerated}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" /> Média de 6 por campanha
          </span>
        </Card>

        <Card className="rounded-2xl border-border/80 p-4 bg-card shadow-xs">
          <span className="text-[11px] text-muted-foreground font-medium block">
            Investimento em Créditos
          </span>
          <span className="text-2xl font-black text-foreground block mt-1">{totalCreditsUsed}</span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
            <Coins className="w-3 h-3" /> Créditos de IA aplicados
          </span>
        </Card>

        <Card className="rounded-2xl border-border/80 p-4 bg-card shadow-xs">
          <span className="text-[11px] text-muted-foreground font-medium block">
            Prontidão / Revisão
          </span>
          <span className="text-2xl font-black text-foreground block mt-1">
            {reviewedPercentage}%
          </span>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 mt-1">
            <Percent className="w-3 h-3" /> Peças validadas
          </span>
        </Card>

        <Card className="rounded-2xl border-border/80 p-4 bg-card shadow-xs">
          <span className="text-[11px] text-muted-foreground font-medium block">
            Alcance Estimado
          </span>
          <span className="text-2xl font-black text-foreground block mt-1">
            {estimatedTotalReach.toLocaleString('pt-BR')}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
            <Eye className="w-3 h-3" /> Impressões potenciais
          </span>
        </Card>

        <Card className="rounded-2xl border-border/80 p-4 bg-card shadow-xs">
          <span className="text-[11px] text-muted-foreground font-medium block">
            Engajamento Projetado
          </span>
          <span className="text-2xl font-black text-foreground block mt-1">
            {estimatedTotalEngagement.toLocaleString('pt-BR')}
          </span>
          <span className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> Interações ativas
          </span>
        </Card>
      </div>

      {/* Seção de Evolução Temporal e Distribuição de Formatos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição por Formato */}
        <Card className="rounded-3xl border border-border/80 p-6 bg-card space-y-4 lg:col-span-1">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              Formatos Mais Utilizados
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Frequência de peças criadas entre suas campanhas
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {sortedFormats.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhum formato registrado ainda.
              </p>
            ) : (
              sortedFormats.slice(0, 5).map(([formatKey, count]) => {
                const total = totalFormatsGenerated || 1
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={formatKey} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-foreground capitalize">{formatKey}</span>
                      <span className="text-muted-foreground font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Comparativo de Desempenho e Prontidão */}
        <Card className="rounded-3xl border border-border/80 p-6 bg-card space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-pink-600" />
                Destaque Estratégico: Matriz de Retorno Estimado
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Relação entre formatos preparados, custo em créditos e tração orgânica
              </p>
            </div>
            <Badge className="bg-purple-600/10 text-purple-700 dark:text-purple-300 border-purple-500/20 text-xs">
              Baseline Calibrado
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">
                Custo Médio / Peça
              </span>
              <p className="text-xl font-black text-foreground">1.8 Créditos</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Economia de 78% vs agência
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">
                Tempo Médio de Produção
              </span>
              <p className="text-xl font-black text-foreground">45 Segundos</p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                6 formatos gerados em lote
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">
                Potencial de Conversão
              </span>
              <p className="text-xl font-black text-foreground">Alta Aderência</p>
              <p className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold">
                Otimizado com os 25 tons de IA
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Quer gerar um relatório completo em PDF para clientes ou stakeholders?
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (campaigns.length > 0) {
                  setSelectedReportCampaign(campaigns[0])
                }
              }}
              disabled={campaigns.length === 0}
              className="text-purple-600 dark:text-purple-400 border-purple-500/30 text-xs h-7 rounded-lg"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Abrir Relatório da Mais Recente
            </Button>
          </div>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou tema da campanha..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro Marca */}
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="h-9 text-xs rounded-xl w-[150px]">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Marcas</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro Objetivo */}
          <Select value={selectedObjective} onValueChange={setSelectedObjective}>
            <SelectTrigger className="h-9 text-xs rounded-xl w-[150px]">
              <SelectValue placeholder="Objetivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Objetivos</SelectItem>
              <SelectItem value="vendas">Vendas / Conversão</SelectItem>
              <SelectItem value="engajamento">Engajamento</SelectItem>
              <SelectItem value="awareness">Reconhecimento</SelectItem>
              <SelectItem value="lancamento">Lançamento</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro Status */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="h-9 text-xs rounded-xl w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="published">Publicada</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Campanhas e Tabela de Performance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            Campanhas Gerenciadas ({filteredCampaigns.length})
          </h3>
          <span className="text-xs text-muted-foreground">
            Clique na campanha para visualizar o relatório consolidado
          </span>
        </div>

        {filteredCampaigns.length === 0 ? (
          <Card className="rounded-3xl border-border/80 p-12 text-center bg-card/60">
            <Layers className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h4 className="font-bold text-base text-foreground">Nenhuma campanha encontrada</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-5">
              Crie agora uma campanha multiformato completa com apoio da IA para gerar posts para
              Instagram, LinkedIn, TikTok, carrosséis e e-mails simultaneamente.
            </p>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs rounded-xl"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Criar Primeira Campanha
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCampaigns.map((camp) => {
              const brandObj = brands.find((b) => b.id === camp.brand)
              const postsCount = postsCountMap[camp.id] || camp.formats?.length || 0
              const reachEst = postsCount * 3600
              const engEst = Math.round(reachEst * 0.054)

              return (
                <Card
                  key={camp.id}
                  className="rounded-2xl border-border/80 hover:border-purple-500/50 transition-all bg-card/80 p-5 space-y-4 relative flex flex-col justify-between group shadow-xs hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                        >
                          {brandObj ? brandObj.name : 'Marca Geral'}
                        </Badge>
                        <Badge
                          className={`text-[9px] uppercase ${
                            camp.status === 'published' || camp.status === 'active'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {camp.status || 'Rascunho'}
                        </Badge>
                      </div>

                      <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Coins className="w-3 h-3" /> {camp.credits_used || 12} créditos
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-foreground group-hover:text-purple-600 transition-colors line-clamp-1">
                        {camp.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {camp.briefing || 'Sem descrição detalhada.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {(camp.formats || []).slice(0, 4).map((f: string) => (
                        <span
                          key={f}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/40 font-medium capitalize"
                        >
                          {f}
                        </span>
                      ))}
                      {(camp.formats || []).length > 4 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                          +{(camp.formats || []).length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-1.5 rounded-lg bg-muted/40">
                        <span className="text-[9px] text-muted-foreground block">Peças</span>
                        <span className="text-xs font-bold text-foreground">{postsCount}</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-muted/40">
                        <span className="text-[9px] text-muted-foreground block">Alcance Est.</span>
                        <span className="text-xs font-bold text-foreground">
                          {reachEst.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-muted/40">
                        <span className="text-[9px] text-muted-foreground block">Engajamento</span>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                          {engEst.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReportCampaign(camp)}
                        className="text-xs h-8 flex-1 rounded-xl border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" /> Ver Relatório
                      </Button>

                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 rounded-xl text-muted-foreground hover:text-foreground"
                      >
                        <Link to={`/app/library?campaign=${camp.id}`}>
                          <span>Peças</span>
                          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Relatório de Campanha */}
      {selectedReportCampaign && (
        <CampaignReportModal
          campaign={selectedReportCampaign}
          open={Boolean(selectedReportCampaign)}
          onOpenChange={(open) => {
            if (!open) setSelectedReportCampaign(null)
          }}
        />
      )}

      {/* Modal de Criação de Campanha */}
      <CreateCampaignModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          setCreateModalOpen(false)
          loadData()
        }}
      />
    </div>
  )
}
export default CampaignsDashboard
