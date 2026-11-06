import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Share2,
  Sparkles,
  Clock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ListOrdered,
  LayoutGrid,
  Send,
  FastForward,
  Zap,
} from 'lucide-react'
import { SmartWeeklyPlanModal } from '@/components/analytics/SmartWeeklyPlanModal'
import { SchedulePostModal } from '@/components/calendar/SchedulePostModal'
import { ScheduledPostsList } from '@/components/calendar/ScheduledPostsList'
import { CalendarScheduleView } from '@/components/calendar/CalendarScheduleView'
import {
  NETWORK_BEST_TIMES_MAP,
  getPostsQueueForAutoScheduling,
  autoDistributeQueueAcrossWeek,
  removePostFromAutoQueue,
} from '@/services/smart-scheduler'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { getScheduledPosts, updateScheduledPost } from '@/services/scheduled_posts'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { sharePost } from '@/lib/share'
import { toast } from '@/hooks/use-toast'

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function CalendarPage() {
  const { user } = useAuth()
  const { selectedBrandId } = useSocial()
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduled, setScheduled] = useState<any[]>([])
  const [selectedDay, setSelectedDay] = useState<any[] | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [smartPlanOpen, setSmartPlanOpen] = useState(false)
  const [editingPostTimeId, setEditingPostTimeId] = useState<string | null>(null)
  const [editTimeValue, setEditTimeValue] = useState('12:00')
  const [editDateValue, setEditDateValue] = useState('')
  const [viewMode, setViewMode] = useState<'calendar' | 'next7days' | 'queue'>('calendar')
  const [autoQueuePosts, setAutoQueuePosts] = useState<any[]>([])
  const [loadingAutoQueue, setLoadingAutoQueue] = useState(false)
  const [isDistributing, setIsDistributing] = useState(false)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [editingScheduleItem, setEditingScheduleItem] = useState<any | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    try {
      setScheduled((await getScheduledPosts(user.id)) as any[])
      const queue = await getPostsQueueForAutoScheduling(user.id)
      setAutoQueuePosts(queue)
    } catch {
      /* intentionally ignored */
    }
  }, [user?.id])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('scheduled_posts', () => load(), !!user?.id)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const filtered = scheduled.filter((s) => {
    if (selectedBrandId !== 'all') return s.expand?.post?.brand === selectedBrandId
    return true
  })

  const getPostsForDay = (day: number) =>
    filtered.filter((s) => {
      const d = new Date(s.scheduled_at)
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
    })

  // Cálculos de Status de Agendamento: atrasados, próximos 7 dias e publicados
  const now = new Date()

  // Posts atrasados: data agendada no passado e post não marcado como publicado
  const overduePosts = useMemo(() => {
    return filtered.filter((s) => {
      const schedDate = new Date(s.scheduled_at)
      const postStatus = s.expand?.post?.status || s.status
      return schedDate < now && postStatus !== 'published'
    })
  }, [filtered, now])

  // Posts dos próximos 7 dias
  const next7DaysPosts = useMemo(() => {
    const endWindow = new Date(now.getTime() + 7 * 24 * 3600 * 1000)
    return filtered
      .filter((s) => {
        const schedDate = new Date(s.scheduled_at)
        return schedDate >= new Date(now.getTime() - 24 * 3600 * 1000) && schedDate <= endWindow
      })
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  }, [filtered, now])

  // Ação rápida: Adiar 1 dia (+24h)
  const handlePostponeOneDay = async (scheduledId: string, currentIso: string) => {
    try {
      const cur = new Date(currentIso)
      const nextDay = new Date(cur.getTime() + 24 * 3600 * 1000)
      await updateScheduledPost(scheduledId, { scheduled_at: nextDay.toISOString() })

      const item = scheduled.find((s) => s.id === scheduledId)
      if (item?.post) {
        try {
          const { updatePost } = await import('@/services/posts')
          await updatePost(item.post, { scheduled_date: nextDay.toISOString() })
        } catch {
          /* intentionally ignored */
        }
      }

      toast({
        title: 'Adiado por 1 dia!',
        description: `Nova data: ${nextDay.toLocaleDateString('pt-BR')} às ${nextDay.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`,
      })
      await load()
    } catch (err: any) {
      toast({
        title: 'Erro ao adiar post',
        description: err?.message || 'Não foi possível alterar a data.',
        variant: 'destructive',
      })
    }
  }

  // Ação rápida: Publicar Agora
  const handlePublishNow = async (s: any) => {
    try {
      if (s.post) {
        const { updatePost } = await import('@/services/posts')
        await updatePost(s.post, { status: 'published', published_at: new Date().toISOString() })
      }
      toast({
        title: 'Publicado com Sucesso!',
        description: `O post foi marcado como publicado em tempo real.`,
      })
      await load()
    } catch (err: any) {
      toast({
        title: 'Erro ao publicar',
        description: err?.message || 'Falha ao acionar publicação imediata.',
        variant: 'destructive',
      })
    }
  }

  // Executa o preenchimento automático da semana com os posts da fila
  const handleAutoFillWeek = async () => {
    if (!user?.id || autoQueuePosts.length === 0) return
    setIsDistributing(true)
    try {
      const result = await autoDistributeQueueAcrossWeek(
        user.id,
        autoQueuePosts,
        selectedBrandId !== 'all' ? selectedBrandId : undefined,
      )
      if (result.scheduledCount > 0) {
        toast({
          title: 'Semana preenchida automaticamente!',
          description: `${result.scheduledCount} posts distribuídos nos melhores horários dos próximos 7 dias.`,
        })
      } else {
        toast({
          title: 'Nenhum post agendado',
          description: result.errors[0] || 'Verifique se há posts na fila.',
          variant: 'destructive',
        })
      }
      await load()
    } catch (err: any) {
      toast({
        title: 'Erro no agendamento automático',
        description: err?.message || 'Falha ao processar distribuição.',
        variant: 'destructive',
      })
    } finally {
      setIsDistributing(false)
    }
  }

  // Retira um post da fila automática
  const handleRemoveFromAutoQueue = async (postId: string, tags: string[] = []) => {
    try {
      const ok = await removePostFromAutoQueue(postId, tags)
      if (ok) {
        toast({
          title: 'Post retirado da fila',
          description: 'O status voltou para rascunho.',
        })
        await load()
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao retirar post',
        description: err?.message || 'Não foi possível alterar o post.',
        variant: 'destructive',
      })
    }
  }

  // Melhores horários consolidados por rede
  const bestTimesByNetwork = useMemo(() => {
    const igDays = NETWORK_BEST_TIMES_MAP.instagram?.days || []
    const ttDays = NETWORK_BEST_TIMES_MAP.tiktok?.days || []
    const liDays = NETWORK_BEST_TIMES_MAP.linkedin?.days || []

    return [
      {
        network: 'Instagram',
        badge: 'IG Feed & Reels',
        color: 'from-pink-500 to-rose-600',
        best: igDays.slice(0, 2).map((d) => ({ day: d.day.split('-')[0], time: d.hour })),
      },
      {
        network: 'TikTok',
        badge: 'Vídeos Curtos',
        color: 'from-cyan-500 to-black',
        best: ttDays.slice(0, 2).map((d) => ({ day: d.day.split('-')[0], time: d.hour })),
      },
      {
        network: 'LinkedIn',
        badge: 'B2B & Carreira',
        color: 'from-blue-600 to-indigo-700',
        best: liDays.slice(0, 2).map((d) => ({ day: d.day.split('-')[0], time: d.hour })),
      },
      {
        network: 'Substack',
        badge: 'Newsletter Longform',
        color: 'from-orange-500 to-amber-600',
        best: [
          { day: 'Domingo', time: '09:00' },
          { day: 'Quinta', time: '08:00' },
        ],
      },
    ]
  }, [])

  const handleUpdateTime = async (scheduledId: string) => {
    try {
      if (!editDateValue || !editTimeValue) return
      const [h, m] = editTimeValue.split(':').map(Number)
      const targetDate = new Date(`${editDateValue}T00:00:00`)
      targetDate.setHours(h || 12, m || 0, 0, 0)
      await updateScheduledPost(scheduledId, { scheduled_at: targetDate.toISOString() })

      const item = scheduled.find((s) => s.id === scheduledId)
      if (item?.post) {
        try {
          const { updatePost } = await import('@/services/posts')
          await updatePost(item.post, { scheduled_date: targetDate.toISOString() })
        } catch {
          /* intentionally ignored */
        }
      }

      toast({
        title: 'Horário Atualizado!',
        description: `Agendamento ajustado para ${targetDate.toLocaleString('pt-BR')}.`,
      })
      setEditingPostTimeId(null)
      await load()
      setSelectedDay(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao reagendar',
        description: err?.message || 'Não foi possível alterar a data/horário.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteScheduled = async (scheduledId: string) => {
    try {
      const { deleteScheduledPost } = await import('@/services/scheduled_posts')
      await deleteScheduledPost(scheduledId)
      toast({
        title: 'Agendamento removido',
        description: 'O post foi retirado da grade.',
      })
      await load()
      setSelectedDay((prev) => (prev ? prev.filter((s) => s.id !== scheduledId) : null))
    } catch (err: any) {
      toast({
        title: 'Erro ao remover',
        description: err?.message || 'Falha ao excluir agendamento.',
        variant: 'destructive',
      })
    }
  }

  const handleDrop = async (day: number) => {
    setDragOver(null)
    if (!dragId) return
    const currentPost = scheduled.find((s) => s.id === dragId)
    const prevDate = currentPost ? new Date(currentPost.scheduled_at) : null
    const hour = prevDate && !isNaN(prevDate.getTime()) ? prevDate.getHours() : 12
    const minute = prevDate && !isNaN(prevDate.getTime()) ? prevDate.getMinutes() : 0
    const newDate = new Date(year, month, day, hour, minute)
    try {
      await updateScheduledPost(dragId, { scheduled_at: newDate.toISOString() })
      // Se tiver o post associado, atualiza também a data do post
      if (currentPost?.post) {
        try {
          const { updatePost } = await import('@/services/posts')
          await updatePost(currentPost.post, { scheduled_date: newDate.toISOString() })
        } catch {
          /* intentionally ignored */
        }
      }
      toast({
        title: 'Reagendado com sucesso!',
        description: `Post movido para ${day}/${month + 1} às ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}.`,
      })
      load()
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Não foi possível reagendar.',
        variant: 'destructive',
      })
    }
    setDragId(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/10 text-primary flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Calendário Editorial
            </h1>
            <Badge
              variant="secondary"
              className="bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800"
            >
              Planejamento Global
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Arraste para reagendar e organize a grade de publicações de todas as suas marcas.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <div className="flex items-center bg-muted/80 rounded-2xl border border-border/80 p-1 shadow-xs flex-1 sm:flex-initial justify-between sm:justify-start">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-bold px-2 sm:px-3 min-w-[100px] sm:min-w-[120px] text-center text-foreground truncate">
              {MONTHS[month]} {year}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => setSmartPlanOpen(true)}
            className="border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 text-xs font-bold rounded-2xl h-10 px-3 sm:px-4 gap-1.5 sm:gap-2 shadow-xs flex-1 sm:flex-initial justify-center"
          >
            <Sparkles className="w-4 h-4 text-pink-500 shrink-0" />
            <span className="truncate">Fila Semanal IA</span>
          </Button>

          {autoQueuePosts.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleAutoFillWeek}
              disabled={isDistributing}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-2xl h-10 px-3 sm:px-4 gap-1.5 sm:gap-2 shadow-xs flex-1 sm:flex-initial justify-center"
              title="Distribui os posts rascunhos/aprovados pelos melhores horários dos próximos 7 dias"
            >
              <Zap className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="truncate">
                {isDistributing ? 'Distribuindo...' : `Preencher Semana (${autoQueuePosts.length})`}
              </span>
            </Button>
          )}

          <Button
            onClick={() => setScheduleModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-2xl h-10 px-3 sm:px-4 gap-1.5 shadow-xs flex-1 sm:flex-initial justify-center"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">Novo Agendamento</span>
          </Button>
        </div>
      </div>

      {/* Modal IA de Fila Semanal Inteligente */}
      <SmartWeeklyPlanModal
        open={smartPlanOpen}
        onOpenChange={setSmartPlanOpen}
        onSuccessPlanApplied={() => load()}
      />

      {/* KPIs de Agendamento com Destaque para Posts Atrasados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 rounded-2xl border-border/80 bg-card shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-semibold">Total Agendados</span>
            <p className="text-2xl font-black text-foreground">{filtered.length}</p>
            <span className="text-[10px] text-muted-foreground">Em todas as marcas</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </Card>

        <Card
          className={`p-4 rounded-2xl shadow-xs flex items-center justify-between transition-all ${
            overduePosts.length > 0
              ? 'border-2 border-rose-500/40 bg-rose-500/10'
              : 'border-border/80 bg-card'
          }`}
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                Atrasados (Data Passada)
              </span>
              {overduePosts.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {overduePosts.length}
            </p>
            <span className="text-[10px] text-rose-700/80 dark:text-rose-300">
              {overduePosts.length > 0
                ? 'Exigem ação imediata (adiar ou publicar)'
                : 'Nenhum atraso'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-border/80 bg-card shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-semibold">Próximos 7 Dias</span>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {next7DaysPosts.length}
            </p>
            <span className="text-[10px] text-muted-foreground">Grade da semana ativa</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <ListOrdered className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-border/80 bg-card shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-semibold">Publicados / OK</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {filtered.filter((s) => (s.expand?.post?.status || s.status) === 'published').length}
            </p>
            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300">
              Disparados com sucesso
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Caixa de Sugestão de Melhores Horários por Rede */}
      <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-transparent space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground">
                Melhores Horários Sugeridos pelo Algoritmo (Multi-Rede)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Baseados no comportamento de engajamento do seu público no Instagram, TikTok,
                LinkedIn e Substack.
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] border-purple-500/30 text-purple-600 self-start sm:self-auto"
          >
            Calibrado por Canal
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {bestTimesByNetwork.map((item) => (
            <div
              key={item.network}
              className="p-3 rounded-xl bg-card border border-border/70 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">{item.network}</span>
                <span className="text-[9px] text-muted-foreground">{item.badge}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {item.best.slice(0, 2).map((bt: any, bIdx: number) => (
                  <span
                    key={bIdx}
                    className="px-2 py-0.5 rounded-lg bg-muted text-[11px] font-mono font-bold text-foreground flex items-center gap-1"
                  >
                    <span>{bt.day}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-extrabold">
                      {bt.time}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Seletor de Visão: Calendário Mensal vs. Visão de Lista Próximos 7 Dias */}
      <div className="flex items-center justify-between gap-3 border-b border-border/80 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[38px] ${
              viewMode === 'calendar'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendário Interativo (Mês/Semana)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('next7days')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[38px] ${
              viewMode === 'next7days'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Próximos 7 Dias ({next7DaysPosts.length})</span>
            {overduePosts.length > 0 && (
              <Badge className="bg-rose-500 text-white text-[9px] px-1.5 py-0 h-4">
                {overduePosts.length} atrasados
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('queue')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[38px] ${
              viewMode === 'queue'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Fila Completa ({scheduled.length})</span>
          </button>
        </div>
      </div>

      {/* Visão: Fila Completa de Posts Agendados */}
      {viewMode === 'queue' && (
        <ScheduledPostsList
          scheduledPosts={filtered}
          onEdit={(s) => {
            setEditingScheduleItem(s)
            setScheduleModalOpen(true)
          }}
          onDelete={(id) => handleDeleteScheduled(id)}
          onPublishNow={(s) => handlePublishNow(s)}
          onNewSchedule={() => {
            setEditingScheduleItem(null)
            setScheduleModalOpen(true)
          }}
        />
      )}

      {/* Visão: Calendário Interativo Mês / Semana com Arrastar e Soltar */}
      {viewMode === 'calendar' && (
        <CalendarScheduleView
          scheduledPosts={filtered}
          onPostRescheduled={() => load()}
          onSelectPost={(s) => {
            setSelectedDay([s])
          }}
        />
      )}

      {/* Visão de Lista: Próximos 7 Dias com Ações Rápidas & Destaque de Atrasados */}
      {viewMode === 'next7days' ? (
        <div className="space-y-4">
          {overduePosts.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Publicações Atrasadas ({overduePosts.length})</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  A data prevista expirou sem confirmação de disparo.
                </span>
              </div>

              <div className="space-y-2">
                {overduePosts.map((s) => {
                  const post = s.expand?.post
                  const brand = post?.expand?.brand
                  return (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl bg-card border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: brand?.color_theme || '#e11d48' }}
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-foreground">
                              {brand?.name || 'Marca'}
                            </span>
                            <Badge className="bg-rose-500 text-white text-[9px] px-1.5 py-0 font-bold">
                              Atrasado
                            </Badge>
                            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-mono font-semibold">
                              Deveria ter saído em:{' '}
                              {new Date(s.scheduled_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {post?.caption || post?.content || 'Sem texto'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <Button
                          size="sm"
                          onClick={() => handlePublishNow(s)}
                          className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1 font-bold min-h-[36px]"
                        >
                          <Send className="w-3 h-3" />
                          <span>Publicar Agora</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePostponeOneDay(s.id, s.scheduled_at)}
                          className="h-8 px-2.5 text-xs border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 rounded-xl gap-1 min-h-[36px]"
                        >
                          <FastForward className="w-3 h-3" />
                          <span>Adiar 1 Dia</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const d = new Date(s.scheduled_at)
                            setEditDateValue(d.toISOString().slice(0, 10))
                            setEditTimeValue(
                              `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
                            )
                            setEditingPostTimeId(s.id)
                            setSelectedDay([s])
                          }}
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-xl min-h-[36px]"
                        >
                          <Clock className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteScheduled(s.id)}
                          className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-500/10 rounded-xl min-h-[36px]"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Lista Linear dos Próximos 7 Dias */}
          <div className="space-y-2.5">
            <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-purple-600" />
              <span>Cronograma da Semana</span>
            </h4>

            {next7DaysPosts.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-border/80 rounded-2xl bg-card/40 space-y-1">
                <Clock className="w-6 h-6 text-muted-foreground mx-auto" />
                <p className="text-xs font-bold text-foreground">
                  Nenhum post agendado para os próximos 7 dias
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Use o botão "+ Agendar Novo Post" ou a "Fila Semanal IA" para preencher a grade.
                </p>
              </div>
            ) : (
              next7DaysPosts.map((s) => {
                const post = s.expand?.post
                const brand = post?.expand?.brand
                const schedDate = new Date(s.scheduled_at)
                const isPast = schedDate < now
                const isPublished = (post?.status || s.status) === 'published'

                return (
                  <div
                    key={s.id}
                    className={`p-3.5 rounded-2xl bg-card border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isPast && !isPublished
                        ? 'border-rose-500/40 bg-rose-500/5'
                        : 'border-border/80 hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 mt-1 sm:mt-0"
                        style={{ backgroundColor: brand?.color_theme || '#9333ea' }}
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-foreground">
                            {brand?.name || 'Marca'}
                          </span>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {post?.platform || 'Social'}
                          </Badge>
                          {isPublished ? (
                            <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0">
                              Publicado
                            </Badge>
                          ) : isPast ? (
                            <Badge className="bg-rose-500 text-white text-[9px] px-1.5 py-0">
                              Atrasado
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[9px] px-1.5 py-0">
                              Agendado
                            </Badge>
                          )}
                          <span className="text-[11px] text-muted-foreground font-mono">
                            📅{' '}
                            {schedDate.toLocaleDateString('pt-BR', {
                              weekday: 'short',
                              day: '2-digit',
                              month: '2-digit',
                            })}{' '}
                            às{' '}
                            {schedDate.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/90 line-clamp-1 max-w-xl">
                          {post?.caption || post?.content || 'Sem texto de publicação'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {!isPublished && (
                        <Button
                          size="sm"
                          onClick={() => handlePublishNow(s)}
                          className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1 font-bold min-h-[36px]"
                        >
                          <Send className="w-3 h-3" />
                          <span>Publicar Agora</span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePostponeOneDay(s.id, s.scheduled_at)}
                        className="h-8 px-2.5 text-xs border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 rounded-xl gap-1 min-h-[36px]"
                        title="Adiar publicação em 24h"
                      >
                        <FastForward className="w-3 h-3" />
                        <span>Adiar 1 Dia</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const d = new Date(s.scheduled_at)
                          setEditDateValue(d.toISOString().slice(0, 10))
                          setEditTimeValue(
                            `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
                          )
                          setEditingPostTimeId(s.id)
                          setSelectedDay([s])
                        }}
                        className="h-8 px-2 text-xs text-purple-600 hover:bg-purple-500/10 rounded-xl min-h-[36px]"
                        title="Trocar data ou horário"
                      >
                        <Clock className="w-3 h-3" />
                        <span className="hidden sm:inline text-[11px]">Horário</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteScheduled(s.id)}
                        className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-500/10 rounded-xl min-h-[36px]"
                        title="Excluir agendamento"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : null}

      {/* Modal Dedicado de Criação e Edição de Agendamento com Recorrência */}
      <SchedulePostModal
        open={scheduleModalOpen}
        onOpenChange={(op) => {
          setScheduleModalOpen(op)
          if (!op) setEditingScheduleItem(null)
        }}
        editingScheduled={editingScheduleItem}
        onSuccess={() => load()}
      />

      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              Posts Agendados ({selectedDay?.length || 0})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 my-2">
            {selectedDay?.map((s) => {
              const post = s.expand?.post
              const brand = post?.expand?.brand
              return (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl bg-muted/50 space-y-2 text-xs border border-border/70 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: brand?.color_theme || '#BF2A95' }}
                      />
                      <span className="font-semibold">{brand?.name || 'Marca'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 font-bold"
                      >
                        ⏰ Agendado para{' '}
                        {new Date(s.scheduled_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                        })}{' '}
                        às{' '}
                        {new Date(s.scheduled_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {post?.platform}
                      </Badge>
                    </div>
                  </div>{' '}
                  <p className="text-foreground leading-relaxed">
                    {post?.caption || post?.content}
                  </p>
                  {editingPostTimeId === s.id ? (
                    <div className="p-2.5 rounded-xl bg-card border border-primary/40 space-y-2 mt-2">
                      <p className="text-[11px] font-bold text-foreground">
                        Ajustar Data e Horário:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={editDateValue}
                          onChange={(e) => setEditDateValue(e.target.value)}
                          className="text-xs bg-muted border border-border rounded-lg px-2 py-1 text-foreground"
                        />
                        <input
                          type="time"
                          value={editTimeValue}
                          onChange={(e) => setEditTimeValue(e.target.value)}
                          className="text-xs bg-muted border border-border rounded-lg px-2 py-1 text-foreground"
                        />
                      </div>
                      <div className="flex justify-end gap-1.5 pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingPostTimeId(null)}
                          className="h-7 text-xs rounded-lg"
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateTime(s.id)}
                          className="h-7 text-xs bg-primary text-white rounded-lg"
                        >
                          Salvar Horário
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center pt-1 border-t border-border">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(s.scheduled_at).toLocaleString('pt-BR')}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] rounded-lg text-purple-600 dark:text-purple-400 gap-1 hover:bg-purple-500/10"
                          onClick={() => {
                            const d = new Date(s.scheduled_at)
                            setEditDateValue(d.toISOString().slice(0, 10))
                            setEditTimeValue(
                              `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
                            )
                            setEditingPostTimeId(s.id)
                          }}
                        >
                          <Clock className="w-3 h-3" /> Trocar Horário
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => sharePost(post?.caption || post?.content || '')}
                        >
                          <Share2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteScheduled(s.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
