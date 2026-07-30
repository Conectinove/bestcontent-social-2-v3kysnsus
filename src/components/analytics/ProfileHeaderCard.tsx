import { Calendar, RefreshCw, ExternalLink } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ProfileHeaderCardProps {
  platform: 'all' | 'Instagram' | 'Facebook'
  userAvatar?: string
  userName?: string
  period: string
  onPeriodChange: (val: string) => void
  onRefresh: () => void
  isRefreshing?: boolean
}

export function ProfileHeaderCard({
  platform,
  userAvatar,
  userName = 'Admin',
  period,
  onPeriodChange,
  onRefresh,
  isRefreshing,
}: ProfileHeaderCardProps) {
  const getInfo = () => {
    if (platform === 'Instagram') {
      return {
        subtitle: 'Instagram',
        title: '@ronaldo.barreto1',
        url: 'https://instagram.com/ronaldo.barreto1',
      }
    }
    if (platform === 'Facebook') {
      return {
        subtitle: 'Facebook',
        title: 'Conectinove Oficial',
        url: 'https://facebook.com',
      }
    }
    return {
      subtitle: 'Visão consolidada',
      title: 'Instagram + Facebook',
      url: null,
    }
  }

  const info = getInfo()

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
      <div className="flex items-center gap-3.5">
        <div className="relative">
          <Avatar className="w-11 h-11 border border-border shadow-xs">
            <AvatarImage
              src={userAvatar || 'https://img.usecurling.com/ppl/medium?gender=male&seed=1'}
            />
            <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          {platform === 'Instagram' && (
            <span className="absolute -bottom-1 -right-1 bg-pink-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-background">
              IG
            </span>
          )}
          {platform === 'Facebook' && (
            <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-background">
              FB
            </span>
          )}
        </div>

        <div>
          <span className="text-xs text-muted-foreground font-medium block">{info.subtitle}</span>
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-bold tracking-tight">{info.title}</h2>
            {info.url && (
              <a
                href={info.url}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center items-start gap-2.5 w-full md:w-auto shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Período</span>
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-44 text-xs h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Mês atual</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground">
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
        <span className="text-[11px] text-muted-foreground block text-right">
          Dados disponíveis desde 01 de maio de 2026
        </span>
      </div>
    </div>
  )
}
