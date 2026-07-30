import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Plus, Zap } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { Mission } from '@/types/gamification'

interface MissionListProps {
  missions: Mission[]
  onCompleteStep: (missionId: string) => void
}

export function MissionList({ missions, onCompleteStep }: MissionListProps) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('weekly')

  const renderMission = (mission: Mission) => {
    const percentage = Math.round((mission.current / mission.target) * 100)

    return (
      <Card key={mission.id} className={cn('p-4 space-y-3', mission.completed && 'opacity-70')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">{mission.title}</h4>
              {mission.completed && (
                <Badge className="bg-emerald-500 text-white text-[9px] gap-0.5">
                  <Check className="w-2.5 h-2.5" /> Concluída
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{mission.description}</p>
          </div>
          <Badge variant="secondary" className="text-[10px] gap-0.5 shrink-0">
            <Zap className="w-3 h-3 text-amber-500" /> +{mission.xpReward} XP
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {mission.current}/{mission.target} concluídos
            </span>
            <span className="font-semibold">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <div className="flex items-center gap-2">
          {!mission.completed && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCompleteStep(mission.id)}
              className="text-xs h-7 gap-1"
            >
              <Plus className="w-3 h-3" /> Completar etapa
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(mission.link)}
            className="text-xs h-7 gap-1 ml-auto"
          >
            Ir <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </Card>
    )
  }

  const weeklyMissions = missions.filter((m) => m.type === 'weekly')
  const monthlyMissions = missions.filter((m) => m.type === 'monthly')

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="grid w-full grid-cols-2 max-w-xs">
        <TabsTrigger value="weekly" className="text-xs">
          Central de Missões
        </TabsTrigger>
        <TabsTrigger value="monthly" className="text-xs">
          Missões Mensais
        </TabsTrigger>
      </TabsList>
      <TabsContent value="weekly" className="space-y-3 mt-4">
        {weeklyMissions.map(renderMission)}
      </TabsContent>
      <TabsContent value="monthly" className="space-y-3 mt-4">
        {monthlyMissions.map(renderMission)}
      </TabsContent>
    </Tabs>
  )
}
