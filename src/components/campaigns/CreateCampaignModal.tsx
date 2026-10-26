import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers,
  Sparkles,
  Coins,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  HelpCircle,
  Film,
  Smartphone,
  Square,
  FileText,
  Megaphone,
  Briefcase,
  ExternalLink,
  Info,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import {
  CAMPAIGN_FORMATS,
  createMultiFormatCampaign,
  type CampaignFormatOption,
  type CampaignFormatId,
} from '@/services/campaigns'
import {
  Youtube,
  Twitter,
  FileText as FileTextIcon,
  Pin,
  MessageCircle,
  BookOpen,
  Printer,
  MonitorPlay,
  ListOrdered,
  Tv,
  Star,
  Clapperboard,
  Mail,
  Building2,
  BadgePercent,
  Wand2,
} from 'lucide-react'

export const CAMPAIGN_TONES = [
  { id: 'profissional', label: 'Profissional', emoji: '💼' },
  { id: 'descontraido', label: 'Descontraído', emoji: '😊' },
  { id: 'inspirador', label: 'Inspirador', emoji: '🚀' },
  { id: 'divertido', label: 'Divertido', emoji: '🎉' },
  { id: 'direto', label: 'Direto ao Ponto', emoji: '🎯' },
  { id: 'empatico', label: 'Empático', emoji: '🤝' },
  { id: 'provocativo', label: 'Provocativo', emoji: '🔥' },
]

interface CreateCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (campaignId: string) => void
}

export function CreateCampaignModal({ open, onOpenChange, onSuccess }: CreateCampaignModalProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const { brands, selectedBrandId, refreshPosts } = useSocial()

  // Briefing e dados da campanha
  const [name, setName] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<string>(() => {
    if (selectedBrandId && selectedBrandId !== 'all') return selectedBrandId
    return brands[0]?.id || ''
  })
  const [objective, setObjective] = useState<'engajar' | 'vender' | 'awareness'>('engajar')
  const [tone, setTone] = useState<string>('profissional')
  const [briefing, setBriefing] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [cta, setCta] = useState('')

  // Formatos selecionados (padrão: formatos essenciais marcados para entrega inicial equilibrada)
  const [selectedFormats, setSelectedFormats] = useState<CampaignFormatId[]>([
    'reels',
    'story',
    'feed',
    'carousel',
    'flyer',
  ])

  // Modal de confirmação de créditos
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formatStatusMap, setFormatStatusMap] = useState<
    Record<string, 'pending' | 'generating' | 'done' | 'error'>
  >({})

  // Objeto de marca ativa selecionada
  const activeBrandObj = useMemo(() => {
    return brands.find((b: any) => b.id === selectedBrand) || brands[0] || null
  }, [brands, selectedBrand])

  // Cálculo de créditos
  const totalEstimatedCredits = useMemo(() => {
    return selectedFormats.reduce((acc, fId) => {
      const f = CAMPAIGN_FORMATS.find((item) => item.id === fId)
      return acc + (f ? f.credits : 15)
    }, 0)
  }, [selectedFormats])

  // Alternar formato
  const toggleFormat = (formatId: CampaignFormatId) => {
    setSelectedFormats((prev) =>
      prev.includes(formatId) ? prev.filter((id) => id !== formatId) : [...prev, formatId],
    )
  }

  // Validação
  const isValid =
    name.trim().length >= 3 && briefing.trim().length >= 10 && selectedFormats.length > 0

  const validationError = useMemo(() => {
    if (name.trim().length === 0) return 'Dê um nome para a sua campanha'
    if (name.trim().length < 3) return 'O nome da campanha deve ter pelo menos 3 caracteres'
    if (briefing.trim().length === 0) return 'Descreva a ideia central / briefing da campanha'
    if (briefing.trim().length < 10) return 'O briefing precisa ter no mínimo 10 caracteres'
    if (selectedFormats.length === 0) return 'Selecione pelo menos 1 formato para gerar'
    return null
  }, [name, briefing, selectedFormats])

  const handleOpenConfirm = () => {
    if (!isValid) {
      toast({
        title: 'Preencha os campos obrigatórios',
        description: validationError || 'Verifique as informações da campanha.',
        variant: 'destructive',
      })
      return
    }
    setConfirmOpen(true)
  }

  const handleExecuteGeneration = async () => {
    if (!user?.id) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login para criar sua campanha.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    // Inicializar status de cada formato
    const initialStatus: Record<string, 'pending' | 'generating' | 'done' | 'error'> = {}
    selectedFormats.forEach((fId) => {
      initialStatus[fId] = 'pending'
    })
    setFormatStatusMap(initialStatus)

    try {
      const selectedToneLabel = CAMPAIGN_TONES.find((t) => t.id === tone)?.label || 'Profissional'

      const result = await createMultiFormatCampaign({
        userId: user.id,
        brandId: activeBrandObj?.id,
        brandName: activeBrandObj?.name || 'Sua Marca',
        brandVoice: activeBrandObj?.brandVoice || selectedToneLabel,
        name: name.trim(),
        objective,
        briefing: briefing.trim(),
        targetUrl: targetUrl.trim() || undefined,
        cta: cta.trim() || undefined,
        selectedFormats,
        onProgress: (formatId, status) => {
          setFormatStatusMap((prev) => ({ ...prev, [formatId]: status }))
        },
      })

      // Atualizar lista de posts do SocialContext
      refreshPosts()

      toast({
        title: 'Campanha criada com sucesso!',
        description: `${result.createdPosts.length} formatos gerados e salvos como rascunhos na sua Biblioteca (${totalEstimatedCredits} créditos utilizados).`,
      })

      setConfirmOpen(false)
      onOpenChange(false)
      onSuccess?.(result.campaign.id)

      // Redirecionar para a biblioteca filtrando pela nova campanha
      navigate(`/app/library?campaign=${result.campaign.id}`)
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar campanha',
        description: err?.message || 'Ocorreu um erro ao gerar os formatos da campanha.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Sugestões de Pacotes Recomendados por Objetivo
  const RECOMMENDED_PACKAGES: Record<
    'engajar' | 'vender' | 'awareness',
    { name: string; formats: CampaignFormatId[]; desc: string }
  > = {
    vender: {
      name: 'Pacote Vendas & Conversão Máxima',
      formats: [
        'feed',
        'story',
        'carousel_testimonials',
        'meta_ad_square',
        'google_display',
        'whatsapp',
      ],
      desc: 'Feed + Story + Carrossel Depoimentos + Meta Ads + Google Display + WhatsApp',
    },
    engajar: {
      name: 'Pacote Viral & Engajamento Total',
      formats: ['reels_cinematic', 'story_backstage_3', 'feed', 'carousel', 'story_sequence_5'],
      desc: 'Reels Cinematográfico + Stories Bastidores + Feed + Carrossel + Story 5 Partes',
    },
    awareness: {
      name: 'Pacote Autoridade & Branding Executivo',
      formats: [
        'newsletter',
        'banner_linkedin_company',
        'email_newsletter_visual',
        'carrossel_10',
        'youtube',
        'event_cover',
      ],
      desc: 'Artigo LinkedIn + Banner Empresa + E-mail Visual + Super Guia 10 slides + YouTube + Capa Live',
    },
  }

  const applyRecommendedPackage = (obj: 'engajar' | 'vender' | 'awareness') => {
    const pkg = RECOMMENDED_PACKAGES[obj]
    if (pkg) {
      setSelectedFormats(pkg.formats)
      toast({
        title: `Pacote aplicado: ${pkg.name}`,
        description: `${pkg.formats.length} formatos ideais selecionados para o objetivo ${obj.toUpperCase()}.`,
      })
    }
  }

  const renderFormatIcon = (formatId: string) => {
    switch (formatId) {
      case 'reels':
        return <Film className="w-4 h-4 text-rose-500" />
      case 'story':
        return <Smartphone className="w-4 h-4 text-purple-500" />
      case 'feed':
        return <Square className="w-4 h-4 text-blue-500" />
      case 'carousel':
        return <Layers className="w-4 h-4 text-amber-500" />
      case 'flyer':
        return <Megaphone className="w-4 h-4 text-emerald-500" />
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-500" />
      case 'thread':
        return <Twitter className="w-4 h-4 text-sky-500" />
      case 'newsletter':
        return <FileText className="w-4 h-4 text-indigo-500" />
      case 'pinterest':
        return <Pin className="w-4 h-4 text-rose-600" />
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-emerald-600" />
      case 'carrossel_10':
        return <BookOpen className="w-4 h-4 text-purple-600" />
      case 'poster_print':
        return <Printer className="w-4 h-4 text-cyan-600" />
      case 'google_display':
        return <MonitorPlay className="w-4 h-4 text-amber-600" />
      case 'story_sequence_5':
        return <ListOrdered className="w-4 h-4 text-pink-600" />
      case 'event_cover':
        return <Tv className="w-4 h-4 text-indigo-600" />
      case 'carousel_testimonials':
        return <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
      case 'story_backstage_3':
        return <Clapperboard className="w-4 h-4 text-violet-500" />
      case 'reels_cinematic':
        return <Film className="w-4 h-4 text-fuchsia-500" />
      case 'email_newsletter_visual':
        return <Mail className="w-4 h-4 text-sky-500" />
      case 'banner_linkedin_company':
        return <Building2 className="w-4 h-4 text-blue-600" />
      case 'meta_ad_square':
        return <BadgePercent className="w-4 h-4 text-emerald-600" />
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border border-purple-500/30 bg-background text-foreground shadow-2xl">
          {/* Header estilizado lilás/roxo */}
          <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 p-6 text-white relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Nova Campanha Multi-formato
                    </DialogTitle>
                    <Badge className="bg-white/20 hover:bg-white/20 text-white text-[10px] font-bold px-2 py-0 border-white/30 uppercase">
                      Multi-formato
                    </Badge>
                  </div>
                  <DialogDescription className="text-xs sm:text-sm text-purple-100 mt-0.5">
                    Gere 21 formatos integrados (Reels Cinematográfico, Depoimentos, Bastidores,
                    E-mail Visual, Banners B2B, Meta Ads, Display Google e mais) a partir de um
                    único briefing.
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Badge de Créditos Dinâmicos no cabeçalho */}
            <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/20 text-xs">
              <div className="flex items-center gap-1.5 text-purple-100">
                <Coins className="w-4 h-4 text-amber-300" />
                <span>
                  Estimativa total:{' '}
                  <strong className="text-white font-bold">{totalEstimatedCredits} créditos</strong>
                </span>
                <span className="opacity-75">
                  ({selectedFormats.length} {selectedFormats.length === 1 ? 'formato' : 'formatos'})
                </span>
              </div>
              <span className="text-[11px] text-purple-200">
                Posts salvos como rascunhos na biblioteca
              </span>
            </div>
          </div>

          {/* Corpo do Formulário */}
          <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
            {/* 1. Nome da Campanha & Organização/Marca */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="campaign-name-input"
                  className="text-xs font-bold text-foreground flex items-center gap-1"
                >
                  <span>Nome da Campanha *</span>
                </label>
                <Input
                  id="campaign-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Lançamento Verão 2025, Black Friday..."
                  className="h-10 text-xs rounded-xl bg-card border-border/80"
                  aria-required="true"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="campaign-brand-select"
                  className="text-xs font-bold text-foreground flex items-center gap-1"
                >
                  <Briefcase className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Marca / Organização</span>
                </label>
                <select
                  id="campaign-brand-select"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full h-10 text-xs bg-card border border-border/80 rounded-xl px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  {brands.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                  {brands.length === 0 && <option value="">Minha Marca Principal</option>}
                </select>
              </div>
            </div>

            {/* 2. Objetivo da Campanha */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">
                Objetivo Estratégico da Campanha
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'engajar',
                    label: 'Engajar',
                    sub: 'Comentários, salvamentos e viralização',
                    emoji: '❤️',
                  },
                  {
                    id: 'vender',
                    label: 'Vender',
                    sub: 'Oferta, conversão e chamadas diretas',
                    emoji: '🎯',
                  },
                  {
                    id: 'awareness',
                    label: 'Awareness',
                    sub: 'Autoridade e reconhecimento de marca',
                    emoji: '🌟',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setObjective(item.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                      objective === item.id
                        ? 'border-purple-600 bg-purple-500/10 dark:bg-purple-950/30 ring-2 ring-purple-600/30'
                        : 'border-border/80 bg-card hover:border-purple-400/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-base">{item.emoji}</span>
                      {objective === item.id && (
                        <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground line-clamp-2 leading-tight mt-0.5">
                        {item.sub}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Tom de Voz (7 tons nativos) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>🎙️ Tom de Voz da Campanha</span>
                </label>
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                  {CAMPAIGN_TONES.find((t) => t.id === tone)?.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {CAMPAIGN_TONES.map((t) => {
                  const active = tone === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                        active
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-card text-muted-foreground hover:text-foreground border border-border/80'
                      }`}
                    >
                      <span>{t.emoji}</span>
                      <span>{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 4. Briefing Único / Ideia Central */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="campaign-briefing-input"
                  className="text-xs font-bold text-foreground flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Briefing Único / Ideia Central *</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {briefing.length} caracteres (mín. 10)
                </span>
              </div>
              <Textarea
                id="campaign-briefing-input"
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                placeholder="Descreva o tema, a mensagem principal, diferenciais, dores do cliente ou novidade que essa campanha abordará em todas as redes..."
                className="min-h-[90px] text-xs resize-y bg-card border-border/80"
                aria-required="true"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                💡 A IA usará este briefing para criar a narrativa do Reels, a sequência do Story, a
                headline do Feed, os 5 slides do Carrossel e o anúncio do Flyer.
              </p>
            </div>

            {/* 5. Link / CTA Opcional */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label
                  htmlFor="campaign-url-input"
                  className="text-[11px] font-bold text-muted-foreground flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Link de Destino (Opcional)
                </label>
                <Input
                  id="campaign-url-input"
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://suamarca.com.br/oferta"
                  className="h-9 text-xs rounded-xl bg-card border-border/80"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="campaign-cta-input"
                  className="text-[11px] font-bold text-muted-foreground flex items-center gap-1"
                >
                  <span>CTA Personalizada (Opcional)</span>
                </label>
                <Input
                  id="campaign-cta-input"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="Ex: Clique no link da bio e garanta sua vaga!"
                  className="h-9 text-xs rounded-xl bg-card border-border/80"
                />
              </div>
            </div>

            {/* Sugestão de Pacote Inteligente 1-clique */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                  <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Pacote Recomendado para {objective.toUpperCase()}:</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {RECOMMENDED_PACKAGES[objective].name} — {RECOMMENDED_PACKAGES[objective].desc}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => applyRecommendedPackage(objective)}
                className="h-8 text-xs font-bold rounded-xl shrink-0 bg-purple-600 text-white hover:bg-purple-700 shadow-xs"
              >
                Aplicar Pacote
              </Button>
            </div>

            {/* 6. Seleção dos Formatos a Gerar (Checkboxes com Custo de Créditos) */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-foreground block">
                    Formatos a Gerar Nesta Campanha ({CAMPAIGN_FORMATS.length} disponíveis)
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Marque qualquer combinação. Cada formato gerará um rascunho completo calibrado.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedFormats(
                        selectedFormats.length === CAMPAIGN_FORMATS.length
                          ? []
                          : (CAMPAIGN_FORMATS.map((f) => f.id) as CampaignFormatId[]),
                      )
                    }
                    className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                  >
                    {selectedFormats.length === CAMPAIGN_FORMATS.length
                      ? 'Desmarcar todos'
                      : 'Marcar todos'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {CAMPAIGN_FORMATS.map((fmt) => {
                  const isChecked = selectedFormats.includes(fmt.id)
                  return (
                    <div
                      key={fmt.id}
                      onClick={() => toggleFormat(fmt.id)}
                      role="checkbox"
                      aria-checked={isChecked}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault()
                          toggleFormat(fmt.id)
                        }
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                        isChecked
                          ? 'border-purple-600 bg-purple-500/10 dark:bg-purple-950/20 shadow-xs'
                          : 'border-border/80 bg-card hover:border-purple-400/40 opacity-75'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'border-border bg-background'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 truncate">
                            {renderFormatIcon(fmt.id)}
                            <span className="text-xs font-bold text-foreground truncate">
                              {fmt.name}
                            </span>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-bold px-2 py-0 shrink-0 bg-purple-600/10 text-purple-700 dark:text-purple-300"
                          >
                            <Coins className="w-2.5 h-2.5 mr-1 text-amber-500" />
                            {fmt.credits} cr
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {fmt.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Alerta de Validação Inline */}
            {validationError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 px-6 bg-muted/40 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>{totalEstimatedCredits} créditos necessários</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!isValid || isGenerating}
                onClick={handleOpenConfirm}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 h-9 rounded-xl shadow-md gap-1.5 disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gerar Campanha</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Créditos & Progresso em Tempo Real */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(v) => {
          if (!isGenerating) setConfirmOpen(v)
        }}
      >
        <DialogContent className="max-w-md p-6 rounded-3xl bg-card border border-border shadow-2xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Confirmar Geração de Campanha
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Revise o resumo antes de consumir os créditos e gerar os rascunhos na biblioteca.
            </DialogDescription>
          </DialogHeader>

          {/* Resumo */}
          <div className="bg-muted/50 rounded-2xl p-4 space-y-2.5 text-xs border border-border/60 my-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Campanha:</span>
              <span className="font-bold text-foreground max-w-[200px] truncate">{name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Marca:</span>
              <span className="font-bold text-foreground">
                {activeBrandObj?.name || 'Sua Marca'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Objetivo:</span>
              <Badge variant="outline" className="text-[10px] capitalize font-bold">
                {objective}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Formatos ({selectedFormats.length}):</span>
              <span className="font-semibold text-foreground text-[11px]">
                {selectedFormats.join(', ')}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border font-bold text-sm">
              <span className="text-foreground">Total de créditos:</span>
              <span className="text-purple-600 dark:text-purple-400">
                {totalEstimatedCredits} créditos
              </span>
            </div>
          </div>

          {/* Lista de status por formato durante a geração */}
          {isGenerating && (
            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/40 rounded-2xl space-y-2">
              <p className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Gerando conteúdos com IA em paralelo...</span>
              </p>
              <div className="space-y-1.5">
                {selectedFormats.map((fId) => {
                  const status = formatStatusMap[fId] || 'pending'
                  const fConfig = CAMPAIGN_FORMATS.find((f) => f.id === fId)
                  return (
                    <div
                      key={fId}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-card border border-border/60"
                    >
                      <div className="flex items-center gap-2">
                        {renderFormatIcon(fId)}
                        <span className="font-semibold">{fConfig?.name || fId}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {status === 'generating' && (
                          <Badge className="bg-purple-600 text-white text-[9px] px-2 py-0 gap-1">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            Gerando
                          </Badge>
                        )}
                        {status === 'done' && (
                          <Badge className="bg-emerald-600 text-white text-[9px] px-2 py-0 gap-1">
                            <Check className="w-2.5 h-2.5" /> Pronto
                          </Badge>
                        )}
                        {status === 'error' && (
                          <Badge variant="destructive" className="text-[9px] px-2 py-0">
                            Erro
                          </Badge>
                        )}
                        {status === 'pending' && (
                          <span className="text-[10px] text-muted-foreground">Aguardando...</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isGenerating}
              onClick={() => setConfirmOpen(false)}
              className="rounded-xl text-xs"
            >
              Voltar e Editar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isGenerating}
              onClick={handleExecuteGeneration}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold gap-1.5 px-4"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Gerando Rascunhos...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Confirmar e Gerar</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
