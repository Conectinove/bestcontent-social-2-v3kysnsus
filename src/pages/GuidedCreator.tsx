import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Video,
  Clapperboard,
  Clock,
  Layout as LayoutIcon,
  FileText,
  Upload,
  Download,
  Sparkles,
  Save,
  MessageSquare,
  Instagram,
  Facebook,
  Linkedin,
  Info,
  Check,
  Film,
} from 'lucide-react'
import { WhatsAppIcon, TikTokIcon, YouTubeIcon } from './CreateHub'
import { useSocial } from '@/context/SocialContext'
import { useAuth } from '@/context/AuthContext'
import { createPost } from '@/services/posts'
import { generateVideoScript } from '@/services/ai'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export interface VideoFormatOption {
  id: string
  name: string
  dimensions: string
  width: number
  height: number
  aspectRatioClass: string
  gradient: string
  mainNetwork: 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin'
  networks: ('instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin')[]
  isTop?: boolean
  description: string
}

export const VIDEO_FORMATS: VideoFormatOption[] = [
  {
    id: 'reels-shorts-ig',
    name: 'Reels / Shorts',
    dimensions: '1080 × 1920px',
    width: 1080,
    height: 1920,
    aspectRatioClass: 'w-14 h-25 rounded-2xl',
    gradient: 'from-[#ec4899] via-[#d946ef] to-[#8b5cf6]', // pink-fuchsia-violet
    mainNetwork: 'instagram',
    networks: ['instagram', 'facebook', 'tiktok', 'youtube'],
    isTop: true,
    description: 'Vídeo vertical 9:16 otimizado para Instagram Reels com alto alcance.',
  },
  {
    id: 'reels-shorts-fb',
    name: 'Reels / Shorts',
    dimensions: '1080 × 1920px',
    width: 1080,
    height: 1920,
    aspectRatioClass: 'w-14 h-25 rounded-2xl',
    gradient: 'from-[#2563eb] via-[#3b82f6] to-[#06b6d4]', // blue-cyan
    mainNetwork: 'facebook',
    networks: ['instagram', 'facebook', 'tiktok', 'youtube'],
    isTop: true,
    description: 'Vídeo vertical otimizado para reels e feed do Facebook.',
  },
  {
    id: 'reels-shorts-tt',
    name: 'Reels / Shorts',
    dimensions: '1080 × 1920px',
    width: 1080,
    height: 1920,
    aspectRatioClass: 'w-14 h-25 rounded-2xl',
    gradient: 'from-[#f43f5e] via-[#fb7185] to-[#06b6d4]', // rose-cyan (tiktok style)
    mainNetwork: 'tiktok',
    networks: ['instagram', 'facebook', 'tiktok', 'youtube'],
    isTop: true,
    description: 'Vídeo vertical nativo para o algoritmo dinâmico do TikTok.',
  },
  {
    id: 'reels-shorts-yt',
    name: 'Reels / Shorts',
    dimensions: '1080 × 1920px',
    width: 1080,
    height: 1920,
    aspectRatioClass: 'w-14 h-25 rounded-2xl',
    gradient: 'from-[#ea580c] via-[#f97316] to-[#fb923c]', // orange (youtube shorts style)
    mainNetwork: 'youtube',
    networks: ['instagram', 'facebook', 'tiktok', 'youtube'],
    isTop: true,
    description: 'Vertical 9:16 para YouTube Shorts com alto potencial de inscritos.',
  },
  {
    id: 'video-portrait-ig',
    name: 'Vídeo Portrait',
    dimensions: '1080 × 1350px',
    width: 1080,
    height: 1350,
    aspectRatioClass: 'w-16 h-22 rounded-2xl',
    gradient: 'from-[#8b5cf6] via-[#d946ef] to-[#ec4899]',
    mainNetwork: 'instagram',
    networks: ['instagram', 'facebook', 'linkedin'],
    isTop: false,
    description: 'Formato vertical 4:5 ideal para feeds tradicionais de vídeo.',
  },
]

const DURATIONS = [
  { id: 15, label: '15 segundos' },
  { id: 30, label: '30 segundos' },
  { id: 60, label: '60 segundos' },
  { id: 90, label: '90 segundos' },
]

const TEMPLATES = [
  {
    id: 'tutorial',
    title: 'Tutorial Rápido (3 Passos)',
    desc: 'Ensine um hack prático em 30s com gancho magnético e retenção alta',
    category: 'educativo',
    duration: 30,
    hook: 'Pare de perder tempo com isso agora mesmo!',
    beats: ['0-3s: Gancho', '3-12s: O Erro', '12-24s: 3 Passos', '24-30s: CTA'],
  },
  {
    id: 'antes-depois',
    title: 'Antes e Depois Transformador',
    desc: 'Evolução quadro a quadro de um caso real com alto impacto visual',
    category: 'autoridade',
    duration: 25,
    hook: 'Você não vai acreditar como isso estava antes...',
    beats: ['0-3s: Choque', '3-10s: Situação Caótica', '10-14s: A Virada', '14-25s: O Depois'],
  },
  {
    id: 'depoimento-ugc',
    title: 'Depoimento de Cliente (UGC)',
    desc: 'Prova social autêntica no estilo selfie gravado por cliente satisfeito',
    category: 'autoridade',
    duration: 45,
    hook: 'Eu preciso te contar o que aconteceu depois de 14 dias...',
    beats: [
      '0-5s: Declaração',
      '5-18s: A Dor Antiga',
      '18-35s: Resultado Real',
      '35-45s: Recomendação',
    ],
  },
  {
    id: 'tour-negocio',
    title: 'Tour pelo Negócio & Espaço',
    desc: 'Passeio acolhedor pela estrutura da sua empresa gerando conexão e confiança',
    category: 'storytelling',
    duration: 35,
    hook: 'Já imaginou como é trabalhar aqui dentro?',
    beats: [
      '0-4s: Entrada & Boas-vindas',
      '4-15s: Espaço & Detalhes',
      '15-25s: Equipe',
      '25-35s: Convite',
    ],
  },
  {
    id: 'faq-dinamico',
    title: 'Perguntas Frequentes (FAQ)',
    desc: 'Responda a dúvida mais enviada na caixinha de forma direta e sem jargões',
    category: 'educativo',
    duration: 30,
    hook: 'Todo dia alguém me pergunta isso na caixinha...',
    beats: [
      '0-4s: A Dúvida',
      '4-18s: A Resposta Clara',
      '18-26s: Dica de Ouro',
      '26-30s: Pergunta Final',
    ],
  },
  {
    id: 'trend-audio',
    title: 'Trend com Áudio do Momento',
    desc: 'Humor ou situação relacionável sincronizada com o som que está viralizando',
    category: 'engajamento',
    duration: 15,
    hook: 'Pov: Quando o cliente pede algo para ontem...',
    beats: ['0-3s: Situação inicial', '3-10s: Sincronia com áudio', '10-15s: Punchline'],
  },
  {
    id: 'bastidores-producao',
    title: 'Bastidores da Produção (ASMR)',
    desc: 'Mostre o cuidado e carinho ao preparar um pedido ou serviço nos mínimos detalhes',
    category: 'storytelling',
    duration: 35,
    hook: 'Vem ver o carinho que colocamos em cada detalhe...',
    beats: [
      '0-4s: Início do processo',
      '4-15s: Manuseio com som imersivo',
      '15-25s: Bilhete especial',
      '25-35s: Finalização',
    ],
  },
  {
    id: 'lancamento-teaser',
    title: 'Lançamento de Produto Teaser',
    desc: 'Cortes rápidos e iluminação cinematográfica para despertar desejo imediato',
    category: 'promo',
    duration: 20,
    hook: 'Você pediu, nós criamos.',
    beats: [
      '0-3s: Revelação do mistério',
      '3-10s: Detalhes do produto',
      '10-16s: Benefício central',
      '16-20s: Oferta de estreia',
    ],
  },
  {
    id: 'top5-list',
    title: 'Lista Rápida (Top 5 Dicas)',
    desc: 'Dicas numeradas em ritmo acelerado com salvamento e compartilhamento alto',
    category: 'educativo',
    duration: 40,
    hook: 'Se eu soubesse disso há 2 anos estaria muito mais longe...',
    beats: [
      '0-4s: Promessa da lista',
      '4-18s: Dicas 1 e 2',
      '18-30s: Dica 3 e 4',
      '30-40s: Dica de ouro',
    ],
  },
  {
    id: 'aula-30s',
    title: 'Conteúdo Educativo em 30s',
    desc: 'Micro-aula condensada explicando um conceito valioso de forma descomplicada',
    category: 'educativo',
    duration: 30,
    hook: 'Em 30 segundos eu vou te provar uma coisa...',
    beats: [
      '0-3s: Desafio',
      '3-15s: Conceito simplificado',
      '15-25s: Aplicação prática',
      '25-30s: CTA para seguir',
    ],
  },
  {
    id: 'evento-live',
    title: 'Chamada para Evento / Live Urgente',
    desc: 'Gera senso de urgência imediato para transmissão ou evento presencial',
    category: 'promo',
    duration: 20,
    hook: 'ESTAMOS AO VIVO AGORA: Entra na sala!',
    beats: ['0-4s: Alerta ao vivo', '4-12s: O que está rolando', '12-20s: Botão de entrada'],
  },
  {
    id: 'linkedin-case',
    title: 'Estudo de Caso Executivo B2B',
    desc: 'Depoimento de liderança e métricas de retorno em formato horizontal 16:9',
    category: 'autoridade',
    duration: 60,
    hook: 'Eficiência operacional não é sorte, é método.',
    beats: [
      '0-8s: Métrica de destaque',
      '8-25s: O Desafio',
      '25-45s: Implementação',
      '45-60s: Resultados consolidados',
    ],
  },
]

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function GuidedCreator() {
  const navigate = useNavigate()
  const { brands, refreshAll } = useSocial()
  const { user } = useAuth()

  // Stepper etapas:
  // 1 = Formato
  // 2 = Template
  // 3 = Ideia (Prompt & Duração)
  // 4 = Storyboard (Roteiro com IA)
  // 5 = Finalizar (Mídia & Publicação)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [selectedFormatId, setSelectedFormatId] = useState<string>('reels-shorts-ig')
  const [activeFilter, setActiveFilter] = useState<string>('all')

  // Dados do vídeo
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(30)
  const [template, setTemplate] = useState('tutorial')
  const [script, setScript] = useState('')
  const [media, setMedia] = useState<File | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Carousel ref
  const carouselRef = useRef<HTMLDivElement>(null)

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Filtragem dos cards
  const filteredFormats = VIDEO_FORMATS.filter((f) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'instagram') return f.networks.includes('instagram')
    if (activeFilter === 'facebook') return f.networks.includes('facebook')
    if (activeFilter === 'linkedin') return f.networks.includes('linkedin')
    if (activeFilter === 'tiktok') return f.networks.includes('tiktok')
    if (activeFilter === 'youtube') return f.networks.includes('youtube')
    return true
  })

  const selectedFormat = VIDEO_FORMATS.find((f) => f.id === selectedFormatId) || VIDEO_FORMATS[0]

  const handleGenerateScript = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Atenção', description: 'Escreva a ideia ou tema do vídeo.' })
      return
    }
    setAiLoading(true)
    try {
      const result = await generateVideoScript({
        prompt,
        duration: Number(duration) || 30,
        objective: selectedFormat.mainNetwork,
      })
      const scriptText =
        typeof result === 'string'
          ? result
          : (result as any)?.script || (result as any)?.content || ''
      setScript(scriptText || 'Roteiro gerado com sucesso. Edite os ganchos e chamadas para ação.')
      toast({ title: 'Roteiro gerado!', description: 'Edite conforme necessário.' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setAiLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.id || !brands[0]?.id) {
      toast({ title: 'Atenção', description: 'Crie uma marca primeiro.' })
      navigate('/app/brands')
      return
    }
    setSaving(true)
    try {
      await createPost({
        user: user.id,
        brand: brands[0].id,
        content: prompt || `Vídeo ${selectedFormat.name}`,
        caption: script,
        platform:
          selectedFormat.mainNetwork === 'instagram'
            ? 'Instagram'
            : selectedFormat.mainNetwork === 'facebook'
              ? 'Facebook'
              : 'TikTok',
        status: 'draft',
        duration,
        script_json: JSON.stringify({
          prompt,
          duration,
          template,
          script,
          format: selectedFormat.name,
          dimensions: selectedFormat.dimensions,
        }),
        template_id: `video_${template}`,
      })
      refreshAll()
      toast({ title: 'Vídeo salvo!', description: 'Rascunho salvo na biblioteca.' })
      navigate('/app/feed')
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadScript = () => {
    downloadFile(script || 'Roteiro vazio', `roteiro-${Date.now()}.txt`, 'text/plain;charset=utf-8')
  }

  const handleDownloadMetadata = () => {
    const metadata = {
      prompt,
      duration,
      template,
      format: selectedFormat.name,
      dimensions: selectedFormat.dimensions,
      script,
      mediaName: media?.name || null,
      createdAt: new Date().toISOString(),
    }
    downloadFile(
      JSON.stringify(metadata, null, 2),
      `metadata-video-${Date.now()}.json`,
      'application/json',
    )
  }

  const renderNetworkMiniIcon = (
    network: 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin',
    className = 'w-3 h-3',
  ) => {
    switch (network) {
      case 'instagram':
        return <Instagram className={className} />
      case 'facebook':
        return <Facebook className={className} />
      case 'tiktok':
        return <TikTokIcon className={className} />
      case 'youtube':
        return <YouTubeIcon className={className} />
      case 'linkedin':
        return <Linkedin className={className} />
      default:
        return null
    }
  }

  const selectedTemplateObj = TEMPLATES.find((t) => t.id === template)

  return (
    <div className="min-h-full flex flex-col justify-between max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4 animate-fade-in relative">
      {/* 1. Barra superior de contexto (Pill centrada) */}
      <div className="flex items-center justify-center mb-4">
        <div className="inline-flex items-center gap-3 bg-muted/60 dark:bg-card border border-border/80 rounded-full px-4 py-1.5 shadow-2xs text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 text-foreground">
            <Clapperboard className="w-4 h-4 text-primary" />
            <span>
              Modo <strong className="font-bold">Vídeo com IA</strong>
            </span>
          </div>
          <span className="text-muted-foreground/60">·</span>
          <span className="text-muted-foreground text-xs">Escolha o formato</span>
          <span className="text-muted-foreground/60">·</span>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <span>🪙</span>
            <span>0 cr</span>
          </div>
          <button
            onClick={() => navigate('/app/criar')}
            className="text-xs font-semibold text-primary hover:underline ml-1 cursor-pointer transition-colors"
          >
            Trocar
          </button>
        </div>
      </div>

      {/* 2. Stepper de 5 Etapas Centrado */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-3 text-xs font-medium text-muted-foreground mb-6 overflow-x-auto pb-1 no-scrollbar">
        {/* Etapa 1: Formato */}
        <div
          onClick={() => setStep(1)}
          className={`flex items-center gap-1 cursor-pointer shrink-0 ${
            step >= 1 ? 'text-foreground font-bold' : ''
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              step === 1 ? 'bg-foreground ring-4 ring-foreground/10' : 'bg-primary'
            }`}
          />
          <span>Formato</span>
        </div>

        <div className="w-5 sm:w-8 h-px bg-border shrink-0" />

        {/* Etapa 2: Template */}
        <div
          onClick={() => setStep(2)}
          className={`flex items-center gap-1 cursor-pointer shrink-0 ${
            step === 2
              ? 'text-foreground font-bold'
              : step > 2
                ? 'text-foreground'
                : 'text-muted-foreground/60'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              step === 2
                ? 'bg-foreground ring-4 ring-foreground/10'
                : step > 2
                  ? 'bg-primary'
                  : 'bg-muted-foreground/40'
            }`}
          />
          <span>Template</span>
        </div>

        <div className="w-5 sm:w-8 h-px bg-border shrink-0" />

        {/* Etapa 3: Ideia */}
        <div
          onClick={() => setStep(3)}
          className={`flex items-center gap-1 cursor-pointer shrink-0 ${
            step === 3
              ? 'text-foreground font-bold'
              : step > 3
                ? 'text-foreground'
                : 'text-muted-foreground/60'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              step === 3
                ? 'bg-foreground ring-4 ring-foreground/10'
                : step > 3
                  ? 'bg-primary'
                  : 'bg-muted-foreground/40'
            }`}
          />
          <span>Ideia</span>
        </div>

        <div className="w-5 sm:w-8 h-px bg-border shrink-0" />

        {/* Etapa 4: Storyboard */}
        <div
          onClick={() => setStep(4)}
          className={`flex items-center gap-1 cursor-pointer shrink-0 ${
            step === 4
              ? 'text-foreground font-bold'
              : step > 4
                ? 'text-foreground'
                : 'text-muted-foreground/60'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              step === 4
                ? 'bg-foreground ring-4 ring-foreground/10'
                : step > 4
                  ? 'bg-primary'
                  : 'bg-muted-foreground/40'
            }`}
          />
          <span>Storyboard</span>
        </div>

        <div className="w-5 sm:w-8 h-px bg-border shrink-0" />

        {/* Etapa 5: Finalizar */}
        <div
          onClick={() => setStep(5)}
          className={`flex items-center gap-1 cursor-pointer shrink-0 ${
            step === 5 ? 'text-foreground font-bold' : 'text-muted-foreground/60'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              step === 5 ? 'bg-foreground ring-4 ring-foreground/10' : 'bg-muted-foreground/40'
            }`}
          />
          <span>Finalizar</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ETAPA 1: ESCOLHA DO FORMATO DO VÍDEO                           */}
      {/* ============================================================== */}
      {step === 1 && (
        <div className="flex flex-col flex-1 animate-fade-in space-y-6">
          {/* Título & Subtítulo */}
          <div className="text-center space-y-1.5 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">
                Escolha o Formato do Vídeo
              </h1>
              <button
                type="button"
                title="Enviar feedback sobre formatos de vídeo"
                onClick={() =>
                  toast({
                    title: 'Feedback',
                    description: 'Sugira novos formatos de vídeo para nossa equipe!',
                  })
                }
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Selecione o tamanho e a rede social do seu vídeo.
            </p>
          </div>

          {/* Chips de filtro: Todas, Instagram, Facebook, LinkedIn, TikTok, YouTube (sem "Em breve") */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar justify-start sm:justify-center">
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

            <button
              onClick={() => setActiveFilter('tiktok')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                activeFilter === 'tiktok'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <TikTokIcon className="w-3.5 h-3.5" />
              <span>TikTok</span>
            </button>

            <button
              onClick={() => setActiveFilter('youtube')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                activeFilter === 'youtube'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <YouTubeIcon className="w-3.5 h-3.5" />
              <span>YouTube</span>
            </button>
          </div>

          {/* Carrossel de Cards de Formato de Vídeo */}
          <div className="relative py-4 px-1 group/carousel">
            <button
              onClick={() => scrollCarousel('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white dark:bg-card shadow-lg border border-border flex items-center justify-center text-foreground hover:bg-muted transition-all opacity-80 hover:opacity-100"
              aria-label="Formato anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

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
                    onClick={() => setSelectedFormatId(fmt.id)}
                    className={`relative shrink-0 w-64 h-88 rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 snap-center select-none cursor-pointer hover:scale-[1.02] hover:shadow-2xl ${
                      isSelected
                        ? 'ring-4 ring-primary ring-offset-4 ring-offset-background shadow-2xl scale-[1.02]'
                        : 'shadow-lg'
                    } bg-gradient-to-b ${fmt.gradient}`}
                  >
                    {/* Top Row: Main network icon + TOP badge + film icon */}
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
                        <div className="w-6 h-6 rounded-md bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                          <Film className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* Center: Retângulo Proporção com Check se Selecionado */}
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

                    {/* Bottom: Informações, Dimensões e Redes */}
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
      {/* ETAPA 2: TEMPLATE                                              */}
      {/* ============================================================== */}
      {step === 2 && (
        <div className="flex flex-col flex-1 animate-fade-in space-y-6 max-w-4xl mx-auto w-full">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              Escolha a Estrutura do Roteiro
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Formatos testados para retenção e engajamento em vídeos verticais.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {TEMPLATES.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setTemplate(t.id)
                  if (t.duration) setDuration(t.duration)
                  if (t.hook && !prompt) setPrompt(t.hook)
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  template === t.id
                    ? 'border-purple-600 ring-2 ring-purple-600/30 bg-purple-600/5 shadow-md'
                    : 'border-border hover:border-purple-500/40 bg-card'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <LayoutIcon className="w-4 h-4" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {t.duration}s
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm text-foreground">{t.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-border/60">
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block truncate">
                    Gancho: "{t.hook}"
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ETAPA 3: IDEIA & DURAÇÃO                                       */}
      {/* ============================================================== */}
      {step === 3 && (
        <div className="flex flex-col flex-1 animate-fade-in space-y-6 max-w-3xl mx-auto w-full">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              Sobre o que será o vídeo?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Informe o tema e defina a duração ideal para o seu objetivo.
            </p>
          </div>

          <Card className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1">Tema / Ideia Central</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: 3 erros que você comete ao anunciar na internet e como corrigir..."
                className="text-sm h-28"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" /> Duração Alvo
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {DURATIONS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDuration(d.id)}
                    className={`py-3 px-2 rounded-xl border text-center transition-all ${
                      duration === d.id
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    <span className="text-xs block font-bold">{d.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* ETAPA 4: STORYBOARD / ROTEIRO                                  */}
      {/* ============================================================== */}
      {step === 4 && (
        <div className="flex flex-col flex-1 animate-fade-in space-y-6 max-w-3xl mx-auto w-full">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              Storyboard & Roteiro com IA
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Crie o gancho de 3 segundos, desenvolvimento e chamada para ação.
            </p>
          </div>

          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold">Roteiro Detalhado</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateScript}
                disabled={aiLoading}
                className="text-xs text-primary gap-1 h-7"
              >
                <Sparkles className="w-3.5 h-3.5" />{' '}
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Gerar com IA'}
              </Button>
            </div>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Clique em 'Gerar com IA' ou escreva o roteiro do vídeo..."
              className="text-xs sm:text-sm h-56 font-mono"
            />
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* ETAPA 5: FINALIZAR & SALVAR                                    */}
      {/* ============================================================== */}
      {step === 5 && (
        <div className="flex flex-col flex-1 animate-fade-in space-y-6 max-w-3xl mx-auto w-full">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              Revisar e Finalizar Vídeo
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Anexe materiais brutos, baixe os arquivos ou salve direto na biblioteca.
            </p>
          </div>

          <Card className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {selectedFormat.name} ({selectedFormat.dimensions})
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {duration}s
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {selectedTemplateObj?.title}
              </Badge>
            </div>

            {/* Mídia upload opcional */}
            <div className="border-2 border-dashed border-border rounded-xl p-5 text-center bg-muted/20">
              {media ? (
                <div className="space-y-1">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500" />
                  <p className="text-xs font-semibold">{media.name}</p>
                </div>
              ) : (
                <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {media ? 'Arquivo anexado' : 'Vídeo bruto ou gravação (opcional)'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => document.getElementById('final-video-file')?.click()}
              >
                Selecionar arquivo
              </Button>
              <input
                id="final-video-file"
                type="file"
                accept="video/*,image/*"
                className="hidden"
                onChange={(e) => setMedia(e.target.files?.[0] || null)}
              />
            </div>

            {/* Prévia do roteiro */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-muted-foreground uppercase">Roteiro</h4>
              <p className="text-xs text-foreground whitespace-pre-line bg-muted/40 rounded-xl p-3 max-h-36 overflow-y-auto">
                {script || 'Nenhum roteiro informado.'}
              </p>
            </div>

            {/* Botões de Download */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadScript}
                className="text-xs gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Baixar Script (.txt)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadMetadata}
                className="text-xs gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Baixar Metadados (.json)
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. Rodapé Fixo de Navegação                                     */}
      {/* ============================================================== */}
      <div className="border-t border-border/80 pt-4 mt-6 flex items-center justify-between gap-4">
        {/* Esquerda: Botão Voltar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (step === 1) {
              navigate('/app/criar')
            } else {
              setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5)
            }
          }}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
        >
          ← Voltar
        </Button>

        {/* Direita: Botão Continuar / Salvar */}
        <div>
          {step < 5 ? (
            <Button
              size="sm"
              disabled={!selectedFormatId}
              onClick={() => setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4 | 5)}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs px-5 h-9 rounded-xl shadow-md gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <span>Continuar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs px-5 h-9 rounded-xl shadow-md gap-1.5 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Salvar na Biblioteca</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
