import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { EXPORT_FORMATS, type RasterizeFormat } from '@/lib/rasterize'
import { cn } from '@/lib/utils'

interface ExportFormatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Nome do asset que está sendo baixado (para o título). */
  assetName?: string
  /** Rasteriza no formato e dispara o download. */
  onExport: (format: RasterizeFormat) => Promise<void>
  busy?: boolean
}

/** Seletor de formato de exportação: PNG, JPG ou WebP (pedido 3). */
export function ExportFormatDialog({
  open,
  onOpenChange,
  assetName,
  onExport,
  busy = false,
}: ExportFormatDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Download className="w-4 h-4 text-primary" />
            Baixar asset editado
          </DialogTitle>
          <DialogDescription className="truncate">
            {assetName ? `${assetName} — ` : ''}escolha o formato do arquivo
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {EXPORT_FORMATS.map((f) => (
            <Button
              key={f.key}
              variant="outline"
              disabled={busy}
              onClick={() => void onExport(f.key)}
              className="h-16 flex-col gap-1 text-xs font-bold"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-primary" />
              )}
              {f.label}
            </Button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          PNG mantém transparência; JPG é mais leve (fundo branco); WebP equilibra qualidade e
          tamanho.
        </p>
      </DialogContent>
    </Dialog>
  )
}

/** Barra de progresso do preset em lote (pedido 4): "X de Y". */
export function BulkPresetDialog({
  open,
  onOpenChange,
  presetName,
  progress,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  presetName: string
  progress: { done: number; total: number; currentName: string; ok: number; failed: number } | null
}) {
  const total = progress?.total || 0
  const done = progress?.done || 0
  const pct = total ? Math.round((done / total) * 100) : 0
  const finished = total > 0 && done >= total
  return (
    <Dialog open={open} onOpenChange={(next) => finished && onOpenChange(next)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">
            {finished ? 'Preset aplicado' : 'Aplicando preset…'}
          </DialogTitle>
          <DialogDescription>
            {finished ? 'Lote concluído.' : `Aplicando em ${progress?.currentName || '…'}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>
              {done} de {total}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          {progress && progress.failed > 0 && (
            <p className={cn('text-[11px] text-destructive')}>
              {progress.failed} asset(s) falharam — verifique a imagem original (CORS).
            </p>
          )}
          {finished && (
            <Button size="sm" className="w-full" onClick={() => onOpenChange(false)}>
              Concluir
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
