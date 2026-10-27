import { useState, useMemo, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Calendar,
  Save,
  Upload,
  Loader2,
  Share2,
  Hash,
  FileText,
  Layout,
  X,
  Palette,
  CheckCircle2,
  Instagram,
  Facebook,
  Linkedin,
  Video,
  Youtube,
  Twitter,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Eye,
  Send,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { useSocial } from '@/context/SocialContext'
import { useAuth } from '@/context/AuthContext'
import { createScheduledPost } from '@/services/scheduled_posts'
import { updatePost } from '@/services/posts'
import { generateCaption, generateHashtags, improveText } from '@/services/ai'
import { sharePost } from '@/lib/share'
import { NetworkHashtagGenerator } from '@/components/NetworkHashtagGenerator'
import { PostSeoWidget } from '@/components/seo/PostSeoWidget'
import { useLabsFeatures } from '@/hooks/use-labs-features'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AIAssistantModal } from '@/components/AIAssistantModal'
import { TemplateSelector } from '@/components/TemplateSelector'
import { WhatToPostTodayModal } from '@/components/analytics/WhatToPostTodayModal'
import type { PostTemplate, TodayPostIdea } from '@/services/post-templates'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'

interface PlatformMeta {
  key: string
  label: string
  icon: any
  networkKey: string
  aspectRatio: string
  dimensions: string
  badgeClass: string
}

const PLATFORMS_META: PlatformMeta[] = [
  {
    key: 'Instagram',
    label: 'Instagram',
    icon: Instagram,
    networkKey: 'instagram',
    aspectRatio: '4:5',
    dimensions: '1080x1350',
    badgeClass: 'text-pink-600 bg-pink-500/10 border-pink-500/20',
  },
  {
    key: 'Facebook',
    label: 'Facebook',
    icon: Facebook,
    networkKey: 'facebook',
    aspectRatio: '1:1',
    dimensions: '1080x1080',
    badgeClass: 'text-blue-600 bg-blue-600/10 border-blue-600/20',
  },
  {
    key: 'LinkedIn',
    label: 'LinkedIn',
    icon: Linkedin,
    networkKey: 'linkedin',
    aspectRatio: '4:5',
    dimensions: '1080x1350',
    badgeClass: 'text-sky-600 bg-sky-600/10 border-sky-600/20',
  },
  {
    key: 'TikTok',
    label: 'TikTok',
    icon: Video,
    networkKey: 'tiktok',
    aspectRatio: '9:16',
    dimensions: '1080x1920',
    badgeClass: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  },
  {
    key: 'YouTube',
    label: 'YouTube',
    icon: Youtube,
    networkKey: 'youtube',
    aspectRatio: '16:9',
    dimensions: '1280x720',
    badgeClass: 'text-red-600 bg-red-600/10 border-red-600/20',
  },
  {
    key: 'Twitter/X',
    label: 'Twitter / X',
    icon: Twitter,
    networkKey: 'twitter',
    aspectRatio: '16:9',
    dimensions: '1200x675',
    badgeClass: 'text-slate-700 dark:text-slate-300 bg-slate-500/10 border-slate-500/20',
  },
  {
    key: 'Pinterest',
    label: 'Pinterest (Pin 2:3)',
    icon: Layers,
    networkKey: 'pinterest',
    aspectRatio: '2:3',
    dimensions: '1000x1500',
    badgeClass: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
  },
  {
    key: 'WhatsApp',
    label: 'WhatsApp Status / Canal',
    icon: Layers,
    networkKey: 'whatsapp',
    aspectRatio: '9:16',
    dimensions: '1080x1920',
    badgeClass: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  },
]

export default function CreatePost() {
  const { brands, addPost } = useSocial()
  const { user } = useAuth()
  const { isEnabled: isLabEnabled } = useLabsFeatures()
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
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [whatToPostOpen, setWhatToPostOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<PostTemplate | null>(initialTemplate)
  // Validação inline
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

  // ============================================================
  // PERSISTÊNCIA DO RASCUNHO — restaura ao voltar para a etapa
  // ============================================================
  const DRAFT_STORAGE_KEY = 'bestcontent_social2_create_post_draft'

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (!raw) return
      const draft = JSON.parse(raw)
      if (draft.brandId) setBrandId(draft.brandId)
      if (draft.platform) setPlatform(draft.platform)
      if (draft.content) setContent(draft.content)
      if (draft.caption) setCaption(draft.caption)
      if (draft.scheduledDate) setScheduledDate(draft.scheduledDate)
      if (draft.template) {
        setSelectedTemplate(draft.template as PostTemplate)
      }
    } catch {
      /* ignore draft restore errors */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!content.trim() && !caption.trim() && !selectedTemplate) {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      return
    }
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        brandId,
        platform,
        content,
        caption,
        scheduledDate,
        template: selectedTemplate,
      }),
    )
  }, [brandId, platform, content, caption, scheduledDate, selectedTemplate])

  // Seleciona marca ativa
  const selectedBrand = useMemo(() => {
    return brands.find((b: any) => b.id === brandId) || brands[0] || null
  }, [brands, brandId])

  // Metadados da plataforma ativa
  const currentPlatformMeta = useMemo(() => {
    return PLATFORMS_META.find((p) => p.key === platform) || PLATFORMS_META[0]
  }, [platform])

  // Trata seleção de arquivo
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMedia(file)
      const url = URL.createObjectURL(file)
      setMediaPreviewUrl(url)
    }
  }

  const removeMedia = () => {
    setMedia(null)
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl)
    setMediaPreviewUrl(null)
  }

  // Aplicação real do modelo: configura cores, aspecto, formato e textos sugeridos
  const handleTemplateSelect = (template: PostTemplate) => {
    setSelectedTemplate(template)

    // Ajusta a rede social caso o modelo seja específico
    if (template.network) {
      const targetPlat = PLATFORMS_META.find(
        (p) =>
          p.networkKey === template.network ||
          p.key.toLowerCase() === template.network?.toLowerCase(),
      )
      if (targetPlat) {
        setPlatform(targetPlat.key)
      }
    } else if (template.type === 'story' && platform !== 'Instagram' && platform !== 'TikTok') {
      setPlatform('Instagram')
    }

    // Se o usuário ainda não tiver escrito conteúdo, pré-carrega o headline do modelo
    const layout = (template.layout_data as Record<string, any>) || {}
    if (!content.trim() && layout.headline) {
      setContent(layout.headline)
    }
    if (!caption.trim() && layout.subhead) {
      const call = layout.ctaText ? `\n\n👉 ${layout.ctaText}` : ''
      setCaption(`${layout.headline || template.name}\n\n${layout.subhead}${call}`)
    }

    toast({
      title: 'Modelo Aplicado com Sucesso!',
      description: `"${template.name}" calibrado com dimensões ${template.dimensions || 'otimizadas'} e paleta personalizada.`,
    })
  }

  const clearTemplate = () => {
    setSelectedTemplate(null)
    toast({
      title: 'Modelo Desvinculado',
      description: 'Você pode escolher outro modelo ou continuar com o editor padrão.',
    })
  }

  // Ações de inteligência artificial
  const aiAction = async (type: string) => {
    const sourceText = content || caption
    if (!sourceText.trim() && type !== 'caption') {
      toast({
        title: 'Atenção',
        description: 'Digite ao menos o título ou ideia do post para a IA aprimorar.',
      })
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
        const r = await improveText(content || caption)
        setContent((r as any).content)
      }
      toast({
        title: '✨ Conteúdo Aprimorado!',
        description: 'Inteligência Artificial aplicada com sucesso.',
      })
    } catch (err) {
      toast({ title: 'Erro na IA', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setAiLoading(null)
    }
  }

  // Envio / Salvamento persistindo template_id
  const handleSubmit = async (status: 'draft' | 'scheduled' | 'published') => {
    if (!content.trim() && !caption.trim()) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Preencha o conteúdo ou legenda do seu post.',
        variant: 'destructive',
      })
      return
    }
    if (!brandId) {
      toast({
        title: 'Selecione uma Marca',
        description: 'Escolha qual marca é responsável por esta publicação.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      // Criação principal através do SocialContext
      const createdRecord = await addPost({
        brandId,
        platform,
        content: content.trim() || caption.trim(),
        caption: caption.trim(),
        status,
        scheduledDate: status === 'scheduled' ? new Date(scheduledDate).toISOString() : undefined,
        media,
        templateId: selectedTemplate?.id || '',
      })

      // Se um modelo foi selecionado, garante a atualização explícita do template_id no banco
      const postId = createdRecord?.id
      if (postId && selectedTemplate?.id) {
        await updatePost(postId, {
          template_id: selectedTemplate.id,
        })
      }

      // Se for agendado, vincula à tabela scheduled_posts
      if (status === 'scheduled' && postId) {
        await createScheduledPost({
          user: user?.id,
          post: postId,
          scheduled_at: new Date(scheduledDate).toISOString(),
          status: 'pending',
        })
      }

      // Limpa rascunho temporário do storage ao salvar com sucesso
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      } catch {
        /* ignore */
      }

      const statusLabels = {
        draft: 'Rascunho salvo',
        scheduled: 'Publicação agendada',
        published: 'Post publicado com sucesso',
      }

      toast({
        title: statusLabels[status],
        description: selectedTemplate
          ? `O modelo "${selectedTemplate.name}" foi vinculado e salvo no PocketBase.`
          : 'Conteúdo registrado com sucesso.',
      })

      if (status === 'published' && postId) {
        setPublishedPostId(postId)
      } else if (status === 'scheduled') {
        navigate('/app/calendar')
      } else {
        navigate('/app/library')
      }
    } catch (err) {
      toast({
        title: 'Falha ao salvar post',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Configurações visuais do modelo para o Preview Canvas
  const tplStyles = (selectedTemplate?.style_settings as Record<string, any>) || {}
  const tplLayout = (selectedTemplate?.layout_data as Record<string, any>) || {}
  const tplBg = tplStyles.bgColor || (selectedTemplate ? '#0F0B1E' : undefined)
  const tplAccent = tplStyles.accentColor || '#9333EA'
  const tplCtaColor = tplStyles.ctaColor || tplAccent || '#BF2A95'
  const tplText = tplStyles.textColor || (selectedTemplate ? '#FFFFFF' : undefined)
  const tplGradient =
    tplStyles.gradient || (tplBg ? `linear-gradient(145deg, ${tplBg} 0%, #1e1138 100%)` : undefined)

  // Proporção dinâmica para o Preview
  const displayRatio = selectedTemplate?.aspect_ratio || currentPlatformMeta.aspectRatio
  const displayDimensions = selectedTemplate?.dimensions || currentPlatformMeta.dimensions

  const previewRatioStyle =
    displayRatio === '9:16'
      ? 'aspect-[9/15]'
      : displayRatio === '16:9'
        ? 'aspect-[16/9]'
        : displayRatio === '4:5'
          ? 'aspect-[4/5]'
          : 'aspect-square'

  const fallbackMediaUrl =
    mediaPreviewUrl ||
    (selectedTemplate
      ? `https://img.usecurling.com/p/800/800?q=creative%20social%20design&color=purple`
      : `https://img.usecurling.com/p/800/800?q=${encodeURIComponent(
          platform.toLowerCase() + ' post',
        )}&color=purple`)

  const PlatformIcon = currentPlatformMeta.icon

  // ============================================================
  // VALIDAÇÃO INLINE CLARA POR CAMPO
  // ============================================================
  const contentError =
    touchedFields.content && !content.trim() && !caption.trim()
      ? 'Preencha o conteúdo ou a legenda para continuar.'
      : null

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12 text-foreground">
      {/* =========================================================================
          CABEÇALHO PADRÃO SOCIAL 2 / BESTCONTENT AI COM BOTÃO VOLTAR CONSISTENTE
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/criar')}
            className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground h-9 px-2.5 gap-1.5"
            title="Voltar ao Hub de Criação"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span className="hidden sm:inline">Hub Criar</span>
          </Button>

          <div className="w-11 h-11 rounded-2xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Criar Novo Post
              </h1>
              <Badge
                variant="secondary"
                className="bg-purple-600/10 text-purple-700 dark:text-purple-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-purple-300/40 dark:border-purple-800/60"
              >
                Multi-Redes & Modelos
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Crie, aplique templates por rede, refine com IA e agende para qualquer canal.
            </p>
          </div>
        </div>

        {/* Botão O que postar hoje? e seleção de template */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            type="button"
            onClick={() => setWhatToPostOpen(true)}
            className="rounded-xl bg-purple-600/10 border border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-600/20 font-bold text-xs h-10 px-3.5 gap-2 transition-all shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>O que postar hoje?</span>
          </Button>

          <Button
            onClick={() => setTemplateOpen(true)}
            className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-10 px-4 gap-2 shadow-sm transition-all hover:shadow-purple-500/20"
          >
            <Layout className="w-4 h-4" />
            <span>{selectedTemplate ? 'Trocar Modelo' : 'Explorar Modelos por Rede'}</span>
          </Button>
        </div>
      </div>

      {/* Banner de Modelo Ativo */}
      {selectedTemplate && (
        <Card className="p-4 border-2 border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                style={{ backgroundColor: tplAccent }}
              >
                <Palette className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black tracking-tight text-foreground">
                    {selectedTemplate.name}
                  </p>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-600/15 text-purple-700 dark:text-purple-300">
                    {displayDimensions} &middot; {displayRatio}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Modelo ativo para {selectedTemplate.network?.toUpperCase() || platform} &middot;
                  Categoria: {selectedTemplate.category || 'Geral'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTemplateOpen(true)}
                className="text-xs h-8 rounded-xl border-purple-500/30 text-purple-700 dark:text-purple-300"
              >
                Trocar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearTemplate}
                className="text-xs h-8 rounded-xl text-muted-foreground hover:text-destructive gap-1"
              >
                <X className="w-3.5 h-3.5" /> Remover
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Banner de Post Publicado com Ação de Compartilhar */}
      {publishedPostId && (
        <Card className="p-4 bg-emerald-500/10 border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                Post publicado com sucesso na biblioteca!
              </p>
              <p className="text-xs text-muted-foreground">
                Você pode compartilhar o texto diretamente nas suas redes ou ver na Biblioteca.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs rounded-xl gap-1.5 h-9"
              onClick={() => sharePost(caption || content)}
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" /> Compartilhar Texto
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/app/library')}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 h-9"
            >
              Ir para Biblioteca <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* =========================================================================
          ÁREA PRINCIPAL: EDITOR DE FORMULÁRIO (ESQUERDA) + CANVAS PREVIEW (DIREITA)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulário do Post */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card shadow-xs space-y-5">
            {/* Linha 1: Marca & Rede Social */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Marca Ativa <span className="text-rose-500">*</span>
                </label>
                <select
                  aria-label="Selecionar Marca"
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full text-xs font-semibold bg-muted/60 border border-border rounded-xl px-3 py-2.5 focus:border-purple-500 focus-visible:ring-2 focus-visible:ring-primary focus:outline-hidden transition-colors"
                >
                  {brands.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Rede Social de Destino
                </label>
                <select
                  aria-label="Selecionar Rede Social"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full text-xs font-semibold bg-muted/60 border border-border rounded-xl px-3 py-2.5 focus:border-purple-500 focus-visible:ring-2 focus-visible:ring-primary focus:outline-hidden transition-colors"
                >
                  {PLATFORMS_META.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label} ({p.aspectRatio} &middot; {p.dimensions})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linha 2: Conteúdo / Título */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Título / Ideia Central do Post
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => aiAction('improve')}
                  disabled={aiLoading === 'improve'}
                  className="text-xs text-purple-600 dark:text-purple-400 gap-1.5 h-7 px-2 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg"
                >
                  {aiLoading === 'improve' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Refinar com IA</span>
                </Button>
              </div>
              <Textarea
                placeholder="Ex: 5 erros fatais ao criar conteúdo que você precisa parar hoje..."
                value={content}
                onBlur={() => setTouchedFields((prev) => ({ ...prev, content: true }))}
                onChange={(e) => setContent(e.target.value)}
                className={cn(
                  'min-h-[85px] text-xs leading-relaxed rounded-xl bg-card border-border/80 focus:border-purple-500 shadow-2xs',
                  contentError && 'border-rose-500 focus:border-rose-500',
                )}
              />
              {contentError && (
                <p className="text-[11px] font-semibold text-rose-500 animate-fade-in">
                  {contentError}
                </p>
              )}
            </div>

            {/* Linha 3: Legenda com Assistente IA & Hashtags */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Legenda Completa para Redes
                </label>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAiModalOpen(true)}
                    className="text-xs text-purple-600 dark:text-purple-400 border-purple-500/30 gap-1.5 h-7 px-2.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Assistente IA
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="Escreva a legenda detalhada, storytelling ou copie da IA..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-[100px] text-xs leading-relaxed rounded-xl bg-card border-border/80 focus:border-purple-500 shadow-2xs"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                <span>Dica: Use quebras de linha e emojis para maior retenção.</span>
                <span className="font-mono">{caption.length} caracteres</span>
              </div>

              {/* Gerador de Hashtags com chips por rede social (Controlado por Labs) */}
              {isLabEnabled('network-hashtag-generator') && (
                <NetworkHashtagGenerator
                  contentSource={`${content} ${caption}`.trim()}
                  selectedNetwork={platform}
                  onNetworkChange={() => {}}
                  onApplyHashtags={(tags) => {
                    setCaption((prev) => (prev ? `${prev}\n\n${tags}` : tags))
                  }}
                  currentHashtags={caption}
                />
              )}

              {/* Widget de SEO Social em tempo real (Controlado por Labs) */}
              {isLabEnabled('seo-social-widget') && (
                <PostSeoWidget
                  caption={caption || content}
                  network={platform}
                  niche={(selectedBrand as any)?.niche || selectedBrand?.name}
                  tone={(selectedBrand as any)?.tone || 'Profissional'}
                  onApplyImprovement={(improved) => {
                    setCaption(improved)
                    setContent(improved)
                  }}
                  className="mt-3"
                />
              )}
            </div>

            {/* Linha 4: Mídia com Upload e Preview imediato */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Mídia do Post (Imagem / Vídeo)
              </label>

              {media ? (
                <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-50/40 dark:bg-purple-950/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-border">
                      {mediaPreviewUrl && (
                        <img
                          src={mediaPreviewUrl}
                          alt="Arquivo"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate max-w-[200px] sm:max-w-xs">
                        {media.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {(media.size / 1024).toFixed(1)} KB &middot; Pronto para envio
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeMedia}
                    className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-8 rounded-lg"
                  >
                    Trocar arquivo
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => document.getElementById('media-input')?.click()}
                  className="border-2 border-dashed border-border/80 hover:border-purple-500 rounded-2xl p-6 text-center bg-muted/20 hover:bg-purple-500/5 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 group-hover:scale-110 flex items-center justify-center mx-auto transition-transform mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-foreground">
                    Clique para selecionar imagem ou arraste até aqui
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    PNG, JPG, MP4 até 50MB &middot; Ajusta automaticamente ao formato{' '}
                    {displayDimensions}
                  </p>
                  <input
                    id="media-input"
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleMediaChange}
                  />
                </div>
              )}
            </div>

            {/* Linha 5: Agendamento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Data e Horário de Publicação (para agendamento)
              </label>
              <div className="relative">
                <input
                  aria-label="Data e horário de agendamento"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full text-xs font-semibold bg-muted/60 border border-border rounded-xl px-3 py-2.5 focus:border-purple-500 focus-visible:ring-2 focus-visible:ring-primary focus:outline-hidden"
                />
              </div>
            </div>

            {/* Ações Inferiores de Submissão */}
            <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={submitting}
                className="text-xs font-semibold rounded-xl h-10 px-4 gap-2 border-border hover:bg-muted"
              >
                <Save className="w-4 h-4 text-muted-foreground" />
                <span>Salvar Rascunho</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => handleSubmit('scheduled')}
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl h-10 px-4 gap-2 shadow-sm transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{submitting ? 'Agendando...' : 'Agendar Publicação'}</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSubmit('published')}
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl h-10 px-4 gap-2 shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{submitting ? 'Salvando...' : 'Publicar Agora'}</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Pré-visualização / Canvas adaptativo com Proporção Real */}
        <div className="lg:col-span-5 space-y-3 sticky top-6">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-purple-600" />
              Canvas Interativo ({platform})
            </span>
            <Badge
              variant="outline"
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
            >
              {displayRatio} &middot; {displayDimensions}
            </Badge>
          </div>

          <Card
            className={cn(
              'w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-2 transition-all duration-300 shadow-xl flex flex-col justify-between',
              selectedTemplate ? 'border-purple-500/50' : 'border-border/80',
            )}
            style={{
              background: tplGradient || (tplBg ? tplBg : undefined),
              backgroundColor: tplBg || undefined,
            }}
          >
            {/* Topbar do Canvas: Marca + Rede */}
            <div
              className="p-3 border-b border-border/60 flex items-center justify-between backdrop-blur-xs"
              style={{
                borderColor: tplAccent ? `${tplAccent}30` : undefined,
                backgroundColor: tplBg ? 'rgba(0,0,0,0.2)' : undefined,
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-muted shrink-0 ring-2 ring-purple-500/20">
                  {selectedBrand?.logo ? (
                    <img
                      src={selectedBrand.logo}
                      alt={selectedBrand.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-purple-600 text-white text-[10px] font-black">
                      {selectedBrand?.name?.slice(0, 1) || 'B'}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <span
                    className="font-bold text-xs truncate block"
                    style={{ color: tplText || undefined }}
                  >
                    {selectedBrand?.name || 'Sua Marca'}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <PlatformIcon className="w-3 h-3" />
                    <span>{platform}</span>
                  </span>
                </div>
              </div>

              {selectedTemplate && (
                <Badge
                  className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase"
                  style={{ backgroundColor: `${tplAccent}30`, color: tplText || '#FFFFFF' }}
                >
                  {selectedTemplate.type}
                </Badge>
              )}
            </div>

            {/* Mídia / Arte Central na proporção correta */}
            <div
              className={cn(
                'w-full bg-muted/60 relative overflow-hidden flex items-center justify-center',
                previewRatioStyle,
              )}
            >
              <img
                src={fallbackMediaUrl}
                alt="Preview do post"
                className="w-full h-full object-cover"
              />

              {/* Overlay estilizado se template estiver ativo */}
              {selectedTemplate && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 p-4 flex flex-col justify-between pointer-events-none">
                  {tplStyles.badgeText && (
                    <span
                      className="self-start text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white backdrop-blur-md"
                      style={{ backgroundColor: tplAccent }}
                    >
                      {tplStyles.badgeText}
                    </span>
                  )}

                  <div className="my-auto text-center space-y-1">
                    <p
                      className="text-sm font-black line-clamp-3 leading-snug drop-shadow-md"
                      style={{ color: tplText || '#FFFFFF' }}
                    >
                      {content || tplLayout.headline || 'Seu conteúdo impactante aqui'}
                    </p>
                  </div>

                  {/* Chamada para ação calibrada */}
                  <div className="flex justify-center pt-2">
                    <div
                      className="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase text-white shadow-md flex items-center gap-1"
                      style={{ backgroundColor: tplCtaColor }}
                    >
                      <span>{tplLayout.ctaText || 'SAIBA MAIS'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé do Canvas com Legenda */}
            <CardContent
              className="p-3.5 space-y-2 border-t border-border/60"
              style={{
                borderColor: tplAccent ? `${tplAccent}30` : undefined,
                backgroundColor: tplBg ? 'rgba(0,0,0,0.15)' : undefined,
              }}
            >
              <p
                className="text-xs line-clamp-3 leading-relaxed whitespace-pre-line"
                style={{ color: tplText || undefined }}
              >
                <span className="font-bold mr-1">{selectedBrand?.name || 'Sua Marca'}:</span>
                {caption || content || 'A sua legenda gerada ou editada aparecerá aqui...'}
              </p>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                <span>
                  {selectedTemplate ? `Modelo: ${selectedTemplate.name}` : 'Editor padrão'}
                </span>
                <span>{displayDimensions}</span>
              </div>
            </CardContent>
          </Card>

          <p className="text-[11px] text-muted-foreground text-center px-4">
            O post será salvo com o modelo vinculado e aparecerá imediatamente na Biblioteca com
            todos os metadados.
          </p>
        </div>
      </div>

      {/* Modal de Assistente de IA */}
      <AIAssistantModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        onApplyText={(text, hashtags) => {
          setCaption(text)
          if (hashtags) setCaption((prev) => `${prev}\n\n${hashtags.join(' ')}`.trim())
        }}
        platform={platform}
      />

      {/* Modal Seletor de Templates por Rede */}
      <TemplateSelector
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        onSelect={handleTemplateSelect}
        initialNetwork={currentPlatformMeta.networkKey}
      />

      {/* Modal 'O que postar hoje?' */}
      <WhatToPostTodayModal
        open={whatToPostOpen}
        onOpenChange={setWhatToPostOpen}
        brandName={selectedBrand?.name || 'Sua Marca'}
        brandNiche={(selectedBrand as any)?.niche || (selectedBrand as any)?.segment || 'Geral'}
        brandTone={
          (selectedBrand as any)?.tone ||
          (selectedBrand as any)?.voice_tone ||
          'Profissional e dinâmico'
        }
        network={platform}
        onApplyIdea={(idea: TodayPostIdea) => {
          setContent(idea.title)
          setCaption(idea.caption)
          toast({
            title: 'Ideia aplicada com sucesso!',
            description: `Título e legenda preenchidos com a sugestão estratégica da IA.`,
          })
        }}
      />
    </div>
  )
}
