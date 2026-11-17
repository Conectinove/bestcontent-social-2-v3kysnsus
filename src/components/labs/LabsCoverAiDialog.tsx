import { useCallback, useEffect, useState } from 'react'
import { Image as ImageIcon, Loader2, Sparkles, Wand2 } from 'lucide-react'
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
import { ConnectorButton } from '@/components/skip/ConnectorButton'
import {
  OPENAI_TOOLKIT,
  generateCoverWithAi,
  getOpenAiStatus,
  type OpenAiCoverStatus,
} from '@/services/labs-cover-ai'

// =========================================================================
// Diálogo "Gerar capa com IA" dos materiais dos Labs (post/blog/email).
// Usa o conector OpenAI da CONTA DO PRÓPRIO USUÁRIO (mecanismo de conectores
// injetado — sem OAuth hand-rolled, sem chave de API). Sem conta conectada,
// mostra estado explicativo com o botão de conectar (mesmo padrão do Gmail
// na aba Email). A URL gerada vira a capa do material (image_url).
// =========================================================================

interface LabsCoverAiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Descrição inicial sugerida (ex.: título/resumo do material). */
  seedPrompt?: string
  /** Recebe a URL da imagem gerada e aplica no material. */
  onGenerated: (url: string) => void
}

export function LabsCoverAiDialog({
  open,
  onOpenChange,
  seedPrompt = '',
  onGenerated,
}: LabsCoverAiDialogProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState<OpenAiCoverStatus | 'loading'>('loading')
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)

  const loadStatus = useCallback(async () => {
    setStatus(await getOpenAiStatus())
  }, [])

  useEffect(() => {
    if (open) {
      setInlineError(null)
      if (!prompt.trim()) setPrompt(seedPrompt)
      void loadStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setInlineError('Descreva a capa que você quer antes de gerar.')
      return
    }
    setGenerating(true)
    setInlineError(null)
    try {
      const { url } = await generateCoverWithAi(prompt.trim())
      onGenerated(url)
      toast({
        title: 'Capa gerada!',
        description: 'A imagem criada com IA agora é a capa do material.',
      })
      onOpenChange(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível gerar a capa agora. Tente novamente.'
      setInlineError(message)
    } finally {
      setGenerating(false)
    }
  }

  const connected = status === 'connected'

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
            <Wand2 className="w-4 h-4 text-primary" /> Gerar capa com IA
          </DialogTitle>
          <DialogDescription className="text-xs">
            A capa é criada com a sua própria conta OpenAI conectada — a imagem gerada substitui a
            capa atual do material.
          </DialogDescription>
        </DialogHeader>

        {status === 'loading' ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Verificando conexão com a OpenAI…
          </div>
        ) : status === 'unknown' ? (
          <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-xs text-foreground leading-relaxed">
            Não foi possível verificar sua conexão com a OpenAI. Recarregue a página ou tente de
            novo em instantes.
          </div>
        ) : !connected ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-500/40 bg-amber-500/10">
              <ImageIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-foreground leading-relaxed">
                Para gerar a capa, conecte sua conta OpenAI. A conexão é pessoal: só a sua conta é
                usada e você pode desconectar quando quiser.
              </p>
            </div>
            <ConnectorButton toolkit={OPENAI_TOOLKIT} name="OpenAI" />
            <p className="text-[11px] text-muted-foreground">
              Depois de conectar, volte aqui e clique em “Gerar capa”. Se o navegador bloquear a
              janela de conexão, use o link “Abrir página de conexão”.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="labs-cover-prompt" className="text-xs font-semibold">
              Descrição da capa
            </Label>
            <Textarea
              id="labs-cover-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Ex.: foto minimalista do produto sobre fundo claro, luz natural, espaço para título"
              className="text-xs rounded-xl resize-y"
              disabled={generating}
            />
            {inlineError && (
              <p role="alert" className="text-xs text-destructive leading-relaxed">
                {inlineError}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={generating}
            className="rounded-xl text-xs font-bold"
          >
            {connected ? 'Cancelar' : 'Fechar'}
          </Button>
          {connected && (
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
              {generating ? 'Gerando capa…' : 'Gerar capa'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LabsCoverAiDialog
