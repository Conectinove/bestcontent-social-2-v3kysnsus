import { Trophy, Zap } from 'lucide-react'

interface LevelCardProps {
  xp: number
  maxXp: number
  level: string
}

export function LevelCard({ xp, maxXp, level }: LevelCardProps) {
  const percentage = Math.round((xp / maxXp) * 100)
  const remaining = maxXp - xp

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-pink-600 p-6 text-white shadow-lg">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />

      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-white/70 uppercase tracking-wider">Nível Atual</p>
              <h2 className="text-xl font-bold">{level}</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/70">Total XP</p>
            <p className="text-2xl font-extrabold">{xp}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/80">Progresso para o próximo nível</span>
            <span className="font-bold">
              {xp}/{maxXp} XP ({percentage}%)
            </span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-white/70 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Faltam apenas {remaining} XP para o próximo nível
          </p>
        </div>
      </div>
    </div>
  )
}
