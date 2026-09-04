import { useState } from 'react'
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
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

type TabKey = 'account' | 'appearance' | 'integrations' | 'subscription' | 'about'

const TABS: Array<{ key: TabKey; label: string; icon: typeof User; description: string }> = [
  {
    key: 'account',
    label: 'Conta',
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
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<TabKey>('account')
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifPush, setNotifPush] = useState(false)

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
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Nome Completo
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">E-mail</label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">Preferências de Notificação</span>
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
                        <p className="text-xs text-muted-foreground">Alertar no navegador</p>
                      </div>
                      <Switch checked={notifPush} onCheckedChange={setNotifPush} />
                    </div>
                  </div>
                  <div className="pt-3">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-primary hover:bg-primary/90 text-white aggressive-button min-w-[160px]"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar Alterações'
                      )}
                    </Button>
                  </div>
                </form>
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
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Conecte suas redes sociais para publicar e analisar conteúdo diretamente da
                    plataforma.
                  </p>
                  {[
                    { name: 'Instagram Graph API', status: 'connected' },
                    { name: 'TikTok Creator API', status: 'connected' },
                    { name: 'LinkedIn API', status: 'connected' },
                    { name: 'YouTube Data API', status: 'disconnected' },
                    { name: 'Facebook Pages API', status: 'disconnected' },
                  ].map((net) => (
                    <div
                      key={net.name}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <Link2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{net.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {net.status === 'connected' ? 'Conectado e ativo' : 'Não conectado'}
                          </p>
                        </div>
                      </div>
                      {net.status === 'connected' ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <Check className="w-3.5 h-3.5" /> Conectado
                        </span>
                      ) : (
                        <Button variant="outline" size="sm" className="text-xs h-7">
                          Conectar
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
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
    </div>
  )
}
