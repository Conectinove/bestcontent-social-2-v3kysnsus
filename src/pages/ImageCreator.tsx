import React, { useState, useRef, useEffect } from 'react'
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
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertCircle,
  Eye,
  Coins,
  ShieldAlert,
  Palette,
  Wand2,
} from 'lucide-react'
import { InspirationLibraryModal, InspirationItem } from '@/components/InspirationLibraryModal'
import { WhatsAppIcon, TikTokIcon, YouTubeIcon } from './CreateHub'
import { NetworkHashtagGenerator } from '@/components/NetworkHashtagGenerator'
import { useSocial } from '@/context/SocialContext'
import { useAuth } from '@/context/AuthContext'
import { createScheduledPost } from '@/services/scheduled_posts'
import { generateCaption, generateHashtags } from '@/services/ai'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { ImageBankModal } from '@/components/ImageBankModal'

export interface ImageFormatOption {
  id: string
  name: string
  dimensions: string
  width: number
  height: number
  aspectRatioLabel: string
  aspectRatioClass: string // visual thumbnail representation
  previewAspectRatio: string // CSS aspect ratio string for actual preview (e.g. '4/5', '9/16', '1/1', '16/9', '1.87/1')
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
  defaultSlides?: number
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
    previewAspectRatio: '4/5',
    gradient: 'from-[#ec4899] via-[#d946ef] to-[#8b5cf6]', // pink-fuchsia-violet
    mainNetwork: 'instagram',
    networks: ['instagram', 'facebook', 'linkedin'],
    isTop: true,
    description: 'Formato vertical padrão que ocupa até 25% mais tela no feed do Instagram.',
    defaultSlides: 1,
  },
  {
    id: 'carrossel-portrait-ig',
    name: 'Carrossel Portrait',
    dimensions: '1080 × 1350px',
    width: 1080,
    height: 1350,
    aspectRatioLabel: '4:5',
    aspectRatioClass: 'w-16 h-22 rounded-2xl',
    previewAspectRatio: '4/5',
    gradient: 'from-[#8b5cf6] via-[#a855f7] to-[#ec4899]', // violet-purple-pink
    mainNetwork: 'instagram',
    networks: ['instagram', 'facebook', 'linkedin'],
    isTop: true,
    isCarousel: true,
    description: 'Sequência de slides verticais para engajamento profundo e storytelling.',
    defaultSlides: 4,
  },
  {
    id: 'stories-unico-ig',
    name: 'Stories Único',
    dimensions: '1080 × 1920px',
    width: 1080,
    height: 1920,
    aspectRatioLabel: '9:16',
    aspectRatioClass: 'w-13 h-24 rounded-2xl',
    previewAspectRatio: '9/16',
    gradient: 'from-[#8b5cf6] via-[#ec4899] to-[#f97316]', // purple-pink-orange
    mainNetwork: 'instagram',
    networks: ['instagram', 'facebook', 'whatsapp'],
    isTop: true,
    isStory: true,
    description: 'Tela inteira vertical para Stories e Status do WhatsApp.',
    defaultSlides: 1,
  },
  {
    id: 'stories-carrossel-ig',
    name: 'Stories Carrossel',
    dimensions: '1080 × 1920px',
    width: 1080,
    height: 1920,
    aspectRatioLabel: '9:16',
    aspectRatioClass: 'w-13 h-24 rounded-2xl',
    previewAspectRatio: '9/16',
    gradient: 'from-[#6366f1] via-[#a855f7] to-[#ec4899]', // indigo-purple-pink
    mainNetwork: 'instagram',
    networks: ['instagram', 'facebook', 'whatsapp'],
    isTop: true,
    isCarousel: true,
    isStory: true,
    description: 'Sequência de slides tela cheia para sequências no Stories.',
    defaultSlides: 3,
  },
  {
    id: 'reels-capa-ig',
    name: 'Capa de Reels / TikTok',
    dimensions: '1080 × 1920px',
    width: 1080,
    height: 1920,
    aspectRatioLabel: '9:16',
    aspectRatioClass: 'w-13 h-24 rounded-2xl',
    previewAspectRatio: '9/16',
    gradient: 'from-[#000000] via-[#1e1b4b] to-[#ec4899]',
    mainNetwork: 'tiktok',
    networks: ['tiktok', 'instagram', 'youtube'],
    isTop: true,
    description: 'Capa vertical com visual de impacto e área central segura para grade do perfil.',
    defaultSlides: 1,
  },
  {
    id: 'post-portrait-fb',
    name: 'Post Portrait Facebook',
    dimensions: '1080 × 1350px',
    width: 1080,
    height: 1350,
    aspectRatioLabel: '4:5',
    aspectRatioClass: 'w-16 h-22 rounded-2xl',
    previewAspectRatio: '4/5',
    gradient: 'from-[#2563eb] via-[#3b82f6] to-[#06b6d4]', // blue-cyan
    mainNetwork: 'facebook',
    networks: ['facebook', 'instagram', 'linkedin'],
    isTop: true,
    description: 'Excelente performance visual para o feed do Facebook e LinkedIn.',
    defaultSlides: 1,
  },
  {
    id: 'post-quadrado',
    name: 'Post Quadrado',
    dimensions: '1080 × 1080px',
    width: 1080,
    height: 1080,
    aspectRatioLabel: '1:1',
    aspectRatioClass: 'w-18 h-18 rounded-2xl',
    previewAspectRatio: '1/1',
    gradient: 'from-[#3b82f6] via-[#8b5cf6] to-[#ec4899]',
    mainNetwork: 'instagram',
    networks: ['instagram', 'facebook', 'linkedin', 'whatsapp'],
    isTop: false,
    description: 'Formato clássico 1:1 com compatibilidade total em qualquer rede.',
    defaultSlides: 1,
  },
  {
    id: 'carrossel-quadrado',
    name: 'Carrossel Quadrado',
    dimensions: '1080 × 1080px',
    width: 1080,
    height: 1080,
    aspectRatioLabel: '1:1',
    aspectRatioClass: 'w-18 h-18 rounded-2xl',
    previewAspectRatio: '1/1',
    gradient: 'from-[#6366f1] via-[#8b5cf6] to-[#d946ef]',
    mainNetwork: 'instagram',
    networks: ['instagram', 'facebook', 'linkedin'],
    isTop: false,
    isCarousel: true,
    description: 'Carrossel em formato 1:1 tradicional.',
    defaultSlides: 4,
  },
  {
    id: 'carrossel-landscape',
    name: 'Carrossel Landscape',
    dimensions: '1080 × 608px',
    width: 1080,
    height: 608,
    aspectRatioLabel: '16:9',
    aspectRatioClass: 'w-24 h-13 rounded-2xl',
    previewAspectRatio: '1.77/1',
    gradient: 'from-[#3b82f6] via-[#0284c7] to-[#06b6d4]',
    mainNetwork: 'linkedin',
    networks: ['linkedin', 'facebook', 'twitter'],
    isTop: false,
    isCarousel: true,
    description: 'Carrossel panorâmico moderno para infográficos e dados técnicos corporativos.',
    defaultSlides: 4,
  },
  {
    id: 'post-linkedin-landscape',
    name: 'Post LinkedIn Landscape',
    dimensions: '1200 × 627px',
    width: 1200,
    height: 627,
    aspectRatioLabel: '1.91:1',
    aspectRatioClass: 'w-24 h-13 rounded-2xl',
    previewAspectRatio: '1200/627',
    gradient: 'from-[#0a66c2] via-[#004182] to-[#38bdf8]',
    mainNetwork: 'linkedin',
    networks: ['linkedin', 'facebook', 'twitter'],
    isTop: true,
    description: 'Padrão ouro corporativo B2B com maior taxa de cliques para links e artigos.',
    defaultSlides: 1,
  },
  {
    id: 'banner-linkedin',
    name: 'Banner Perfil LinkedIn',
    dimensions: '1584 × 396px',
    width: 1584,
    height: 396,
    aspectRatioLabel: '4:1',
    aspectRatioClass: 'w-26 h-8 rounded-2xl',
    previewAspectRatio: '4/1',
    gradient: 'from-[#0f172a] via-[#1e293b] to-[#0a66c2]',
    mainNetwork: 'linkedin',
    networks: ['linkedin'],
    isBanner: true,
    isTop: false,
    description: 'Capa panorâmica topo de perfil pessoal ou Company Page no LinkedIn.',
    defaultSlides: 1,
  },
  {
    id: 'card-twitter-landscape',
    name: 'Card X / Twitter Landscape',
    dimensions: '1600 × 900px',
    width: 1600,
    height: 900,
    aspectRatioLabel: '16:9',
    aspectRatioClass: 'w-24 h-14 rounded-2xl',
    previewAspectRatio: '16/9',
    gradient: 'from-[#09090b] via-[#18181b] to-[#71717a]',
    mainNetwork: 'twitter',
    networks: ['twitter', 'linkedin'],
    isTop: true,
    description: 'Card horizontal otimizado para feed do X/Twitter com preview expansível.',
    defaultSlides: 1,
  },
  {
    id: 'banner-whatsapp',
    name: 'Banner Template WhatsApp',
    dimensions: '1125 × 600px',
    width: 1125,
    height: 600,
    aspectRatioLabel: '1.87:1',
    aspectRatioClass: 'w-24 h-13 rounded-2xl',
    previewAspectRatio: '1.875/1',
    gradient: 'from-[#059669] via-[#10b981] to-[#14b8a6]',
    mainNetwork: 'whatsapp',
    networks: ['whatsapp', 'facebook'],
    isTop: false,
    isBanner: true,
    description: 'Banner horizontal otimizado para envio e cards de WhatsApp.',
    defaultSlides: 1,
  },
  {
    id: 'thumbnail-youtube',
    name: 'Thumbnail YouTube',
    dimensions: '1280 × 720px',
    width: 1280,
    height: 720,
    aspectRatioLabel: '16:9',
    aspectRatioClass: 'w-24 h-14 rounded-2xl',
    previewAspectRatio: '16/9',
    gradient: 'from-[#ef4444] via-[#dc2626] to-[#991b1b]',
    mainNetwork: 'youtube',
    networks: ['youtube', 'facebook'],
    isTop: true,
    disabled: false,
    description: 'Miniatura chamativa para vídeos no YouTube e YouTube Shorts horizontal.',
    defaultSlides: 1,
  },
  {
    id: 'capa-facebook-evento',
    name: 'Capa Evento Facebook',
    dimensions: '1920 × 1005px',
    width: 1920,
    height: 1005,
    aspectRatioLabel: '1.91:1',
    aspectRatioClass: 'w-24 h-13 rounded-2xl',
    previewAspectRatio: '1920/1005',
    gradient: 'from-[#1877f2] via-[#2563eb] to-[#4338ca]',
    mainNetwork: 'facebook',
    networks: ['facebook'],
    isBanner: true,
    isTop: false,
    description: 'Banner para páginas de eventos e transmissões ao vivo no Facebook.',
    defaultSlides: 1,
  },
  {
    id: 'pin-pinterest',
    name: 'Pin Pinterest Vertical',
    dimensions: '1000 × 1500px',
    width: 1000,
    height: 1500,
    aspectRatioLabel: '2:3',
    aspectRatioClass: 'w-15 h-23 rounded-2xl',
    previewAspectRatio: '2/3',
    gradient: 'from-[#e60023] via-[#b91c1c] to-[#991b1b]',
    mainNetwork: 'instagram',
    networks: ['instagram', 'facebook'],
    isTop: false,
    description: 'Proporção 2:3 ideal para pins de alta conversão visual no Pinterest.',
    defaultSlides: 1,
  },
  {
    id: 'post-landscape',
    name: 'Post Landscape Panorâmico',
    dimensions: '1200 × 675px',
    width: 1200,
    height: 675,
    aspectRatioLabel: '16:9',
    aspectRatioClass: 'w-24 h-14 rounded-2xl',
    previewAspectRatio: '16/9',
    gradient: 'from-[#0284c7] via-[#06b6d4] to-[#10b981]',
    mainNetwork: 'twitter',
    networks: ['twitter', 'facebook', 'linkedin'],
    disabled: false,
    description: 'Formato horizontal panorâmico para posts informativos e notícias.',
    defaultSlides: 1,
  },
]

const TEMPLATE_PRESETS = [
  {
    id: 't1',
    name: 'Produto em Destaque',
    tag: 'DESTAQUE',
    cta: 'COMPRAR AGORA',
    subtitle: 'Qualidade que transforma a sua rotina',
  },
  {
    id: 't2',
    name: 'Citação Inspiradora',
    tag: 'INSIGHT',
    cta: 'SALVAR POST',
    subtitle: 'Compartilhe com quem precisa dessa reflexão',
  },
  {
    id: 't3',
    name: 'Antes & Depois',
    tag: 'TRANSFORMAÇÃO',
    cta: 'QUERO O MESMO',
    subtitle: 'Resultados comprovados em poucos dias',
  },
  {
    id: 't4',
    name: 'Promoção Relâmpago',
    tag: 'OFERTA LIMITADA',
    cta: 'GARANTIR DESCONTO',
    subtitle: 'Válido apenas até o fim de semana',
  },
]

const DRAFT_STORAGE_KEY = 'bestcontent_image_creator_draft_v2'

export default function ImageCreator() {
  const navigate = useNavigate()
  const { brands, addPost } = useSocial()
  const { user } = useAuth()

  // Navigation step: 1 = Formato, 2 = Modo / Template, 3 = Criar / Revisar
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [selectedFormatId, setSelectedFormatId] = useState<string>('post-portrait-ig')
  const [activeFilter, setActiveFilter] = useState<string>('all')

  // Step 2 & 3 state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('t1')
  const [objective, setObjective] = useState<'engajar' | 'vender'>('vender')
  const [approach, setApproach] = useState<string>('')
  const [showMoreApproaches, setShowMoreApproaches] = useState(false)
  const [createMethod, setCreateMethod] = useState<'zero' | 'link' | 'inspiracoes'>('zero')
  const [sourceUrl, setSourceUrl] = useState('')
  const [promptIdea, setPromptIdea] = useState('')
  const [selectedInspiration, setSelectedInspiration] = useState<InspirationItem | null>(null)
  const [slidesCount, setSlidesCount] = useState<number>(1)

  // Step 3 state
  const [media, setMedia] = useState<File | null>(null)
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [headline, setHeadline] = useState('')
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  )
  const [captionVariations, setCaptionVariations] = useState<
    Array<{ title: string; text: string; cta?: string }>
  >([])
  const [captionTone, setCaptionTone] = useState<string>(() => {
    return localStorage.getItem('bestcontent_caption_tone') || 'profissional'
  })

  // Modal / Feedback states
  const [inspirationModalOpen, setInspirationModalOpen] = useState(false)
  const [imageBankOpen, setImageBankOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiLoadingAction, setAiLoadingAction] = useState<
    'caption' | 'hashtags' | 'variations' | null
  >(null)
  const [aiGeneratingArt, setAiGeneratingArt] = useState(false)
  const [artGenerated, setArtGenerated] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pendingSubmitStatus, setPendingSubmitStatus] = useState<
    'draft' | 'scheduled' | 'published' | null
  >(null)

  // Carousel ref
  const carouselRef = useRef<HTMLDivElement>(null)

  // 1. Restaurar rascunho persistido do sessionStorage (sobrevive ao retornar ao hub ou recarregar)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.currentStep && [1, 2, 3].includes(data.currentStep)) {
          setCurrentStep(data.currentStep)
        }
        if (data.selectedFormatId) setSelectedFormatId(data.selectedFormatId)
        if (data.activeFilter) setActiveFilter(data.activeFilter)
        if (data.selectedTemplateId) setSelectedTemplateId(data.selectedTemplateId)
        if (data.objective) setObjective(data.objective)
        if (data.approach !== undefined) setApproach(data.approach)
        if (data.createMethod) setCreateMethod(data.createMethod)
        if (data.sourceUrl) setSourceUrl(data.sourceUrl)
        if (data.promptIdea) setPromptIdea(data.promptIdea)
        if (data.selectedInspiration) setSelectedInspiration(data.selectedInspiration)
        if (data.slidesCount) setSlidesCount(data.slidesCount)
        if (data.caption) setCaption(data.caption)
        if (data.hashtags) setHashtags(data.hashtags)
        if (data.headline) setHeadline(data.headline)
        if (data.scheduledDate) setScheduledDate(data.scheduledDate)
        if (data.artGenerated !== undefined) setArtGenerated(data.artGenerated)
      }
    } catch {
      /* ignore storage errors */
    }
  }, [])

  // 2. Persistir alterações no sessionStorage
  useEffect(() => {
    try {
      const payload = {
        currentStep,
        selectedFormatId,
        activeFilter,
        selectedTemplateId,
        objective,
        approach,
        createMethod,
        sourceUrl,
        promptIdea,
        selectedInspiration,
        slidesCount,
        caption,
        hashtags,
        headline,
        scheduledDate,
        artGenerated,
      }
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      /* ignore storage errors */
    }
  }, [
    currentStep,
    selectedFormatId,
    activeFilter,
    selectedTemplateId,
    objective,
    approach,
    createMethod,
    sourceUrl,
    promptIdea,
    selectedInspiration,
    slidesCount,
    caption,
    hashtags,
    headline,
    scheduledDate,
    artGenerated,
  ])

  // Formato selecionado
  const selectedFormat = IMAGE_FORMATS.find((f) => f.id === selectedFormatId) || IMAGE_FORMATS[0]

  // Ajusta número padrão de slides quando o formato muda
  useEffect(() => {
    if (selectedFormat.isCarousel && slidesCount < 2) {
      setSlidesCount(selectedFormat.defaultSlides || 4)
    } else if (!selectedFormat.isCarousel && slidesCount > 1) {
      setSlidesCount(1)
    }
  }, [selectedFormat.id, selectedFormat.isCarousel])

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Filtragem de formatos por rede
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

  // Template predefinido ativo
  const currentTemplate =
    TEMPLATE_PRESETS.find((t) => t.id === selectedTemplateId) || TEMPLATE_PRESETS[0]

  // Cálculo de créditos: 10 créditos por slide
  const calculatedCredits = Math.max(1, slidesCount) * 10

  // Validação da etapa 2
  const isStep2Valid = Boolean(
    objective &&
    (createMethod === 'zero'
      ? true
      : createMethod === 'link'
        ? sourceUrl.trim().length > 0 &&
          (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://'))
        : createMethod === 'inspiracoes'
          ? selectedInspiration !== null
          : true),
  )

  const step2ValidationError = !objective
    ? 'Selecione o objetivo da publicação (Engajar ou Vender).'
    : createMethod === 'link' && !sourceUrl.trim()
      ? 'Insira o link para extração do conteúdo com IA.'
      : createMethod === 'link' &&
          !sourceUrl.startsWith('http://') &&
          !sourceUrl.startsWith('https://')
        ? 'O link deve começar com http:// ou https://'
        : createMethod === 'inspiracoes' && !selectedInspiration
          ? 'Abra a biblioteca e selecione uma inspiração.'
          : null

  // Avançar para a etapa 3 preenchendo textos iniciais de forma inteligente
  const handleProceedToStep3 = () => {
    if (!caption) {
      if (createMethod === 'zero' && promptIdea) {
        setCaption(promptIdea)
      } else if (createMethod === 'link' && sourceUrl) {
        setCaption(`Conteúdo extraído e adaptado de: ${sourceUrl}`)
      } else if (createMethod === 'inspiracoes' && selectedInspiration) {
        setCaption(`${selectedInspiration.title} — ${selectedInspiration.description}`)
      } else {
        setCaption(`${currentTemplate.name}: ${currentTemplate.subtitle}`)
      }
    }
    if (!headline) {
      if (createMethod === 'zero' && promptIdea) {
        setHeadline(promptIdea.slice(0, 60))
      } else if (createMethod === 'inspiracoes' && selectedInspiration) {
        setHeadline(selectedInspiration.title)
      } else {
        setHeadline(currentTemplate.name)
      }
    }
    setCurrentStep(3)
  }

  // Gera legenda ou hashtags com IA
  const aiGenerate = async (type: 'caption' | 'hashtags' | 'variations') => {
    setAiLoading(true)
    setAiLoadingAction(type)
    const activeBrand = brands[0]
    const contentTheme =
      caption ||
      headline ||
      promptIdea ||
      (selectedInspiration
        ? `${selectedInspiration.title}: ${selectedInspiration.description}`
        : '') ||
      `post ${selectedFormat.name} sobre ${currentTemplate.name}`

    try {
      if (type === 'caption') {
        const r = await generateCaption({
          content: contentTheme,
          platform: selectedFormat.mainNetwork,
          objective,
          approach,
          brandName: activeBrand?.name,
          brandVoice: (activeBrand as any)?.brand_voice,
          tone: captionTone,
          formatName: selectedFormat.name,
          headline,
          variations: false,
        })
        const generated = (r as any).caption || ''
        setCaption(generated)
        toast({
          title: 'Legenda gerada pela IA!',
          description: `Alinhada ao objetivo "${objective === 'vender' ? 'Vender' : 'Engajar'}" e rede ${selectedFormat.mainNetwork}.`,
        })
      } else if (type === 'variations') {
        const r = await generateCaption({
          content: contentTheme,
          platform: selectedFormat.mainNetwork,
          objective,
          approach,
          brandName: activeBrand?.name,
          brandVoice: (activeBrand as any)?.brand_voice,
          tone: captionTone,
          formatName: selectedFormat.name,
          headline,
          variations: true,
        })
        const res = r as any
        if (res.variations && res.variations.length > 0) {
          setCaptionVariations(res.variations)
          if (!caption && res.caption) setCaption(res.caption)
          if (res.hashtags && res.hashtags.length > 0) {
            setHashtags(res.hashtags.join(' '))
          }
          toast({
            title: '3 opções geradas!',
            description: 'Escolha a variação que melhor combina com seu tom.',
          })
        } else if (res.caption) {
          setCaption(res.caption)
          toast({
            title: 'Legenda gerada pela IA!',
            description: 'Texto atualizado.',
          })
        }
      } else {
        const r = await generateHashtags({
          content: `${headline} ${caption}`.trim() || selectedFormat.name,
          platform: selectedFormat.mainNetwork,
          objective,
          category: approach || currentTemplate.tag,
        })
        const tags = ((r as any).hashtags || []).join(' ')
        setHashtags(tags)
        toast({
          title: 'Hashtags sugeridas!',
          description: `Tags calibradas para ${selectedFormat.mainNetwork} e objetivo ${objective}.`,
        })
      }
    } catch (err) {
      toast({
        title: 'Erro na geração de IA',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setAiLoading(false)
      setAiLoadingAction(null)
    }
  }

  // Simula geração da arte pela IA com feedback em tempo real
  const handleGenerateArt = async () => {
    setAiGeneratingArt(true)
    try {
      // Simula tempo de processamento do modelo visual
      await new Promise((resolve) => setTimeout(resolve, 1400))
      setArtGenerated(true)
      toast({
        title: 'Arte gerada com sucesso!',
        description: `Visual calibrado no formato ${selectedFormat.name} (${selectedFormat.dimensions}).`,
      })
    } catch {
      toast({
        title: 'Falha na renderização',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setAiGeneratingArt(false)
    }
  }

  const handleSelectBrandAsset = async (url: string) => {
    try {
      // Se for data URI (SVG) ou URL remota
      if (url.startsWith('data:')) {
        setMedia(null)
        setMediaPreviewUrl(url)
        setImageBankOpen(false)
        toast({
          title: 'Imagem aplicada!',
          description: 'Fundo selecionado do banco interno aplicado ao post.',
        })
        return
      }

      const response = await fetch(url)
      const blob = await response.blob()
      const file = new File([blob], `image-bank-asset-${Date.now()}.png`, {
        type: blob.type || 'image/png',
      })
      setMedia(file)
      if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl)
      setMediaPreviewUrl(URL.createObjectURL(file))
      setImageBankOpen(false)
      toast({
        title: 'Imagem aplicada!',
        description: 'Imagem do banco interno aplicada ao canvas.',
      })
    } catch {
      // Fallback: aplicar url diretamente como preview
      setMediaPreviewUrl(url)
      setImageBankOpen(false)
      toast({
        title: 'Imagem aplicada!',
        description: 'Asset selecionado e vinculado à arte.',
      })
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMedia(file)
      if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl)
      setMediaPreviewUrl(URL.createObjectURL(file))
      toast({ title: 'Mídia carregada!', description: file.name })
    }
  }

  const removeMedia = () => {
    setMedia(null)
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl)
    setMediaPreviewUrl(null)
  }

  // Disparar confirmação de créditos antes de salvar/agendar/publicar
  const handleRequestSubmit = (status: 'draft' | 'scheduled' | 'published') => {
    if (!brands[0]?.id) {
      toast({
        title: 'Marca necessária',
        description: 'Você precisa criar ou selecionar uma marca antes de finalizar.',
        variant: 'destructive',
      })
      navigate('/app/brands')
      return
    }
    setPendingSubmitStatus(status)
    setConfirmModalOpen(true)
  }

  const handleExecuteSave = async () => {
    if (!pendingSubmitStatus) return
    const status = pendingSubmitStatus
    setConfirmModalOpen(false)
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
        content: headline || caption || `Post ${selectedFormat.name}`,
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

      // Limpar rascunho persistido
      sessionStorage.removeItem(DRAFT_STORAGE_KEY)

      toast({
        title:
          status === 'published'
            ? 'Publicado com Sucesso!'
            : status === 'scheduled'
              ? 'Agendado com Sucesso!'
              : 'Rascunho Salvo!',
        description: `${calculatedCredits} créditos contabilizados para ${slidesCount} slide(s).`,
      })

      navigate(status === 'scheduled' ? '/app/calendar' : '/app/feed')
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
      setPendingSubmitStatus(null)
    }
  }

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

  const fallbackMediaUrl =
    mediaPreviewUrl ||
    `https://img.usecurling.com/p/800/800?q=${encodeURIComponent(
      objective === 'vender' ? 'ecommerce retail product' : 'community inspiration social',
    )}&color=purple`

  return (
    <div className="min-h-full flex flex-col justify-between max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4 relative bg-[#f8f8fa] dark:bg-background text-foreground transition-colors duration-200">
      {/* 1. Barra Superior de Contexto — Padronizada com GuidedCreator / CreatePost */}
      <div className="flex items-center justify-center mb-4">
        <div className="inline-flex items-center gap-3 bg-muted/70 dark:bg-card border border-border/80 rounded-full px-4 py-1.5 shadow-2xs text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 text-foreground">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>
              Modo <strong className="font-bold">Post de Imagem</strong>
            </span>
          </div>
          <span className="text-muted-foreground/60">·</span>
          <span className="text-muted-foreground text-xs hidden sm:inline">
            {selectedFormat.name} ({selectedFormat.aspectRatioLabel})
          </span>
          <span className="text-muted-foreground/60 hidden sm:inline">·</span>
          <div className="flex items-center gap-1 text-muted-foreground text-xs font-semibold">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{calculatedCredits} cr</span>
            <span className="text-[10px] text-muted-foreground font-normal">
              ({slidesCount} slide{slidesCount > 1 ? 's' : ''})
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/criar')}
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline ml-1 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1"
            title="Trocar para Vídeo, Flyer ou Hub"
          >
            Trocar
          </button>
        </div>
      </div>

      {/* 2. Stepper Horizontal Centrado Padronizado com Flow Visual Suave */}
      <nav
        aria-label="Etapas da criação de imagem"
        className="flex items-center justify-center gap-2 sm:gap-3 text-xs font-medium text-muted-foreground mb-6 select-none"
      >
        {/* Etapa 1: Formato */}
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          aria-current={currentStep === 1 ? 'step' : undefined}
          className={`flex items-center gap-2 cursor-pointer transition-colors py-1 px-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            currentStep === 1
              ? 'text-foreground font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              currentStep === 1
                ? 'bg-purple-600 ring-4 ring-purple-600/20 scale-110'
                : 'bg-purple-600/70'
            }`}
          />
          <span>1. Formato</span>
        </button>

        {/* Linha conectora */}
        <div className="w-6 sm:w-10 h-[1.5px] bg-border transition-colors" />

        {/* Etapa 2: Modo */}
        <button
          type="button"
          onClick={() => selectedFormat && setCurrentStep(2)}
          aria-current={currentStep === 2 ? 'step' : undefined}
          className={`flex items-center gap-2 cursor-pointer transition-colors py-1 px-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            currentStep === 2
              ? 'text-foreground font-bold'
              : currentStep > 2
                ? 'text-foreground'
                : 'text-muted-foreground/60 hover:text-muted-foreground'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              currentStep === 2
                ? 'bg-purple-600 ring-4 ring-purple-600/20 scale-110'
                : currentStep > 2
                  ? 'bg-purple-600/70'
                  : 'bg-muted-foreground/30'
            }`}
          />
          <span>2. Modo & Conteúdo</span>
        </button>

        {/* Linha conectora */}
        <div className="w-6 sm:w-10 h-[1.5px] bg-border transition-colors" />

        {/* Etapa 3: Criar */}
        <button
          type="button"
          onClick={() => isStep2Valid && handleProceedToStep3()}
          disabled={!isStep2Valid && currentStep < 3}
          aria-current={currentStep === 3 ? 'step' : undefined}
          className={`flex items-center gap-2 transition-colors py-1 px-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            currentStep === 3
              ? 'text-foreground font-bold'
              : isStep2Valid
                ? 'text-muted-foreground/70 hover:text-foreground cursor-pointer'
                : 'text-muted-foreground/40 cursor-not-allowed'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              currentStep === 3
                ? 'bg-purple-600 ring-4 ring-purple-600/20 scale-110'
                : 'bg-muted-foreground/30'
            }`}
          />
          <span>3. Criar & Finalizar</span>
        </button>
      </nav>

      {/* ============================================================== */}
      {/* ETAPA 1: ESCOLHA DO FORMATO DA IMAGEM                          */}
      {/* ============================================================== */}
      {currentStep === 1 && (
        <div className="flex flex-col flex-1 space-y-6 animate-in fade-in-50 duration-300">
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
                  className="hover:text-foreground transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Ajuda sobre formatos de imagem"
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
                  className="hover:text-foreground transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Enviar feedback"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Você está no modo Post de Imagem. Escolha a proporção e a rede ideal para sua arte ser
              gerada pela IA.
            </p>
          </div>

          {/* Chips de Filtro em Linha com foco visível */}
          <div
            role="toolbar"
            aria-label="Filtrar formatos por rede social"
            className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar justify-start sm:justify-center"
          >
            {/* Todas */}
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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
              type="button"
              onClick={() => setActiveFilter('instagram')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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
              type="button"
              onClick={() => setActiveFilter('facebook')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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
              type="button"
              onClick={() => setActiveFilter('linkedin')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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
              type="button"
              onClick={() => setActiveFilter('whatsapp')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeFilter === 'whatsapp'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* TikTok */}
            <button
              type="button"
              onClick={() => setActiveFilter('tiktok')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeFilter === 'tiktok'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <TikTokIcon className="w-3.5 h-3.5" />
              <span>TikTok</span>
            </button>

            {/* YouTube */}
            <button
              type="button"
              onClick={() => setActiveFilter('youtube')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeFilter === 'youtube'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <YouTubeIcon className="w-3.5 h-3.5" />
              <span>YouTube</span>
            </button>

            {/* Twitter/X */}
            <button
              type="button"
              onClick={() => setActiveFilter('twitter')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeFilter === 'twitter'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>X / Twitter</span>
            </button>
          </div>

          {/* Carrossel Horizontal de Cards de Formato */}
          <div className="relative py-4 px-1 group/carousel">
            {/* Botão Seta Anterior (Esquerda) */}
            <button
              type="button"
              onClick={() => scrollCarousel('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white dark:bg-card shadow-lg border border-border flex items-center justify-center text-foreground hover:bg-muted transition-all opacity-80 hover:opacity-100 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Formato anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Container com scroll horizontal snap */}
            <div
              ref={carouselRef}
              className="flex items-center gap-5 overflow-x-auto py-2 px-10 scroll-smooth snap-x snap-mandatory no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              tabIndex={0}
              aria-label="Lista de formatos de imagem disponíveis"
            >
              {filteredFormats.map((fmt) => {
                const isSelected = selectedFormatId === fmt.id
                return (
                  <button
                    type="button"
                    key={fmt.id}
                    disabled={fmt.disabled}
                    onClick={() => {
                      if (!fmt.disabled) {
                        setSelectedFormatId(fmt.id)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        if (!fmt.disabled) setSelectedFormatId(fmt.id)
                      }
                    }}
                    className={`relative shrink-0 w-64 h-88 rounded-3xl p-5 flex flex-col justify-between text-left transition-all duration-300 snap-center select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500 focus-visible:ring-offset-2 ${
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
                    <div className="flex items-center justify-between text-white w-full">
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
                            title="Carrossel com múltiplos slides"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {fmt.isStory && (
                          <div
                            className="w-6 h-6 rounded-md bg-white/20 backdrop-blur-md flex items-center justify-center text-white"
                            title="Story tela cheia"
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
                    <div className="flex items-center justify-center my-auto w-full">
                      <div
                        className={`${fmt.aspectRatioClass} border-2 border-white/70 bg-white/15 backdrop-blur-xs shadow-inner flex items-center justify-center relative transition-transform duration-300`}
                      >
                        {isSelected && (
                          <div className="w-7 h-7 rounded-full bg-white text-purple-700 flex items-center justify-center shadow-md animate-in zoom-in-75">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Info, Dimensões e Redes Compatíveis */}
                    <div className="text-white space-y-1 w-full">
                      <div className="flex items-center justify-between gap-1.5">
                        <h3 className="font-bold text-base leading-snug tracking-tight drop-shadow-xs">
                          {fmt.name}
                        </h3>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            toast({
                              title: fmt.name,
                              description: `${fmt.dimensions} · ${fmt.description}`,
                            })
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.stopPropagation()
                              toast({
                                title: fmt.name,
                                description: `${fmt.dimensions} · ${fmt.description}`,
                              })
                            }
                          }}
                          className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer p-0.5"
                          title="Mais informações sobre este formato"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </span>
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
                  </button>
                )
              })}
            </div>

            {/* Botão Seta Próximo (Direita) */}
            <button
              type="button"
              onClick={() => scrollCarousel('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white dark:bg-card shadow-lg border border-border flex items-center justify-center text-foreground hover:bg-muted transition-all opacity-80 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Próximo formato"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dica do formato selecionado */}
          <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40 rounded-2xl p-3.5 max-w-xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">{selectedFormat.name}:</span>
              <span className="text-muted-foreground">{selectedFormat.description}</span>
            </div>
            <Badge variant="outline" className="font-mono text-[11px] shrink-0 font-bold">
              {selectedFormat.aspectRatioLabel}
            </Badge>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ETAPA 2: ESCOLHA DO MODO (Defina o Conteúdo da Imagem)          */}
      {/* ============================================================== */}
      {currentStep === 2 && (
        <div className="flex flex-col flex-1 space-y-7 max-w-5xl mx-auto w-full pb-4 animate-in fade-in-50 duration-300">
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
                  className="hover:text-foreground transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Ajuda sobre definição de conteúdo"
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
                  className="hover:text-foreground transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Enviar feedback"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Esse conteúdo será expandido em um prompt visual para gerar a arte completa com IA no
              formato <strong>{selectedFormat.name}</strong> ({selectedFormat.aspectRatioLabel}).
            </p>
          </div>

          {/* SEÇÃO 1: Qual o objetivo deste post? */}
          <div className="space-y-3">
            <label className="text-xs sm:text-sm font-semibold text-muted-foreground block text-left">
              Qual o objetivo deste post?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card Engajar */}
              <button
                type="button"
                onClick={() => setObjective('engajar')}
                className={`bg-white dark:bg-card rounded-[22px] p-6 sm:p-7 border transition-all duration-200 cursor-pointer flex flex-col justify-between text-left shadow-xs hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  objective === 'engajar'
                    ? 'border-purple-600 border-2 ring-4 ring-purple-600/10 shadow-sm'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">Engajar</h3>
                    {objective === 'engajar' && (
                      <CheckCircle2 className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Aumentar interação, comentários, compartilhamentos e comunidade.
                  </p>
                </div>
              </button>

              {/* Card Vender */}
              <button
                type="button"
                onClick={() => setObjective('vender')}
                className={`bg-white dark:bg-card rounded-[22px] p-6 sm:p-7 border transition-all duration-200 cursor-pointer flex flex-col justify-between text-left shadow-xs hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  objective === 'vender'
                    ? 'border-purple-600 border-2 ring-4 ring-purple-600/10 shadow-sm'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">Vender</h3>
                    {objective === 'vender' && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Converter seguidores em clientes com foco em oferta, autoridade e conversão.
                  </p>
                </div>
              </button>
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
                    className="text-xs text-muted-foreground hover:text-foreground font-medium underline cursor-pointer"
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
              <button
                type="button"
                onClick={() => setApproach(approach === 'oferta' ? '' : 'oferta')}
                className={`bg-white dark:bg-card rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm min-h-[82px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  approach === 'oferta'
                    ? 'border-purple-600 border-2 ring-2 ring-purple-600/20 bg-purple-50/30 dark:bg-purple-950/20'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <span className="text-xl mb-1 select-none">🏷️</span>
                <span className="text-xs font-bold text-foreground">Oferta</span>
              </button>

              {/* Card 2: Storytelling */}
              <button
                type="button"
                onClick={() => setApproach(approach === 'storytelling' ? '' : 'storytelling')}
                className={`bg-white dark:bg-card rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm min-h-[82px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  approach === 'storytelling'
                    ? 'border-purple-600 border-2 ring-2 ring-purple-600/20 bg-purple-50/30 dark:bg-purple-950/20'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <span className="text-xl mb-1 select-none">📖</span>
                <span className="text-xs font-bold text-foreground">Storytelling</span>
              </button>

              {/* Card 3: Prova social */}
              <button
                type="button"
                onClick={() => setApproach(approach === 'prova_social' ? '' : 'prova_social')}
                className={`bg-white dark:bg-card rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm min-h-[82px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  approach === 'prova_social'
                    ? 'border-purple-600 border-2 ring-2 ring-purple-600/20 bg-purple-50/30 dark:bg-purple-950/20'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <span className="text-xl mb-1 select-none">✅</span>
                <span className="text-xs font-bold text-foreground">Prova social</span>
              </button>

              {/* Card 4: Ver mais (toggle de expansão) */}
              <button
                type="button"
                onClick={() => setShowMoreApproaches((prev) => !prev)}
                className={`bg-white dark:bg-card rounded-2xl p-3.5 sm:p-4 border border-border/80 hover:border-border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm min-h-[82px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  showMoreApproaches
                    ? 'border-purple-600/70 bg-purple-50/20 text-purple-600 dark:text-purple-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="text-base font-bold tracking-widest mb-1 text-muted-foreground">
                  ···
                </span>
                <span className="text-xs font-semibold flex items-center gap-1">
                  Ver mais{' '}
                  {showMoreApproaches ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </span>
              </button>
            </div>

            {/* Expansão com mais abordagens: Viral, Educativo, Comunidade */}
            {showMoreApproaches && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 animate-in fade-in-50 duration-200">
                {/* Viral */}
                <button
                  type="button"
                  onClick={() => setApproach(approach === 'viral' ? '' : 'viral')}
                  className={`bg-white dark:bg-card rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm min-h-[82px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    approach === 'viral'
                      ? 'border-purple-600 border-2 ring-2 ring-purple-600/20 bg-purple-50/30 dark:bg-purple-950/20'
                      : 'border-border/80 hover:border-border'
                  }`}
                >
                  <span className="text-xl mb-1 select-none">🔥</span>
                  <span className="text-xs font-bold text-foreground">Viral</span>
                </button>

                {/* Educativo */}
                <button
                  type="button"
                  onClick={() => setApproach(approach === 'educativo' ? '' : 'educativo')}
                  className={`bg-white dark:bg-card rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm min-h-[82px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    approach === 'educativo'
                      ? 'border-purple-600 border-2 ring-2 ring-purple-600/20 bg-purple-50/30 dark:bg-purple-950/20'
                      : 'border-border/80 hover:border-border'
                  }`}
                >
                  <span className="text-xl mb-1 select-none">📚</span>
                  <span className="text-xs font-bold text-foreground">Educativo</span>
                </button>

                {/* Comunidade */}
                <button
                  type="button"
                  onClick={() => setApproach(approach === 'comunidade' ? '' : 'comunidade')}
                  className={`bg-white dark:bg-card rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-sm min-h-[82px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    approach === 'comunidade'
                      ? 'border-purple-600 border-2 ring-2 ring-purple-600/20 bg-purple-50/30 dark:bg-purple-950/20'
                      : 'border-border/80 hover:border-border'
                  }`}
                >
                  <span className="text-xl mb-1 select-none">💬</span>
                  <span className="text-xs font-bold text-foreground">Comunidade</span>
                </button>
              </div>
            )}
          </div>

          {/* SEÇÃO 3: Escolha do Modelo Visual Base */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-semibold text-muted-foreground block text-left">
                Modelo / Estrutura Visual
              </label>
              <span className="text-xs text-muted-foreground">
                Define a hierarquia visual do canvas
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TEMPLATE_PRESETS.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id
                return (
                  <button
                    type="button"
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[90px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isSelected
                        ? 'border-purple-600 border-2 ring-2 ring-purple-600/20 bg-purple-50/30 dark:bg-purple-950/20'
                        : 'border-border/80 hover:border-border bg-card'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        {tpl.tag}
                      </span>
                      <h4 className="text-xs font-bold text-foreground mt-0.5 line-clamp-1">
                        {tpl.name}
                      </h4>
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate">{tpl.cta}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* SEÇÃO 4: Como você quer criar? */}
          <div className="space-y-3">
            <label className="text-xs sm:text-sm font-semibold text-muted-foreground block text-left">
              Como você quer criar?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Criar do Zero */}
              <button
                type="button"
                onClick={() => setCreateMethod('zero')}
                className={`bg-white dark:bg-card rounded-[22px] p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between text-left shadow-xs hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  createMethod === 'zero'
                    ? 'border-purple-600 border-2 ring-4 ring-purple-600/10 shadow-sm'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Criar do Zero</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Descreva sua ideia e deixe a IA calibrar o conteúdo
                  </p>
                </div>
              </button>

              {/* A partir de Link */}
              <button
                type="button"
                onClick={() => setCreateMethod('link')}
                className={`bg-white dark:bg-card rounded-[22px] p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between text-left shadow-xs hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  createMethod === 'link'
                    ? 'border-purple-600 border-2 ring-4 ring-purple-600/10 shadow-sm'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">A partir de Link</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Cole um link de produto ou artigo para extração de pontos-chave
                  </p>
                </div>
              </button>

              {/* Inspirações */}
              <button
                type="button"
                onClick={() => setCreateMethod('inspiracoes')}
                className={`bg-white dark:bg-card rounded-[22px] p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between text-left shadow-xs hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  createMethod === 'inspiracoes'
                    ? 'border-purple-600 border-2 ring-4 ring-purple-600/10 shadow-sm'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <div>
                  <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Inspirações</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Escolha referências de sucesso na nossa biblioteca
                  </p>
                </div>
              </button>
            </div>

            {/* Sub-inputs específicos de cada método */}
            {createMethod === 'zero' && (
              <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2 mt-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="prompt-idea-input"
                    className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Descreva sua ideia para o post</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Você poderá editar os textos no passo seguinte
                  </span>
                </div>
                <Textarea
                  id="prompt-idea-input"
                  value={promptIdea}
                  onChange={(e) => setPromptIdea(e.target.value)}
                  placeholder="Ex.: Anúncio de promoção relâmpago de 30% em cursos de tecnologia para o final de semana..."
                  className="min-h-[80px] text-xs resize-y bg-background"
                />
              </div>
            )}

            {createMethod === 'link' && (
              <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2 mt-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="source-url-input"
                    className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Cole o link do artigo, notícia ou produto *</span>
                  </label>
                  <Badge variant="outline" className="text-[10px]">
                    URL Obrigatória
                  </Badge>
                </div>
                <input
                  id="source-url-input"
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://exemplo.com.br/artigo-ou-produto"
                  className="w-full text-xs bg-background border border-border rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <p className="text-[11px] text-muted-foreground">
                  A IA lerá o conteúdo da página e sintetizará os pontos principais para a arte e a
                  legenda.
                </p>
              </div>
            )}

            {createMethod === 'inspiracoes' && (
              <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 mt-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>Biblioteca de Inspirações Selecionada</span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {selectedInspiration
                        ? `Inspiração ativa: "${selectedInspiration.title}"`
                        : 'Abra a biblioteca e selecione uma referência comprovada.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setInspirationModalOpen(true)}
                    className="text-xs font-semibold gap-1.5 rounded-xl"
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

            {/* Controle de slides caso seja carrossel */}
            {selectedFormat.isCarousel && (
              <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 mt-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Número de Slides do Carrossel</span>
                    </label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Cada slide consome 10 créditos para ser renderizado individualmente.
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                    {slidesCount} slides = {calculatedCredits} créditos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[2, 3, 4, 5, 6, 8, 10].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setSlidesCount(num)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        slidesCount === num
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback inline de validação da Etapa 2 */}
            {step2ValidationError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{step2ValidationError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ETAPA 3: CRIAR / PREVIEW EM TEMPO REAL & FINALIZAR              */}
      {/* ============================================================== */}
      {currentStep === 3 && (
        <div className="flex flex-col flex-1 space-y-6 max-w-5xl mx-auto w-full animate-in fade-in-50 duration-300">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              Finalizar e Publicar
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              O canvas reflete a proporção real do formato ({selectedFormat.dimensions} ·{' '}
              {selectedFormat.aspectRatioLabel}). Revise, gere legendas e publique.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Visual Preview / Canvas Interativo (5 colunas) */}
            <div className="lg:col-span-5 bg-card border border-border rounded-3xl p-5 shadow-xs flex flex-col items-center sticky top-4">
              <div className="flex items-center justify-between w-full mb-3 text-xs text-muted-foreground">
                <Badge variant="outline" className="font-semibold flex items-center gap-1">
                  {renderNetworkMiniIcon(selectedFormat.mainNetwork, 'w-3 h-3')}
                  <span>{selectedFormat.name}</span>
                </Badge>
                <span className="font-mono text-[11px] font-bold">
                  {selectedFormat.aspectRatioLabel} · {selectedFormat.dimensions}
                </span>
              </div>

              {/* Informações da Etapa 2 configurada */}
              <div className="w-full flex items-center gap-1.5 mb-3 flex-wrap">
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-0 text-[10px] font-bold">
                  {objective === 'vender' ? '🎯 Vender' : '❤️ Engajar'}
                </Badge>
                {approach && (
                  <Badge variant="outline" className="text-[10px] font-medium capitalize">
                    {approach.replace('_', ' ')}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-[10px]">
                  {currentTemplate.name}
                </Badge>
                {selectedFormat.isCarousel && (
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {slidesCount} slides
                  </Badge>
                )}
              </div>

              {/* Canvas adaptativo fiel com a proporção exata selecionada */}
              <div
                className="w-full max-w-[280px] rounded-2xl overflow-hidden shadow-2xl border-2 border-purple-500/40 relative flex flex-col justify-between transition-all duration-300"
                style={{
                  aspectRatio: selectedFormat.previewAspectRatio,
                }}
              >
                {/* Imagem de Fundo / Mídia */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={fallbackMediaUrl}
                    alt="Canvas Preview"
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay degradê característico do formato para garantir legibilidade WCAG */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${selectedFormat.gradient} opacity-80 mix-blend-multiply`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
                </div>

                {/* Conteúdo sobreposto no Canvas */}
                <div className="relative z-10 p-4 flex flex-col justify-between h-full text-white">
                  {/* Topo do canvas */}
                  <div className="flex items-center justify-between">
                    <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/20">
                      {currentTemplate.tag}
                    </span>
                    <span className="text-[10px] font-mono opacity-80">
                      {brands[0]?.name || 'BestContent'}
                    </span>
                  </div>

                  {/* Centro do canvas com headline dinâmico */}
                  <div className="my-auto text-center space-y-1.5 py-4">
                    <h3 className="text-base sm:text-lg font-black leading-tight drop-shadow-md line-clamp-3">
                      {headline || currentTemplate.name}
                    </h3>
                    <p className="text-[11px] opacity-90 line-clamp-2 drop-shadow-xs">
                      {currentTemplate.subtitle}
                    </p>
                  </div>

                  {/* Rodapé do canvas com CTA */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-center">
                      <div className="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase text-white shadow-lg flex items-center gap-1.5 bg-purple-600 backdrop-blur-sm border border-white/20">
                        <span>{currentTemplate.cta}</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>

                    {selectedFormat.isCarousel && (
                      <div className="flex items-center justify-center gap-1 pt-1">
                        {Array.from({ length: Math.min(slidesCount, 6) }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 rounded-full transition-all ${
                              i === 0 ? 'w-4 bg-white' : 'w-1 bg-white/40'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Indicador de carregamento se IA estiver gerando a arte */}
                {aiGeneratingArt && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20 text-white animate-in fade-in">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                    <p className="text-xs font-bold">Renderizando arte com IA...</p>
                    <span className="text-[10px] text-white/70">Ajustando paleta e proporções</span>
                  </div>
                )}
              </div>

              {/* Botões do Canvas */}
              <div className="w-full flex items-center gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateArt}
                  disabled={aiGeneratingArt}
                  className="flex-1 text-xs gap-1.5 rounded-xl border-purple-500/30 text-purple-700 dark:text-purple-300"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{artGenerated ? 'Regenerar Arte' : 'Renderizar com IA'}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageBankOpen(true)}
                  className="text-xs rounded-xl"
                  title="Usar imagem da biblioteca de marcas"
                >
                  <Palette className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Inputs de Copy & Configurações (7 colunas) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-4 sm:p-5 space-y-4 rounded-3xl border-border/80">
                {/* Título visual / Headline do Canvas */}
                <div>
                  <label
                    htmlFor="headline-input"
                    className="text-xs font-bold text-foreground block mb-1"
                  >
                    Título Visual da Arte (Headline no Canvas)
                  </label>
                  <input
                    id="headline-input"
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Ex: 5 Passos Para Alavancar Suas Vendas"
                    className="w-full text-xs font-semibold bg-background border border-border rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                {/* Legenda do Post com IA */}
                <div>
                  {/* Seletor de Tom de Voz da Legenda */}
                  <div className="mb-2 p-2.5 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                        <span>🎙️ Tom de Voz da Legenda</span>
                      </span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold capitalize">
                        {
                          [
                            { id: 'profissional', label: 'Profissional' },
                            { id: 'descontraido', label: 'Descontraído' },
                            { id: 'inspirador', label: 'Inspirador' },
                            { id: 'divertido', label: 'Divertido' },
                            { id: 'direto', label: 'Direto ao Ponto' },
                            { id: 'empatico', label: 'Empático' },
                            { id: 'provocativo', label: 'Provocativo' },
                          ].find((t) => t.id === captionTone)?.label
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                      {[
                        { id: 'profissional', label: 'Profissional', emoji: '💼' },
                        { id: 'descontraido', label: 'Descontraído', emoji: '😊' },
                        { id: 'inspirador', label: 'Inspirador', emoji: '🚀' },
                        { id: 'divertido', label: 'Divertido', emoji: '🎉' },
                        { id: 'direto', label: 'Direto ao Ponto', emoji: '🎯' },
                        { id: 'empatico', label: 'Empático', emoji: '🤝' },
                        { id: 'provocativo', label: 'Provocativo', emoji: '🔥' },
                      ].map((t) => {
                        const active = captionTone === t.id
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setCaptionTone(t.id)
                              localStorage.setItem('bestcontent_caption_tone', t.id)
                            }}
                            className={`text-[10px] px-2.5 py-1 rounded-full font-semibold shrink-0 transition-all ${
                              active
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
                            }`}
                          >
                            {t.emoji} {t.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="caption-input" className="text-xs font-bold text-foreground">
                      Legenda do Post
                    </label>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => aiGenerate('variations')}
                        disabled={aiLoading}
                        className="text-xs text-purple-600 dark:text-purple-400 h-7 gap-1 rounded-lg border border-purple-500/20"
                        title="Gerar 3 opções estratégicas no tom escolhido"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {aiLoading && aiLoadingAction === 'variations' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          '3 Opções'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => aiGenerate('caption')}
                        disabled={aiLoading}
                        className="text-xs text-purple-600 dark:text-purple-400 h-7 gap-1 rounded-lg"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        {aiLoading && aiLoadingAction === 'caption' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Gerar Direta'
                        )}
                      </Button>
                    </div>
                  </div>

                  {captionVariations.length > 0 && (
                    <div className="mb-2 p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/40 space-y-2 animate-in fade-in-50">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Escolha uma das 3 opções de legenda:
                        </span>
                        <button
                          type="button"
                          onClick={() => setCaptionVariations([])}
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Fechar
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {captionVariations.map((v, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              const finalTxt = v.cta ? `${v.text}\n\n👉 ${v.cta}` : v.text
                              setCaption(finalTxt)
                              toast({
                                title: `${v.title} aplicada!`,
                                description: 'A legenda do post foi atualizada.',
                              })
                            }}
                            className="p-2 text-left rounded-lg bg-card hover:bg-muted/80 border border-border/80 transition-all text-xs group"
                          >
                            <span className="font-bold text-purple-600 dark:text-purple-400 block text-[11px]">
                              {v.title}
                            </span>
                            <p className="text-muted-foreground line-clamp-2 text-[11px] mt-0.5">
                              {v.text}
                            </p>
                            {v.cta && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                                CTA: {v.cta}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Textarea
                    id="caption-input"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Escreva a mensagem ou tema do post..."
                    className="min-h-[110px] text-xs resize-y bg-background"
                  />
                </div>

                {/* Hashtags com IA e seletor por rede */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="hashtags-input" className="text-xs font-bold text-foreground">
                      Hashtags do Post
                    </label>
                  </div>
                  <Textarea
                    id="hashtags-input"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="#marketing #conteudo #redessociais #engajamento..."
                    className="min-h-[60px] text-xs resize-y bg-background"
                  />

                  {/* Gerador de Hashtags com chips de rede social */}
                  <NetworkHashtagGenerator
                    contentSource={`${headline} ${caption}`.trim() || selectedFormat.name}
                    selectedNetwork={selectedFormat.mainNetwork}
                    onNetworkChange={(net) => {
                      // opcionalmente atualiza formato se conveniente
                    }}
                    onApplyHashtags={(tags) => {
                      setHashtags(hashtags ? `${hashtags} ${tags}` : tags)
                    }}
                    currentHashtags={hashtags}
                  />
                </div>

                {/* Upload de mídia personalizada opcional */}
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Imagem Própria ou da Marca (Opcional)
                  </label>
                  {media ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/60 border border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-xs font-medium truncate">{media.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeMedia}
                        className="text-xs text-rose-600 hover:text-rose-700 h-7"
                      >
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => document.getElementById('image-creator-media')?.click()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')
                          document.getElementById('image-creator-media')?.click()
                      }}
                      className="border-2 border-dashed border-border/80 hover:border-purple-500 rounded-2xl p-4 text-center bg-muted/20 hover:bg-purple-500/5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Upload className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs font-bold text-foreground">
                        Clique para anexar imagem própria
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        PNG ou JPG até 25MB · Substitui a imagem base no canvas
                      </p>
                      <input
                        id="image-creator-media"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileInputChange}
                      />
                    </div>
                  )}
                </div>

                {/* Agendamento */}
                <div>
                  <label
                    htmlFor="scheduled-date-input"
                    className="text-xs font-bold text-foreground block mb-1"
                  >
                    Data e Horário de Agendamento
                  </label>
                  <input
                    id="scheduled-date-input"
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full text-xs bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </Card>

              {/* Botões de Ação Final */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRequestSubmit('draft')}
                  disabled={submitting}
                  className="text-xs rounded-xl h-10 px-4"
                >
                  Salvar Rascunho
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleRequestSubmit('scheduled')}
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 rounded-xl h-10 px-4 shadow-sm"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Agendando...' : 'Agendar Post'}</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleRequestSubmit('published')}
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 rounded-xl h-10 px-5 shadow-sm font-bold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Publicando...' : 'Publicar Agora'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. Rodapé Fixo de Navegação Padronizado                        */}
      {/* ============================================================== */}
      <footer className="border-t border-border/80 pt-4 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Esquerda: Indicador de Créditos e Resumo do Post */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-xs font-semibold text-foreground border border-border/60">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {slidesCount} slide{slidesCount > 1 ? 's' : ''} → {calculatedCredits} créditos
            </span>
          </div>
          <span className="text-xs text-muted-foreground hidden md:inline">
            ({selectedFormat.name} · {selectedFormat.aspectRatioLabel})
          </span>
        </div>

        {/* Direita: Botão Voltar + Botão Continuar com Validação Inline Clara */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (currentStep === 1) {
                navigate('/app/criar')
              } else {
                setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)
              }
            }}
            className="text-xs font-semibold border-border text-foreground hover:bg-muted gap-1 px-4 h-9 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            ← Voltar
          </Button>

          {currentStep === 1 && (
            <Button
              type="button"
              size="sm"
              disabled={!selectedFormatId}
              onClick={() => setCurrentStep(2)}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs px-5 h-9 rounded-xl shadow-md gap-1.5 cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>Continuar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}

          {currentStep === 2 && (
            <Button
              type="button"
              size="sm"
              disabled={!isStep2Valid}
              onClick={handleProceedToStep3}
              title={step2ValidationError || 'Avançar para revisão da arte'}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs px-5 h-9 rounded-xl shadow-md gap-1.5 cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>Continuar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}

          {currentStep === 3 && (
            <Button
              type="button"
              size="sm"
              onClick={() => handleRequestSubmit('published')}
              disabled={submitting}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs px-5 h-9 rounded-xl shadow-md gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>Concluir</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </footer>

      {/* Modal de Confirmação de Créditos Antes do Consumo */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Confirmar Geração de Arte
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Revise os detalhes da arte antes de descontar os créditos da sua conta.
            </DialogDescription>
          </DialogHeader>

          {/* Resumo da Operação */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-xs border border-border/60 my-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Formato:</span>
              <span className="font-bold text-foreground">
                {selectedFormat.name} ({selectedFormat.aspectRatioLabel})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Objetivo:</span>
              <span className="font-bold capitalize text-foreground">{objective}</span>
            </div>
            {approach && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Abordagem:</span>
                <span className="font-bold capitalize text-foreground">
                  {approach.replace('_', ' ')}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modelo base:</span>
              <span className="font-bold text-foreground">{currentTemplate.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantidade de slides:</span>
              <span className="font-bold text-foreground">{slidesCount} slide(s)</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border font-bold text-sm">
              <span className="text-foreground">Total de créditos:</span>
              <span className="text-purple-600 dark:text-purple-400">
                {calculatedCredits} créditos
              </span>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExecuteSave}
              disabled={submitting}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold gap-1.5"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Confirmar e {pendingSubmitStatus === 'draft' ? 'Salvar' : 'Publicar'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            setCaption(`${item.title} — ${item.description}`)
          }
          if (!headline) {
            setHeadline(item.title)
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
