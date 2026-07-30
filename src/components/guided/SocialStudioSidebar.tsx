import { ChangeEvent } from 'react'
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  Palette,
  Image as ImageIcon,
  RotateCcw,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export interface ChatMessage {
  sender: 'user' | 'agent'
  text: string
  time?: string
}

interface SocialStudioSidebarProps {
  messages: ChatMessage[]
  input: string
  loading: boolean
  onInputChange: (val: string) => void
  onSendMessage: () => void
  onQuickAction: (action: string) => void
  onBgUpload: (e: ChangeEvent<HTMLInputElement>) => void
}

export function SocialStudioSidebar({
  messages,
  input,
  loading,
  onInputChange,
  onSendMessage,
  onQuickAction,
  onBgUpload,
}: SocialStudioSidebarProps) {
  return (
    <Card className="p-3.5 space-y-3 h-[640px] flex flex-col justify-between border-primary/20 bg-card/90 backdrop-blur-sm shadow-xl rounded-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs block text-foreground">Editor IA</span>
              <span className="text-[10px] text-muted-foreground block">
                Editor de slides gerados por IA
              </span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            Editando: Slide 1
          </span>
        </div>

        {/* Refinement Action Buttons */}
        <div className="flex flex-wrap gap-1.5 pt-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onQuickAction('corrigir')}
            className="text-[10px] h-7 px-2.5 gap-1 border-primary/30 text-primary hover:bg-primary/10"
          >
            <RotateCcw className="w-3 h-3" /> Corrigir / Refazer
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onQuickAction('mudar_cores')}
            className="text-[10px] h-7 px-2.5 gap-1"
          >
            <Palette className="w-3 h-3 text-purple-500" /> Mudar cores
          </Button>

          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={onBgUpload}
              className="hidden"
            />
            <div className="flex items-center gap-1 h-7 px-2.5 rounded-md border border-border bg-background hover:bg-muted text-[10px] text-foreground font-medium transition-colors">
              <Upload className="w-3 h-3 text-blue-500" /> Mudar fundo
            </div>
          </label>
        </div>
      </div>

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 p-1 my-1 text-xs">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-2xl space-y-1 transition-all ${
              msg.sender === 'user'
                ? 'bg-primary text-primary-foreground ml-5 rounded-tr-none shadow-sm'
                : 'bg-muted/80 text-foreground mr-5 rounded-tl-none border border-border/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold opacity-75">
                {msg.sender === 'user' ? 'Você' : 'Editor IA'}
              </span>
              {msg.time && <span className="text-[9px] opacity-60">{msg.time}</span>}
            </div>
            <p className="leading-relaxed text-[11px] whitespace-pre-line">{msg.text}</p>
          </div>
        ))}

        {loading && (
          <div className="p-2.5 rounded-2xl bg-muted/80 text-foreground mr-5 text-xs flex items-center gap-2 border border-border/60">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span className="text-[11px]">Editor IA está processando sua solicitação...</span>
          </div>
        )}
      </div>

      {/* Chat Input Bar */}
      <div className="space-y-2 border-t border-border pt-2.5">
        <div className="flex gap-1.5">
          <Input
            placeholder="Peça alterações no design ou texto..."
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
            className="text-xs h-9 bg-background"
          />
          <Button
            size="sm"
            onClick={onSendMessage}
            disabled={loading || !input.trim()}
            className="h-9 px-3 bg-primary text-white shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
          <span>IA ativada</span>
          <span>{input.length}/500</span>
        </div>
      </div>
    </Card>
  )
}
