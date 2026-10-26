import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  BarChart2,
  BookOpen,
  Calendar as CalendarIcon,
  Compass,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Wand2,
  Users,
  LayoutDashboard,
  CreditCard,
  Plus,
  Check,
  Crown,
  Layers,
  Search,
  Megaphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSocial } from '@/context/SocialContext'
import { useAuth } from '@/context/AuthContext'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onMobileClose?: () => void
  onOpenQuickOnboarding?: () => void
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onMobileClose,
  onOpenQuickOnboarding,
}: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { brands, selectedBrandId, setSelectedBrandId } = useSocial()
  const { user } = useAuth()
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBrandDropdownOpen(false)
      }
    }
    if (brandDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [brandDropdownOpen])

  // Active brand resolution
  const activeBrand = brands.find((b: any) => b.id === selectedBrandId) || brands[0] || null

  const getBrandAvatar = (brand: any) => {
    if (brand?.logo && !brand.logo.includes('usecurling.com/i?q=brand')) {
      return (
        <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover rounded-lg" />
      )
    }
    const firstLetter = (brand?.name || 'M')[0].toUpperCase()
    return (
      <div className="w-full h-full rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
        {firstLetter}
      </div>
    )
  }

  return (
    <aside
      className={cn(
        'h-full bg-sidebar border-r border-sidebar-border flex flex-col justify-between transition-all duration-300 relative z-30',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div>
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border justify-between">
          <Link
            to="/app/feed"
            onClick={onMobileClose}
            className="flex items-center gap-2 overflow-hidden group"
          >
            {/* Colorful bestcontent icon matching Reference 1 & 2 */}
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <span className="font-black text-xs leading-none">b</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 font-bold text-lg tracking-tight text-foreground">
                <span className="text-foreground tracking-tight">MidiaViva</span>
                <span className="text-[10px] font-extrabold text-primary uppercase bg-primary/10 px-1 py-0.5 rounded leading-none">
                  AI
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground font-medium -mt-1">
                by BestContent AI
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

        {/* Brand Selector Dropdown in Sidebar (Reference 2) */}
        {!collapsed && (
          <div className="px-3 pt-3 relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setBrandDropdownOpen((prev) => !prev)}
              className={cn(
                'w-full flex items-center justify-between p-2 rounded-xl transition-all border text-xs font-semibold group',
                brandDropdownOpen
                  ? 'bg-muted border-primary/30 ring-2 ring-primary/10 shadow-xs'
                  : 'bg-muted/60 hover:bg-muted border-border/60 text-foreground',
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 flex items-center justify-center ring-1 ring-border/50">
                  {getBrandAvatar(activeBrand)}
                </div>
                <span className="truncate text-[13px] font-bold text-foreground">
                  {activeBrand?.name || 'MudarCurso'}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform duration-200',
                  brandDropdownOpen && 'rotate-180 text-primary',
                )}
              />
            </button>

            {/* Dropdown Menu Popup (Faithful to Reference 2) */}
            {brandDropdownOpen && (
              <div className="absolute left-3 right-3 top-full mt-2 z-50 bg-popover/98 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150 w-[300px]">
                {/* Header: MINHA ORGANIZAÇÃO + MAX + SUA */}
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-border/60 px-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Crown className="w-3.5 h-3.5 text-purple-600 fill-purple-600/30" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      MINHA ORGANIZAÇÃO
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 tracking-wider uppercase">
                      MAX
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground tracking-wider uppercase">
                      SUA
                    </span>
                  </div>
                </div>

                {/* Brand list */}
                <div className="space-y-1 max-h-[280px] overflow-y-auto pr-0.5 scrollbar-thin">
                  {brands.map((b: any) => {
                    const isSelected = activeBrand?.id === b.id || selectedBrandId === b.id
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSelectedBrandId(b.id)
                          setBrandDropdownOpen(false)
                        }}
                        className={cn(
                          'w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors group',
                          isSelected
                            ? 'bg-purple-500/10 hover:bg-purple-500/15'
                            : 'hover:bg-muted/80',
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                          <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 flex items-center justify-center ring-1 ring-border/50">
                            {getBrandAvatar(b)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate leading-snug">
                              {b.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                              {b.description || `${b.name} no MidiaViva`}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Dropdown footer actions */}
                <div className="pt-2 mt-2 border-t border-border/60 space-y-1 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setBrandDropdownOpen(false)
                      navigate('/app/brands')
                    }}
                    className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs font-semibold text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <Plus className="w-4 h-4 text-primary" />
                    <span>Adicionar Nova Marca</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBrandDropdownOpen(false)
                      navigate('/app/brands')
                    }}
                    className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Gerenciar Marcas</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-2 space-y-1 mt-2">
          {/* Visão Geral (Central Operacional) */}
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
            {!collapsed && <span>Dashboard</span>}
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
                ? 'bg-muted text-foreground font-bold shadow-xs'
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
                ? 'bg-muted text-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
            title={collapsed ? 'Calendário' : undefined}
          >
            <CalendarIcon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Calendário</span>}
          </Link>

          {/* Templates */}
          <Link
            to="/app/templates"
            onClick={onMobileClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              location.pathname === '/app/templates'
                ? 'bg-muted text-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
            title={collapsed ? 'Templates' : undefined}
          >
            <Layers className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Templates</span>}
          </Link>

          {/* Analytics */}
          <Link
            to="/app/analytics"
            onClick={onMobileClose}
            className={cn(
              'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              location.pathname === '/app/analytics'
                ? 'bg-muted text-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
            title={collapsed ? 'Analytics' : undefined}
          >
            <div className="flex items-center gap-3">
              <BarChart2 className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Analytics</span>}
            </div>
            {!collapsed && (
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded tracking-wider uppercase">
                PRO
              </span>
            )}
          </Link>

          {/* Inspiração */}
          <Link
            to="/app/discover"
            onClick={onMobileClose}
            className={cn(
              'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              location.pathname === '/app/discover'
                ? 'bg-muted text-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
            title={collapsed ? 'Inspiração' : undefined}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Inspiração</span>}
            </div>
            {!collapsed && (
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded tracking-wider uppercase">
                IA
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
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
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
                  <span>Dashboard Geral</span>
                </Link>
                <Link
                  to="/app/calendar"
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    location.pathname === '/app/calendar'
                      ? 'bg-purple-500/10 text-primary font-bold'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  <CalendarIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span>Calendário Global</span>
                </Link>
                <Link
                  to="/app/pages"
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    location.pathname === '/app/pages'
                      ? 'bg-purple-500/10 text-primary font-bold'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span>Páginas / Funis</span>
                  </div>
                </Link>
                <Link
                  to="/app/dashboard"
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    location.pathname === '/app/dashboard'
                      ? 'bg-purple-500/10 text-primary font-bold'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart2 className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span>Testes A/B</span>
                  </div>
                  <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1 py-0.2 rounded uppercase">
                    LABS
                  </span>
                </Link>
                <Link
                  to="/app/seo"
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    location.pathname === '/app/seo'
                      ? 'bg-purple-500/10 text-primary font-bold'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Search className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span>SEO Social</span>
                  </div>
                  <span className="text-[9px] font-bold text-purple-600 bg-purple-500/10 px-1 py-0.2 rounded uppercase">
                    NOVO
                  </span>
                </Link>
                <Link
                  to="/app/ads"
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    location.pathname === '/app/ads' || location.pathname === '/app/anuncios'
                      ? 'bg-purple-500/10 text-primary font-bold'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Megaphone className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span>Anúncios</span>
                  </div>
                  <span className="text-[9px] font-bold text-purple-600 bg-purple-500/10 px-1 py-0.2 rounded uppercase">
                    NOVO
                  </span>
                </Link>
                <Link
                  to="/app/portal-cliente"
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    location.pathname === '/app/portal-cliente'
                      ? 'bg-purple-500/10 text-primary font-bold'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span>Portal do cliente</span>
                  </div>
                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-1 py-0.2 rounded uppercase">
                    MAX
                  </span>
                </Link>
              </div>
            </div>
          )}

          {/* Comunidade */}
          <Link
            to="/app/feed-comunidade"
            onClick={onMobileClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              location.pathname === '/app/feed-comunidade'
                ? 'bg-muted text-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
            title={collapsed ? 'Comunidade' : undefined}
          >
            <Home className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Feed Criadores</span>}
          </Link>
        </nav>
      </div>

      {/* Footer User & Credits Info */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {/* Quick button to open Vamos Agilizar onboarding if user wants */}
        {!collapsed && onOpenQuickOnboarding && (
          <button
            type="button"
            onClick={onOpenQuickOnboarding}
            className="w-full flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold transition-all border border-purple-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vamos agilizar! (IA)</span>
          </button>
        )}

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
          to="/app/settings?edit=profile"
          onClick={onMobileClose}
          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted transition-colors text-left group"
          title="Editar Perfil"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-border group-hover:ring-primary transition-all overflow-hidden">
            {user?.avatar && !user.avatar.includes('seed=') ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span>{user?.name?.slice(0, 2).toUpperCase() || 'RB'}</span>
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {user?.name || 'Ronaldo Barreto'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {user?.email || 'ronaldoconectinove@gmail.com'}
              </p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  )
}
