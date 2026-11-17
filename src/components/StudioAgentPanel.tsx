import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, Send, Loader2, PanelRightClose, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { sendStudioAgentChat, type StudioAgentChatResult } from '@/services/studio-agent'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { toast } from '@/hooks/use-toast'

interface StudioMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface StudioAgentPanelProps {
  className?: string
  contextHint?: string
  onClose?: () => void
}

let messageSeq = 0
const nextMessageId = () => {
  messageSeq += 1
  return `studio-msg-${messageSeq}`
}

export function StudioAgentPanel({ className, contextHint, onClose }: StudioAgentPanelProps) {
  const [messages, setMessages] = useState<StudioMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const conversationIdRef = useRef<string | null>(null)
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || sending) return
      const userMessage: StudioMessage = { id: nextMessageId(), role: 'user', content: trimmed }
      setMessages((prev) => [...prev, userMessage])
      setInput('')
      setSending(true)
      try {
        const result: StudioAgentChatResult = await sendStudioAgentChat(
          trimmed,
          conversationIdRef.current,
        )
        conversationIdRef.current = result.conversation_id || conversationIdRef.current
        setMessages((prev) => [
          ...prev,
          {
            id: result.message_id || nextMessageId(),
            role: 'assistant',
            content: result.content || 'Não consegui gerar uma resposta. Tente reformular.',
          },
        ])
      } catch (err) {
        toast({
          title: 'Studio Agent',
          description: getErrorMessage(err) || 'Não foi possível responder agora.',
          variant: 'destructive',
        })
      } finally {
        setSending(false)
      }
    },
    [sending],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <aside
      className={cn(
        'flex flex-col h-full rounded-xl border border-border bg-card text-card-foreground overflow-hidden',
        className,
      )}
      aria-label="Painel do Studio Agent"
    >
      <header className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-muted/40">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Studio Agent</p>
          <p className="text-[11px] text-muted-foreground leading-tight truncate">
            {contextHint || 'Copiloto de criação — copy, formato e visual'}
          </p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={onClose}
            aria-label="Fechar painel do Studio"
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        )}
      </header>

      <div className="flex-1 min-h-0">
        {!hasMessages ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
            <Sparkles className="h-8 w-8 text-primary/50" />
            <p className="text-sm font-medium">Monte seu post com o Studio</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Descreva a ideia (ex.: &quot;post de lançamento para Instagram&quot;) e receba ângulo,
              copy e hashtags na hora.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-3 p-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {m.role === 'assistant' && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm',
                    )}
                  >
                    {m.content}
                  </div>
                  {m.role === 'user' && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs px-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Studio está pensando…
                </div>
              )}
              <div ref={scrollAnchorRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      <div className="p-3 border-t border-border bg-muted/30">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva sua ideia para o post…"
            className="min-h-[44px] max-h-32 text-xs resize-none"
            disabled={sending}
          />
          <Button
            size="icon"
            onClick={() => void send(input)}
            disabled={sending || !input.trim()}
            aria-label="Enviar mensagem"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Enter envia · Shift+Enter quebra linha
        </p>
      </div>
    </aside>
  )
}
