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
  Users,
  LayoutDashboard,
  CreditCard,
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
    { label: 'Visão Geral', href: '/app/feed', icon: LayoutDashboard },
    { label: 'Feed Comunidade', href: '/app/feed-comunidade', icon: Home },
    { label: 'Portal do Cliente', href: '/app/portal-cliente', icon: Users },
    { label: 'Criar', href: '/app/criar', icon: Wand2 },
    { label: 'Marcas', href: '/app/brands', icon: Palette },
    { label: 'Conteúdo', href: '/app/content/new', icon: PenTool },
    { label: 'Biblioteca', href: '/app/library', icon: BookOpen },
    { label: 'Calendário', href: '/app/calendar', icon: CalendarIcon },
    { label: 'Comunidade', href: '/app/community', icon: Sparkles },
    { label: 'Descobrir', href: '/app/discover', icon: Compass },
    { label: 'Assinatura', href: '/app/subscription', icon: CreditCard },
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
            <div className="flex items-center gap-1.5 font-bold text-lg tracking-tight text-foreground">
              <span className="text-foreground">bestcontent</span>
              <span className="text-[10px] font-semibold text-primary uppercase bg-primary/10 px-1 py-0.5 rounded">
                AI
              </span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hidden md:flex h-8 w-8 rounded-full hover:bg-sidebar-accent text-muted-foreground"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Brand Selector Dropdown in Sidebar */}
        {!collapsed && (
          <div className="px-3 pt-3">
            <Link
              to="/app/brands"
              className="flex items-center justify-between p-2 rounded-xl bg-muted/60 hover:bg-muted transition-colors border border-border/50 text-xs font-semibold text-foreground group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  M
                </div>
                <span className="truncate">MudarCurso</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-2 space-y-1 mt-2">
          {/* Visão Geral (Central Operacional - Rota padrão /app/feed e /app/visao-geral) */}
          <Link
            to="/app/feed"
            onClick={onMobileClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              location.pathname === '/app/feed' ||
                location.pathname === '/app/visao-geral' ||
                location.pathname === '/'
                ? 'bg-muted text-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
            title={collapsed ? 'Visão Geral' : undefined}
          >
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4 shrink-0 text-primary">
              <div className="bg-current rounded-[2px]" />
              <div className="bg-current rounded-[2px]" />
              <div className="bg-current rounded-[2px]" />
              <div className="bg-current rounded-[2px]" />
            </div>
            {!collapsed && <span>Visão Geral</span>}
          </Link>

          {/* Feed Comunidade */}
          <Link
            to="/app/feed-comunidade"
            onClick={onMobileClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              location.pathname === '/app/feed-comunidade'
                ? 'bg-muted text-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
            title={collapsed ? 'Feed da Comunidade' : undefined}
          >
            <Home className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Feed Criadores</span>}
          </Link>

          {/* Portal do Cliente (MAX) */}
          <Link
            to="/app/portal-cliente"
            onClick={onMobileClose}
            className={cn(
              'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              location.pathname === '/app/portal-cliente'
                ? 'bg-muted text-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
            title={collapsed ? 'Portal do Cliente' : undefined}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Portal Cliente</span>}
            </div>
            {!collapsed && (
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded tracking-wider uppercase">
                MAX
              </span>
            )}
          </Link>

          {/* Criar CTA button */}
          <Link
            to="/app/criar"
            onClick={onMobileClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
              'bg-primary/10 text-primary hover:bg-primary/20',
            )}
            title={collapsed ? 'Criar' : undefined}
          >
            <span className="text-base font-bold leading-none">+</span>
            {!collapsed && <span>Criar</span>}
          </Link>

          {/* Biblioteca */}
          <Link
            to="/app/library"
            onClick={onMobileClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              location.pathname === '/app/library'
                ? 'bg-muted text-foreground font-bold'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
            title={collapsed ? 'Biblioteca' : undefined}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Biblioteca</span>}
          </Link>

          {/* Calendário */}
          <Link
            to="/app/calendar"
            onClick={onMobileClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              location.pathname === '/app/calendar'
                ? 'bg-muted text-foreground font-bold'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
            title={collapsed ? 'Calendário' : undefined}
          >
            <CalendarIcon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Calendário</span>}
          </Link>

          {/* Analytics (BETA) */}
          <Link
            to="/app/discover"
            onClick={onMobileClose}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
            title={collapsed ? 'Analytics' : undefined}
          >
            <div className="flex items-center gap-3">
              <BarChart2 className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Analytics</span>}
            </div>
            {!collapsed && (
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded tracking-wider uppercase">
                BETA
              </span>
            )}
          </Link>

          {/* Inspiração (BETA) */}
          <Link
            to="/app/discover"
            onClick={onMobileClose}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
            title={collapsed ? 'Inspiração' : undefined}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Inspiração</span>}
            </div>
            {!collapsed && (
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded tracking-wider uppercase">
                BETA
              </span>
            )}
          </Link>

          {/* Minha Agência section */}
          {!collapsed && (
            <div className="pt-3 pb-1">
              <div className="px-3 py-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Minha Agência</span>
                </div>
                <ChevronRight className="w-3 h-3 rotate-90 text-muted-foreground" />
              </div>
              <div className="space-y-0.5 pl-2 mt-1">
                <Link
                  to="/app/feed"
                  onClick={onMobileClose}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
                >
                  <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5 shrink-0 opacity-70">
                    <div className="bg-current rounded-[1px]" />
                    <div className="bg-current rounded-[1px]" />
                    <div className="bg-current rounded-[1px]" />
                    <div className="bg-current rounded-[1px]" />
                  </div>
                  <span>Visão Geral</span>
                </Link>
                <Link
                  to="/app/calendar"
                  onClick={onMobileClose}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
                >
                  <CalendarIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span>Calendário Global</span>
                </Link>
                <Link
                  to="/app/portal-cliente"
                  onClick={onMobileClose}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span>Portal do cliente</span>
                </Link>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Footer User & Credits Info */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {!collapsed && (
          <Link
            to="/app/subscription"
            onClick={onMobileClose}
            className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-muted/60 hover:bg-muted rounded-lg transition-colors group cursor-pointer border border-border/40"
            title="Ver meus créditos e assinatura"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="font-bold text-foreground">3400</span>
              <span className="text-[10px] text-muted-foreground uppercase font-medium">
                créditos
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Recarregar
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </Link>
        )}
        <Link
          to="/app/subscription"
          onClick={onMobileClose}
          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-border">
            RB
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">Ronaldo Barreto</p>
              <p className="text-[10px] text-muted-foreground truncate">
                ronaldoconectinove@gmail.com
              </p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  )
}
