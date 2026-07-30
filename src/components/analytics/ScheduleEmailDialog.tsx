import { useState } from 'react'
import { Mail } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

interface ScheduleEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail?: string
}

export function ScheduleEmailDialog({
  open,
  onOpenChange,
  userEmail = '',
}: ScheduleEmailDialogProps) {
  const [email, setEmail] = useState(userEmail || 'ronaldoconectinove@gmail.com')
  const [frequency, setFrequency] = useState('weekly')
  const [saving, setSaving] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      onOpenChange(false)
      toast({
        title: 'Agendamento Salvo!',
        description: `Relatórios serão enviados para ${email} (${frequency === 'weekly' ? 'Semanalmente' : 'Mensalmente'}).`,
      })
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Mail className="w-5 h-5 text-primary" />
            Agendar Relatório por E-mail
          </DialogTitle>
          <DialogDescription className="text-xs">
            Receba um resumo automatizado do desempenho das suas redes sociais diretamente em sua
            caixa de entrada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold">E-mail de Destino</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-xs"
              placeholder="seu-email@dominio.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Frequência do Envio</label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="weekly">Semanal (Toda Segunda-feira às 08h)</SelectItem>
                <SelectItem value="monthly">Mensal (Todo dia 1º às 08h)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="text-xs bg-primary text-white"
            >
              {saving ? 'Salvando...' : 'Confirmar Agendamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
