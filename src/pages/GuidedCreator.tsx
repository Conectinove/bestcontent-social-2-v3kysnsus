import { useState, useEffect, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
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
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import { useSocial } from '@/context/SocialContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { InspirationLibraryModal, InspirationItem } from '@/components/InspirationLibraryModal'
import { CanvasWorkspace, ThemePreset } from '@/components/guided/CanvasWorkspace'
import { SocialStudioSidebar, ChatMessage } from '@/components/guided/SocialStudioSidebar'
import { PostSuccessView } from '@/components/guided/PostSuccessView'
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
  { id: 'sell', title: 'Vender', description: 'Converter seguidores em clientes do MudarCurso' },
  { id: 'engage', title: 'Engajar', description: 'Aumentar interação e comunidade' },
]

const APPROACHES = [
  { id: 'storytelling', name: 'Storytelling', icon: '📖' },
  { id: 'oferta', name: 'Oferta', icon: '🏷️' },
  { id: 'prova_social', name: 'Prova social', icon: '✅' },
]

export default function GuidedCreator() {
  const { brands, addPost } = useSocial()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Wizard state: 1 (Format), 2 (Strategy), 3 (Source), 4 (Editor), 5 (Success View)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)

  // Step 1
  const [selectedPlatform, setSelectedPlatform] = useState('Instagram')
  const [selectedFormat, setSelectedFormat] = useState('story')

  // Step 2
  const [selectedObjective, setSelectedObjective] = useState('sell')
  const [selectedApproach, setSelectedApproach] = useState('storytelling')

  // Step 3
  const [inspirationModalOpen, setInspirationModalOpen] = useState(false)
  const [selectedInspiration, setSelectedInspiration] = useState<InspirationItem | null>(null)
  const [customLink, setCustomLink] = useState('')

  // Step 4 Canvas & AI Editor Data
  const [selectedBrandId, setSelectedBrandId] = useState(brands[0]?.id || '')
  const [postData, setPostData] = useState<StructuredPostData>({
    goal: 'Vender o "Plano de Bordo Realizador" como ferramenta de transformação definitiva do MudarCurso.com.br',
    layout: 'Vertical (9:16), aspecto mapa de viagem/bússola, pessoa olhando horizonte fascinado',
    headline: 'Cansado de apenas existir?',
    body: 'A jornada para a sua "Vida Boa" começa com um mapa real.\nChega de se sentir estagnado ou sem direção em 2026.\nCom o Plano de Bordo Realizador, você domina sua rotina e encontra propósito.',
    offer: 'Acesso imediato: Oportunidade especial de R$ 1.299,99 por R$ 0,00',
    cta: 'TOQUE AQUI E MUDE TUDO 🚀',
    footer: '@ronaldo.barreto1',
  })

  const [bgTheme, setBgTheme] = useState<ThemePreset>('purple')
  const [customBgImage, setCustomBgImage] = useState<string>(
    'https://img.usecurling.com/p/600/900?q=wanderer%20mountain%20compass&color=purple',
  )

  // Social Studio Agent Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
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

  useEffect(() => {
    if (brands.length > 0 && !selectedBrandId) {
      setSelectedBrandId(brands[0].id)
    }
  }, [brands, selectedBrandId])

  const handleSelectInspiration = (inspiration: InspirationItem) => {
    setSelectedInspiration(inspiration)
    const newData: StructuredPostData = {
      goal: 'Vender o "Plano de Bordo Realizador" como ferramenta de transformação para MudarCurso.com.br',
      layout: 'Vertical (9:16), bússola luminosa, aspecto mapa de jornada',
      headline: 'Cansado de apenas existir?',
      body: 'A jornada para a sua "Vida Boa" começa com um mapa real.\nChega de se sentir estagnado ou sem direção em 2026.\nCom o Plano de Bordo Realizador, você domina sua rotina e encontra propósito.',
      offer: 'Acesso imediato: Oportunidade especial de R$ 1.299,99 por R$ 0,00',
      cta: 'TOQUE AQUI E MUDE TUDO 🚀',
      footer: '@ronaldo.barreto1',
    }
    setPostData(newData)
    toast({ title: 'Template Selecionado!', description: 'Contexto do MudarCurso carregado.' })
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
    toast({ title: 'Imagem carregada', description: 'Fundo do canvas atualizado.' })
  }

  const handleStartGeneration = async (topicName?: string) => {
    setGenerating(true)
    try {
      const topic = topicName || selectedInspiration?.title || 'Plano de Bordo Realizador'
      const res = await generateStructuredPost(topic, selectedApproach)
      setPostData(res)
      toast({ title: 'Arte Gerada com IA!', description: 'Estrutura otimizada para Stories.' })
      setStep(4)
    } catch {
      toast({ title: 'Arte pronta!', description: 'Ajustando modelo de alta conversão.' })
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
        `Ajuste para o post do MudarCurso. Headline: "${postData.headline}", CTA: "${postData.cta}". Pedido: ${userMsg}`,
        conversationId,
      )
      setConversationId(res.conversation_id)
      setChatMessages((prev) => [
        ...prev,
        { sender: 'agent', text: res.content, time: new Date().toLocaleTimeString().slice(0, 5) },
      ])

      const lower = userMsg.toLowerCase()
      if (lower.includes('cor') || lower.includes('mudar cores') || lower.includes('fundo')) {
        setBgTheme((prev) =>
          prev === 'purple'
            ? 'dark'
            : prev === 'dark'
              ? 'orange'
              : prev === 'orange'
                ? 'blue'
                : prev === 'blue'
                  ? 'green'
                  : 'purple',
        )
      } else if (lower.includes('headline') || lower.includes('título')) {
        setPostData((prev) => ({
          ...prev,
          headline: 'Cansado de adiar seus sonhos?',
        }))
      }
    } catch (err) {
      toast({ title: 'Erro na IA', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setChatLoading(false)
    }
  }

  const handleQuickAction = (action: string) => {
    if (action === 'mudar_cores') {
      setBgTheme((prev) =>
        prev === 'purple'
          ? 'dark'
          : prev === 'dark'
            ? 'orange'
            : prev === 'orange'
              ? 'blue'
              : prev === 'blue'
                ? 'green'
                : 'purple',
      )
      toast({
        title: 'Cores atualizadas!',
        description: 'Novo preset de paleta aplicado ao canvas.',
      })
    } else if (action === 'corrigir') {
      setPostData((prev) => ({
        ...prev,
        headline: 'Cansado de apenas existir?',
        cta: 'TOQUE AQUI E MUDE TUDO 🚀',
      }))
      toast({ title: 'Arte Corrigida', description: 'Textos e alinhamento restaurados.' })
    }
  }

  const handleFinalize = async (status: 'published' | 'scheduled' | 'draft') => {
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
        description: 'Sua arte e legenda foram salvas no sistema.',
      })
      if (step === 4) setStep(5)
      else navigate('/app/feed')
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSavingStatus(null)
    }
  }

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
              2. Estratégia
            </span>
            <span className="text-muted-foreground">→</span>
            <span className={step >= 3 ? 'font-semibold text-primary' : 'text-muted-foreground'}>
              3. Fonte
            </span>
            <span className="text-muted-foreground">→</span>
            <span className={step >= 4 ? 'font-semibold text-primary' : 'text-muted-foreground'}>
              4. Studio IA Canvas
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
                onClick={() => setStep(5)}
                size="sm"
                className="bg-primary text-white text-xs font-semibold gap-1"
              >
                Finalizar
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

            {/* Platforms */}
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
              <h2 className="text-2xl font-bold">2. Defina o Objetivo e Estratégia</h2>
              <p className="text-xs text-muted-foreground">
                Determine a intenção que guiará a IA no tom, copy e estrutura do conteúdo.
              </p>
            </div>

            {/* Objective Cards */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground block">
                Objetivo Principal
              </label>
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
                Abordagem de Copy
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
                    </button>
                  )
                })}
              </div>
            </div>

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

        {/* STEP 3: Source Selection & Inspiration */}
        {step === 3 && (
          <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">3. Escolha o Ponto de Partida</h2>
              <p className="text-xs text-muted-foreground">
                Selecione o modelo "Plano de Bordo Realizador" para carregar a estratégia do
                MudarCurso.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Option 1: Criar do Zero */}
              <div
                onClick={() => handleStartGeneration('Criar do Zero')}
                className="p-6 rounded-2xl border border-border bg-card hover:border-primary/60 hover:shadow-xl transition-all cursor-pointer space-y-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Criar do Zero</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Descreva sua ideia e deixe a IA gerar layout e copy.
                  </p>
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs gap-1">
                  Iniciar do zero <Wand2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Option 2: Link */}
              <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/60 hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Link2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">A partir de Link</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cole a URL de um artigo ou produto.
                    </p>
                  </div>
                  <Input
                    placeholder="Cole o link..."
                    value={customLink}
                    onChange={(e) => setCustomLink(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!customLink.trim()}
                  onClick={() => handleStartGeneration(`Link: ${customLink}`)}
                  className="w-full text-xs gap-1"
                >
                  Extrair Link <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Option 3: Inspirações MudarCurso */}
              <div
                onClick={() => setInspirationModalOpen(true)}
                className="p-6 rounded-2xl border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-amber-500/10 hover:border-orange-500 hover:shadow-xl transition-all cursor-pointer space-y-4 group relative"
              >
                <Badge className="bg-orange-500 text-white text-[10px] absolute top-3 right-3">
                  Recomendado ⭐
                </Badge>
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Plano de Bordo Realizador</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Template com a missão e tom de voz exatos do MudarCurso.com.br.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs gap-1"
                >
                  Abrir Inspirações <Compass className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {selectedInspiration && (
              <Card className="p-5 border-primary/30 bg-primary/5 animate-fade-in space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{selectedInspiration.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedInspiration.description}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setStep(4)}
                  size="sm"
                  className="w-full bg-primary text-white text-xs gap-1.5 mt-2"
                >
                  Abrir Editor Canvas <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Card>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" size="sm" onClick={() => setStep(2)} className="text-xs">
                Voltar
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: AI Visual Canvas Editor */}
        {step === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in items-start">
            {/* Center Canvas Workspace */}
            <div className="lg:col-span-8 flex flex-col items-center">
              <CanvasWorkspace
                postData={postData}
                bgTheme={bgTheme}
                customBgImage={customBgImage}
                onBgUpload={handleBgUpload}
                onSelectTheme={setBgTheme}
                onToolClick={(tool) =>
                  toast({
                    title: `Ferramenta ${tool}`,
                    description: 'Clique e arraste para posicionar no canvas.',
                  })
                }
              />
            </div>

            {/* Right Sidebar: Social Studio Assistant Chat */}
            <div className="lg:col-span-4 space-y-4">
              <SocialStudioSidebar
                messages={chatMessages}
                input={chatInput}
                loading={chatLoading}
                onInputChange={setChatInput}
                onSendMessage={handleSendMessage}
                onQuickAction={handleQuickAction}
                onBgUpload={handleBgUpload}
              />
            </div>
          </div>
        )}

        {/* STEP 5: Post Success View */}
        {step === 5 && (
          <PostSuccessView
            postData={postData}
            selectedPlatform={selectedPlatform}
            bgTheme={bgTheme}
            customBgImage={customBgImage}
            onSaveStatus={handleFinalize}
            saving={!!savingStatus}
          />
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
