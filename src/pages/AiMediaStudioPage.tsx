import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Video,
  Image as ImageIcon,
  Mic,
  Box,
  Layers,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Film,
  Camera,
  Play,
  Volume2,
  FileCode,
  ShieldAlert,
  ShieldCheck,
  Star,
  Menu,
  SlidersHorizontal,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { toast } from '@/hooks/use-toast'
import {
  STUDIO_MODELS,
  StudioMediaType,
  StudioModelOption,
  StudioQualityTier,
  StudioCreationRecord,
  createStudioMedia,
  getStudioCreations,
  getUserStudioCredits,
  updateStudioCreation,
  deleteStudioCreation,
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
import { ExternalAssetModal } from '@/components/studio/ExternalAssetModal'
import { PromptHistoryModal } from '@/components/studio/PromptHistoryModal'
import { VideoTemplatesBar } from '@/components/studio/VideoTemplatesBar'
import { StudioCollaborationModal } from '@/components/studio/StudioCollaborationModal'
import { StudioVersionHistoryModal } from '@/components/studio/StudioVersionHistoryModal'
import { recordStudioPromptHistory } from '@/services/studio-prompt-history'
import { StudioAdvancedEditorDialog } from '@/components/studio/StudioAdvancedEditorDialog'
import { StudioSectionDialog, StudioSectionId } from '@/components/studio/StudioSectionDialog'
import { StudioTopControls } from '@/components/studio/StudioTopControls'
import { useStudioTheme } from '@/hooks/use-studio-theme'
import { useStudioWindowMode } from '@/hooks/use-studio-window'
import { updateStudioTheme } from '@/services/studio-themes'
import { useToast } from '@/hooks/use-toast'

// Componentes da Interface Estilo Genspark
import { StudioSidebar } from '@/components/studio/StudioSidebar'
import { StudioHeroCarousel } from '@/components/studio/StudioHeroCarousel'
import { StudioFeatureCards } from '@/components/studio/StudioFeatureCards'
import { AiTemplateRecommender } from '@/components/studio/AiTemplateRecommender'
import { Download } from 'lucide-react'
import { downloadAssetMedia } from '@/lib/download-utils'
import { StudioGenerationBar } from '@/components/studio/StudioGenerationBar'
import { StudioInspirationGallery } from '@/components/studio/StudioInspirationGallery'
import { SecondBrainCanvas } from '@/components/studio/SecondBrainCanvas'

export default function AiMediaStudioPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { brands, activeBrand } = useSocial()

  // Tema do Estúdio (claro/escuro/marcas/personalizados) aplicado na sub-árvore via data-studio-theme
  const studioTheme = useStudioTheme(brands)
  // Compartilhamento de temas com a equipe (toggle no seletor de tema do Estúdio)
  const { toast } = useToast()
  const [savingTheme, setSavingTheme] = useState(false)
  const handleToggleShared = async (id: string, isShared: boolean) => {
    const target = studioTheme.allThemes.find((t) => t.id === id)
    if (!target) return
    setSavingTheme(true)
    try {
      if (target.remoteId) {
        await updateStudioTheme(target.remoteId, { isShared })
      }
      toast({
        title: isShared
          ? `Tema "${target.name}" compartilhado com a equipe`
          : `Tema "${target.name}" agora é privado`,
      })
    } catch {
      toast({
        title: 'Não foi possível atualizar o compartilhamento',
        variant: 'destructive',
      })
    } finally {
      setSavingTheme(false)
    }
  }

  // Modo de janela do Estúdio: normal / maximizado / compacto (persistido)
  const { windowMode, setMode: setWindowMode, isMaximized, isCompact } = useStudioWindowMode()

  // Seção da sidebar ativa (inicio, projetos, habilidades, estilos, ajuda)
  const [activeSection, setActiveSection] = useState('inicio')
  const [activeHeroTab, setActiveHeroTab] = useState('inicio')

  // Aba da barra de geração (geral, video, image, audio, 3d)
  const [activeTab, setActiveTab] = useState<StudioMediaType>('video')

  // Modelo selecionado por aba
  const [selectedModels, setSelectedModels] = useState<Record<StudioMediaType, StudioModelOption>>({
    geral: STUDIO_MODELS.geral[0],
    video: STUDIO_MODELS.video[0], // Kling 4.0
    image: STUDIO_MODELS.image[0],
    audio: STUDIO_MODELS.audio[0],
    '3d': STUDIO_MODELS['3d'][0],
  })

  // Seletor de qualidade ("Caminho": padrao, ultra, mega)
  const [selectedQuality, setSelectedQuality] = useState<StudioQualityTier>('padrao')

  // Prompt e configurações avançadas
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [stylePreset, setStylePreset] = useState('Cinematográfico Pro')
  const [cameraAngle, setCameraAngle] = useState('Dinâmica Multi-Shot')
  const [uploadedAssets, setUploadedAssets] = useState<string[]>([])

  // Modal de configurações da barra de geração
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)

  // Drawer mobile da sidebar
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

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

  // Status de API externa e métricas
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

  // Novos Modais do Pedido do Usuário
  const [isExternalAssetModalOpen, setIsExternalAssetModalOpen] = useState(false)
  const [isPromptHistoryModalOpen, setIsPromptHistoryModalOpen] = useState(false)
  const [isCollaborationModalOpen, setIsCollaborationModalOpen] = useState(false)
  const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] = useState(false)
  const [isSecondBrainOpen, setIsSecondBrainOpen] = useState(false)

  // Edição avançada da mídia gerada (mesmo mecanismo do editor de posts)
  const [isAdvancedEditorOpen, setIsAdvancedEditorOpen] = useState(false)
  // Dialog de seções da sidebar (projetos / habilidades / estilos / ajuda)
  const [sectionDialog, setSectionDialog] = useState<StudioSectionId | null>(null)

  // Modelo ativo na aba corrente
  const currentModel = selectedModels[activeTab] || STUDIO_MODELS.video[0]

  // Abre o dialog de seção da sidebar com ação real
  const openSection = (section: string) => {
    if (section === 'inicio') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setActiveSection('inicio')
      return
    }
    setActiveSection(section)
    setSectionDialog(section as StudioSectionId)
  }

  // Ação vinda do dialog de seção (habilidade → trocar aba, estilo/ajuda → prompt)
  const handleSectionAction = (action: {
    tab?: 'geral' | 'video' | 'image' | 'audio' | '3d'
    prompt?: string
  }) => {
    if (action.tab) setActiveTab(action.tab)
    if (action.prompt) {
      setPrompt(action.prompt)
      toast({
        title: 'Aplicado no console!',
        description: 'Prompt/estilo adicionado à barra de geração.',
      })
      window.scrollTo({ top: 320, behavior: 'smooth' })
    }
  }

  // Salvar resultado da Edição Avançada sobre a mídia gerada
  const handleSaveAdvancedEdit = async (editedPreviewUrl: string) => {
    if (!selectedCreationModal) return
    try {
      const updated = await updateStudioCreation(
        selectedCreationModal.id,
        { preview_url: editedPreviewUrl },
        selectedCreationModal,
      )
      setCreations((prev) => {
        const next = prev.map((c) => (c.id === updated.id ? updated : c))
        setStudioMetrics(calculateStudioMetrics(next))
        return next
      })
      setSelectedCreationModal(updated)
    } catch (err) {
      console.error('Falha ao salvar edição avançada:', err)
      toast({
        title: 'Não foi possível salvar a edição',
        description: 'A mídia original foi mantida. Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  // Excluir criação do Studio (com confirmação via confirm nativo)
  const handleDeleteCreation = async (creation: StudioCreationRecord) => {
    if (!window.confirm(`Excluir "${creation.title}"? Essa ação não pode ser desfeita.`)) return
    try {
      await deleteStudioCreation(creation.id)
      setCreations((prev) => {
        const next = prev.filter((c) => c.id !== creation.id)
        setStudioMetrics(calculateStudioMetrics(next))
        return next
      })
      setSelectedCreationModal(null)
      toast({
        title: 'Criação excluída',
        description: 'A mídia foi removida do seu Studio.',
      })
    } catch (err) {
      console.error('Falha ao excluir criação:', err)
      toast({
        title: 'Erro ao excluir',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    }
  }

  const handleSelectModel = (model: StudioModelOption) => {
    setSelectedModels((prev) => ({
      ...prev,
      [activeTab]: model,
    }))
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
      // Registra o prompt no histórico (item 2 do pedido do usuário)
      recordStudioPromptHistory({
        prompt: prompt.trim(),
        mediaType: activeTab,
        modelId: currentModel.id,
        modelName: currentModel.name,
        qualityTier: selectedQuality,
      }).catch((e) => console.warn('Falha ao registrar histórico de prompt:', e))

      const result = await createStudioMedia({
        userId: user?.id || 'demo-user',
        brandId: activeBrand?.id,
        type: activeTab,
        prompt: prompt.trim(),
        model: currentModel,
        qualityTier: selectedQuality,
        aspectRatio,
        stylePreset,
        cameraAngle,
        assetUrls: uploadedAssets,
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

  // Ação de criar Novo Canvas (limpa prompt e assets)
  const handleNewCanvas = () => {
    setPrompt('')
    setUploadedAssets([])
    toast({
      title: 'Novo canvas iniciado',
      description: 'Área de trabalho limpa para uma nova ideia criativa.',
    })
  }

  // Aplicação de sugestão vinda do Hero ou dos Cards de Recursos
  const handleApplySuggestion = (
    suggestedPrompt: string,
    type: 'video' | 'image' | 'audio' | '3d',
  ) => {
    setPrompt(suggestedPrompt)
    setActiveTab(type)
    window.scrollTo({ top: 320, behavior: 'smooth' })
    toast({
      title: 'Prompt aplicado!',
      description: 'Ajuste os detalhes ou clique em "Gerar".',
    })
  }

  return (
    <div
      data-studio-theme
      className="flex h-screen overflow-hidden bg-background text-foreground"
      style={{
        ...(isCompact
          ? {
              maxWidth: '1100px',
              margin: '0 auto',
              width: '100%',
              boxShadow: '0 0 60px rgba(0,0,0,0.35)',
            }
          : {}),
      }}
    >
      {/* 1. SIDEBAR ESQUERDA FIXA (Desktop) — oculta no modo maximizado */}
      <div className={isMaximized ? 'hidden' : 'hidden lg:flex h-full'}>
        <StudioSidebar
          activeSection={activeSection}
          onSelectSection={openSection}
          onNewCanvas={handleNewCanvas}
          recentCreations={creations}
          onSelectRecent={(item) => setSelectedCreationModal(item)}
          userName={user?.name || 'Ronaldo Barreto'}
          userEmail={user?.email}
          onOpenSettings={() => navigate('/app/subscription')}
          onViewAllRecents={() => navigate('/app/library')}
          onOpenHistoryModal={() => setIsPromptHistoryModalOpen(true)}
          onOpenCollaborationModal={() => setIsCollaborationModalOpen(true)}
          onOpenVersionHistoryModal={() => setIsVersionHistoryModalOpen(true)}
          onOpenSecondBrain={() => setIsSecondBrainOpen(true)}
        />
      </div>

      {/* 2. ÁREA DE CONTEÚDO PRINCIPAL (Scrollável) */}
      <main className="relative flex-1 flex flex-col h-full overflow-y-auto min-w-0">
        {/* Barra Superior Mobile com Gatilho de Drawer da Sidebar */}
        <div className="lg:hidden p-3 pr-56 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-20">
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Menu className="w-5 h-5" />
                <span className="font-extrabold text-sm font-heading">Estúdio de mídia de IA</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <StudioSidebar
                activeSection={activeSection}
                onSelectSection={(s) => {
                  openSection(s)
                  setIsMobileSidebarOpen(false)
                }}
                onNewCanvas={() => {
                  handleNewCanvas()
                  setIsMobileSidebarOpen(false)
                }}
                recentCreations={creations}
                onSelectRecent={(item) => {
                  setSelectedCreationModal(item)
                  setIsMobileSidebarOpen(false)
                }}
                userName={user?.name || 'Ronaldo Barreto'}
                userEmail={user?.email}
                onOpenSettings={() => {
                  navigate('/app/subscription')
                  setIsMobileSidebarOpen(false)
                }}
                onViewAllRecents={() => {
                  navigate('/app/library')
                  setIsMobileSidebarOpen(false)
                }}
                onOpenHistoryModal={() => {
                  setIsPromptHistoryModalOpen(true)
                  setIsMobileSidebarOpen(false)
                }}
                onOpenCollaborationModal={() => {
                  setIsCollaborationModalOpen(true)
                  setIsMobileSidebarOpen(false)
                }}
                onOpenVersionHistoryModal={() => {
                  setIsVersionHistoryModalOpen(true)
                  setIsMobileSidebarOpen(false)
                }}
                onOpenSecondBrain={() => {
                  setIsSecondBrainOpen(true)
                  setIsMobileSidebarOpen(false)
                }}
              />
            </SheetContent>
          </Sheet>

          <Button
            size="sm"
            onClick={handleNewCanvas}
            className="rounded-full h-8 text-xs font-bold"
          >
            + Canvas
          </Button>
        </div>

        {/* Controles de topo: seletor de temas + maximizar/diminuir janela */}
        <div className="absolute right-4 top-4 z-30">
          <StudioTopControls
            themes={studioTheme.allThemes}
            themeId={studioTheme.themeId}
            onSelectTheme={studioTheme.setThemeId}
            onCreateCustomTheme={studioTheme.addCustomTheme}
            onDeleteCustomTheme={studioTheme.removeCustomTheme}
            onToggleSharedTheme={handleToggleShared}
            isSavingTheme={savingTheme}
            windowMode={windowMode}
            onChangeWindowMode={setWindowMode}
          />
        </div>

        {/* Conteúdo Central Estilo Genspark High Impact */}
        <div
          className={`p-4 sm:p-6 lg:p-8 space-y-6 mx-auto w-full pb-24 ${
            isCompact ? 'max-w-3xl' : 'max-w-7xl'
          }`}
        >
          {/* Seção 2: HERO CARROSSEL */}
          <StudioHeroCarousel
            activeHeroTab={activeHeroTab}
            onSelectHeroTab={setActiveHeroTab}
            onApplyPrompt={handleApplySuggestion}
          />

          {/* Seção 2.5: TEMPLATES DE VÍDEO PRÉ-DEFINIDOS (Aparecem quando na aba Vídeo ou Geral) */}
          {(activeTab === 'video' || activeTab === 'geral') && (
            <VideoTemplatesBar
              onApplyTemplate={(templateText, modelId) => {
                setPrompt(templateText)
                if (modelId) {
                  const found = (STUDIO_MODELS.video || []).find((m) => m.id === modelId)
                  if (found) handleSelectModel(found)
                }
              }}
            />
          )}

          {/* Seção 2.8: IA PARA SUGESTÃO DE TEMPLATES RECOMENDADOS */}
          <AiTemplateRecommender
            prompt={prompt}
            activeTab={activeTab}
            onApplyTemplate={(templateText, modelId) => {
              setPrompt(templateText)
              if (modelId) {
                const allModels = [
                  ...(STUDIO_MODELS[activeTab] || []),
                  ...(STUDIO_MODELS.video || []),
                  ...(STUDIO_MODELS.image || []),
                  ...(STUDIO_MODELS.audio || []),
                ]
                const found = allModels.find((m) => m.id === modelId)
                if (found) handleSelectModel(found)
              }
            }}
          />

          {/* Seção 3: BARRA DE GERAÇÃO CENTRAL (A peça mais importante) */}
          <StudioGenerationBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            prompt={prompt}
            onPromptChange={setPrompt}
            selectedModel={currentModel}
            onSelectModel={handleSelectModel}
            selectedQuality={selectedQuality}
            onSelectQuality={setSelectedQuality}
            uploadedAssets={uploadedAssets}
            onAddUploadedAsset={(url) => setUploadedAssets((prev) => [...prev, url])}
            onRemoveUploadedAsset={(idx) =>
              setUploadedAssets((prev) => prev.filter((_, i) => i !== idx))
            }
            onOpenConfigModal={() => setIsConfigModalOpen(true)}
            onOpenExternalAssetsModal={() => setIsExternalAssetModalOpen(true)}
            onOpenHistoryModal={() => setIsPromptHistoryModalOpen(true)}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />

          {/* Seção 6: CARDS DE RECURSOS / PLANOS (Seedance 2.5 + 4 cards do Genspark) */}
          <StudioFeatureCards
            userCredits={userCredits.planCredits}
            totalCreditsLimit={userCredits.totalCreditsLimit}
            onViewPlans={() => navigate('/app/subscription')}
            onSelectFeaturePrompt={handleApplySuggestion}
          />

          {/* Seção 5: GALERIA INSPIRE-SE COM FILTROS E BUSCA */}
          <div id="inspire-se" className="pt-4 border-t border-border/60">
            <StudioInspirationGallery
              creations={creations}
              onSelectCreation={(item) => setSelectedCreationModal(item)}
            />
          </div>

          {/* Seção Complementar: Métricas de Uso & Templates da Conta */}
          {studioMetrics && (
            <div className="pt-4 border-t border-border/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight font-heading text-foreground">
                    Performance do Estúdio
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Consumo calibrado e eficiência por tipo de mídia
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="rounded-full text-xs font-semibold gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Templates de Prompt</span>
                </Button>
              </div>

              <StudioMetricsBlock metrics={studioMetrics} />
            </div>
          )}
        </div>
      </main>

      {/* Modal de Configurações Avançadas da Barra de Geração */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-lg">Configurações de Geração</DialogTitle>
            <DialogDescription className="text-xs">
              Ajuste proporção de tela, pré-definições de iluminação e enquadramento de câmera.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-bold text-foreground block mb-1.5">Proporção de Tela</label>
              <div className="grid grid-cols-3 gap-2">
                {['16:9 (Horizontal)', '9:16 (Reels/TikTok)', '1:1 (Quadrado)'].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio.split(' ')[0])}
                    className={`p-2 rounded-xl border text-center font-bold transition-colors ${
                      aspectRatio === ratio.split(' ')[0]
                        ? 'border-foreground bg-muted text-foreground'
                        : 'border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1.5">Estilo Visual</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Cinematográfico Pro',
                  'Fotorrealista 4K',
                  'Comercial Editorial',
                  'Estética Cyberpunk',
                ].map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setStylePreset(style)}
                    className={`p-2 rounded-xl border text-left font-semibold transition-colors ${
                      stylePreset === style
                        ? 'border-foreground bg-muted text-foreground'
                        : 'border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1.5">Ângulo de Câmera</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Dinâmica Multi-Shot',
                  'Close-up Macro',
                  'Plano Aberto Aéreo',
                  'Traveling Circular',
                ].map((cam) => (
                  <button
                    key={cam}
                    type="button"
                    onClick={() => setCameraAngle(cam)}
                    className={`p-2 rounded-xl border text-left font-semibold transition-colors ${
                      cameraAngle === cam
                        ? 'border-foreground bg-muted text-foreground'
                        : 'border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    {cam}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setIsConfigModalOpen(false)}
              className="rounded-full text-xs font-bold"
            >
              Aplicar configurações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Criação */}
      {selectedCreationModal && (
        <Dialog
          open={Boolean(selectedCreationModal)}
          onOpenChange={(open) => !open && setSelectedCreationModal(null)}
        >
          <DialogContent className="sm:max-w-2xl rounded-3xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-purple-600 text-white uppercase text-[10px] font-black">
                  {selectedCreationModal.type.toUpperCase()}
                </Badge>
                <span className="text-xs font-bold text-muted-foreground">
                  Modelo: {selectedCreationModal.model_name}
                </span>
              </div>
              <DialogTitle className="font-black text-xl font-heading">
                {selectedCreationModal.title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {selectedCreationModal.prompt}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-border">
                {selectedCreationModal.type === 'video' ? (
                  <video
                    src={selectedCreationModal.preview_url}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                  />
                ) : (
                  <img
                    src={selectedCreationModal.preview_url}
                    alt={selectedCreationModal.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Créditos debitados:{' '}
                  <span className="font-bold text-foreground">
                    {selectedCreationModal.credits_used}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAdvancedEditorOpen(true)}
                    className="rounded-full text-xs font-bold gap-1.5"
                    title="Abrir Edição Avançada da Arte (filtros, textos, proporção)"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Edição Avançada</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      downloadAssetMedia(selectedCreationModal.preview_url, {
                        mediaType: selectedCreationModal.type,
                        filename: `studio-${selectedCreationModal.type}-${selectedCreationModal.id}.${
                          selectedCreationModal.type === 'video' ? 'mp4' : 'jpg'
                        }`,
                      })
                    }}
                    className="rounded-full text-xs font-bold gap-1.5"
                    title="Baixar mídia para seu computador ou celular"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Asset</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigate('/app/library')
                      setSelectedCreationModal(null)
                    }}
                    className="rounded-full text-xs font-bold"
                  >
                    Ver na Biblioteca
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCreation(selectedCreationModal)}
                    className="rounded-full text-xs font-bold text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigate('/app/criar', {
                        state: {
                          mediaUrl: selectedCreationModal.preview_url,
                          mediaPreviewUrl: selectedCreationModal.preview_url,
                        },
                      })
                      setSelectedCreationModal(null)
                    }}
                    className="rounded-full text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Criar Post com Esta Mídia
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edição Avançada da Arte (mesmo mecanismo do editor de posts) */}
      {selectedCreationModal && (
        <StudioAdvancedEditorDialog
          open={isAdvancedEditorOpen}
          onOpenChange={setIsAdvancedEditorOpen}
          creation={selectedCreationModal}
          onSave={handleSaveAdvancedEdit}
        />
      )}

      {/* Dialogs de seção da sidebar: Projetos, Habilidades, Estilos, Ajuda */}
      <StudioSectionDialog
        open={Boolean(sectionDialog)}
        section={sectionDialog}
        onOpenChange={(open) => {
          if (!open) setSectionDialog(null)
        }}
        creations={creations}
        onSelectCreation={(item) => {
          setSectionDialog(null)
          setSelectedCreationModal(item)
        }}
        onAction={handleSectionAction}
      />

      {/* Modal de Assets Externos (Item 1 do pedido) */}
      <ExternalAssetModal
        open={isExternalAssetModalOpen}
        onOpenChange={setIsExternalAssetModalOpen}
        onSelectAsset={(url) => {
          setUploadedAssets((prev) => [...prev, url])
        }}
      />

      {/* Modal de Histórico de Prompts (Item 2 do pedido) */}
      <PromptHistoryModal
        open={isPromptHistoryModalOpen}
        onOpenChange={setIsPromptHistoryModalOpen}
        currentType={activeTab}
        onApplyPrompt={(reusedPrompt, mediaType, modelId) => {
          setPrompt(reusedPrompt)
          if (mediaType && mediaType !== activeTab) {
            setActiveTab(mediaType)
          }
          if (modelId) {
            const list = STUDIO_MODELS[mediaType || activeTab] || []
            const found = list.find((m) => m.id === modelId)
            if (found) handleSelectModel(found)
          }
        }}
      />

      {/* Modal de Colaboração em Projetos do Studio (Item 4 do pedido) */}
      <StudioCollaborationModal
        open={isCollaborationModalOpen}
        onOpenChange={setIsCollaborationModalOpen}
        currentPrompt={prompt}
        currentType={activeTab}
        currentModelId={currentModel.id}
        attachedAssets={uploadedAssets.map((u, i) => ({
          id: `att-${i}`,
          name: `Asset ${i + 1}`,
          url: u,
        }))}
        onLoadProjectToCanvas={(proj) => {
          setPrompt(proj.prompt || '')
          if (proj.current_type) setActiveTab(proj.current_type)
          if (proj.attached_assets) {
            const urls = proj.attached_assets
              .map((a: any) => (typeof a === 'string' ? a : a.url || a.previewUrl))
              .filter(Boolean) as string[]
            setUploadedAssets(urls)
          }
        }}
      />

      {/* Modal de Histórico de Versões do Studio (Item 4 do pedido) */}
      <StudioVersionHistoryModal
        open={isVersionHistoryModalOpen}
        onOpenChange={setIsVersionHistoryModalOpen}
        projectId="studio-default-project"
        projectTitle="Projeto de Mídia IA Multicanal"
        currentSnapshot={{
          prompt,
          activeTab,
          uploadedAssets,
          canvasSettings: {
            modelId: currentModel.id,
            activeTab,
          },
        }}
        onRestoreSnapshot={(snapshot) => {
          if (snapshot.prompt !== undefined) setPrompt(snapshot.prompt)
          if (snapshot.activeTab) setActiveTab(snapshot.activeTab)
          if (snapshot.uploadedAssets) setUploadedAssets(snapshot.uploadedAssets)
        }}
      />

      {/* Modal de Templates de Prompt */}
      <PromptTemplateManagerModal
        open={isTemplateModalOpen}
        onOpenChange={setIsTemplateModalOpen}
        currentType={activeTab}
        userId={user?.id || 'demo-user'}
        templates={promptTemplates}
        onSelectAndApply={(filledPrompt) => {
          setPrompt(filledPrompt)
          setIsTemplateModalOpen(false)
          toast({
            title: 'Template aplicado!',
            description: 'Prompt preenchido na barra de criação.',
          })
        }}
        onRefreshTemplates={async () => {
          await loadData()
        }}
      />

      {/* Modal / Dialog do Segundo Cérebro (Full Canvas) */}
      <Dialog open={isSecondBrainOpen} onOpenChange={setIsSecondBrainOpen}>
        <DialogContent className="max-w-(--breakpoint-2xl) w-[96vw] h-[92vh] p-0 bg-slate-950 border-slate-800 text-slate-100 overflow-hidden rounded-3xl">
          <SecondBrainCanvas onClose={() => setIsSecondBrainOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
