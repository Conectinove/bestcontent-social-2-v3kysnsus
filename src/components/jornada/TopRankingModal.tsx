import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trophy } from 'lucide-react'
import { generateRanking } from '@/lib/jornada-data'
import { cn } from '@/lib/utils'

interface TopRankingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TopRankingModal({ open, onOpenChange }: TopRankingModalProps) {
  const ranking = generateRanking()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] p-0">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Trophy className="w-5 h-5 text-amber-500" />
            Top 100 — Ranking Global
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <div className="divide-y divide-border">
            {ranking.map((user) => (
              <div
                key={user.position}
                className={cn(
                  'flex items-center gap-3 p-3',
                  user.name === 'Você' && 'bg-primary/5',
                )}
              >
                <span
                  className={cn(
                    'w-8 text-center font-bold text-sm',
                    user.position === 1 && 'text-amber-500',
                    user.position === 2 && 'text-gray-400',
                    user.position === 3 && 'text-orange-700',
                    user.position > 3 && 'text-muted-foreground',
                  )}
                >
                  {user.position}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-xs">{user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.name}
                    {user.name === 'Você' && <span className="text-primary ml-1">(Você)</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{user.level}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {user.xp} XP
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
