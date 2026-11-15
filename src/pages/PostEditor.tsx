import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Loader2,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Send,
  CheckCircle2,
  X,
  Save,
} from 'lucide-react'
import { getPost, updatePost } from '@/services/posts'
import { improveText, generateCaption, generateHashtags } from '@/services/ai'
import { approvePost } from '@/services/approval'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { AssetsPanel } from '@/components/AssetsPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useWorkspace, type WidgetType } from '@/hooks/use-workspace'
import { networkIdFromPlatform } from '@/hooks/use-global-app-theme'
import { NETWORK_THEMES, type NetworkThemeId } from '@/lib/network-themes'
import { useAppTheme } from '@/hooks/use-app-theme'
import type { Brand } from '@/types'
import { WorkspaceLayout } from '@/components/workspace/WorkspaceLayout'
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader'
import { ImageBankModal } from '@/components/ImageBankModal'
import { PostSeoWidget } from '@/components/seo/PostSeoWidget'
import { useLabsFeatures } from '@/hooks/use-labs-features'
import {
  ContentDraftWidget,
  CaptionWidget,
  MediaWidget,
  ScheduleWidget,
  PreviewWidget,
  MetricsWidget,
  TemplatesWidget,
} from '@/components/workspace/editor-widgets'
import AiPostSuggestionsWidget from '@/components/guided/AiPostSuggestionsWidget'
import { SchedulePostModal } from '@/components/calendar/SchedulePostModal'
import { Calendar } from 'lucide-react'
import {
  AdvancedCustomizationPanel,
  AdvancedCustomizationState,
  DEFAULT_CUSTOMIZATION,
} from '@/components/workspace/AdvancedCustomizationPanel'
import {
  ProfessionalArtStudio,
  ArtTextLayer,
  CarouselSlide,
  AspectRatioFormat,
} from '@/components/workspace/ProfessionalArtStudio'
import { CarouselPreviewModal } from '@/components/workspace/CarouselPreviewModal'
import { createPost } from '@/services/posts'
import { Copy } from 'lucide-react'
import type { PremiumElement } from '@/services/premium-elements'

interface PlacedElement {
  uid: string
  name: string
  type: string
  data: string
  x: number
  y: number
}

export default function PostEditor() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { brands } = useSocial()
  // Motor de tema do app (accent por rede social + CSS vars do tema base)
  const appTheme = useAppTheme(brands as Brand[], user?.id || '')
  const { theme } = appTheme
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isEnabled: isLabEnabled } = useLabsFeatures()
  const canvasRef = useRef<HTMLDivElement>(null)

  const {
    leftWidgets,
    rightWidgets,
    focusMode,
    activePreset,
    reorderWidgets,
    toggleFocusMode,
    applyPreset,
  } = useWorkspace()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingAsNew, setSavingAsNew] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [approving, setApproving] = useState(false)
  const [improving, setImproving] = useState(false)
  const [captionTone, setCaptionTone] = useState<string>(() => {
    return localStorage.getItem('bestcontent_caption_tone') || 'profissional'
  })
  const [captionVariations, setCaptionVariations] = useState<
    Array<{ title: string; text: string; cta?: string }>
  >([])
  const [hookVariations, setHookVariations] = useState<
    Array<{ hook: string; type: string; explanation?: string }>
  >([])
  const [content, setContent] = useState('')
  const [caption, setCaption] = useState('')
  const [platform, setPlatform] = useState('Instagram')
  const [brandId, setBrandId] = useState('')
  const [trendId, setTrendId] = useState('')
  const [status, setStatus] = useState('draft')
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0])
  const [mediaPreview, setMediaPreview] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [imageBankOpen, setImageBankOpen] = useState(false)
  const [placedElements, setPlacedElements] = useState<PlacedElement[]>([])
  const [customization, setCustomization] =
    useState<AdvancedCustomizationState>(DEFAULT_CUSTOMIZATION)
  const [textLayers, setTextLayers] = useState<ArtTextLayer[]>([])
  const [aspectRatio, setAspectRatio] = useState<AspectRatioFormat>('4:5')
  const [isCarousel, setIsCarousel] = useState(false)
  const [slides, setSlides] = useState<CarouselSlide[]>([
    {
      id: 'slide-1',
      title: 'Capa Impactante',
      captionSnippet: 'O grande segredo que ninguém te conta sobre crescimento...',
      textLayers: [],
    },
    {
      id: 'slide-2',
      title: 'Passo 1: Diagnóstico Real',
      captionSnippet: 'Identifique o gargalo antes de acelerar os investimentos.',
      textLayers: [],
    },
    {
      id: 'slide-3',
      title: 'Chamada para Ação',
      captionSnippet: 'Salve este post para consultar quando for planejar.',
      textLayers: [],
    },
  ])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [carouselPreviewOpen, setCarouselPreviewOpen] = useState(false)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)

  useEffect(() => {
    if (!postId) return
    getPost(postId)
      .then((record: any) => {
        setContent(record.content || '')
        setCaption(record.caption || '')
        setPlatform(record.platform || 'Instagram')
        setBrandId(record.brand || '')
        setStatus(record.status || 'draft')
        setTrendId(record.trend || '')
        setScheduledDate(record.scheduled_date ? record.scheduled_date.split(' ')[0] : '')
        if (record.media?.length > 0) {
          setMediaPreview(
            `${import.meta.env.VITE_POCKETBASE_URL}/api/files/${record.collectionId}/${record.id}/${record.media[0]}`,
          )
        }
        if (record.script_json) {
          try {
            const parsed = JSON.parse(record.script_json)
            if (parsed.placedElements) setPlacedElements(parsed.placedElements)
            if (parsed.textLayers) setTextLayers(parsed.textLayers)
            if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio)
            if (parsed.isCarousel) setIsCarousel(parsed.isCarousel)
            if (parsed.slides && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
              setSlides(parsed.slides)
            }
            if (parsed.customization) {
              setCustomization((prev) => ({ ...prev, ...parsed.customization }))
            }
          } catch {
            /* intentionally ignored */
          }
        }
      })
      .catch(() => {
        toast({ title: 'Erro', description: 'Post não encontrado.', variant: 'destructive' })
        navigate('/app/feed')
      })
      .finally(() => setLoading(false))
  }, [postId, navigate])

  // Tema por rede social: o accent do app muda conforme a rede do post aberto
  useEffect(() => {
    const net = networkIdFromPlatform(platform)
    const root = document.documentElement
    if (net !== 'none') {
      root.setAttribute('data-app-theme-network', net)
      root.style.setProperty('--primary', NETWORK_THEMES[net].primary)
      root.style.setProperty('--accent', NETWORK_THEMES[net].accent)
      root.style.setProperty('--ring', NETWORK_THEMES[net].primary)
    } else {
      root.removeAttribute('data-app-theme-network')
      applyThemeVars(theme, 'none')
    }
  }, [platform, theme])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erro', description: 'Selecione uma imagem válida.', variant: 'destructive' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      })
      return
    }
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
  }

  const handleImproveCaption = async () => {
    if (!caption.trim()) return
    setImproving(true)
    try {
      const res = (await improveText(caption)) as any
      const improved = res?.content || res?.improved || res?.text || ''
      if (improved) {
        setCaption(improved)
        toast({ title: 'Legenda melhorada!', description: 'Texto refinado com IA.' })
      }
    } catch {
      toast({ title: 'Erro', description: 'Falha ao melhorar texto.', variant: 'destructive' })
    } finally {
      setImproving(false)
    }
  }

  const handleGenerateFullPackage = async () => {
    const textTheme = content.trim() || caption.trim()
    const activeBrand = brands.find((b: any) => b.id === brandId)
    const brandNiche = (activeBrand as any)?.niche || (activeBrand as any)?.segment || 'Geral'
    const brandName = activeBrand?.name || 'Minha Marca'
    const effectiveTopic = textTheme || `Dicas e estratégias práticas para ${brandNiche}`

    setImproving(true)
    try {
      const [res, hashRes] = await Promise.all([
        generateCaption({
          content: effectiveTopic,
          topic: effectiveTopic,
          platform: platform.toLowerCase(),
          tone: captionTone,
          brandName,
          brandNiche,
          variations: true,
        }) as any,
        generateHashtags({
          content: effectiveTopic,
          platform: platform.toLowerCase(),
        }).catch(() => ({ hashtags: [] })),
      ])

      if (!content.trim()) {
        const firstHook = res?.hook_variations?.[0]?.hook || ''
        const titleGenerated = firstHook
          ? firstHook
              .replace(/[#*👉🔥✨💡🚀]/g, '')
              .trim()
              .slice(0, 85)
          : `Como Ter Mais Resultados em ${brandNiche}`
        setContent(titleGenerated)
      }

      const rawTags = (hashRes as any)?.hashtags || res?.hashtags || []
      const tagsStr = Array.isArray(rawTags)
        ? rawTags.map((t: string) => (t.startsWith('#') ? t : `#${t}`)).join(' ')
        : ''

      let cap = (res?.caption || '').trim()
      if (tagsStr && !cap.includes('#')) {
        cap = `${cap}\n\n${tagsStr}`.trim()
      }
      if (cap) {
        setCaption(cap)
      }

      if (Array.isArray(res?.variations) && res.variations.length > 0) {
        setCaptionVariations(res.variations)
      }
      if (Array.isArray(res?.hook_variations) && res.hook_variations.length > 0) {
        setHookVariations(res.hook_variations)
      }

      toast({
        title: '✨ Post Completo Gerado!',
        description: 'Título, legenda, hashtags e variações aplicados com sucesso.',
      })
    } catch (err) {
      toast({ title: 'Erro na IA', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setImproving(false)
    }
  }

  const handleGenerateVariations = async () => {
    const textTheme = caption.trim() || content.trim()
    if (!textTheme) {
      toast({
        title: 'Informe um tema',
        description: 'Digite um rascunho de conteúdo ou legenda antes de gerar variações.',
      })
      return
    }
    setImproving(true)
    try {
      const activeBrand = brands.find((b: any) => b.id === brandId)
      const res = (await generateCaption({
        content: textTheme,
        platform,
        brandName: activeBrand?.name,
        brandVoice: (activeBrand as any)?.brand_voice,
        tone: captionTone,
        variations: true,
      })) as any
      if (res.variations && res.variations.length > 0) {
        setCaptionVariations(res.variations)
        toast({
          title: '3 opções geradas!',
          description: 'Selecione uma opção de legenda sugerida pela IA.',
        })
      } else if (res.caption) {
        setCaption(res.caption)
        toast({ title: 'Legenda gerada!', description: 'Texto atualizado com IA.' })
      }
      if (Array.isArray(res.hook_variations) && res.hook_variations.length > 0) {
        setHookVariations(res.hook_variations)
      }
    } catch {
      toast({
        title: 'Erro na IA',
        description: 'Falha ao gerar variações.',
        variant: 'destructive',
      })
    } finally {
      setImproving(false)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData('application/json')
    if (!raw || !canvasRef.current) return
    try {
      const el: PremiumElement = JSON.parse(raw)
      const rect = canvasRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setPlacedElements((prev) => [
        ...prev,
        {
          uid: `${Date.now()}-${Math.random()}`,
          name: el.name,
          type: el.type,
          data: el.data,
          x,
          y,
        },
      ])
    } catch {
      /* intentionally ignored */
    }
  }

  const removePlacedElement = (uid: string) =>
    setPlacedElements((prev) => prev.filter((el) => el.uid !== uid))

  const handleApprove = async () => {
    if (!postId || !user?.id) return
    setApproving(true)
    try {
      await approvePost(postId, user.id)
      toast({ title: 'Post aprovado!', description: 'Adicionado à fila de publicação.' })
      navigate('/app/calendar')
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setApproving(false)
    }
  }

  const handleSaveAsNew = async () => {
    if (!content.trim()) {
      toast({ title: 'Atenção', description: 'Escreva o conteúdo do post.' })
      return
    }
    setSavingAsNew(true)
    try {
      const metadataPayload = {
        placedElements,
        textLayers,
        aspectRatio,
        isCarousel,
        slides,
        customization,
      }
      const data: Record<string, unknown> = {
        user: user?.id,
        content: `${content} (Cópia Editada)`.trim(),
        caption,
        platform,
        brand: brandId,
        status: 'draft',
        script_json: JSON.stringify(metadataPayload),
      }
      if (scheduledDate) data.scheduled_date = scheduledDate
      if (mediaFile) data.media = mediaFile
      const created = await createPost(data)
      toast({
        title: 'Salvo como Novo Post!',
        description:
          'Uma nova criação independente foi salva na Biblioteca sem sobrescrever o original.',
      })
      if (created?.id) {
        navigate(`/app/editor/${created.id}`)
      } else {
        navigate('/app/library')
      }
    } catch (err) {
      toast({
        title: 'Erro ao salvar novo post',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSavingAsNew(false)
    }
  }

  const handleSave = async (publish = false) => {
    if (!postId) return
    if (!content.trim()) {
      toast({ title: 'Atenção', description: 'Escreva o conteúdo do post.' })
      return
    }
    if (publish) setPublishing(true)
    else setSaving(true)
    try {
      const metadataPayload = {
        placedElements,
        textLayers,
        aspectRatio,
        isCarousel,
        slides,
        customization,
      }
      const data: Record<string, unknown> = {
        content,
        caption,
        platform,
        brand: brandId,
        status: publish ? 'published' : status,
        script_json: JSON.stringify(metadataPayload),
      }
      if (scheduledDate) data.scheduled_date = scheduledDate
      if (mediaFile) data.media = mediaFile
      await updatePost(postId, data)
      toast({
        title: publish ? 'Publicado!' : 'Salvo!',
        description: publish ? 'Seu post foi publicado.' : 'Post atualizado.',
      })
      navigate('/app/feed')
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
      setPublishing(false)
    }
  }

  const selectedBrand = brands.find((b: any) => b.id === brandId)

  const renderWidget = (type: WidgetType): ReactNode => {
    switch (type) {
      case 'assets':
        return <AssetsPanel onDragStart={() => {}} />
      case 'templates':
        return <TemplatesWidget />
      case 'content-draft':
        return (
          <div className="space-y-4">
            <ContentDraftWidget content={content} setContent={setContent} />
            <AiPostSuggestionsWidget
              currentBrandName={selectedBrand?.name}
              currentBrandNiche={selectedBrand?.niche}
              currentTheme={content}
              currentTone={captionTone}
              selectedNetwork={platform}
              onApplySuggestion={({ title, caption: capText }) => {
                setContent(title)
                setCaption(capText)
                toast({
                  title: 'Sugestão de IA aplicada ao editor!',
                  description:
                    'Título e estrutura de copy foram atualizados com o contexto do post.',
                })
              }}
            />
          </div>
        )
      case 'metrics':
        return <MetricsWidget />
      case 'caption':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-500/25">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Gerador Completo com IA</h4>
                  <p className="text-[10px] text-muted-foreground">
                    Título + Legenda + Hashtags + 3 Ganchos
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateFullPackage}
                disabled={improving}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5 h-8 px-3 rounded-xl shadow-xs"
              >
                {improving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Gerar com IA</span>
              </Button>
            </div>

            {/* Variações de Gancho em 1-clique */}
            {hookVariations.length > 0 && (
              <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/40 space-y-2 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />3 Variações de Gancho (1-clique para
                    aplicar):
                  </span>
                  <button
                    type="button"
                    onClick={() => setHookVariations([])}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Dispensar
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {hookVariations.map((v, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const lines = caption.split('\n')
                        const newCaption = [v.hook, ...lines.slice(1)].join('\n')
                        setCaption(newCaption)
                        toast({
                          title: 'Gancho aplicado!',
                          description: `Variação "${v.type}" aplicada ao topo da legenda.`,
                        })
                      }}
                      className="p-2 text-left rounded-lg bg-card hover:bg-muted/80 border border-border/80 transition-all text-xs group"
                    >
                      <span className="font-bold text-purple-600 dark:text-purple-400 block text-[10px] uppercase">
                        {v.type}
                      </span>
                      <p className="text-foreground font-medium text-[11px] mt-0.5">{v.hook}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <CaptionWidget
              caption={caption}
              setCaption={setCaption}
              onImprove={handleImproveCaption}
              improving={improving}
              onGenerateVariations={handleGenerateVariations}
              variations={captionVariations}
              onSelectVariation={(chosen) => {
                setCaption(chosen)
                toast({ title: 'Opção aplicada!', description: 'Legenda do post atualizada.' })
              }}
              currentTone={captionTone}
              onToneChange={(tone) => setCaptionTone(tone)}
              currentPlatform={platform}
              onPlatformChange={(net) => setPlatform(net)}
            />
            <div id="post-seo-widget-section">
              <PostSeoWidget
                caption={caption || content}
                title={content}
                network={platform || 'instagram'}
                niche={selectedBrand?.niche || selectedBrand?.name}
                tone={captionTone}
                onApplyImprovement={(improved) => {
                  setCaption(improved)
                }}
              />
            </div>
          </div>
        )
      case 'media':
        return (
          <MediaWidget
            mediaPreview={mediaPreview}
            onFileChange={handleFileChange}
            onOpenImageBank={() => setImageBankOpen(true)}
          />
        )
      case 'schedule':
        return (
          <ScheduleWidget
            brandId={brandId}
            setBrandId={setBrandId}
            platform={platform}
            setPlatform={setPlatform}
            status={status}
            setStatus={setStatus}
            scheduledDate={scheduledDate}
            setScheduledDate={setScheduledDate}
            brands={brands}
          />
        )
      case 'preview':
        return (
          <PreviewWidget
            caption={caption}
            platform={platform}
            brandName={selectedBrand?.name || ''}
            mediaPreview={mediaPreview}
          />
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <ImageBankModal
          open={imageBankOpen}
          onOpenChange={setImageBankOpen}
          onSelectImage={(url) => {
            setMediaPreview(url)
            toast({
              title: 'Imagem aplicada!',
              description: 'A imagem do banco interno foi adicionada ao post.',
            })
          }}
        />
      </div>
    )
  }
  return (
    <WorkspaceLayout
      leftWidgets={leftWidgets}
      rightWidgets={rightWidgets}
      focusMode={focusMode}
      onReorder={reorderWidgets}
      renderWidget={renderWidget}
      header={
        <WorkspaceHeader
          focusMode={focusMode}
          onToggleFocus={toggleFocusMode}
          activePreset={activePreset}
          onApplyPreset={applyPreset}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAsNew}
                disabled={saving || savingAsNew || publishing || approving}
                className="text-xs gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                title="Salvar como cópia sem sobrescrever o post original"
              >
                {savingAsNew ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Salvar como Novo Post</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScheduleModalOpen(true)}
                disabled={saving || savingAsNew || publishing || approving}
                className="text-xs gap-1 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 font-semibold"
                title="Agendar data e horário de publicação em até 2 cliques"
              >
                <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Agendar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(false)}
                disabled={saving || savingAsNew || publishing || approving}
                className="text-xs gap-1"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Salvar</span>
              </Button>
              {(status === 'draft' || status === 'scheduled') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApprove}
                  disabled={saving || publishing || approving}
                  className="text-xs gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                >
                  {approving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Aprovar</span>
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => handleSave(true)}
                disabled={saving || publishing || approving}
                className="bg-primary text-white text-xs gap-1"
              >
                {publishing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Publicar</span>
              </Button>
            </>
          }
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/feed')}
            className="gap-1 text-xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <h1 className="text-lg font-bold flex items-center gap-2 min-w-0">
            <span className="truncate">Editar Post</span>
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const el = document.getElementById('post-seo-widget-section')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              className="h-6 px-2 text-[10px] font-bold rounded-lg border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 flex items-center gap-1 shrink-0"
              title="Ver análise detalhada de SEO da legenda"
            >
              <span>SEO</span>
              <Badge
                variant="outline"
                className="text-[9px] px-1 py-0 h-3.5 border-none bg-purple-500/10 font-mono font-bold"
              >
                Checklist
              </Badge>
            </Button>
          </h1>
          {status === 'scheduled' && scheduledDate && (
            <Badge
              variant="outline"
              className="text-[10px] bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 shrink-0 font-bold flex items-center gap-1 shadow-2xs"
            >
              ⏰ Agendado para{' '}
              {(() => {
                try {
                  const parts = scheduledDate.split('T')[0].split('-')
                  if (parts.length === 3) {
                    return `${parts[2]}/${parts[1]}`
                  }
                  return scheduledDate
                } catch {
                  return scheduledDate
                }
              })()}{' '}
              às 10h
            </Badge>
          )}
          {trendId && (
            <Badge
              variant="outline"
              className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0"
            >
              Gerado de Trend
            </Badge>
          )}
        </WorkspaceHeader>
      }
    >
      <div className="space-y-3 pb-4">
        {/* Canvas de Pré-visualização da Arte com Suporte a Formato e Camadas */}
        <div className="flex justify-center">
          <div
            ref={canvasRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`relative w-full ${
              aspectRatio === '4:5'
                ? 'max-w-md aspect-[4/5] max-h-[460px]'
                : aspectRatio === '9:16'
                  ? 'max-w-xs aspect-[9/16] max-h-[500px]'
                  : aspectRatio === '16:9'
                    ? 'max-w-lg aspect-[16/9] max-h-[320px]'
                    : 'max-w-md aspect-square max-h-[420px]'
            } rounded-2xl border-2 border-dashed border-border/80 hover:border-purple-500/50 transition-colors overflow-hidden bg-muted/30 shadow-xs`}
          >
            {mediaPreview ? (
              <div className="w-full h-full relative overflow-hidden">
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="w-full h-full object-cover transition-all"
                  style={{
                    filter: `brightness(${customization.brightness}%) contrast(${customization.contrast}%) saturate(${customization.saturation}%) blur(${customization.blur}px)`,
                  }}
                />
                {/* Camada de sobreposição configurável */}
                <div
                  className="absolute inset-0 pointer-events-none transition-all"
                  style={{
                    backgroundColor:
                      customization.gradientMode === 'none'
                        ? customization.overlayColor
                        : undefined,
                    backgroundImage:
                      customization.gradientMode === 'linear'
                        ? `linear-gradient(135deg, ${customization.primaryColor}80, ${customization.secondaryColor}80)`
                        : customization.gradientMode === 'radial'
                          ? `radial-gradient(circle, ${customization.primaryColor}80, ${customization.secondaryColor}80)`
                          : undefined,
                    opacity: customization.overlayOpacity / 100,
                  }}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-purple-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary p-6 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-foreground">
                  Clique para enviar uma imagem
                </span>
                <span className="text-[10px] text-muted-foreground max-w-xs">
                  JPEG, PNG ou WebP até 10MB • Arraste ícones e texturas do painel esquerdo
                </span>
              </button>
            )}

            {/* Camadas de Texto Renderizadas Sobre a Arte */}
            {textLayers.map((layer) => (
              <div
                key={layer.id}
                className="absolute z-20 pointer-events-none drop-shadow-md px-2 py-0.5 rounded transition-all select-none"
                style={{
                  left: `${layer.x}%`,
                  top: `${layer.y}%`,
                  transform: 'translate(-50%, -50%)',
                  color: layer.color,
                  fontSize: `${layer.fontSize}px`,
                  fontWeight: layer.fontWeight,
                  textAlign: layer.align,
                  backgroundColor: layer.bgColor || 'rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(2px)',
                }}
              >
                {layer.text}
              </div>
            ))}

            {placedElements.map((el) => (
              <div
                key={el.uid}
                className="absolute cursor-pointer group/el z-10"
                style={{ left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%, -50%)' }}
                onClick={() => removePlacedElement(el.uid)}
              >
                {el.type === 'texture' ? (
                  <div className="w-16 h-16 rounded shadow-lg" style={{ background: el.data }} />
                ) : (
                  <div
                    className="w-12 h-12 text-primary pointer-events-none drop-shadow-lg"
                    dangerouslySetInnerHTML={{ __html: el.data }}
                  />
                )}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover/el:opacity-100 transition-opacity">
                  <X className="w-2.5 h-2.5" />
                </div>
              </div>
            ))}

            {mediaPreview && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white flex items-center gap-1 hover:bg-black/80 transition-colors z-30 font-semibold"
              >
                <Upload className="w-3 h-3" /> Trocar Foto
              </button>
            )}

            {/* Badge de Indicador de Formato no Canvas */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-xs text-white text-[9px] font-mono z-30 pointer-events-none">
              {aspectRatio} •{' '}
              {isCarousel ? `Slide ${currentSlideIndex + 1}/${slides.length}` : 'Post Estático'}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {placedElements.length > 0 && (
          <p className="text-[10px] text-muted-foreground text-center">
            {placedElements.length} elemento(s) na arte • Clique no elemento para remover
          </p>
        )}

        {/* Estúdio Profissional de Arte & Slides */}
        <ProfessionalArtStudio
          customization={customization}
          onChangeCustomization={setCustomization}
          onResetCustomization={() => setCustomization(DEFAULT_CUSTOMIZATION)}
          platform={platform}
          caption={caption || content}
          hasMedia={Boolean(mediaPreview)}
          brand={selectedBrand}
          textLayers={textLayers}
          onChangeTextLayers={setTextLayers}
          aspectRatio={aspectRatio}
          onChangeAspectRatio={setAspectRatio}
          isCarousel={isCarousel}
          onToggleCarousel={setIsCarousel}
          slides={slides}
          currentSlideIndex={currentSlideIndex}
          onChangeSlideIndex={setCurrentSlideIndex}
          onAddSlide={() => {
            const nextSlide: CarouselSlide = {
              id: `slide-${Date.now()}`,
              title: `Slide ${slides.length + 1}: Novo Ponto`,
              captionSnippet: 'Adicione informações chave para engajar seu público...',
              textLayers: [],
            }
            setSlides([...slides, nextSlide])
            setCurrentSlideIndex(slides.length)
            toast({ title: 'Slide adicionado', description: `Slide #${slides.length + 1} criado.` })
          }}
          onRemoveSlide={(idx) => {
            if (slides.length <= 1) return
            const next = slides.filter((_, i) => i !== idx)
            setSlides(next)
            setCurrentSlideIndex(Math.max(0, idx - 1))
            toast({ title: 'Slide removido' })
          }}
          onDuplicateSlide={(idx) => {
            const target = slides[idx]
            const copy: CarouselSlide = {
              ...target,
              id: `slide-${Date.now()}`,
              title: `${target.title} (Cópia)`,
            }
            const next = [...slides]
            next.splice(idx + 1, 0, copy)
            setSlides(next)
            setCurrentSlideIndex(idx + 1)
            toast({ title: 'Slide duplicado', description: 'Cópia adicionada à sequência.' })
          }}
          onMoveSlide={(from, to) => {
            if (to < 0 || to >= slides.length) return
            const next = [...slides]
            const [item] = next.splice(from, 1)
            next.splice(to, 0, item)
            setSlides(next)
            setCurrentSlideIndex(to)
          }}
          onUpdateSlide={(idx, patch) => {
            setSlides(slides.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
          }}
          onOpenPreviewCarouselModal={() => setCarouselPreviewOpen(true)}
        />

        {/* Modal de Prévia do Carrossel */}
        <CarouselPreviewModal
          open={carouselPreviewOpen}
          onOpenChange={setCarouselPreviewOpen}
          slides={slides}
          aspectRatio={aspectRatio}
          customization={customization}
          baseMediaUrl={mediaPreview}
        />

        {/* Modal Rápido de Agendamento em 2 Cliques */}
        <SchedulePostModal
          open={scheduleModalOpen}
          onOpenChange={setScheduleModalOpen}
          defaultPostId={postId}
          defaultNetwork={platform}
          onScheduled={(item) => {
            if (item.scheduled_for) {
              setScheduledDate(item.scheduled_for)
              setStatus('scheduled')
            }
            toast({
              title: 'Post agendado com sucesso!',
              description: `Agendado para ${item.scheduled_for || 'data selecionada'} na rede ${item.network || platform}.`,
              action: (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/app/calendar')}
                  className="text-xs font-bold"
                >
                  Ver no Calendário
                </Button>
              ),
            })
          }}
        />
      </div>
    </WorkspaceLayout>
  )
}
