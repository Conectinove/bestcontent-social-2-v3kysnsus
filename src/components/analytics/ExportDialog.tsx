import { useState } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup } from '@/components/ui/radio-group'
import { toast } from '@/hooks/use-toast'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv')
  const [exporting, setExporting] = useState(false)

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      onOpenChange(false)
      toast({
        title: 'Relatório exportado!',
        description: `O arquivo .${format.toUpperCase()} foi gerado e baixado com sucesso.`,
      })
    }, 1200)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Download className="w-5 h-5 text-primary" />
            Exportar Dados de Analytics
          </DialogTitle>
          <DialogDescription className="text-xs">
            Escolha o formato desejado para baixar o relatório detalhado das suas redes sociais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <RadioGroup
            value={format}
            onValueChange={(val: any) => setFormat(val)}
            className="grid grid-cols-2 gap-3"
          >
            <div
              onClick={() => setFormat('csv')}
              className={`p-3.5 rounded-xl border cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${
                format === 'csv'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="text-xs font-bold">Planilha (CSV)</p>
                <p className="text-[10px] text-muted-foreground">Dados brutos diários</p>
              </div>
            </div>

            <div
              onClick={() => setFormat('pdf')}
              className={`p-3.5 rounded-xl border cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${
                format === 'pdf'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <FileText className="w-6 h-6 text-red-500" />
              <div>
                <p className="text-xs font-bold">Relatório (PDF)</p>
                <p className="text-[10px] text-muted-foreground">Executivo com gráficos</p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="text-xs bg-primary text-white gap-2"
          >
            {exporting ? 'Gerando...' : 'Baixar arquivo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
