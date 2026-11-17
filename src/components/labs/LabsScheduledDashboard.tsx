import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarClock,
  CalendarX2,
  Loader2,
  Pencil,
  RefreshCw,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { pb } from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  cancelSchedule,
  deletePost,
  listScheduledPosts,
  reschedulePost,
  updatePostContent,
  type LabsScheduledPost,
} from '@/services/labs-scheduled'

// =========================================================================
// Dashboard de agendamento (aba Post do Labs)
// Lista posts ordenados por data com filtro por status (todos/draft/
// scheduled/published), remarcar, editar conteúdo, cancelar (volta para
// rascunho) ou excluir.
// Reusa o cron existente cron_process_scheduled_posts.js — nada de cron novo.
// =========================================================================

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'scheduled', label: 'Agendado' },
  { value: 'published', label: 'Publicado' },
] as const

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  published: 'Publicado',
}

const statusBadgeClass = (status: string): string => {
  if (status === 'published') return 'border-emerald-500/40 text-emerald-600'
  if (status === 'scheduled') return 'border-amber-500/40 text-amber-600'
  return 'border-border text-muted-foreground'
}

const formatDateTime = (value?: string): string => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const toLocalInput = (value?: string): string => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function LabsScheduledDashboard({ reloadKey }: { reloadKey?: number }) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [scheduled, setScheduled] = useState<LabsScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Dialog de edição: conteúdo + nova data
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<LabsScheduledPost | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [editDate, setEditDate] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      // Busca sem travar em status: draft/scheduled/published em uma ida
      setScheduled(await listScheduledPosts(user.id))
      setLoadError(false)
    } catch (err) {
      // Erro visível: card com "Tentar novamente" — não some com a lista
      console.error('Falha ao carregar agendados:', getErrorMessage(err))
      setScheduled([])
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load, reloadKey])

  const filtered = useMemo(
    () => (statusFilter === 'all' ? scheduled : scheduled.filter((p) => p.status === statusFilter)),
    [scheduled, statusFilter],
  )

  const openEdit = (p: LabsScheduledPost) => {
    setEditing(p)
    setEditCaption(p.caption || p.content || '')
    setEditDate(toLocalInput(p.scheduled_date))
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    setSavingEdit(true)
    try {
      if (editDate) {
        await reschedulePost(editing.id, editDate)
      }
      if (editCaption.trim() && editCaption.trim() !== (editing.caption || editing.content)) {
        await updatePostContent(editing.id, editCaption.trim())
      }
      toast({ title: 'Agendamento atualizado', description: formatDateTime(editDate) })
      setEditOpen(false)
      setEditing(null)
      load()
    } catch (err) {
      toast({
        title: 'Falha ao atualizar',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSavingEdit(false)
    }
  }

  const handleCancel = async (p: LabsScheduledPost) => {
    setBusyId(p.id)
    try {
      await cancelSchedule(p.id)
      toast({
        title: 'Agendamento cancelado',
        description: 'O post voltou para rascunho, sem data de publicação.',
      })
      load()
    } catch (err) {
      toast({
        title: 'Falha ao cancelar',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (p: LabsScheduledPost) => {
    setBusyId(p.id)
    try {
      await deletePost(p.id)
      toast({ title: 'Post excluído', description: 'O post agendado foi removido.' })
      load()
    } catch (err) {
      toast({
        title: 'Falha ao excluir',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando agendamentos…
      </Card>
    )
  }

  if (loadError) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center gap-2 text-center border-destructive/30 bg-destructive/5">
        <AlertCircle className="w-5 h-5 text-destructive" />
        <p className="text-xs font-semibold text-foreground">Falha ao carregar agendamentos</p>
        <p className="text-[11px] text-muted-foreground">
          Não foi possível buscar os posts agendados.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void load()}
          className="rounded-xl text-xs font-bold gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Tentar novamente
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Dashboard de agendamento
          {filtered.length > 0 && (
            <Badge
              variant="outline"
              className="ml-2 text-[9px] font-bold border-amber-500/40 text-amber-600"
            >
              {filtered.length} registro{filtered.length > 1 ? 's' : ''}
            </Badge>
          )}
        </h4>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 w-[160px] text-[11px] rounded-xl">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={load}
            className="h-7 text-[11px] gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Atualizar
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-6 text-center space-y-1">
          <CalendarClock className="w-5 h-5 mx-auto text-muted-foreground/50" />
          <p className="text-xs font-semibold text-foreground">
            {statusFilter === 'all' ? 'Nenhum post agendado' : 'Nenhum post com esse status'}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {statusFilter === 'all'
              ? 'Agende um post no formulário acima com data futura — ele aparece aqui organizado por data.'
              : 'Troque o filtro de status ou agende um post com ele.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const isBusy = busyId === p.id
            const isPast = new Date(p.scheduled_date).getTime() < Date.now()
            return (
              <Card key={p.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] font-bold uppercase">
                      {p.platform}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold gap-1 ${statusBadgeClass(p.status)}`}
                    >
                      <CalendarClock className="w-3 h-3" />
                      {STATUS_LABEL[p.status] || p.status}
                    </Badge>
                    {p.scheduled_date && (
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold gap-1 ${
                          isPast
                            ? 'border-emerald-500/40 text-emerald-600'
                            : 'border-amber-500/40 text-amber-600'
                        }`}
                      >
                        <CalendarClock className="w-3 h-3" />
                        {formatDateTime(p.scheduled_date)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px] gap-1"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="w-3 h-3" /> Editar
                    </Button>
                    {p.status === 'scheduled' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[11px] gap-1 text-muted-foreground"
                        disabled={isBusy}
                        onClick={() => handleCancel(p)}
                      >
                        {isBusy ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CalendarX2 className="w-3 h-3" />
                        )}
                        Cancelar
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px] gap-1 text-destructive hover:text-destructive"
                      disabled={isBusy}
                      onClick={() => handleDelete(p)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                  {p.caption || p.content}
                </p>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog de edição/remarcação */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Editar agendamento</DialogTitle>
            <DialogDescription className="text-xs">
              Ajuste o texto e/ou remarque a data de publicação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-caption" className="text-xs font-semibold">
                Texto do post
              </Label>
              <textarea
                id="edit-caption"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-date" className="text-xs font-semibold">
                Nova data de publicação
              </Label>
              <Input
                id="edit-date"
                type="datetime-local"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="rounded-xl text-xs"
            >
              Voltar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveEdit}
              disabled={savingEdit}
              className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
