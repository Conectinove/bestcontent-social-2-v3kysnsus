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
  Clock,
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
import { StudioThemeSwitcher } from '@/components/studio/StudioThemeSwitcher'
import { useGlobalAppTheme } from '@/hooks/use-global-app-theme'
import type { NetworkThemeId } from '@/lib/network-themes'
import { getPendingReviewPosts } from '@/services/posts'
import {
  getMyNotifications,
  getUnreadNotificationsCount,
  markNotificationRead,
  markAllNotificationsRead as markAllPersistentRead,
  notificationTypeLabel,
  type AppNotification,
} from '@/services/notifications'

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
  // Tema global do app (accent, cores, modo) + rede social ativa — em qualquer tela
  const appTheme = useGlobalAppTheme(brands)
  const themeNetwork: NetworkThemeId = appTheme.networkId
  const activeTheme = appTheme.theme
  const [publishLoading, setPublishLoading] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false)
  // Badge de pendências de revisão (posts em_revisao / review_requested)
  const [pendingReviewCount, setPendingReviewCount] = useState(0)
  // Notificações persistidas do fluxo de aprovação (migration 0073)
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    let active = true
    const load = () => {
      getPendingReviewPosts(user.id)
        .then((list) => {
          if (active) setPendingReviewCount(list.length)
        })
        .catch(() => {
          /* silencioso — badge não deve quebrar o header */
        })
    }
    load()
    const interval = window.setInterval(load, 60000) // atualiza a cada 60s
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [user?.id])

  // Sino de notificações persistidas: lista + contagem de não lidas, a cada 60s
  useEffect(() => {
    if (!user?.id) return
    let active = true
    const load = async () => {
      const [list, count] = await Promise.all([
        getMyNotifications(user.id, 30),
        getUnreadNotificationsCount(user.id),
      ])
      if (active) {
        setAppNotifications(list)
        setUnreadNotifications(count)
      }
    }
    load()
    const interval = window.setInterval(load, 60000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [user?.id])

  /** Clique numa notificação: navega ao post e marca como lida. */
  const openNotification = (item: AppNotification) => {
    if (!item.is_read) {
      markNotificationRead(item.id)
        .then(() => setUnreadNotifications((c) => Math.max(0, c - 1)))
        .catch(() => undefined)
      setAppNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)),
      )
    }
    const postId = item.expand?.post?.id || item.post
    if (postId) {
      navigate(`/app/editor/${postId}`)
    } else {
      navigate('/app/library')
    }
  }

  const handleMarkAllRead = () => {
    markAllPersistentRead(user?.id)
      .then(() => setUnreadNotifications(0))
      .catch(() => undefined)
    setAppNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

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

  const unreadCount = unreadNotifications
  const notificationsLabel = notifications.length // contexto mock — mantido para compat
  void notificationsLabel

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

        {/* Badge de pendências de revisão — clica e vai para a Visão Geral (painel de pendências) */}
        {pendingReviewCount > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/app/visao-geral?pendencias=1')}
            className="h-10 w-10 min-h-[44px] min-w-[44px] relative text-amber-600 hover:text-amber-700 shrink-0 rounded-xl"
            title={`${pendingReviewCount} ${pendingReviewCount === 1 ? 'post aguardando revisão' : 'posts aguardando revisão'}`}
            aria-label="Pendências de revisão"
          >
            <Clock className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-background">
              {pendingReviewCount > 99 ? '99+' : pendingReviewCount}
            </span>
          </Button>
        )}

        {/* Theme Switcher global (tema + rede social + compartilhar com equipe) */}
        <StudioThemeSwitcher
          themes={appTheme.allThemes}
          themeId={appTheme.themeId}
          onSelect={appTheme.setThemeId}
          onCreateCustom={appTheme.addCustomTheme}
          onDeleteCustom={appTheme.removeCustomTheme}
          networkId={themeNetwork}
          onSelectNetwork={appTheme.setNetworkId}
          onToggleShared={appTheme.toggleShared}
          onStartPreview={appTheme.startPreview}
          onCancelPreview={appTheme.cancelPreview}
          onImportTheme={appTheme.importTheme}
          onUpdateTheme={appTheme.updateCustomTheme}
          isSaving={appTheme.isSaving}
        />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-10 w-10 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground rounded-xl shrink-0"
          title={activeTheme.mode === 'dark' ? 'Tema claro' : 'Tema escuro'}
          aria-label="Alternar tema"
        >
          {activeTheme.mode === 'dark' ? (
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
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-background">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
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
                  onClick={handleMarkAllRead}
                  className="text-xs h-7 text-primary hover:text-primary/80"
                >
                  <CheckCheck className="w-3 h-3 mr-1" /> Marcar todas
                </Button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-border">
              {appNotifications.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">Sem notificações</p>
              ) : (
                appNotifications.map((item) => {
                  const postTitle = item.expand?.post?.caption || item.expand?.post?.content || ''
                  const timeLabel = item.created
                    ? new Date(item.created).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })
                    : ''
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => openNotification(item)}
                      className={`w-full text-left p-3 text-xs space-y-1 transition-colors hover:bg-muted/60 ${
                        item.is_read ? 'opacity-70 bg-transparent' : 'bg-primary/5 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground truncate">
                          {notificationTypeLabel(item.type)}
                          {item.actor_name ? ` · ${item.actor_name}` : ''}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {timeLabel}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed line-clamp-2">
                        {item.message}
                      </p>
                      {postTitle && (
                        <span className="inline-flex items-center text-[10px] text-primary font-semibold">
                          Abrir post →
                        </span>
                      )}
                    </button>
                  )
                })
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
