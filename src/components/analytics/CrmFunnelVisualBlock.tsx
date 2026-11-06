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
import { TrendingUp, DollarSign, ArrowRight, Sparkles, Users, Target } from 'lucide-react'

export function CrmFunnelVisualBlock() {
  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  // Estágios do funil com contagens e larguras dinâmicas
  const funnelStages = [
    {
      key: 'lead_captado',
      label: '1. Leads Captados',
      count: kpis.stageCounts.lead_captado,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      bgLight: 'bg-blue-500/10',
      borderLight: 'border-blue-500/20',
      sublabel: 'Topo de funil (Social & Ads)',
    },
    {
      key: 'contato_feito',
      label: '2. Contato Realizado',
      count: kpis.stageCounts.contato_feito,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-500',
      bgLight: 'bg-indigo-500/10',
      borderLight: 'border-indigo-500/20',
      sublabel: 'Primeira abordagem / Qualificação',
    },
    {
      key: 'proposta_enviada',
      label: '3. Proposta Enviada',
      count: kpis.stageCounts.proposta_enviada,
      color: 'bg-amber-500',
      textColor: 'text-amber-500',
      bgLight: 'bg-amber-500/10',
      borderLight: 'border-amber-500/20',
      sublabel: 'Orçamento entregue ao cliente',
    },
    {
      key: 'negociacao',
      label: '4. Em Negociação',
      count: kpis.stageCounts.negociacao,
      color: 'bg-orange-500',
      textColor: 'text-orange-500',
      bgLight: 'bg-orange-500/10',
      borderLight: 'border-orange-500/20',
      sublabel: 'Ajuste de escopo / Contrato',
    },
    {
      key: 'fechado_ganho',
      label: '5. Vendas Fechadas (Ganho)',
      count: kpis.stageCounts.fechado_ganho,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-500',
      bgLight: 'bg-emerald-500/10',
      borderLight: 'border-emerald-500/20',
      sublabel: 'Clientes conquistados',
    },
  ]

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

        <Link to="/app/crm">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
            Ver CRM Completo <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

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
