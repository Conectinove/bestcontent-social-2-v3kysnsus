import { Users, TrendingDown, TrendingUp, Info } from 'lucide-react'

interface MetricsCardsProps {
  platform: 'all' | 'Instagram' | 'Facebook'
  totalFollowers: number | string
  growth30d: number
  growthPercent: number
  postsCount: number
}

export function MetricsCards({
  platform,
  totalFollowers,
  growth30d,
  growthPercent,
  postsCount,
}: MetricsCardsProps) {
  const isNegative = growthPercent < 0

  if (platform === 'all') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold tracking-wider uppercase">
            <span className="flex items-center gap-1">
              SEGUIDORES TOTAIS
              <Info className="w-3.5 h-3.5 text-muted-foreground/70" />
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold tracking-tight">
              {typeof totalFollowers === 'number'
                ? (totalFollowers / 1000).toFixed(1) + 'k'
                : totalFollowers}
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-semibold mt-1 ${
                isNegative ? 'text-red-500' : 'text-emerald-500'
              }`}
            >
              {isNegative ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              <span>
                {growthPercent > 0 ? '+' : ''}
                {growthPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2 shadow-xs">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
          SEGUIDORES
        </span>
        <div>
          <div className="text-3xl font-extrabold tracking-tight">
            {typeof totalFollowers === 'number'
              ? totalFollowers.toLocaleString('pt-BR')
              : totalFollowers}
          </div>
          <span className="text-xs text-muted-foreground block mt-1">
            {platform === 'Instagram' ? '@ronaldo.barreto1' : 'Conectinove Oficial'}
          </span>
        </div>
      </div>

      <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2 shadow-xs">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
          CRESCIMENTO 30D
        </span>
        <div>
          <div className="text-3xl font-extrabold tracking-tight">
            {growth30d > 0 ? `+${growth30d}` : growth30d}
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-medium mt-1 ${
              isNegative ? 'text-red-500' : 'text-emerald-500'
            }`}
          >
            {isNegative ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5" />
            )}
            <span>
              {growthPercent > 0 ? '+' : ''}
              {growthPercent}% seguidores líquidos no período
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2 shadow-xs">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
          POSTS PUBLICADOS
        </span>
        <div>
          <div className="text-3xl font-extrabold tracking-tight">{postsCount}</div>
          <span className="text-xs text-muted-foreground block mt-1">
            média {Math.round(postsCount / 4)} por semana
          </span>
        </div>
      </div>
    </div>
  )
}
