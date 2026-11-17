import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { AtSign, Loader2, MessageSquare, Send, X } from 'lucide-react'
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
import { listOrgMembers } from '@/services/org-members'
import {
  applyMentionToDraft,
  extractActiveMention,
  filterMentionCandidates,
  splitMentionSegments,
  type MentionCandidate,
} from '@/lib/comment-mentions'

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
 * vivo por realtime (migration 0108), com badge de não lidas, respostas e
 * autocomplete de menções @ (membros da organização).
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

  // ---- Menções @ ----------------------------------------------------------
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [mentionRange, setMentionRange] = useState<{ start: number; end: number } | null>(null)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionIndex, setMentionIndex] = useState(0)
  const [members, setMembers] = useState<MentionCandidate[]>([])

  useEffect(() => {
    if (!open || members.length > 0) return
    let active = true
    listOrgMembers()
      .then((list) => {
        if (!active) return
        setMembers(
          (list || []).map((m) => ({
            id: m.id,
            name: m.name || m.email?.split('@')[0] || 'Membro',
            email: m.email || '',
          })),
        )
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [open, members.length])

  const mentionCandidates = useMemo(
    () => filterMentionCandidates(members, mentionQuery),
    [members, mentionQuery],
  )

  const closeMention = useCallback(() => {
    setMentionRange(null)
    setMentionQuery('')
    setMentionIndex(0)
  }, [])

  const handleDraftChange = (value: string, caret: number | null) => {
    setDraft(value)
    const cursor = caret ?? value.length
    const m = extractActiveMention(value, cursor)
    if (m) {
      setMentionRange({ start: m.start, end: m.end })
      setMentionQuery(m.token)
      setMentionIndex(0)
    } else {
      closeMention()
    }
  }

  const pickMention = (candidate: MentionCandidate) => {
    if (!mentionRange) return
    const next = applyMentionToDraft(draft, mentionRange, candidate.name)
    setDraft(next)
    closeMention()
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

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
    closeMention()
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
            {mentionRange && mentionCandidates.length > 0 && (
              <div className="overflow-hidden rounded-md border bg-popover shadow-md">
                <div className="flex items-center gap-1.5 border-b px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <AtSign className="h-3 w-3" /> Mencionar membro
                </div>
                {mentionCandidates.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-accent',
                      i === mentionIndex && 'bg-accent',
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      pickMention(c)
                    }}
                    onMouseEnter={() => setMentionIndex(i)}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[9px]">{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate font-medium">{c.name}</span>
                    {c.email && (
                      <span className="ml-auto truncate text-[10px] text-muted-foreground">
                        {c.email}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value, e.target.selectionStart)}
                placeholder="Escreva um comentário... use @ para mencionar alguém"
                className="min-h-9 flex-1 resize-none text-sm"
                rows={1}
                onKeyDown={(e) => {
                  if (mentionRange && mentionCandidates.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      setMentionIndex((i) => (i + 1) % mentionCandidates.length)
                      return
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      setMentionIndex(
                        (i) => (i - 1 + mentionCandidates.length) % mentionCandidates.length,
                      )
                      return
                    }
                    if (e.key === 'Enter' || e.key === 'Tab') {
                      e.preventDefault()
                      pickMention(mentionCandidates[mentionIndex] || mentionCandidates[0])
                      return
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      closeMention()
                      return
                    }
                  }
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
  const segments = useMemo(() => splitMentionSegments(comment.body || ''), [comment.body])
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
          <p className="mt-0.5 text-sm whitespace-pre-wrap">
            {segments.map((seg, i) =>
              seg.mention ? (
                <span
                  key={i}
                  className="mx-0.5 inline-flex items-center rounded bg-primary/10 px-1 py-px text-xs font-semibold text-primary"
                >
                  {seg.text}
                </span>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )}
          </p>
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
