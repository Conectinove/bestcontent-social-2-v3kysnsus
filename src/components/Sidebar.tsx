import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Palette,
  PenTool,
  BarChart2,
  BookOpen,
  Calendar as CalendarIcon,
  Compass,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Wand2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onMobileClose?: () => void
}

export function Sidebar({ collapsed, onToggleCollapse, onMobileClose }: SidebarProps) {
  const location = useLocation()

  const navItems = [
    { label: 'Feed', href: '/app/feed', icon: Home },
    { label: 'Criar', href: '/app/criar', icon: Wand2 },
    { label: 'Marcas', href: '/app/brands', icon: Palette },
    { label: 'Conteúdo', href: '/app/content/new', icon: PenTool },
    { label: 'Biblioteca', href: '/app/library', icon: BookOpen },
    { label: 'Calendário', href: '/app/calendar', icon: CalendarIcon },
    { label: 'Comunidade', href: '/app/community', icon: Sparkles },
    { label: 'Descobrir', href: '/app/discover', icon: Compass },
    { label: 'Configurações', href: '/app/settings', icon: Settings },
  ]

  const isActive = (path: string) => {
    if (path === '/app/feed' && location.pathname === '/') return true
    return location.pathname.startsWith(path)
  }

  return (
    <aside
      className={cn(
        'h-full bg-sidebar border-r border-sidebar-border flex flex-col justify-between transition-all duration-300 relative z-20',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div>
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border justify-between">
          <Link
            to="/app/feed"
            onClick={onMobileClose}
            className="flex items-center gap-2 overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="font-bold text-lg tracking-tight truncate bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                BestContent
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hidden md:flex h-8 w-8 rounded-full hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-2 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 shrink-0',
                    active ? 'text-white' : 'text-muted-foreground',
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Pro Badge or CTA */}
      {!collapsed && (
        <div className="p-3 m-3 rounded-xl bg-gradient-to-br from-primary/10 via-pink-500/10 to-amber-500/10 border border-primary/20 text-xs text-center space-y-2">
          <p className="font-semibold text-primary">IA Pro Ativada</p>
          <p className="text-muted-foreground text-[11px]">
            Gerador de legendas e tendências em tempo real
          </p>
        </div>
      )}
    </aside>
  )
}
