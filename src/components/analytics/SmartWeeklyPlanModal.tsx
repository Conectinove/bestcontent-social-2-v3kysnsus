import React, { useState } from 'react'
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import {
  generateSmartWeeklyPlan,
  applySmartWeeklyPlan,
  type WeeklySchedulePlan,
} from '@/services/smart-scheduler'

interface SmartWeeklyPlanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccessPlanApplied?: () => void
}

export function SmartWeeklyPlanModal({
  open,
  onOpenChange,
  onSuccessPlanApplied,
}: SmartWeeklyPlanModalProps) {
  const { user } = useAuth()
  const { brands, activeBrand } = useSocial()
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [applyingPlan, setApplyingPlan] = useState(false)
  const [plan, setPlan] = useState<WeeklySchedulePlan | null>(null)

  const currentBrand = activeBrand || brands[0] || { id: '', name: 'Minha Marca' }

  const handleGeneratePlan = async () => {
    if (!user?.id) return
    setLoadingPlan(true)
    try {
      const generated = await generateSmartWeeklyPlan(currentBrand, user.id)
      setPlan(generated)
      toast({
        title: 'Plano Semanal Gerado!',
        description: '7 dias balanceados por melhores horários e sem repetições recentes.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar plano',
        description: err?.message || 'Falha na inteligência de agendamento.',
        variant: 'destructive',
      })
    } finally {
      setLoadingPlan(false)
    }
  }

  const handleApplyAll = async () => {
    if (!plan || !user?.id) return
    setApplyingPlan(true)
    try {
      const { successCount, errors } = await applySmartWeeklyPlan(plan, user.id)
      if (successCount > 0) {
        toast({
          title: 'Fila Semanal Agendada com Sucesso!',
          description: `${successCount} publicações foram criadas e adicionadas ao cronograma.`,
        })
        onSuccessPlanApplied?.()
        onOpenChange(false)
      } else {
        toast({
          title: 'Erro ao aplicar plano',
          description: errors[0] || 'Nenhum slot pôde ser agendado.',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar fila',
        description: err?.message || 'Falha ao sincronizar com PocketBase.',
        variant: 'destructive',
      })
    } finally {
      setApplyingPlan(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader className="border-b border-border/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-600/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              IA de Agenda Inteligente
            </span>
            <Badge variant="outline" className="text-[10px]">
              {currentBrand.name}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2 mt-1">
            Plano Semanal Automatizado
            <Sparkles className="w-5 h-5 text-pink-500" />
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            A IA analisa os dados históricos de engajamento, detecta os melhores horários de cada
            rede e distribui 7 publicações com anti-repetição de formatos recentes.
          </DialogDescription>
        </DialogHeader>

        {/* Anti-Repetition & Best Times Highlights */}
        {!plan && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-xs">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="font-bold text-sm text-foreground">
                Pronto para preencher a sua semana com 1 clique?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nossa IA vai alternar entre os novos formatos (Talking Head, Antes & Depois, UGC,
                Story com Enquete e Carrossel Educativo) calibrados para os horários de maior
                tração.
              </p>
            </div>

            <Button
              onClick={handleGeneratePlan}
              disabled={loadingPlan}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs rounded-xl h-10 px-6 gap-2 shadow-md shadow-purple-500/20"
            >
              {loadingPlan ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>
                {loadingPlan ? 'Calculando Melhores Horários...' : 'Gerar Plano Semanal com IA'}
              </span>
            </Button>
          </div>
        )}

        {plan && (
          <div className="space-y-4 py-2">
            {/* Rules Applied Notice */}
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-purple-700 dark:text-purple-300">
                <ShieldCheck className="w-4 h-4" />
                <span>Regras de Proteção de Audiência Aplicadas:</span>
              </div>
              <ul className="text-[11px] text-muted-foreground list-disc list-inside space-y-0.5">
                {plan.antiRepetitionRulesApplied.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>

            {/* List of 7 Slots */}
            <div className="space-y-2.5">
              {plan.slots.map((slot, idx) => (
                <Card
                  key={idx}
                  className="p-3.5 rounded-2xl border border-border/80 hover:border-purple-500/40 transition-all bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-foreground">{slot.dayOfWeek}</span>
                      <Badge
                        variant="secondary"
                        className="bg-purple-600/10 text-purple-700 dark:text-purple-300 text-[10px] font-bold"
                      >
                        {slot.platformName}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium border-pink-500/30 text-pink-600 dark:text-pink-400"
                      >
                        {slot.formatLabel}
                      </Badge>
                    </div>

                    <p className="font-semibold text-foreground text-xs leading-snug line-clamp-1">
                      {slot.headline}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {slot.hookPrompt}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                    <div className="flex items-center gap-1 font-mono text-[11px] text-foreground font-bold">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{slot.timeStr}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> Índice {slot.estimatedEngagementIndex}%
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-border/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={applyingPlan}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </Button>

          {plan && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGeneratePlan}
                disabled={loadingPlan || applyingPlan}
                className="text-xs rounded-xl"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingPlan ? 'animate-spin' : ''}`} />
                Recalcular Grade
              </Button>

              <Button
                size="sm"
                onClick={handleApplyAll}
                disabled={applyingPlan}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs rounded-xl px-4 gap-1.5 shadow-md shadow-purple-500/20"
              >
                {applyingPlan ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>
                  {applyingPlan ? 'Agendando 7 Slots...' : 'Aplicar Sugestão em 1 Clique'}
                </span>
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
