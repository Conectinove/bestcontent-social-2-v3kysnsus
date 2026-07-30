import { useState, useEffect, useRef, type ChangeEvent, type DragEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Save,
  Loader2,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Send,
  Wand2,
  CheckCircle2,
  X,
} from 'lucide-react'
import { getPost, updatePost } from '@/services/posts'
import { improveText } from '@/services/ai'
import { approvePost } from '@/services/approval'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { AssetsPanel } from '@/components/AssetsPanel'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import type { PremiumElement } from '@/services/premium-elements'

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn', 'Twitter/X']

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

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [approving, setApproving] = useState(false)
  const [improving, setImproving] = useState(false)
  const [content, setContent] = useState('')
  const [caption, setCaption] = useState('')
  const [platform, setPlatform] = useState('Instagram')
  const [brandId, setBrandId] = useState('')
  const [status, setStatus] = useState('draft')
  const [trendId, setTrendId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState('')
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
            /* ignore */
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
      /* ignore */
    }
  }

  const removePlacedElement = (uid: string) => {
    setPlacedElements((prev) => prev.filter((el) => el.uid !== uid))
  }

  const handleApprove = async () => {
    if (!postId || !user?.id) return
    setApproving(true)
    try {
      await approvePost(postId, user.id)
      toast({
        title: 'Post aprovado!',
        description: 'Post aprovado e adicionado à fila de publicação.',
      })
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
        description: publish ? 'Seu post foi publicado.' : 'Post atualizado com sucesso.',
      })
      navigate('/app/feed')
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex gap-4 animate-fade-in">
      <div className="flex-1 max-w-3xl space-y-4">
        <div className="border-b border-border pb-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/feed')}
            className="gap-1 text-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Editar Post <Sparkles className="w-5 h-5 text-primary" />
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Revise e ajuste o conteúdo gerado por IA.
            </p>
          </div>
          {trendId && (
            <Badge
              variant="outline"
              className="text-[10px] bg-primary/10 text-primary border-primary/20"
            >
              Gerado de Trend
            </Badge>
          )}
        </div>

        <Card className="p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1">Imagem / Canvas</label>
            <div
              ref={canvasRef}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="relative w-full h-48 rounded-lg border-2 border-dashed border-border overflow-hidden bg-muted/40"
            >
              {mediaPreview ? (
                <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
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
              <p className="text-[10px] text-muted-foreground mt-1">
                {placedElements.length} elemento(s) na arte • Clique para remover
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Marca</label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full text-xs bg-muted border border-border rounded-md px-2.5 py-2"
              >
                {brands.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Plataforma</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full text-xs bg-muted border border-border rounded-md px-2.5 py-2"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Conteúdo</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-20 text-xs"
              placeholder="Conteúdo do post..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold">Legenda</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleImproveCaption}
                disabled={improving || !caption.trim()}
                className="text-[10px] h-6 gap-1 text-primary"
              >
                {improving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3" />
                )}
                Melhorar com IA
              </Button>
            </div>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="h-32 text-xs"
              placeholder="Legenda do post..."
            />
            <span className="text-[10px] text-muted-foreground float-right mt-1">
              {caption.length} caracteres
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Data de Agendamento</label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs bg-muted border border-border rounded-md px-2.5 py-2"
              >
                <option value="draft">Rascunho</option>
                <option value="scheduled">Agendado</option>
                <option value="published">Publicado</option>
                <option value="approved">Aprovado</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/feed')}
              className="text-xs"
            >
              Cancelar
            </Button>
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
              Salvar
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
                Aprovar
              </Button>
            )}
            <Button
              onClick={() => handleSave(true)}
              disabled={saving || publishing || approving}
              className="bg-primary text-white text-xs gap-1"
            >
              {publishing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Publicar
            </Button>
          </div>
        </Card>
      </div>

      <div className="w-72 shrink-0 sticky top-4 h-[calc(100vh-2rem)] hidden lg:block">
        <AssetsPanel onDragStart={() => {}} />
      </div>
    </div>
  )
}
