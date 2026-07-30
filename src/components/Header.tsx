import { useState } from 'react'
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
} from 'lucide-react'
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

interface HeaderProps {
  onOpenMobileMenu: () => void
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
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

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10 px-4 flex items-center justify-between gap-4">
      {/* Left side: Mobile Hamburger + Brand Filter Selector */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="md:hidden text-foreground"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Brand Selector Dropdown */}
        <div className="hidden sm:flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <select
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
            className="text-sm font-medium bg-muted text-foreground border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
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

      {/* Middle: Global Search */}
      <div className="flex-1 max-w-md relative hidden sm:block">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Pesquisar marcas, ideias ou posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-sm bg-muted/50 border-border focus-visible:ring-primary"
        />
      </div>

      {/* Right side: New Post CTA, Theme Toggle, Notifications & User Avatar */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => navigate('/app/content/new')}
          className="hidden sm:flex bg-primary hover:bg-primary/90 text-white font-medium text-xs gap-1 h-9 rounded-lg shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Post</span>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          title="Alternar tema"
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
              className="h-9 w-9 relative text-muted-foreground hover:text-foreground"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full ring-2 ring-background animate-pulse" />
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
            <Button variant="ghost" className="p-0 h-9 w-9 rounded-full ring-2 ring-primary/20">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() || 'BC'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/app/settings')}>
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/app/brands')}>
              <Palette className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Minhas Marcas</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair da conta</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
