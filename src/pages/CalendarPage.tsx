import { useState } from 'react'
import { useNavigate } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Instagram,
  Globe,
  Twitter,
} from 'lucide-react'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function CalendarPage() {
  const { posts, selectedBrandId } = useSocial()
  const navigate = useNavigate()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDayPosts, setSelectedDayPosts] = useState<any[] | null>(null)

  const monthNames = [
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

  const filteredPosts = posts.filter((p) => {
    if (selectedBrandId !== 'all' && p.brandId !== selectedBrandId) return false
    return true
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getPostsForDay = (dayNumber: number) => {
    return filteredPosts.filter((p) => {
      const d = p.scheduledDate ? new Date(p.scheduledDate) : null
      if (!d) return false
      return d.getDate() === dayNumber && d.getMonth() === month && d.getFullYear() === year
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            Calendário de Conteúdo
            <CalendarIcon className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Planeje, visualize e organize suas publicações do mês.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-muted rounded-lg border border-border p-1">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold px-3">
              {monthNames[month]} {year}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={() => navigate('/app/content/new')}
            className="bg-primary text-white text-xs font-medium gap-1"
          >
            <Plus className="w-4 h-4" />
            Agendar Post
          </Button>
        </div>
      </div>

      {/* Monthly Grid */}
      <Card className="p-4 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-2">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty slots for start padding */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-24 bg-muted/20 rounded-md" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1
              const dayPosts = getPostsForDay(dayNum)
              const isToday =
                dayNum === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear()

              return (
                <div
                  key={dayNum}
                  onClick={() => dayPosts.length > 0 && setSelectedDayPosts(dayPosts)}
                  className={`h-24 p-1.5 rounded-md border flex flex-col justify-between transition-all cursor-pointer ${
                    isToday
                      ? 'border-primary ring-1 ring-primary/40 bg-primary/5'
                      : 'border-border hover:border-primary/50 bg-card'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-semibold ${
                        isToday ? 'text-primary font-bold' : 'text-foreground'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayPosts.length > 0 && (
                      <Badge className="bg-primary text-white text-[9px] px-1 py-0">
                        {dayPosts.length} post{dayPosts.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {dayPosts.slice(0, 2).map((p) => (
                      <div
                        key={p.id}
                        className="p-1 rounded bg-muted text-[10px] truncate font-medium flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="truncate">{p.caption}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Day Posts Detail Dialog */}
      <Dialog open={!!selectedDayPosts} onOpenChange={() => setSelectedDayPosts(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Posts Agendados</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 my-2">
            {selectedDayPosts?.map((post) => (
              <div
                key={post.id}
                className="p-3 rounded-lg bg-muted space-y-2 text-xs border border-border"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary capitalize">{post.platform}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {post.status}
                  </Badge>
                </div>
                <p className="text-foreground leading-relaxed">{post.caption}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
