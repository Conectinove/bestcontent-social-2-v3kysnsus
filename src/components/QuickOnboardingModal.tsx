import { useState } from 'react'
import {
  X,
  Sparkles,
  Globe,
  Instagram,
  Edit3,
  ArrowRight,
  Check,
  Loader2,
  CheckCircle2,
  Palette,
  ExternalLink,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { createBrand } from '@/services/brands'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useNavigate } from 'react-router-dom'

interface QuickOnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted?: () => void
}

type StepMode = 'choose' | 'website' | 'instagram' | 'manual' | 'analyzing' | 'result'

export function QuickOnboardingModal({
  open,
  onOpenChange,
  onCompleted,
}: QuickOnboardingModalProps) {
  const { user, updateProfile } = useAuth()
  const { fetchBrands, setSelectedBrandId } = useSocial()
  const navigate = useNavigate()

  const [mode, setMode] = useState<StepMode>('choose')
  const [websiteUrl, setWebsiteUrl] = useState('https://www.mudarcurso.com.br')
  const [instagramHandle, setInstagramHandle] = useState('@mudarcurso')
  const [loading, setLoading] = useState(false)

  // Manual & analyzed form fields
  const [brandName, setBrandName] = useState('MudarCurso')
  const [brandDesc, setBrandDesc] = useState(
    'Plataforma de cursos e desenvolvimento de novos caminhos profissionais.',
  )
  const [brandVoice, setBrandVoice] = useState(
    'Inspirador, empático, direto e focado em transformação pessoal e resultados.',
  )
  const [colorTheme, setColorTheme] = useState('#7C3AED')
  const [targetAudience, setTargetAudience] = useState(
    'Pessoas de 22 a 45 anos buscando transição de carreira.',
  )

  const markAsSeen = async () => {
    try {
      localStorage.setItem('quick_onboarding_seen', 'true')
      if (user?.id) {
        await updateProfile({ onboarding_completed: true })
      }
    } catch {
      /* intentionally ignored */
    }
  }

  const handleClose = () => {
    markAsSeen()
    onOpenChange(false)
    if (onCompleted) onCompleted()
  }

  // Flow 1: Website Analysis
  const handleWebsiteAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!websiteUrl.trim()) {
      toast({
        title: 'URL obrigatória',
        description: 'Digite o endereço do seu site.',
        variant: 'destructive',
      })
      return
    }

    setMode('analyzing')
    setLoading(true)

    // Extraction simulation based on provided domain
    setTimeout(() => {
      let inferredName = 'Minha Marca'
      try {
        const urlObj = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`)
        const hostname = urlObj.hostname.replace('www.', '').split('.')[0]
        inferredName = hostname.charAt(0).toUpperCase() + hostname.slice(1)
        if (hostname.toLowerCase().includes('mudarcurso')) inferredName = 'MudarCurso'
      } catch (_) {
        inferredName = 'Minha Marca'
      }

      setBrandName(inferredName)
      setBrandDesc(`Soluções digitais e inovação de marca com presença online em ${websiteUrl}.`)
      setBrandVoice('Profissional, acolhedor e com autoridade no segmento.')
      setColorTheme('#7C3AED')
      setLoading(false)
      setMode('result')
      toast({
        title: 'Análise de site concluída!',
        description: 'Cores, tom de voz e dados extraídos com sucesso pela IA.',
      })
    }, 1500)
  }

  // Flow 2: Instagram Connect
  const handleInstagramConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!instagramHandle.trim()) {
      toast({
        title: 'Perfil obrigatório',
        description: 'Informe o @ do Instagram Business.',
        variant: 'destructive',
      })
      return
    }

    setMode('analyzing')
    setLoading(true)

    setTimeout(() => {
      const cleanHandle = instagramHandle.replace('@', '')
      const inferredName = cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1)
      setBrandName(inferredName)
      setBrandDesc(
        `Perfil oficial @${cleanHandle}. Conteúdo dinâmico, engajador e focado em autoridade social.`,
      )
      setBrandVoice('Engajador, próximo e visualmente marcante.')
      setColorTheme('#DB2777')
      setLoading(false)
      setMode('result')
      toast({
        title: 'Instagram conectado!',
        description: 'Dados da conta e estilo visual importados pela IA.',
      })
    }, 1500)
  }

  // Save the brand & finish
  const handleSaveBrand = async () => {
    if (!user?.id) {
      toast({ title: 'Atenção', description: 'Você precisa estar logado.' })
      return
    }

    setLoading(true)
    try {
      const newBrand = await createBrand({
        user: user.id,
        name: brandName,
        description: brandDesc,
        brand_voice: brandVoice,
        visual_style: 'Moderno, limpo e profissional.',
        target_audience: targetAudience,
        website: websiteUrl,
        website_url: websiteUrl,
        instagram: instagramHandle,
        color_theme: colorTheme,
        objective: 'sales',
      })

      await fetchBrands()
      if (newBrand?.id) {
        setSelectedBrandId(newBrand.id)
      }
      await markAsSeen()

      toast({
        title: 'Marca configurada com sucesso!',
        description: `Tudo pronto! Sua conta agora está ativa em ${brandName}.`,
      })

      onOpenChange(false)
      if (onCompleted) onCompleted()
    } catch (err) {
      toast({
        title: 'Erro ao salvar marca',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => (!val ? handleClose() : onOpenChange(val))}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        {/* =========================================================================
            HEADER (Reference 1)
            Logo bestcontent AI + Configure sua conta rapidamente + (x)
            ========================================================================= */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            {/* Logo icon */}
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <span className="font-black text-xs leading-none">b</span>
            </div>

            <div>
              <div className="flex items-center gap-1 leading-none">
                <span className="font-extrabold text-sm tracking-tight text-foreground">
                  bestcontent
                </span>
                <span className="text-[10px] font-extrabold text-primary uppercase bg-primary/10 px-1 py-0.2 rounded">
                  AI
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                Configure sua conta rapidamente
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* =========================================================================
            BODY CONTENT
            ========================================================================= */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Main Hero Sparkle Icon + Title (Ref 1) */}
          {(mode === 'choose' ||
            mode === 'website' ||
            mode === 'instagram' ||
            mode === 'manual') && (
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center shadow-xs border border-purple-200/50">
                <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400 stroke-[2.2]" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Vamos agilizar!
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Podemos preencher quase tudo automaticamente usando IA
                </p>
              </div>
            </div>
          )}

          {/* MODE: CHOOSE (Faithful reproduction of Reference 1) */}
          {mode === 'choose' && (
            <div className="space-y-4 pt-2">
              {/* Card 1: Tenho um Website */}
              <button
                type="button"
                onClick={() => setMode('website')}
                className="w-full text-left p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 hover:border-primary/50 transition-all flex items-center gap-4 group shadow-xs hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-muted/90 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:scale-105 transition-all shrink-0">
                  <Globe className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
                    Tenho um Website
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Cole a URL e a IA analisa cores, tom de voz e mais
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* Card 2: Tenho Instagram */}
              <button
                type="button"
                onClick={() => setMode('instagram')}
                className="w-full text-left p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 hover:border-pink-500/50 transition-all flex items-center gap-4 group shadow-xs hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-all shrink-0">
                  <Instagram className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Tenho Instagram
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Conecte sua conta Business para importar dados
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-500 group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* Divisor com texto centralizado "OU" (Ref 1) */}
              <div className="relative py-2 flex items-center justify-center">
                <div className="w-full border-t border-border/80" />
                <span className="absolute bg-card px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  OU
                </span>
              </div>

              {/* Card 3: Preencher manualmente (3ª opção coerente) */}
              <button
                type="button"
                onClick={() => setMode('manual')}
                className="w-full text-left p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 hover:border-border transition-all flex items-center gap-4 group shadow-xs"
              >
                <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:text-foreground shrink-0">
                  <Edit3 className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm sm:text-base text-foreground">
                    Preencher manualmente
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Configure sua marca do jeito tradicional
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            </div>
          )}

          {/* MODE: WEBSITE INPUT */}
          {mode === 'website' && (
            <form onSubmit={handleWebsiteAnalyze} className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
                  URL do seu Website
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://www.suaempresa.com.br"
                    className="pl-9 h-10 text-sm bg-card"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  A IA lerá a paleta visual, nicho, logotipo e tom comunicacional do site.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode('choose')}
                  className="text-xs"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 px-5 h-9 rounded-xl shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  Analisar com IA
                </Button>
              </div>
            </form>
          )}

          {/* MODE: INSTAGRAM INPUT */}
          {mode === 'instagram' && (
            <form onSubmit={handleInstagramConnect} className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
                  @ Usuário ou Perfil do Instagram
                </label>
                <div className="relative">
                  <Instagram className="w-4 h-4 absolute left-3 top-3 text-pink-500" />
                  <Input
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    placeholder="@suaempresa"
                    className="pl-9 h-10 text-sm bg-card"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Importaremos o tom de voz dos posts, identidade e engajamento da conta.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode('choose')}
                  className="text-xs"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-90 text-white font-bold gap-2 px-5 h-9 rounded-xl shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  Conectar e Importar
                </Button>
              </div>
            </form>
          )}

          {/* MODE: MANUAL INPUT */}
          {mode === 'manual' && (
            <div className="space-y-3.5 animate-in fade-in">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Nome da Marca *
                </label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ex: Minha Empresa"
                  className="text-xs h-9"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Segmento & Descrição
                </label>
                <Textarea
                  value={brandDesc}
                  onChange={(e) => setBrandDesc(e.target.value)}
                  placeholder="O que sua marca faz e quais são seus diferenciais..."
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Tom de Voz</label>
                  <Input
                    value={brandVoice}
                    onChange={(e) => setBrandVoice(e.target.value)}
                    placeholder="Ex: Inspirador, profissional"
                    className="text-xs h-9"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Cor Principal
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorTheme}
                      onChange={(e) => setColorTheme(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-border cursor-pointer p-0.5"
                    />
                    <span className="text-xs font-mono text-muted-foreground uppercase">
                      {colorTheme}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/80">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode('choose')}
                  className="text-xs"
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveBrand}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 px-5 h-9 rounded-xl shadow-md"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Salvar Marca
                </Button>
              </div>
            </div>
          )}

          {/* MODE: ANALYZING SPINNER */}
          {mode === 'analyzing' && (
            <div className="py-12 text-center space-y-4 animate-in fade-in">
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-900 border-t-purple-600 animate-spin" />
                <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-base text-foreground">
                  Analisando com Inteligência Artificial...
                </p>
                <p className="text-xs text-muted-foreground">
                  Detectando identidade visual, tom de voz e estratégias.
                </p>
              </div>
            </div>
          )}

          {/* MODE: RESULT & CONFIRMATION */}
          {mode === 'result' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Marca identificada com sucesso!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Confira os dados extraídos pela IA antes de salvar:
                  </p>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl text-white font-black flex items-center justify-center text-sm shadow-xs"
                      style={{ backgroundColor: colorTheme }}
                    >
                      {brandName[0]?.toUpperCase() || 'M'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{brandName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {websiteUrl || instagramHandle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: colorTheme }}
                      title="Cor primária"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 shadow-xs bg-slate-900"
                      title="Cor secundária"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 shadow-xs bg-white"
                      title="Cor de contraste"
                    />
                  </div>
                </div>

                <div className="text-xs space-y-1 pt-2 border-t border-border/60">
                  <p className="font-semibold text-foreground">Tom de Voz:</p>
                  <p className="text-muted-foreground leading-relaxed">{brandVoice}</p>
                </div>

                <div className="text-xs space-y-1">
                  <p className="font-semibold text-foreground">Descrição resumida:</p>
                  <p className="text-muted-foreground leading-relaxed">{brandDesc}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMode('choose')}
                  className="text-xs"
                >
                  Tentar outro modo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveBrand}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 px-6 h-10 rounded-xl shadow-md"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Confirmar e Concluir
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
