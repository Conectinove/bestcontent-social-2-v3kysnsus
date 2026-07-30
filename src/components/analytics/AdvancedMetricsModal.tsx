import { Sparkles, Clock, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'

interface AdvancedMetricsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdvancedMetricsModal({ open, onOpenChange }: AdvancedMetricsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Demonstração — Métricas Avançadas Meta
          </DialogTitle>
          <DialogDescription className="text-xs">
            Esta é uma prévia dos dados de alcance, demografia e melhores horários que serão
            ativados automaticamente na sua conta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          <div className="bg-slate-50 dark:bg-slate-900 border border-border p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-500" />
              Demografia de Seguidores (Gênero e Idade)
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>Feminino (64%)</span>
                <span>Masculino (36%)</span>
              </div>
              <Progress value={64} className="h-2.5 bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
              <div className="bg-background p-2 rounded-lg border">
                <span className="text-[10px] text-muted-foreground block">18-24 anos</span>
                <span className="font-bold">18%</span>
              </div>
              <div className="bg-background p-2 rounded-lg border border-primary/40 bg-primary/5">
                <span className="text-[10px] text-muted-foreground block">25-34 anos</span>
                <span className="font-bold text-primary">45%</span>
              </div>
              <div className="bg-background p-2 rounded-lg border">
                <span className="text-[10px] text-muted-foreground block">35-44 anos</span>
                <span className="font-bold">24%</span>
              </div>
              <div className="bg-background p-2 rounded-lg border">
                <span className="text-[10px] text-muted-foreground block">45+ anos</span>
                <span className="font-bold">13%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-border p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              Melhores Horários para Publicação
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-background p-2.5 rounded-lg border">
                <span className="text-[10px] text-muted-foreground block">Segunda / Quarta</span>
                <span className="font-bold text-emerald-600">12:00</span>
              </div>
              <div className="bg-background p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/5">
                <span className="text-[10px] text-muted-foreground block">
                  Terça / Quinta (Pico)
                </span>
                <span className="font-bold text-emerald-600">18:30</span>
              </div>
              <div className="bg-background p-2.5 rounded-lg border">
                <span className="text-[10px] text-muted-foreground block">Sábado / Domingo</span>
                <span className="font-bold text-emerald-600">20:00</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
