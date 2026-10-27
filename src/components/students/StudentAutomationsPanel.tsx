import { useState, useMemo } from 'react'
import {
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Sparkles,
  ShieldAlert,
  Award,
  Bell,
  Loader2,
  Sliders,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  StudentAutomationRecord,
  StudentRecord,
  updateStudentAutomation,
  toggleStudentAutomation,
} from '@/services/students'
import { useSocial } from '@/context/SocialContext'
import { toast } from '@/hooks/use-toast'

export interface StudentAutomationsPanelProps {
  automations: StudentAutomationRecord[]
  students: StudentRecord[]
  completionRate: number
  onRefreshAutomations: () => void
  onRefreshStudents: () => void
}

export function StudentAutomationsPanel({
  automations,
  students,
  completionRate,
  onRefreshAutomations,
  onRefreshStudents,
}: StudentAutomationsPanelProps) {
  const { addNotification } = useSocial()
  const [runningAuto, setRunningAuto] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null)
  const [customThreshold, setCustomThreshold] = useState<number>(65)

  // Estatística: alunos que atendem aos critérios de cada regra agora
  const pendingCriteria = useMemo(() => {
    const now = new Date().getTime()
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000

    // a) Alunos em risco
    const atRiskList = students.filter((s) => s.status === 'em_risco')

    // b) Alunos sem progresso / acesso há 14+ dias
    const staleProgressList = students.filter((s) => {
      if (s.status === 'cancelado' || s.status === 'concluido') return false
      const refDate = s.last_access_at || s.updated || s.created
      const diff = now - new Date(refDate).getTime()
      return diff >= fourteenDaysMs && (s.progress || 0) < 100
    })

    // c) Novos alunos matriculados recentemente (últimos 3 dias)
    const newStudentsList = students.filter((s) => {
      const dt = s.enrollment_date || s.created
      const diff = now - new Date(dt).getTime()
      return diff <= threeDaysMs
    })

    // d) Alunos com progresso >= 90%
    const nearCompletionList = students.filter(
      (s) => (s.progress || 0) >= 90 && s.status !== 'concluido',
    )

    // e) Taxa de conclusão abaixo da meta configurada
    const targetThreshold =
      automations.find((a) => a.rule_key === 'low_completion_manager_summary')?.threshold_value ||
      65
    const isBelowCompletionThreshold = completionRate < targetThreshold

    const totalActions =
      atRiskList.length +
      staleProgressList.length +
      newStudentsList.length +
      nearCompletionList.length +
      (isBelowCompletionThreshold ? 1 : 0)

    return {
      atRiskList,
      staleProgressList,
      newStudentsList,
      nearCompletionList,
      isBelowCompletionThreshold,
      targetThreshold,
      totalActions,
    }
  }, [students, automations, completionRate])

  // Ligar/Desligar regra persistida no banco
  const handleToggle = async (rule: StudentAutomationRecord, nextVal: boolean) => {
    setTogglingId(rule.id)
    try {
      await toggleStudentAutomation(rule.id, nextVal)
      toast({
        title: nextVal ? 'Automação Ativada' : 'Automação Pausada',
        description: `Regra "${rule.name}" ${nextVal ? 'agora está ativa' : 'foi desativada'}.`,
      })
      onRefreshAutomations()
    } catch (err: any) {
      toast({
        title: 'Erro ao alterar automação',
        description: err?.message || 'Falha ao salvar no banco.',
        variant: 'destructive',
      })
    } finally {
      setTogglingId(null)
    }
  }

  // Atualizar percentual da regra editável de conclusão
  const handleSaveThreshold = async (rule: StudentAutomationRecord) => {
    try {
      await updateStudentAutomation(rule.id, {
        threshold_value: customThreshold,
      })
      toast({
        title: 'Meta Atualizada!',
        description: `Alerta para gestor configurado quando taxa for menor que ${customThreshold}%.`,
      })
      setEditingTargetId(null)
      onRefreshAutomations()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar meta',
        description: err?.message || 'Falha ao atualizar percentual.',
        variant: 'destructive',
      })
    }
  }

  // Executar automações e disparar notificações na central
  const handleExecuteAutomationsNow = async () => {
    setRunningAuto(true)
    let triggeredCount = 0

    try {
      for (const rule of automations) {
        if (!rule.enabled) continue

        // a) Aluno em risco -> alerta in-app prioritário
        if (rule.rule_key === 'at_risk_alert' && pendingCriteria.atRiskList.length > 0) {
          for (const st of pendingCriteria.atRiskList.slice(0, 3)) {
            if (addNotification) {
              addNotification({
                title: `🚨 Aluno em Risco de Evasão: ${st.name}`,
                message: `O aluno está com status 'em_risco' no curso ${st.course} (${st.progress}% concluído). Ação de retenção pedagógica recomendada.`,
                type: 'system',
              })
              triggeredCount++
            }
          }
        }

        // b) Sem progresso há 14+ dias -> lembrete de retomada
        if (rule.rule_key === 'no_progress_14d' && pendingCriteria.staleProgressList.length > 0) {
          for (const st of pendingCriteria.staleProgressList.slice(0, 3)) {
            if (addNotification) {
              addNotification({
                title: `⏰ Lembrete de Retomada: ${st.name}`,
                message: `Aluno sem evolução nas aulas há mais de 14 dias. Mensagem de incentivo e suporte sugerida para turma ${st.cohort || 'atual'}.`,
                type: 'schedule',
              })
              triggeredCount++
            }
          }
        }

        // c) Novo aluno matriculado -> mensagem de boas-vindas
        if (rule.rule_key === 'new_student_welcome' && pendingCriteria.newStudentsList.length > 0) {
          for (const st of pendingCriteria.newStudentsList.slice(0, 2)) {
            if (addNotification) {
              addNotification({
                title: `🎉 Boas-vindas: Novo Aluno ${st.name}`,
                message: `Matrícula confirmada no curso ${st.course}. Trilha inicial liberada e kit de onboarding disponível.`,
                type: 'system',
              })
              triggeredCount++
            }
          }
        }

        // d) Aluno com progresso >= 90% -> sugestão de certificado / próximo curso
        if (
          rule.rule_key === 'high_progress_next_course' &&
          pendingCriteria.nearCompletionList.length > 0
        ) {
          for (const st of pendingCriteria.nearCompletionList.slice(0, 3)) {
            if (addNotification) {
              addNotification({
                title: `🎓 Reta Final de Curso: ${st.name} (${st.progress}%)`,
                message: `Aluno atingiu ${st.progress}% do curso ${st.course}. Sugerir emissão de certificado e apresentar formação avançada de continuidade.`,
                type: 'system',
              })
              triggeredCount++
            }
          }
        }

        // e) Taxa de conclusão abaixo de X% -> resumo para gestor
        if (
          rule.rule_key === 'low_completion_manager_summary' &&
          pendingCriteria.isBelowCompletionThreshold
        ) {
          if (addNotification) {
            addNotification({
              title: `📊 Resumo Semanal da Coordenação: Taxa de Conclusão (${completionRate}%)`,
              message: `A taxa geral de conclusão está em ${completionRate}%, abaixo da meta estipulada de ${pendingCriteria.targetThreshold}%. Revisar módulos de maior abandono e promover lives de tira-dúvidas.`,
              type: 'system',
            })
            triggeredCount++
          }
        }
      }

      toast({
        title: 'Automações de Alunos Processadas!',
        description: `${triggeredCount} ação(ões) executada(s) e enviada(s) para a central de notificações.`,
      })

      onRefreshStudents()
    } catch (err: any) {
      toast({
        title: 'Erro ao executar automações',
        description: err?.message || 'Falha ao processar regras de alunos.',
        variant: 'destructive',
      })
    } finally {
      setRunningAuto(false)
    }
  }

  return (
    <Card className="rounded-3xl border border-purple-500/20 bg-card overflow-hidden shadow-xs">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Topo do painel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  Painel de Automações para Alunos & Retenção
                </h3>
                <Badge className="bg-purple-600 text-white text-[10px] font-bold uppercase">
                  Regras Inteligentes
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Regras persistidas no banco para alerta de evasão, lembretes de 14d, boas-vindas e
                upsell de certificados.
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

        {/* Resumo de Alunos Precisando de Ação Hoje */}
        {pendingCriteria.totalActions > 0 && (
          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-3">
            <Bell className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-foreground">
                Gatilhos de automação prontos para execução ({pendingCriteria.totalActions} ações
                detectadas):
              </span>
              <p className="text-muted-foreground leading-relaxed">
                • {pendingCriteria.atRiskList.length} aluno(s) com status 'em_risco' aguardando
                suporte prioritário.
                <br />• {pendingCriteria.staleProgressList.length} aluno(s) sem evolução recente há
                14+ dias.
                <br />• {pendingCriteria.nearCompletionList.length} aluno(s) com 90%+ aptos para
                certificado e próximo curso.
                {pendingCriteria.isBelowCompletionThreshold && (
                  <>
                    <br />• Taxa de conclusão atual ({completionRate}%) abaixo da meta de{' '}
                    {pendingCriteria.targetThreshold}%.
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Lista das 5 Regras Pedidas no Banco */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {automations.map((rule) => {
            const isToggling = togglingId === rule.id
            const isEditable = rule.rule_key === 'low_completion_manager_summary'
            const isEditing = editingTargetId === rule.id

            return (
              <div
                key={rule.id}
                className="p-4 rounded-2xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs sm:text-sm text-foreground leading-snug line-clamp-1">
                      {rule.name}
                    </span>
                    <Switch
                      checked={rule.enabled}
                      disabled={isToggling}
                      onCheckedChange={(checked) => handleToggle(rule, checked)}
                      className="data-[state=checked]:bg-purple-600 shrink-0"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {rule.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    {rule.enabled ? (
                      <Badge className="bg-emerald-600 text-white text-[9px] font-bold">
                        Ativa
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-[9px]">
                        Pausada
                      </Badge>
                    )}
                    {rule.days_threshold && rule.days_threshold > 0 ? (
                      <span className="font-mono text-[10px]">{rule.days_threshold}d gatilho</span>
                    ) : rule.threshold_value ? (
                      <span className="font-mono text-[10px]">Meta: {rule.threshold_value}%</span>
                    ) : null}
                  </div>

                  {/* Edição da meta percentual para regra 'e' */}
                  {isEditable && (
                    <div>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={customThreshold}
                            onChange={(e) => setCustomThreshold(Number(e.target.value) || 65)}
                            className="w-14 h-7 text-[11px] rounded-lg px-1.5 font-mono"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveThreshold(rule)}
                            className="h-7 px-2 text-[10px] rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Salvar
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomThreshold(rule.threshold_value || 65)
                            setEditingTargetId(rule.id)
                          }}
                          className="text-[10px] font-bold text-purple-600 hover:underline flex items-center gap-1"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Editar Meta ({rule.threshold_value || 65}%)</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
export default StudentAutomationsPanel
