import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  CheckCheck,
  User,
  LogOut,
  Palette,
  Loader2,
  Rocket,
  CreditCard,
  Gift,
  Settings as SettingsIcon,
  Command,
} from 'lucide-react'
import { QuickSearchPalette } from '@/components/QuickSearchPalette'
import { useSocial } from '@/context/SocialContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { EditProfileModal } from '@/components/EditProfileModal'

interface HeaderProps {
  onOpenMobileMenu: () => void
  onOpenEditProfile?: () => void
}

export function Header({ onOpenMobileMenu, onOpenEditProfile }: HeaderProps) {
  const {
    searchQuery,
    setSearchQuery,
    notifications,
    markAllNotificationsRead,
    theme,
    toggleTheme,
    brands,
    selectedBrandId,
    setSelectedBrandId,
  } = useSocial()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [publishLoading, setPublishLoading] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false)

  // Atalho global Ctrl+K / ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handlePublish = async () => {
    setPublishLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast({
        title: 'App publicado com sucesso!',
        description: 'Abrindo https://bestcontent-social-2-5614f.goskip.app...',
      })
      window.open('https://bestcontent-social-2-5614f.goskip.app', '_blank', 'noopener,noreferrer')
    } catch {
      toast({
        title: 'Falha na publicação',
        description: 'Não foi possível publicar o app. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setPublishLoading(false)
    }
  }

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10 px-2.5 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-4 max-w-full overflow-hidden">
      {/* Left side: Mobile Hamburger + Brand Filter Selector */}
      <div className="flex items-center gap-1 sm:gap-3 min-w-0 shrink">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="md:hidden text-foreground h-10 w-10 min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center rounded-xl"
          aria-label="Abrir menu lateral"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Brand Selector Dropdown */}
        <div className="hidden sm:flex items-center gap-2 min-w-0">
          <Palette className="w-4 h-4 text-primary shrink-0" />
          <select
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
            className="text-sm font-medium bg-muted text-foreground border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary truncate max-w-[150px] lg:max-w-[200px]"
          >
            <option value="all">Todas as Marcas</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Middle: Global Search (Abre a Command Palette em 1 clique ou com Ctrl+K) */}
      <div
        onClick={() => setSearchPaletteOpen(true)}
        className="flex-1 max-w-md relative hidden md:block min-w-0 cursor-pointer group"
      >
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-purple-600 transition-colors" />
        <div className="pl-9 pr-12 h-9 text-sm bg-muted/50 group-hover:bg-muted/80 border border-border group-hover:border-purple-500/50 rounded-xl flex items-center justify-between text-muted-foreground transition-all">
          <span className="truncate text-xs sm:text-sm">Pesquisar marcas, ideias ou posts...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-background text-muted-foreground rounded border border-border/80 shadow-xs">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </div>
      </div>

      {/* Mobile Search Button (<md): Abre a Command Palette */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSearchPaletteOpen(true)}
        className="md:hidden text-foreground h-10 w-10 min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center rounded-xl"
        title="Buscar (Ctrl+K)"
        aria-label="Abrir busca rápida"
      >
        <Search className="w-5 h-5 text-muted-foreground" />
      </Button>

      {/* Right side: New Post CTA, Theme Toggle, Notifications & User Avatar */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Compact CTA buttons on mobile/tablet up to desktop */}
        {/* Under 420px: icon-only buttons (min-w-[44px] touch target). 420px+: icon + short label */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={publishLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-9 px-2 sm:px-3 rounded-lg aggressive-button flex items-center justify-center gap-1 shrink-0 whitespace-nowrap"
            title="Publicar App"
            aria-label="Publicar App"
          >
            {publishLoading ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <Rocket className="w-4 h-4 shrink-0" />
            )}
            <span className="hidden xs:inline">PUBLICAR</span>
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/app/content/new')}
            className="bg-primary hover:bg-primary/90 text-white font-black text-xs h-9 px-2 sm:px-3 rounded-lg aggressive-button flex items-center justify-center gap-1 shrink-0 whitespace-nowrap"
            title="Novo Post"
            aria-label="Criar novo post"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">NOVO POST</span>
            <span className="hidden xs:inline sm:hidden">POST</span>
          </Button>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-10 w-10 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground rounded-xl shrink-0"
          title="Alternar tema"
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-yellow-400" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 min-h-[44px] min-w-[44px] relative text-muted-foreground hover:text-foreground shrink-0 rounded-xl"
              aria-label="Notificações"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full ring-2 ring-background animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Notificações</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {unreadCount} novas
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllNotificationsRead}
                  className="text-xs h-7 text-primary hover:text-primary/80"
                >
                  <CheckCheck className="w-3 h-3 mr-1" /> Marcar lidas
                </Button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">Sem notificações</p>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 text-xs space-y-1 transition-colors ${
                      item.read ? 'opacity-70 bg-transparent' : 'bg-primary/5 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{item.title}</span>
                      <span className="text-[10px] text-muted-foreground">{item.time}</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{item.message}</p>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-0 h-10 w-10 min-h-[44px] min-w-[44px] rounded-full ring-2 ring-primary/20 flex items-center justify-center shrink-0 hover:ring-primary/50 transition-all focus:outline-hidden focus:ring-2 focus:ring-primary"
              aria-label="Perfil do usuário"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() || 'BC'}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none truncate">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (onOpenEditProfile) {
                  onOpenEditProfile()
                } else {
                  setEditProfileOpen(true)
                }
              }}
            >
              <User className="mr-2 h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Editar Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/app/indicar')}>
              <Gift className="mr-2 h-4 w-4 text-purple-600" />
              <span className="font-semibold text-foreground">Indique e Ganhe</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/app/subscription')}>
              <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">Minha Assinatura</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/app/settings')}>
              <SettingsIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Quick action for Mobile in Profile menu too */}
            <DropdownMenuItem
              onClick={handlePublish}
              className="sm:hidden text-emerald-600 font-semibold"
            >
              <Rocket className="mr-2 h-4 w-4 text-emerald-600" />
              <span>Publicar App</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/app/content/new')}
              className="sm:hidden text-primary font-semibold"
            >
              <Plus className="mr-2 h-4 w-4 text-primary" />
              <span>Criar Novo Post</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="sm:hidden" />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair da conta</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditProfileModal open={editProfileOpen} onOpenChange={setEditProfileOpen} />

      {/* Global Quick Search Command Palette (Ctrl+K) */}
      <QuickSearchPalette open={searchPaletteOpen} onOpenChange={setSearchPaletteOpen} />
    </header>
  )
}
