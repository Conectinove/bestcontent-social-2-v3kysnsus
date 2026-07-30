import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Share2 } from 'lucide-react'
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

  const handleDrop = async (day: number) => {
    setDragOver(null)
    if (!dragId) return
    const newDate = new Date(year, month, day, 12, 0)
    try {
      await updateScheduledPost(dragId, { scheduled_at: newDate.toISOString() })
      toast({ title: 'Reagendado!', description: `Post movido para ${day}/${month + 1}.` })
    } catch (_) {
      toast({ title: 'Erro', description: 'Não foi possível reagendar.', variant: 'destructive' })
    }
    setDragId(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            Calendário <CalendarIcon className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Planeje e organize suas publicações.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg border border-border p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold px-3">
              {MONTHS[month]} {year}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={() => navigate('/app/content/new')}
            className="bg-primary text-white text-xs gap-1"
          >
            <Plus className="w-4 h-4" /> Agendar
          </Button>
        </div>
      </div>

      <Card className="p-4 overflow-x-auto">
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
                  className={`h-24 p-1.5 rounded-md border flex flex-col justify-between transition-all cursor-pointer ${isToday ? 'border-primary ring-1 ring-primary/40 bg-primary/5' : dragOver === dayNum ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 bg-card'}`}
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
                          <span className="truncate">
                            {post?.caption || post?.content || 'Post'}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Posts Agendados</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 my-2">
            {selectedDay?.map((s) => {
              const post = s.expand?.post
              const brand = post?.expand?.brand
              return (
                <div
                  key={s.id}
                  className="p-3 rounded-lg bg-muted space-y-2 text-xs border border-border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: brand?.color_theme || '#BF2A95' }}
                      />
                      <span className="font-semibold">{brand?.name || 'Marca'}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {post?.platform}
                    </Badge>
                  </div>
                  <p className="text-foreground leading-relaxed">
                    {post?.caption || post?.content}
                  </p>
                  <div className="flex justify-between items-center pt-1 border-t border-border">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(s.scheduled_at).toLocaleString('pt-BR')}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => sharePost(post?.caption || post?.content || '')}
                    >
                      <Share2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
