import { Palette, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { StudioThemeOption } from '@/hooks/use-studio-theme'

interface StudioThemeSwitcherProps {
  themes: StudioThemeOption[]
  currentId: string
  onSelect: (id: string) => void
}

/** Seletor de tema visual do Studio (claro/escuro + temas derivados das marcas). */
export const StudioThemeSwitcher: React.FC<StudioThemeSwitcherProps> = ({
  themes,
  currentId,
  onSelect,
}) => {
  const current = themes.find((t) => t.id === currentId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-xs font-bold gap-1.5 bg-card/80 backdrop-blur-md"
          title="Trocar tema visual do Studio"
        >
          <Palette className="w-3.5 h-3.5 text-purple-500" />
          <span className="hidden sm:inline">{current?.name || 'Tema'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Tema do Studio
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => onSelect(t.id)}
            className="gap-2.5 cursor-pointer"
          >
            <span
              className={cn(
                'w-5 h-5 rounded-full shrink-0 border border-black/10',
                t.id === currentId && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
              )}
              style={{ background: t.preview }}
            />
            <span className="flex-1 truncate text-xs font-semibold">{t.name}</span>
            <span className="text-[10px] uppercase text-muted-foreground">{t.mode}</span>
            {t.id === currentId && <Check className="w-3.5 h-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default StudioThemeSwitcher
