import { Sparkles, Pin, Shield, Zap, Crown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function CommunityStatusBadges({
  category,
  tags,
  isPinned,
}: {
  category?: string
  tags?: string[]
  isPinned?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
      {category && (
        <Badge
          variant="outline"
          className="bg-secondary/50 text-secondary-foreground border-border text-[11px] rounded-md font-medium max-w-full truncate"
        >
          {category}
        </Badge>
      )}
      {tags?.includes('Destaque') && (
        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/30 text-[11px] rounded-md font-medium gap-1"
        >
          <Sparkles className="w-3 h-3" /> Destaque
        </Badge>
      )}
      {isPinned && (
        <Badge
          variant="outline"
          className="bg-secondary/50 text-foreground border-border text-[11px] rounded-md font-medium gap-1"
        >
          <Pin className="w-3 h-3" /> Fixado
        </Badge>
      )}
    </div>
  )
}

/** Badge de cargo: usa o tema (bg-primary p/ admin, gradientes temáticos para tiers). */
export function CommunityRoleBadge({ roleBadge }: { roleBadge: string }) {
  if (roleBadge === 'ADMIN') {
    return (
      <Badge className="bg-primary text-primary-foreground text-[10px] h-5 px-1.5 gap-1 font-semibold">
        <Shield className="w-3 h-3 fill-current" /> ADMIN
      </Badge>
    )
  }
  if (roleBadge === 'PRO') {
    return (
      <Badge className="bg-primary text-primary-foreground text-[10px] h-5 px-1.5 gap-1 font-semibold opacity-90">
        <Zap className="w-3 h-3 fill-current" /> PRO
      </Badge>
    )
  }
  if (roleBadge === 'MAX') {
    return (
      <Badge className="bg-primary/85 text-primary-foreground text-[10px] h-5 px-1.5 gap-1 font-semibold">
        <Crown className="w-3 h-3 fill-current" /> MAX
      </Badge>
    )
  }
  return (
    <Badge
      variant="secondary"
      className="bg-secondary/70 text-secondary-foreground text-[10px] h-5 px-1.5 font-medium"
    >
      {roleBadge || 'BASIC'}
    </Badge>
  )
}
