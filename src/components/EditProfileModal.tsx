import { useRef, useState, useEffect } from 'react'
import {
  X,
  Camera,
  Trash2,
  Check,
  Sparkles,
  Layout as LayoutIcon,
  Palette,
  Bell,
  Sliders,
  Globe,
  Loader2,
  Save,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import {
  useCustomization,
  APP_COLOR_PALETTES,
  MenuLayoutType,
} from '@/context/CustomizationContext'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { user, updateProfile } = useAuth()
  const { menuLayout, setMenuLayout, appColor, setAppColor, customHex, setCustomHex } =
    useCustomization()

  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)

  // Local form state
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || '')
  const [name, setName] = useState<string>(user?.name || 'Ronaldo Barreto')
  const [bio, setBio] = useState<string>(user?.bio || '')
  const [profession, setProfession] = useState<string>(user?.profession || '')
  const [company, setCompany] = useState<string>(user?.company || '')
  const [instagram, setInstagram] = useState<string>(user?.instagram || '')
  const [website, setWebsite] = useState<string>(user?.website || '')

  // Customization local preview
  const [localMenuLayout, setLocalMenuLayout] = useState<MenuLayoutType>(menuLayout)
  const [localAppColor, setLocalAppColor] = useState<string>(appColor)

  // Advanced options
  const [shareCommunity, setShareCommunity] = useState<boolean>(user?.share_community ?? true)

  // Notification toggles
  const [notifApp, setNotifApp] = useState<boolean>(user?.notif_app ?? true)
  const [notifEmail, setNotifEmail] = useState<boolean>(user?.notif_email ?? true)
  const [notifPush, setNotifPush] = useState<boolean>(user?.notif_push ?? false)

  useEffect(() => {
    if (open) {
      setName(user?.name || 'Ronaldo Barreto')
      setBio(user?.bio || '')
      setProfession(user?.profession || '')
      setCompany(user?.company || '')
      setInstagram(user?.instagram || '')
      setWebsite(user?.website || '')
      setAvatarPreview(user?.avatar || '')
      setLocalMenuLayout(menuLayout)
      setLocalAppColor(appColor)
      setShareCommunity(user?.share_community ?? true)
      setNotifApp(user?.notif_app ?? true)
      setNotifEmail(user?.notif_email ?? true)
      setNotifPush(user?.notif_push ?? false)
    }
  }, [open, user, menuLayout, appColor])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setAvatarPreview(url)
      toast({
        title: 'Foto selecionada',
        description: 'Clique em Salvar para persistir sua nova foto de perfil.',
      })
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview(`https://img.usecurling.com/ppl/medium?gender=male&seed=default`)
    toast({
      title: 'Foto removida',
      description: 'A foto foi redefinida para o padrão.',
    })
  }

  const handleSelectColor = (colorId: string) => {
    setLocalAppColor(colorId)
    setAppColor(colorId)
  }

  const handleSelectLayout = (layout: MenuLayoutType) => {
    setLocalMenuLayout(layout)
    setMenuLayout(layout)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value
    setLocalAppColor('custom')
    setCustomHex(hex)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Por favor, informe seu nome de exibição.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const result = await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        profession: profession.trim(),
        company: company.trim(),
        instagram: instagram.trim(),
        website: website.trim(),
        menu_layout: localMenuLayout,
        app_color: localAppColor,
        share_community: shareCommunity,
        notif_app: notifApp,
        notif_email: notifEmail,
        notif_push: notifPush,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações e preferências foram salvas com sucesso.',
      })
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar perfil',
        description: err?.message || 'Ocorreu um erro ao atualizar os dados.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] p-0 flex flex-col gap-0 rounded-3xl border border-border bg-card shadow-2xl overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 sticky top-0 bg-card z-10">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Editar Perfil
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="w-9 h-9 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center gap-3">
            <Avatar className="w-20 h-20 ring-4 ring-purple-100 dark:ring-purple-950/40 shadow-sm">
              <AvatarImage src={avatarPreview || user?.avatar} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                {name?.slice(0, 2).toUpperCase() || 'RB'}
              </AvatarFallback>
            </Avatar>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 rounded-full border-border text-xs font-semibold px-3.5 gap-1.5 shadow-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                Alterar foto
              </Button>
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors px-2 py-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remover
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Nome de exibição */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <span className="text-muted-foreground">👤</span>
                <span>Nome de exibição</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="h-11 rounded-xl bg-muted/50 border-transparent focus:border-primary/40 focus:bg-background text-sm font-medium transition-colors"
              />
            </div>

            {/* Bio with counter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Bio</label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {bio.length}/160
                </span>
              </div>
              <Textarea
                value={bio}
                onChange={(e) => {
                  if (e.target.value.length <= 160) {
                    setBio(e.target.value)
                  }
                }}
                maxLength={160}
                rows={3}
                placeholder="Conte um pouco sobre você..."
                className="rounded-xl bg-muted/50 border-transparent focus:border-primary/40 focus:bg-background text-sm font-medium transition-colors resize-none"
              />
            </div>

            {/* Profissão */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <span className="text-muted-foreground">💼</span>
                <span>Profissão</span>
              </label>
              <Input
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="Ex: Marketing Digital"
                className="h-11 rounded-xl bg-muted/50 border-transparent focus:border-primary/40 focus:bg-background text-sm font-medium transition-colors"
              />
            </div>

            {/* Empresa */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <span className="text-muted-foreground">🏢</span>
                <span>Empresa</span>
              </label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ex: BestContent AI"
                className="h-11 rounded-xl bg-muted/50 border-transparent focus:border-primary/40 focus:bg-background text-sm font-medium transition-colors"
              />
            </div>

            {/* Instagram */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <span className="text-muted-foreground">📷</span>
                <span>Instagram</span>
              </label>
              <Input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@ seu_usuario"
                className="h-11 rounded-xl bg-muted/50 border-transparent focus:border-primary/40 focus:bg-background text-sm font-medium transition-colors"
              />
            </div>

            {/* Website */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <span className="text-muted-foreground">🌐</span>
                <span>Website</span>
              </label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://seusite.com"
                className="h-11 rounded-xl bg-muted/50 border-transparent focus:border-primary/40 focus:bg-background text-sm font-medium transition-colors"
              />
            </div>
          </div>

          {/* Section Divider: PERSONALIZAÇÃO DO APP */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/80" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-card px-3 text-muted-foreground">PERSONALIZAÇÃO DO APP</span>
            </div>
          </div>

          {/* Layout do menu */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <LayoutIcon className="w-4 h-4 text-muted-foreground" />
                <span>Layout do menu</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Escolha como a navegação aparece no desktop. A preferência fica salva na sua conta.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Lateral */}
              <button
                type="button"
                onClick={() => handleSelectLayout('sidebar')}
                className={cn(
                  'relative p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between',
                  localMenuLayout === 'sidebar'
                    ? 'border-purple-500 bg-purple-500/5 ring-1 ring-purple-500'
                    : 'border-border/80 hover:border-border bg-card hover:bg-muted/30',
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-foreground/70 rounded-sm flex">
                      <div className="w-1.5 h-full bg-foreground/70 border-r border-foreground/70" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Lateral</span>
                  </div>
                  {localMenuLayout === 'sidebar' && <Check className="w-4 h-4 text-purple-600" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">Menu vertical</p>
              </button>

              {/* Topo */}
              <button
                type="button"
                onClick={() => handleSelectLayout('topbar')}
                className={cn(
                  'relative p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between',
                  localMenuLayout === 'topbar'
                    ? 'border-purple-500 bg-purple-500/5 ring-1 ring-purple-500'
                    : 'border-border/80 hover:border-border bg-card hover:bg-muted/30',
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-foreground/70 rounded-sm flex flex-col">
                      <div className="h-1.5 w-full bg-foreground/70 border-b border-foreground/70" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Topo</span>
                  </div>
                  {localMenuLayout === 'topbar' && <Check className="w-4 h-4 text-purple-600" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">Menu horizontal</p>
              </button>
            </div>
          </div>

          {/* Cor do app */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span>Cor do app</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Personalize a cor principal da interface. A mudança é aplicada na hora.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5 pt-1">
              {APP_COLOR_PALETTES.map((swatch) => {
                const isSelected = localAppColor === swatch.id
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() => handleSelectColor(swatch.id)}
                    style={{ backgroundColor: swatch.colorHex }}
                    title={swatch.name}
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 transform hover:scale-110 shadow-xs cursor-pointer',
                      isSelected && 'ring-3 ring-offset-2 ring-purple-500 scale-105',
                    )}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                )
              })}

              {/* Rainbow custom color swatch button */}
              <input type="file" className="hidden" disabled />
              <input
                type="color"
                ref={colorInputRef}
                value={customHex || '#8b5cf6'}
                onChange={handleCustomColorChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => colorInputRef.current?.click()}
                title="Cor personalizada"
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 transform hover:scale-110 shadow-xs cursor-pointer',
                  'bg-gradient-to-tr from-pink-500 via-amber-400 via-emerald-400 via-cyan-400 to-purple-600',
                  localAppColor === 'custom' && 'ring-3 ring-offset-2 ring-purple-500 scale-105',
                )}
              >
                {localAppColor === 'custom' ? (
                  <Check className="w-4 h-4 text-white stroke-[3]" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-white/90 drop-shadow" />
                )}
              </button>
            </div>
          </div>

          {/* Section Divider: OPÇÕES AVANÇADAS */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/80" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-card px-3 text-muted-foreground">OPÇÕES AVANÇADAS</span>
            </div>
          </div>

          {/* Toggle: Compartilhar criações na comunidade */}
          <div className="space-y-2.5 p-3.5 rounded-2xl bg-muted/40 border border-border/50">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">
                  Compartilhar criações na comunidade
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Suas criações podem aparecer nos stories da BestContent
                </p>
              </div>
              <Switch checked={shareCommunity} onCheckedChange={setShareCommunity} />
            </div>
            <div className="pt-2 border-t border-border/50 flex items-start gap-2 text-[11px] text-muted-foreground">
              <span>💡</span>
              <span>
                Manter ativo aumenta a visibilidade da sua marca/empresa para outros criadores.
              </span>
            </div>
          </div>

          {/* Seção Notificações */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-muted/40 border border-border/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs font-bold text-foreground">Notificações</p>
                <p className="text-[11px] text-muted-foreground">
                  Escolha onde receber cada tipo de aviso (app, email, push)
                </p>
              </div>
            </div>

            <div className="divide-y divide-border/60 pt-1">
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground">Avisos no App</p>
                  <p className="text-[11px] text-muted-foreground">
                    Sininho e popups na barra superior
                  </p>
                </div>
                <Switch checked={notifApp} onCheckedChange={setNotifApp} />
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground">Notificações por e-mail</p>
                  <p className="text-[11px] text-muted-foreground">
                    Resumos semanais e novidades importantes
                  </p>
                </div>
                <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground">Notificações Push</p>
                  <p className="text-[11px] text-muted-foreground">
                    Alertas instantâneos no navegador desktop
                  </p>
                </div>
                <Switch checked={notifPush} onCheckedChange={setNotifPush} />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-border/80 bg-card sticky bottom-0 z-10">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-xs font-semibold px-4"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl px-5 gap-1.5 shadow-md shadow-purple-500/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
