import { Flame, PenTool, CheckCircle2, Trophy, Medal, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StatsGridProps {
  offensiveDays: number
  postsCreated: number
  missionsCompleted: number
  globalRanking: number
  monthlyRanking: number
  monthlyCountdown: number
  onShowRanking: () => void
}

export function StatsGrid({
  offensiveDays,
  postsCreated,
  missionsCompleted,
  globalRanking,
  monthlyRanking,
  monthlyCountdown,
  onShowRanking,
}: StatsGridProps) {
  const stats = [
    {
      label: 'Dias de Ofensiva',
      value: offensiveDays,
      icon: Flame,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Posts Criados',
      value: postsCreated,
      icon: PenTool,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Missões Concluídas',
      value: missionsCompleted,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="p-4 space-y-2">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', s.bg)}>
                <Icon className={cn('w-4 h-4', s.color)} />
              </div>
              <div>
                <p className="text-2xl font-extrabold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {s.label}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-extrabold">#{globalRanking}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Ranking Global
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onShowRanking} className="text-xs gap-1">
            <Eye className="w-3 h-3" /> Ver Top 100
          </Button>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Medal className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xl font-extrabold">#{monthlyRanking}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Ranking do Mês
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-purple-500">{monthlyCountdown} dias</p>
            <p className="text-[10px] text-muted-foreground">restantes</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
