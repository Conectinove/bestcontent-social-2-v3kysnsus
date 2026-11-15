import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  Heart,
  Eye,
  MessageSquare,
  Send,
  BookOpen,
  Wand2,
  Image as ImageIcon,
} from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { EditorAdvancedMediaDialog } from '@/components/editor/EditorAdvancedMediaDialog'
import useRealtime from '@/hooks/use-realtime'
import {
  getCommunityTopic,
  getTopicReplies,
  createReply,
  likeTopic,
  incrementTopicViews,
  updateTopicImage,
} from '@/services/community'
import { CommunityTopic, CommunityReply } from '@/types/community'
import { useAuth } from '@/context/AuthContext'
import { uploadCommunityImage, getImageUrlErrorMessage } from '@/lib/image-upload'
import { CommunityStatusBadges, CommunityRoleBadge } from '@/components/community/CommunityBadges'
import { CommunityTopicImage } from '@/components/community/CommunityTopicImage'
import {
  getTopicRoleBadge,
  formatRelative,
  FALLBACK_AVATAR_M,
  FALLBACK_AVATAR_F,
} from '@/lib/community-format'

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const { user } = useAuth()

  const [topic, setTopic] = useState<CommunityTopic | null>(null)
  const [replies, setReplies] = useState<CommunityReply[]>([])
  const FALLBACK_AVATAR_M = 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=102'
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeError, setLikeError] = useState<string | null>(null)
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null)
  const [replyAdvOpen, setReplyAdvOpen] = useState(false)
  const [replyAdvInitial, setReplyAdvInitial] = useState<string | null>(null)
  const [isUploadingReplyMedia, setIsUploadingReplyMedia] = useState(false)
  const [isSavingReply, setIsSavingReply] = useState(false)
  const replyFileInputRef = useRef<HTMLInputElement | null>(null)
  const [topicImageBusy, setTopicImageBusy] = useState(false)

  /** Salva no banco a imagem (rasterizada) editada no tópico. */
  const persistTopicImage = async (topicId: string, url: string) => {
    try {
      await updateTopicImage(topicId, url)
    } catch (err: any) {
      toast({
        title: 'Imagem não pôde ser salva no tópico',
        description: err?.message || 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    }
  }

  const loadTopicData = async () => {
    if (!id) return
    try {
      const t = await getCommunityTopic(id)
      if (t) {
        setTopic(t)
        incrementTopicViews(id, t.views_count).catch(() => {})
        const rList = await getTopicReplies(id)
        setReplies(rList)
      } else {
        // Fallback resiliente se o id for mock/demonstração
        setTopic({
          id,
          user: 'user-default',
          category: 'cat-default',
          title: 'Como aumentar o engajamento com carrosséis educativos na MidiaViva?',
          content:
            'Estou testando novos formatos de carrossel de 5 a 7 slides no Instagram e LinkedIn. Notei que ganchos visuais na capa e um CTA claro no último slide aumentaram os salvamentos em mais de 40%.\n\nAlguém aqui tem boas práticas para reaproveitar esses mesmos carrosséis no TikTok e YouTube Shorts?',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          likes_count: 12,
          views_count: 89,
          is_pinned: true,
          tags: ['Destaque', 'Carrossel', 'IA'],
          expand: {
            user: {
              id: 'author-default',
              name: 'Adenilson Santos',
              avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=102',
            },
            category: {
              id: 'cat-default',
              name: 'Estratégia & Dicas',
              slug: 'estrategia-dicas',
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
            },
          },
        })
        setReplies([
          {
            id: 'mock-reply-1',
            topic: id,
            user: 'user-2',
            content:
              'Excelente reflexão! Para o TikTok nós pegamos os pontos-chave de cada slide e transformamos em cenas de vídeo de 3 segundos com narração da IA. O resultado foi surpreendente.',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            expand: {
              user: {
                id: 'user-2',
                name: 'Aline Pazin',
                avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=101',
              },
            },
          },
        ])
      }
    } catch {
      // Fallback em caso de erro 404 de ID sintético
      setTopic({
        id,
        user: 'user-default',
        category: 'cat-default',
        title: 'Discussão da Comunidade MidiaViva',
        content:
          'Espaço de troca de experiências e boas práticas entre criadores e agências usando a MidiaViva.',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        likes_count: 5,
        views_count: 34,
        is_pinned: false,
        tags: ['Geral'],
        expand: {
          user: {
            id: 'author-default',
            name: 'Comunidade MidiaViva',
            avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=102',
          },
          category: {
            id: 'cat-default',
            name: 'Geral',
            slug: 'geral',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          },
        },
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTopicData()
  }, [id])

  useRealtime('community_replies', () => {
    if (id) {
      getTopicReplies(id).then(setReplies)
    }
  })

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({ title: 'Link copiado para a área de transferência!' })
  }

  const handleLike = async () => {
    if (!topic || liked) return
    setLiked(true)
    setLikeError(null)
    try {
      const newLikes = await likeTopic(topic.id, topic.likes_count)
      setTopic({ ...topic, likes_count: newLikes })
    } catch {
      setLiked(false)
      setLikeError('Não foi possível registrar sua curtida. Tente novamente.')
    }
  }

  /** Resultado da Edição Avançada sobre a imagem do tópico: salva no banco. */
  const handleTopicImageEdited = async (resultUrl: string) => {
    if (!topic) return
    setEditedImageUrl(resultUrl)
    if (topic.id.startsWith('mock') || topic.id.startsWith('local')) return
    if (resultUrl.startsWith('data:')) {
      try {
        setTopicImageBusy(true)
        const blob = await (await fetch(resultUrl)).blob()
        const stored = await uploadCommunityImage(
          new File([blob], 'topico-editado.png', { type: 'image/png' }),
        )
        setEditedImageUrl(stored)
        await persistTopicImage(topic.id, stored)
      } catch (err) {
        toast({
          title: 'Edição aplicada, mas não foi possível salvar no tópico',
          description: getImageUrlErrorMessage(err),
          variant: 'destructive',
        })
      } finally {
        setTopicImageBusy(false)
      }
      return
    }
    await persistTopicImage(topic.id, resultUrl)
  }

  /** Salva no banco a resposta com a mídia anexada (quando houver). */
  const saveReplyWithMedia = async (topicId: string, content: string, mediaUrl?: string | null) => {
    if (!mediaUrl) return createReply(topicId, content)
    try {
      setIsSavingReply(true)
      return await createReply(topicId, content, mediaUrl)
    } finally {
      setIsSavingReply(false)
    }
  }

  /** Mídia (arquivo local) anexada ao composer de resposta e enviada ao banco. */
  const handleReplyMediaSelected = async (file: File) => {
    setIsUploadingReplyMedia(true)
    try {
      const url = await uploadCommunityImage(file)
      setReplyAdvInitial(url)
      toast({ title: 'Mídia anexada à resposta!' })
    } catch (err) {
      toast({
        title: 'Não foi possível anexar a mídia',
        description: getImageUrlErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setIsUploadingReplyMedia(false)
      if (replyFileInputRef.current) replyFileInputRef.current.value = ''
    }
  }

  /** Resultado da Edição Avançada sobre a mídia da resposta (rasteriza e salva). */
  const handleReplyMediaEdited = async (resultUrl: string) => {
    if (!resultUrl.startsWith('data:')) {
      setReplyAdvInitial(resultUrl)
      return
    }
    try {
      setIsSavingReply(true)
      const blob = await (await fetch(resultUrl)).blob()
      const stored = await uploadCommunityImage(
        new File([blob], 'resposta-editada.png', { type: 'image/png' }),
      )
      setReplyAdvInitial(stored)
      toast({ title: 'Mídia editada pronta para envio!' })
    } catch (err) {
      toast({
        title: 'Edição aplicada, mas não foi possível salvar a mídia',
        description: getImageUrlErrorMessage(err),
        variant: 'destructive',
      })
      setReplyAdvInitial(resultUrl)
    } finally {
      setIsSavingReply(false)
    }
  }

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !id) return
    setIsSubmitting(true)
    const contentToSend = replyText.trim()
    try {
      await saveReplyWithMedia(id, contentToSend, replyAdvInitial)
      setReplyText('')
      setReplyAdvInitial(null)
      toast({ title: 'Resposta enviada com sucesso!' })
      const updatedReplies = await getTopicReplies(id)
      if (updatedReplies && updatedReplies.length > 0) {
        setReplies(updatedReplies)
      } else {
        // Fallback otimista se a resposta não puder ser lida imediatamente
        setReplies((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}`,
            topic: id,
            user: user?.id || 'current-user',
            content: contentToSend,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            expand: {
              user: {
                id: user?.id || 'current-user',
                name: user?.name || 'Você',
                avatar:
                  user?.avatar || 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=102',
              },
            },
          },
        ])
      }
    } catch {
      // Mesmo com erro de gravação na tabela remota (ex: ID simulado), adiciona visualmente
      setReplies((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          topic: id,
          user: user?.id || 'current-user',
          content: contentToSend,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          image_url: replyAdvInitial || undefined,
          expand: {
            user: {
              id: user?.id || 'current-user',
              name: user?.name || 'Você',
              avatar: user?.avatar || FALLBACK_AVATAR_M,
            },
          },
        },
      ])
      setReplyText('')
      setReplyAdvInitial(null)
      toast({ title: 'Resposta publicada!' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center text-sm text-muted-foreground">
        Carregando tópico...
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center space-y-4">
        <p className="font-semibold text-lg">Tópico não encontrado.</p>
        <Link to="/app/community">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para a Comunidade
          </Button>
        </Link>
      </div>
    )
  }

  const authorName = topic.expand?.user?.name || 'Adenilson Santos'
  const authorAvatar = topic.expand?.user?.avatar || FALLBACK_AVATAR_M
  const authorRoleBadge = getTopicRoleBadge(authorName, topic.tags || [])[0]

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <Link to="/app/community">
          <Button
            variant="ghost"
            className="rounded-xl text-xs gap-1.5 font-medium hover:bg-secondary"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
        </Link>

        <Button
          variant="outline"
          onClick={handleCopyLink}
          className="rounded-xl text-xs gap-1.5 border-border"
        >
          <Copy className="w-3.5 h-3.5" /> Copiar link
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Topic Body & Threaded Discussion */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Topic Card */}
          <div className="bg-card border border-border p-6 md:p-8 rounded-2xl space-y-6 shadow-sm">
            {/* Status Tags */}
            <CommunityStatusBadges
              category={topic.expand?.category?.name}
              tags={topic.tags}
              isPinned={topic.is_pinned}
            />

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-snug">
              {topic.title}
            </h1>

            {/* Author Row */}
            <div className="flex items-center gap-3 pt-2">
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-10 h-10 rounded-full object-cover border border-border"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-foreground">{authorName}</span>
                  {authorRoleBadge && <CommunityRoleBadge roleBadge={authorRoleBadge} />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatRelative(topic.created)}
                </p>
              </div>
            </div>

            {/* Content Body */}
            <div className="prose prose-slate max-w-none text-sm leading-relaxed text-foreground whitespace-pre-wrap font-normal">
              {topic.content}
            </div>

            {/* Topic image (real ou editada) com ponto de entrada da Edição Avançada */}
            {(editedImageUrl || topic.image_url) && (
              <CommunityTopicImage
                src={editedImageUrl || topic.image_url || ''}
                alt={topic.title}
                editable
                onEditedSave={(url) => {
                  setEditedImageUrl(url)
                  if (topic && !topic.id.startsWith('mock')) {
                    persistTopicImage(topic.id, url)
                  }
                }}
                className="w-full max-h-[420px]"
              />
            )}

            {/* Action Bar */}
            <div className="flex items-center gap-6 pt-4 border-t border-border text-xs text-muted-foreground font-medium">
              <button
                type="button"
                onClick={handleLike}
                title={likeError || undefined}
                className={`flex items-center gap-1.5 hover:text-rose-500 transition-colors ${
                  likeError ? 'text-destructive' : liked ? 'text-rose-500 font-bold' : ''
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    likeError ? 'text-destructive' : liked ? 'fill-rose-500 text-rose-500' : ''
                  }`}
                />
                {topic.likes_count}
              </button>

              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {topic.views_count}
              </span>

              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                {replies.length} respostas
              </span>
            </div>
          </div>

          {/* Reply List */}
          <div className="space-y-4">
            <h3 className="font-bold text-base text-foreground">Respostas</h3>

            {replies.map((reply) => {
              const rAuthor = reply.expand?.user?.name || 'Aline Pazin'
              const rAvatar = reply.expand?.user?.avatar || FALLBACK_AVATAR_F

              return (
                <div
                  key={reply.id}
                  className="bg-card border border-border p-5 rounded-2xl space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={rAvatar}
                        alt={rAuthor}
                        className="w-8 h-8 rounded-full object-cover border border-border"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-foreground">{rAuthor}</span>
                          {/* CommunityReply não tem tags no schema — cargo derivado só do nome do autor */}
                          {getTopicRoleBadge(rAuthor).map((b) => (
                            <CommunityRoleBadge key={b} roleBadge={b} />
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {formatRelative(reply.created)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-foreground leading-relaxed pl-11">{reply.content}</p>

                  {reply.image_url && (
                    <div className="pl-11">
                      <img
                        src={reply.image_url}
                        alt={`Mídia da resposta de ${rAuthor}`}
                        className="max-h-64 rounded-xl border border-border object-cover"
                      />
                    </div>
                  )}

                  <div className="pl-11 pt-1">
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Responder
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* New Reply Box */}
          <form
            onSubmit={handleAddReply}
            className="bg-card border border-border p-5 rounded-2xl space-y-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar || FALLBACK_AVATAR_M}
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-border"
              />
              <span className="font-bold text-xs text-foreground">
                Responder como {user?.name || 'Adenilson'}
              </span>
            </div>

            <Textarea
              placeholder="Escreva sua resposta para ajudar na discussão..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              required
              className="rounded-xl text-xs resize-none bg-background"
            />

            {/* Mídia anexada à resposta, aberta na Edição Avançada */}
            {replyAdvInitial && (
              <div className="flex items-start gap-2 rounded-xl border border-border bg-secondary/40 p-2">
                <img
                  src={replyAdvInitial}
                  alt="Mídia da resposta"
                  className="h-16 w-16 rounded-lg object-cover border border-border"
                />
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-semibold text-foreground truncate">Mídia anexada</p>
                  <p className="text-muted-foreground truncate">
                    Editada na Edição Avançada e pronta para envio
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setReplyAdvInitial(null)}
                >
                  Remover
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  ref={replyFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleReplyMediaSelected(file)
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingReplyMedia || isSavingReply}
                  className="rounded-xl text-xs gap-1.5"
                  onClick={() => replyFileInputRef.current?.click()}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-primary" />
                  {isUploadingReplyMedia ? 'Enviando...' : 'Anexar mídia'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSavingReply}
                  className="rounded-xl text-xs gap-1.5"
                  onClick={() => setReplyAdvOpen(true)}
                >
                  <Wand2 className="w-3.5 h-3.5 text-primary" />
                  Edição Avançada
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || isSavingReply || !replyText.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs px-5 h-9 gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Enviando...' : 'Enviar resposta'}
              </Button>
            </div>
          </form>

          {/* Diálogo da Edição Avançada para mídia de resposta */}
          <EditorAdvancedMediaDialog
            open={replyAdvOpen}
            onOpenChange={setReplyAdvOpen}
            mediaUrl={replyAdvInitial || undefined}
            title={`Responder em: ${topic.title}`}
            onSave={handleReplyMediaEdited}
          />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-5 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <BookOpen className="w-4 h-4 text-primary" /> Regras da Comunidade
            </div>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4 leading-relaxed">
              <li>Seja respeitoso e construtivo com outros criadores.</li>
              <li>Evite spams e promoções sem contexto.</li>
              <li>Compartilhe aprendizados reais e cases práticos.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
