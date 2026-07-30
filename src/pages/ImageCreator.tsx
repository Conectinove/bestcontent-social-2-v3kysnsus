import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  ChevronLeft,
  ArrowRight,
  Upload,
  Hash,
  Loader2,
  CheckCircle2,
  Calendar,
  Image as ImageIcon,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
} from 'lucide-react'
import { useSocial } from '@/context/SocialContext'
import { useAuth } from '@/context/AuthContext'
import { createScheduledPost } from '@/services/scheduled_posts'
import { generateCaption, generateHashtags } from '@/services/ai'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const PLATFORMS = [
  { id: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { id: 'LinkedIn', icon: Linkedin, color: 'text-blue-500' },
  { id: 'Twitter/X', icon: Twitter, color: 'text-sky-400' },
]

const TEMPLATES = [
  {
    id: 't1',
    title: 'Produto em Destaque',
    img: 'https://img.usecurling.com/p/400/400?q=product%20showcase&color=blue',
  },
  {
    id: 't2',
    title: 'Citação Inspiradora',
    img: 'https://img.usecurling.com/p/400/400?q=quote%20motivational&color=purple',
  },
  {
    id: 't3',
    title: 'Antes & Depois',
    img: 'https://img.usecurling.com/p/400/400?q=before%20after%20transformation&color=green',
  },
  {
    id: 't4',
    title: 'Promoção',
    img: 'https://img.usecurling.com/p/400/400?q=sale%20discount%20promotion&color=orange',
  },
  {
    id: 't5',
    title: 'Dica Rápida',
    img: 'https://img.usecurling.com/p/400/400?q=tip%20idea%20lightbulb&color=yellow',
  },
  {
    id: 't6',
    title: 'Minimalista',
    img: 'https://img.usecurling.com/p/400/400?q=minimal%20clean%20design&color=gray',
  },
]

export default function ImageCreator() {
  const { brands, addPost } = useSocial()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [platform, setPlatform] = useState('Instagram')
  const [template, setTemplate] = useState<string | null>(null)
  const [media, setMedia] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  )
  const [aiLoading, setAiLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const aiGenerate = async (type: 'caption' | 'hashtags') => {
    setAiLoading(true)
    try {
      if (type === 'caption') {
        const r = await generateCaption(caption || 'post generico', platform)
        setCaption((r as any).caption || '')
      } else {
        const r = await generateHashtags(caption || 'post generico')
        setHashtags(((r as any).hashtags || []).join(' '))
      }
      toast({ title: 'IA aplicada!', description: 'Conteudo gerado com sucesso.' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setAiLoading(false)
    }
  }

  const handleSave = async (status: 'draft' | 'scheduled' | 'published') => {
    if (!brands[0]?.id) {
      toast({
        title: 'Marca necessaria',
        description: 'Voce precisa criar uma marca antes de salvar. Acesse Marcas para criar.',
      })
      return
    }
    setSubmitting(true)
    try {
      const fullCaption = `${caption}\n\n${hashtags}`.trim()
      const record = await addPost({
        brandId: brands[0].id,
        platform,
        content: caption,
        caption: fullCaption,
        status,
        media,
        scheduledDate: status === 'scheduled' ? new Date(scheduledDate).toISOString() : undefined,
      })
      if (status === 'scheduled' && record?.id) {
        await createScheduledPost({
          user: user?.id,
          post: record.id,
          scheduled_at: new Date(scheduledDate).toISOString(),
          status: 'pending',
        })
      }
      toast({
        title:
          status === 'published'
            ? 'Publicado!'
            : status === 'scheduled'
              ? 'Agendado!'
              : 'Rascunho salvo!',
      })
      navigate(status === 'scheduled' ? '/app/calendar' : '/app/feed')
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const mediaUrl = media
    ? URL.createObjectURL(media)
    : 'https://img.usecurling.com/p/500/500?q=social%20media%20placeholder'

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (step > 1 ? setStep(step - 1) : navigate('/app/criar'))}
          className="text-xs gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" /> Criar Post de Imagem
        </h1>
        <span className="text-xs text-muted-foreground ml-auto">Passo {step} de 5</span>
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-base font-bold">Escolha a plataforma</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PLATFORMS.map((p) => {
              const Icon = p.icon
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setPlatform(p.id)
                    setStep(2)
                  }}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col items-center gap-2 ${platform === p.id ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-border hover:border-primary/40'}`}
                >
                  <Icon className={`w-7 h-7 ${p.color}`} />
                  <span className="text-xs font-semibold">{p.id}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-base font-bold">Escolha um template</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => {
                  setTemplate(tpl.id)
                  setStep(3)
                }}
                className={`rounded-xl overflow-hidden border cursor-pointer transition-all ${template === tpl.id ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/40'}`}
              >
                <img src={tpl.img} alt={tpl.title} className="w-full aspect-square object-cover" />
                <p className="text-xs font-semibold p-2 text-center">{tpl.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-base font-bold">Upload de midia</h2>
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-muted/20">
            {media ? (
              <img src={mediaUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
            ) : (
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {media ? media.name : 'Clique para selecionar'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-xs"
              onClick={() => document.getElementById('img-media-input')?.click()}
            >
              Selecionar arquivo
            </Button>
            <input
              id="img-media-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setMedia(e.target.files?.[0] || null)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(4)} className="text-xs gap-1">
              Proximo <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-base font-bold">Legenda e hashtags</h2>
          <Card className="p-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold">Legenda</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => aiGenerate('caption')}
                  disabled={aiLoading}
                  className="text-xs text-primary h-6 gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />{' '}
                  {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Gerar com IA'}
                </Button>
              </div>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Digite a legenda..."
                className="h-24 text-xs"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold">Hashtags</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => aiGenerate('hashtags')}
                  disabled={aiLoading}
                  className="text-xs text-primary h-6 gap-1"
                >
                  <Hash className="w-3.5 h-3.5" />{' '}
                  {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Gerar'}
                </Button>
              </div>
              <Textarea
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#hashtag1 #hashtag2..."
                className="h-16 text-xs"
              />
            </div>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => setStep(5)} className="text-xs gap-1">
              Proximo <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-base font-bold">Revisao e publicacao</h2>
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {platform}
              </Badge>
              {media && (
                <Badge variant="secondary" className="text-xs">
                  {media.name}
                </Badge>
              )}
            </div>
            <div className="h-48 bg-muted rounded-lg overflow-hidden">
              <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <p className="text-xs text-foreground whitespace-pre-line">{caption}</p>
            <p className="text-xs text-primary">{hashtags}</p>
            <div>
              <label className="text-xs font-semibold block mb-1">Agendar para</label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full text-xs bg-muted border border-border rounded-md px-3 py-2"
              />
            </div>
          </Card>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave('draft')}
              disabled={submitting}
              className="text-xs"
            >
              Rascunho
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave('scheduled')}
              disabled={submitting}
              className="text-xs gap-1"
            >
              <Calendar className="w-3.5 h-3.5" /> {submitting ? 'Enviando...' : 'Agendar'}
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave('published')}
              disabled={submitting}
              className="bg-green-600 text-white text-xs gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Publicar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
