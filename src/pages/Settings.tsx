import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  User,
  Sun,
  Moon,
  Shield,
  Link2,
  Check,
  Info,
  Loader2,
  Bell,
  Globe,
  Download,
  ExternalLink,
  CreditCard,
  Gift,
  Edit3,
  Lock,
  Instagram,
  Facebook,
  Linkedin,
  Unlink,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { useCustomization } from '@/context/CustomizationContext'
import { TikTokIcon, YouTubeIcon } from '@/pages/CreateHub'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { EditProfileModal } from '@/components/EditProfileModal'
import { getUserIntegrations, toggleIntegrationStatus } from '@/services/user_integrations'
import type { IntegrationNetwork, UserIntegrationRecord } from '@/types'

type TabKey = 'account' | 'subscription' | 'appearance' | 'integrations' | 'about'

const TABS: Array<{ key: TabKey; label: string; icon: typeof User; description: string }> = [
  {
    key: 'account',
    label: 'Conta & Perfil',
    icon: User,
    description: 'Gerencie seu perfil e dados pessoais',
  },
  {
    key: 'subscription',
    label: 'Minha Assinatura',
    icon: CreditCard,
    description: 'Plano atual, créditos e recargas',
  },
  {
    key: 'appearance',
    label: 'Aparência',
    icon: Sun,
    description: 'Personalize o tema e a interface',
  },
  {
    key: 'integrations',
    label: 'Integrações',
    icon: Link2,
    description: 'Conecte suas redes sociais',
  },
  { key: 'about', label: 'Sobre', icon: Info, description: 'Informações do aplicativo' },
]

export default function Settings() {
  const { user, updateProfile } = useAuth()
  const { theme, toggleTheme } = useSocial()
  const { menuLayout, appColor } = useCustomization()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState<TabKey>('account')
  const [editProfileOpen, setEditProfileOpen] = useState(
    () => searchParams.get('edit') === 'profile',
  )
  const [name, setName] = useState(user?.name || 'Ronaldo Barreto')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [notifEmail, setNotifEmail] = useState(user?.notif_email ?? true)
  const [notifPush, setNotifPush] = useState(user?.notif_push ?? false)

  // Integrations state
  const [integrations, setIntegrations] = useState<
    Record<IntegrationNetwork, { connected: boolean; connected_at?: string; external_id?: string }>
  >({
    instagram: { connected: true },
    tiktok: { connected: true },
    linkedin: { connected: true },
    youtube: { connected: false },
    facebook: { connected: false },
  })
  const [loadingIntegrations, setLoadingIntegrations] = useState(false)
  const [actionLoadingNetwork, setActionLoadingNetwork] = useState<IntegrationNetwork | null>(null)
  const [disconnectModalNet, setDisconnectModalNet] = useState<{
    network: IntegrationNetwork
    name: string
  } | null>(null)

  // Listen to searchParams changes so clicking sidebar or header updates modal state
  useEffect(() => {
    if (searchParams.get('edit') === 'profile') {
      setEditProfileOpen(true)
    }
  }, [searchParams])

  // Load user integrations from PocketBase
  useEffect(() => {
    if (!user?.id) return
    let isMounted = true

    const fetchIntegrations = async () => {
      setLoadingIntegrations(true)
      try {
        const records = await getUserIntegrations(user.id)
        if (!isMounted) return
        if (records.length > 0) {
          const map: Record<
            IntegrationNetwork,
            { connected: boolean; connected_at?: string; external_id?: string }
          > = {
            instagram: { connected: false },
            tiktok: { connected: false },
            linkedin: { connected: false },
            youtube: { connected: false },
            facebook: { connected: false },
          }

          records.forEach((rec) => {
            if (rec.network in map) {
              map[rec.network] = {
                connected: Boolean(rec.connected),
                connected_at: rec.connected_at,
                external_id: rec.external_id,
              }
            }
          })
          setIntegrations(map)
        }
      } catch (err) {
        console.error('Erro ao carregar integrações:', err)
      } finally {
        if (isMounted) setLoadingIntegrations(false)
      }
    }

    fetchIntegrations()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  const handleConnectIntegration = async (network: IntegrationNetwork, name: string) => {
    if (!user?.id) {
      toast({
        title: 'Atenção',
        description: 'Faça login para gerenciar suas conexões de rede social.',
        variant: 'destructive',
      })
      return
    }

    setActionLoadingNetwork(network)
    try {
      await toggleIntegrationStatus(user.id, network, true, name)
      setIntegrations((prev) => ({
        ...prev,
        [network]: {
          ...prev[network],
          connected: true,
          connected_at: new Date().toISOString(),
        },
      }))
      toast({
        title: 'Rede conectada com sucesso!',
        description: `${name} foi sincronizado na sua conta. Gerenciamento ativo.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Falha na conexão',
        description: 'Não foi possível conectar a rede social. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setActionLoadingNetwork(null)
    }
  }

  const handleConfirmDisconnect = async () => {
    if (!disconnectModalNet || !user?.id) return
    const { network, name } = disconnectModalNet

    setActionLoadingNetwork(network)
    setDisconnectModalNet(null)
    try {
      await toggleIntegrationStatus(user.id, network, false, name)
      setIntegrations((prev) => ({
        ...prev,
        [network]: {
          ...prev[network],
          connected: false,
          connected_at: undefined,
        },
      }))
      toast({
        title: 'Rede desconectada',
        description: `${name} foi desconectado com sucesso da sua conta.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao desconectar',
        description: 'Não foi possível desconectar a rede social. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setActionLoadingNetwork(null)
    }
  }

  const handleOpenEditProfile = () => {
    setEditProfileOpen(true)
  }

  const handleCloseEditProfile = (open: boolean) => {
    setEditProfileOpen(open)
    if (!open && searchParams.has('edit')) {
      searchParams.delete('edit')
      setSearchParams(searchParams, { replace: true })
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
      updateProfile({ name, email })
      toast({
        title: 'Perfil Atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      })
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const activeTabMeta = TABS.find((t) => t.key === activeTab)!
  const ActiveIcon = activeTabMeta.icon

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="border-b border-border pb-5 mb-6">
        <h1 className="page-title flex items-center gap-2">
          Configurações
          <SettingsIcon className="w-6 h-6 text-primary" />
        </h1>
        <p className="page-description">
          Gerencie seu perfil, temas, integrações e preferências de conta.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-56 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible scrollbar-none pb-2 md:pb-0">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn('settings-nav-item shrink-0', active && 'settings-nav-item-active')}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          <Card className="aggressive-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 pb-5 border-b border-border mb-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ActiveIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{activeTabMeta.label}</h2>
                  <p className="text-xs text-muted-foreground">{activeTabMeta.description}</p>
                </div>
              </div>

              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">Plano Max Ativo</span>
                        <Badge className="bg-purple-600 text-white hover:bg-purple-600 text-[10px]">
                          👑 Max
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total Disponível: <strong>3.400 créditos</strong> (1.800 do plano + 1.600
                        extras)
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate('/app/subscription')}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl"
                    >
                      Acessar Gestão Completa
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-muted/60 border border-border/40">
                      <p className="text-xs text-muted-foreground">Slides</p>
                      <p className="text-lg font-black text-foreground">20</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/60 border border-border/40">
                      <p className="text-xs text-muted-foreground">Marcas</p>
                      <p className="text-lg font-black text-foreground">20</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/60 border border-border/40">
                      <p className="text-xs text-muted-foreground">Edições/post</p>
                      <p className="text-lg font-black text-foreground">12</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/60 border border-border/40">
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-lg font-black text-foreground">5</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-6">
                  {/* Profile Preview Card with CTA to open modal */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border border-purple-200 dark:border-purple-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <Avatar className="w-14 h-14 ring-2 ring-purple-500/30 shadow-sm">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {user?.name?.slice(0, 2).toUpperCase() || 'RB'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-base">
                            {user?.name || 'Ronaldo Barreto'}
                          </h3>
                          <Badge className="bg-purple-600 text-white hover:bg-purple-600 text-[10px]">
                            Pro
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {user?.email || 'ronaldoconectinove@gmail.com'}
                        </p>
                        {user?.bio && (
                          <p className="text-xs text-foreground/80 mt-1 line-clamp-1 italic">
                            "{user.bio}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        type="button"
                        onClick={handleOpenEditProfile}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-sm flex-1 sm:flex-initial"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Editar Perfil Completo
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/app/indicar')}
                        className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-xl gap-1.5 flex-1 sm:flex-initial"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        Indicar Amigos
                      </Button>
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                        💼 Profissão
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {user?.profession || 'Marketing Digital'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                        🏢 Empresa
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {user?.company || 'BestContent AI'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                        📷 Instagram
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {user?.instagram || '@ronaldobarreto'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                        🌐 Website
                      </p>
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.website || 'https://bestcontent.ai'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Fast Profile Form */}
                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Nome Completo
                      </label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-10 rounded-xl"
                        placeholder="Seu nome"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">E-mail</label>
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10 rounded-xl"
                        placeholder="seu@email.com"
                      />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold">
                          Preferências Rápidas de Notificação
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">Notificações por e-mail</p>
                          <p className="text-xs text-muted-foreground">
                            Receber atualizações por e-mail
                          </p>
                        </div>
                        <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">Notificações push</p>
                          <p className="text-xs text-muted-foreground">
                            Alertar no navegador desktop
                          </p>
                        </div>
                        <Switch checked={notifPush} onCheckedChange={setNotifPush} />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <Button
                        type="submit"
                        disabled={saving}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl min-w-[160px] font-bold"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          'Salvar Dados Rápidos'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleOpenEditProfile}
                        className="rounded-xl border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold"
                      >
                        Personalização Completa...
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Tema da Interface</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => theme === 'dark' && toggleTheme()}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200',
                          theme === 'light'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40',
                        )}
                      >
                        <Sun className="w-6 h-6 text-amber-500" />
                        <span className="text-xs font-semibold">Claro</span>
                        {theme === 'light' && <Check className="w-4 h-4 text-primary absolute" />}
                      </button>
                      <button
                        onClick={() => theme === 'light' && toggleTheme()}
                        className={cn(
                          'relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200',
                          theme === 'dark'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40',
                        )}
                      >
                        <Moon className="w-6 h-6 text-indigo-400" />
                        <span className="text-xs font-semibold">Escuro</span>
                        {theme === 'dark' && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Idioma</h3>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Português (Brasil)</span>
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        Padrão
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'integrations' && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">
                      Conecte suas redes sociais
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Conecte suas redes sociais para publicar e analisar conteúdo diretamente da
                      plataforma.
                    </p>
                  </div>

                  {/* Integration list cards */}
                  <div className="space-y-3">
                    {[
                      {
                        network: 'instagram' as IntegrationNetwork,
                        name: 'Instagram Graph API',
                        subtitle: 'Posts, Stories, Reels e Métricas de engajamento',
                        iconBg:
                          'bg-gradient-to-br from-[#833ab4]/15 via-[#fd1d1d]/15 to-[#fcb045]/15 border-pink-500/20 text-[#e1306c]',
                        renderIcon: () => <Instagram className="w-5 h-5 text-[#e1306c]" />,
                      },
                      {
                        network: 'tiktok' as IntegrationNetwork,
                        name: 'TikTok Creator API',
                        subtitle: 'Publicação de vídeos curtos, tendências e sons',
                        iconBg: 'bg-black/10 dark:bg-white/10 border-foreground/10 text-foreground',
                        renderIcon: () => <TikTokIcon className="w-5 h-5 text-foreground" />,
                      },
                      {
                        network: 'linkedin' as IntegrationNetwork,
                        name: 'LinkedIn API',
                        subtitle: 'Publicações corporativas, carrosséis e networking B2B',
                        iconBg: 'bg-[#0077b5]/15 border-[#0077b5]/20 text-[#0077b5]',
                        renderIcon: () => <Linkedin className="w-5 h-5 text-[#0077b5]" />,
                      },
                      {
                        network: 'youtube' as IntegrationNetwork,
                        name: 'YouTube Data API',
                        subtitle: 'Upload de Shorts, títulos otimizados e tags por IA',
                        iconBg: 'bg-[#ff0000]/15 border-[#ff0000]/20 text-[#ff0000]',
                        renderIcon: () => <YouTubeIcon className="w-5 h-5 text-[#ff0000]" />,
                      },
                      {
                        network: 'facebook' as IntegrationNetwork,
                        name: 'Facebook Pages API',
                        subtitle: 'Páginas comerciais, fotos, vídeos e métricas de alcance',
                        iconBg: 'bg-[#1877f2]/15 border-[#1877f2]/20 text-[#1877f2]',
                        renderIcon: () => <Facebook className="w-5 h-5 text-[#1877f2]" />,
                      },
                    ].map((item) => {
                      const isConnected = Boolean(integrations[item.network]?.connected)
                      const isActionLoading = actionLoadingNetwork === item.network

                      return (
                        <div
                          key={item.network}
                          className={cn(
                            'flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200',
                            isConnected
                              ? 'bg-card border-border hover:border-emerald-500/40 shadow-xs'
                              : 'bg-muted/30 border-border/70 hover:border-border hover:bg-muted/50',
                          )}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={cn(
                                'w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-xs',
                                item.iconBg,
                              )}
                            >
                              {item.renderIcon()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-foreground truncate">
                                  {item.name}
                                </p>
                                {isConnected ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Conectado e ativo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/80">
                                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                                    Não conectado
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {isConnected ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isActionLoading}
                                    className="h-8 px-3 rounded-lg text-xs font-semibold border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1.5 shadow-xs"
                                  >
                                    {isActionLoading ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    )}
                                    <span>Conectado</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48 rounded-xl shadow-lg"
                                >
                                  <div className="px-2.5 py-1.5">
                                    <p className="text-[11px] font-semibold text-foreground">
                                      {item.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      Status: Ativo
                                    </p>
                                  </div>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setDisconnectModalNet({
                                        network: item.network,
                                        name: item.name,
                                      })
                                    }
                                    className="text-xs text-destructive focus:text-destructive cursor-pointer gap-2"
                                  >
                                    <Unlink className="w-3.5 h-3.5" />
                                    <span>Desconectar rede</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isActionLoading}
                                onClick={() => handleConnectIntegration(item.network, item.name)}
                                className="h-8 px-3.5 rounded-lg text-xs font-semibold border-border hover:border-primary/50 hover:bg-primary/5 transition-all shadow-xs gap-1.5"
                              >
                                {isActionLoading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                                )}
                                <span>Conectar</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Clarification notice: platform managed & credentials */}
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                    <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground text-[11px]">
                        Gerenciamento de conexões na plataforma
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        A conexão das redes sociais é gerenciada e monitorada diretamente nesta
                        plataforma. A publicação automática externa nas redes oficiais será liberada
                        conforme as credenciais oficiais de API forem ativadas no seu ambiente.
                      </p>
                    </div>
                  </div>

                  {/* Footer note: encrypted & safe */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-muted-foreground">
                    <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Suas credenciais são armazenadas com segurança e criptografadas. Você pode
                      desconectar a qualquer momento.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-lg">
                      <SettingsIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">BestContent Social 2</h3>
                      <p className="text-xs text-muted-foreground">
                        Versão 2.4.0 — PWA Habilitado com IA generativa
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Modelo', value: 'SaaS' },
                      { label: 'Plataforma', value: 'Web App (PWA)' },
                      { label: 'IA Integrada', value: 'Skip AI Gateway' },
                      { label: 'Backend', value: 'Skip Cloud / PocketBase' },
                    ].map((item) => (
                      <div key={item.label} className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
                          {item.label}
                        </p>
                        <p className="text-sm font-medium mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" size="sm" className="text-xs gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Exportar Dados
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild>
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" /> Documentação
                      </a>
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">
                      © 2026 BestContent Social 2. Todos os direitos reservados.
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <a href="#" className="footer-link">
                        Privacidade
                      </a>
                      <a href="#" className="footer-link">
                        Termos de Uso
                      </a>
                      <a href="#" className="footer-link text-primary font-medium">
                        Suporte VIP
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      <Dialog
        open={Boolean(disconnectModalNet)}
        onOpenChange={(open) => {
          if (!open) setDisconnectModalNet(null)
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-1">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold">
              Desconectar {disconnectModalNet?.name}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Ao desconectar, o vínculo com esta rede social será desativado. Você poderá reconectar
              a qualquer momento sem perder os conteúdos criados na plataforma.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDisconnectModalNet(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDisconnect}
              className="rounded-xl text-xs font-semibold gap-1.5"
            >
              <Unlink className="w-3.5 h-3.5" />
              Sim, desconectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Full Modal */}
      <EditProfileModal open={editProfileOpen} onOpenChange={handleCloseEditProfile} />
    </div>
  )
}
