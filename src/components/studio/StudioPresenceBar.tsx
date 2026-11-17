import { useCallback, useEffect, useMemo, useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import { listEditComments, subscribeEditComments } from '@/services/studio-edit-comments'
import type { StudioEditComment } from '@/services/studio-edit-comments'

export interface StudioPresenceUser {
  userId: string
  name: string
  isMe: boolean
}

const PRESENCE_TTL_MS = 90_000

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

const PALETTE = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
]

function colorFor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

/**
 * Barra de presença ao vivo do Studio: mostra os avatares de quem está
 * editando o MESMO material agora (mesma target_key), com base na atividade
 * recente de comentários (migration 0108) — realtime PocketBase.
 * Best-effort: nunca bloqueia a página.
 */
export function StudioPresenceBar({
  targetKey,
  className,
}: {
  targetKey: string
  className?: string
}) {
  const myUserId = (pb.authStore.record?.id as string | undefined) || ''
  const [active, setActive] = useState<StudioPresenceUser[]>([])

  const refresh = useCallback(async () => {
    if (!targetKey) return
    try {
      const list = await listEditComments(targetKey, 25)
      apply(list)
    } catch {
      /* best-effort */
    }
  }, [targetKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const apply = useCallback(
    (list: StudioEditComment[]) => {
      const cutoff = Date.now() - PRESENCE_TTL_MS
      const byUser = new Map<string, string>()
      for (const c of list) {
        if (!c.userId || !c.created) continue
        const t = new Date(c.created).getTime()
        if (Number.isNaN(t) || t < cutoff) continue
        const prev = byUser.get(c.userId)
        if (!prev || c.authorName > prev) byUser.set(c.userId, c.authorName || prev || '')
      }
      const users: StudioPresenceUser[] = []
      byUser.forEach((name, userId) => {
        users.push({
          userId,
          name: name || 'Colaborador',
          isMe: userId === myUserId,
        })
      })
      users.sort((a, b) => (a.isMe ? -1 : b.isMe ? 1 : a.name.localeCompare(b.name)))
      setActive(users)
    },
    [myUserId],
  )

  // Assina realtime + recarrega a cada mudança de material.
  useEffect(() => {
    if (!targetKey) return
    let cancelled = false
    refresh()
    const unsubscribe = subscribeEditComments(targetKey, () => {
      if (!cancelled) refresh()
    })
    return () => {
      cancelled = true
      unsubscribe()
      setActive([])
    }
  }, [targetKey, refresh])

  const maxShow = 4
  const shown = useMemo(() => active.slice(0, maxShow), [active])
  const rest = active.length - shown.length

  if (active.length === 0) return null

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn('flex items-center gap-2', className)}
        title={
          active.length === 1
            ? 'Só você está editando este material agora'
            : `${active.length} pessoas editando este material agora`
        }
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="hidden sm:inline text-[11px] font-semibold text-muted-foreground">
          {active.length === 1 ? 'Você' : 'Editando agora'}
        </span>
        <div className="flex items-center -space-x-2">
          {shown.map((u) => (
            <Tooltip key={u.userId}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'relative inline-flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-background',
                    colorFor(u.userId),
                  )}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback
                      className={cn('text-[10px] font-bold text-white bg-transparent')}
                    >
                      {initials(u.isMe ? 'Você' : u.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {u.isMe ? 'Você (editando agora)' : `${u.name} — editando agora`}
              </TooltipContent>
            </Tooltip>
          ))}
          {rest > 0 && (
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground ring-2 ring-background">
              +{rest}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

export default StudioPresenceBar
