import { useState } from 'react'
import { Sparkles, Loader2, Copy, Check, Wand2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { generateCaption, generateHashtags } from '@/services/ai'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface AIAssistantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplyText: (text: string, hashtags?: string[]) => void
  initialTopic?: string
  platform?: string
}

export function AIAssistantModal({
  open,
  onOpenChange,
  onApplyText,
  initialTopic = '',
  platform = 'Instagram',
}: AIAssistantModalProps) {
  const [topic, setTopic] = useState(initialTopic)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ caption: string; hashtags: string[] } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: 'Atenção', description: 'Insira um tema.' })
      return
    }
    setLoading(true)
    try {
      const r = await generateCaption(topic, platform)
      const caption = (r as any).caption || ''
      let hashtags: string[] = []
      try {
        const hr = await generateHashtags(caption)
        hashtags = (hr as any).hashtags || []
      } catch {
        /* intentionally ignored */
      }
      setResult({ caption, hashtags })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (result) {
      onApplyText(result.caption, result.hashtags)
      onOpenChange(false)
      toast({ title: 'Sucesso!', description: 'Texto aplicado ao post.' })
    }
  }

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(`${result.caption}\n\n${result.hashtags.join(' ')}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" /> Assistente IA BestContent
          </DialogTitle>
          <DialogDescription>
            Gere legendas e hashtags com IA usando o Skip AI Gateway.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 my-2">
          <div>
            <label className="text-xs font-semibold mb-1 block">Sobre o que é o post?</label>
            <Textarea
              placeholder="Ex: Lançamento do novo café de inverno..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="text-sm h-20"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary via-pink-500 to-purple-600 text-white font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando com IA...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" /> Gerar Legenda com IA
              </>
            )}
          </Button>
          {result && (
            <div className="p-3 rounded-lg bg-muted border border-border space-y-3 animate-fade-in text-xs">
              <div>
                <span className="font-semibold block mb-1">Legenda:</span>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {result.caption}
                </p>
              </div>
              {result.hashtags.length > 0 && (
                <div>
                  <span className="font-semibold block mb-1">Hashtags:</span>
                  <div className="flex flex-wrap gap-1">
                    {result.hashtags.map((h) => (
                      <span
                        key={h}
                        className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] font-medium"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Button
                  size="sm"
                  onClick={handleApply}
                  className="bg-primary text-white flex-1 text-xs"
                >
                  Usar no post
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopy} className="text-xs">
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
