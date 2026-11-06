import { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { updateScheduledPost, ScheduledPostRecord } from '@/services/scheduled_posts'
import { toast } from '@/hooks/use-toast'

interface CalendarScheduleViewProps {
  scheduledPosts: ScheduledPostRecord[]
  onPostRescheduled: () => void
  onSelectPost?: (post: ScheduledPostRecord) => void
}

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

const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function CalendarScheduleView({
  scheduledPosts,
  onPostRescheduled,
  onSelectPost,
}: CalendarScheduleViewProps) {
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [dragPostId, setDragPostId] = useState<string | null>(null)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)
  const [isRescheduling, setIsRescheduling] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Navegações
  const handlePrev = () => {
    if (calendarView === 'month') {
      setCurrentDate(new Date(year, month - 1, 1))
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() - 7)
      setCurrentDate(d)
    }
  }

  const handleNext = () => {
    if (calendarView === 'month') {
      setCurrentDate(new Date(year, month + 1, 1))
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() + 7)
      setCurrentDate(d)
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Agrupamento de posts por YYYY-MM-DD
  const postsByDateStr = useMemo(() => {
    const map = new Map<string, ScheduledPostRecord[]>()
    scheduledPosts.forEach((s) => {
      const date = new Date(s.scheduled_at)
      if (!isNaN(date.getTime())) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        const arr = map.get(key) || []
        arr.push(s)
        map.set(key, arr)
      }
    })
    return map
  }, [scheduledPosts])

  // Lógica de Soltura (Drop) para reagendamento com persistência
  const handleDropOnDate = async (targetYear: number, targetMonth: number, targetDay: number) => {
    setDragOverDate(null)
    if (!dragPostId) return

    const postToMove = scheduledPosts.find((s) => s.id === dragPostId)
    if (!postToMove) return

    const prevDate = new Date(postToMove.scheduled_at)
    const hours = !isNaN(prevDate.getTime()) ? prevDate.getHours() : 10
    const mins = !isNaN(prevDate.getTime()) ? prevDate.getMinutes() : 0

    const newTargetDate = new Date(targetYear, targetMonth, targetDay, hours, mins, 0)

    setIsRescheduling(true)
    try {
      await updateScheduledPost(dragPostId, {
        scheduled_at: newTargetDate.toISOString(),
      })

      if (postToMove.post) {
        try {
          const { updatePost } = await import('@/services/posts')
          await updatePost(postToMove.post, { scheduled_date: newTargetDate.toISOString() })
        } catch {
          // ignora
        }
      }

      toast({
        title: 'Post reagendado com sucesso! 📅',
        description: `Movido para ${String(targetDay).padStart(2, '0')}/${String(targetMonth + 1).padStart(2, '0')} às ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}.`,
      })

      onPostRescheduled()
    } catch (err: any) {
      toast({
        title: 'Erro ao reagendar',
        description: err?.message || 'Não foi possível mover o post.',
        variant: 'destructive',
      })
    } finally {
      setIsRescheduling(false)
      setDragPostId(null)
    }
  }

  // Gera dias do mês
  const monthDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay()
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDayIndex, totalDaysInMonth }
  }, [year, month])

  // Gera dias da semana (visão semanal)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate)
    const dayOfWeek = curr.getDay() // 0 = Dom
    const sunday = new Date(curr)
    sunday.setDate(curr.getDate() - dayOfWeek)

    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i)
      days.push(d)
    }
    return days
  }, [currentDate])

  const now = new Date()

  return (
    <Card className="hi-card border-border/80 bg-card overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Barra de controle do calendário */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-archivo text-base font-black text-foreground flex items-center gap-2">
                <span>Visualização de Agendamento</span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold border-primary/30 text-primary"
                >
                  Arraste & Solte Ativo
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Arraste qualquer post para outro dia para reagendar instantaneamente no banco.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Mês / Semana */}
            <div className="flex items-center bg-muted/80 p-0.5 rounded-xl border border-border/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCalendarView('month')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  calendarView === 'month'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Mês
              </button>
              <button
                type="button"
                onClick={() => setCalendarView('week')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  calendarView === 'week'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Semana
              </button>
            </div>

            {/* Navegador de Data */}
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/80">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                className="h-7 w-7 rounded-lg"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="text-xs font-bold px-2 min-w-[110px] text-center truncate">
                {calendarView === 'month'
                  ? `${MONTHS[month]} ${year}`
                  : `Semana de ${weekDays[0].getDate()}/${weekDays[0].getMonth() + 1}`}
              </span>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="h-7 w-7 rounded-lg"
                aria-label="Próximo"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="text-xs h-8 font-semibold border-border/80"
            >
              Hoje
            </Button>
          </div>
        </div>

        {/* ===============================================================
            VISÃO MENSAL
            =============================================================== */}
        {calendarView === 'month' ? (
          <div className="overflow-x-auto">
            <div className="min-w-[620px]">
              {/* Cabeçalho dos Dias da Semana */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground mb-2">
                {DAYS_SHORT.map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid dos Dias do Mês */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* Espaços vazios no início */}
                {Array.from({ length: monthDays.firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-28 bg-muted/20 rounded-xl" />
                ))}

                {/* Dias do Mês */}
                {Array.from({ length: monthDays.totalDaysInMonth }).map((_, i) => {
                  const dayNum = i + 1
                  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                  const dayPosts = postsByDateStr.get(dateKey) || []
                  const currentDayOfWeek = new Date(year, month, dayNum).getDay()
                  const isWeekend = currentDayOfWeek === 0 || currentDayOfWeek === 6
                  const isToday =
                    dayNum === now.getDate() &&
                    month === now.getMonth() &&
                    year === now.getFullYear()
                  const isDragOver = dragOverDate === dateKey

                  return (
                    <div
                      key={dayNum}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDragOverDate(dateKey)
                      }}
                      onDragLeave={() => setDragOverDate(null)}
                      onDrop={() => handleDropOnDate(year, month, dayNum)}
                      className={`h-28 p-2 rounded-xl border flex flex-col justify-between transition-all ${
                        isToday
                          ? 'border-primary ring-2 ring-primary/40 bg-primary/10 shadow-xs'
                          : isDragOver
                            ? 'border-primary ring-2 ring-primary bg-primary/15'
                            : isWeekend
                              ? 'border-border/60 hover:border-border bg-muted/30'
                              : 'border-border/70 hover:border-border bg-card/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs font-bold ${
                              isToday
                                ? 'text-primary font-black px-1.5 py-0.2 rounded-md bg-primary/20'
                                : isWeekend
                                  ? 'text-muted-foreground'
                                  : 'text-foreground/90'
                            }`}
                          >
                            {dayNum}
                          </span>
                          {isToday && (
                            <span className="text-[8px] uppercase tracking-wider font-extrabold text-primary">
                              Hoje
                            </span>
                          )}
                        </div>
                        {dayPosts.length > 0 && (
                          <Badge
                            className={`text-[9px] px-1.5 py-0 font-bold ${
                              dayPosts.length >= 3
                                ? 'bg-amber-500 text-white'
                                : 'bg-primary/20 text-primary border border-primary/30'
                            }`}
                            title={`${dayPosts.length} post(s) agendado(s) neste dia`}
                          >
                            {dayPosts.length}
                          </Badge>
                        )}
                      </div>

                      {/* Lista de posts do dia */}
                      <div className="space-y-1 overflow-y-auto max-h-[72px] pr-0.5">
                        {dayPosts.map((s) => {
                          const post = s.expand?.post as
                            | (typeof s.expand.post & { platform?: string })
                            | undefined
                          const brand = post?.expand?.brand
                          const networkName = (post?.platform || 'Instagram').toLowerCase()
                          const timeStr = new Date(s.scheduled_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })

                          return (
                            <div
                              key={s.id}
                              draggable
                              onDragStart={() => setDragPostId(s.id)}
                              onClick={() => onSelectPost?.(s)}
                              className="p-1 rounded-lg bg-muted/80 text-[10px] font-medium flex items-center gap-1 cursor-grab active:cursor-grabbing hover:bg-primary/15 transition-colors border border-border/50"
                              title="Clique para ver detalhes ou arraste para outro dia"
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: brand?.color_theme || '#9333ea' }}
                              />
                              <Badge
                                variant="outline"
                                className="text-[8px] px-1 py-0 h-3.5 uppercase font-black tracking-tight shrink-0 bg-background/80 border-border/70 text-foreground/80"
                              >
                                {networkName.slice(0, 3)}
                              </Badge>
                              <span className="truncate flex-1 font-semibold text-foreground">
                                {post?.caption || post?.content || 'Post Agendado'}
                              </span>
                              <span className="text-[9px] font-bold text-primary font-mono shrink-0">
                                {timeStr}
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
          </div>
        ) : (
          /* ===============================================================
             VISÃO SEMANAL
             =============================================================== */
          <div className="overflow-x-auto">
            <div className="min-w-[620px] grid grid-cols-7 gap-2">
              {weekDays.map((d) => {
                const dayNum = d.getDate()
                const dMonth = d.getMonth()
                const dYear = d.getFullYear()
                const dateKey = `${dYear}-${String(dMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                const dayPosts = postsByDateStr.get(dateKey) || []
                const dDayOfWeek = d.getDay()
                const isWeekend = dDayOfWeek === 0 || dDayOfWeek === 6
                const isToday =
                  dayNum === now.getDate() &&
                  dMonth === now.getMonth() &&
                  dYear === now.getFullYear()
                const isDragOver = dragOverDate === dateKey

                return (
                  <div
                    key={dateKey}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOverDate(dateKey)
                    }}
                    onDragLeave={() => setDragOverDate(null)}
                    onDrop={() => handleDropOnDate(dYear, dMonth, dayNum)}
                    className={`min-h-[260px] p-2.5 rounded-2xl border flex flex-col justify-between transition-all ${
                      isToday
                        ? 'border-primary ring-2 ring-primary/40 bg-primary/10 shadow-xs'
                        : isDragOver
                          ? 'border-primary ring-2 ring-primary bg-primary/15'
                          : isWeekend
                            ? 'border-border/60 hover:border-border bg-muted/30'
                            : 'border-border/70 hover:border-border bg-card/60'
                    }`}
                  >
                    <div className="border-b border-border/50 pb-1.5 mb-2 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">
                            {DAYS_SHORT[d.getDay()]}
                          </p>
                          {isWeekend && (
                            <span className="text-[8px] px-1 py-0 rounded bg-muted text-muted-foreground font-semibold">
                              fds
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-sm font-black flex items-center gap-1 ${
                            isToday ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          <span>
                            {dayNum}/{dMonth + 1}
                          </span>
                          {isToday && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-primary bg-primary/20 px-1 py-0.5 rounded">
                              Hoje
                            </span>
                          )}
                        </p>
                      </div>
                      {dayPosts.length > 0 && (
                        <Badge
                          className={`text-[10px] px-1.5 py-0 font-bold ${
                            dayPosts.length >= 3
                              ? 'bg-amber-500 text-white'
                              : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          {dayPosts.length}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1 overflow-y-auto">
                      {dayPosts.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground/60 italic py-6 text-center">
                          Arraste posts aqui
                        </div>
                      ) : (
                        dayPosts.map((s) => {
                          const post = s.expand?.post as
                            | (typeof s.expand.post & { platform?: string })
                            | undefined
                          const brand = post?.expand?.brand
                          const timeStr = new Date(s.scheduled_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })

                          return (
                            <div
                              key={s.id}
                              draggable
                              onDragStart={() => setDragPostId(s.id)}
                              onClick={() => onSelectPost?.(s)}
                              className="p-2 rounded-xl bg-card border border-border/80 shadow-2xs space-y-1 cursor-grab active:cursor-grabbing hover:border-primary/60 transition-all"
                            >
                              <div className="flex items-center justify-between text-[10px] gap-1">
                                <span className="font-bold text-foreground truncate flex items-center gap-1">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: brand?.color_theme || '#9333ea' }}
                                  />
                                  <span className="truncate">{brand?.name || 'Marca'}</span>
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Badge
                                    variant="outline"
                                    className="text-[8px] px-1 py-0 h-3.5 uppercase font-black tracking-tight bg-muted/80 text-foreground/80"
                                  >
                                    {((post?.platform as string) || 'Insta').slice(0, 5)}
                                  </Badge>
                                  <span className="font-mono text-primary font-bold text-[9px]">
                                    {timeStr}
                                  </span>
                                </div>
                              </div>
                              <p className="text-[11px] text-muted-foreground line-clamp-2">
                                {post?.caption || post?.content || 'Post agendado'}
                              </p>
                            </div>
                          )
                        })
                      )}
                    </div>

                    <div className="pt-2 border-t border-border/40 text-[9px] text-muted-foreground text-center font-medium">
                      {dayPosts.length} agendamento{dayPosts.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
