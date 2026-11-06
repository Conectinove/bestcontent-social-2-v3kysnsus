import { useEffect, useState } from 'react'
import {
  CrmContact,
  getCrmContacts,
  CRM_DEMO_CONTACTS,
  calculateCrmKpis,
  CRM_STAGE_LABELS,
} from '@/services/crm'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  TrendingUp,
  DollarSign,
  ArrowRight,
  Sparkles,
  Users,
  Target,
  Settings2,
  Plus,
  Trash2,
  Check,
  RotateCcw,
} from 'lucide-react'

export interface FunnelStageConfig {
  id: string
  key: string
  label: string
  sublabel?: string
  color: string
  textColor: string
}

const DEFAULT_FUNNEL_STAGES: FunnelStageConfig[] = [
  {
    id: '1',
    key: 'lead_captado',
    label: 'Leads Captados',
    sublabel: 'Topo de funil (Social & Ads)',
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
  },
  {
    id: '2',
    key: 'contato_feito',
    label: 'Contato Realizado',
    sublabel: 'Primeira abordagem / Qualificação',
    color: 'bg-indigo-500',
    textColor: 'text-indigo-500',
  },
  {
    id: '3',
    key: 'proposta_enviada',
    label: 'Proposta Enviada',
    sublabel: 'Orçamento entregue ao cliente',
    color: 'bg-amber-500',
    textColor: 'text-amber-500',
  },
  {
    id: '4',
    key: 'negociacao',
    label: 'Em Negociação',
    sublabel: 'Ajuste de escopo / Contrato',
    color: 'bg-orange-500',
    textColor: 'text-orange-500',
  },
  {
    id: '5',
    key: 'fechado_ganho',
    label: 'Fechamento Ganho',
    sublabel: 'Clientes conquistados',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-500',
  },
]

const FUNNEL_STORAGE_KEY = 'midiaviva_custom_funnel_stages'

export function CrmFunnelVisualBlock() {
  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Etapas configuráveis com persistência local
  const [configuredStages, setConfiguredStages] = useState<FunnelStageConfig[]>(() => {
    try {
      const saved = localStorage.getItem(FUNNEL_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (_) {
      /* fallback */
    }
    return DEFAULT_FUNNEL_STAGES
  })

  // Modal de configuração das etapas
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [editingStages, setEditingStages] = useState<FunnelStageConfig[]>(configuredStages)
  const [newStageName, setNewStageName] = useState('')

  useEffect(() => {
    let mounted = true
    getCrmContacts()
      .then((data) => {
        if (!mounted) return
        if (data.length > 0) {
          setContacts(data)
        } else {
          setContacts(CRM_DEMO_CONTACTS)
        }
      })
      .catch((_) => {
        if (mounted) setContacts(CRM_DEMO_CONTACTS)
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const kpis = calculateCrmKpis(contacts)

  // Salva configuração de etapas
  const handleSaveStages = () => {
    setConfiguredStages(editingStages)
    try {
      localStorage.setItem(FUNNEL_STORAGE_KEY, JSON.stringify(editingStages))
    } catch (_) {
      /* ignore */
    }
    setIsConfigOpen(false)
  }

  // Restaura etapas padrão
  const handleResetStages = () => {
    setEditingStages(DEFAULT_FUNNEL_STAGES)
    setConfiguredStages(DEFAULT_FUNNEL_STAGES)
    try {
      localStorage.removeItem(FUNNEL_STORAGE_KEY)
    } catch (_) {
      /* ignore */
    }
    setIsConfigOpen(false)
  }

  // Adiciona nova etapa personalizada
  const handleAddStage = () => {
    if (!newStageName.trim()) return
    const newId = `custom-${Date.now()}`
    const newKey = `stage_${Date.now()}`
    const colors = [
      { color: 'bg-violet-500', textColor: 'text-violet-500' },
      { color: 'bg-pink-500', textColor: 'text-pink-500' },
      { color: 'bg-cyan-500', textColor: 'text-cyan-500' },
      { color: 'bg-teal-500', textColor: 'text-teal-500' },
    ]
    const chosenColor = colors[editingStages.length % colors.length]

    const updated = [
      ...editingStages,
      {
        id: newId,
        key: newKey,
        label: newStageName.trim(),
        sublabel: 'Etapa personalizada',
        color: chosenColor.color,
        textColor: chosenColor.textColor,
      },
    ]
    setEditingStages(updated)
    setNewStageName('')
  }

  // Remove etapa
  const handleRemoveStage = (id: string) => {
    if (editingStages.length <= 2) return
    setEditingStages(editingStages.filter((s) => s.id !== id))
  }

  // Atualiza nome da etapa
  const handleUpdateStageLabel = (id: string, label: string) => {
    setEditingStages(editingStages.map((s) => (s.id === id ? { ...s, label } : s)))
  }

  // Estágios do funil calculando contagem real com base nos contatos do CRM
  const funnelStages = configuredStages.map((stage, idx) => {
    // Contagem real dos contatos que batem com o estágio
    const realCount = contacts.filter((c) => {
      if (c.stage === stage.key) return true
      // Se for etapa padrão ou personalizada que faz match por nome
      if (stage.key === 'lead_captado' && (c.stage === 'lead_captado' || !c.stage)) return true
      if (stage.key === 'contato_feito' && c.stage === 'contato_feito') return true
      if (stage.key === 'proposta_enviada' && c.stage === 'proposta_enviada') return true
      if (stage.key === 'negociacao' && c.stage === 'negociacao') return true
      if (stage.key === 'fechado_ganho' && c.stage === 'fechado_ganho') return true
      return false
    }).length

    return {
      ...stage,
      label: `${idx + 1}. ${stage.label}`,
      count: realCount,
    }
  })

  const maxCount = Math.max(...funnelStages.map((s) => s.count), 1)

  return (
    <div className="p-6 rounded-2xl bg-card border border-border hi-card space-y-6">
      {/* Cabeçalho do Bloco */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="hi-kicker text-primary bg-primary/10 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
              CRM & Pipeline Integrado
            </span>
            <Badge
              variant="outline"
              className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold"
            >
              Tempo Real
            </Badge>
          </div>
          <h3 className="hi-title text-xl font-black text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> Funil de Conversão Comercial (CRM)
          </h3>
          <p className="text-xs text-muted-foreground">
            Acompanhe o fluxo de leads desde o primeiro contato social até o fechamento de contrato
            na agência.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingStages(configuredStages)
              setIsConfigOpen(true)
            }}
            className="text-xs gap-1.5 h-8 font-semibold"
            title="Configurar etapas do funil"
          >
            <Settings2 className="w-3.5 h-3.5 text-primary" />
            Configurar Etapas
          </Button>

          <Link to="/app/crm">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
              Ver CRM Completo <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Modal de Configuração de Etapas */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Settings2 className="w-4 h-4 text-primary" /> Configurar Etapas do Funil
            </DialogTitle>
            <DialogDescription className="text-xs">
              Adicione, renomeie ou remova as fases do funil comercial da sua operação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {editingStages.map((stage, i) => (
                <div key={stage.id} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-5 text-center">
                    {i + 1}.
                  </span>
                  <div className={`w-3 h-3 rounded-full ${stage.color} shrink-0`} />
                  <Input
                    value={stage.label}
                    onChange={(e) => handleUpdateStageLabel(stage.id, e.target.value)}
                    className="h-8 text-xs flex-1"
                    placeholder="Nome da etapa"
                  />
                  {editingStages.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStage(stage.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500"
                      title="Remover etapa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Adicionar nova etapa */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <Input
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddStage()
                  }
                }}
                placeholder="Nova etapa (ex: Diagnóstico, Proposta VIP...)"
                className="h-8 text-xs flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddStage}
                disabled={!newStageName.trim()}
                className="h-8 text-xs gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </Button>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetStages}
              className="text-xs text-muted-foreground gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfigOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveStages}
                className="text-xs gap-1.5 font-bold bg-primary text-primary-foreground"
              >
                <Check className="w-3.5 h-3.5" /> Salvar Etapas
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Métricas Resumidas do CRM */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Total no Pipeline
          </span>
          <div className="text-lg font-black text-foreground mt-0.5">
            {kpis.totalContacts} Leads
          </div>
          <span className="text-[10px] text-muted-foreground">base ativa comercial</span>
        </div>

        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Pipeline Aberto
          </span>
          <div className="text-lg font-black text-foreground mt-0.5">
            R$ {kpis.totalPipelineValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-muted-foreground">soma de todas as propostas</span>
        </div>

        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Vendas Concluídas
          </span>
          <div className="text-lg font-black text-emerald-500 mt-0.5">
            R$ {kpis.wonValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {kpis.stageCounts.fechado_ganho} fechamentos
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Taxa de Conversão
          </span>
          <div className="text-lg font-black text-purple-500 mt-0.5">{kpis.conversionRate}%</div>
          <span className="text-[10px] text-muted-foreground">lead captado → ganho</span>
        </div>
      </div>

      {/* Gráfico Visual do Funil (Estilo Cascata em Camadas High Impact) */}
      <div className="space-y-3.5 pt-2">
        {funnelStages.map((stage, idx) => {
          // Porcentagem de largura visual decrescente proporcional à barra do funil
          const ratio = (stage.count / maxCount) * 100
          const barWidth = Math.max(ratio, 16)
          const convRateFromPrevious =
            idx === 0
              ? 100
              : funnelStages[idx - 1].count > 0
                ? Math.round((stage.count / funnelStages[idx - 1].count) * 100)
                : 0

          return (
            <div key={stage.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{stage.label}</span>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    ({stage.sublabel})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {idx > 0 && (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      conv. {convRateFromPrevious}%
                    </span>
                  )}
                  <span className={`font-black ${stage.textColor} text-sm`}>
                    {stage.count} {stage.count === 1 ? 'lead' : 'leads'}
                  </span>
                </div>
              </div>

              {/* Barra do Funil */}
              <div className="w-full bg-muted/50 rounded-lg h-7 p-1 overflow-hidden relative border border-border/40">
                <div
                  className={`h-full rounded-md ${stage.color} transition-all duration-700 flex items-center justify-between px-2 text-white text-[11px] font-bold shadow-xs`}
                  style={{ width: `${barWidth}%` }}
                >
                  <span className="truncate">{stage.count}</span>
                  {barWidth > 35 && (
                    <span className="text-[10px] opacity-90 hidden sm:inline">
                      {Math.round((stage.count / (kpis.totalContacts || 1)) * 100)}% da base
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
