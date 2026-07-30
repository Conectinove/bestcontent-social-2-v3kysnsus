import { useState, useEffect, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  Smartphone,
  Layers,
  Video,
  FileText,
  Target,
  CheckCircle2,
  Wand2,
  ArrowRight,
  Compass,
  Link2,
  Edit3,
  Bot,
  Send,
  Loader2,
  Save,
  Calendar,
  Share2,
  ChevronLeft,
  RefreshCw,
  Palette,
  Image as ImageIcon,
  Type,
  Maximize2,
  ShieldAlert,
  SlidersHorizontal,
  Upload,
  Undo2,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import { useSocial } from '@/context/SocialContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { InspirationLibraryModal, InspirationItem } from '@/components/InspirationLibraryModal'
import {
  sendSocialStudioChat,
  generateStructuredPost,
  StructuredPostData,
} from '@/services/social_studio'
import { createScheduledPost } from '@/services/scheduled_posts'

const PLATFORMS = [
  { name: 'Instagram', icon: '📷' },
  { name: 'TikTok', icon: '🎵' },
  { name: 'YouTube', icon: '▶️' },
  { name: 'Facebook', icon: '📘' },
  { name: 'LinkedIn', icon: '💼' },
  { name: 'Twitter/X', icon: '🐦' },
]

const FORMATS = [
  {
    id: 'story',
    name: 'Stories Único',
    ratio: '9:16',
    dimensions: '1080 × 1920px',
    icon: Smartphone,
  },
  {
    id: 'carousel',
    name: 'Carrossel',
    ratio: '4:5 / 1:1',
    dimensions: '1080 × 1350px',
    icon: Layers,
  },
  { id: 'video', name: 'Vídeo / Reel', ratio: '9:16', dimensions: '1080 × 1920px', icon: Video },
  { id: 'flyer', name: 'Post / Flyer', ratio: '1:1', dimensions: '1080 × 1080px', icon: FileText },
]

const OBJECTIVES = [
  { id: 'engage', title: 'Engajar', description: 'Aumentar interação e comunidade' },
  { id: 'sell', title: 'Vender', description: 'Converter seguidores em clientes' },
]

const APPROACHES = [
  { id: 'oferta', name: 'Oferta', icon: '🏷️' },
  { id: 'storytelling', name: 'Storytelling', icon: '📖' },
  { id: 'prova_social', name: 'Prova social', icon: '✅' },
]

const CHECKLIST_STORYTELLING = [
  'Abrir com gancho emocional: uma cena, um problema real, uma frase que crie empatia imediata',
  'Construir uma mini-narrativa com início (problema), meio (descoberta) e fim (transformação com o produto)',
  'A transição da história para a oferta deve ser natural — o produto aparece como solução, não como interrupção',
  'Usar linguagem sensorial e descriptiva: faça o leitor sentir, visualizar, se identificar',
  'CTA suave integrado à narrativa: "foi assim que eu resolvi" → "quer experimentar também?"',
  'Evitar parecer anúncio — o leitor deve sentir que está consumindo conteúdo, não sendo vendido',
  'Design vertical otimizado para tela cheia do celular',
  'Texto centralizado com fonte grande e legível',
  'Elementos visuais que guiem o olhar de cima para baixo',
  'Área de segurança: evitar texto nos 15% superior e inferior',
]

export default function GuidedCreator() {
  const { brands, addPost } = useSocial()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Step state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram')
  const [selectedFormat, setSelectedFormat] = useState('story')

  // Step 2
  const [selectedObjective, setSelectedObjective] = useState('sell')
  const [selectedApproach, setSelectedApproach] = useState('storytelling')

  // Step 3 Source & Inspiration Modal
  const [inspirationModalOpen, setInspirationModalOpen] = useState(false)
  const [selectedInspiration, setSelectedInspiration] = useState<InspirationItem | null>(null)
  const [customLink, setCustomLink] = useState('')

  // Step 4 AI Editor Canvas Data
  const [selectedBrandId, setSelectedBrandId] = useState(brands[0]?.id || '')
  const [postData, setPostData] = useState<StructuredPostData>({
    goal: 'Vender o "Plano de Bordo Realizador" como ferramenta de transformação definitiva do MudarCurso.com.br',
    layout: 'Vertical (9:16), aspecto mapa de viagem/bússola, pessoa olhando horizonte fascinado',
    headline: 'Cansado de apenas existir? Chegou a hora de viver a sua vocação.',
    body: 'A jornada para a sua "Vida Boa" começa com um mapa real.\nChega de se sentir estagnado ou sem direção em 2026.\nCom o Plano de Bordo Realizador, você domina sua rotina e encontra propósito.',
    offer: 'Acesso imediato: Oportunidade especial de R$ 1.299,99 por R$ 0,00',
    cta: 'TOQUE AQUI E MUDE TUDO 🚀',
    footer: '@ronaldo.barreto1',
  })

  // Theme & Background customizer
  const [bgTheme, setBgTheme] = useState<'purple' | 'dark' | 'orange' | 'blue' | 'green'>('purple')
  const [customBgImage, setCustomBgImage] = useState<string>(
    'https://img.usecurling.com/p/600/900?q=wanderer%20mountain%20compass&color=purple',
  )
  const [originalPostData, setOriginalPostData] = useState<StructuredPostData | null>(null)
  const [originalBgTheme, setOriginalBgTheme] = useState<
    'purple' | 'dark' | 'orange' | 'blue' | 'green'
  >('purple')
  const [originalBgImage, setOriginalBgImage] = useState<string>('')
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [refining, setRefining] = useState(false)

  // AI Agent Chat Drawer
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'user' | 'agent'; text: string; time?: string }>
  >([
    {
      sender: 'agent',
      text: '🚀 Olá! Sou o Social Studio IA do MudarCurso.com.br. Criei esta arte baseada no modelo de alta conversão para o Plano de Bordo Realizador! O que gostaria de modificar?',
      time: '05:34',
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  // Submission state
  const [savingStatus, setSavingStatus] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const activeBrand = brands.find((b: any) => b.id === selectedBrandId) || brands[0]

  useEffect(() => {
    if (brands.length > 0 && !selectedBrandId) {
      setSelectedBrandId(brands[0].id)
    }
  }, [brands])

  const handleSelectInspiration = (inspiration: InspirationItem) => {
    setSelectedInspiration(inspiration)
    let newData: StructuredPostData
    if (inspiration.id === 'plano-de-bordo') {
      newData = {
        goal: 'Vender o "Plano de Bordo Realizador" como ferramenta de transformação para MudarCurso.com.br',
        layout: 'Vertical (9:16), bússola luminosa, aspecto mapa de jornada',
        headline: 'Cansado de apenas existir? Chegou a hora de viver a sua vocação.',
        body: 'A jornada para a sua "Vida Boa" começa com um mapa real.\nChega de se sentir estagnado ou sem direção em 2026.\nCom o Plano de Bordo Realizador, você domina sua rotina.',
        offer: 'Acesso imediato: Oportunidade especial de R$ 1.299,99 por R$ 0,00',
        cta: 'TOQUE AQUI E MUDE TUDO 🚀',
        footer: '@ronaldo.barreto1',
      }
    } else {
      newData = {
        goal: inspiration.description,
        layout: `Formato ${inspiration.format} otimizado para ${inspiration.platform}`,
        headline: inspiration.title,
        body: inspiration.description,
        offer: 'Aproveite a oportunidade e transforme seu conteúdo',
        cta: 'SAIBA MAIS',
        footer: activeBrand?.name || '@mudarcurso.br',
      }
    }
    setPostData(newData)
    setOriginalPostData(newData)
    setOriginalBgTheme(bgTheme)
    setOriginalBgImage(customBgImage)
  }

  const handleBgUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      toast({ title: 'Formato inválido', description: 'Use PNG ou JPG.', variant: 'destructive' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo 5MB.', variant: 'destructive' })
      return
    }
    setCustomBgImage(URL.createObjectURL(file))
    toast({ title: 'Imagem carregada', description: 'Fundo atualizado com sucesso.' })
  }

  const handleRevert = () => {
    if (originalPostData) {
      setPostData(originalPostData)
      setBgTheme(originalBgTheme)
      setCustomBgImage(originalBgImage)
      toast({ title: 'Revertido', description: 'Alterações desfeitas para a versão original.' })
    }
  }

  const handleRefineWithAI = async () => {
    setRefining(true)
    try {
      const topic = selectedInspiration?.title || 'Plano de Bordo Realizador'
      const res = await generateStructuredPost(topic, selectedApproach)
      setPostData(res)
      setOriginalPostData(res)
      setOriginalBgTheme(bgTheme)
      setOriginalBgImage(customBgImage)
      toast({ title: 'Prompt refinado!', description: 'A IA otimizou o conteúdo.' })
      setStep(4)
    } catch {
      toast({ title: 'Aviso', description: 'Usando modelo base.' })
      setStep(4)
    } finally {
      setRefining(false)
    }
  }

  const handleStartGeneration = async (topicName?: string) => {
    setGenerating(true)
    try {
      const topic = topicName || selectedInspiration?.title || 'Plano de Bordo Realizador'
      const res = await generateStructuredPost(topic, selectedApproach)
      setPostData(res)
      setOriginalPostData(res)
      setOriginalBgTheme(bgTheme)
      setOriginalBgImage(customBgImage)
      toast({
        title: 'Arte gerada com IA!',
        description: 'Estrutura e textos criados com sucesso.',
      })
      setStep(4)
    } catch (err) {
      toast({ title: 'Aviso', description: 'Usando modelo base de conversão.' })
      setStep(4)
    } finally {
      setGenerating(false)
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }])
    setChatLoading(true)

    try {
      const res = await sendSocialStudioChat(
        `Ajuste para o post com Headline: "${postData.headline}" e CTA: "${postData.cta}". Pedido do usuário: ${userMsg}`,
        conversationId,
      )
      setConversationId(res.conversation_id)
      setChatMessages((prev) => [
        ...prev,
        { sender: 'agent', text: res.content, time: new Date().toLocaleTimeString().slice(0, 5) },
      ])

      // Auto adjust if keywords present
      const lower = userMsg.toLowerCase()
      if (lower.includes('headline') || lower.includes('título')) {
        setPostData((prev) => ({
          ...prev,
          headline: 'Cansado de adiar seus sonhos? Descubra o caminho exato.',
        }))
      } else if (
        lower.includes('cor') ||
        lower.includes('fundo') ||
        lower.includes('mudar cores')
      ) {
        setBgTheme((prev) => (prev === 'purple' ? 'dark' : prev === 'dark' ? 'orange' : 'purple'))
      } else if (lower.includes('oferta') || lower.includes('preço')) {
        setPostData((prev) => ({
          ...prev,
          offer: 'Inscrições Abertas: De R$ 1.299,99 por R$ 0,00 HOJE',
        }))
      }
    } catch (err) {
      toast({ title: 'Erro na IA', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setChatLoading(false)
    }
  }

  const handleFinalize = async (status: 'draft' | 'scheduled' | 'published') => {
    if (!selectedBrandId) {
      toast({ title: 'Atenção', description: 'Selecione uma marca primeiro.' })
      return
    }
    setSavingStatus(status)
    try {
      const captionText = `${postData.headline}\n\n${postData.body}\n\n${postData.offer}\n\n👉 ${postData.cta}\n\n#MudarCurso #PlanoDeBordo #PropósitoDeVida`
      const record = await addPost({
        brandId: selectedBrandId,
        platform: selectedPlatform,
        content: `${postData.headline} | ${postData.body}`,
        caption: captionText,
        status,
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
      })

      if (status === 'scheduled' && record?.id) {
        await createScheduledPost({
          user: user?.id,
          post: record.id,
          scheduled_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'pending',
        })
      }

      toast({
        title:
          status === 'published'
            ? 'Post Publicado!'
            : status === 'scheduled'
              ? 'Post Agendado!'
              : 'Rascunho Salvo!',
        description: 'Sua arte e conteúdo foram integrados à plataforma.',
      })
      navigate('/app/feed')
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSavingStatus(null)
    }
  }

  const currentFormatObj = FORMATS.find((f) => f.id === selectedFormat) || FORMATS[0]

  return (
    <div className="min-h-screen bg-background pb-12 animate-fade-in">
      {/* Top Header Step Indicator */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-20 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (step > 1 ? setStep((s) => (s - 1) as any) : navigate('/app/feed'))}
              className="text-xs text-muted-foreground gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </Button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <h1 className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Criador de Conteúdo Guiado
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className={step >= 1 ? 'font-semibold text-primary' : 'text-muted-foreground'}>
              1. Formato
            </span>
            <span className="text-muted-foreground">→</span>
            <span className={step >= 2 ? 'font-semibold text-primary' : 'text-muted-foreground'}>
              2. Abordagem
            </span>
            <span className="text-muted-foreground">→</span>
            <span className={step >= 3 ? 'font-semibold text-primary' : 'text-muted-foreground'}>
              3. Fonte
            </span>
            <span className="text-muted-foreground">→</span>
            <span className={step === 4 ? 'font-semibold text-primary' : 'text-muted-foreground'}>
              4. Studio IA
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] bg-primary/10 text-primary border-primary/20"
            >
              ⚡ 12 edições grátis
            </Badge>
            {step === 4 && (
              <Button
                onClick={() => handleFinalize('published')}
                disabled={!!savingStatus}
                size="sm"
                className="bg-primary text-white text-xs font-semibold gap-1"
              >
                {savingStatus === 'published' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Finalizar'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6">
        {/* STEP 1: Format & Platform */}
        {step === 1 && (
          <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">1. Selecione a Plataforma e Formato</h2>
              <p className="text-xs text-muted-foreground">
                A IA ajustará a proporção visual e os limites de zona segura para cada canal.
              </p>
            </div>

            {/* Platforms Grid */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground block">Plataforma</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setSelectedPlatform(p.name)}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      selectedPlatform === p.name
                        ? 'border-primary bg-primary/10 text-primary shadow-sm font-semibold scale-105'
                        : 'border-border bg-card hover:border-primary/50 text-muted-foreground'
                    }`}
                  >
                    <span className="text-2xl">{p.icon}</span>
                    <span className="text-xs">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Formats Grid */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground block">
                Formato e Dimensão Exacta
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {FORMATS.map((f) => {
                  const Icon = f.icon
                  const isSelected = selectedFormat === f.id
                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFormat(f.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 relative ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                          : 'border-border bg-card hover:border-border/80'
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary absolute top-3 right-3" />
                      )}
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{f.name}</h3>
                        <p className="text-xs text-primary font-semibold mt-0.5">{f.ratio}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{f.dimensions}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep(2)}
                className="bg-primary text-white text-xs font-semibold px-6 gap-2"
              >
                Próximo Passo <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Objective & Approach */}
        {step === 2 && (
          <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">2. Defina o Objetivo e a Abordagem</h2>
              <p className="text-xs text-muted-foreground">
                Determine a estratégia que guiará a IA no tom e estrutura do conteúdo.
              </p>
            </div>

            {/* Objective Cards */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground block">Objetivo</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {OBJECTIVES.map((obj) => (
                  <div
                    key={obj.id}
                    onClick={() => setSelectedObjective(obj.id)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 relative ${
                      selectedObjective === obj.id
                        ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                        : 'border-border bg-card hover:border-border/80'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{obj.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{obj.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Approaches Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground block">
                Abordagem (opcional) - Define a estratégia interna das artes (textos, layout, tom)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {APPROACHES.map((app) => {
                  const isSelected = selectedApproach === app.id
                  return (
                    <button
                      key={app.id}
                      onClick={() => setSelectedApproach(app.id)}
                      className={`p-3.5 rounded-xl border text-center transition-all flex items-center justify-center gap-2 relative ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      <span>{app.icon}</span>
                      <span className="text-xs">{app.name}</span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[9px] absolute top-1 right-1">
                          ✓
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Checklist Panel for Storytelling */}
            {selectedApproach === 'storytelling' && (
              <Card className="p-5 bg-blue-500/5 border-blue-500/20 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                  <span>📖</span>
                  <span>Checklist Tático de Storytelling</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {CHECKLIST_STORYTELLING.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-blue-500 shrink-0">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs">
                Voltar
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="bg-primary text-white text-xs font-semibold px-6 gap-2"
              >
                Próximo Passo <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Source Selection & Inspiration Library */}
        {step === 3 && (
          <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">3. Como você quer criar?</h2>
              <p className="text-xs text-muted-foreground">
                Escolha o ponto de partida do seu conteúdo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Option 1: Criar do Zero */}
              <div
                onClick={() => handleStartGeneration('Criar do Zero com IA')}
                className="p-6 rounded-2xl border border-border bg-card hover:border-primary/60 hover:shadow-xl transition-all cursor-pointer space-y-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Criar do Zero</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Descreva sua ideia e deixe a IA criar todo o conteúdo e layout otimizado.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs gap-1 group-hover:bg-primary group-hover:text-white"
                >
                  Iniciar do zero <Wand2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Option 2: A partir de Link */}
              <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/60 hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Link2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">A partir de Link</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Cole um link e a IA extrai e adapta o conteúdo diretamente para o post.
                    </p>
                  </div>
                  <Input
                    placeholder="Cole a URL do artigo ou post..."
                    value={customLink}
                    onChange={(e) => setCustomLink(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!customLink.trim()}
                  onClick={() => handleStartGeneration(`Conteúdo extraído do link: ${customLink}`)}
                  className="w-full text-xs gap-1"
                >
                  Extrair Link <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Option 3: Inspirações */}
              <div
                onClick={() => setInspirationModalOpen(true)}
                className="p-6 rounded-2xl border-2 border-orange-500/40 bg-gradient-to-br from-orange-500/5 to-amber-500/10 hover:border-orange-500 hover:shadow-xl transition-all cursor-pointer space-y-4 group relative"
              >
                <Badge className="bg-orange-500 text-white text-[10px] absolute top-3 right-3">
                  Recomendado
                </Badge>
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Inspirações</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Escolha de uma biblioteca de ideias prontas (inclui "Plano de Bordo
                    Realizador").
                  </p>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs gap-1"
                >
                  Abrir Biblioteca <Compass className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {selectedInspiration && (
              <Card className="p-5 border-primary/30 bg-primary/5 animate-fade-in space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{selectedInspiration.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedInspiration.format} · {selectedInspiration.platform}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/50">
                    <span className="font-bold text-primary block mb-1">Headline</span>
                    <span className="text-muted-foreground">{postData.headline}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/50">
                    <span className="font-bold text-primary block mb-1">CTA</span>
                    <span className="text-muted-foreground">{postData.cta}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleRefineWithAI}
                    disabled={refining}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    {refining ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Refinar com IA
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    size="sm"
                    className="flex-1 bg-primary text-white text-xs gap-1.5"
                  >
                    Continuar para Editor <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" size="sm" onClick={() => setStep(2)} className="text-xs">
                Voltar
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: AI Content Refiner & Studio Editor */}
        {step === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            {/* Left Column: Form Controls & Brand selector */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Configuração da Arte
                  </span>
                  <select
                    value={selectedBrandId}
                    onChange={(e) => setSelectedBrandId(e.target.value)}
                    className="text-xs bg-muted border border-border rounded-lg px-2 py-1 font-semibold"
                  >
                    {brands.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold block mb-1">Headline (Título)</label>
                    <Textarea
                      value={postData.headline}
                      onChange={(e) => setPostData({ ...postData, headline: e.target.value })}
                      className="text-xs h-16 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Corpo do Texto</label>
                    <Textarea
                      value={postData.body}
                      onChange={(e) => setPostData({ ...postData, body: e.target.value })}
                      className="text-xs h-24"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Oferta / Preço</label>
                    <Input
                      value={postData.offer}
                      onChange={(e) => setPostData({ ...postData, offer: e.target.value })}
                      className="text-xs h-8"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Botão CTA</label>
                    <Input
                      value={postData.cta}
                      onChange={(e) => setPostData({ ...postData, cta: e.target.value })}
                      className="text-xs h-8 font-bold text-primary"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Rodapé / Instagram Handle</label>
                    <Input
                      value={postData.footer}
                      onChange={(e) => setPostData({ ...postData, footer: e.target.value })}
                      className="text-xs h-8"
                    />
                  </div>

                  {/* Theme Selector */}
                  <div>
                    <label className="font-bold block mb-1">Tema Visual / Fundo</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setBgTheme('purple')}
                        className={`h-7 px-2.5 rounded text-[11px] font-semibold text-white bg-purple-900 border ${
                          bgTheme === 'purple'
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-transparent'
                        }`}
                      >
                        Roxo CNT9
                      </button>
                      <button
                        onClick={() => setBgTheme('dark')}
                        className={`h-7 px-2.5 rounded text-[11px] font-semibold text-white bg-slate-900 border ${
                          bgTheme === 'dark'
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-transparent'
                        }`}
                      >
                        Dark Map
                      </button>
                      <button
                        onClick={() => setBgTheme('orange')}
                        className={`h-7 px-2.5 rounded text-[11px] font-semibold text-white bg-orange-600 border ${
                          bgTheme === 'orange'
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-transparent'
                        }`}
                      >
                        Vibrante
                      </button>
                      <button
                        onClick={() => setBgTheme('blue')}
                        className={`h-7 px-2.5 rounded text-[11px] font-semibold text-white bg-blue-700 border ${
                          bgTheme === 'blue'
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-transparent'
                        }`}
                      >
                        Oceano
                      </button>
                      <button
                        onClick={() => setBgTheme('green')}
                        className={`h-7 px-2.5 rounded text-[11px] font-semibold text-white bg-emerald-700 border ${
                          bgTheme === 'green'
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-transparent'
                        }`}
                      >
                        Floresta
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Imagem de Fundo</label>
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={handleBgUpload}
                          className="hidden"
                        />
                        <div className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 text-xs text-muted-foreground hover:text-primary transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Enviar imagem</span>
                        </div>
                      </label>
                      {customBgImage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomBgImage('')}
                          className="h-8 text-xs px-3"
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <Button
                      onClick={handleRevert}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1.5"
                    >
                      <Undo2 className="w-3.5 h-3.5" /> Reverter para Original
                    </Button>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex gap-2">
                  <Button
                    onClick={() => handleFinalize('draft')}
                    disabled={!!savingStatus}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1"
                  >
                    <Save className="w-3.5 h-3.5" /> Salvar Rascunho
                  </Button>
                  <Button
                    onClick={() => handleFinalize('scheduled')}
                    disabled={!!savingStatus}
                    className="flex-1 bg-primary text-white text-xs gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Agendar Post
                  </Button>
                </div>
              </Card>
            </div>

            {/* Center Canvas: Dynamic Mobile Preview matching screenshot */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="text-center mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Smartphone className="w-4 h-4 text-primary" />
                <span>
                  Pré-visualização {selectedPlatform} ({currentFormatObj.ratio})
                </span>
              </div>

              {/* Mobile Canvas Screen Frame */}
              <div
                className={`w-[320px] sm:w-[350px] min-h-[580px] rounded-[32px] p-4 text-white shadow-2xl relative flex flex-col justify-between overflow-hidden border-4 border-slate-800 transition-all ${
                  bgTheme === 'purple'
                    ? 'bg-gradient-to-b from-indigo-950 via-purple-900 to-indigo-900'
                    : bgTheme === 'dark'
                      ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-zinc-950'
                      : bgTheme === 'orange'
                        ? 'bg-gradient-to-b from-orange-900 via-amber-900 to-purple-950'
                        : bgTheme === 'blue'
                          ? 'bg-gradient-to-b from-blue-950 via-cyan-900 to-blue-950'
                          : 'bg-gradient-to-b from-emerald-950 via-green-900 to-teal-950'
                }`}
              >
                {/* Background image overlay */}
                {customBgImage && (
                  <div className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none">
                    <img src={customBgImage} alt="Bg" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Top Safety Zone indicator + Logo header */}
                <div className="relative z-10 pt-2 space-y-3">
                  <div className="flex items-center justify-between text-[10px] text-white/70 border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-1 font-bold">
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[10px]">
                        c
                      </div>
                      <span>cnt9</span>
                      <span className="text-white/40">conectinove.com.br</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-amber-400 font-semibold">
                      MudarCurso
                    </span>
                  </div>

                  {/* Headline & Subtitle */}
                  <div className="text-center space-y-1.5 pt-2">
                    <h2 className="text-xl font-extrabold leading-tight drop-shadow-md text-amber-200">
                      {postData.headline}
                    </h2>
                  </div>
                </div>

                {/* Central Body Card */}
                <div className="relative z-10 my-3 p-3.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 space-y-2 text-xs">
                  <p className="whitespace-pre-line leading-relaxed text-white/90 text-[11px] text-center">
                    {postData.body}
                  </p>

                  {/* Offer Price Box */}
                  <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-between text-[11px] mt-2">
                    <div className="flex items-center gap-1.5 text-purple-200">
                      <span className="text-amber-400">⭐</span>
                      <span>Acesso imediato</span>
                    </div>
                    <div className="text-right">
                      <span className="line-through text-white/50 text-[10px] mr-1">
                        R$ 1.299,99
                      </span>
                      <span className="font-extrabold text-amber-300 text-xs">R$ 0,00</span>
                    </div>
                  </div>
                </div>

                {/* CTA & Footer Safety Zone */}
                <div className="relative z-10 space-y-2 text-center pb-2">
                  <button className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-extrabold text-xs shadow-lg hover:scale-102 transition-transform tracking-wide flex items-center justify-center gap-1">
                    {postData.cta}
                  </button>

                  <div className="text-[10px] text-white/60 flex items-center justify-between px-2 pt-1">
                    <span>⌃ ARRASTE PARA CIMA</span>
                    <span className="font-bold text-amber-300">{postData.footer}</span>
                  </div>
                </div>
              </div>

              <span className="text-[10px] text-muted-foreground mt-2">
                Área de segurança de 15% superior e inferior preservada
              </span>
            </div>

            {/* Right Column: AI Agent "Social Studio" Panel */}
            <div className="lg:col-span-3 space-y-4 relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPanelCollapsed(!panelCollapsed)}
                className="absolute -top-1 right-0 h-7 w-7 text-muted-foreground hover:text-foreground z-10"
              >
                {panelCollapsed ? (
                  <PanelRightOpen className="w-4 h-4" />
                ) : (
                  <PanelRightClose className="w-4 h-4" />
                )}
              </Button>
              <Card
                className={cn(
                  'p-3 space-y-3 h-[580px] flex flex-col justify-between border-primary/20 bg-card/80 transition-all',
                  panelCollapsed &&
                    'opacity-0 pointer-events-none h-0 overflow-hidden border-0 p-0',
                )}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-border pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs block">Editor IA Social Studio</span>
                        <span className="text-[9px] text-muted-foreground">
                          Estrategista para MudarCurso
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    <button
                      onClick={() => {
                        setChatInput('Refaça a headline com mais impacto emocional')
                      }}
                      className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md hover:bg-primary/20 transition-colors font-medium"
                    >
                      🪄 Refazer Headline
                    </button>
                    <button
                      onClick={() => setBgTheme((t) => (t === 'purple' ? 'dark' : 'purple'))}
                      className="text-[10px] bg-muted text-foreground px-2 py-1 rounded-md hover:bg-muted/80 transition-colors"
                    >
                      🎨 Mudar Cores
                    </button>
                    <button
                      onClick={() => {
                        setPostData((p) => ({
                          ...p,
                          cta: 'TOQUE AQUI E GARANTA SEU MAPA 🗺️',
                        }))
                      }}
                      className="text-[10px] bg-muted text-foreground px-2 py-1 rounded-md hover:bg-muted/80 transition-colors"
                    >
                      🎯 CTA Forte
                    </button>
                  </div>
                </div>

                {/* Messages Chat List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 p-1 my-2 text-xs">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl space-y-1 ${
                        msg.sender === 'user'
                          ? 'bg-primary text-white ml-4 rounded-tr-none'
                          : 'bg-muted/70 text-foreground mr-4 rounded-tl-none border border-border'
                      }`}
                    >
                      <p className="leading-relaxed text-[11px] whitespace-pre-line">{msg.text}</p>
                      {msg.time && (
                        <span className="text-[9px] opacity-60 block text-right">{msg.time}</span>
                      )}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="p-2.5 rounded-xl bg-muted/70 text-foreground mr-4 text-xs flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>Social Studio está digitando...</span>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="space-y-2 border-t border-border pt-2">
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Peça alterações no design ou texto..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="text-xs h-8"
                    />
                    <Button
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={chatLoading || !chatInput.trim()}
                      className="h-8 px-2.5 bg-primary text-white"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      <InspirationLibraryModal
        open={inspirationModalOpen}
        onOpenChange={setInspirationModalOpen}
        onSelectInspiration={handleSelectInspiration}
      />
    </div>
  )
}
