import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  Heart,
  Eye,
  MessageSquare,
  Shield,
  Zap,
  Crown,
  Sparkles,
  Pin,
  Send,
  BookOpen,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import useRealtime from '@/hooks/use-realtime'
import {
  getCommunityTopic,
  getTopicReplies,
  createReply,
  likeTopic,
  incrementTopicViews,
} from '@/services/community'
import { CommunityTopic, CommunityReply } from '@/types/community'
import { useAuth } from '@/context/AuthContext'

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const { user } = useAuth()

  const [topic, setTopic] = useState<CommunityTopic | null>(null)
  const [replies, setReplies] = useState<CommunityReply[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [liked, setLiked] = useState(false)

  const loadTopicData = async () => {
    if (!id) return
    try {
      const t = await getCommunityTopic(id)
      if (t) {
        setTopic(t)
        incrementTopicViews(id, t.views_count)
      }
      const rList = await getTopicReplies(id)
      setReplies(rList)
    } catch {
      toast({ title: 'Erro ao carregar detalhes do tópico', variant: 'destructive' })
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
    const newLikes = await likeTopic(topic.id, topic.likes_count)
    setTopic({ ...topic, likes_count: newLikes })
  }

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !id) return
    setIsSubmitting(true)
    try {
      await createReply(id, replyText)
      setReplyText('')
      toast({ title: 'Resposta enviada!' })
      const updatedReplies = await getTopicReplies(id)
      setReplies(updatedReplies)
    } catch {
      toast({ title: 'Erro ao enviar resposta', variant: 'destructive' })
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
  const authorAvatar =
    topic.expand?.user?.avatar || 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=102'

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
            <div className="flex flex-wrap items-center gap-1.5">
              {topic.expand?.category && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 text-xs rounded-md font-medium"
                >
                  {topic.expand.category.name}
                </Badge>
              )}
              {topic.tags?.includes('Destaque') && (
                <Badge
                  variant="outline"
                  className="bg-cyan-50 text-cyan-700 border-cyan-200 text-xs rounded-md font-medium gap-1"
                >
                  <Sparkles className="w-3 h-3 text-cyan-600" /> Destaque
                </Badge>
              )}
              {topic.is_pinned && (
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs rounded-md font-medium gap-1"
                >
                  <Pin className="w-3 h-3 text-indigo-600" /> Fixado
                </Badge>
              )}
            </div>

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
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">{authorName}</span>
                  <Badge className="bg-blue-600 text-white text-[10px] h-5 px-1.5 gap-1 font-semibold">
                    <Shield className="w-3 h-3 fill-current" /> ADMIN
                  </Badge>
                  <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] h-5 px-1.5 gap-1 font-semibold">
                    <Zap className="w-3 h-3 fill-current" /> PRO
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">há cerca de 2 meses</p>
              </div>
            </div>

            {/* Content Body */}
            <div className="prose prose-slate max-w-none text-sm leading-relaxed text-foreground whitespace-pre-wrap font-normal">
              {topic.content}
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-6 pt-4 border-t border-border text-xs text-muted-foreground font-medium">
              <button
                type="button"
                onClick={handleLike}
                className={`flex items-center gap-1.5 hover:text-rose-500 transition-colors ${
                  liked ? 'text-rose-500 font-bold' : ''
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
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
              const rAvatar =
                reply.expand?.user?.avatar ||
                'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=101'

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
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">{rAuthor}</span>
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-700 text-[9px] h-4 px-1.5"
                          >
                            BASIC
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">há cerca de 2 meses</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-foreground leading-relaxed pl-11">{reply.content}</p>

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
                src={
                  user?.avatar || 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=102'
                }
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

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || !replyText.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs px-5 h-9 gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Enviando...' : 'Enviar resposta'}
              </Button>
            </div>
          </form>
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
