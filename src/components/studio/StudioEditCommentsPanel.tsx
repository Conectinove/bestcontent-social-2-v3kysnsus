import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Loader2, MessageSquare, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import {
  createEditComment,
  deleteEditComment,
  listEditComments,
  subscribeEditComments,
  type StudioEditComment,
} from '@/services/studio-edit-comments'

interface StudioEditCommentsPanelProps {
  targetKey: string | null
  /** Rótulo do material, exibido no título do painel. */
  materialLabel?: string
  company?: string
  /** Quando true, o painel abre expandido (ex.: badge de comentário novo). */
  openSignal?: number
  onOpenChange?: (open: boolean) => void
  className?: string
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('') || '?'
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Feed de comentários da colaboração em tempo real: enquanto duas pessoas
 * editam a mesma mídia/post/doc, ambas podem trocar mensagens — chegam ao
 * vivo por realtime (migration 0108), com badge de não lidas e respostas.
 */
export function StudioEditCommentsPanel({
  targetKey,
  materialLabel,
  company,
  openSignal = 0,
  onOpenChange,
  className,
}: StudioEditCommentsPanelProps) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<StudioEditComment[]>([])
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<StudioEditComment | null>(null)
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const seenIds = useRef<Set<string>>(new Set())
  const myUserId = pb.authStore.record?.id as string | undefined

  const refresh = useCallback(async () => {
    if (!targetKey) return
    setLoading(true)
    const next = await listEditComments(targetKey)
    setComments(next)
    setLoading(false)
    const fresh = next.filter((c) => !seenIds.current.has(c.id))
    next.forEach((c) => seenIds.current.add(c.id))
    if (fresh.length > 0 && !open) {
      setUnread((u) => u + fresh.length)
      toast({
        title: 'Novo comentário na edição',
        description: `${fresh.length} comentário(s) chegaram no material${materialLabel ? ` “${materialLabel}”` : ''}.`,
      })
    }
  }, [targetKey, open, materialLabel])

  // Carrega quando o material (ou a abertura do painel) muda e assina realtime.
  useEffect(() => {
    if (!targetKey) {
      setComments([])
      setUnread(0)
      seenIds.current = new Set()
      return
    }
    refresh()
    const unsubscribe = subscribeEditComments(targetKey, () => refresh())
    return () => {
      unsubscribe()
      seenIds.current = new Set()
      setUnread(0)
    }
  }, [targetKey, refresh])

  useEffect(() => {
    if (openSignal > 0) setOpen(true)
  }, [openSignal])

  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  useEffect(() => {
    if (open) setUnread(0)
  }, [open])

  const handleSend = async () => {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    const created = await createEditComment({
      targetKey: targetKey || '',
      body,
      parentId: replyTo?.id || undefined,
      company,
    })
    setSending(false)
    if (!created) {
      toast({
        title: 'Não foi possível comentar',
        description: 'Entre com sua conta para comentar nesta edição.',
        variant: 'destructive',
      })
      return
    }
    setDraft('')
    setReplyTo(null)
    refresh()
  }

  const handleDelete = async (c: StudioEditComment) => {
    await deleteEditComment(c.id)
    refresh()
  }

  const threads = useMemo(() => {
    const roots = comments.filter((c) => !c.parentId)
    const byParent = new Map<string, StudioEditComment[]>()
    for (const c of comments) {
      if (!c.parentId) continue
      const list = byParent.get(c.parentId) || []
      list.push(c)
      byParent.set(c.parentId, list)
    }
    return roots.map((r) => ({ root: r, replies: byParent.get(r.id) || [] }))
  }, [comments])

  if (!targetKey) return null

  return (
    <div className={cn('relative', className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        className="gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        Comentários
        {unread > 0 && (
          <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 bottom-full z-50 mb-2 w-80 overflow-hidden rounded-xl border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Comentários{materialLabel ? ` — ${materialLabel}` : ''}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-64 px-3 py-2">
            {loading && comments.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : threads.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum comentário ainda. Escreva o primeiro para quem edita com você.
              </p>
            ) : (
              <div className="space-y-3">
                {threads.map(({ root, replies }) => (
                  <div key={root.id} className="space-y-2">
                    <CommentBubble
                      comment={root}
                      mine={!!myUserId && root.userId === myUserId}
                      onReply={() => setReplyTo(root)}
                      onDelete={handleDelete}
                    />
                    {replies.map((r) => (
                      <div key={r.id} className="ml-6">
                        <CommentBubble
                          comment={r}
                          mine={!!myUserId && r.userId === myUserId}
                          onReply={() => setReplyTo(r)}
                          onDelete={handleDelete}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="space-y-2 border-t px-3 py-2">
            {replyTo && (
              <div className="flex items-center justify-between rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                <span className="truncate">
                  Respondendo a {replyTo.authorName || 'colaborador'}: “{replyTo.body.slice(0, 60)}
                  {replyTo.body.length > 60 ? '…' : ''}”
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => setReplyTo(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escreva um comentário para quem edita com você..."
                className="min-h-9 flex-1 resize-none text-sm"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CommentBubble({
  comment,
  mine,
  onReply,
  onDelete,
}: {
  comment: StudioEditComment
  mine: boolean
  onReply: () => void
  onDelete: (c: StudioEditComment) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-2">
      <div className="flex items-start gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-[10px]">
            {initials(comment.authorName || 'Você')}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-xs font-medium">{comment.authorName || 'Você'}</span>
            <span className="text-[10px] text-muted-foreground">{formatTime(comment.created)}</span>
          </div>
          <p className="mt-0.5 text-sm whitespace-pre-wrap">{comment.body}</p>
          <div className="mt-1 flex gap-2">
            <button
              className="text-[11px] text-muted-foreground hover:text-foreground"
              onClick={onReply}
            >
              Responder
            </button>
            {mine && (
              <button
                className="text-[11px] text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(comment)}
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
