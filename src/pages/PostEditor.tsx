import { useState, useEffect, useRef, type ChangeEvent } from 'react'
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
} from 'lucide-react'
import { getPost, updatePost } from '@/services/posts'
import { improveText } from '@/services/ai'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn', 'Twitter/X']

export default function PostEditor() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { brands } = useSocial()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
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
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="border-b border-border pb-4 flex items-center gap-3">
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

      <Card className="p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold block mb-1">Imagem</label>
          <div className="relative w-full h-48 rounded-lg border-2 border-dashed border-border overflow-hidden bg-muted/40">
            {mediaPreview ? (
              <>
                <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <span className="text-white text-xs flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" /> Trocar imagem
                  </span>
                </button>
              </>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ImageIcon className="w-8 h-8" />
                <span className="text-xs">Clique para enviar uma imagem</span>
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
            className="h-36 text-xs"
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
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/feed')}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => handleSave(false)}
            disabled={saving || publishing}
            className="text-xs gap-1"
            variant="outline"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Salvar Rascunho
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving || publishing}
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
  )
}
