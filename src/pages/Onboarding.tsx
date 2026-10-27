import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Check,
  ChevronRight,
  ChevronDown,
  X,
  Target,
  Users,
  MessageSquare,
  Share2,
  Lock,
  Calendar,
  BarChart2,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { updateBrand, createBrand } from '@/services/brands'
import { getUserIntegrations, toggleIntegrationStatus } from '@/services/user_integrations'
import { AI_VOICE_TONES } from '@/services/voice-tones'
import { MudarCursoLogoKit } from '@/components/brandkit/MudarCursoLogoKit'
import type { IntegrationNetwork } from '@/types'

// Textos verbatim exigidos na especificação
const DEFAULT_ESSENCIA =
  'MudarCurso é uma plataforma de cursos online focada em transformar carreiras, especialmente com a aplicação de Inteligência Artificial. Oferece trilhas práticas e certificações para impulsionar o desenvolvimento profissional de seus usuários.'

const DEFAULT_PUBLICO =
  'Indivíduos que buscam crescimento profissional, querem se manter relevantes no mercado de trabalho ou mudar de carreira. Pessoas interessadas em tecnologia, com foco em Inteligência Artificial, que valorizam praticidade e resultados. Podem ser tanto iniciantes quanto profissionais já atuantes que buscam novas habilidades.'

const DEFAULT_TONS = ['Inspirador', 'Educativo', 'Motivacional']
const DEFAULT_SITE = 'mudarcurso.com.br'
const DEFAULT_HANDLE = '@ronaldo.barreto1'

// Componente Mascote Soci (com lupa e chapéu como na referência)
function SociMascot({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-24 h-24' : 'w-16 h-16'
  return (
    <div className={`relative ${dim} shrink-0 select-none`}>
      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
        {/* Glow */}
        <circle cx="60" cy="65" r="45" fill="#8B5CF6" opacity="0.15" />
        {/* Corpo do Soci (Gota/Blob fofo violeta) */}
        <path
          d="M60 20 C85 20, 100 45, 100 70 C100 95, 82 108, 60 108 C38 108, 20 95, 20 70 C20 45, 35 20, 60 20 Z"
          fill="url(#sociGrad)"
        />
        {/* Olhinhos fofos */}
        <ellipse cx="48" cy="60" rx="6" ry="8" fill="#FFFFFF" />
        <circle cx="50" cy="60" r="3.5" fill="#1E1B4B" />
        <circle cx="48" cy="57" r="1.5" fill="#FFFFFF" />

        <ellipse cx="72" cy="60" rx="6" ry="8" fill="#FFFFFF" />
        <circle cx="74" cy="60" r="3.5" fill="#1E1B4B" />
        <circle cx="72" cy="57" r="1.5" fill="#FFFFFF" />

        {/* Bochechinhas rosadas */}
        <circle cx="40" cy="68" r="4" fill="#F472B6" opacity="0.6" />
        <circle cx="80" cy="68" r="4" fill="#F472B6" opacity="0.6" />

        {/* Sorrisinho */}
        <path
          d="M54 70 Q60 76 66 70"
          stroke="#1E1B4B"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Chapéu de detetive cáqui */}
        <path d="M32 36 C35 24, 85 24, 88 36 Z" fill="#A88059" stroke="#785536" strokeWidth="1.5" />
        <ellipse cx="60" cy="36" rx="35" ry="7" fill="#8A6642" />
        <path d="M40 34 Q60 38 80 34" stroke="#5C3E21" strokeWidth="2" fill="none" />

        {/* Lupa na mãozinha */}
        <circle
          cx="90"
          cy="75"
          r="12"
          fill="#BAE6FD"
          fillOpacity="0.5"
          stroke="#E2E8F0"
          strokeWidth="3"
        />
        <path d="M98 84 L108 96" stroke="#D97706" strokeWidth="4" strokeLinecap="round" />
        <circle cx="86" cy="71" r="3" fill="#FFFFFF" opacity="0.8" />

        {/* Mãozinha segurando */}
        <circle cx="95" cy="80" r="4" fill="#7C3AED" />

        <defs>
          <linearGradient
            id="sociGrad"
            x1="20"
            y1="20"
            x2="100"
            y2="108"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#9333EA" />
            <stop offset="0.5" stopColor="#7C3AED" />
            <stop offset="1" stopColor="#6366F1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export default function Onboarding() {
  const { user } = useAuth()
  const { brands, fetchBrands, selectedBrandId, setSelectedBrandId } = useSocial()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Etapa ativa (1 a 5)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1)

  // Marca ativa sendo configurada
  const activeBrand = useMemo(() => {
    const requestedId = searchParams.get('brand') || selectedBrandId
    if (requestedId && requestedId !== 'all') {
      const match = brands.find((b: any) => b.id === requestedId)
      if (match) return match
    }
    return brands[0] || null
  }, [brands, searchParams, selectedBrandId])

  // Estado dos blocos da Etapa 1
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [essencia, setEssencia] = useState(DEFAULT_ESSENCIA)
  const [publico, setPublico] = useState(DEFAULT_PUBLICO)
  const [selectedTons, setSelectedTons] = useState<string[]>(DEFAULT_TONS)
  const [website, setWebsite] = useState(DEFAULT_SITE)
  const [handle, setHandle] = useState(DEFAULT_HANDLE)

  // Estado da marca na Etapa 3 (Identidade)
  const [brandName, setBrandName] = useState('MudarCurso')
  const [brandColorTheme, setBrandColorTheme] = useState('#7C3AED')
  const [brandSecondaryColor, setBrandSecondaryColor] = useState('#EC4899')
  const [brandLogoPreview, setBrandLogoPreview] = useState<string | null>(null)
  const [savingBrand, setSavingBrand] = useState(false)

  // Estado das redes na Etapa 2
  const [integrationsState, setIntegrationsState] = useState<
    Record<
      IntegrationNetwork,
      { connected: boolean; detail?: string; connected_at?: string; accountName?: string }
    >
  >({
    instagram: {
      connected: true,
      detail: '@ronaldo.barreto1 · 14.785 seguidores',
      accountName: '@ronaldo.barreto1',
    },
    facebook: {
      connected: true,
      detail: 'Ronaldo Adriano Barretos · Conectinove',
      accountName: 'Conectinove',
    },
    linkedin: {
      connected: false,
      detail: 'Publique no seu perfil pessoal',
    },
    tiktok: {
      connected: false,
      detail: 'Publique vídeos na conta da marca',
    },
    youtube: {
      connected: false,
      detail: 'Publique Shorts no canal da marca',
    },
    google_business: {
      connected: false,
      detail: 'Publique no perfil da empresa no Google',
    },
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
    bluesky: { connected: false },
    mastodon: { connected: false },
    tumblr: { connected: false },
    dribbble: { connected: false },
    spotify: { connected: false },
    substack: { connected: false },
    patreon: { connected: false },
    github: { connected: false },
  })

  // Modais de interação da Etapa 2
  const [disconnectModalNet, setDisconnectModalNet] = useState<{
    network: IntegrationNetwork
    name: string
  } | null>(null)
  const [switchPageModalOpen, setSwitchPageModalOpen] = useState(false)
  const [selectedPage, setSelectedPage] = useState('Conectinove')
  const [actionLoadingNetwork, setActionLoadingNetwork] = useState<string | null>(null)

  // Balão Soci dica
  const [showSociTip, setShowSociTip] = useState(true)
  const [sociChatOpen, setSociChatOpen] = useState(false)

  // Etapa 5: Estilos de Conteúdo
  const [selectedFormats, setSelectedFormats] = useState<string[]>([
    'Carrosséis educativos',
    'Vídeos curtos (Reels/Shorts)',
    'Posts conceituais & Frases',
  ])
  const [visualToneStyle, setVisualToneStyle] = useState(
    'Visual moderno com violeta e alto contraste, tipografia limpa e foco em transformação profissional.',
  )

  // Carregar dados salvos da marca ativa
  useEffect(() => {
    if (activeBrand) {
      if (activeBrand.name) setBrandName(activeBrand.name)
      if (activeBrand.description) setEssencia(activeBrand.description)
      if (activeBrand._raw?.target_audience) setPublico(activeBrand._raw.target_audience)
      if (activeBrand._raw?.brand_voice) {
        const parts = activeBrand._raw.brand_voice
          .split('·')
          .map((s: string) => s.trim())
          .filter(Boolean)
        if (parts.length > 0) setSelectedTons(parts)
      }
      if (activeBrand.handles?.website) {
        setWebsite(activeBrand.handles.website.replace(/^https?:\/\//, ''))
      }
      if (activeBrand.handles?.instagram) {
        setHandle(activeBrand.handles.instagram)
      }
      if (activeBrand.color_theme) {
        setBrandColorTheme(activeBrand.color_theme)
      }
      if (activeBrand.logo) {
        setBrandLogoPreview(activeBrand.logo)
      }
      if (activeBrand._raw?.visual_style) {
        const rawStyle = activeBrand._raw.visual_style
        if (rawStyle.includes('Formatos preferidos:')) {
          const parts = rawStyle.split('Formatos preferidos:')
          const parsedFmts = parts[1]
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
          if (parsedFmts.length > 0) setSelectedFormats(parsedFmts)
          setVisualToneStyle(parts[0].trim())
        } else {
          setVisualToneStyle(rawStyle)
        }
      }
    }
  }, [activeBrand])

  // Carregar integrações reais salvas no banco
  useEffect(() => {
    if (!user?.id) return
    let isMounted = true

    const loadIntegrations = async () => {
      try {
        const recs = await getUserIntegrations(user.id)
        if (!isMounted || recs.length === 0) return

        setIntegrationsState((prev) => {
          const next = { ...prev }
          recs.forEach((r) => {
            if (r.network in next) {
              const isConn = Boolean(r.connected)
              next[r.network] = {
                ...next[r.network],
                connected: isConn,
                connected_at: r.connected_at,
                detail:
                  r.network === 'instagram'
                    ? '@ronaldo.barreto1 · 14.785 seguidores'
                    : r.network === 'facebook'
                      ? 'Ronaldo Adriano Barretos · Conectinove'
                      : next[r.network]?.detail,
              }
            }
          })
          return next
        })
      } catch (err) {
        console.warn('Erro ao carregar integrações no wizard:', err)
      }
    }

    loadIntegrations()
    return () => {
      isMounted = false
    }
  }, [user?.id])

  // Persistir alterações da marca no PocketBase
  const persistBrandData = async () => {
    if (!user?.id) return
    setSavingBrand(true)
    try {
      const compositeStyle =
        selectedFormats.length > 0
          ? `${visualToneStyle.trim()} | Formatos preferidos: ${selectedFormats.join(', ')}`
          : visualToneStyle.trim()

      const payload: Record<string, unknown> = {
        name: brandName.trim() || 'MudarCurso',
        description: essencia.trim(),
        target_audience: publico.trim(),
        brand_voice: selectedTons.join(' · '),
        website: website.startsWith('http') ? website : `https://${website}`,
        website_url: website.startsWith('http') ? website : `https://${website}`,
        instagram: handle.startsWith('@') ? handle : `@${handle}`,
        color_theme: brandColorTheme,
        visual_style: compositeStyle,
      }

      if (activeBrand?.id) {
        await updateBrand(activeBrand.id, payload)
      } else {
        payload.user = user.id
        payload.objective = 'sales'
        const created = await createBrand(payload)
        setSelectedBrandId(created.id)
      }
      await fetchBrands()
    } catch (err) {
      console.warn('Erro ao persistir marca no wizard:', err)
    } finally {
      setSavingBrand(false)
    }
  }

  // Ações de conexão da Etapa 2
  const handleReconnect = async (network: IntegrationNetwork, name: string) => {
    setActionLoadingNetwork(network)
    try {
      if (user?.id) {
        await toggleIntegrationStatus(user.id, network, true, name)
      }
      setIntegrationsState((prev) => ({
        ...prev,
        [network]: {
          ...prev[network],
          connected: true,
          connected_at: new Date().toISOString(),
        },
      }))
      toast({
        title: 'Rede reconectada!',
        description: `${name} foi sincronizado com sucesso.`,
      })
    } finally {
      setActionLoadingNetwork(null)
    }
  }

  const handleDisconnectConfirm = async () => {
    if (!disconnectModalNet) return
    const { network, name } = disconnectModalNet
    setActionLoadingNetwork(network)
    setDisconnectModalNet(null)
    try {
      if (user?.id) {
        await toggleIntegrationStatus(user.id, network, false, name)
      }
      setIntegrationsState((prev) => ({
        ...prev,
        [network]: {
          ...prev[network],
          connected: false,
          connected_at: undefined,
        },
      }))
      toast({
        title: 'Rede desconectada',
        description: `${name} foi desconectado com segurança.`,
      })
    } finally {
      setActionLoadingNetwork(null)
    }
  }

  const handleConnectLinkedIn = async () => {
    setActionLoadingNetwork('linkedin')
    try {
      if (user?.id) {
        await toggleIntegrationStatus(user.id, 'linkedin', true, 'LinkedIn API')
      }
      setIntegrationsState((prev) => ({
        ...prev,
        linkedin: {
          ...prev.linkedin,
          connected: true,
          detail: 'Ronaldo Barreto · Perfil Conectado',
        },
      }))
      toast({
        title: 'LinkedIn Conectado!',
        description: 'Sua conta profissional foi vinculada para publicações.',
      })
    } finally {
      setActionLoadingNetwork(null)
    }
  }

  const handleConnectGbp = async () => {
    setActionLoadingNetwork('google_business')
    try {
      if (user?.id) {
        await toggleIntegrationStatus(user.id, 'google_business', true, 'Google Meu Negócio')
      }
      setIntegrationsState((prev) => ({
        ...prev,
        google_business: {
          ...prev.google_business,
          connected: true,
          detail: `${brandName || 'MidiaViva'} · Perfil Verificado no Google Maps`,
        },
      }))
      toast({
        title: 'Google Meu Negócio Conectado!',
        description: 'Perfil de presença local conectado com sucesso.',
      })
    } finally {
      setActionLoadingNetwork(null)
    }
  }

  const handleSavePageSwitch = () => {
    setIntegrationsState((prev) => ({
      ...prev,
      facebook: {
        ...prev.facebook,
        detail: `Ronaldo Adriano Barretos · ${selectedPage}`,
      },
    }))
    setSwitchPageModalOpen(false)
    toast({
      title: 'Página alterada com sucesso!',
      description: `Página ativa definida para "${selectedPage}".`,
    })
  }

  // Navegação entre etapas
  const handleNextStep = async () => {
    await persistBrandData()
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4 | 5)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Conclusão final
      toast({
        title: 'Marca configurada com sucesso!',
        description: 'Todas as diretrizes e conexões foram salvas no portal.',
      })
      navigate('/app/feed')
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate('/app/brands')
    }
  }

  // Lista de 5 etapas do Wizard
  const STEPS = [
    { num: 1, label: 'Sua marca' },
    { num: 2, label: 'Redes' },
    { num: 3, label: 'Identidade' },
    { num: 4, label: 'Brand kit' },
    { num: 5, label: 'Estilos' },
  ]

  // Resumos da Etapa 1
  const tonsSummary = selectedTons.join(' · ')
  const presencaSummary = `${website || DEFAULT_SITE} · ${handle || DEFAULT_HANDLE}`

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col text-foreground font-sans">
      {/* ========================================================
          CABEÇALHO SUPERIOR FIXO
          - Logo "bestcontent AI" à esquerda
          - Stepper numerado no centro
          - Chip "Editando <Marca>" + "× Sair" à direita
         ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo bestcontent AI */}
          <div
            onClick={() => navigate('/app/feed')}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0"
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-xs">
              b
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-extrabold text-base tracking-tight text-foreground">
                bestcontent
              </span>
              <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">
                AI
              </span>
            </div>
          </div>

          {/* Stepper Central com indicador ativo e linhas conectoras */}
          <nav
            aria-label="Progresso do assistente"
            className="flex items-center justify-center gap-2 sm:gap-3"
          >
            {STEPS.map((s, index) => {
              const isActive = currentStep === s.num
              const isCompleted = currentStep > s.num
              const canClick = currentStep >= s.num

              return (
                <React.Fragment key={s.num}>
                  {index > 0 && (
                    <div
                      className={`h-[2px] w-4 sm:w-8 md:w-12 transition-colors duration-300 ${
                        isCompleted ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => canClick && setCurrentStep(s.num as 1 | 2 | 3 | 4 | 5)}
                    disabled={!canClick}
                    className={`flex items-center gap-2 group transition-all ${
                      canClick ? 'cursor-pointer' : 'cursor-default opacity-60'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-4 ring-purple-600/20'
                          : isCompleted
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                    </div>
                    <span
                      className={`hidden md:inline text-xs font-semibold whitespace-nowrap transition-colors ${
                        isActive
                          ? 'text-foreground font-bold'
                          : isCompleted
                            ? 'text-foreground/80'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                </React.Fragment>
              )
            })}
          </nav>

          {/* Direita: Chip "Editando <Nome da Marca>" + Botão "× Sair" */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-xs shrink-0"
                style={{ backgroundColor: brandColorTheme }}
              >
                {brandLogoPreview ? (
                  <img
                    src={brandLogoPreview}
                    alt={brandName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  (brandName || 'M').slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[10px] text-muted-foreground">Editando</span>
                <span className="text-xs font-bold text-foreground max-w-[90px] sm:max-w-[130px] truncate">
                  {brandName || 'MudarCurso'}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/feed')}
              className="text-xs font-medium text-muted-foreground hover:text-foreground h-8 px-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              × Sair
            </Button>
          </div>
        </div>
      </header>

      {/* ========================================================
          CORPO PRINCIPAL CONFORME A ETAPA
         ======================================================== */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 pb-28">
        {/* ====================================================
            ETAPA 1 — "Sua marca"
           ==================================================== */}
        {currentStep === 1 && (
          <div className="animate-fade-in relative">
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Sua marca
              </h1>
              <p className="text-base text-muted-foreground mt-2 leading-relaxed">
                O que a marca é e para quem ela fala. É daqui que saem as ideias e os textos dos
                posts.
              </p>

              <div className="mt-8 flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-500">* Obrigatório</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4 items-start">
              {/* Coluna da esquerda com os 4 blocos expansíveis */}
              <div className="lg:col-span-8 space-y-3.5">
                {/* 1. Essência */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 overflow-hidden transition-all shadow-xs">
                  <div
                    onClick={() =>
                      setExpandedSection(expandedSection === 'essencia' ? null : 'essencia')
                    }
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-200 shadow-xs">
                        <Target className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm sm:text-base font-bold text-foreground">
                            Essência
                          </h3>
                          {essencia.trim().length > 0 && (
                            <div className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-md mt-0.5">
                          {essencia}
                        </p>
                      </div>
                    </div>
                    <div className="text-muted-foreground shrink-0">
                      {expandedSection === 'essencia' ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {expandedSection === 'essencia' && (
                    <div className="p-4 sm:p-5 pt-0 border-t border-slate-200/80 dark:border-slate-800 space-y-3 mt-3 animate-fade-in">
                      <label className="text-xs font-semibold text-muted-foreground block">
                        O que a marca faz, sua missão e proposta única de valor:
                      </label>
                      <Textarea
                        value={essencia}
                        onChange={(e) => setEssencia(e.target.value)}
                        rows={4}
                        className="text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 rounded-xl"
                        placeholder="Descreva a essência da sua marca..."
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => setExpandedSection(null)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl px-4"
                        >
                          Salvar bloco
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Público */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 overflow-hidden transition-all shadow-xs">
                  <div
                    onClick={() =>
                      setExpandedSection(expandedSection === 'publico' ? null : 'publico')
                    }
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-200 shadow-xs">
                        <Users className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm sm:text-base font-bold text-foreground">
                            Público
                          </h3>
                          {publico.trim().length > 0 && (
                            <div className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-md mt-0.5">
                          {publico}
                        </p>
                      </div>
                    </div>
                    <div className="text-muted-foreground shrink-0">
                      {expandedSection === 'publico' ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {expandedSection === 'publico' && (
                    <div className="p-4 sm:p-5 pt-0 border-t border-slate-200/80 dark:border-slate-800 space-y-3 mt-3 animate-fade-in">
                      <label className="text-xs font-semibold text-muted-foreground block">
                        Quem é o público-alvo, dores, desejos e objetivos:
                      </label>
                      <Textarea
                        value={publico}
                        onChange={(e) => setPublico(e.target.value)}
                        rows={4}
                        className="text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 rounded-xl"
                        placeholder="Descreva o público que você deseja atingir..."
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => setExpandedSection(null)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl px-4"
                        >
                          Salvar bloco
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Tom de voz */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 overflow-hidden transition-all shadow-xs">
                  <div
                    onClick={() => setExpandedSection(expandedSection === 'tom' ? null : 'tom')}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-200 shadow-xs">
                        <MessageSquare className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm sm:text-base font-bold text-foreground">
                            Tom de voz
                          </h3>
                          {selectedTons.length > 0 && (
                            <div className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-md mt-0.5">
                          {tonsSummary || 'Selecione os tons da marca'}
                        </p>
                      </div>
                    </div>
                    <div className="text-muted-foreground shrink-0">
                      {expandedSection === 'tom' ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {expandedSection === 'tom' && (
                    <div className="p-4 sm:p-5 pt-0 border-t border-slate-200/80 dark:border-slate-800 space-y-4 mt-3 animate-fade-in">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-2">
                          Selecione até 3 ou 4 tons de voz que representam a linguagem da sua marca:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {AI_VOICE_TONES.slice(0, 16).map((tone) => {
                            const isSelected = selectedTons.includes(tone.label)
                            return (
                              <button
                                key={tone.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedTons((prev) => prev.filter((t) => t !== tone.label))
                                  } else {
                                    setSelectedTons((prev) => [...prev, tone.label])
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                    : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-foreground hover:border-purple-400'
                                }`}
                              >
                                <span>{tone.emoji}</span>
                                <span>{tone.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => setExpandedSection(null)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl px-4"
                        >
                          Salvar bloco
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Presença online */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 overflow-hidden transition-all shadow-xs">
                  <div
                    onClick={() =>
                      setExpandedSection(expandedSection === 'presenca' ? null : 'presenca')
                    }
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-200 shadow-xs">
                        <Share2 className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm sm:text-base font-bold text-foreground">
                            Presença online
                          </h3>
                          {(website || handle) && (
                            <div className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-md mt-0.5">
                          {presencaSummary}
                        </p>
                      </div>
                    </div>
                    <div className="text-muted-foreground shrink-0">
                      {expandedSection === 'presenca' ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {expandedSection === 'presenca' && (
                    <div className="p-4 sm:p-5 pt-0 border-t border-slate-200/80 dark:border-slate-800 space-y-3 mt-3 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            Site da marca
                          </label>
                          <Input
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="exemplo.com.br"
                            className="text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            Handle principal (@)
                          </label>
                          <Input
                            value={handle}
                            onChange={(e) => setHandle(e.target.value)}
                            placeholder="@marca"
                            className="text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => setExpandedSection(null)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl px-4"
                        >
                          Salvar bloco
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna da direita com o Card Dica do Soci e Mascote */}
              <div className="lg:col-span-4 flex flex-col items-end pt-4">
                {showSociTip && (
                  <div className="flex items-end gap-2 animate-fade-in max-w-sm">
                    {/* Balão de fala branco */}
                    <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl text-left space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-foreground font-medium leading-relaxed">
                          Capriche no &ldquo;O que a marca faz&rdquo; e no público. É daí que eu
                          tiro as ideias de post.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowSociTip(false)}
                          className="text-muted-foreground hover:text-foreground text-xs p-0.5"
                          title="Fechar dica"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => setSociChatOpen(true)}
                          className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline"
                        >
                          Perguntar ao Soci
                        </button>
                      </div>
                    </div>

                    {/* Mascote Soci */}
                    <SociMascot size="md" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            ETAPA 2 — "Redes"
           ==================================================== */}
        {currentStep === 2 && (
          <div className="animate-fade-in">
            <div className="max-w-2xl mb-8">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Conecte suas redes
              </h1>
              <p className="text-base text-muted-foreground mt-2 leading-relaxed">
                Conecte as redes que a sua marca já usa. Dá para conectar mais depois.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Coluna da esquerda com a lista das 6 redes */}
              <div className="lg:col-span-7 space-y-3.5">
                {/* 1. Instagram — CONECTADO */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    integrationsState.instagram?.connected
                      ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#fdf497] via-[#fd5949] to-[#d6249f] flex items-center justify-center text-white shrink-0 shadow-xs">
                      {/* Ícone Instagram */}
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm sm:text-base text-foreground">
                          Instagram
                        </span>
                        {integrationsState.instagram?.connected && (
                          <div className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-0.5 truncate ${
                          integrationsState.instagram?.connected
                            ? 'text-purple-700 dark:text-purple-300 font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {integrationsState.instagram?.detail ||
                          'Publique fotos, carrosséis e Reels'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {integrationsState.instagram?.connected ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReconnect('instagram', 'Instagram Graph API')}
                          disabled={actionLoadingNetwork === 'instagram'}
                          className="h-8 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                        >
                          {actionLoadingNetwork === 'instagram' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Reconectar'
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDisconnectModalNet({
                              network: 'instagram',
                              name: 'Instagram',
                            })
                          }
                          className="h-8 px-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-rose-600"
                        >
                          Desconectar
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleReconnect('instagram', 'Instagram Graph API')}
                        className="h-8 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Conectar
                      </Button>
                    )}
                  </div>
                </div>

                {/* 2. Facebook — CONECTADO */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    integrationsState.facebook?.connected
                      ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white shrink-0 shadow-xs">
                      {/* Ícone Facebook */}
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm sm:text-base text-foreground">
                          Facebook
                        </span>
                        {integrationsState.facebook?.connected && (
                          <div className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-0.5 truncate ${
                          integrationsState.facebook?.connected
                            ? 'text-purple-700 dark:text-purple-300 font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {integrationsState.facebook?.detail || 'Publique nas páginas da empresa'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {integrationsState.facebook?.connected ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSwitchPageModalOpen(true)}
                          className="h-8 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                        >
                          Trocar página
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDisconnectModalNet({
                              network: 'facebook',
                              name: 'Facebook',
                            })
                          }
                          className="h-8 px-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-rose-600"
                        >
                          Desconectar
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleReconnect('facebook', 'Facebook Pages API')}
                        className="h-8 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Conectar
                      </Button>
                    )}
                  </div>
                </div>

                {/* 3. LinkedIn — NÃO CONECTADO */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    integrationsState.linkedin?.connected
                      ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#0A66C2] flex items-center justify-center text-white shrink-0 shadow-xs">
                      {/* Ícone LinkedIn */}
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm sm:text-base text-foreground">
                          LinkedIn
                        </span>
                        {integrationsState.linkedin?.connected && (
                          <div className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {integrationsState.linkedin?.detail || 'Publique no seu perfil pessoal'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {integrationsState.linkedin?.connected ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDisconnectModalNet({
                            network: 'linkedin',
                            name: 'LinkedIn',
                          })
                        }
                        className="h-8 px-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-rose-600"
                      >
                        Desconectar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleConnectLinkedIn}
                        disabled={actionLoadingNetwork === 'linkedin'}
                        className="h-9 px-4 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-foreground hover:bg-slate-50 gap-2 shadow-xs"
                      >
                        {actionLoadingNetwork === 'linkedin' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span className="font-black text-[#0A66C2] text-xs">in</span>
                        )}
                        <span>Conectar</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* 4. TikTok — DESABILITADO (EM BREVE) */}
                <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-85">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-black dark:bg-slate-800 flex items-center justify-center text-white shrink-0 shadow-xs">
                      {/* Ícone TikTok */}
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <span className="font-bold text-sm sm:text-base text-foreground">TikTok</span>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Publique vídeos na conta da marca
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-auto">
                    <Badge
                      variant="outline"
                      className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                    >
                      Em breve
                    </Badge>
                  </div>
                </div>

                {/* 5. YouTube — DESABILITADO (EM BREVE) */}
                <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-85">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#FF0000] flex items-center justify-center text-white shrink-0 shadow-xs">
                      {/* Ícone YouTube */}
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <span className="font-bold text-sm sm:text-base text-foreground">
                        YouTube
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Publique Shorts no canal da marca
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-auto">
                    <Badge
                      variant="outline"
                      className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                    >
                      Em breve
                    </Badge>
                  </div>
                </div>

                {/* 6. Google Meu Negócio — CONEXÃO COMPLETA */}
                <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#4285F4] flex items-center justify-center text-white shrink-0 shadow-xs">
                      {/* Ícone Google Meu Negócio / Loja */}
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M21.9 8.8l-1.9-5.7c-.2-.6-.8-1.1-1.5-1.1H5.5c-.7 0-1.3.5-1.5 1.1L2.1 8.8c-.3.8 0 1.7.6 2.3.1.1.2.2.4.3V20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8.6c.2-.1.3-.2.4-.3.6-.6.9-1.5.6-2.3zM18.5 4l1.3 4h-3.3l-1.1-4h3.1zM11 4h2l1.1 4H9.9L11 4zm-4 0h3.1l-1.1 4H5.7L7 4zM4 20v-8c.3.1.6.1 1 .1 1 0 1.9-.4 2.6-1.1.7.7 1.6 1.1 2.6 1.1s1.9-.4 2.6-1.1c.7.7 1.6 1.1 2.6 1.1 1 0 1.9-.4 2.6-1.1.4.3.7.3 1 .1v8H4z" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-foreground">
                          Google Meu Negócio
                        </span>
                        {integrationsState.google_business?.connected && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3 stroke-[3]" /> Conectado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {integrationsState.google_business?.connected
                          ? integrationsState.google_business.detail ||
                            'Perfil ativo no Google Maps & Busca Local'
                          : 'Publique no perfil da empresa no Google'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {integrationsState.google_business?.connected ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDisconnectModalNet({
                            network: 'google_business',
                            name: 'Google Meu Negócio',
                          })
                        }
                        className="h-8 px-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-rose-600"
                      >
                        Desconectar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleConnectGbp}
                        disabled={actionLoadingNetwork === 'google_business'}
                        className="h-9 px-4 rounded-xl text-xs font-bold bg-[#4285F4] hover:bg-[#3367D6] text-white gap-2 shadow-xs"
                      >
                        {actionLoadingNetwork === 'google_business' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Store className="w-3.5 h-3.5" />
                        )}
                        <span>Conectar</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Coluna lateral direita: Card cinza-claro "O que você ganha ao conectar" */}
              <div className="lg:col-span-5 relative">
                <div className="rounded-3xl bg-slate-100/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 space-y-6 shadow-sm">
                  <h2 className="text-lg font-black text-foreground">
                    O que você ganha ao conectar
                  </h2>

                  {/* Benefício 1 */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-foreground">
                        Publicar e agendar daqui
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        É só aprovar o post e escolher quando ele sai. Sem baixar e subir em cada
                        rede.
                      </p>
                    </div>
                  </div>

                  {/* Benefício 2 */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                      <BarChart2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-foreground">
                        Seus números num lugar só
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Alcance, engajamento e seguidores das redes conectadas, sem abrir cada app.
                      </p>
                    </div>
                  </div>

                  {/* Card branco destacado de rede conectada dinâmico */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                      <span className="text-sm">📷</span>
                      <span>Instagram conectado</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      @ronaldo.barreto1 · 14.785 seguidores
                    </p>
                  </div>

                  {/* Rodapé com ícone de cadeado */}
                  <div className="flex items-start gap-2.5 pt-2 text-xs text-muted-foreground leading-relaxed">
                    <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <p>
                      Você escolhe o que conectar e desconecta quando quiser. Nada é publicado sem a
                      sua aprovação.
                    </p>
                  </div>
                </div>

                {/* Mascote no canto inferior direito da coluna */}
                <div className="absolute -bottom-8 -right-4 hidden sm:block pointer-events-none">
                  <SociMascot size="lg" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            ETAPA 3 — "Identidade"
           ==================================================== */}
        {currentStep === 3 && (
          <div className="animate-fade-in max-w-3xl space-y-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Identidade visual da marca
              </h1>
              <p className="text-base text-muted-foreground mt-2 leading-relaxed">
                Nome oficial, cores primárias e secundárias e presença da marca nos criativos.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nome da Marca
                </label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ex: MudarCurso"
                  className="h-11 text-base bg-white dark:bg-slate-950 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Cor Primária (Tema)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandColorTheme}
                      onChange={(e) => setBrandColorTheme(e.target.value)}
                      className="w-12 h-11 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-1 bg-white"
                    />
                    <Input
                      value={brandColorTheme}
                      onChange={(e) => setBrandColorTheme(e.target.value)}
                      className="font-mono text-xs uppercase h-11 bg-white dark:bg-slate-950 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Cor Secundária (Destaque)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandSecondaryColor}
                      onChange={(e) => setBrandSecondaryColor(e.target.value)}
                      className="w-12 h-11 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-1 bg-white"
                    />
                    <Input
                      value={brandSecondaryColor}
                      onChange={(e) => setBrandSecondaryColor(e.target.value)}
                      className="font-mono text-xs uppercase h-11 bg-white dark:bg-slate-950 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Preview da Marca em Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-md"
                    style={{ backgroundColor: brandColorTheme }}
                  >
                    {brandLogoPreview ? (
                      <img
                        src={brandLogoPreview}
                        alt={brandName}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      (brandName || 'M').slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-foreground">{brandName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {website} · {handle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full shadow-xs border border-white"
                    style={{ backgroundColor: brandColorTheme }}
                    title="Cor primária"
                  />
                  <div
                    className="w-6 h-6 rounded-full shadow-xs border border-white"
                    style={{ backgroundColor: brandSecondaryColor }}
                    title="Cor secundária"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            ETAPA 4 — "Brand kit"
           ==================================================== */}
        {currentStep === 4 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Brand kit & Aplicações
              </h1>
              <p className="text-base text-muted-foreground mt-2 leading-relaxed">
                Manual oficial da marca com downloads em alta definição, variações para redes
                sociais e diretrizes de consistência visual.
              </p>
            </div>

            {/* Reaproveita o componente completo de Brand Kit do app */}
            <div className="pt-2">
              <MudarCursoLogoKit />
            </div>
          </div>
        )}

        {/* ====================================================
            ETAPA 5 — "Estilos"
           ==================================================== */}
        {currentStep === 5 && (
          <div className="animate-fade-in max-w-3xl space-y-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Estilos e preferências de conteúdo
              </h1>
              <p className="text-base text-muted-foreground mt-2 leading-relaxed">
                Defina os formatos preferidos e as diretrizes estéticas para que a inteligência
                artificial gere posts sob medida.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
                  Formatos mais frequentes para esta marca:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Carrosséis educativos',
                    'Vídeos curtos (Reels/Shorts)',
                    'Posts conceituais & Frases',
                    'Panfletos & Flyers de ofertas',
                    'Artigos longos & Threads',
                    'Stories de bastidores',
                  ].map((fmt) => {
                    const isChecked = selectedFormats.includes(fmt)
                    return (
                      <div
                        key={fmt}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedFormats((prev) => prev.filter((f) => f !== fmt))
                          } else {
                            setSelectedFormats((prev) => [...prev, fmt])
                          }
                        }}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isChecked
                            ? 'bg-purple-500/10 border-purple-600 text-foreground ring-1 ring-purple-600/30'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-muted-foreground hover:border-purple-300'
                        }`}
                      >
                        <span className="text-xs font-bold">{fmt}</span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Diretriz estética geral:
                </label>
                <Textarea
                  value={visualToneStyle}
                  onChange={(e) => setVisualToneStyle(e.target.value)}
                  rows={3}
                  className="text-sm bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 rounded-xl"
                  placeholder="Descreva o estilo estético..."
                />
              </div>

              {/* Card de Resumo Pronto para Concluir */}
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-start gap-3.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                    Tudo pronto para começar!
                  </h4>
                  <p className="text-xs text-emerald-800/90 dark:text-emerald-300/80 leading-relaxed">
                    Ao clicar em Concluir, a marca <strong>{brandName}</strong> estará 100%
                    calibrada para criar posts, carrosséis, vídeos e planejar publicações com as
                    redes conectadas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
          RODAPÉ FIXO DE NAVEGAÇÃO
          - "◀ Volta" / "◀ Voltar" à esquerda
          - Botão violeta primário à direita ("Ir para Redes", etc.)
         ======================================================== */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handlePrevStep}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground gap-1.5 h-11 px-4 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volta</span>
          </Button>

          <Button
            onClick={handleNextStep}
            disabled={savingBrand}
            className="h-11 px-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/30 gap-2 min-w-[160px]"
          >
            {savingBrand ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : currentStep === 1 ? (
              <span>Ir para Redes</span>
            ) : currentStep === 2 ? (
              <span>Ir para Identidade</span>
            ) : currentStep === 3 ? (
              <span>Ir para Brand kit</span>
            ) : currentStep === 4 ? (
              <span>Ir para Estilos</span>
            ) : (
              <span>Concluir</span>
            )}
          </Button>
        </div>
      </footer>

      {/* ========================================================
          MODAL DE CONFIRMAÇÃO DE DESCONEXÃO (ETAPA 2)
         ======================================================== */}
      <Dialog open={Boolean(disconnectModalNet)} onOpenChange={() => setDisconnectModalNet(null)}>
        <DialogContent className="max-w-md p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              Desconectar {disconnectModalNet?.name}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Ao desconectar, o BestContent AI não poderá mais agendar posts diretamente nem ler
              métricas desta conta. Você pode reconectar a qualquer momento.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDisconnectModalNet(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleDisconnectConfirm}
              className="text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Confirmar Desconexão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL DE TROCA DE PÁGINA FACEBOOK (ETAPA 2)
         ======================================================== */}
      <Dialog open={switchPageModalOpen} onOpenChange={setSwitchPageModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              Trocar Página do Facebook
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Selecione a Fanpage que você deseja vincular para agendamentos e métricas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {[
              { id: 'Conectinove', desc: 'Página de Treinamentos e Inovação' },
              { id: 'MudarCurso Oficial', desc: 'Plataforma de cursos de IA e Carreiras' },
              { id: 'Ronaldo Barreto Mentor', desc: 'Página de figura pública' },
            ].map((p) => {
              const isSelected = selectedPage === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPage(p.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-purple-500/10 border-purple-600 ring-1 ring-purple-600/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-purple-300'
                  }`}
                >
                  <div>
                    <h5 className="font-bold text-xs text-foreground">{p.id}</h5>
                    <p className="text-[11px] text-muted-foreground">{p.desc}</p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSwitchPageModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSavePageSwitch}
              className="text-xs rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold px-4"
            >
              Definir como Ativa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL "PERGUNTAR AO SOCI"
         ======================================================== */}
      <Dialog open={sociChatOpen} onOpenChange={setSociChatOpen}>
        <DialogContent className="max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
          <DialogHeader className="flex flex-row items-center gap-3">
            <SociMascot size="sm" />
            <div>
              <DialogTitle className="text-base font-black text-foreground">
                Soci AI · Seu Assistente Criativo
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Tire dúvidas sobre posicionamento, dores do público e tons de voz.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
            Olá! Eu sou o <strong>Soci</strong>. Com base no público de transição de carreira e IA
            da <strong>{brandName}</strong>, eu recomendo manter os tons <em>Inspirador</em> e{' '}
            <em>Educativo</em>. Quer que eu sugira um resumo ainda mais afiado para a sua Essência?
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSociChatOpen(false)}
              className="text-xs rounded-xl"
            >
              Entendi, obrigado!
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSociChatOpen(false)
                toast({
                  title: 'Soci calibrou sua marca!',
                  description: 'Novas sugestões de copy foram preparadas para o estúdio.',
                })
              }}
              className="text-xs rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              Aplicar recomendação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
