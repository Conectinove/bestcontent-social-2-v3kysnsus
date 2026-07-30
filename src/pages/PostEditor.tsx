import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Sparkles, Save, Loader2, ArrowLeft, Upload } from 'lucide-react'
import { getPost, updatePost } from '@/services/posts'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn', 'Twitter/X']

export default function PostEditor() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { brands } = useSocial()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState('')
  const [caption, setCaption] = useState('')
  const [platform, setPlatform] = useState('Instagram')
  const [brandId, setBrandId] = useState('')
  const [status, setStatus] = useState('draft')
  const [trendId, setTrendId] = useState('')

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
      })
      .catch(() => {
        toast({ title: 'Erro', description: 'Post não encontrado.', variant: 'destructive' })
        navigate('/app/feed')
      })
      .finally(() => setLoading(false))
  }, [postId, navigate])

  const handleSave = async () => {
    if (!postId) return
    if (!content.trim() && !caption.trim()) {
      toast({ title: 'Atenção', description: 'Escreva o conteúdo.' })
      return
    }
    setSaving(true)
    try {
      await updatePost(postId, { content, caption, platform, brand: brandId, status })
      toast({ title: 'Salvo!', description: 'Post atualizado com sucesso.' })
      navigate('/app/feed')
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
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
          <label className="text-xs font-semibold block mb-1">Legenda</label>
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
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-white text-xs gap-1"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </Card>
    </div>
  )
}
