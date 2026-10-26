import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
} from 'lucide-react'
import {
  getAdCampaigns,
  updateAdCampaign,
  deleteAdCampaign,
  type AdCampaignRecord,
} from '@/services/ads'
import { CreateAdModal } from '@/components/ads/CreateAdModal'
import { useSocial } from '@/context/SocialContext'
import { toast } from '@/hooks/use-toast'

export function AdsPage() {
  const { brands } = useSocial()
  const [campaigns, setCampaigns] = useState<AdCampaignRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const data = await getAdCampaigns()
    setCampaigns(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Métricas Consolidadas dos Anúncios
  const totalBudget = campaigns.reduce((acc, c) => acc + (c.total_budget || c.daily_budget * 7), 0)
  const totalProjectedReach = campaigns.reduce((acc, c) => acc + (c.projections?.reach || 0), 0)
  const totalProjectedClicks = campaigns.reduce((acc, c) => acc + (c.projections?.clicks || 0), 0)
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
        description: `Status atualizado no gestor de anúncios.`,
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
            Planeje campanhas patrocinadas, gere copies persuasivas com IA e acompanhe projeções
            calibradas de ROI
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-2xl text-xs h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Campanha de Anúncio</span>
        </Button>
      </div>

      {/* Aviso de Transparência da Plataforma */}
      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-foreground flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-purple-700 dark:text-purple-300">
            Ambiente Integrado de Planejamento e Criativos de Anúncios
          </p>
          <p className="text-[11px] text-muted-foreground">
            Todas as métricas de alcance, cliques e CPC são estimativas baseline calibradas por
            inteligência artificial para o mercado brasileiro. A veiculação patrocinada direta exige
            a conexão das credenciais oficiais da sua conta de anúncios.
          </p>
        </div>
      </div>

      {/* Grid de KPIs Consolidados */}
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
            {campaigns.length} no total
          </span>
        </Card>

        <Card className="p-4 rounded-2xl border-border bg-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">
              Orçamento Previsto
            </span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-foreground">
            R${' '}
            {totalBudget.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
            Investimento planejado
          </span>
        </Card>

        <Card className="p-4 rounded-2xl border-border bg-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">
              Alcance Projetado
            </span>
            <Users className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
            ~{totalProjectedReach.toLocaleString('pt-BR')}
          </p>
          <span className="text-[10px] text-muted-foreground block">Pessoas impactadas</span>
        </Card>

        <Card className="p-4 rounded-2xl border-border bg-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">
              Cliques Estimados
            </span>
            <MousePointer className="w-3.5 h-3.5 text-pink-600" />
          </div>
          <p className="text-2xl font-black text-foreground">
            ~{totalProjectedClicks.toLocaleString('pt-BR')}
          </p>
          <span className="text-[10px] text-muted-foreground block">Tráfego direcionado</span>
        </Card>
      </div>

      {/* Lista de Campanhas */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground">Campanhas em Andamento</h3>

        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Carregando campanhas de anúncios...
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
            {campaigns.map((camp) => (
              <Card
                key={camp.id}
                className="p-5 rounded-3xl border-border bg-card space-y-4 shadow-xs flex flex-col justify-between"
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

                    <div className="flex items-center gap-1">
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

                  {/* Projeções */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs pt-1">
                    <div className="p-1.5 rounded-xl bg-card border border-border/60">
                      <span className="text-[9px] text-muted-foreground block">Orçamento</span>
                      <span className="font-bold text-foreground">R$ {camp.daily_budget}/dia</span>
                    </div>

                    <div className="p-1.5 rounded-xl bg-card border border-border/60">
                      <span className="text-[9px] text-muted-foreground block">Alcance Est.</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {camp.projections?.reach
                          ? `~${(camp.projections.reach / 1000).toFixed(1)}k`
                          : '—'}
                      </span>
                    </div>

                    <div className="p-1.5 rounded-xl bg-card border border-border/60">
                      <span className="text-[9px] text-muted-foreground block">Cliques</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {camp.projections?.clicks || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {camp.destination_url && (
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground truncate max-w-[180px]">
                      {camp.destination_url}
                    </span>
                    <a
                      href={camp.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline flex items-center gap-0.5 font-bold"
                    >
                      <span>Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      <CreateAdModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        brands={brands}
        onSuccess={(newCamp) => {
          setCampaigns((prev) => [newCamp, ...prev])
        }}
      />
    </div>
  )
}
