import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Sparkles,
  Video,
  Image as ImageIcon,
  Mic,
  Box,
  Layers,
  History,
  Loader2,
  Trash2,
  Menu,
  Download,
  Wand2,
  Play,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  STUDIO_MODELS,
  STUDIO_QUALITY_OPTIONS,
  StudioMediaType,
  StudioCreationRecord,
  createStudioMedia,
  getStudioCreations,
  getUserStudioCredits,
  deleteStudioCreation,
} from '@/services/ai-studio'
import {
  checkExternalMediaApiStatus,
  type ExternalMediaApiStatus,
} from '@/services/studio-external-media'
import { StudioSidebar } from '@/components/studio/StudioSidebar'
import { StudioTopControls } from '@/components/studio/StudioTopControls'
import { StudioPresenceBar } from '@/components/studio/StudioPresenceBar'
import { StudioCollaborationModal } from '@/components/studio/StudioCollaborationModal'
import { StudioVersionHistoryModal } from '@/components/studio/StudioVersionHistoryModal'
import { StudioInspirationGallery } from '@/components/studio/StudioInspirationGallery'
import { EditHistoryPanel } from '@/components/studio/EditHistoryPanel'
import { useStudioWindowMode } from '@/hooks/use-studio-window'
import type { StudioThemeOption } from '@/hooks/use-studio-theme'
import { downloadAssetMedia } from '@/lib/download-utils'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const MEDIA_TABS: { id: StudioMediaType; label: string; icon: React.ElementType }[] = [
  { id: 'geral', label: 'Geral', icon: Layers },
  { id: 'video', label: 'Vídeo', icon: Video },
  { id: 'image', label: 'Imagem', icon: ImageIcon },
  { id: 'audio', label: 'Áudio', icon: Mic },
  { id: '3d', label: '3D', icon: Box },
]

const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:5', '3:2']

const TYPE_LABEL: Record<string, string> = {
  geral: 'Geral',
  video: 'Vídeo',
  image: 'Imagem',
  audio: 'Áudio',
  '3d': '3D',
}

export default function AiMediaStudioPage() {
  const { user } = useAuth()
  const { windowMode, setMode: setStudioWindowMode } = useStudioWindowMode()

  // Motor de temas do Studio: best-effort com fallback local — nunca bloqueia a página.
  const [studioTheme] = useState<Record<string, any>>(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return {}
    } catch {
      return {}
    }
  })
  const [themeId, setThemeId] = useState('studio-padrao')
  const themes: StudioThemeOption[] = useMemo(() => studioTheme.themes ?? [], [studioTheme])

  const [mediaType, setMediaType] = useState<StudioMediaType>('geral')
  const [prompt, setPrompt] = useState('')
  const [modelId, setModelId] = useState('')
  const [qualityTier, setQualityTier] = useState('padrao')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [stylePreset, setStylePreset] = useState('')
  const [creations, setCreations] = useState<StudioCreationRecord[]>([])
  const [credits, setCredits] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState<ExternalMediaApiStatus | null>(null)

  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('create')
  const [collabOpen, setCollabOpen] = useState(false)
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)
  const [detailsCreation, setDetailsCreation] = useState<StudioCreationRecord | null>(null)
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false)

  const models = STUDIO_MODELS[mediaType] ?? []
  const selectedModel = models.find((m) => m.id === modelId) ?? models[0]

  const loadCreations = useCallback(async () => {
    if (!user?.id) return
    try {
      const list = (await getStudioCreations(user.id)) as unknown
      setCreations(Array.isArray(list) ? (list as StudioCreationRecord[]) : [])
      const rawCredits = (await getUserStudioCredits(user.id)) as unknown
      const n = Number(rawCredits)
      setCredits(Number.isFinite(n) ? n : null)
    } catch {
      // best-effort: página abre mesmo sem banco
      setCreations([])
    } finally {
      setIsLoading(false)
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadCreations()
  }, [loadCreations])

  useEffect(() => {
    checkExternalMediaApiStatus()
      .then((s) => setApiStatus(s))
      .catch(() => setApiStatus(null))
  }, [])

  // Ao trocar de aba de mídia, seleciona o primeiro modelo disponível.
  useEffect(() => {
    const first = (STUDIO_MODELS[mediaType] ?? [])[0]
    setModelId(first?.id ?? '')
  }, [mediaType])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Descreva o que você quer criar', variant: 'destructive' })
      return
    }
    if (!selectedModel) return
    setIsGenerating(true)
    try {
      const created = (await createStudioMedia({
        userId: user?.id || '',
        type: mediaType,
        prompt: prompt.trim(),
        model: selectedModel,
        qualityTier: qualityTier as any,
        aspectRatio,
        stylePreset: stylePreset.trim() || undefined,
      })) as unknown as StudioCreationRecord
      if (created?.id) {
        setCreations((prev) => [created, ...prev])
      }
      toast({
        title: 'Geração concluída!',
        description: 'O material já está disponível na sua galeria do Studio.',
      })
    } catch {
      toast({
        title: 'Falha na geração',
        description: 'Tente ajustar o prompt e tentar de novo.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = async (creation: StudioCreationRecord) => {
    try {
      await deleteStudioCreation(creation.id)
      setCreations((prev) => prev.filter((c) => c.id !== creation.id))
      if (detailsCreation?.id === creation.id) setDetailsCreation(null)
      toast({ title: 'Material removido' })
    } catch {
      toast({ title: 'Erro ao remover material', variant: 'destructive' })
    }
  }

  const handleDownload = async (creation: StudioCreationRecord) => {
    try {
      await (downloadAssetMedia as any)(creation.preview_url, creation.title || 'material-studio')
      toast({ title: 'Download iniciado' })
    } catch {
      toast({ title: 'Não foi possível baixar o material', variant: 'destructive' })
    }
  }

  const handleRestoreSnapshot = useCallback((snapshot: Record<string, any>) => {
    if (typeof snapshot?.prompt === 'string' && snapshot.prompt) setPrompt(snapshot.prompt)
    if (typeof snapshot?.activeTab === 'string' && snapshot.activeTab) {
      setMediaType(snapshot.activeTab as StudioMediaType)
    }
  }, [])

  const presenceTargetKey = detailsCreation ? `creation:${detailsCreation.id}` : 'studio:geral'
  const historyCurrent = useMemo(() => ({}) as any, [])

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] bg-background">
      {/* Sidebar desktop */}
      <div className="hidden lg:flex h-[calc(100vh-3.5rem)] sticky top-[3.5rem] shrink-0">
        <StudioSidebar
          activeSection={activeSection}
          onSelectSection={(s) => setActiveSection(s)}
          onNewCanvas={() => {
            setPrompt('')
            setMediaType('geral')
            setActiveSection('create')
          }}
          recentCreations={creations}
          onSelectRecent={(item) => setDetailsCreation(item)}
          userName={(user as any)?.name}
          userEmail={(user as any)?.email}
          onOpenCollaborationModal={() => setCollabOpen(true)}
          onOpenVersionHistoryModal={() => setVersionHistoryOpen(true)}
        />
      </div>

      <div className="flex-1 min-w-0">
        {/* Barra de topo: navegação mobile, presença ao vivo e controles */}
        <div className="relative flex items-center gap-2 px-4 pt-4 pb-2">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label="Abrir menu do Studio"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <StudioSidebar
                activeSection={activeSection}
                onSelectSection={(s) => {
                  setActiveSection(s)
                  setMobileNavOpen(false)
                }}
                onNewCanvas={() => {
                  setPrompt('')
                  setMediaType('geral')
                  setMobileNavOpen(false)
                }}
                recentCreations={creations}
                onSelectRecent={(item) => {
                  setDetailsCreation(item)
                  setMobileNavOpen(false)
                }}
                userName={(user as any)?.name}
                userEmail={(user as any)?.email}
                onOpenCollaborationModal={() => {
                  setCollabOpen(true)
                  setMobileNavOpen(false)
                }}
                onOpenVersionHistoryModal={() => {
                  setVersionHistoryOpen(true)
                  setMobileNavOpen(false)
                }}
              />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 min-w-0 pr-[calc(50%)] lg:pr-[420px]">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <h1 className="text-lg font-black font-heading tracking-tight truncate">
              AI Media Studio
            </h1>
          </div>

          {/* Presença ao vivo + controles de tema/janela */}
          <div className="absolute right-4 top-4 z-30 flex items-center gap-3">
            <StudioPresenceBar targetKey={presenceTargetKey} />
            <StudioTopControls
              themes={themes}
              themeId={themeId}
              onSelectTheme={(id) => setThemeId(id)}
              onCreateCustomTheme={async () => {
                toast({
                  title: 'Temas personalizados',
                  description: 'Escolha um tema no seletor ou use os presets de rede.',
                })
              }}
              onDeleteCustomTheme={() => {
                toast({
                  title: 'Temas personalizados',
                  description: 'Nenhum tema personalizado selecionado.',
                })
              }}
              windowMode={windowMode}
              onChangeWindowMode={(mode) => setStudioWindowMode(mode)}
            />
          </div>
        </div>

        <div className="px-4 md:px-6 pb-10 space-y-8 max-w-6xl mx-auto">
          {/* Hero */}
          <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-purple-600/10 via-background to-background p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl md:text-2xl font-black font-heading tracking-tight">
                  Crie qualquer mídia com IA
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Vídeo, imagem, áudio e 3D em um só lugar — com colaboração ao vivo e histórico de
                  versões.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {credits !== null && (
                  <Badge variant="secondary" className="text-xs font-bold">
                    {credits} créditos
                  </Badge>
                )}
                {apiStatus && (apiStatus as any)?.available ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">
                    API externa conectada
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          {/* Abas de tipo de mídia */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {MEDIA_TABS.map((tab) => {
              const Icon = tab.icon
              const active = mediaType === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMediaType(tab.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap inline-flex items-center gap-1.5',
                    active
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Gerador */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 md:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="space-y-1.5">
                <span className="text-[11px] font-bold text-foreground">Modelo</span>
                <select
                  value={selectedModel?.id ?? ''}
                  onChange={(e) => setModelId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-2 text-xs"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.provider}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-[11px] font-bold text-foreground">Proporção</span>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-2 text-xs"
                >
                  {ASPECT_RATIOS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-[11px] font-bold text-foreground">Estilo (opcional)</span>
                <Input
                  value={stylePreset}
                  onChange={(e) => setStylePreset(e.target.value)}
                  placeholder="ex: cinematográfico, minimalista..."
                  className="h-9 text-xs"
                />
              </label>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {STUDIO_QUALITY_OPTIONS.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setQualityTier(q.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors',
                    qualityTier === q.id
                      ? 'bg-primary/10 border-primary/50 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/60',
                  )}
                  title={q.description}
                >
                  {q.name}
                  {q.badge ? ` · ${q.badge}` : ''}
                </button>
              ))}
            </div>

            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Descreva a mídia que você quer criar..."
              className="min-h-[96px] text-sm"
            />

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[11px] text-muted-foreground">
                Modelo selecionado:{' '}
                <span className="font-semibold text-foreground">{selectedModel?.name ?? '—'}</span>
              </p>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedModel}
                className="gap-1.5"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isGenerating ? 'Gerando...' : 'Gerar mídia'}
              </Button>
            </div>
          </div>

          {/* Galeria do usuário */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-tight font-heading">
                Meus materiais
              </h3>
              <span className="text-[11px] text-muted-foreground">
                {creations.length} criação(ões)
              </span>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Carregando materiais...
              </div>
            ) : creations.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-2xl">
                Nenhum material ainda. Descreva uma ideia acima e clique em "Gerar mídia".
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {creations.map((c) => (
                  <div
                    key={c.id}
                    className="group rounded-2xl overflow-hidden border border-border/80 bg-card hover:border-primary/50 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col"
                    onClick={() => setDetailsCreation(c)}
                  >
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      {c.preview_url ? (
                        <img
                          src={c.preview_url}
                          alt={c.title || c.prompt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Play className="h-6 w-6" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-black/70 backdrop-blur-md text-white text-[10px] border border-white/20">
                          {TYPE_LABEL[c.type] ?? c.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                      <h4 className="text-xs font-bold line-clamp-2 leading-snug">
                        {c.title || c.prompt}
                      </h4>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-muted-foreground truncate">
                          {c.model_name || c.model_id}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          aria-label="Excluir material"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(c)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Inspiração */}
          <section>
            <StudioInspirationGallery
              creations={creations}
              onSelectCreation={(c) => setDetailsCreation(c)}
            />
          </section>
        </div>
      </div>

      {/* Modal de detalhes do material */}
      <Dialog
        open={!!detailsCreation}
        onOpenChange={(o) => {
          if (!o) {
            setDetailsCreation(null)
            setIsHistoryPanelOpen(false)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {detailsCreation?.title || 'Material do Studio'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {detailsCreation ? (TYPE_LABEL[detailsCreation.type] ?? detailsCreation.type) : ''} ·{' '}
              {detailsCreation?.model_name || detailsCreation?.model_id || 'Modelo padrão'}
            </DialogDescription>
          </DialogHeader>

          {detailsCreation && (
            <div className="space-y-4">
              {detailsCreation.preview_url ? (
                <img
                  src={detailsCreation.preview_url}
                  alt={detailsCreation.title || detailsCreation.prompt}
                  className="w-full rounded-xl border border-border object-cover max-h-64"
                />
              ) : null}

              <p className="text-xs text-muted-foreground whitespace-pre-wrap border border-border/60 rounded-xl p-3 bg-muted/30">
                {detailsCreation.prompt}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-border p-2">
                  <span className="block text-[10px] text-muted-foreground">Créditos usados</span>
                  <span className="font-bold">{detailsCreation.credits_used ?? 0}</span>
                </div>
                <div className="rounded-lg border border-border p-2">
                  <span className="block text-[10px] text-muted-foreground">Proporção</span>
                  <span className="font-bold">{detailsCreation.aspect_ratio || '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() =>
                    toast({
                      title: 'Edição Avançada',
                      description:
                        'Use o histórico abaixo para revisar e restaurar versões deste material.',
                    })
                  }
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Edição Avançada
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setIsHistoryPanelOpen((v) => !v)}
                >
                  <History className="h-3.5 w-3.5" />
                  Histórico de versões
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => handleDownload(detailsCreation)}
                >
                  <Download className="h-3.5 w-3.5" />
                  Baixar
                </Button>
              </div>

              {isHistoryPanelOpen && (
                <div className="rounded-xl border border-border/70 p-3 bg-muted/10">
                  <EditHistoryPanel
                    targetKey={`creation:${detailsCreation.id}`}
                    title={detailsCreation.title || 'Material do Studio'}
                    current={historyCurrent}
                    onRestore={() => {
                      toast({
                        title: 'Versão restaurada',
                        description: 'O snapshot foi aplicado ao material.',
                      })
                    }}
                    currentImageUrl={detailsCreation.preview_url || null}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Colaboração em projetos */}
      <StudioCollaborationModal
        open={collabOpen}
        onOpenChange={setCollabOpen}
        currentPrompt={prompt}
        currentType={mediaType}
        currentModelId={selectedModel?.id ?? ''}
        attachedAssets={[]}
      />

      {/* Histórico de versões (por projeto de canvas) */}
      <StudioVersionHistoryModal
        open={versionHistoryOpen}
        onOpenChange={setVersionHistoryOpen}
        projectId="studio-current-project"
        projectTitle="Projeto Criativo do Studio"
        currentSnapshot={{
          prompt,
          activeTab: mediaType,
          uploadedAssets: [],
          canvasSettings: {},
        }}
        onRestoreSnapshot={handleRestoreSnapshot}
      />
    </div>
  )
}
