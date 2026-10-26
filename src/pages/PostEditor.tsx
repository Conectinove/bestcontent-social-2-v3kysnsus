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
import { improveText, generateCaption } from '@/services/ai'
import { approvePost } from '@/services/approval'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { AssetsPanel } from '@/components/AssetsPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useWorkspace, type WidgetType } from '@/hooks/use-workspace'
import { WorkspaceLayout } from '@/components/workspace/WorkspaceLayout'
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader'
import { ImageBankModal } from '@/components/ImageBankModal'
import {
  ContentDraftWidget,
  CaptionWidget,
  MediaWidget,
  ScheduleWidget,
  PreviewWidget,
  MetricsWidget,
  TemplatesWidget,
} from '@/components/workspace/editor-widgets'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
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
  const [publishing, setPublishing] = useState(false)
  const [approving, setApproving] = useState(false)
  const [improving, setImproving] = useState(false)
  const [captionVariations, setCaptionVariations] = useState<
    Array<{ title: string; text: string; cta?: string }>
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

  const handleSave = async (publish = false) => {
    if (!postId) return
    if (!content.trim()) {
      toast({ title: 'Atenção', description: 'Escreva o conteúdo do post.' })
      return
    }
    if (publish) setPublishing(true)
    else setSaving(true)
    try {
      const data: Record<string, unknown> = {
        content,
        caption,
        platform,
        brand: brandId,
        status: publish ? 'published' : status,
      }
      if (scheduledDate) data.scheduled_date = scheduledDate
      if (mediaFile) data.media = mediaFile
      if (placedElements.length > 0) data.script_json = JSON.stringify({ placedElements })
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
        return <ContentDraftWidget content={content} setContent={setContent} />
      case 'metrics':
        return <MetricsWidget />
      case 'caption':
        return (
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
          />
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
                onClick={() => handleSave(false)}
                disabled={saving || publishing || approving}
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
          </h1>
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
        <div
          ref={canvasRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="relative w-full h-64 rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors overflow-hidden bg-muted/30 shadow-xs"
        >
          {mediaPreview ? (
            <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs">Clique para enviar uma imagem</span>
            </button>
          )}
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
              className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[10px] text-white flex items-center gap-1 hover:bg-black/80 transition-colors z-20"
            >
              <Upload className="w-3 h-3" /> Trocar
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        {placedElements.length > 0 && (
          <p className="text-[10px] text-muted-foreground">
            {placedElements.length} elemento(s) na arte • Clique para remover
          </p>
        )}
      </div>
    </WorkspaceLayout>
  )
}
