import { useEffect, useState } from 'react'
import { AlertCircle, ClipboardPaste, Link2, Loader2, Upload, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { fetchUrlText, structureImportedSections } from '@/services/labs-ai'

// =========================================================================
// Diálogo "Importar" do gerenciador de páginas do portal (pedido: IA avançada
// para importar). Duas fontes: link da web (extração de texto no servidor via
// hook portal_import.js) ou texto colado. A IA (studio-agent) organiza o
// conteúdo em seções que viram blocos título+texto no rascunho da página.
// Padrões do LabsAiGeneratorDialog: loading no botão, erro INLINE persistente
// em pt-BR (o toast some rápido, o bloco vermelho fica).
// =========================================================================

type ImportTab = 'url' | 'text'

export interface PortalImportResult {
  title: string
  sections: { heading: string; text: string }[]
}

interface PortalImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Recebe o resultado estruturado e insere os blocos no rascunho. */
  onImported: (result: PortalImportResult) => void
}

export function PortalImportDialog({ open, onOpenChange, onImported }: PortalImportDialogProps) {
  const [tab, setTab] = useState<ImportTab>('url')
  const [url, setUrl] = useState('')
  const [pasted, setPasted] = useState('')
  const [importing, setImporting] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTab('url')
      setUrl('')
      setPasted('')
      setInlineError(null)
    }
  }, [open])

  const handleImport = async () => {
    setInlineError(null)
    setImporting(true)
    try {
      let content: string
      if (tab === 'url') {
        const clean = url.trim()
        if (!clean) {
          setInlineError('Cole o link da página que você quer importar.')
          return
        }
        content = await fetchUrlText(clean)
      } else {
        const clean = pasted.trim()
        if (!clean) {
          setInlineError('Cole o conteúdo que você quer importar antes de organizar.')
          return
        }
        content = clean
      }
      const structured = await structureImportedSections(content)
      onImported(structured)
      onOpenChange(false)
    } catch (err) {
      // Erro acionável dentro do diálogo — o toast some rápido, o texto fica
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível importar o conteúdo agora. Tente novamente.'
      setInlineError(message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!importing) onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" /> Importar conteúdo para a página
          </DialogTitle>
          <DialogDescription className="text-xs">
            Traga o conteúdo de um link da web ou cole um texto — a IA remove menus e anúncios e
            organiza tudo em blocos de título e texto no rascunho da página.
          </DialogDescription>
        </DialogHeader>

        {inlineError && (
          <div className="flex items-start gap-2 p-3 rounded-xl border border-destructive/30 bg-destructive/5">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-foreground leading-relaxed">{inlineError}</p>
          </div>
        )}

        {/* Abas: URL / Texto colado */}
        <div className="flex items-center gap-1 p-1 rounded-xl border border-border/70 bg-muted/40 w-fit">
          <button
            type="button"
            onClick={() => {
              setTab('url')
              setInlineError(null)
            }}
            disabled={importing}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
              tab === 'url'
                ? 'bg-background text-foreground shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Link2 className="w-3.5 h-3.5" /> Link da web
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('text')
              setInlineError(null)
            }}
            disabled={importing}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
              tab === 'text'
                ? 'bg-background text-foreground shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <ClipboardPaste className="w-3.5 h-3.5" /> Texto colado
          </button>
        </div>

        {tab === 'url' ? (
          <div className="space-y-2">
            <label htmlFor="portal-import-url" className="text-xs font-semibold">
              Link da página
            </label>
            <Input
              id="portal-import-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com/pagina-sobre"
              className="text-xs rounded-xl"
              disabled={importing}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !importing) void handleImport()
              }}
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground">
              O servidor baixa a página e extrai o texto principal antes da IA organizar.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label htmlFor="portal-import-text" className="text-xs font-semibold">
              Conteúdo colado
            </label>
            <Textarea
              id="portal-import-text"
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={7}
              placeholder="Cole aqui o texto, artigo ou roteiro que virará a página…"
              className="text-xs rounded-xl resize-y"
              disabled={importing}
            />
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={importing}
            className="rounded-xl text-xs font-bold"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleImport()}
            disabled={importing}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            {importing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {importing ? 'Importando…' : tab === 'url' ? 'Importar do link' : 'Organizar texto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PortalImportDialog
