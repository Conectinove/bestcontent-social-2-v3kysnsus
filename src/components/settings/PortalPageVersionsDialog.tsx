import { useEffect, useState } from 'react'
import { Loader2, RotateCcw, X, History } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import {
  listPageVersions,
  restorePageVersion,
  type PortalPageVersion,
} from '@/services/portal-page-versions'
import type { PortalPage } from '@/services/portal-pages'

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

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
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
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border/70 bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold">
                    {v.version <= 1 ? 'Criação da página' : `Versão ${v.version}`}
                    {' · '}
                    <span className="font-medium text-muted-foreground">{fmtDate(v.created)}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {countBlocks(v)} bloco{countBlocks(v) === 1 ? '' : 's'}
                    {v.note ? ` · ${v.note}` : ''}
                  </p>
                </div>
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
      </DialogContent>
    </Dialog>
  )
}
