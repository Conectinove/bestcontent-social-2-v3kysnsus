import React from 'react'
import { ScheduledPostRecord } from '@/services/scheduled_posts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Clock,
  Calendar,
  Repeat,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Share2,
  ArrowRight,
  Flame,
} from 'lucide-react'

interface ScheduledPostsListProps {
  scheduledPosts: ScheduledPostRecord[]
  onEdit: (scheduled: ScheduledPostRecord) => void
  onDelete: (id: string) => void
  onPublishNow: (scheduled: ScheduledPostRecord) => void
  onNewSchedule: () => void
}

export function ScheduledPostsList({
  scheduledPosts,
  onEdit,
  onDelete,
  onPublishNow,
  onNewSchedule,
}: ScheduledPostsListProps) {
  const now = new Date()

  // Ordena por scheduled_at crescente
  const sorted = [...scheduledPosts].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
  )

  const pendingOrScheduled = sorted.filter(
    (s) => s.status === 'scheduled' || s.status === 'pending' || !s.status,
  )

  const nextPost = pendingOrScheduled.find((s) => new Date(s.scheduled_at) >= now)

  const formatScheduledDate = (iso: string) => {
    try {
      const dt = new Date(iso)
      const isToday = dt.toDateString() === now.toDateString()
      const timeStr = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      if (isToday) return `Hoje às ${timeStr}`
      return `${dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${timeStr}`
    } catch {
      return iso
    }
  }

  const getRecurrenceBadge = (s: ScheduledPostRecord) => {
    if (!s.is_recurring) return null
    if (s.recurrence_rule === 'daily') return 'Diário'
    if (s.recurrence_rule === 'weekdays') return 'Seg a Sex'
    if (s.recurrence_rule === 'weekly') return 'Semanal'
    if (s.recurrence_rule === 'custom') return `Dias (${s.recurrence_days || 'custom'})`
    if (s.recurrence_rule === 'monthly') return 'Mensal'
    return 'Recorrente'
  }

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Fila de Posts Agendados
            <Badge variant="outline" className="text-xs font-mono ml-1">
              {pendingOrScheduled.length}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Acompanhe o próximo disparo, recorrência configurada e gerencie horários com
            persistência no banco.
          </CardDescription>
        </div>

        {nextPost && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>
              Próximo disparo:{' '}
              <strong className="font-bold">{formatScheduledDate(nextPost.scheduled_at)}</strong>
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {pendingOrScheduled.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-xl">
            <Calendar className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Nenhum post agendado no momento</p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-3">
              Crie um novo agendamento ou use o botão &ldquo;Preencher Semana&rdquo; para distribuir
              sua fila.
            </p>
            <Button size="sm" onClick={onNewSchedule}>
              Agendar Primeiro Post
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {pendingOrScheduled.map((s) => {
              const dt = new Date(s.scheduled_at)
              const isPast = dt < now
              const recurrenceLabel = getRecurrenceBadge(s)
              const postTitle =
                s.expand?.post?.title || s.expand?.post?.caption?.slice(0, 50) || 'Post agendado'

              return (
                <div
                  key={s.id}
                  className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-muted/20 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isPast
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                          {postTitle}
                        </span>

                        {s.platform && (
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {s.platform}
                          </Badge>
                        )}

                        {recurrenceLabel && (
                          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] gap-1">
                            <Repeat className="w-2.5 h-2.5" />
                            {recurrenceLabel}
                          </Badge>
                        )}

                        {isPast && (
                          <Badge variant="destructive" className="text-[10px]">
                            Atrasado
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium text-foreground">
                          {formatScheduledDate(s.scheduled_at)}
                        </span>
                        {s.next_run_at && s.is_recurring && (
                          <span className="text-[11px]">
                            Próx:{' '}
                            {new Date(s.next_run_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                        {s.auto_queue && (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                            • Fila inteligente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPublishNow(s)}
                      className="h-8 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-500/30"
                      title="Disparar publicação agora"
                    >
                      Publicar agora
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(s)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Editar agendamento"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(s.id)}
                      className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      title="Excluir agendamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
