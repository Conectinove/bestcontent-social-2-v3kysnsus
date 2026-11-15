import { useEffect, useState } from 'react'
import {
  Loader2,
  RotateCcw,
  History,
  GitCompareArrows,
  StickyNote,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import {
  listPageVersions,
  restorePageVersion,
  type PortalPageVersion,
  savePageVersionNote,
} from '@/services/portal-page-versions'
import type { PortalPage, PortalPageContent } from '@/services/portal-pages'
import { PortalBlockDiffView } from '@/components/settings/PortalBlockDiffView'

interface PortalPageVersionsDialogProps {
  page: PortalPage
  onRestored: () => void | Promise<void>
  onClose: () => void
}

function fmtDate(iso: string) {
  try {
    return new Date(iso.replace(' ', 'T')).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

/**
 * Histórico de versões da página do portal (pedido 2): lista os snapshots
 * gravados pelo hook (um por salvamento) e permite restaurar um anterior.
 */
export function PortalPageVersionsDialog({
  page,
  onRestored,
  onClose,
}: PortalPageVersionsDialogProps) {
  const [versions, setVersions] = useState<PortalPageVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)
  // Comparação lado a lado (pedido 4): versão de referência + versão com que
  // comparar. 'current' = conteúdo vivo da página (o que está publicado).
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareRef, setCompareRef] = useState<string>('')
  const [compareWith, setCompareWith] = useState<string>('current')
  // Nota por versão (migration 0122): edição inline da anotação.
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    listPageVersions(page.id)
      .then((v) => {
        if (alive) setVersions(v)
      })
      .catch((err) => {
        console.error('Erro ao carregar versões:', err)
        if (alive) setVersions([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [page.id])

  const handleRestore = async (v: PortalPageVersion) => {
    setRestoring(v.id)
    try {
      await restorePageVersion(page.id, v)
      await onRestored()
      onClose()
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao restaurar versão',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setRestoring(null)
    }
  }

  const countBlocks = (v: PortalPageVersion) => {
    const b = v.content?.blocks
    return Array.isArray(b) ? b.length : 0
  }

  const versionLabel = (v: PortalPageVersion | null) => {
    if (!v) return 'Atual'
    return v.version <= 1 ? 'Criação' : `Versão ${v.version}`
  }

  const resolvedRef = versions.find((v) => v.id === compareRef) || null
  const resolvedWith =
    compareWith === 'current' ? null : versions.find((v) => v.id === compareWith) || null
  // theme vem do índice [key: string]: unknown — cast explícito (padrão de rasterize.ts)
  const theme = page.content?.theme as { accent?: string } | undefined
  const accent = theme?.accent || undefined

  const handleSaveNote = async (v: PortalPageVersion) => {
    setSavingNoteId(v.id)
    try {
      await savePageVersionNote(v.id, noteDraft.trim())
      setVersions((prev) => prev.map((p) => (p.id === v.id ? { ...p, note: noteDraft.trim() } : p)))
      setEditingNoteId(null)
      toast({ title: 'Nota salva', description: 'A anotação da versão foi atualizada.' })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao salvar a nota',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingNoteId(null)
    }
  }

  const handleCompare = () => {
    if (!resolvedRef) {
      toast({ title: 'Escolha a versão de referência', variant: 'destructive' })
      return
    }
    setCompareOpen(true)
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : compareOpen ? setCompareOpen(false) : onClose())}
    >
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="w-4 h-4" />
            Histórico de versões — {page.title}
          </DialogTitle>
          <DialogDescription>
            Um snapshot é gravado a cada salvamento do conteúdo. Restaurar volta o conteúdo antigo
            para a página (a versão atual é salva antes, nada se perde).
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : versions.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            Ainda não há versões salvas desta página.
          </p>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.id}
                className="group flex items-center gap-2 p-2.5 rounded-lg border border-border/70 bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold">
                    {v.version <= 1 ? 'Criação da página' : `Versão ${v.version}`}
                    {' · '}
                    <span className="font-medium text-muted-foreground">{fmtDate(v.created)}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {countBlocks(v)} bloco{countBlocks(v) === 1 ? '' : 's'}
                  </p>
                  {editingNoteId === v.id ? (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleSaveNote(v)
                          if (e.key === 'Escape') setEditingNoteId(null)
                        }}
                        placeholder="Ex.: ajuste de copy do banner"
                        className="h-7 w-full rounded-md border border-input bg-background px-2 text-[11px]"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        disabled={savingNoteId === v.id}
                        onClick={() => void handleSaveNote(v)}
                      >
                        {savingNoteId === v.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => setEditingNoteId(null)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mt-1 flex w-full items-center gap-1 text-left text-[10px] text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditingNoteId(v.id)
                        setNoteDraft(v.note || '')
                      }}
                      title="Editar nota da versão"
                    >
                      <StickyNote className="w-3 h-3 shrink-0" />
                      {v.note ? (
                        <span className="truncate">{v.note}</span>
                      ) : (
                        <span className="italic opacity-70">Adicionar nota…</span>
                      )}
                      <Pencil className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover:opacity-60" />
                    </button>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs px-2 h-7"
                  onClick={() => {
                    setCompareRef(v.id)
                    setCompareOpen(true)
                  }}
                  title="Comparar esta versão com outra"
                >
                  <GitCompareArrows className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1"
                  disabled={restoring === v.id}
                  onClick={() => void handleRestore(v)}
                >
                  {restoring === v.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3 h-3" />
                  )}
                  Restaurar
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* ===== Comparação lado a lado (pedido 4) ===== */}
        {versions.length > 0 && !compareOpen && (
          <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
            <p className="text-[11px] font-bold flex items-center gap-1.5">
              <GitCompareArrows className="w-3.5 h-3.5 text-primary" />
              Comparar versões lado a lado
            </p>
            <div className="flex gap-2">
              <Select value={compareRef} onValueChange={setCompareRef}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Versão de referência" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs">
                      {versionLabel(v)} · {fmtDate(v.created)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={compareWith} onValueChange={setCompareWith}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Comparar com" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current" className="text-xs">
                    Atual (publicada)
                  </SelectItem>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs">
                      {versionLabel(v)} · {fmtDate(v.created)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1 w-full"
              onClick={handleCompare}
              disabled={!compareRef}
            >
              <GitCompareArrows className="w-3.5 h-3.5" />
              Comparar
            </Button>
          </div>
        )}

        {compareOpen && (
          <div className="mt-4 pt-3 border-t border-border/60 space-y-3">
            <PortalBlockDiffView
              contentA={(resolvedRef?.content as PortalPageContent) || null}
              contentB={
                compareWith === 'current'
                  ? (page.content as PortalPageContent) || null
                  : (resolvedWith?.content as PortalPageContent) || null
              }
              labelA={
                versionLabel(resolvedRef) +
                ' · ' +
                fmtDate(resolvedRef.created) +
                (resolvedRef.note ? ` · ${resolvedRef.note}` : '')
              }
              labelB={
                compareWith === 'current'
                  ? 'Atual (publicada)'
                  : versionLabel(resolvedWith) +
                    ' · ' +
                    fmtDate(resolvedWith.created) +
                    (resolvedWith.note ? ` · ${resolvedWith.note}` : '')
              }
              accent={accent || 'hsl(var(--primary))'}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => setCompareOpen(false)}
              >
                Fechar comparação
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
