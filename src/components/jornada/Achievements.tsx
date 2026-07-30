import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Achievement } from '@/types/gamification'

interface AchievementsProps {
  achievements: Achievement[]
}

export function Achievements({ achievements }: AchievementsProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold">Conquistas</h3>
        <span className="text-xs text-muted-foreground">
          {unlockedCount}/{achievements.length} desbloqueadas
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {achievements.map((achievement) => (
          <Card
            key={achievement.id}
            className={cn(
              'p-4 text-center space-y-2 transition-all',
              achievement.unlocked
                ? 'border-primary/30 bg-primary/5'
                : 'opacity-50 grayscale border-border/50',
            )}
          >
            <div className="text-3xl">{achievement.icon}</div>
            <div>
              <p className="text-xs font-bold">{achievement.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                {achievement.description}
              </p>
            </div>
            {achievement.unlocked && achievement.date && (
              <p className="text-[9px] text-primary font-medium">{achievement.date}</p>
            )}
            {!achievement.unlocked && <p className="text-[9px] text-muted-foreground">Bloqueada</p>}
          </Card>
        ))}
      </div>
    </div>
  )
}
