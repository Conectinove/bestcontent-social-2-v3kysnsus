import { useState, useMemo } from 'react'
import {
  Zap,
  Clock,
  Bell,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Shield,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  FunnelAutomationRecord,
  FunnelDeal,
  updateFunnelAutomation,
  toggleFunnelAutomation,
  updateDealStage,
  updateFunnelDeal,
} from '@/services/funnel'
import { useSocial } from '@/context/SocialContext'
import { toast } from '@/hooks/use-toast'

export interface FunnelAutomationsPanelProps {
  automations: FunnelAutomationRecord[]
  deals: FunnelDeal[]
  onRefreshAutomations: () => void
  onRefreshDeals: () => void
}

export function FunnelAutomationsPanel({
  automations,
  deals,
  onRefreshAutomations,
  onRefreshDeals,
}: FunnelAutomationsPanelProps) {
  const { addNotification } = useSocial()
  const [runningAuto, setRunningAuto] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Estatística: quantos deals atendem às regras agora
  const pendingActionsStats = useMemo(() => {
    const now = new Date().getTime()

    // 1. Propostas paradas há mais de 5 dias
    const staleProposals = deals.filter((d) => {
      if (d.stage !== 'proposta_enviada') return false
      const updatedAt = new Date(d.updated || d.created).getTime()
      const diffDays = (now - updatedAt) / (1000 * 60 * 60 * 24)
      return diffDays >= 5
    })

    // 2. Leads captados parados há mais de 2 dias
    const staleLeads = deals.filter((d) => {
      if (d.stage !== 'lead_captado') return false
      const updatedAt = new Date(d.updated || d.created).getTime()
      const diffDays = (now - updatedAt) / (1000 * 60 * 60 * 24)
      return diffDays >= 2
    })

    // 3. Negociações paradas há mais de 10 dias
    const staleNegotiations = deals.filter((d) => {
      if (d.stage !== 'negociacao') return false
      const updatedAt = new Date(d.updated || d.created).getTime()
      const diffDays = (now - updatedAt) / (1000 * 60 * 60 * 24)
      return diffDays >= 10
    })

    return {
      staleProposals,
      staleLeads,
      staleNegotiations,
      totalPending: staleProposals.length + staleLeads.length + staleNegotiations.length,
    }
  }, [deals])

  // Ligar/Desligar regra persistida no PocketBase
  const handleToggle = async (rule: FunnelAutomationRecord, nextVal: boolean) => {
    setTogglingId(rule.id)
    try {
      await toggleFunnelAutomation(rule.id, nextVal)
      toast({
        title: nextVal ? 'Automação Ativada' : 'Automação Pausada',
        description: `Regra "${rule.name}" ${nextVal ? 'agora está ativa' : 'foi desativada'}.`,
      })
      onRefreshAutomations()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar automação',
        description: err?.message || 'Não foi possível alterar status.',
        variant: 'destructive',
      })
    } finally {
      setTogglingId(null)
    }
  }

  // Executar automações manualmente agora
  const handleExecuteAutomationsNow = async () => {
    setRunningAuto(true)
    let processedCount = 0
    let remindersCreated = 0

    try {
      const now = new Date().getTime()

      for (const auto of automations) {
        if (!auto.enabled) continue

        // Regra de propostas paradas
        if (auto.rule_key === 'stale_proposal_followup') {
          const daysThreshold = auto.days_inactive || 5
          for (const d of deals) {
            if (d.stage === 'proposta_enviada') {
              const updatedAt = new Date(d.updated || d.created).getTime()
              const diffDays = (now - updatedAt) / (1000 * 60 * 60 * 24)
              if (diffDays >= daysThreshold && d.priority !== 'alta') {
                await updateFunnelDeal(d.id, {
                  priority: 'alta',
                  notes:
                    `${d.notes || ''}\n[Automação] Sinalizado para follow-up urgente (${Math.floor(diffDays)} dias sem movimentação).`.trim(),
                })
                processedCount++
              }
            }
          }
        }

        // Regra de lembretes para leads parados
        if (auto.rule_key === 'stale_lead_reminder') {
          const daysThreshold = auto.days_inactive || 2
          for (const d of deals) {
            if (d.stage === 'lead_captado') {
              const updatedAt = new Date(d.updated || d.created).getTime()
              const diffDays = (now - updatedAt) / (1000 * 60 * 60 * 24)
              if (diffDays >= daysThreshold) {
                if (addNotification) {
                  addNotification({
                    title: `Lembrete Funil: Lead Parado (${d.title})`,
                    message: `${d.company || 'Oportunidade'} aguarda 1º contato há mais de ${Math.floor(diffDays)} dias. Envie uma mensagem!`,
                    type: 'schedule',
                  })
                  remindersCreated++
                }
                processedCount++
              }
            }
          }
        }
      }

      toast({
        title: 'Automações Executadas com Sucesso!',
        description: `${processedCount} oportunidade(s) analisada(s). ${remindersCreated} lembrete(s) in-app gerado(s).`,
      })

      onRefreshDeals()
    } catch (err: any) {
      toast({
        title: 'Erro na execução de automações',
        description: err?.message || 'Falha ao processar regras.',
        variant: 'destructive',
      })
    } finally {
      setRunningAuto(false)
    }
  }

  return (
    <Card className="rounded-2xl border border-purple-500/20 bg-card overflow-hidden shadow-xs">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Topo do painel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  Painel de Automações do Funil
                </h3>
                <Badge className="bg-purple-600 text-white text-[10px] font-bold uppercase">
                  Regras Ativas
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Regras persistidas no banco para triagem, follow-up automático e lembretes in-app.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              type="button"
              size="sm"
              onClick={handleExecuteAutomationsNow}
              disabled={runningAuto}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl h-9 px-3.5 gap-1.5 shadow-xs min-h-[40px]"
            >
              {runningAuto ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white" />
              )}
              <span>Verificar & Executar Regras</span>
            </Button>
          </div>
        </div>

        {/* Resumo de Oportunidades Precisando de Ação */}
        {pendingActionsStats.totalPending > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-foreground">
                {pendingActionsStats.totalPending} oportunidade(s) atingiram os critérios de
                automação hoje:
              </span>
              <p className="text-muted-foreground">
                • {pendingActionsStats.staleProposals.length} proposta(s) sem resposta há mais de 5
                dias.
                <br />• {pendingActionsStats.staleLeads.length} lead(s) novo(s) sem contato há mais
                de 2 dias.
              </p>
            </div>
          </div>
        )}

        {/* Lista de Regras de Automação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {automations.map((rule) => {
            const isToggling = togglingId === rule.id
            return (
              <div
                key={rule.id}
                className="p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-foreground leading-snug">
                      {rule.name}
                    </span>
                    {rule.enabled ? (
                      <Badge className="bg-emerald-600 text-white text-[9px] font-bold">
                        Ligada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-[9px]">
                        Pausada
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {rule.description}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                    <Clock className="w-3 h-3 text-purple-500" />
                    <span>
                      Gatilho:{' '}
                      {rule.days_inactive && rule.days_inactive > 0
                        ? `${rule.days_inactive} dias sem movimentação`
                        : 'Entrada Imediata'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pt-0.5">
                  <Switch
                    checked={rule.enabled}
                    disabled={isToggling}
                    onCheckedChange={(checked) => handleToggle(rule, checked)}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
export default FunnelAutomationsPanel
