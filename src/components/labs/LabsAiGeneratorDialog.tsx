import { useState } from 'react'
import { AlertCircle, Loader2, Sparkles, Wand2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

// =========================================================================
// Diálogo único de geração por IA do Labs (Blog, Web, Email, Post).
// Usa o agente nativo studio-agent via src/services/labs-ai.ts — a chamada
// acontece fora do diálogo (o pai passa onGenerate), aqui só mora o briefing,
// o carregando e o erro com toast em português.
// =========================================================================

interface LabsAiGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  placeholder: string
  generatingLabel?: string
  /** Executa a geração; deve lançar em caso de falha. */
  onGenerate: (briefing: string) => Promise<void>
}

export function LabsAiGeneratorDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  generatingLabel = 'Gerando…',
  onGenerate,
}: LabsAiGeneratorDialogProps) {
  const { toast } = useToast()
  const [briefing, setBriefing] = useState('')
  const [generating, setGenerating] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!briefing.trim()) {
      toast({
        title: 'Descreva o que você quer',
        description: 'Escreva um briefing curto antes de gerar.',
        variant: 'destructive',
      })
      return
    }
    setGenerating(true)
    setInlineError(null)
    try {
      await onGenerate(briefing.trim())
      setBriefing('')
      onOpenChange(false)
    } catch (err) {
      // Erro acionável dentro do diálogo — o toast some rápido, o texto fica
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível gerar o conteúdo agora. Tente novamente.'
      setInlineError(message)
      toast({
        title: 'Falha na geração com IA',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!generating) onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-primary" /> {title}
          </DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>
        {inlineError && (
          <div className="flex items-start gap-2 p-3 rounded-xl border border-destructive/30 bg-destructive/5">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-foreground leading-relaxed">{inlineError}</p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="labs-ai-briefing" className="text-xs font-semibold">
            Briefing
          </Label>
          <Textarea
            id="labs-ai-briefing"
            value={briefing}
            onChange={(e) => setBriefing(e.target.value)}
            rows={5}
            placeholder={placeholder}
            className="text-xs rounded-xl resize-y"
            disabled={generating}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={generating}
            className="rounded-xl text-xs font-bold"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            {generating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {generating ? generatingLabel : 'Gerar com IA'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LabsAiGeneratorDialog
