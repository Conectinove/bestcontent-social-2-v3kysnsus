import { Users, Eye, TrendingUp, TrendingDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface ReachImpressionsBlockProps {
  reach: number
  impressions: number
  /** Tendência vs período anterior, em % (positivo = crescimento) */
  trendPct?: number
  /** true quando são dados oficiais da rede; false = Estimativa Calibrada */
  official?: boolean
  accent?: string
  className?: string
}

function fmt(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return Number(n || 0).toLocaleString('pt-BR')
}

/**
 * Bloco dedicado de Alcance / Impressões / Tendência reutilizável pelos
 * widgets do feed. Segue o padrão visual das grades de métricas existentes.
 */
export function ReachImpressionsBlock({
  reach,
  impressions,
  trendPct = 0,
  official = false,
  accent = 'text-purple-500',
  className = '',
}: ReachImpressionsBlockProps) {
  const trendPositive = trendPct >= 0
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
            <Users className={`w-3 h-3 ${accent}`} />
            <span>Alcance</span>
          </div>
          <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
            {fmt(reach)}
          </p>
          <span className="text-[10px] font-medium text-muted-foreground">contas alcançadas</span>
        </div>
        <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
            <Eye className="w-3 h-3 text-blue-500" />
            <span>Impressões</span>
          </div>
          <p className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
            {fmt(impressions)}
          </p>
          <span className="text-[10px] font-medium text-muted-foreground">exibições</span>
        </div>
        <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60">
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground mb-0.5">
            {trendPositive ? (
              <TrendingUp className="w-3 h-3 text-emerald-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-rose-500" />
            )}
            <span>Tendência</span>
          </div>
          <p
            className={`text-sm sm:text-base font-extrabold tracking-tight ${
              trendPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trendPositive ? '+' : ''}
            {trendPct.toFixed(1)}%
          </p>
          <span className="text-[10px] font-medium text-muted-foreground">vs período anterior</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground px-1">
        {official
          ? '✓ Dados Oficiais — alcance e impressões da rede'
          : 'Estimativa Calibrada — benchmark do segmento'}
      </p>
    </div>
  )
}

export function ReachImpressionsSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}
