import { useState, useMemo } from 'react'
import {
  Zap,
  Clock,
  Bell,
  CheckCircle2,
  AlertCircle,
  Play,
  Sparkles,
  ArrowRight,
  Shield,
  Loader2,
  TrendingUp,
  Award,
  Crown,
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

    // Ticket médio da carteira para regras de Alto Valor
    const totalPipelineVal = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
    const avgTicket = deals.length > 0 ? totalPipelineVal / deals.length : 3000

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

    // 3. Negociações paradas há mais de 7 dias
    const staleNegotiations = deals.filter((d) => {
      if (d.stage !== 'negociacao') return false
      const updatedAt = new Date(d.updated || d.created).getTime()
      const diffDays = (now - updatedAt) / (1000 * 60 * 60 * 24)
      return diffDays >= 7
    })

    // 4. Deals ganhos recentes (últimos 3 dias) para upsell
    const wonDealsRecent = deals.filter((d) => {
      if (d.stage !== 'fechado_ganho') return false
      const updatedAt = new Date(d.updated || d.created).getTime()
      const diffDays = (now - updatedAt) / (1000 * 60 * 60 * 24)
      return diffDays <= 7
    })

    // 5. Deals perdidos há mais de 30 dias para reativação
    const lostDealsReactivate = deals.filter((d) => {
      if (d.stage !== 'fechado_perdido') return false
      const updatedAt = new Date(d.updated || d.created).getTime()
      const diffDays = (now - updatedAt) / (1000 * 60 * 60 * 24)
      return diffDays >= 30
    })

    // 6. Deals de alto valor com prioridade não-alta
    const highValueDeals = deals.filter((d) => {
      const val = Number(d.value) || 0
      return val > avgTicket && d.priority !== 'alta' && d.stage !== 'fechado_perdido'
    })

    // 7. Alerta de pipeline frio: nenhum lead captado nos últimos 7 dias
    const newLeadsLast7d = deals.filter((d) => {
      const createdTime = new Date(d.created).getTime()
      return (now - createdTime) / (1000 * 60 * 60 * 24) <= 7
    })
    const isColdPipeline = deals.length > 0 && newLeadsLast7d.length === 0

    return {
      staleProposals,
      staleLeads,
      staleNegotiations,
      wonDealsRecent,
      lostDealsReactivate,
      highValueDeals,
      isColdPipeline,
      avgTicket,
      totalPending:
        staleProposals.length +
        staleLeads.length +
        staleNegotiations.length +
        highValueDeals.length +
        (isColdPipeline ? 1 : 0),
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

      // Calcular ticket médio da carteira
      const totalPipelineVal = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
      const avgTicket = deals.length > 0 ? totalPipelineVal / deals.length : 3000

      for (const auto of automations) {
        if (!auto.enabled) continue

        // 1. Regra de propostas paradas (> 5 dias)
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
                if (addNotification) {
                  addNotification({
                    title: `Proposta Parada: ${d.title}`,
                    message: `A proposta está sem retorno há ${Math.floor(diffDays)} dias. Prioridade elevada para Alta.`,
                    type: 'schedule',
                  })
                  remindersCreated++
                }
              }
            }
          }
        }

        // 2. Regra de lembretes para leads parados (> 2 dias)
        if (auto.rule_key === 'stale_lead_reminder') {
          const daysThreshold = auto.days_inactive || 2
          for (const d of deals) {
            if (d.stage === 'lead_captado') {
              const updatedAt = new Date(d.updated || d.created).getTime()
              const diffDays = (now - updatedAt) / (1000 * 60 * 60 * 24)
              if (diffDays >= daysThreshold) {
                if (addNotification) {
                  addNotification({
                    title: `Lead Aguardando 1º Contato: ${d.title}`,
                    message: `${d.company || 'Oportunidade'} aguarda 1º contato há ${Math.floor(diffDays)} dias. Faça contato para não esfriar!`,
                    type: 'schedule',
                  })
                  remindersCreated++
                }
                processedCount++
              }
            }
          }
        }

        // 3. Negociação parada (> 7 dias) -> alerta urgente
        if (
          auto.rule_key === 'negotiation_stale_urgent_alert' ||
          auto.rule_key === 'auto_negotiation_close'
        ) {
          const daysThreshold = auto.days_inactive || 7
          for (const d of deals) {
            if (d.stage === 'negociacao') {
              const updatedAt = new Date(d.updated || d.created).getTime()
              const diffDays = (now - updatedAt) / (1000 * 60 * 60 * 24)
              if (diffDays >= daysThreshold) {
                if (d.priority !== 'alta') {
                  await updateFunnelDeal(d.id, {
                    priority: 'alta',
                    notes:
                      `${d.notes || ''}\n[Automação] Alerta de Negociação parada há ${Math.floor(diffDays)} dias. Sugerir bônus ou condição rápida de fechamento.`.trim(),
                  })
                }
                if (addNotification) {
                  addNotification({
                    title: `Alerta Negociação Urgente: ${d.title}`,
                    message: `R$ ${(d.value || 0).toLocaleString('pt-BR')} travados em negociação há ${Math.floor(diffDays)} dias. Dispare uma condição de fechamento.`,
                    type: 'mention',
                  })
                  remindersCreated++
                }
                processedCount++
              }
            }
          }
        }

        // 4. Deal Ganho -> Parabenizar & Sugerir Upsell / Case de Sucesso
        if (auto.rule_key === 'deal_won_congrats_upsell') {
          for (const d of deals) {
            if (d.stage === 'fechado_ganho') {
              const updatedAt = new Date(d.updated || d.created).getTime()
              const diffDays = (now - updatedAt) / (1000 * 60 * 60 * 24)
              // Deals ganhos recentes que ainda não tiveram nota de upsell
              if (diffDays <= 7 && (!d.notes || !d.notes.includes('[Upsell Programado]'))) {
                await updateFunnelDeal(d.id, {
                  notes:
                    `${d.notes || ''}\n[Upsell Programado] Cliente fechado com sucesso. Agendar coleta de depoimento e apresentação de pacote ampliado em 15 dias.`.trim(),
                })
                if (addNotification) {
                  addNotification({
                    title: `Parabéns pela Venda: ${d.title}!`,
                    message: `Cliente faturado em R$ ${(d.value || 0).toLocaleString('pt-BR')}. Agende o onboarding e prepare a proposta de upsell.`,
                    type: 'like',
                  })
                  remindersCreated++
                }
                processedCount++
              }
            }
          }
        }

        // 5. Deal Perdido -> Agendar Reativação em 30 dias
        if (auto.rule_key === 'deal_lost_reactivation_30d') {
          for (const d of deals) {
            if (d.stage === 'fechado_perdido') {
              const updatedAt = new Date(d.updated || d.created).getTime()
              const diffDays = (now - updatedAt) / (1000 * 60 * 60 * 24)
              if (diffDays >= 30 && (!d.notes || !d.notes.includes('[Reativação Acionada]'))) {
                await updateFunnelDeal(d.id, {
                  notes:
                    `${d.notes || ''}\n[Reativação Acionada] 30 dias após arquivamento. Momento ideal para reenviar case atualizado ou condição promocional.`.trim(),
                })
                if (addNotification) {
                  addNotification({
                    title: `Reativação de Oportunidade: ${d.title}`,
                    message: `Oportunidade perdida há 30 dias. Entre em contato com um novo case de sucesso ou oferta de retorno.`,
                    type: 'schedule',
                  })
                  remindersCreated++
                }
                processedCount++
              }
            }
          }
        }

        // 6. Deal de Alto Valor (> Ticket Médio) -> Elevar para Prioridade Alta VIP
        if (auto.rule_key === 'high_value_deal_priority') {
          for (const d of deals) {
            const val = Number(d.value) || 0
            if (val > avgTicket && d.priority !== 'alta' && d.stage !== 'fechado_perdido') {
              await updateFunnelDeal(d.id, {
                priority: 'alta',
                notes:
                  `${d.notes || ''}\n[Prioridade VIP] Valor (R$ ${val.toLocaleString('pt-BR')}) superior ao ticket médio (R$ ${Math.round(avgTicket).toLocaleString('pt-BR')}).`.trim(),
              })
              if (addNotification) {
                addNotification({
                  title: `Deal VIP de Alto Valor: ${d.title}`,
                  message: `Oportunidade de R$ ${val.toLocaleString('pt-BR')} acima do ticket médio. Atenção prioritária do time comercial.`,
                  type: 'mention',
                })
                remindersCreated++
              }
              processedCount++
            }
          }
        }

        // 7. Pipeline Frio -> Nenhum novo lead nos últimos 7 dias
        if (auto.rule_key === 'pipeline_cold_alert_7d') {
          const newLeadsLast7d = deals.filter((d) => {
            const createdTime = new Date(d.created).getTime()
            return (now - createdTime) / (1000 * 60 * 60 * 24) <= 7
          })
          if (deals.length > 0 && newLeadsLast7d.length === 0) {
            if (addNotification) {
              addNotification({
                title: `Alerta Estratégico: Pipeline Comercial Frio`,
                message: `Nenhum novo lead entrou no funil nos últimos 7 dias. Recomendamos ativar campanhas em Google Ads, Meta Ads, YouTube Ads, TikTok Ads ou LinkedIn Ads.`,
                type: 'schedule',
              })
              remindersCreated++
            }
            processedCount++
          }
        }

        // 8. Lead LinkedIn Ads sem contato há 3 dias -> Alerta de Follow-up B2B com decisor
        if (auto.rule_key === 'linkedin_ads_stale_followup') {
          const daysThreshold = auto.days_inactive || 3
          for (const d of deals) {
            if (
              d.source === 'LinkedIn Ads' &&
              (d.stage === 'lead_captado' || d.stage === 'contato_feito')
            ) {
              const updatedAt = new Date(d.updated || d.created).getTime()
              const diffDays = (now - updatedAt) / (1000 * 60 * 60 * 24)
              if (diffDays >= daysThreshold && d.priority !== 'alta') {
                await updateFunnelDeal(d.id, {
                  priority: 'alta',
                  notes:
                    `${d.notes || ''}\n[Automação LinkedIn Ads] Lead B2B sem contato há ${Math.floor(diffDays)} dias. Prioridade elevada para contato com decisor.`.trim(),
                })
                processedCount++
                if (addNotification) {
                  addNotification({
                    title: `Follow-up LinkedIn Ads: ${d.title}`,
                    message: `Lead executivo ${d.company || ''} sem retorno há ${Math.floor(diffDays)} dias. Acione via InMail ou telefone.`,
                    type: 'schedule',
                  })
                  remindersCreated++
                }
              }
            }
          }
        }

        // 9. Proposta LinkedIn Ads há 5+ dias -> Elevar para prioridade alta
        if (auto.rule_key === 'linkedin_ads_proposal_priority') {
          const daysThreshold = auto.days_inactive || 5
          for (const d of deals) {
            if (d.source === 'LinkedIn Ads' && d.stage === 'proposta_enviada') {
              const updatedAt = new Date(d.updated || d.created).getTime()
              const diffDays = (now - updatedAt) / (1000 * 60 * 60 * 24)
              if (diffDays >= daysThreshold && d.priority !== 'alta') {
                await updateFunnelDeal(d.id, {
                  priority: 'alta',
                  notes:
                    `${d.notes || ''}\n[Automação LinkedIn Ads] Proposta corporativa sem retorno há ${Math.floor(diffDays)} dias. Prioridade Alta aplicada.`.trim(),
                })
                processedCount++
                if (addNotification) {
                  addNotification({
                    title: `Proposta B2B Parada: ${d.title}`,
                    message: `Proposta enviada para lead LinkedIn Ads parada há ${Math.floor(diffDays)} dias. Agendar call de alinhamento com stakeholders.`,
                    type: 'mention',
                  })
                  remindersCreated++
                }
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
            <div className="text-xs space-y-1 w-full">
              <span className="font-bold text-foreground">
                {pendingActionsStats.totalPending} gatilho(s) comercial(is) detectado(s) para
                execução:
              </span>
              <ul className="text-muted-foreground list-disc pl-4 space-y-0.5 mt-1">
                {pendingActionsStats.staleProposals.length > 0 && (
                  <li>
                    {pendingActionsStats.staleProposals.length} proposta(s) parada(s) há mais de 5
                    dias.
                  </li>
                )}
                {pendingActionsStats.staleLeads.length > 0 && (
                  <li>
                    {pendingActionsStats.staleLeads.length} lead(s) novo(s) aguardando primeiro
                    contato há 48h+.
                  </li>
                )}
                {pendingActionsStats.staleNegotiations.length > 0 && (
                  <li>
                    {pendingActionsStats.staleNegotiations.length} negociação(ões) parada(s) há 7+
                    dias.
                  </li>
                )}
                {pendingActionsStats.highValueDeals.length > 0 && (
                  <li>
                    {pendingActionsStats.highValueDeals.length} negócio(s) VIP com valor acima do
                    ticket médio (R${' '}
                    {Math.round(pendingActionsStats.avgTicket).toLocaleString('pt-BR')}) para elevar
                    prioridade.
                  </li>
                )}
                {pendingActionsStats.isColdPipeline && (
                  <li>Alerta de pipeline frio: nenhum novo lead nos últimos 7 dias.</li>
                )}
              </ul>
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
