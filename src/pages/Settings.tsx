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
  Wand2,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { useCustomization } from '@/context/CustomizationContext'
import { TikTokIcon, YouTubeIcon } from '@/pages/CreateHub'
import { Twitter, MessageCircle, Pin, Send, Share2 } from 'lucide-react'
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
import { StudioThemeManagerSection } from '@/components/studio/StudioThemeManagerSection'
import { BrandAdvancedMediaDialog, dataUrlToFile } from '@/lib/advanced-media'
import { pb } from '@/lib/pocketbase/client'
import { PortalSharePanel } from '@/components/brandkit/PortalSharePanel'
import { getBrands } from '@/services/brands'
import { getBrandPortal, type BrandPortalRecord } from '@/services/brand-portals'
import { getUserIntegrations, toggleIntegrationStatus } from '@/services/user_integrations'
import type { IntegrationNetwork, UserIntegrationRecord } from '@/types'

import {
  Building2,
  Webhook,
  Target,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserCog,
  UserPlus,
} from 'lucide-react'
import { OrgMembersPermissionsPanel } from '@/components/settings/OrgMembersPermissionsPanel'
import { OrgInvitesPanel } from '@/components/settings/OrgInvitesPanel'
import { BrandPortalPanel } from '@/components/settings/BrandPortalPanel'
import { OrganizationBrandManager } from '@/components/brandkit/OrganizationBrandManager'
import { MasterSettingsPanel } from '@/components/brandkit/MasterSettingsPanel'
import {
  getOrganizationSettings,
  saveOrganizationSettings,
  testWebhookPing,
  type OrganizationSettings,
} from '@/services/organization-settings'
import { ConnectorButton } from '@/components/skip/ConnectorButton'

type TabKey =
  | 'master'
  | 'organization'
  | 'account'
  | 'subscription'
  | 'appearance'
  | 'integrations'
  | 'webhooks_ads'
  | 'about'

const TABS: Array<{ key: TabKey; label: string; icon: typeof User; description: string }> = [
  {
    key: 'master',
    label: 'Usuário Master',
    icon: ShieldCheck,
    description: 'Ativação global das principais funções e módulos do app',
  },
  {
    key: 'organization',
    label: 'Minha Organização',
    icon: Building2,
    description: 'Gestão de marcas, deduplicação e identidade oficial',
  },
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
    description: 'Conecte suas redes sociais e Outlook',
  },
  {
    key: 'webhooks_ads',
    label: 'Webhooks & Anúncios',
    icon: Webhook,
    description: 'URL de webhook customizado e IDs de Ads/Pixels',
  },
  { key: 'about', label: 'Sobre', icon: Info, description: 'Informações do aplicativo' },
]

export default function Settings() {
  const { user, updateProfile } = useAuth()
  const { theme, toggleTheme } = useSocial()
  const { menuLayout, appColor } = useCustomization()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'master') return 'master'
    if (tabParam === 'organization' || tabParam === 'marcas') return 'organization'
    return 'master'
  })
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
    twitter: { connected: false },
    threads: { connected: false },
    pinterest: { connected: false },
    whatsapp: { connected: false },
    telegram: { connected: false },
    kwai: { connected: false },
    reddit: { connected: false },
    discord: { connected: false },
    twitch: { connected: false },
    snapchat: { connected: false },
    behance: { connected: false },
    medium: { connected: false },
    vimeo: { connected: false },
    google_business: { connected: false },
    bluesky: { connected: false },
    mastodon: { connected: false },
    tumblr: { connected: false },
    dribbble: { connected: false },
    spotify: { connected: false },
    substack: { connected: false },
    patreon: { connected: false },
    github: { connected: false },
  })
  const [loadingIntegrations, setLoadingIntegrations] = useState(false)
  const [actionLoadingNetwork, setActionLoadingNetwork] = useState<IntegrationNetwork | null>(null)
  const [disconnectModalNet, setDisconnectModalNet] = useState<{
    network: IntegrationNetwork
    name: string
  } | null>(null)

  // Edição Avançada do avatar (pedido 1): abre o BrandAdvancedMediaDialog sobre a foto atual.
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const avatarUrl = user?.avatar || ''

  // Portais de marca (pedidos 2 e 3): marcas reais + portal por marca.
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([])
  const [portals, setPortals] = useState<Record<string, BrandPortalRecord | null>>({})
  const [portalBrandId, setPortalBrandId] = useState<string>('')
  const [loadingBrands, setLoadingBrands] = useState(false)

  // Organization settings state (Webhooks customizados + IDs de plataformas de anúncios)
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
    custom_webhook_url: '',
    custom_webhook_secret: '',
    webhook_events: ['post.published', 'lead.captured'],
    google_ads_id: '',
    meta_pixel_id: '',
    tiktok_pixel_id: '',
    linkedin_partner_id: '',
    pinterest_tag_id: '',
  })
  const [loadingOrgSettings, setLoadingOrgSettings] = useState(false)
  const [savingOrgSettings, setSavingOrgSettings] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [webhookTestResult, setWebhookTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  // Listen to searchParams changes so clicking sidebar or header updates modal state
  useEffect(() => {
    if (searchParams.get('edit') === 'profile') {
      setEditProfileOpen(true)
    }
  }, [searchParams])

  // Carrega as marcas do usuário + o portal existente de cada uma (tab Organização).
  useEffect(() => {
    if (!user?.id) return
    let isMounted = true
    setLoadingBrands(true)
    getBrands(user.id)
      .then(async (records) => {
        if (!isMounted) return
        const list = records.map((b) => ({ id: b.id, name: b.name || 'Marca' }))
        setBrands(list)
        const entries: Record<string, BrandPortalRecord | null> = {}
        for (const b of list) {
          entries[b.id] = await getBrandPortal(b.id)
        }
        if (isMounted) setPortals(entries)
      })
      .catch((err) => console.warn('[Settings] Erro ao carregar marcas/portais:', err))
      .finally(() => {
        if (isMounted) setLoadingBrands(false)
      })
    return () => {
      isMounted = false
    }
  }, [user?.id])

  /** Persiste o avatar editado (data URL → File → upload no PocketBase). */
  const handleSaveAdvancedAvatar = async (resultUrl: string) => {
    if (!user?.id) return
    setAvatarSaving(true)
    try {
      const file = dataUrlToFile(resultUrl, `avatar-${Date.now()}.png`)
      if (!file) throw new Error('Não foi possível converter a imagem editada.')
      await pb.collection('users').update(user.id, { avatar: file })
      window.location.reload()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar avatar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
      })
      setAvatarSaving(false)
    }
  }

  /** Atualiza o estado local do portal quando o painel gera/revoga. */
  const handlePortalChange = (brandId: string, portal: BrandPortalRecord | null) => {
    setPortals((prev) => ({ ...prev, [brandId]: portal }))
  }

  // Load organization settings (webhook & ads)
  useEffect(() => {
    let isMounted = true
    setLoadingOrgSettings(true)
    getOrganizationSettings()
      .then((res) => {
        if (isMounted) setOrgSettings(res)
      })
      .catch((err) => {
        console.warn('[Settings] Erro ao carregar orgSettings:', err)
      })
      .finally(() => {
        if (isMounted) setLoadingOrgSettings(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const handleSaveOrgSettings = async () => {
    setSavingOrgSettings(true)
    try {
      const saved = await saveOrganizationSettings(orgSettings)
      setOrgSettings(saved)
      toast({
        title: 'Configurações salvas no banco!',
        description: 'Webhook customizado e IDs de anúncios foram atualizados com sucesso.',
      })
    } catch {
      toast({
        title: 'Erro ao salvar configurações',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingOrgSettings(false)
    }
  }

  const handleTestWebhook = async () => {
    if (!orgSettings.custom_webhook_url) {
      toast({
        title: 'URL vazia',
        description: 'Informe uma URL válida para disparar o teste.',
        variant: 'destructive',
      })
      return
    }
    setTestingWebhook(true)
    setWebhookTestResult(null)
    try {
      const res = await testWebhookPing(
        orgSettings.custom_webhook_url,
        orgSettings.custom_webhook_secret,
      )
      setWebhookTestResult(res)
      toast({
        title: res.success ? 'Teste de Webhook bem-sucedido!' : 'Aviso no teste do Webhook',
        description: res.message,
        variant: res.success ? 'default' : 'destructive',
      })
    } catch (err: any) {
      setWebhookTestResult({
        success: false,
        message: err?.message || 'Falha ao testar webhook',
      })
    } finally {
      setTestingWebhook(false)
    }
  }

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
            twitter: { connected: false },
            threads: { connected: false },
            pinterest: { connected: false },
            whatsapp: { connected: false },
            telegram: { connected: false },
            kwai: { connected: false },
            reddit: { connected: false },
            discord: { connected: false },
            twitch: { connected: false },
            snapchat: { connected: false },
            behance: { connected: false },
            medium: { connected: false },
            vimeo: { connected: false },
            google_business: { connected: false },
            bluesky: { connected: false },
            mastodon: { connected: false },
            tumblr: { connected: false },
            dribbble: { connected: false },
            spotify: { connected: false },
            substack: { connected: false },
            patreon: { connected: false },
            github: { connected: false },
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
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible scrollbar-none pb-2 md:pb-0 -mx-1 px-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'settings-nav-item shrink-0 min-h-[44px] flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all',
                    active && 'settings-nav-item-active bg-primary/10 text-primary font-bold',
                  )}
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

              {activeTab === 'master' && (
                <MasterSettingsPanel brandId={(user as any)?.brand_id || undefined} />
              )}

              {activeTab === 'organization' && (
                <div className="space-y-6">
                  {loadingBrands ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      Carregando marcas…
                    </div>
                  ) : (
                    <PortalSharePanel
                      brands={brands}
                      portals={portals}
                      selectedBrandId={portalBrandId}
                      onSelectBrand={setPortalBrandId}
                      onPortalChange={handlePortalChange}
                    />
                  )}
                  {portalBrandId && (
                    <BrandPortalPanel brandId={portalBrandId} userId={user?.id || ''} />
                  )}
                  <OrganizationBrandManager onAddNewBrand={() => navigate('/app/brands')} />
                  <div>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <UserCog className="w-4 h-4 text-primary" />
                      Permissões por membro
                    </h3>
                    <OrgMembersPermissionsPanel isAdmin={user?.role === 'admin'} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-primary" />
                      Convidar membros (email)
                    </h3>
                    <OrgInvitesPanel isAdmin={user?.role === 'admin'} />
                  </div>
                </div>
              )}

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
                        variant="outline"
                        size="sm"
                        disabled={avatarSaving}
                        onClick={() => setAvatarEditorOpen(true)}
                        className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-xl gap-1.5 flex-1 sm:flex-initial"
                      >
                        {avatarSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Wand2 className="w-3.5 h-3.5" />
                        )}
                        Edição Avançada
                      </Button>
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
                  <StudioThemeManagerSection />
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
                      {
                        network: 'twitter' as IntegrationNetwork,
                        name: 'X / Twitter API v2',
                        subtitle: 'Posts em tempo real, threads longas e cartões de mídia',
                        iconBg: 'bg-black/15 dark:bg-white/10 border-slate-700/30 text-foreground',
                        renderIcon: () => <Twitter className="w-5 h-5 text-foreground" />,
                      },
                      {
                        network: 'threads' as IntegrationNetwork,
                        name: 'Threads API',
                        subtitle: 'Microblogging Meta, textos rápidos e carrosséis com alta tração',
                        iconBg:
                          'bg-neutral-900/15 dark:bg-neutral-100/10 border-neutral-700/30 text-foreground',
                        renderIcon: () => (
                          <span className="font-black text-sm tracking-tighter">@</span>
                        ),
                      },
                      {
                        network: 'pinterest' as IntegrationNetwork,
                        name: 'Pinterest API',
                        subtitle: 'Pins verticais, pastas de inspiração e tráfego orgânico perene',
                        iconBg: 'bg-[#E60023]/15 border-[#E60023]/20 text-[#E60023]',
                        renderIcon: () => <Pin className="w-5 h-5 text-[#E60023]" />,
                      },
                      {
                        network: 'whatsapp' as IntegrationNetwork,
                        name: 'WhatsApp Business API',
                        subtitle:
                          'Transmissões segmentadas, status dinâmico e catálogos interativos',
                        iconBg: 'bg-[#25D366]/15 border-[#25D366]/20 text-[#25D366]',
                        renderIcon: () => <MessageCircle className="w-5 h-5 text-[#25D366]" />,
                      },
                      {
                        network: 'telegram' as IntegrationNetwork,
                        name: 'Telegram Bot API',
                        subtitle: 'Canais de transmissão, bots de automação e alertas prioritários',
                        iconBg: 'bg-[#229ED9]/15 border-[#229ED9]/20 text-[#229ED9]',
                        renderIcon: () => <Send className="w-5 h-5 text-[#229ED9]" />,
                      },
                      {
                        network: 'kwai' as IntegrationNetwork,
                        name: 'Kwai Open Platform',
                        subtitle: 'Vídeos curtos virais, campanhas locais e engajamento em massa',
                        iconBg: 'bg-[#FF5000]/15 border-[#FF5000]/20 text-[#FF5000]',
                        renderIcon: () => (
                          <span className="font-black text-xs text-[#FF5000]">KW</span>
                        ),
                      },
                      {
                        network: 'reddit' as IntegrationNetwork,
                        name: 'Reddit API',
                        subtitle:
                          'Comunidades nichadas, debates autorais e compartilhamento de valor',
                        iconBg: 'bg-[#FF4500]/15 border-[#FF4500]/20 text-[#FF4500]',
                        renderIcon: () => (
                          <span className="font-black text-xs text-[#FF4500]">r/</span>
                        ),
                      },
                      {
                        network: 'discord' as IntegrationNetwork,
                        name: 'Discord Bot & Webhooks API',
                        subtitle:
                          'Disparo em canais de comunidade, webhooks ricos e alertas automáticos',
                        iconBg: 'bg-[#5865F2]/15 border-[#5865F2]/20 text-[#5865F2]',
                        renderIcon: () => (
                          <span className="font-black text-xs text-[#5865F2]">DC</span>
                        ),
                      },
                      {
                        network: 'twitch' as IntegrationNetwork,
                        name: 'Twitch Helix API',
                        subtitle:
                          'Lives de criadores, clipes em destaque e transmissões simultâneas',
                        iconBg: 'bg-[#9146FF]/15 border-[#9146FF]/20 text-[#9146FF]',
                        renderIcon: () => (
                          <span className="font-black text-xs text-[#9146FF]">TW</span>
                        ),
                      },
                      {
                        network: 'snapchat' as IntegrationNetwork,
                        name: 'Snapchat Marketing API',
                        subtitle: 'Snaps efêmeros, filtros de realidade aumentada e Spotlight',
                        iconBg:
                          'bg-[#FFFC00]/20 border-yellow-500/30 text-yellow-600 dark:text-yellow-400',
                        renderIcon: () => (
                          <span className="font-black text-xs text-yellow-600 dark:text-yellow-400">
                            SNAP
                          </span>
                        ),
                      },
                      {
                        network: 'behance' as IntegrationNetwork,
                        name: 'Adobe Behance API',
                        subtitle:
                          'Portfólios visuais, cases de design e projetos criativos completos',
                        iconBg: 'bg-[#1769FF]/15 border-[#1769FF]/20 text-[#1769FF]',
                        renderIcon: () => (
                          <span className="font-black text-xs text-[#1769FF]">Bē</span>
                        ),
                      },
                      {
                        network: 'medium' as IntegrationNetwork,
                        name: 'Medium Publishing API',
                        subtitle:
                          'Artigos aprofundados, publicações autorais e distribuição de conteúdo longo',
                        iconBg: 'bg-black/15 dark:bg-white/10 border-foreground/15 text-foreground',
                        renderIcon: () => (
                          <span className="font-serif font-black text-xs text-foreground">M</span>
                        ),
                      },
                      {
                        network: 'vimeo' as IntegrationNetwork,
                        name: 'Vimeo Video API',
                        subtitle:
                          'Hospedagem profissional de vídeos HD/4K, players embutidos e portfolios',
                        iconBg: 'bg-[#1AB7EA]/15 border-[#1AB7EA]/20 text-[#1AB7EA]',
                        renderIcon: () => (
                          <span className="font-black text-xs text-[#1AB7EA]">vm</span>
                        ),
                      },
                      {
                        network: 'google_business' as IntegrationNetwork,
                        name: 'Google Business Profile',
                        subtitle:
                          'Atualizações de negócios locais, ofertas, novidades e Google Maps',
                        iconBg: 'bg-[#4285F4]/15 border-[#4285F4]/20 text-[#4285F4]',
                        renderIcon: () => (
                          <span className="font-black text-xs text-[#4285F4]">GBP</span>
                        ),
                      },
                      {
                        network: 'bluesky' as IntegrationNetwork,
                        name: 'Bluesky Social (AT Protocol)',
                        subtitle:
                          'Microblogging aberto, rede descentralizada e feeds personalizados',
                        iconBg: 'bg-[#1185FE]/15 border-[#1185FE]/20 text-[#1185FE]',
                        renderIcon: () => (
                          <span className="font-black text-xs text-[#1185FE]">BSKY</span>
                        ),
                      },
                      {
                        network: 'mastodon' as IntegrationNetwork,
                        name: 'Mastodon (Fediverse)',
                        subtitle: 'Instâncias federadas, posts autorais e privacidade comunitária',
                        iconBg: 'bg-[#6364FF]/15 border-[#6364FF]/20 text-[#6364FF]',
                        renderIcon: () => (
                          <span className="font-black text-xs text-[#6364FF]">MAST</span>
                        ),
                      },
                      {
                        network: 'tumblr' as IntegrationNetwork,
                        name: 'Tumblr Publishing API',
                        subtitle: 'Microblogging criativo, multimídia, fandoms e cultura visual',
                        iconBg:
                          'bg-[#36465D]/20 border-[#36465D]/30 text-[#36465D] dark:text-sky-300',
                        renderIcon: () => <span className="font-serif font-black text-xs">t.</span>,
                      },
                      {
                        network: 'dribbble' as IntegrationNetwork,
                        name: 'Dribbble API v2',
                        subtitle:
                          'Shots de design, portfolios visuais e vitrine para criativos globais',
                        iconBg: 'bg-[#EA4C89]/15 border-[#EA4C89]/20 text-[#EA4C89]',
                        renderIcon: () => (
                          <span className="font-black text-xs text-[#EA4C89]">DRB</span>
                        ),
                      },
                      {
                        network: 'spotify' as IntegrationNetwork,
                        name: 'Spotify for Podcasters & Audio',
                        subtitle:
                          'Distribuição de videocasts, episódios, áudios promocionais e audiência de stream',
                        iconBg: 'bg-[#1DB954]/15 border-[#1DB954]/20 text-[#1DB954]',
                        renderIcon: () => (
                          <span className="font-black text-xs text-[#1DB954]">SPOT</span>
                        ),
                      },
                      {
                        network: 'substack' as IntegrationNetwork,
                        name: 'Substack Publishing API',
                        subtitle:
                          'Newsletters autorais, publicações pagas por assinatura e ensaios semanais',
                        iconBg: 'bg-[#FF6719]/15 border-[#FF6719]/20 text-[#FF6719]',
                        renderIcon: () => (
                          <span className="font-black text-xs text-[#FF6719]">SUB</span>
                        ),
                      },
                      {
                        network: 'patreon' as IntegrationNetwork,
                        name: 'Patreon Community & Memberships',
                        subtitle:
                          'Conteúdos exclusivos para assinantes VIP, tiers de membros e comunidade',
                        iconBg: 'bg-[#FF424D]/15 border-[#FF424D]/20 text-[#FF424D]',
                        renderIcon: () => (
                          <span className="font-black text-xs text-[#FF424D]">PAT</span>
                        ),
                      },
                      {
                        network: 'github' as IntegrationNetwork,
                        name: 'GitHub Sponsor & Social Repos',
                        subtitle:
                          'Releases de código aberto, documentação, perfis técnicos e engajamento dev',
                        iconBg: 'bg-black/15 dark:bg-white/10 border-foreground/20 text-foreground',
                        renderIcon: () => (
                          <span className="font-black text-xs text-foreground">GIT</span>
                        ),
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

                  {/* Microsoft Outlook integration card */}
                  <div className="mt-8 pt-6 border-t border-border/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-500" />
                          <h4 className="text-sm font-bold text-foreground">
                            E-mail Corporativo & Produtividade (Outlook)
                          </h4>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-blue-500/30 text-blue-500"
                          >
                            Microsoft 365
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Conecte sua conta do Outlook para buscar e-mails, rascunhos e importar
                          contexto diretamente para o Segundo Cérebro.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0078D4]/15 border border-[#0078D4]/25 flex items-center justify-center shrink-0">
                          <span className="font-black text-sm text-[#0078D4]">O</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Microsoft Outlook</p>
                          <p className="text-xs text-muted-foreground">
                            Conta conectada individualmente por usuário via Skip Connectors
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <ConnectorButton
                          toolkit="outlook"
                          name="Outlook"
                          className="[&>button]:h-9 [&>button]:text-xs [&>button]:rounded-lg [&>button]:border-blue-500/30"
                        />
                      </div>
                    </div>
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

              {activeTab === 'webhooks_ads' && (
                <div className="space-y-6">
                  {/* Header da seção */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Webhook className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-base font-bold text-foreground">
                        Webhooks Customizados & IDs de Anúncios
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-purple-500/30 text-purple-600 dark:text-purple-400"
                      >
                        Dados Oficiais Persistidos
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Configure URLs de webhook externas para receber eventos e cadastre os IDs das
                      plataformas de anúncios para rastreamento e integrações.
                    </p>
                  </div>

                  {loadingOrgSettings ? (
                    <div className="p-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      Carregando configurações...
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Bloco 1: Webhook Customizado */}
                      <Card className="border border-border/80 shadow-sm rounded-xl overflow-hidden">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                <Send className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-foreground">
                                  Webhook Customizado (Eventos)
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                  Dispare payloads JSON para seu servidor, Zapier, Make ou n8n
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-[10px]">
                              HTTP POST
                            </Badge>
                          </div>

                          <div className="space-y-3 pt-2">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                <span>URL do Webhook</span>
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  https://seu-endpoint.com/webhook
                                </span>
                              </label>
                              <Input
                                value={orgSettings.custom_webhook_url || ''}
                                onChange={(e) =>
                                  setOrgSettings((prev) => ({
                                    ...prev,
                                    custom_webhook_url: e.target.value,
                                  }))
                                }
                                placeholder="https://api.seuservidor.com/v1/midiaviva-webhook"
                                className="font-mono text-xs"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                <span>Segredo de Assinatura (Secret Key opcional)</span>
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  Enviado no header X-MidiaViva-Signature
                                </span>
                              </label>
                              <Input
                                type="password"
                                value={orgSettings.custom_webhook_secret || ''}
                                onChange={(e) =>
                                  setOrgSettings((prev) => ({
                                    ...prev,
                                    custom_webhook_secret: e.target.value,
                                  }))
                                }
                                placeholder="whsec_xxxxxxxxxxxxxxxxxxxx"
                                className="font-mono text-xs"
                              />
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleTestWebhook}
                                disabled={testingWebhook || !orgSettings.custom_webhook_url}
                                className="text-xs gap-1.5"
                              >
                                {testingWebhook ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Radio className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                )}
                                Testar Conexão (Ping)
                              </Button>

                              {webhookTestResult && (
                                <div
                                  className={cn(
                                    'text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border',
                                    webhookTestResult.success
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-destructive/10 border-destructive/30 text-destructive',
                                  )}
                                >
                                  {webhookTestResult.success ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  ) : (
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  )}
                                  <span>{webhookTestResult.message}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Bloco 2: IDs de Plataformas de Anúncios */}
                      <Card className="border border-border/80 shadow-sm rounded-xl overflow-hidden">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-foreground">
                                  IDs de Plataformas de Anúncios & Pixels
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                  Vincule seus identificadores para conversão e campanhas
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[10px] border-blue-500/30 text-blue-600 dark:text-blue-400"
                            >
                              Rastreamento & Ads
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                <span>ID do Google Ads</span>
                                <span className="text-[10px] text-muted-foreground">
                                  AW-XXXXXXXXX
                                </span>
                              </label>
                              <Input
                                value={orgSettings.google_ads_id || ''}
                                onChange={(e) =>
                                  setOrgSettings((prev) => ({
                                    ...prev,
                                    google_ads_id: e.target.value,
                                  }))
                                }
                                placeholder="AW-123456789 ou G-XXXXX"
                                className="font-mono text-xs"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                <span>Pixel ID do Meta / Facebook</span>
                                <span className="text-[10px] text-muted-foreground">
                                  16 dígitos numéricos
                                </span>
                              </label>
                              <Input
                                value={orgSettings.meta_pixel_id || ''}
                                onChange={(e) =>
                                  setOrgSettings((prev) => ({
                                    ...prev,
                                    meta_pixel_id: e.target.value,
                                  }))
                                }
                                placeholder="1234567890123456"
                                className="font-mono text-xs"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                <span>TikTok Pixel ID</span>
                                <span className="text-[10px] text-muted-foreground">
                                  Código de evento
                                </span>
                              </label>
                              <Input
                                value={orgSettings.tiktok_pixel_id || ''}
                                onChange={(e) =>
                                  setOrgSettings((prev) => ({
                                    ...prev,
                                    tiktok_pixel_id: e.target.value,
                                  }))
                                }
                                placeholder="C1234567890ABC"
                                className="font-mono text-xs"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                <span>LinkedIn Insight Partner ID</span>
                                <span className="text-[10px] text-muted-foreground">
                                  Partner ID
                                </span>
                              </label>
                              <Input
                                value={orgSettings.linkedin_partner_id || ''}
                                onChange={(e) =>
                                  setOrgSettings((prev) => ({
                                    ...prev,
                                    linkedin_partner_id: e.target.value,
                                  }))
                                }
                                placeholder="9876543"
                                className="font-mono text-xs"
                              />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                <span>Pinterest Tag ID</span>
                                <span className="text-[10px] text-muted-foreground">Tag ID</span>
                              </label>
                              <Input
                                value={orgSettings.pinterest_tag_id || ''}
                                onChange={(e) =>
                                  setOrgSettings((prev) => ({
                                    ...prev,
                                    pinterest_tag_id: e.target.value,
                                  }))
                                }
                                placeholder="261234567890"
                                className="font-mono text-xs max-w-sm"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Botão de Salvar */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                          type="button"
                          onClick={handleSaveOrgSettings}
                          disabled={savingOrgSettings}
                          className="text-xs font-bold gap-1.5 px-6 shadow-md"
                        >
                          {savingOrgSettings ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Salvar Configurações no Banco
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-lg">
                      <SettingsIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">MidiaViva</h3>
                      <p className="text-xs text-muted-foreground">
                        Powered by BestContent AI · Versão 0.0.79
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
                      © 2026 MidiaViva — Powered by BestContent AI. Todos os direitos reservados.
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

      {/* Edição Avançada do avatar (pedido 1) — reaproveita o motor da marca */}
      <BrandAdvancedMediaDialog
        open={avatarEditorOpen}
        onOpenChange={setAvatarEditorOpen}
        field="logo"
        brandName={user?.name || 'Meu perfil'}
        mediaUrl={avatarUrl}
        brandContext={{ brandName: user?.name || 'Meu perfil', field: 'logo' }}
        onSave={handleSaveAdvancedAvatar}
      />
    </div>
  )
}
