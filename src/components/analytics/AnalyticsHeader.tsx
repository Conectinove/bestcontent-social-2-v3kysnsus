import { Download, Mail, Instagram, Facebook, Layers } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AnalyticsHeaderProps {
  demoMode: boolean
  onToggleDemoMode: (val: boolean) => void
  selectedPlatform: 'all' | 'Instagram' | 'Facebook'
  onSelectPlatform: (platform: 'all' | 'Instagram' | 'Facebook') => void
  onOpenExport: () => void
  onOpenSchedule: () => void
}

export function AnalyticsHeader({
  demoMode,
  onToggleDemoMode,
  selectedPlatform,
  onSelectPlatform,
  onOpenExport,
  onOpenSchedule,
}: AnalyticsHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-3">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-[10px]">
            i
          </span>
          <span>
            <strong>Módulo em beta.</strong> Funcionalidades, métricas e visual podem sofrer
            alterações durante este período.
          </span>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <span className="font-medium text-foreground">Modo demonstração</span>
          <Switch checked={demoMode} onCheckedChange={onToggleDemoMode} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics</h1>
            <Badge
              variant="secondary"
              className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none text-[10px] uppercase font-bold px-2"
            >
              A BETA
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Estatísticas das contas conectadas — Instagram e Facebook
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenExport}
            className="gap-2 text-xs rounded-xl shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSchedule}
            className="gap-2 text-xs rounded-xl shadow-xs"
          >
            <Mail className="w-3.5 h-3.5" />
            Agendar e-mail
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl max-w-fit">
        <button
          onClick={() => onSelectPlatform('Instagram')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all',
            selectedPlatform === 'Instagram'
              ? 'bg-white dark:bg-slate-800 text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Instagram className="w-3.5 h-3.5 text-pink-500" />
          Instagram
        </button>
        <button
          onClick={() => onSelectPlatform('Facebook')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all',
            selectedPlatform === 'Facebook'
              ? 'bg-white dark:bg-slate-800 text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Facebook className="w-3.5 h-3.5 text-blue-600" />
          Facebook
        </button>
        <button
          onClick={() => onSelectPlatform('all')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all',
            selectedPlatform === 'all'
              ? 'bg-white dark:bg-slate-800 text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Layers className="w-3.5 h-3.5 text-slate-600" />
          Todas as redes
        </button>
      </div>
    </div>
  )
}
