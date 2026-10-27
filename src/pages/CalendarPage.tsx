import { useState, useEffect, useCallback } from 'react'
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
} from 'lucide-react'
import { SmartWeeklyPlanModal } from '@/components/analytics/SmartWeeklyPlanModal'
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

  const load = useCallback(async () => {
    if (!user?.id) return
    try {
      setScheduled((await getScheduledPosts(user.id)) as any[])
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
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-muted/80 rounded-2xl border border-border/80 p-1 shadow-xs">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-bold px-3 min-w-[120px] text-center text-foreground">
              {MONTHS[month]} {year}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => setSmartPlanOpen(true)}
            className="border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 text-xs font-bold rounded-2xl h-10 px-4 gap-2 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span>Fila Semanal IA</span>
          </Button>

          <Button
            onClick={() => navigate('/app/content/new')}
            className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-2xl h-10 px-4 gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Agendar Novo Post
          </Button>
        </div>
      </div>

      {/* Modal IA de Fila Semanal Inteligente */}
      <SmartWeeklyPlanModal
        open={smartPlanOpen}
        onOpenChange={setSmartPlanOpen}
        onSuccessPlanApplied={() => load()}
      />

      <Card className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-2">
            {DAYS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} className="h-24 bg-muted/20 rounded-md" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1
              const dayPosts = getPostsForDay(dayNum)
              const isToday =
                dayNum === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear()
              return (
                <div
                  key={dayNum}
                  onClick={() => dayPosts.length > 0 && setSelectedDay(dayPosts)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(dayNum)
                  }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={() => handleDrop(dayNum)}
                  draggable={false}
                  className={`h-28 p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${isToday ? 'border-primary ring-2 ring-primary/30 bg-purple-500/5' : dragOver === dayNum ? 'border-primary bg-primary/10' : 'border-border/70 hover:border-primary/50 bg-card/60 shadow-2xs'}`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-semibold ${isToday ? 'text-primary font-bold' : ''}`}
                    >
                      {dayNum}
                    </span>
                    {dayPosts.length > 0 && (
                      <Badge className="bg-primary text-white text-[9px] px-1">
                        {dayPosts.length}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    {dayPosts.slice(0, 2).map((s) => {
                      const post = s.expand?.post
                      const brand = post?.expand?.brand
                      return (
                        <div
                          key={s.id}
                          draggable
                          onDragStart={() => setDragId(s.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded bg-muted text-[10px] truncate font-medium flex items-center gap-1 cursor-move hover:bg-primary/10"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: brand?.color_theme || '#BF2A95' }}
                          />
                          <span className="truncate flex-1">
                            {post?.caption || post?.content || 'Post'}
                          </span>
                          <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 shrink-0 font-mono">
                            ⏰{' '}
                            {new Date(s.scheduled_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

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
