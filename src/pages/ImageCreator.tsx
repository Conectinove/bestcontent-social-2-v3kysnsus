import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  MessageSquare,
  Instagram,
  Facebook,
  Linkedin,
  Info,
  Check,
  Upload,
  Hash,
  Loader2,
  CheckCircle2,
  Calendar,
  Image as ImageIcon,
  Images,
  X,
  Layers,
  Square,
  Smartphone,
  Heart,
  DollarSign,
  Tag,
  BookOpen,
  Link as LinkIcon,
  Lightbulb,
  Flame,
  GraduationCap,
  Users,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { InspirationLibraryModal, InspirationItem } from '@/components/InspirationLibraryModal'
import { WhatsAppIcon, TikTokIcon, YouTubeIcon } from './CreateHub'
import { useSocial } from '@/context/SocialContext'
import { useAuth } from '@/context/AuthContext'
import { createScheduledPost } from '@/services/scheduled_posts'
import { generateCaption, generateHashtags } from '@/services/ai'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { ImageBankModal } from '@/components/ImageBankModal'

export interface ImageFormatOption {
  id: string
  name: string
  dimensions: string
  width: number
  height: number
  aspectRatioLabel: string
  aspectRatioClass: string // e.g. aspect-[4/5], aspect-[9/16], aspect-square
  gradient: string
  mainNetwork: 'instagram' | 'facebook' | 'linkedin' | 'whatsapp' | 'tiktok' | 'youtube' | 'twitter'
  networks: (
    | 'instagram'
    | 'facebook'
    | 'linkedin'
    | 'whatsapp'
    | 'tiktok'
    | 'youtube'
    | 'twitter'
  )[]
  isTop?: boolean
  isCarousel?: boolean
  isStory?: boolean
  isBanner?: boolean
  disabled?: boolean
  description?: string
}

export const IMAGE_FORMATS: ImageFormatOption[] = [
  {
    id: 'post-portrait-ig',
    name: 'Post Portrait',
    dimensions: '1080 × 1350px',
    width: 1080,
    height: 1350,
    aspectRatioLabel: '4:5',
    aspectRatioClass: 'w-16 h-22 rounded-2xl',
    gradient: 'from-[#ec4899] via-[#d946ef] to-[#8b5cf6]', // pink-fuchsia-violet
    mainNetwork: 'instagram',
    networks: ['instagram', 'facebook', 'linkedin'],
    isTop: true,
    description: 'Formato vertical padrão que ocupa mais espaço no feed do Instagram.',
  },
  {
    id: 'carrossel-portrait-ig',
    name: 'Carrossel Portrait',
    dimensions: '1080 × 1350px',
    width: 1080,
    height: 1350,
    aspectRatioLabel: '4:5',
    aspectRatioClass: 'w-16 h-22 rounded-2xl',
    gradient: 'from-[#8b5cf6] via-[#a855f7] to-[#ec4899]', // violet-purple-pink
    mainNetwork: 'instagram',
    networks: ['instagram', 'facebook', 'linkedin'],
    isTop: true,
    isCarousel: true,
    description: 'Sequência de slides verticais para engajamento e storytelling.',
  },
  {
    id: 'stories-unico-ig',
    name: 'Stories Único',
    dimensions: '1080 × 1920px',
    width: 1080,
    height: 1920,
    aspectRatioLabel: '9:16',
    aspectRatioClass: 'w-13 h-24 rounded-2xl',
    gradient: 'from-[#8b5cf6] via-[#ec4899] to-[#f97316]', // purple-pink-orange
    mainNetwork: 'instagram',
    networks: ['instagram', 'facebook', 'whatsapp'],
    isTop: true,
    isStory: true,
    description: 'Tela inteira vertical para Stories e Status do WhatsApp.',
  },
  {
    id: 'stories-carrossel-ig',
    name: 'Stories Carrossel',
    dimensions: '1080 × 1920px',
    width: 1080,
    height: 1920,
    aspectRatioLabel: '9:16',
    aspectRatioClass: 'w-13 h-24 rounded-2xl',
    gradient: 'from-[#6366f1] via-[#a855f7] to-[#ec4899]', // indigo-purple-pink
    mainNetwork: 'instagram',
    networks: ['instagram', 'facebook', 'whatsapp'],
    isTop: true,
    isCarousel: true,
    isStory: true,
    description: 'Sequência de slides tela cheia para sequências no Stories.',
  },
  {
    id: 'post-portrait-fb',
    name: 'Post Portrait',
    dimensions: '1080 × 1350px',
    width: 1080,
    height: 1350,
    aspectRatioLabel: '4:5',
    aspectRatioClass: 'w-16 h-22 rounded-2xl',
    gradient: 'from-[#2563eb] via-[#3b82f6] to-[#06b6d4]', // blue-cyan
    mainNetwork: 'facebook',
    networks: ['instagram', 'facebook', 'linkedin'],
    isTop: true,
    description: 'Excelente performance visual para o feed do Facebook e LinkedIn.',
  },
  {
    id: 'post-quadrado',
    name: 'Post Quadrado',
    dimensions: '1080 × 1080px',
    width: 1080,
    height: 1080,
    aspectRatioLabel: '1:1',
    aspectRatioClass: 'w-18 h-18 rounded-2xl',
    gradient: 'from-[#3b82f6] via-[#8b5cf6] to-[#ec4899]',
    mainNetwork: 'instagram',
    networks: ['instagram', 'facebook', 'linkedin', 'whatsapp'],
    isTop: false,
    description: 'Formato clássico 1:1 com compatibilidade total em qualquer rede.',
  },
  {
    id: 'carrossel-quadrado',
    name: 'Carrossel Quadrado',
    dimensions: '1080 × 1080px',
    width: 1080,
    height: 1080,
    aspectRatioLabel: '1:1',
    aspectRatioClass: 'w-18 h-18 rounded-2xl',
    gradient: 'from-[#6366f1] via-[#8b5cf6] to-[#d946ef]',
    mainNetwork: 'instagram',
    networks: ['instagram', 'facebook', 'linkedin'],
    isTop: false,
    isCarousel: true,
    description: 'Carrossel em formato 1:1 tradicional.',
  },
  {
    id: 'banner-whatsapp',
    name: 'Banner Template WhatsApp',
    dimensions: '1125 × 600px',
    width: 1125,
    height: 600,
    aspectRatioLabel: '1.87:1',
    aspectRatioClass: 'w-24 h-13 rounded-2xl',
    gradient: 'from-[#059669] via-[#10b981] to-[#14b8a6]',
    mainNetwork: 'whatsapp',
    networks: ['whatsapp', 'facebook'],
    isTop: false,
    isBanner: true,
    description: 'Banner horizontal otimizado para envio e cards de WhatsApp.',
  },
  {
    id: 'thumbnail-youtube',
    name: 'Thumbnail',
    dimensions: '1280 × 720px',
    width: 1280,
    height: 720,
    aspectRatioLabel: '16:9',
    aspectRatioClass: 'w-24 h-14 rounded-2xl',
    gradient: 'from-[#ef4444] via-[#f97316] to-[#eab308]',
    mainNetwork: 'youtube',
    networks: ['youtube', 'facebook'],
    disabled: true,
    description: 'Thumbnail para vídeos horizontais do YouTube.',
  },
  {
    id: 'post-landscape',
    name: 'Post Landscape',
    dimensions: '1200 × 675px',
    width: 1200,
    height: 675,
    aspectRatioLabel: '16:9',
    aspectRatioClass: 'w-24 h-14 rounded-2xl',
    gradient: 'from-[#0284c7] via-[#06b6d4] to-[#10b981]',
    mainNetwork: 'twitter',
    networks: ['twitter', 'facebook', 'linkedin'],
    disabled: true,
    description: 'Formato horizontal panorâmico.',
  },
]

const TEMPLATES = [
  {
    id: 't1',
    title: 'Produto em Destaque',
    img: 'https://img.usecurling.com/p/400/400?q=product%20showcase&color=blue',
  },
  {
    id: 't2',
    title: 'Citação Inspiradora',
    img: 'https://img.usecurling.com/p/400/400?q=quote%20motivational&color=purple',
  },
  {
    id: 't3',
    title: 'Antes & Depois',
    img: 'https://img.usecurling.com/p/400/400?q=before%20after%20transformation&color=green',
  },
  {
    id: 't4',
    title: 'Promoção',
    img: 'https://img.usecurling.com/p/400/400?q=sale%20discount%20promotion&color=orange',
  },
]

export default function ImageCreator() {
  const navigate = useNavigate()
  const { brands, addPost } = useSocial()
  const { user } = useAuth()

  // Navigation step: 1 = Formato, 2 = Modo / Template, 3 = Criar / Revisar
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [selectedFormatId, setSelectedFormatId] = useState<string>('post-portrait-ig')
  const [activeFilter, setActiveFilter] = useState<string>('all')

  // Editor states (Step 2 & 3)
  const [template, setTemplate] = useState<string>('t1')
  const [creationMode, setCreationMode] = useState<'ai' | 'template' | 'upload'>('ai')

  // Step 2 new states based on the reference design:
  // Objective: 'engajar' | 'vender'
  const [objective, setObjective] = useState<'engajar' | 'vender'>('vender')
  // Approach (optional): 'oferta' | 'storytelling' | 'prova_social' | 'viral' | 'educativo' | 'comunidade' | ''
  const [approach, setApproach] = useState<string>('')
  const [showMoreApproaches, setShowMoreApproaches] = useState(false)
  // How to create: 'zero' | 'link' | 'inspiracoes'
  const [createMethod, setCreateMethod] = useState<'zero' | 'link' | 'inspiracoes'>('zero')
  // Link input (when createMethod === 'link')
  const [sourceUrl, setSourceUrl] = useState('')
  // Zero prompt (when createMethod === 'zero')
  const [promptIdea, setPromptIdea] = useState('')
  // Selected inspiration (when createMethod === 'inspiracoes')
  const [selectedInspiration, setSelectedInspiration] = useState<InspirationItem | null>(null)
  const [inspirationModalOpen, setInspirationModalOpen] = useState(false)

  const [media, setMedia] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  )
  const [aiLoading, setAiLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [imageBankOpen, setImageBankOpen] = useState(false)

  // Carousel ref for horizontal scrolling
  const carouselRef = useRef<HTMLDivElement>(null)

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Filter formats based on selected network chip
  const filteredFormats = IMAGE_FORMATS.filter((f) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'instagram') return f.networks.includes('instagram')
    if (activeFilter === 'facebook') return f.networks.includes('facebook')
    if (activeFilter === 'linkedin') return f.networks.includes('linkedin')
    if (activeFilter === 'whatsapp') return f.networks.includes('whatsapp')
    if (activeFilter === 'tiktok') return f.networks.includes('tiktok')
    if (activeFilter === 'youtube') return f.networks.includes('youtube')
    if (activeFilter === 'twitter') return f.networks.includes('twitter')
    return true
  })

  const selectedFormat = IMAGE_FORMATS.find((f) => f.id === selectedFormatId) || IMAGE_FORMATS[0]

  // Pre-fill caption/idea when moving to step 3 if empty
  const handleProceedToStep3 = () => {
    if (!caption) {
      if (createMethod === 'zero' && promptIdea) {
        setCaption(promptIdea)
      } else if (createMethod === 'link' && sourceUrl) {
        setCaption(`Conteúdo extraído do link: ${sourceUrl}`)
      } else if (createMethod === 'inspiracoes' && selectedInspiration) {
        setCaption(`${selectedInspiration.title} - ${selectedInspiration.description}`)
      }
    }
    setCurrentStep(3)
  }

  const approachesList = [
    {
      id: 'oferta',
      label: 'Oferta',
      icon: Tag,
      emoji: '🏷️',
      color: 'text-amber-500',
    },
    {
      id: 'storytelling',
      label: 'Storytelling',
      icon: BookOpen,
      emoji: '📖',
      color: 'text-blue-500',
    },
    {
      id: 'prova_social',
      label: 'Prova social',
      icon: CheckCircle2,
      emoji: '✅',
      color: 'text-emerald-500',
    },
    {
      id: 'viral',
      label: 'Viral',
      icon: Flame,
      emoji: '🔥',
      color: 'text-red-500',
    },
    {
      id: 'educativo',
      label: 'Educativo',
      icon: GraduationCap,
      emoji: '📚',
      color: 'text-indigo-500',
    },
    {
      id: 'comunidade',
      label: 'Comunidade',
      icon: Users,
      emoji: '💬',
      color: 'text-purple-500',
    },
  ]

  const canContinueFromStep2 = Boolean(
    objective &&
    (createMethod === 'zero' ? true : createMethod === 'link' ? sourceUrl.trim().length > 0 : true),
  )

  const aiGenerate = async (type: 'caption' | 'hashtags') => {
    setAiLoading(true)
    try {
      if (type === 'caption') {
        const r = await generateCaption(
          caption || `post ${selectedFormat.name} para redes sociais`,
          selectedFormat.mainNetwork,
        )
        setCaption((r as any).caption || '')
      } else {
        const r = await generateHashtags(caption || `post ${selectedFormat.name}`)
        setHashtags(((r as any).hashtags || []).join(' '))
      }
      toast({ title: 'IA aplicada!', description: 'Conteúdo gerado com sucesso.' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setAiLoading(false)
    }
  }

  const handleSelectBrandAsset = async (url: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const file = new File([blob], `brand-asset-${Date.now()}.png`, {
        type: blob.type || 'image/png',
      })
      setMedia(file)
      setImageBankOpen(false)
      toast({ title: 'Asset selecionado!', description: 'Imagem da marca aplicada.' })
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a imagem.',
        variant: 'destructive',
      })
    }
  }

  const handleSave = async (status: 'draft' | 'scheduled' | 'published') => {
    if (!brands[0]?.id) {
      toast({
        title: 'Marca necessária',
        description: 'Você precisa criar uma marca antes de salvar. Acesse Marcas para criar.',
      })
      return
    }
    setSubmitting(true)
    try {
      const fullCaption = `${caption}\n\n${hashtags}`.trim()
      const record = await addPost({
        brandId: brands[0].id,
        platform:
          selectedFormat.mainNetwork === 'instagram'
            ? 'Instagram'
            : selectedFormat.mainNetwork === 'facebook'
              ? 'Facebook'
              : selectedFormat.mainNetwork === 'linkedin'
                ? 'LinkedIn'
                : 'Instagram',
        content: caption || `Post ${selectedFormat.name}`,
        caption: fullCaption,
        status,
        media,
        scheduledDate: status === 'scheduled' ? new Date(scheduledDate).toISOString() : undefined,
      })
      if (status === 'scheduled' && record?.id) {
        await createScheduledPost({
          user: user?.id,
          post: record.id,
          scheduled_at: new Date(scheduledDate).toISOString(),
          status: 'pending',
        })
      }
      toast({
        title:
          status === 'published'
            ? 'Publicado!'
            : status === 'scheduled'
              ? 'Agendado!'
              : 'Rascunho salvo!',
      })
      navigate(status === 'scheduled' ? '/app/calendar' : '/app/feed')
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const mediaUrl = media
    ? URL.createObjectURL(media)
    : 'https://img.usecurling.com/p/600/600?q=social%20media%20minimal&color=purple'

  const renderNetworkMiniIcon = (
    network: 'instagram' | 'facebook' | 'linkedin' | 'whatsapp' | 'tiktok' | 'youtube' | 'twitter',
    className = 'w-3 h-3',
  ) => {
    switch (network) {
      case 'instagram':
        return <Instagram className={className} />
      case 'facebook':
        return <Facebook className={className} />
      case 'linkedin':
        return <Linkedin className={className} />
      case 'whatsapp':
        return <WhatsAppIcon className={className} />
      case 'tiktok':
        return <TikTokIcon className={className} />
      case 'youtube':
        return <YouTubeIcon className={className} />
      default:
        return <div className={`${className} rounded-full border border-current`} />
    }
  }

  return (
    <div className="min-h-full flex flex-col justify-between max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4 animate-fade-in relative bg-[#f8f8fa] dark:bg-background">
      {/* 1. Barra Superior de Contexto (Pill Arredondada Cinza Clara Centrada) */}
      <div className="flex items-center justify-center mb-5">
        <div className="inline-flex items-center gap-3 bg-[#f1f3f5] dark:bg-card border border-slate-200/90 dark:border-border/80 rounded-full px-5 py-2 shadow-2xs text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-foreground">
            <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
            <span>
              Modo <strong className="font-bold text-slate-900 dark:text-white">Estática</strong>
            </span>
          </div>
          <span className="text-slate-400">·</span>
          <div className="flex items-center gap-1 text-slate-600 dark:text-muted-foreground">
            <span className="select-none">🪙</span>
            <span className="font-medium">10 cr/slide</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/criar')}
            className="text-xs font-semibold text-slate-600 dark:text-foreground hover:text-[#7c3aed] ml-3 cursor-pointer transition-colors"
          >
            Trocar
          </button>
        </div>
      </div>

      {/* 2. Stepper Horizontal Centrado ● Formato —— ● Modo —— ○ Criar */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs font-medium text-slate-500 mb-8 select-none">
        {/* Formato */}
        <div
          onClick={() => setCurrentStep(1)}
          className={`flex items-center gap-2 cursor-pointer transition-colors ${
            currentStep === 1
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-700 dark:text-slate-300 font-medium'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              currentStep === 1
                ? 'bg-slate-900 dark:bg-white ring-4 ring-slate-400/20'
                : 'bg-slate-700 dark:bg-slate-300'
            }`}
          />
          <span>Formato</span>
        </div>

        {/* Linha separadora */}
        <div className="w-8 sm:w-12 h-[1px] bg-slate-300 dark:bg-slate-700" />

        {/* Modo */}
        <div
          onClick={() => selectedFormat && setCurrentStep(2)}
          className={`flex items-center gap-2 cursor-pointer transition-colors ${
            currentStep === 2
              ? 'text-slate-900 dark:text-white font-extrabold'
              : currentStep > 2
                ? 'text-slate-700 dark:text-slate-300 font-medium'
                : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              currentStep === 2
                ? 'bg-slate-900 dark:bg-white ring-4 ring-slate-400/20'
                : currentStep > 2
                  ? 'bg-slate-700 dark:bg-slate-300'
                  : 'bg-slate-300 dark:bg-slate-700'
            }`}
          />
          <span className={currentStep === 2 ? 'font-bold text-slate-900 dark:text-white' : ''}>
            Modo
          </span>
        </div>

        {/* Linha separadora */}
        <div className="w-8 sm:w-12 h-[1px] bg-slate-300 dark:bg-slate-700" />

        {/* Criar */}
        <div
          onClick={() => selectedFormat && canContinueFromStep2 && handleProceedToStep3()}
          className={`flex items-center gap-2 cursor-pointer transition-colors ${
            currentStep === 3
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              currentStep === 3
                ? 'bg-slate-900 dark:bg-white ring-4 ring-slate-400/20'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          />
          <span>Criar</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ETAPA 1: ESCOLHA DO FORMATO DA IMAGEM                          */}
      {/* ============================================================== */}
      {currentStep === 1 && (
        <div className="flex flex-col flex-1 animate-fade-in space-y-6">
          {/* Título & Subtítulo */}
          <div className="text-center space-y-1.5 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">
                Escolha o Formato da Imagem
              </h1>
              <div className="flex items-center gap-1 text-muted-foreground">
                <button
                  type="button"
                  title="Ajuda sobre proporções e formatos de imagem"
                  onClick={() =>
                    toast({
                      title: 'Guia de Proporções',
                      description:
                        'Formatos 4:5 (Portrait) ocupam até 25% mais espaço na tela do usuário comparados ao 1:1, gerando maior retenção.',
                    })
                  }
                  className="hover:text-foreground transition-colors p-1"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Enviar feedback sobre formatos"
                  onClick={() =>
                    toast({
                      title: 'Feedback',
                      description: 'Sugira novos formatos na aba de comunidade!',
                    })
                  }
                  className="hover:text-foreground transition-colors p-1"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Você está no modo Estática. Agora escolha o formato da arte que será criada do zero
              pela IA.
            </p>
          </div>

          {/* Chips de Filtro em Linha */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar justify-start sm:justify-center">
            {/* Todas */}
            <button
              onClick={() => setActiveFilter('all')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                activeFilter === 'all'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
                <div className="bg-current rounded-[0.5px]" />
                <div className="bg-current rounded-[0.5px]" />
                <div className="bg-current rounded-[0.5px]" />
                <div className="bg-current rounded-[0.5px]" />
              </div>
              <span>Todas</span>
            </button>

            {/* Instagram */}
            <button
              onClick={() => setActiveFilter('instagram')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                activeFilter === 'instagram'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Instagram</span>
            </button>

            {/* Facebook */}
            <button
              onClick={() => setActiveFilter('facebook')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                activeFilter === 'facebook'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Facebook className="w-3.5 h-3.5" />
              <span>Facebook</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={() => setActiveFilter('linkedin')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                activeFilter === 'linkedin'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Linkedin className="w-3.5 h-3.5" />
              <span>LinkedIn</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => setActiveFilter('whatsapp')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                activeFilter === 'whatsapp'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* TikTok - Em breve */}
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground/60 bg-muted/40 cursor-not-allowed shrink-0"
            >
              <TikTokIcon className="w-3.5 h-3.5 opacity-60" />
              <span>TikTok</span>
              <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded text-muted-foreground">
                Em breve
              </span>
            </button>

            {/* YouTube - Em breve */}
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground/60 bg-muted/40 cursor-not-allowed shrink-0"
            >
              <YouTubeIcon className="w-3.5 h-3.5 opacity-60" />
              <span>YouTube</span>
              <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded text-muted-foreground">
                Em breve
              </span>
            </button>

            {/* Twitter/X - Em breve */}
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground/60 bg-muted/40 cursor-not-allowed shrink-0"
            >
              <svg className="w-3 h-3 opacity-60 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Twitter/X</span>
              <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded text-muted-foreground">
                Em breve
              </span>
            </button>
          </div>

          {/* Carrossel Horizontal de Cards de Formato */}
          <div className="relative py-4 px-1 group/carousel">
            {/* Botão Seta Anterior (Esquerda) */}
            <button
              onClick={() => scrollCarousel('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white dark:bg-card shadow-lg border border-border flex items-center justify-center text-foreground hover:bg-muted transition-all opacity-80 hover:opacity-100 disabled:opacity-30"
              aria-label="Formato anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Container com scroll horizontal snap */}
            <div
              ref={carouselRef}
              className="flex items-center gap-5 overflow-x-auto py-2 px-10 scroll-smooth snap-x snap-mandatory no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {filteredFormats.map((fmt) => {
                const isSelected = selectedFormatId === fmt.id
                return (
                  <div
                    key={fmt.id}
                    onClick={() => {
                      if (!fmt.disabled) {
                        setSelectedFormatId(fmt.id)
                      }
                    }}
                    className={`relative shrink-0 w-64 h-88 rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 snap-center select-none ${
                      fmt.disabled
                        ? 'opacity-50 cursor-not-allowed bg-muted'
                        : 'cursor-pointer hover:scale-[1.02] hover:shadow-2xl'
                    } ${
                      isSelected
                        ? 'ring-4 ring-primary ring-offset-4 ring-offset-background shadow-2xl scale-[1.02]'
                        : 'shadow-lg'
                    } bg-gradient-to-b ${fmt.gradient}`}
                  >
                    {/* Top Row: Network Icon + Badge TOP or Carousel */}
                    <div className="flex items-center justify-between text-white">
                      <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                        {renderNetworkMiniIcon(fmt.mainNetwork, 'w-4 h-4 text-white')}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {fmt.isTop && (
                          <div className="bg-white/95 text-slate-900 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                            <span className="text-amber-500">⚡</span> TOP
                          </div>
                        )}
                        {fmt.isCarousel && (
                          <div
                            className="w-6 h-6 rounded-md bg-white/20 backdrop-blur-md flex items-center justify-center text-white"
                            title="Carrossel"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {fmt.isStory && (
                          <div
                            className="w-6 h-6 rounded-md bg-white/20 backdrop-blur-md flex items-center justify-center text-white"
                            title="Story"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {!fmt.isCarousel && !fmt.isStory && !fmt.isBanner && (
                          <div className="w-6 h-6 rounded-md bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                            <Square className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Center: Retângulo Arredondado Translúcido Proporção */}
                    <div className="flex items-center justify-center my-auto">
                      <div
                        className={`${fmt.aspectRatioClass} border-2 border-white/70 bg-white/15 backdrop-blur-xs shadow-inner flex items-center justify-center relative transition-transform duration-300`}
                      >
                        {isSelected && (
                          <div className="w-7 h-7 rounded-full bg-white text-primary flex items-center justify-center shadow-md">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Info, Dimensões e Redes Compatíveis */}
                    <div className="text-white space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-base leading-snug tracking-tight drop-shadow-xs">
                          {fmt.name}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toast({
                              title: fmt.name,
                              description: `${fmt.dimensions} · ${fmt.description}`,
                            })
                          }}
                          className="opacity-70 hover:opacity-100 transition-opacity"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs text-white/80">
                        <span className="font-mono text-[11px] font-medium tracking-tight">
                          {fmt.dimensions}
                        </span>
                        <div className="flex items-center gap-1 opacity-90">
                          {fmt.networks.map((net) => (
                            <span key={net} className="text-white">
                              {renderNetworkMiniIcon(net, 'w-3 h-3')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Botão Seta Próximo (Direita) */}
            <button
              onClick={() => scrollCarousel('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white dark:bg-card shadow-lg border border-border flex items-center justify-center text-foreground hover:bg-muted transition-all opacity-80 hover:opacity-100"
              aria-label="Próximo formato"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ETAPA 2: ESCOLHA DO MODO (Defina o Conteúdo da Imagem)          */}
      {/* ============================================================== */}
      {currentStep === 2 && (
        <div className="flex flex-col flex-1 animate-fade-in space-y-7 max-w-5xl mx-auto w-full pb-4">
          {/* Título H1 bold centrado + Ícones Ajuda/Feedback */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                Defina o Conteúdo da Imagem
              </h1>
              <div className="flex items-center gap-1 text-muted-foreground">
                <button
                  type="button"
                  title="Ajuda sobre a definição de conteúdo"
                  onClick={() =>
                    toast({
                      title: 'Como funciona?',
                      description:
                        'A IA utiliza o objetivo e a abordagem selecionados para calibrar o tom, hierarquia visual e chamada para ação (CTA) do post.',
                    })
                  }
                  className="hover:text-foreground transition-colors p-1"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Enviar feedback sobre a geração"
                  onClick={() =>
                    toast({
                      title: 'Feedback',
                      description: 'Compartilhe suas sugestões conosco na Comunidade!',
                    })
                  }
                  className="hover:text-foreground transition-colors p-1"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Subtítulo centrado cinza */}
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Esse conteúdo será expandido em um prompt visual para gerar a arte completa com IA.
            </p>
          </div>

          {/* SEÇÃO 1: Qual o objetivo deste post? */}
          <div className="space-y-3">
            <label className="text-xs sm:text-sm font-semibold text-muted-foreground block text-left">
              Qual o objetivo deste post?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card Engajar */}
              <div
                onClick={() => setObjective('engajar')}
                className={`bg-white dark:bg-card rounded-[22px] p-6 sm:p-7 border transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md ${
                  objective === 'engajar'
                    ? 'border-[#8b5cf6] border-2 ring-4 ring-[#8b5cf6]/10 shadow-sm'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-muted flex items-center justify-center text-slate-600 dark:text-muted-foreground mb-4">
                    <Heart className="w-5 h-5 text-slate-600 dark:text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Engajar</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Aumentar interação e comunidade
                  </p>
                </div>
              </div>

              {/* Card Vender */}
              <div
                onClick={() => setObjective('vender')}
                className={`bg-white dark:bg-card rounded-[22px] p-6 sm:p-7 border transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md ${
                  objective === 'vender'
                    ? 'border-[#8b5cf6] border-2 ring-4 ring-[#8b5cf6]/10 shadow-sm'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-muted flex items-center justify-center text-slate-600 dark:text-muted-foreground mb-4">
                    <DollarSign className="w-5 h-5 text-slate-600 dark:text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Vender</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Converter seguidores em clientes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: Abordagem (opcional) */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-muted-foreground">
                  Abordagem <span className="font-normal">(opcional)</span>
                </label>
                {approach && (
                  <button
                    type="button"
                    onClick={() => setApproach('')}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium underline"
                  >
                    Limpar seleção
                  </button>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-0.5">
                Define a estratégia do conteúdo interno das artes (textos, layout, tom)
              </p>
            </div>

            {/* Linha de chips brancos arredondados */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-stretch">
              {/* Card 1: Oferta */}
              <div
                onClick={() => setApproach(approach === 'oferta' ? '' : 'oferta')}
                className={`bg-white dark:bg-card rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm min-h-[82px] ${
                  approach === 'oferta'
                    ? 'border-[#8b5cf6] border-2 ring-2 ring-[#8b5cf6]/20 bg-purple-50/30 dark:bg-purple-950/20'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <span className="text-xl mb-1 select-none">🏷️</span>
                <span className="text-xs font-bold text-foreground">Oferta</span>
              </div>

              {/* Card 2: Storytelling */}
              <div
                onClick={() => setApproach(approach === 'storytelling' ? '' : 'storytelling')}
                className={`bg-white dark:bg-card rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm min-h-[82px] ${
                  approach === 'storytelling'
                    ? 'border-[#8b5cf6] border-2 ring-2 ring-[#8b5cf6]/20 bg-purple-50/30 dark:bg-purple-950/20'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <span className="text-xl mb-1 select-none">📖</span>
                <span className="text-xs font-bold text-foreground">Storytelling</span>
              </div>

              {/* Card 3: Prova social */}
              <div
                onClick={() => setApproach(approach === 'prova_social' ? '' : 'prova_social')}
                className={`bg-white dark:bg-card rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm min-h-[82px] ${
                  approach === 'prova_social'
                    ? 'border-[#8b5cf6] border-2 ring-2 ring-[#8b5cf6]/20 bg-purple-50/30 dark:bg-purple-950/20'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <span className="text-xl mb-1 select-none">✅</span>
                <span className="text-xs font-bold text-foreground">Prova social</span>
              </div>

              {/* Card 4: Ver mais (ou toggle de expansão) */}
              <div
                onClick={() => setShowMoreApproaches((prev) => !prev)}
                className={`bg-white dark:bg-card rounded-2xl p-3.5 sm:p-4 border border-border/80 hover:border-border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm min-h-[82px] ${
                  showMoreApproaches
                    ? 'border-[#8b5cf6]/70 bg-purple-50/20 text-[#8b5cf6]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="text-base font-bold tracking-widest mb-1 text-slate-500">···</span>
                <span className="text-xs font-semibold flex items-center gap-1">
                  Ver mais{' '}
                  {showMoreApproaches ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </span>
              </div>
            </div>

            {/* Expansão com mais abordagens: Viral, Educativo, Comunidade */}
            {showMoreApproaches && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 animate-fade-in">
                {/* Viral */}
                <div
                  onClick={() => setApproach(approach === 'viral' ? '' : 'viral')}
                  className={`bg-white dark:bg-card rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm min-h-[82px] ${
                    approach === 'viral'
                      ? 'border-[#8b5cf6] border-2 ring-2 ring-[#8b5cf6]/20 bg-purple-50/30 dark:bg-purple-950/20'
                      : 'border-border/80 hover:border-border'
                  }`}
                >
                  <span className="text-xl mb-1 select-none">🔥</span>
                  <span className="text-xs font-bold text-foreground">Viral</span>
                </div>

                {/* Educativo */}
                <div
                  onClick={() => setApproach(approach === 'educativo' ? '' : 'educativo')}
                  className={`bg-white dark:bg-card rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm min-h-[82px] ${
                    approach === 'educativo'
                      ? 'border-[#8b5cf6] border-2 ring-2 ring-[#8b5cf6]/20 bg-purple-50/30 dark:bg-purple-950/20'
                      : 'border-border/80 hover:border-border'
                  }`}
                >
                  <span className="text-xl mb-1 select-none">📚</span>
                  <span className="text-xs font-bold text-foreground">Educativo</span>
                </div>

                {/* Comunidade */}
                <div
                  onClick={() => setApproach(approach === 'comunidade' ? '' : 'comunidade')}
                  className={`bg-white dark:bg-card rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm min-h-[82px] ${
                    approach === 'comunidade'
                      ? 'border-[#8b5cf6] border-2 ring-2 ring-[#8b5cf6]/20 bg-purple-50/30 dark:bg-purple-950/20'
                      : 'border-border/80 hover:border-border'
                  }`}
                >
                  <span className="text-xl mb-1 select-none">💬</span>
                  <span className="text-xs font-bold text-foreground">Comunidade</span>
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 3: Como você quer criar? */}
          <div className="space-y-3">
            <label className="text-xs sm:text-sm font-semibold text-muted-foreground block text-left">
              Como você quer criar?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Criar do Zero */}
              <div
                onClick={() => setCreateMethod('zero')}
                className={`bg-white dark:bg-card rounded-[22px] p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md ${
                  createMethod === 'zero'
                    ? 'border-[#8b5cf6] border-2 ring-4 ring-[#8b5cf6]/10 shadow-sm'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-muted flex items-center justify-center text-slate-600 dark:text-muted-foreground mb-4">
                    <Sparkles className="w-5 h-5 text-slate-600 dark:text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Criar do Zero</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Descreva sua ideia e deixe a IA criar todo o conteúdo
                  </p>
                </div>
              </div>

              {/* A partir de Link */}
              <div
                onClick={() => setCreateMethod('link')}
                className={`bg-white dark:bg-card rounded-[22px] p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md ${
                  createMethod === 'link'
                    ? 'border-[#8b5cf6] border-2 ring-4 ring-[#8b5cf6]/10 shadow-sm'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-muted flex items-center justify-center text-slate-600 dark:text-muted-foreground mb-4">
                    <LinkIcon className="w-5 h-5 text-slate-600 dark:text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">A partir de Link</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Cole um link e a IA extrai e adapta o conteúdo
                  </p>
                </div>
              </div>

              {/* Inspirações */}
              <div
                onClick={() => setCreateMethod('inspiracoes')}
                className={`bg-white dark:bg-card rounded-[22px] p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md ${
                  createMethod === 'inspiracoes'
                    ? 'border-[#8b5cf6] border-2 ring-4 ring-[#8b5cf6]/10 shadow-sm'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-muted flex items-center justify-center text-slate-600 dark:text-muted-foreground mb-4">
                    <Lightbulb className="w-5 h-5 text-slate-600 dark:text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Inspirações</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Escolha de uma biblioteca de ideias prontas
                  </p>
                </div>
              </div>
            </div>

            {/* Detalhes interativos de acordo com o modo escolhido */}
            {createMethod === 'zero' && (
              <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2 mt-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Descreva sua ideia para o post (opcional neste passo)</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Você poderá refinar no próximo passo
                  </span>
                </div>
                <Textarea
                  value={promptIdea}
                  onChange={(e) => setPromptIdea(e.target.value)}
                  placeholder="Ex.: Anúncio de promoção relâmpago de 30% em cursos de tecnologia para o final de semana..."
                  className="min-h-[80px] text-xs resize-y bg-background"
                />
              </div>
            )}

            {createMethod === 'link' && (
              <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2 mt-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-primary" />
                    <span>Cole o link do artigo, notícia ou produto</span>
                  </label>
                  <Badge variant="outline" className="text-[10px]">
                    URL
                  </Badge>
                </div>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://exemplo.com.br/artigo-ou-produto"
                  className="w-full text-xs bg-background border border-border rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-[11px] text-muted-foreground">
                  A IA lerá o conteúdo da página e sintetizará os pontos principais para a arte e a
                  legenda.
                </p>
              </div>
            )}

            {createMethod === 'inspiracoes' && (
              <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 mt-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>Biblioteca de Inspirações Selecionada</span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {selectedInspiration
                        ? `Inspiração: "${selectedInspiration.title}"`
                        : 'Abra a biblioteca e escolha uma referência comprovada.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setInspirationModalOpen(true)}
                    className="text-xs font-semibold gap-1.5"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    {selectedInspiration ? 'Trocar Inspiração' : 'Explorar Ideias'}
                  </Button>
                </div>

                {selectedInspiration && (
                  <div className="bg-muted/40 rounded-xl p-3 flex items-center gap-3">
                    {selectedInspiration.imageUrl && (
                      <img
                        src={selectedInspiration.imageUrl}
                        alt={selectedInspiration.title}
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">
                        {selectedInspiration.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {selectedInspiration.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ETAPA 3: CRIAR / EDITAR LEGENDA & SALVAR                       */}
      {/* ============================================================== */}
      {currentStep === 3 && (
        <div className="flex flex-col flex-1 animate-fade-in space-y-6 max-w-4xl mx-auto w-full">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              Finalizar e Publicar
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Revise o formato, gere legendas com IA e agende sua publicação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Visual Preview */}
            <div className="bg-card border border-border rounded-3xl p-5 shadow-xs flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-3 text-xs text-muted-foreground">
                <Badge variant="outline" className="font-semibold">
                  {selectedFormat.name}
                </Badge>
                <span className="font-mono text-[11px]">{selectedFormat.dimensions}</span>
              </div>

              {/* Informações da Etapa 2 configurada */}
              <div className="w-full flex items-center gap-2 mb-3 flex-wrap">
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-0 text-[10px] font-bold">
                  {objective === 'vender' ? '🎯 Vender' : '❤️ Engajar'}
                </Badge>
                {approach && (
                  <Badge variant="outline" className="text-[10px] font-medium capitalize">
                    {approach.replace('_', ' ')}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-[10px]">
                  {createMethod === 'zero'
                    ? '✨ Do Zero'
                    : createMethod === 'link'
                      ? '🔗 Via Link'
                      : '💡 Inspiração'}
                </Badge>
              </div>

              <div
                className={`w-full max-w-[280px] aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border border-border relative flex items-center justify-center bg-gradient-to-b ${selectedFormat.gradient}`}
              >
                {media ? (
                  <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="p-6 text-center text-white space-y-2">
                    <Sparkles className="w-8 h-8 mx-auto opacity-80" />
                    <p className="text-sm font-bold">{selectedFormat.name}</p>
                    <p className="text-xs opacity-80">Pronto para ser gerado pela IA</p>
                  </div>
                )}
              </div>
            </div>

            {/* Inputs de Copy */}
            <div className="space-y-4">
              <Card className="p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold">Legenda do Post</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => aiGenerate('caption')}
                      disabled={aiLoading}
                      className="text-xs text-primary h-7 gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Gerar com IA'}
                    </Button>
                  </div>
                  <Textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Escreva a mensagem ou tema do post..."
                    className="h-28 text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold">Hashtags</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => aiGenerate('hashtags')}
                      disabled={aiLoading}
                      className="text-xs text-primary h-7 gap-1"
                    >
                      <Hash className="w-3.5 h-3.5" />
                      {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sugerir'}
                    </Button>
                  </div>
                  <Textarea
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="#marketing #conteudo #redessociais..."
                    className="h-16 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Agendar para</label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full text-xs bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
              </Card>

              {/* Botões de Ação Final */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave('draft')}
                  disabled={submitting}
                  className="text-xs"
                >
                  Salvar Rascunho
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSave('scheduled')}
                  disabled={submitting}
                  className="text-xs gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" /> {submitting ? 'Agendando...' : 'Agendar'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSave('published')}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Publicar Agora
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. Rodapé Fixo de Navegação                                     */}
      {/* ============================================================== */}
      <div className="border-t border-border/80 pt-4 mt-6 flex items-center justify-between gap-4">
        {/* Esquerda: Indicador de Créditos (Pill) */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-xs font-medium text-muted-foreground">
          <span>🪙</span>
          <span>1 slide → 10 créditos</span>
        </div>

        {/* Direita: Botão Voltar + Botão Continuar */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (currentStep === 1) {
                navigate('/app/criar')
              } else {
                setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)
              }
            }}
            className="text-xs font-semibold border-border text-foreground hover:bg-muted gap-1 px-4 h-9 rounded-xl"
          >
            ← Voltar
          </Button>

          {currentStep === 1 && (
            <Button
              size="sm"
              disabled={!selectedFormatId}
              onClick={() => setCurrentStep(2)}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs px-5 h-9 rounded-xl shadow-md gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <span>Continuar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}

          {currentStep === 2 && (
            <Button
              size="sm"
              disabled={!canContinueFromStep2}
              onClick={handleProceedToStep3}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs px-5 h-9 rounded-xl shadow-md gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <span>Continuar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}

          {currentStep === 3 && (
            <Button
              size="sm"
              onClick={() => handleSave('published')}
              disabled={submitting}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs px-5 h-9 rounded-xl shadow-md gap-1.5 cursor-pointer"
            >
              <span>Concluir</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      <ImageBankModal
        open={imageBankOpen}
        onOpenChange={setImageBankOpen}
        onSelect={handleSelectBrandAsset}
      />

      <InspirationLibraryModal
        open={inspirationModalOpen}
        onOpenChange={setInspirationModalOpen}
        onSelectInspiration={(item) => {
          setSelectedInspiration(item)
          if (!caption) {
            setCaption(`${item.title} - ${item.description}`)
          }
          toast({
            title: 'Inspiração Selecionada!',
            description: `"${item.title}" foi configurada para o conteúdo.`,
          })
        }}
      />
    </div>
  )
}
