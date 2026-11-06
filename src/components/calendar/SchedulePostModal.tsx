import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  ScheduledPostRecord,
  createScheduledPost,
  updateScheduledPost,
  calculateNextRecurringDate,
} from '@/services/scheduled_posts'
import { getPosts, updatePost, createPost } from '@/services/posts'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Calendar,
  Clock,
  Repeat,
  Sparkles,
  Share2,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface SchedulePostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialDate?: Date
  editingScheduled?: ScheduledPostRecord | null
}

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: 'from-pink-500 to-rose-600' },
  { id: 'facebook', label: 'Facebook', color: 'from-blue-600 to-indigo-600' },
  { id: 'tiktok', label: 'TikTok', color: 'from-cyan-500 to-black' },
  { id: 'linkedin', label: 'LinkedIn', color: 'from-blue-700 to-cyan-700' },
  { id: 'youtube', label: 'YouTube', color: 'from-red-600 to-rose-700' },
  { id: 'x', label: 'X (Twitter)', color: 'from-zinc-800 to-black' },
  { id: 'pinterest', label: 'Pinterest', color: 'from-red-500 to-rose-600' },
  { id: 'whatsapp', label: 'WhatsApp', color: 'from-emerald-600 to-teal-700' },
  { id: 'email', label: 'Email Marketing', color: 'from-violet-600 to-indigo-600' },
]

export function SchedulePostModal({
  open,
  onOpenChange,
  onSuccess,
  initialDate,
  editingScheduled,
}: SchedulePostModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [mode, setMode] = useState<'existing' | 'new'>('new')
  const [existingPosts, setExistingPosts] = useState<any[]>([])
  const [selectedPostId, setSelectedPostId] = useState<string>('')

  // Campos para novo post
  const [newTitle, setNewTitle] = useState('')
  const [newCaption, setNewCaption] = useState('')
  const [newPlatform, setNewPlatform] = useState('instagram')

  // Data e hora do agendamento
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('10:00')

  // Recorrência
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceRule, setRecurrenceRule] = useState<
    'daily' | 'weekly' | 'weekdays' | 'monthly' | 'custom'
  >('weekly')
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 3, 5]) // Seg, Qua, Sex
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && user?.id) {
      getPosts({ user: user.id })
        .then((items) => {
          setExistingPosts(items.filter((p: any) => p.status !== 'published'))
        })
        .catch(() => {})
    }
  }, [open, user?.id])

  useEffect(() => {
    if (editingScheduled) {
      const dt = new Date(editingScheduled.scheduled_at)
      setScheduleDate(dt.toISOString().slice(0, 10))
      setScheduleTime(
        `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
      )
      setIsRecurring(Boolean(editingScheduled.is_recurring))
      if (editingScheduled.recurrence_rule) {
        setRecurrenceRule(editingScheduled.recurrence_rule)
      }
      if (editingScheduled.recurrence_days) {
        setSelectedWeekdays(editingScheduled.recurrence_days.split(',').map(Number))
      }
      setMode('existing')
      setSelectedPostId(editingScheduled.post || '')
    } else {
      const base = initialDate || new Date()
      setScheduleDate(base.toISOString().slice(0, 10))
      setScheduleTime('10:00')
      setIsRecurring(false)
      setRecurrenceRule('weekly')
      setSelectedWeekdays([1, 3, 5])
      setNewTitle('')
      setNewCaption('')
      setNewPlatform('instagram')
      setSelectedPostId('')
      setMode('new')
    }
  }, [editingScheduled, initialDate, open])

  const toggleWeekday = (dayNum: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum].sort(),
    )
  }

  const handleSave = async () => {
    if (!user?.id) {
      toast({ title: 'Usuário não autenticado', variant: 'destructive' })
      return
    }

    if (!scheduleDate || !scheduleTime) {
      toast({
        title: 'Selecione data e hora',
        description: 'Informe o momento do disparo.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const [h, m] = scheduleTime.split(':').map(Number)
      const scheduledDateTime = new Date(`${scheduleDate}T00:00:00`)
      scheduledDateTime.setHours(h || 10, m || 0, 0, 0)
      const scheduledIso = scheduledDateTime.toISOString()

      let targetPostId = selectedPostId

      // Se for criar post novo
      if (mode === 'new') {
        if (!newTitle.trim() && !newCaption.trim()) {
          toast({
            title: 'Conteúdo obrigatório',
            description: 'Preencha o título ou legenda do post.',
            variant: 'destructive',
          })
          setSaving(false)
          return
        }

        const created = await createPost({
          user: user.id,
          title: newTitle.trim() || 'Post agendado',
          caption: newCaption.trim(),
          platform: newPlatform,
          status: 'scheduled',
          scheduled_date: scheduledIso,
          scheduled_at: scheduledIso,
        })
        targetPostId = created.id
      } else {
        if (!targetPostId) {
          toast({
            title: 'Selecione um post existente',
            description: 'Escolha um post da lista para agendar.',
            variant: 'destructive',
          })
          setSaving(false)
          return
        }
        await updatePost(targetPostId, {
          status: 'scheduled',
          scheduled_date: scheduledIso,
          scheduled_at: scheduledIso,
        })
      }

      // Calcula próximo run se recorrente
      let nextRunIso = scheduledIso
      if (isRecurring) {
        const nextDt = calculateNextRecurringDate(
          recurrenceRule,
          scheduleTime,
          selectedWeekdays,
          scheduledDateTime,
        )
        nextRunIso = nextDt.toISOString()
      }

      const scheduledPayload: Record<string, unknown> = {
        user: user.id,
        post: targetPostId,
        scheduled_at: scheduledIso,
        status: 'scheduled',
        platform: mode === 'new' ? newPlatform : undefined,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring ? recurrenceRule : undefined,
        recurrence_days:
          isRecurring && recurrenceRule === 'custom' ? selectedWeekdays.join(',') : undefined,
        recurrence_time: isRecurring ? scheduleTime : undefined,
        next_run_at: isRecurring ? nextRunIso : undefined,
      }

      if (editingScheduled) {
        await updateScheduledPost(editingScheduled.id, scheduledPayload)
        toast({
          title: 'Agendamento atualizado!',
          description: `Disparo agendado para ${scheduledDateTime.toLocaleString('pt-BR')}.`,
        })
      } else {
        await createScheduledPost(scheduledPayload)
        toast({
          title: 'Post agendado com sucesso!',
          description: `Disparo registrado para ${scheduledDateTime.toLocaleString('pt-BR')}${
            isRecurring ? ' com recorrência ativa.' : '.'
          }`,
        })
      }

      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      toast({
        title: 'Erro ao agendar post',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const WEEKDAY_LABELS = [
    { num: 1, label: 'Seg' },
    { num: 2, label: 'Ter' },
    { num: 3, label: 'Qua' },
    { num: 4, label: 'Qui' },
    { num: 5, label: 'Sex' },
    { num: 6, label: 'Sáb' },
    { num: 0, label: 'Dom' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {editingScheduled ? 'Editar Agendamento' : 'Novo Agendamento de Post'}
          </DialogTitle>
          <DialogDescription>
            Defina data, hora, canal e frequência de publicação com persistência total no banco.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Seletor de Modo: Post Existente vs Criar Novo */}
          {!editingScheduled && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl">
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'new'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Criar Novo Post
              </button>
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'existing'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Escolher Post Existente ({existingPosts.length})
              </button>
            </div>
          )}

          {/* Modo: Novo Post */}
          {mode === 'new' && !editingScheduled && (
            <div className="space-y-3 p-3 rounded-xl border border-border/70 bg-card/60">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Título / Tema</label>
                <Input
                  placeholder="Ex: Lançamento de verão, Dica rápida..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Legenda do Post</label>
                <Textarea
                  placeholder="Escreva a legenda com hashtags e CTA..."
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Canal de Publicação</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNewPlatform(p.id)}
                      className={`text-xs py-1.5 px-2 rounded-lg border font-medium transition-all text-left truncate ${
                        newPlatform === p.id
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-border/60 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Modo: Post Existente */}
          {mode === 'existing' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Post a ser Agendado</label>
              <select
                value={selectedPostId}
                onChange={(e) => setSelectedPostId(e.target.value)}
                disabled={Boolean(editingScheduled)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Selecione um post...</option>
                {existingPosts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title || p.caption?.slice(0, 40) || 'Post sem título'} (
                    {p.platform || 'Geral'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Data e Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Data do Disparo
              </label>
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Horário (Janela)
              </label>
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
          </div>

          {/* Seção de Recorrência */}
          <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-primary" />
                <div>
                  <h4 className="text-xs font-bold text-foreground">Agendamento Recorrente</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Publicar repetidamente em horários e dias fixos
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                id="recurring-toggle"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-primary rounded accent-primary"
              />
            </div>

            {isRecurring && (
              <div className="space-y-3 pt-2 border-t border-border/60 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Frequência</label>
                  <select
                    value={recurrenceRule}
                    onChange={(e) => setRecurrenceRule(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                  >
                    <option value="daily">Todos os dias às {scheduleTime}</option>
                    <option value="weekdays">Dias de semana (Seg a Sex)</option>
                    <option value="weekly">Semanalmente (no mesmo dia da semana)</option>
                    <option value="custom">Dias específicos da semana</option>
                    <option value="monthly">Mensalmente</option>
                  </select>
                </div>

                {recurrenceRule === 'custom' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Dias Selecionados</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {WEEKDAY_LABELS.map((d) => (
                        <button
                          key={d.num}
                          type="button"
                          onClick={() => toggleWeekday(d.num)}
                          className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                            selectedWeekdays.includes(d.num)
                              ? 'bg-primary text-primary-foreground shadow-xs'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {saving
              ? 'Salvando...'
              : editingScheduled
                ? 'Atualizar Agendamento'
                : 'Confirmar Agendamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
