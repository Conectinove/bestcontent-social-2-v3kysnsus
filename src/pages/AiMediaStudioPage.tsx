import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Video,
  Image as ImageIcon,
  Mic,
  Check,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Layers,
  ArrowRight,
  RefreshCw,
  Clock,
  Coins,
  Wand2,
  ExternalLink,
  BookOpen,
  Film,
  Camera,
  Play,
  Volume2,
  FileCode,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import {
  STUDIO_MODELS,
  StudioMediaType,
  StudioModelOption,
  StudioCreationRecord,
  createStudioMedia,
  getStudioCreations,
  getUserStudioCredits,
} from '@/services/ai-studio'
import {
  checkExternalMediaApiStatus,
  type ExternalMediaApiStatus,
} from '@/services/studio-external-media'
import {
  getStudioPromptTemplates,
  type StudioPromptTemplate,
} from '@/services/studio-prompt-templates'
import { calculateStudioMetrics, type StudioUsageMetrics } from '@/services/studio-metrics'
import { PromptTemplateManagerModal } from '@/components/studio/PromptTemplateManagerModal'
import { StudioMetricsBlock } from '@/components/studio/StudioMetricsBlock'

export default function AiMediaStudioPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { activeBrand } = useSocial()

  // Estado das abas
  const [activeTab, setActiveTab] = useState<StudioMediaType>('video')

  // Modelos selecionados por aba
  const [selectedVideoModel, setSelectedVideoModel] = useState<StudioModelOption>(
    STUDIO_MODELS.video[0],
  )
  const [selectedImageModel, setSelectedImageModel] = useState<StudioModelOption>(
    STUDIO_MODELS.image[0],
  )
  const [selectedAudioModel, setSelectedAudioModel] = useState<StudioModelOption>(
    STUDIO_MODELS.audio[0],
  )

  // Prompt e configurações
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [stylePreset, setStylePreset] = useState('Cinematográfico Pro')
  const [cameraAngle, setCameraAngle] = useState('Dinâmica Multi-Shot')

  // Estado de execução e créditos
  const [isGenerating, setIsGenerating] = useState(false)
  const [userCredits, setUserCredits] = useState({
    planCredits: 125000,
    totalCreditsLimit: 125000,
    planName: 'Pro',
  })
  const [creations, setCreations] = useState<StudioCreationRecord[]>([])
  const [isLoadingCreations, setIsLoadingCreations] = useState(true)
  const [selectedCreationModal, setSelectedCreationModal] = useState<StudioCreationRecord | null>(
    null,
  )

  // Estados das 4 Frentes de Evolução
  const [externalApiStatus, setExternalApiStatus] = useState<ExternalMediaApiStatus>({
    configured: false,
    provider: 'OpenAI (DALL·E 3 / TTS-1)',
    hasApiKey: false,
    badge: 'Estimativa Calibrada (Modo Local)',
    message: 'Verificando conectividade...',
  })
  const [promptTemplates, setPromptTemplates] = useState<StudioPromptTemplate[]>([])
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [studioMetrics, setStudioMetrics] = useState<StudioUsageMetrics | null>(null)

  // Modelo ativo na aba atual
  const currentModel =
    activeTab === 'video'
      ? selectedVideoModel
      : activeTab === 'image'
        ? selectedImageModel
        : selectedAudioModel

  const setModelForCurrentTab = (model: StudioModelOption) => {
    if (activeTab === 'video') setSelectedVideoModel(model)
    else if (activeTab === 'image') setSelectedImageModel(model)
    else setSelectedAudioModel(model)
  }

  // Carregar dados de créditos, criações recentes, templates e status de API externa
  const loadData = useCallback(async () => {
    try {
      const [credits, recent, extStatus, tmpls] = await Promise.all([
        getUserStudioCredits(user?.id),
        getStudioCreations(user?.id),
        checkExternalMediaApiStatus(),
        getStudioPromptTemplates(user?.id),
      ])

      setUserCredits({
        planCredits: credits.planCredits,
        totalCreditsLimit: credits.totalCredits,
        planName: 'Pro Creator',
      })
      setCreations(recent)
      setExternalApiStatus(extStatus)
      setPromptTemplates(tmpls)
      setStudioMetrics(calculateStudioMetrics(recent))
    } catch (err) {
      console.error('Erro ao carregar dados do estúdio:', err)
    } finally {
      setIsLoadingCreations(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Placeholders contextuais por aba
  const placeholders: Record<StudioMediaType, string> = {
    video:
      'Descreva a cena cinematográfica: "Câmera percorre corredor moderno de aeroporto com iluminação volumétrica e letreiro digital"...',
    image:
      'Descreva a imagem de alto impacto: "Banner promocional neon cyberpunk com tipografia flutuante e estética editorial"...',
    audio:
      'Insira o texto para locução comercial: "Descubra a nova era da criação com inteligência artificial para o seu negócio"...',
  }

  // Ação de Geração
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt necessário',
        description: 'Por favor, descreva o que você deseja criar no estúdio.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    try {
      const result = await createStudioMedia({
        userId: user?.id || 'demo-user',
        brandId: activeBrand?.id,
        type: activeTab,
        prompt: prompt.trim(),
        model: currentModel,
        aspectRatio,
        stylePreset,
        cameraAngle,
      })

      // Atualiza lista local e métricas
      setCreations((prev) => {
        const updated = [result.creation, ...prev]
        setStudioMetrics(calculateStudioMetrics(updated))
        return updated
      })

      // Atualiza créditos visuais
      setUserCredits((prev) => ({
        ...prev,
        planCredits: Math.max(0, prev.planCredits - (result.creation.credits_used || 20)),
      }))

      const isExternal = Boolean(result.creation.is_external_api)
      toast({
        title: isExternal ? '✨ Gerado via API Externa Oficial!' : 'Criação concluída com sucesso!',
        description: isExternal
          ? `Mídia oficial produzida via OpenAI (${currentModel.name}) e sincronizada na Biblioteca.`
          : `Mídia calibrada via ${currentModel.name} e sincronizada automaticamente na Biblioteca.`,
      })

      // Abre detalhes da criação gerada
      setSelectedCreationModal(result.creation)
    } catch (err) {
      console.error('Falha ao gerar mídia no estúdio:', err)
      toast({
        title: 'Erro na geração',
        description: 'Não foi possível completar a geração. Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Banner / Navegação Estilo High Impact & Genspark */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg tracking-tight font-heading flex items-center gap-2">
                  AI Media Studio
                  <Badge
                    variant="secondary"
                    className="text-[10px] uppercase font-bold bg-purple-500/10 text-purple-600"
                  >
                    High Impact
                  </Badge>
                </h1>
              </div>
            </div>

            {/* Menu interno estilo estúdio */}
            <div className="hidden md:flex items-center gap-1 text-sm font-medium">
              <span className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground font-semibold">
                Início
              </span>
              <a
                href="#destaques"
                className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground"
              >
                Destaques
              </a>
              <a
                href="#inspire-se"
                className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground"
              >
                Inspire-se
              </a>
              <Link
                to="/app/library"
                className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                Biblioteca Sincronizada
              </Link>
            </div>
          </div>

          {/* Contador de Créditos no topo estilo "125.000 créditos/mês" */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/80 border border-border/80 px-3.5 py-1.5 rounded-full shadow-xs">
              <Coins className="w-4 h-4 text-amber-500" />
              <div className="text-xs">
                <span className="font-bold text-foreground">
                  {userCredits.planCredits.toLocaleString('pt-BR')}
                </span>
                <span className="text-muted-foreground ml-1">/ 125.000 créditos/mês</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/subscription')}
              className="hidden sm:flex text-xs font-semibold"
            >
              Recarregar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Hero Banner Estilo "START -> END" & "ONE PROMPT. SEVEN SHOTS." */}
        <div
          id="destaques"
          className="relative rounded-3xl overflow-hidden mb-8 border border-border/60 bg-gradient-to-r from-neutral-950 via-neutral-900 to-purple-950 text-white shadow-2xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.25),transparent_60%)] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 p-6 sm:p-10 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-purple-300">
                <Wand2 className="w-3.5 h-3.5" />
                MidiaViva Next-Gen AI Engine
              </div>

              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight font-heading leading-tight">
                ONE PROMPT. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-lime-300 to-teal-200">
                  SEVEN SHOTS.
                </span>
              </h2>

              <p className="text-neutral-300 text-sm sm:text-base max-w-xl">
                Crie vídeos cinematográficos, artes de alto impacto e locuções realistas com
                controle total de custo relativo e sincronização instantânea na sua Biblioteca.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30 text-xs py-1">
                  KLING 4.0 OUTPUT
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs py-1">
                  NANO BANANA 2 FLASH
                </Badge>
                <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-xs py-1">
                  GEMINI 3.8 FLASH TTS
                </Badge>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl bg-black aspect-video flex items-center justify-center group">
                <img
                  src="https://img.usecurling.com/p/800/450?q=airport+cinematic+futuristic&color=green"
                  alt="Prévia de geração"
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-lime-500 text-black font-extrabold text-[11px] px-2.5 py-1 rounded uppercase tracking-wider shadow-md">
                  KLING 4.0 OUTPUT · 4× SPEED
                </div>
                <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg border border-white/10">
                  Set the first & last frame · Start → End
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status de Conexão com API Externa (Banner Informativo) */}
        <div className="mb-6 p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-card/60 backdrop-blur-sm border-border/70">
          <div className="flex items-center gap-2.5">
            {externalApiStatus.configured ? (
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
            ) : (
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldAlert className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">Status da Mídia Externa:</span>
                <Badge
                  variant={externalApiStatus.configured ? 'default' : 'outline'}
                  className={`text-[10px] font-bold ${
                    externalApiStatus.configured
                      ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                      : 'border-amber-500/30 text-amber-400'
                  }`}
                >
                  {externalApiStatus.configured
                    ? 'Dados Oficiais (OpenAI Ativa)'
                    : 'Estimativa Calibrada (Modo Local)'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {externalApiStatus.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsTemplateModalOpen(true)}
              className="text-xs h-8 rounded-xl border-purple-500/30 text-purple-400 hover:bg-purple-500/10 gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5" />
              Modelos de Prompt ({promptTemplates.length})
            </Button>
          </div>
        </div>

        {/* Console Central de Criação (Estilo o Popover do Genspark) */}
        <div className="bg-card border border-border/80 rounded-3xl p-4 sm:p-6 shadow-xl mb-8">
          {/* Abas: Vídeo · Imagem · Áudio + Botão Modelos de Prompt */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'video'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Vídeo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('image')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'image'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Imagem</span>
                {externalApiStatus.configured && (
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                    title="API OpenAI ativa para imagens reais"
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'audio'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>Áudio</span>
                {externalApiStatus.configured && (
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                    title="API OpenAI ativa para áudio TTS real"
                  />
                )}
              </button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsTemplateModalOpen(true)}
              className="text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5" />
              Usar Modelo de Prompt
            </Button>
          </div>

          {/* Campo de Prompt Grande */}
          <div className="space-y-3">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={placeholders[activeTab]}
              rows={4}
              className="w-full text-base sm:text-lg resize-none rounded-2xl border-border/80 focus-visible:ring-purple-500/30 p-4 font-normal"
            />

            {/* Barra de Controles Inferior do Prompt com Seletor de Modelo */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Seletor de Modelo com Custo Relativo (Exato ao print do Genspark) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-full h-10 px-4 bg-background border-border/80 hover:bg-accent flex items-center gap-2 shadow-xs"
                    >
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-sm max-w-[170px] truncate">
                        {currentModel.name}
                      </span>
                      <Badge variant="secondary" className="text-[11px] font-bold px-1.5 py-0 h-5">
                        {currentModel.relativeCost}×
                      </Badge>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="start"
                    className="w-80 p-2 rounded-2xl shadow-2xl border border-border/80 bg-popover"
                  >
                    <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-1">
                      Modelos de {activeTab.toUpperCase()} & Custo Relativo
                    </div>
                    {STUDIO_MODELS[activeTab].map((model) => {
                      const isSelected = currentModel.id === model.id
                      return (
                        <DropdownMenuItem
                          key={model.id}
                          onClick={() => setModelForCurrentTab(model)}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer ${
                            isSelected
                              ? 'bg-purple-500/15 font-semibold text-purple-700 dark:text-purple-300'
                              : ''
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{model.name}</span>
                              {model.badge && (
                                <span className="text-[9px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded font-bold">
                                  {model.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {model.provider}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono font-bold text-muted-foreground">
                              {model.relativeCost}×
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                          </div>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Modificadores Visuais Complementares */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-xs h-9 text-muted-foreground hover:text-foreground"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                      {stylePreset}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="rounded-xl">
                    <DropdownMenuItem onClick={() => setStylePreset('Cinematográfico Pro')}>
                      Cinematográfico Pro
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStylePreset('Cyberpunk Neon')}>
                      Cyberpunk Neon
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStylePreset('Minimalista Clean')}>
                      Minimalista Clean
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStylePreset('Editorial Revista')}>
                      Editorial Revista
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {activeTab === 'video' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-xs h-9 text-muted-foreground hover:text-foreground"
                      >
                        <Camera className="w-3.5 h-3.5 mr-1.5" />
                        {cameraAngle}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="rounded-xl">
                      <DropdownMenuItem onClick={() => setCameraAngle('Dinâmica Multi-Shot')}>
                        Dinâmica Multi-Shot
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCameraAngle('Drone Aéreo Panorâmico')}>
                        Drone Aéreo Panorâmico
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCameraAngle('Close-up Foco Seletivo')}>
                        Close-up Foco Seletivo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Botão Gerar em destaque */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Consome ~
                  <strong className="text-foreground">
                    {Math.round(
                      (activeTab === 'video' ? 50 : activeTab === 'image' ? 20 : 10) *
                        currentModel.relativeCost,
                    )}
                  </strong>{' '}
                  créditos
                </span>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="rounded-full px-7 font-bold text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25 min-w-[130px]"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-1.5 fill-current" />
                      Gerar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Painel de Métricas de Uso do AI Studio (Frente 4) */}
        <div className="mb-10">
          <StudioMetricsBlock
            metrics={studioMetrics}
            loading={isLoadingCreations}
            externalStatusBadge={
              externalApiStatus.configured ? 'OpenAI Integrada' : 'Estimativa Calibrada'
            }
          />
        </div>

        {/* Galeria "Inspire-se" & "Recentes" (Conforme prints anexados) */}
        <div id="inspire-se" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight font-heading flex items-center gap-2">
                Inspire-se · Criações do Studio
                <Badge variant="outline" className="text-xs font-mono">
                  {creations.length} itens
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                Todas as criações são sincronizadas na Biblioteca e podem ser publicadas em
                múltiplos canais.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/library')}
              className="gap-2 font-semibold self-start sm:self-auto"
            >
              <BookOpen className="w-4 h-4 text-purple-600" />
              Abrir Biblioteca Completa
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {isLoadingCreations ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl bg-muted/60 animate-pulse border border-border"
                />
              ))}
            </div>
          ) : creations.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40">
              <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
              <h4 className="font-bold text-base mb-1">Nenhuma criação no Studio ainda</h4>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                Digite um prompt acima para criar seu primeiro vídeo, arte ou áudio com IA e
                sincronizar na Biblioteca.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {creations.map((item) => {
                return (
                  <Card
                    key={item.id}
                    onClick={() => setSelectedCreationModal(item)}
                    className="overflow-hidden border-border/80 hover:border-purple-500/50 hover:shadow-xl transition-all cursor-pointer group rounded-2xl flex flex-col bg-card"
                  >
                    <div className="relative aspect-video sm:aspect-square bg-neutral-900 overflow-hidden">
                      <img
                        src={
                          item.preview_url ||
                          'https://img.usecurling.com/p/600/600?q=creative+studio'
                        }
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <Badge
                          className={`text-[10px] font-bold uppercase shadow-sm ${
                            item.type === 'video'
                              ? 'bg-purple-600 text-white'
                              : item.type === 'audio'
                                ? 'bg-sky-600 text-white'
                                : 'bg-pink-600 text-white'
                          }`}
                        >
                          {item.type}
                        </Badge>
                      </div>

                      <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-white/10">
                        {item.relative_cost}× · {item.credits_used}cr
                      </div>
                    </div>

                    <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-purple-600 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {item.prompt}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-medium truncate max-w-[140px] text-foreground/80">
                          {item.model_name}
                        </span>
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Na Biblioteca</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Gerenciamento de Modelos de Prompt Personalizáveis */}
      <PromptTemplateManagerModal
        open={isTemplateModalOpen}
        onOpenChange={setIsTemplateModalOpen}
        currentType={activeTab}
        userId={user?.id || 'demo-user'}
        templates={promptTemplates}
        onSelectAndApply={(filledPrompt, defaultModelId) => {
          setPrompt(filledPrompt)
          if (defaultModelId) {
            const found = STUDIO_MODELS[activeTab].find((m) => m.id === defaultModelId)
            if (found) setModelForCurrentTab(found)
          }
        }}
        onRefreshTemplates={async () => {
          const tmpls = await getStudioPromptTemplates(user?.id)
          setPromptTemplates(tmpls)
        }}
      />

      {/* Modal de Detalhes da Criação */}
      <Dialog
        open={Boolean(selectedCreationModal)}
        onOpenChange={(open) => !open && setSelectedCreationModal(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          {selectedCreationModal && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-purple-600 text-white uppercase text-[10px]">
                    {selectedCreationModal.type}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">
                    Modelo: {selectedCreationModal.model_name} (
                    {selectedCreationModal.relative_cost}×)
                  </span>
                </div>
                <DialogTitle className="text-xl font-black font-heading">
                  {selectedCreationModal.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Prompt: "{selectedCreationModal.prompt}"
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-4">
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-neutral-900 border border-border">
                  <img
                    src={selectedCreationModal.preview_url}
                    alt={selectedCreationModal.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Sincronizado na Biblioteca com IA Avançada</span>
                  </div>
                </div>

                <div className="bg-muted/60 p-4 rounded-2xl border border-border/80">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Saída Gerada & Roteiro
                  </h5>
                  <pre className="text-xs whitespace-pre-wrap font-mono text-foreground leading-relaxed">
                    {selectedCreationModal.output_content}
                  </pre>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Créditos debitados:{' '}
                  <strong className="text-foreground">{selectedCreationModal.credits_used}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCreationModal(null)}
                  >
                    Fechar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1.5"
                    onClick={() => {
                      setSelectedCreationModal(null)
                      navigate('/app/library')
                    }}
                  >
                    <BookOpen className="w-4 h-4" />
                    Ver na Biblioteca
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
