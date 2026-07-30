import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Calendar,
  Save,
  Upload,
  Wand2,
  Loader2,
  Share2,
  Hash,
  FileText,
  Layout,
  X,
} from 'lucide-react'
import { useSocial } from '@/context/SocialContext'
import { useAuth } from '@/context/AuthContext'
import { createScheduledPost } from '@/services/scheduled_posts'
import { updatePost } from '@/services/posts'
import { generateCaption, generateHashtags, improveText } from '@/services/ai'
import { sharePost } from '@/lib/share'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { AIAssistantModal } from '@/components/AIAssistantModal'
import { TemplateSelector } from '@/components/TemplateSelector'
import type { PostTemplate } from '@/services/post-templates'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn', 'Twitter/X']

export default function CreatePost() {
  const { brands, addPost } = useSocial()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const initialCaption = location.state?.caption || ''
  const initialBrandId = location.state?.brandId || brands[0]?.id || ''
  const initialTemplate = (location.state?.template as PostTemplate) || null
  const [brandId, setBrandId] = useState(initialBrandId)
  const [platform, setPlatform] = useState('Instagram')
  const [content, setContent] = useState('')
  const [caption, setCaption] = useState(initialCaption)
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  )
  const [media, setMedia] = useState<File | null>(null)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [publishedText, setPublishedText] = useState('')
  const [templateOpen, setTemplateOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<PostTemplate | null>(initialTemplate)

  const selectedBrand = brands.find((b: any) => b.id === brandId)

  const handleTemplateSelect = (template: PostTemplate) => {
    setSelectedTemplate(template)
    if (template.type === 'story' && platform !== 'Instagram') {
      setPlatform('Instagram')
    }
    toast({
      title: 'Template Aplicado!',
      description: `Estrutura "${template.name}" carregada. Edite o conteúdo livremente.`,
    })
  }

  const clearTemplate = () => {
    setSelectedTemplate(null)
    toast({ title: 'Template Removido', description: 'Voltando ao editor livre.' })
  }

  const aiAction = async (type: string) => {
    const sourceText = content || caption
    if (!sourceText.trim() && type !== 'caption') {
      toast({ title: 'Atenção', description: 'Escreva algo primeiro.' })
      return
    }
    setAiLoading(type)
    try {
      if (type === 'caption') {
        const r = await generateCaption(sourceText, platform)
        setCaption((r as any).caption)
      } else if (type === 'hashtags') {
        const r = await generateHashtags(sourceText)
        setCaption((prev) => `${prev}\n\n${(r as any).hashtags.join(' ')}`.trim())
      } else if (type === 'improve') {
        const r = await improveText(content)
        setContent((r as any).content)
      }
      toast({ title: 'IA aplicada!', description: 'Mudanças aplicadas com sucesso.' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setAiLoading(null)
    }
  }

  const handleSubmit = async (status: 'draft' | 'scheduled' | 'published') => {
    if (!content.trim() && !caption.trim()) {
      toast({ title: 'Atenção', description: 'Escreva o conteúdo.' })
      return
    }
    if (!brandId) {
      toast({ title: 'Atenção', description: 'Selecione uma marca.' })
      return
    }
    setSubmitting(true)
    try {
      const record = await addPost({
        brandId,
        platform,
        content: content || caption,
        caption,
        status,
        scheduledDate: status === 'scheduled' ? new Date(scheduledDate).toISOString() : undefined,
        media,
        templateId: selectedTemplate?.id,
      })
      if (selectedTemplate?.id && record?.id) {
        await updatePost(record.id, { template_id: selectedTemplate.id })
      }
      if (status === 'scheduled' && record?.id) {
        await createScheduledPost({
          user: user?.id,
          post: record.id,
          scheduled_at: new Date(scheduledDate).toISOString(),
          status: 'pending',
        })
      }
      if (status === 'published') setPublishedText(`${caption || content}`)
      toast({
        title:
          status === 'published'
            ? 'Publicado!'
            : status === 'scheduled'
              ? 'Agendado!'
              : 'Rascunho salvo!',
        description: 'Tudo certo.',
      })
      if (status === 'scheduled') navigate('/app/calendar')
      else if (status === 'draft') navigate(`/app/brands/${brandId}`)
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const mediaUrl = media
    ? URL.createObjectURL(media)
    : 'https://img.usecurling.com/p/500/500?q=social%20media%20post'

  const tplStyles = selectedTemplate?.style_settings as Record<string, string> | undefined
  const tplBg = tplStyles?.bgColor
  const tplAccent = tplStyles?.accentColor
  const tplText = tplStyles?.textColor

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="border-b border-border pb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2 uppercase tracking-tight">
            Criar Novo Post <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Agende ou publique conteúdos para suas redes.
          </p>
        </div>
        {!selectedTemplate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTemplateOpen(true)}
            className="aggressive-button border-2 border-primary text-primary hover:bg-primary/5"
          >
            <Layout className="w-4 h-4" /> Escolher Template
          </Button>
        )}
      </div>

      {selectedTemplate && (
        <Card className="p-4 border-2 border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Layout className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-tight">
                  {selectedTemplate.name}
                </p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">
                  Template {selectedTemplate.type} aplicado
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearTemplate} className="text-xs gap-1">
              <X className="w-3.5 h-3.5" /> Remover
            </Button>
          </div>
        </Card>
      )}

      {publishedText && (
        <Card className="p-4 bg-primary/5 border-primary/30 flex items-center justify-between">
          <p className="text-xs text-foreground">Post publicado! Compartilhe nas redes:</p>
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1"
            onClick={() => sharePost(publishedText)}
          >
            <Share2 className="w-3.5 h-3.5" /> Compartilhar
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Marca *</label>
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold">Conteúdo</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => aiAction('improve')}
                  disabled={aiLoading === 'improve'}
                  className="text-xs text-primary gap-1 h-6"
                >
                  <FileText className="w-3.5 h-3.5" />{' '}
                  {aiLoading === 'improve' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    'Melhorar texto'
                  )}
                </Button>
              </div>
              <Textarea
                placeholder="Escreva o conteúdo do post..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-20 text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold">Legenda</label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => aiAction('hashtags')}
                    disabled={aiLoading === 'hashtags'}
                    className="text-xs text-primary gap-1 h-6"
                  >
                    <Hash className="w-3.5 h-3.5" />{' '}
                    {aiLoading === 'hashtags' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      'Hashtags'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAiModalOpen(true)}
                    className="text-xs text-primary gap-1 h-6"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Gerar com IA
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="Legenda do post..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="h-28 text-xs"
              />
              <span className="text-[10px] text-muted-foreground float-right mt-1">
                {caption.length} caracteres
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Mídia</label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center bg-muted/20">
                <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                <p className="text-xs text-muted-foreground mt-1">
                  {media ? media.name : 'Clique para selecionar'}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-7 mt-2"
                  onClick={() => document.getElementById('media-input')?.click()}
                >
                  Selecionar arquivo
                </Button>
                <input
                  id="media-input"
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => setMedia(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Agendamento</label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full text-xs bg-muted border border-border rounded-md px-3 py-2"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSubmit('draft')}
                disabled={submitting}
                className="text-xs gap-1"
              >
                <Save className="w-3.5 h-3.5" /> Rascunho
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSubmit('scheduled')}
                  disabled={submitting}
                  className="bg-primary text-white text-xs gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" /> {submitting ? 'Enviando...' : 'Agendar'}
                </Button>
                <Button
                  onClick={() => handleSubmit('published')}
                  disabled={submitting}
                  className="bg-green-600 text-white text-xs gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Publicar
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground block text-center">
            Pré-visualização ({platform}){selectedTemplate && ' · Template aplicado'}
          </label>
          <Card
            className="max-w-sm mx-auto overflow-hidden shadow-lg transition-colors duration-300"
            style={tplBg ? { backgroundColor: tplBg } : undefined}
          >
            <div
              className="p-3 border-b border-border flex items-center gap-2"
              style={
                tplBg ? { borderColor: tplAccent || '#BF2A95', backgroundColor: tplBg } : undefined
              }
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                <img src={selectedBrand?.logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <span
                  className="font-semibold text-xs block"
                  style={tplText ? { color: tplText } : undefined}
                >
                  {selectedBrand?.name}
                </span>
                <span className="text-[10px] text-muted-foreground">{platform}</span>
              </div>
            </div>
            <div className="h-64 bg-muted overflow-hidden relative">
              <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
              {selectedTemplate && (
                <div
                  className="absolute bottom-2 right-2 px-3 py-1 rounded-full text-[10px] font-black uppercase text-white"
                  style={{ backgroundColor: tplAccent || '#BF2A95' }}
                >
                  CTA
                </div>
              )}
            </div>
            <CardContent className="p-3" style={tplBg ? { backgroundColor: tplBg } : undefined}>
              <p
                className="text-xs line-clamp-4 leading-relaxed whitespace-pre-line"
                style={tplText ? { color: tplText } : undefined}
              >
                <span className="font-semibold mr-1">{selectedBrand?.name}</span>
                {caption || 'Sua legenda aparecerá aqui...'}
              </p>
            </CardContent>
          </Card>
          <p className="text-[10px] text-muted-foreground text-center">
            Publicação direta via OAuth não disponível. Use o botão Compartilhar após publicar.
          </p>
        </div>
      </div>

      <AIAssistantModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        onApplyText={(text, hashtags) => {
          setCaption(text)
          if (hashtags) setCaption((prev) => `${prev}\n\n${hashtags.join(' ')}`.trim())
        }}
        platform={platform}
      />

      <TemplateSelector
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        onSelect={handleTemplateSelect}
      />
    </div>
  )
}
