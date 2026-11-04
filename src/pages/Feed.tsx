import { useState, useRef, useMemo, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Trophy,
  Zap,
  Target,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  MessageSquare,
  Calendar,
  Plus,
  ArrowUpRight,
  Sparkles,
  Gift,
  Lightbulb,
  ChevronDown,
  GraduationCap,
  Play,
  Film,
  Heart,
  Share2,
  Send,
  Loader2,
  Image as ImageIcon,
  Flame,
  Pin,
  Check,
  TrendingUp,
  Search,
  Filter,
  FileText,
  MoreVertical,
  X,
  Share,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { TopRankingModal } from '@/components/jornada/TopRankingModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useRealtime from '@/hooks/use-realtime'
import {
  getCommunityTopics,
  getCommunityCategories,
  createCommunityTopic,
  toggleTopicLike,
  toggleTopicPin,
  getUserLikedTopicIds,
  getTopicReplies,
  createReply,
} from '@/services/community'
import { CommunityTopic, CommunityCategory, CommunityReply } from '@/types/community'
import { FeedMetricsMultiWidget } from '@/components/feed/FeedMetricsMultiWidget'

// Community creators carousel data
interface CommunityCreator {
  id: string
  name: string
  initials: string
  avatarColor: string
  image: string
  postTitle?: string
}

const COMMUNITY_CREATORS: CommunityCreator[] = [
  {
    id: 'c1',
    name: 'Manasci',
    initials: 'MA',
    avatarColor: 'bg-violet-600',
    image: 'https://img.usecurling.com/p/240/240?q=man%20portrait%20dark&color=purple',
    postTitle: 'Ladrão é o Banqueiro',
  },
  {
    id: 'c2',
    name: 'Lucio flavio Barbosa Nantes coelho',
    initials: 'L',
    avatarColor: 'bg-purple-700',
    image: 'https://img.usecurling.com/p/240/240?q=businessman%20speaking&color=indigo',
    postTitle: 'Trauma Superado',
  },
  {
    id: 'c3',
    name: 'Alex Machado',
    initials: 'AL',
    avatarColor: 'bg-purple-600',
    image: 'https://img.usecurling.com/p/240/240?q=bicycle%20city&color=violet',
    postTitle: 'Mobilidade Urbana',
  },
  {
    id: 'c4',
    name: 'Manasci',
    initials: 'MA',
    avatarColor: 'bg-indigo-600',
    image: 'https://img.usecurling.com/p/240/240?q=fashion%20sale%20poster&color=blue',
    postTitle: 'Fim da Taxa das Blusinhas?',
  },
  {
    id: 'c5',
    name: 'Lucio flavio Barbosa Nantes coelho',
    initials: 'L',
    avatarColor: 'bg-purple-800',
    image: 'https://img.usecurling.com/p/240/240?q=coffee%20cup%20desk&color=amber',
    postTitle: 'Apenas Cansaço?',
  },
  {
    id: 'c6',
    name: 'TRICIA PEREIRA NUNES JUNQUEIRA',
    initials: 'TP',
    avatarColor: 'bg-fuchsia-600',
    image: 'https://img.usecurling.com/p/240/240?q=skincare%20beauty%20woman&color=pink',
    postTitle: 'Share the Freshness',
  },
  {
    id: 'c7',
    name: 'Manasci',
    initials: 'MA',
    avatarColor: 'bg-violet-600',
    image: 'https://img.usecurling.com/p/240/240?q=space%20nebula%20fire&color=purple',
    postTitle: 'A História Continua',
  },
  {
    id: 'c8',
    name: 'Manasci',
    initials: 'MA',
    avatarColor: 'bg-purple-600',
    image: 'https://img.usecurling.com/p/240/240?q=soccer%20trophy%20stadium&color=violet',
    postTitle: 'Trabalhar de Graça na Copa?',
  },
  {
    id: 'c9',
    name: 'Manasci',
    initials: 'MA',
    avatarColor: 'bg-indigo-600',
    image: 'https://img.usecurling.com/p/240/240?q=podium%20speaker%20stage&color=purple',
    postTitle: 'Estratégia ou Conveniência?',
  },
  {
    id: 'c10',
    name: 'Aline Brauna dos Santos',
    initials: 'AB',
    avatarColor: 'bg-emerald-600',
    image: 'https://img.usecurling.com/p/240/240?q=checklist%20business%20woman&color=green',
    postTitle: 'Checklist Essencial ONGs',
  },
  {
    id: 'c11',
    name: 'Adriana Leocadio',
    initials: 'AL',
    avatarColor: 'bg-teal-600',
    image: 'https://img.usecurling.com/p/240/240?q=doctor%20clinic%20health&color=teal',
    postTitle: 'Regras para Cancelar?',
  },
  {
    id: 'c12',
    name: 'José Raimundo Bastos Costa',
    initials: 'JR',
    avatarColor: 'bg-amber-600',
    image: 'https://img.usecurling.com/p/240/240?q=legal%20office%20books&color=amber',
    postTitle: 'Direito na Prática',
  },
  {
    id: 'c13',
    name: 'Agencia LinkWeb',
    initials: 'AL',
    avatarColor: 'bg-blue-600',
    image: 'https://img.usecurling.com/p/240/240?q=digital%20agency%20technology&color=blue',
    postTitle: 'Design de Alta Conversão',
  },
  {
    id: 'c14',
    name: 'Mateus Marques',
    initials: 'MM',
    avatarColor: 'bg-violet-700',
    image: 'https://img.usecurling.com/p/240/240?q=startup%20founder%20smiling&color=violet',
    postTitle: 'Crescimento Acelerado',
  },
]

export default function Feed() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { posts, brands } = useSocial()

  // Modals state
  const [rankingModalOpen, setRankingModalOpen] = useState(false)
  const [rankingExpanded, setRankingExpanded] = useState(true)
  const [helpOpen, setHelpOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [missionsModalOpen, setMissionsModalOpen] = useState(false)

  // Scroll ref for community carousel
  const communityCarouselRef = useRef<HTMLDivElement>(null)
  const creationsCarouselRef = useRef<HTMLDivElement>(null)

  // Feed Live State
  const [topics, setTopics] = useState<CommunityTopic[]>([])
  const [categories, setCategories] = useState<CommunityCategory[]>([])
  const [likedTopicIds, setLikedTopicIds] = useState<Set<string>>(new Set())
  const [loadingFeed, setLoadingFeed] = useState(true)
  const [feedFilter, setFeedFilter] = useState<'todos' | 'populares' | 'fixados'>('todos')
  const [selectedCategory, setSelectedCategory] = useState<string>('todas')
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'todos' | 'com_imagem' | 'somente_texto'>(
    'todos',
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [togglingPinId, setTogglingPinId] = useState<string | null>(null)
  const [likingTopicId, setLikingTopicId] = useState<string | null>(null)

  // Composer State ("No que você está pensando?")
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerTitle, setComposerTitle] = useState('')
  const [composerContent, setComposerContent] = useState('')
  const [composerCategory, setComposerCategory] = useState('')
  const [composerImage, setComposerImage] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)

  // Quick Comment per post
  const [openCommentsTopicId, setOpenCommentsTopicId] = useState<string | null>(null)
  const [topicRepliesMap, setTopicRepliesMap] = useState<Record<string, CommunityReply[]>>({})
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [replyInput, setReplyInput] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  // Load feed data from PocketBase
  const loadFeedData = async () => {
    try {
      const [topicsData, categoriesData, userLikes] = await Promise.all([
        getCommunityTopics(),
        getCommunityCategories(),
        getUserLikedTopicIds(),
      ])
      setTopics(topicsData)
      setCategories(categoriesData)
      setLikedTopicIds(new Set(userLikes))
      if (categoriesData.length > 0 && !composerCategory) {
        setComposerCategory(categoriesData[0].id)
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoadingFeed(false)
    }
  }

  useEffect(() => {
    loadFeedData()
  }, [])

  // Realtime updates
  useRealtime('community_topics', () => {
    loadFeedData()
  })
  useRealtime('community_replies', () => {
    if (openCommentsTopicId) {
      loadReplies(openCommentsTopicId)
    }
  })
  useRealtime('community_likes', () => {
    getUserLikedTopicIds().then((likes) => setLikedTopicIds(new Set(likes)))
  })

  // Load replies for a topic
  const loadReplies = async (topicId: string) => {
    setLoadingReplies(true)
    try {
      const replies = await getTopicReplies(topicId)
      setTopicRepliesMap((prev) => ({ ...prev, [topicId]: replies }))
    } catch {
      // Silent error
    } finally {
      setLoadingReplies(false)
    }
  }

  const toggleCommentsSection = (topicId: string) => {
    if (openCommentsTopicId === topicId) {
      setOpenCommentsTopicId(null)
    } else {
      setOpenCommentsTopicId(topicId)
      if (!topicRepliesMap[topicId]) {
        loadReplies(topicId)
      }
    }
  }

  // Handle Toggle Pin
  const handleTogglePin = async (topic: CommunityTopic) => {
    if (togglingPinId) return
    const wasPinned = !!topic.is_pinned
    const nextPinned = !wasPinned
    setTogglingPinId(topic.id)

    // Optimistic UI
    setTopics((prev) => prev.map((t) => (t.id === topic.id ? { ...t, is_pinned: nextPinned } : t)))

    try {
      await toggleTopicPin(topic.id, wasPinned)
      toast({
        title: nextPinned ? 'Post fixado no topo 📌' : 'Post desfixado',
        description: nextPinned
          ? 'Este post agora aparece em destaque no feed para todos.'
          : 'O post voltou para a listagem padrão por ordem cronológica.',
      })
    } catch (err: any) {
      // Revert
      setTopics((prev) => prev.map((t) => (t.id === topic.id ? { ...t, is_pinned: wasPinned } : t)))
      toast({
        title: 'Não foi possível alterar a fixação',
        description: err?.message || 'Apenas o autor do post ou moderadores podem fixar.',
        variant: 'destructive',
      })
    } finally {
      setTogglingPinId(null)
    }
  }

  // Handle Like (com proteção contra double-click)
  const handleToggleLike = async (topic: CommunityTopic) => {
    if (likingTopicId === topic.id) return
    setLikingTopicId(topic.id)

    const isCurrentlyLiked = likedTopicIds.has(topic.id)
    // Optimistic UI
    const updatedSet = new Set(likedTopicIds)
    if (isCurrentlyLiked) {
      updatedSet.delete(topic.id)
    } else {
      updatedSet.add(topic.id)
    }
    setLikedTopicIds(updatedSet)

    const updatedLikesCount = isCurrentlyLiked
      ? Math.max(0, (topic.likes_count || 1) - 1)
      : (topic.likes_count || 0) + 1

    setTopics((prev) =>
      prev.map((t) => (t.id === topic.id ? { ...t, likes_count: updatedLikesCount } : t)),
    )

    try {
      const res = await toggleTopicLike(topic.id, topic.likes_count || 0)
      setTopics((prev) =>
        prev.map((t) => (t.id === topic.id ? { ...t, likes_count: res.newLikes } : t)),
      )
    } catch {
      // Revert if error
      toast({
        title: 'Faça login para interagir',
        description: 'É necessário estar conectado para curtir posts da comunidade.',
        variant: 'destructive',
      })
      loadFeedData()
    } finally {
      setLikingTopicId(null)
    }
  }

  // Handle Create Post via Composer
  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!composerContent.trim()) {
      toast({
        title: 'Mensagem vazia',
        description: 'Digite o conteúdo do seu post antes de publicar.',
        variant: 'destructive',
      })
      return
    }

    setIsPublishing(true)
    try {
      // Derive a nice title from first line if empty
      const derivedTitle =
        composerTitle.trim() ||
        composerContent.slice(0, 60).split('\n')[0] ||
        'Novo post na comunidade'

      const catId = composerCategory || categories[0]?.id || ''

      const created = await createCommunityTopic({
        title: derivedTitle,
        content: composerContent.trim(),
        category: catId,
        tags: ['Feed', 'Comunidade'],
        image_url: composerImage.trim() || undefined,
      })

      toast({
        title: 'Post publicado com sucesso! 🚀',
        description: 'Sua ideia agora está visível no feed principal da comunidade.',
      })

      // Reset
      setComposerTitle('')
      setComposerContent('')
      setComposerImage('')
      setComposerOpen(false)

      // Prepend optimistic
      setTopics((prev) => [
        {
          ...created,
          expand: {
            user: {
              id: user?.id || 'me',
              name: user?.name || 'Você',
              avatar: user?.avatar,
            },
            category: categories.find((c) => c.id === catId),
          },
          replies_count: 0,
        },
        ...prev,
      ])
    } catch (err: any) {
      toast({
        title: 'Erro ao publicar',
        description: err?.message || 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setIsPublishing(false)
    }
  }

  // Handle Add Reply
  const handleSendReply = async (topicId: string) => {
    const text = replyInput.trim()
    if (!text || isSubmittingReply) return
    setIsSubmittingReply(true)

    // Optimistic new reply
    const tempReply: CommunityReply = {
      id: `temp-${Date.now()}`,
      topic: topicId,
      user: user?.id || 'me',
      content: text,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      expand: {
        user: {
          id: user?.id || 'me',
          name: user?.name || 'Você',
          avatar: user?.avatar,
          email: user?.email,
        },
      },
    }

    setTopicRepliesMap((prev) => ({
      ...prev,
      [topicId]: [...(prev[topicId] || []), tempReply],
    }))

    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, replies_count: (t.replies_count || 0) + 1 } : t)),
    )
    setReplyInput('')

    try {
      const created = await createReply(topicId, text)
      toast({ title: 'Comentário enviado com sucesso! 💬' })
      // Replace optimistic reply with real created
      setTopicRepliesMap((prev) => ({
        ...prev,
        [topicId]: (prev[topicId] || []).map((r) => (r.id === tempReply.id ? created : r)),
      }))
    } catch (err: any) {
      // Revert optimistic addition
      setTopicRepliesMap((prev) => ({
        ...prev,
        [topicId]: (prev[topicId] || []).filter((r) => r.id !== tempReply.id),
      }))
      setTopics((prev) =>
        prev.map((t) =>
          t.id === topicId ? { ...t, replies_count: Math.max(0, (t.replies_count || 1) - 1) } : t,
        ),
      )
      toast({
        title: 'Erro ao enviar comentário',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingReply(false)
    }
  }

  // Handle Share
  const handleShareTopic = (topic: CommunityTopic) => {
    const url = `${window.location.origin}/app/community/topic/${topic.id}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
      toast({
        title: 'Link copiado!',
        description: 'O link deste post foi copiado para sua área de transferência.',
      })
    }
  }

  const scrollCarousel = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: 'left' | 'right',
  ) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -320 : 320
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Active brand
  const activeBrand = useMemo(() => {
    return (
      brands.find((b: any) => b.name?.toLowerCase().includes('mudarcurso')) ||
      brands[0] || {
        name: 'MudarCurso',
        logo: '',
      }
    )
  }, [brands])

  // Count stats
  const stats = useMemo(() => {
    const totalPosts = posts.length > 0 ? posts.length : 2
    const scheduled = posts.filter((p: any) => p.status === 'scheduled').length
    return {
      posts: totalPosts,
      postsGrowth: '+12%',
      pautas: 0,
      agendados: scheduled,
      creditos: 3400,
      maxCreditos: 5000,
    }
  }, [posts])

  // Filtered Topics
  const displayedTopics = useMemo(() => {
    let list = [...topics]

    // 1. Filtro principal de tipo/status (Todos, Mais curtidos, Fixados)
    if (feedFilter === 'fixados') {
      list = list.filter((t) => t.is_pinned)
    }

    // 2. Filtro por Categoria
    if (selectedCategory !== 'todas') {
      list = list.filter(
        (t) => t.category === selectedCategory || t.expand?.category?.id === selectedCategory,
      )
    }

    // 3. Filtro por Mídia (com imagem vs somente texto)
    if (mediaTypeFilter === 'com_imagem') {
      list = list.filter((t) => !!t.image_url && t.image_url.trim().length > 0)
    } else if (mediaTypeFilter === 'somente_texto') {
      list = list.filter((t) => !t.image_url || t.image_url.trim().length === 0)
    }

    // 4. Busca textual (título, conteúdo ou autor)
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((t) => {
        const titleMatch = t.title?.toLowerCase().includes(q)
        const contentMatch = t.content?.toLowerCase().includes(q)
        const authorMatch = t.expand?.user?.name?.toLowerCase().includes(q)
        const tagMatch =
          Array.isArray(t.tags) && t.tags.some((tag) => tag.toLowerCase().includes(q))
        return titleMatch || contentMatch || authorMatch || tagMatch
      })
    }

    // 5. Ordenação:
    // Se "Mais curtidos", ordena por curtidas + views.
    // Em outros casos, FIXADOS aparecem no topo primeiro, e depois ordem cronológica mais recente.
    if (feedFilter === 'populares') {
      list.sort(
        (a, b) =>
          (b.likes_count || 0) +
          (b.views_count || 0) -
          ((a.likes_count || 0) + (a.views_count || 0)),
      )
    } else {
      list.sort((a, b) => {
        // Pinned posts prioritize on top (unless specifically filtered)
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        return new Date(b.created).getTime() - new Date(a.created).getTime()
      })
    }

    return list
  }, [topics, feedFilter, selectedCategory, mediaTypeFilter, searchQuery])

  // Counts for filters badges
  const filterCounts = useMemo(() => {
    const total = topics.length
    const pinned = topics.filter((t) => t.is_pinned).length
    const withImage = topics.filter((t) => !!t.image_url && t.image_url.trim().length > 0).length
    const onlyText = total - withImage
    return { total, pinned, withImage, onlyText }
  }, [topics])

  // Sample creations
  const creations = useMemo(() => {
    return [
      {
        id: 'creation-1',
        type: 'FLYER',
        badgeColor: 'bg-white/90 text-slate-900',
        ratio: '620:877',
        title: 'Mudar de Curso: O Começo de Algo Incrível',
        subtext: 'A decodificação do seu sucesso começa aqui',
        date: 'cerca de 1 mês',
        image:
          'https://img.usecurling.com/p/620/877?q=cyberpunk%20ai%20man%20futuristic%20violet&color=purple',
        badgeUser: 'R',
      },
      {
        id: 'creation-2',
        type: 'FACEBOOK',
        badgeColor: 'bg-white/90 text-slate-900',
        ratio: '9:16',
        title: 'Vídeo facebook 30/07/2026',
        subtext: 'Transforme sua vida em 7 segundos com MudarCurso',
        date: 'cerca de 1 mês',
        image:
          'https://img.usecurling.com/p/600/1000?q=smiling%20man%20glasses%20laptop%20office&color=dark',
        isVideo: true,
      },
      {
        id: 'creation-3',
        type: 'CARROSSEL',
        badgeColor: 'bg-white/90 text-slate-900',
        ratio: '1:1',
        title: '3 Passos para Reinventar sua Carreira Hoje',
        subtext: 'Descubra como migrar de área sem começar do zero',
        date: 'há 2 semanas',
        image: 'https://img.usecurling.com/p/600/600?q=career%20success%20strategy&color=purple',
      },
      {
        id: 'creation-4',
        type: 'REELS',
        badgeColor: 'bg-white/90 text-slate-900',
        ratio: '9:16',
        title: 'Bastidores: Como a IA acelera seus resultados',
        subtext: 'Roteiro de alto engajamento para criadores',
        date: 'há 3 semanas',
        image:
          'https://img.usecurling.com/p/600/1000?q=creative%20studio%20neon%20camera&color=indigo',
        isVideo: true,
      },
    ]
  }, [])

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-foreground">
      {/* =========================================================================
          TOP ROW: 2 Cards (Criador Dedicado & Missões)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Criador Dedicado */}
        <Card className="rounded-2xl border border-border/70 bg-card shadow-xs hover:shadow-md transition-shadow overflow-hidden">
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
              <div className="relative shrink-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-violet-900 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
                  4
                </div>
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-xs sm:text-sm text-foreground truncate">
                    Criador Dedicado
                  </h3>
                  <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground shrink-0 whitespace-nowrap">
                    345/600 XP
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((345 / 600) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pl-3 sm:pl-4 border-l border-border/60 flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500/20 stroke-[2.2] shrink-0" />
              <div className="text-left">
                <p className="text-base sm:text-lg font-black leading-none text-foreground">1</p>
                <p className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  DIAS
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: MISSÕES */}
        <Card
          onClick={() => setMissionsModalOpen(true)}
          className="rounded-2xl border border-border/70 bg-card shadow-xs hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group overflow-hidden"
        >
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                  MISSÕES SEMANAIS
                </p>
                <p className="text-sm sm:text-base font-bold text-foreground truncate">
                  0/8 completas &middot; Ganhe XP
                </p>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0">
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =========================================================================
          COMMUNITY CAROUSEL: "Criadores em Destaque"
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
              Últimos posts da comunidade
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollCarousel(communityCarouselRef, 'left')}
              className="h-7 w-7 rounded-full border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollCarousel(communityCarouselRef, 'right')}
              className="h-7 w-7 rounded-full border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Próximo"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Horizontal scroll strip */}
        <div
          ref={communityCarouselRef}
          className="flex items-start gap-4 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
        >
          {COMMUNITY_CREATORS.map((creator) => (
            <div
              key={creator.id}
              onClick={() => navigate('/app/community')}
              className="flex flex-col items-center gap-1.5 shrink-0 w-20 sm:w-22 cursor-pointer group text-center"
            >
              <div className="relative">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full p-[2px] bg-gradient-to-tr from-primary via-purple-500 to-pink-500 group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full rounded-full overflow-hidden bg-muted border-2 border-background">
                    <img
                      src={creator.image}
                      alt={creator.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>

                <div
                  className={`absolute -bottom-1 -right-0.5 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full ring-2 ring-background ${creator.avatarColor}`}
                >
                  {creator.initials}
                </div>
              </div>

              <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground line-clamp-1 w-full text-center transition-colors">
                {creator.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          MAIN 2-COLUMN LAYOUT: Content (Left) + Sidebar (Right)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =======================================================================
            LEFT COLUMN (8 cols): Composer, Feed Posts, Stats, Creations, Suggestions
            ======================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* =====================================================================
              COMPOSER RÁPIDO ("No que você está pensando?")
              ===================================================================== */}
          <Card className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-md overflow-hidden">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/30 overflow-hidden">
                  {user?.avatar && !user.avatar.includes('seed=') ? (
                    <img
                      src={user.avatar}
                      alt={user?.name || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user?.name?.slice(0, 2).toUpperCase() || 'VC'}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setComposerOpen(true)}
                  className="flex-1 text-left px-4 py-3 rounded-xl bg-muted/60 hover:bg-muted text-xs sm:text-sm text-muted-foreground font-medium transition-colors border border-border/60 hover:border-primary/40 cursor-text flex items-center justify-between"
                >
                  <span>No que você está pensando, {user?.name?.split(' ')[0] || 'criador'}?</span>
                  <Sparkles className="w-4 h-4 text-primary shrink-0 opacity-70" />
                </button>
              </div>
              {composerOpen && (
                <form
                  onSubmit={handlePublishPost}
                  className="space-y-3 pt-2 border-t border-border/60 animate-in fade-in duration-200"
                >
                  <div>
                    <Input
                      placeholder="Título ou tema do post (opcional)"
                      value={composerTitle}
                      onChange={(e) => setComposerTitle(e.target.value)}
                      className="text-xs sm:text-sm font-semibold rounded-xl bg-background border-border"
                    />
                  </div>

                  <div>
                    <Textarea
                      placeholder="Compartilhe seu insight, novidade, case ou tire uma dúvida com os criadores do MidiaViva..."
                      value={composerContent}
                      onChange={(e) => setComposerContent(e.target.value)}
                      rows={4}
                      required
                      className="text-xs sm:text-sm rounded-xl resize-none bg-background border-border"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Categoria
                      </label>
                      <select
                        value={composerCategory}
                        onChange={(e) => setComposerCategory(e.target.value)}
                        className="w-full h-9 rounded-xl text-xs bg-background border border-border px-3 font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        URL de Imagem (opcional)
                      </label>
                      <Input
                        placeholder="https://... (link da imagem)"
                        value={composerImage}
                        onChange={(e) => setComposerImage(e.target.value)}
                        className="h-9 text-xs rounded-xl bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setComposerOpen(false)
                        setComposerTitle('')
                        setComposerContent('')
                        setComposerImage('')
                      }}
                      className="text-xs h-8 text-muted-foreground hover:text-foreground"
                    >
                      Cancelar
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        disabled={isPublishing || !composerContent.trim()}
                        className="rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold gap-1.5 h-9 px-4 shadow-sm"
                      >
                        {isPublishing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Publicando...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" /> Publicar no Feed
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
              {!composerOpen && (
                <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setComposerOpen(true)}
                      className="inline-flex items-center gap-1.5 hover:text-primary transition-colors font-medium py-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Nova Ideia</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerOpen(true)}
                      className="inline-flex items-center gap-1.5 hover:text-primary transition-colors font-medium py-1"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                      <span>Mídia</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/app/content/new')}
                    className="text-xs font-semibold text-primary hover:underline py-1"
                  >
                    Abrir editor completo →
                  </button>
                </div>
              )}{' '}
            </CardContent>
          </Card>

          {/* =====================================================================
              WIDGET MULTI-REDE (Instagram, TikTok, YouTube) NO MOBILE (acima do stream)
              ===================================================================== */}
          <div className="block lg:hidden">
            <FeedMetricsMultiWidget />
          </div>

          {/* =====================================================================
              FEED HEADER BAR (Filtros Avançados & Busca)
              ===================================================================== */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                  Feed da Comunidade
                </h2>
                <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold px-2 py-0.5 uppercase">
                  AO VIVO
                </Badge>
              </div>

              {/* Status Pills (Todos, Mais curtidos, Fixados) */}
              <div className="flex items-center gap-1.5 bg-card border border-border/80 p-1 rounded-xl self-start sm:self-auto shadow-2xs">
                {[
                  { id: 'todos', label: 'Todos', count: filterCounts.total },
                  { id: 'populares', label: 'Mais curtidos' },
                  { id: 'fixados', label: 'Fixados', count: filterCounts.pinned },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setFeedFilter(filter.id as any)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all inline-flex items-center gap-1.5 ${
                      feedFilter === filter.id
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                    }`}
                  >
                    <span>{filter.label}</span>
                    {filter.count !== undefined && filter.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          feedFilter === filter.id
                            ? 'bg-white/20 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {filter.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Filters: Categoria, Mídia & Busca */}
            <div className="p-3 rounded-2xl bg-card border border-border/70 space-y-2.5 shadow-2xs">
              {/* Search + Media Types */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    placeholder="Buscar por ideia, tema, autor ou tag..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8.5 pl-9 pr-8 text-xs rounded-xl bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Media Type Chips */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-0.5">
                  <span className="text-[11px] font-semibold text-muted-foreground mr-1 hidden sm:inline">
                    Tipo:
                  </span>
                  {[
                    { id: 'todos', label: 'Todos', icon: Filter },
                    {
                      id: 'com_imagem',
                      label: `Com mídia (${filterCounts.withImage})`,
                      icon: ImageIcon,
                    },
                    {
                      id: 'somente_texto',
                      label: `Texto (${filterCounts.onlyText})`,
                      icon: FileText,
                    },
                  ].map((m) => {
                    const Icon = m.icon
                    const isActive = mediaTypeFilter === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMediaTypeFilter(m.id as any)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all inline-flex items-center gap-1 shrink-0 ${
                          isActive
                            ? 'bg-primary/10 border-primary/40 text-primary font-bold'
                            : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{m.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Category Pills Strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none scroll-smooth">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('todas')}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all shrink-0 ${
                    selectedCategory === 'todas'
                      ? 'bg-violet-600 text-white border-violet-600 shadow-2xs font-bold'
                      : 'border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  Todas categorias
                </button>
                {categories.map((c) => {
                  const isActive = selectedCategory === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(c.id)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all shrink-0 inline-flex items-center gap-1 ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary shadow-2xs font-bold'
                          : 'border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>{c.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* =====================================================================
              POSTS STREAM (Com persistência no PocketBase e engajamento)
              ===================================================================== */}
          <div className="space-y-4">
            {loadingFeed ? (
              // Skeletons de carregamento elegantes
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <Card
                    key={n}
                    className="rounded-2xl border border-border/70 p-5 space-y-3.5 bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-20 h-3" />
                      </div>
                    </div>
                    <Skeleton className="w-3/4 h-5" />
                    <Skeleton className="w-full h-16" />
                    <div className="flex items-center gap-4 pt-2">
                      <Skeleton className="w-16 h-4" />
                      <Skeleton className="w-16 h-4" />
                      <Skeleton className="w-16 h-4" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : displayedTopics.length === 0 ? (
              // Empty State amigável
              <Card className="rounded-2xl border border-dashed border-border p-8 sm:p-12 text-center bg-card/60">
                <Sparkles className="w-10 h-10 text-primary/60 mx-auto mb-3" />
                <h3 className="font-bold text-base text-foreground">
                  Nenhum post encontrado neste filtro
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                  Seja o primeiro a compartilhar uma ideia com a comunidade de criadores do
                  MidiaViva!
                </p>
                <Button
                  onClick={() => setComposerOpen(true)}
                  className="mt-4 rounded-xl bg-primary text-white text-xs font-semibold gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Criar Primeiro Post
                </Button>
              </Card>
            ) : (
              displayedTopics.map((topic) => {
                const authorName = topic.expand?.user?.name || 'Criador MidiaViva'
                const authorAvatar = topic.expand?.user?.avatar
                const categoryName = topic.expand?.category?.name || 'Geral'
                const isLiked = likedTopicIds.has(topic.id)
                const isCommentsOpen = openCommentsTopicId === topic.id
                const topicReplies = topicRepliesMap[topic.id] || []
                const isAuthorOrAdmin =
                  Boolean(
                    user?.id && (user.id === topic.user || user.id === topic.expand?.user?.id),
                  ) || user?.email === 'midiaviva@bestcontent.ai'
                const isPinned = !!topic.is_pinned
                const isPinLoading = togglingPinId === topic.id

                return (
                  <Card
                    key={topic.id}
                    className={`rounded-2xl transition-all shadow-xs overflow-hidden ${
                      isPinned
                        ? 'border-2 border-indigo-500/40 bg-gradient-to-b from-indigo-500/5 via-card to-card ring-1 ring-indigo-500/20'
                        : 'border border-border/80 bg-card hover:border-primary/40'
                    }`}
                  >
                    {isPinned && (
                      <div className="bg-indigo-500/10 border-b border-indigo-500/20 px-4 py-1.5 flex items-center justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                        <span className="inline-flex items-center gap-1.5">
                          <Pin className="w-3.5 h-3.5 fill-indigo-500/30 text-indigo-600 dark:text-indigo-400" />
                          Post Fixado no Topo da Comunidade
                        </span>
                        {isAuthorOrAdmin && (
                          <button
                            type="button"
                            onClick={() => handleTogglePin(topic)}
                            disabled={isPinLoading}
                            className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                          >
                            {isPinLoading ? 'Atualizando...' : 'Desfixar'}
                          </button>
                        )}
                      </div>
                    )}

                    <CardContent className="p-4 sm:p-5 space-y-3.5">
                      {/* Post Header: Author, Badge, Date + Actions Menu */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-border/80 overflow-hidden">
                            {authorAvatar && !authorAvatar.includes('seed=') ? (
                              <img
                                src={authorAvatar}
                                alt={authorName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{authorName.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                                {authorName}
                              </span>
                              <Badge
                                variant="outline"
                                className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold px-1.5 py-0 rounded"
                              >
                                {categoryName}
                              </Badge>
                              {isPinned && (
                                <Badge
                                  variant="outline"
                                  className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-[10px] font-bold px-1.5 py-0 rounded gap-1"
                                >
                                  <Pin className="w-2.5 h-2.5" /> Fixado
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(topic.created).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Top-Right: Actions menu (Fixar, Compartilhar, Ver Tópico) */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Link
                            to={`/app/community/topic/${topic.id}`}
                            className="text-[11px] text-muted-foreground hover:text-primary transition-colors hidden sm:flex items-center gap-0.5 font-medium px-2 py-1 rounded-md hover:bg-muted"
                          >
                            Ver tópico <ArrowUpRight className="w-3 h-3" />
                          </Link>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                                aria-label="Mais ações do post"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl text-xs">
                              {/* Fixar/Desfixar (visível sempre para autor/admin, e se não for autor permite tentar com feedback) */}
                              <DropdownMenuItem
                                onClick={() => handleTogglePin(topic)}
                                disabled={isPinLoading}
                                className="gap-2 cursor-pointer"
                              >
                                <Pin className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{isPinned ? 'Desfixar do topo' : 'Fixar no topo'}</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleShareTopic(topic)}
                                className="gap-2 cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Copiar link do post</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem asChild className="cursor-pointer">
                                <Link
                                  to={`/app/community/topic/${topic.id}`}
                                  className="flex items-center gap-2"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span>Abrir página dedicada</span>
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="space-y-1.5">
                        <Link
                          to={`/app/community/topic/${topic.id}`}
                          className="block font-extrabold text-sm sm:text-base text-foreground hover:text-primary transition-colors leading-snug"
                        >
                          {topic.title}
                        </Link>
                        <p className="text-xs sm:text-sm text-muted-foreground/90 leading-relaxed whitespace-pre-wrap">
                          {topic.content}
                        </p>
                      </div>

                      {/* Optional Post Image */}
                      {topic.image_url && (
                        <div className="rounded-xl overflow-hidden border border-border/70 max-h-96 bg-muted">
                          <img
                            src={topic.image_url}
                            alt={topic.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              ;(e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        </div>
                      )}

                      {/* Engagement Bar: Curtir, Comentar, Compartilhar */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-border/60 text-xs">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Like Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleLike(topic)}
                            disabled={likingTopicId === topic.id}
                            className={`flex items-center gap-1.5 font-semibold transition-all px-2.5 py-1 rounded-lg ${
                              isLiked
                                ? 'text-rose-500 bg-rose-500/10'
                                : 'text-muted-foreground hover:text-rose-500 hover:bg-muted/70'
                            }`}
                            title="Curtir post"
                          >
                            <Heart
                              className={`w-4 h-4 transition-transform active:scale-125 ${
                                isLiked ? 'fill-rose-500 text-rose-500' : ''
                              }`}
                            />
                            <span>{topic.likes_count || 0}</span>
                          </button>

                          {/* Comment Button */}
                          <button
                            type="button"
                            onClick={() => toggleCommentsSection(topic.id)}
                            className={`flex items-center gap-1.5 font-semibold transition-all px-2.5 py-1 rounded-lg ${
                              isCommentsOpen
                                ? 'text-primary bg-primary/10'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                            }`}
                            title="Ver ou adicionar comentários"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{topic.replies_count || 0}</span>
                          </button>

                          {/* Share Button */}
                          <button
                            type="button"
                            onClick={() => handleShareTopic(topic)}
                            className="flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/70 px-2.5 py-1 rounded-lg transition-colors"
                            title="Compartilhar post"
                          >
                            <Share2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Compartilhar</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {isAuthorOrAdmin && (
                            <button
                              type="button"
                              onClick={() => handleTogglePin(topic)}
                              disabled={isPinLoading}
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors inline-flex items-center gap-1 ${
                                isPinned
                                  ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              }`}
                              title={isPinned ? 'Desfixar post' : 'Fixar no topo'}
                            >
                              <Pin className="w-3 h-3" />
                              <span className="hidden md:inline">
                                {isPinned ? 'Fixado' : 'Fixar'}
                              </span>
                            </button>
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            {topic.views_count || 1} visualizações
                          </span>
                        </div>
                      </div>

                      {/* =======================================================
                          THREADED COMMENTS: Perfeito alinhamento visual
                          ======================================================= */}
                      {isCommentsOpen && (
                        <div className="pt-3 border-t border-border/60 space-y-3 animate-in fade-in duration-150">
                          {/* Replies List */}
                          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                            {loadingReplies ? (
                              <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />{' '}
                                Carregando respostas...
                              </div>
                            ) : topicReplies.length === 0 ? (
                              <div className="text-center py-4 px-2 rounded-xl bg-muted/30 border border-dashed border-border/70">
                                <MessageSquare className="w-6 h-6 text-muted-foreground/60 mx-auto mb-1" />
                                <p className="text-xs font-semibold text-foreground">
                                  Nenhum comentário ainda
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  Seja o primeiro a deixar uma resposta construtiva para a
                                  comunidade!
                                </p>
                              </div>
                            ) : (
                              topicReplies.map((reply) => {
                                const replyAuthorName =
                                  reply.expand?.user?.name || 'Membro da Comunidade'
                                const replyAvatar = reply.expand?.user?.avatar
                                const replyInitials = replyAuthorName.slice(0, 2).toUpperCase()

                                return (
                                  <div
                                    key={reply.id}
                                    className="p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors border border-border/60 text-xs space-y-1.5"
                                  >
                                    {/* Aligned author header */}
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 border border-border overflow-hidden">
                                          {replyAvatar && !replyAvatar.includes('seed=') ? (
                                            <img
                                              src={replyAvatar}
                                              alt={replyAuthorName}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <span>{replyInitials}</span>
                                          )}
                                        </div>
                                        <span className="font-bold text-foreground text-xs truncate">
                                          {replyAuthorName}
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                                        {new Date(reply.created).toLocaleDateString('pt-BR', {
                                          day: '2-digit',
                                          month: 'short',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>

                                    {/* Comment Content indented aligned with avatar text */}
                                    <p className="text-muted-foreground/90 leading-relaxed whitespace-pre-wrap pl-8">
                                      {reply.content}
                                    </p>
                                  </div>
                                )
                              })
                            )}
                          </div>

                          {/* Quick reply composer */}
                          <div className="flex items-center gap-2 pt-1">
                            <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 border border-primary/20">
                              {user?.name?.slice(0, 2).toUpperCase() || 'VC'}
                            </div>
                            <Input
                              placeholder="Escreva uma resposta construtiva (Pressione Enter para enviar)..."
                              value={replyInput}
                              onChange={(e) => setReplyInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleSendReply(topic.id)
                                }
                              }}
                              className="text-xs h-9 rounded-xl bg-background border-border flex-1"
                            />
                            <Button
                              type="button"
                              disabled={isSubmittingReply || !replyInput.trim()}
                              onClick={() => handleSendReply(topic.id)}
                              className="h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shrink-0 gap-1"
                            >
                              {isSubmittingReply ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Enviar</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* =======================================================================
              SECTION: "Suas Últimas Criações"
              ======================================================================= */}
          <div className="space-y-3.5 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                Suas Últimas Criações
              </h2>
              <button
                onClick={() => navigate('/app/library')}
                className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
              >
                Ver biblioteca
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Creations Carousel */}
            <div className="relative">
              <div
                ref={creationsCarouselRef}
                className="flex items-stretch gap-4 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
              >
                {creations.map((creation) => (
                  <Card
                    key={creation.id}
                    onClick={() => navigate('/app/library')}
                    className="w-72 sm:w-80 shrink-0 rounded-2xl overflow-hidden border border-border/80 bg-card hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer group flex flex-col"
                  >
                    <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                      <img
                        src={creation.image}
                        alt={creation.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 bg-white/95 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider backdrop-blur-xs">
                          {creation.isVideo && <Film className="w-3 h-3 text-slate-900" />}
                          {creation.type}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <span className="bg-black/75 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-md font-mono font-medium">
                          {creation.ratio}
                        </span>
                        {creation.badgeUser && (
                          <span className="w-5 h-5 rounded-full bg-white/90 text-slate-900 text-[10px] font-bold flex items-center justify-center shadow-xs">
                            {creation.badgeUser}
                          </span>
                        )}
                      </div>

                      {creation.isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-primary transition-all">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {creation.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {creation.subtext}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{creation.date}</span>
                        <span className="text-primary font-semibold group-hover:underline inline-flex items-center gap-0.5">
                          Abrir <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* =======================================================================
              SECTION: "Sugestões para Você"
              ======================================================================= */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                Sugestões para Você
              </h2>
              <button
                onClick={() => navigate('/app/discover')}
                className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
              >
                Ver todas
              </button>
            </div>

            <Card className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-semibold text-xs gap-1">
                    🔥 trends
                  </Badge>
                  <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-semibold text-xs gap-1">
                    <Zap className="w-3 h-3" /> +60 XP ALTA
                  </Badge>
                  <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
                    carrossel
                  </Badge>
                  <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
                    Instagram
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                    IA e o Futuro da Sua Carreira: Prepare-se Agora!
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Apresente as 5 principais habilidades que profissionais precisam desenvolver
                    para se manter relevantes no mercado pós-IA. Formato perfeito para salvar e
                    compartilhar.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/60 border border-border/70 text-xs space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    💡 Dica do SOCI: Use slides visuais e diretos
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Estruture o primeiro slide com uma pergunta instigante (&ldquo;Sua profissão vai
                    sumir?&rdquo;) e finalize com um convite para reflexão nos comentários.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-xs font-bold text-primary">
                      Poste nas próximas 24h e ganhe XP em dobro!
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => navigate('/app/content/new')}
                    className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs rounded-xl h-8 px-4 aggressive-button self-start sm:self-auto"
                  >
                    Gerar Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* =======================================================================
              SECTION: "Aprenda com a Academy"
              ======================================================================= */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  Aprenda com a Academy
                </h2>
              </div>
              <button
                onClick={() => navigate('/app/community')}
                className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
              >
                Ver todas as aulas
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card
                onClick={() => navigate('/app/community')}
                className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                    Para Iniciantes
                  </Badge>
                  <span className="text-xs text-muted-foreground">12 min</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    Conteúdo Inteligente, do Planejamento à Execução
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    Aprenda a mapear pilares editoriais, estruturar matriz de conteúdo e alimentar
                    sua IA para gerar posts altamente alinhados.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs text-primary font-semibold">
                  <span className="inline-flex items-center gap-1 group-hover:underline">
                    Assistir aula{' '}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Card>

              <Card
                onClick={() => navigate('/app/community')}
                className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-[11px] font-semibold">
                    Local
                  </Badge>
                  <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 text-[11px] font-semibold">
                    Exclusivo
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">18 min</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    Marketing Local na Prática
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    Estratégias geo-localizadas para atrair clientes de alta renda da sua região sem
                    gastar fortuna em tráfego pago.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs text-primary font-semibold">
                  <span className="inline-flex items-center gap-1 group-hover:underline">
                    Assistir aula{' '}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* =======================================================================
            RIGHT COLUMN (4 cols): Multi-Widget (Instagram, TikTok, YouTube), Ranking, Comunidade Links, etc.
            ======================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          {/* Widget Multi-Rede no Desktop (Instagram, TikTok, YouTube com tabs e atualização em tempo real) */}
          <div className="hidden lg:block">
            <FeedMetricsMultiWidget />
          </div>

          {/* 1. Ranking de Setembro Card */}
          <Card className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <CardContent className="p-4">
              <div
                onClick={() => setRankingExpanded(!rankingExpanded)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-xs sm:text-sm font-bold text-foreground">
                    Ranking de Criadores
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    1400 créd
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      rankingExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {rankingExpanded && (
                <div className="mt-3 pt-3 border-t border-border/60 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Sua posição:</span>
                    <span className="font-bold text-foreground">#4 no ranking</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Prêmio Top 3:</span>
                    <span className="font-bold text-primary">+1.400 créditos IA</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRankingModalOpen(true)}
                    className="w-full text-xs h-8 rounded-xl border-border/70 mt-1"
                  >
                    Ver classificação completa
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Atalho para Central Operacional (Visão Geral) */}
          <Card className="rounded-2xl border border-border/70 bg-card shadow-xs">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">Central Operacional</h3>
                </div>
                <Link
                  to="/app/visao-geral"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Abrir →
                </Link>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Acompanhe o status das suas marcas, agendamentos dos próximos 7 dias e métricas
                consolidadas.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/visao-geral')}
                className="w-full rounded-xl text-xs font-semibold h-8 border-border"
              >
                Ir para Visão Geral
              </Button>
            </CardContent>
          </Card>

          {/* 3. Comunidade Top Highlights */}
          <Card className="rounded-2xl border border-border/70 bg-card shadow-xs">
            <CardContent className="p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">Destaques da Comunidade</h3>
                </div>
                <Link
                  to="/app/community"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
                >
                  Fórum →
                </Link>
              </div>

              <div className="space-y-3">
                <div
                  onClick={() => navigate('/app/community')}
                  className="space-y-1.5 cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full">
                      Novidades
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    🏆 A BestContent foi indicada ao Startup Awards
                  </p>
                </div>

                <div
                  onClick={() => navigate('/app/community')}
                  className="space-y-1.5 cursor-pointer group pt-2 border-t border-border/50"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full">
                      Novidades
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    📅 O agendamento e a publicação no Facebook estão de volta!
                  </p>
                </div>

                <div
                  onClick={() => navigate('/app/community')}
                  className="space-y-1.5 cursor-pointer group pt-2 border-t border-border/50"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full">
                      Novidades
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    Novidade no Programa de Indicação: 500 créditos por cada indicação! 🎉
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Button Destaque "Ganhe 500 Créditos" */}
          <Button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.origin)
                toast({
                  title: 'Link copiado!',
                  description: 'Compartilhe com amigos e ganhe 500 créditos por cada cadastro.',
                })
              }
            }}
            className="w-full h-12 rounded-2xl bg-muted/70 hover:bg-muted text-foreground border border-border/80 font-bold text-sm gap-2 shadow-xs group transition-all"
          >
            <Gift className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span>Ganhe 500 Créditos</span>
          </Button>

          {/* 5. Card "Próximas Datas" */}
          <Card className="rounded-2xl border border-border/70 bg-card shadow-xs">
            <CardContent className="p-5 space-y-3 text-center">
              <div className="flex items-center justify-start gap-2 text-left">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <h3 className="font-bold text-sm text-foreground">Próximas Datas</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Não perca nenhuma oportunidade
                  </p>
                </div>
              </div>

              <div className="py-6 px-2 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Nenhuma data comemorativa cadastrada para hoje
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/app/calendar')}
                  className="text-xs text-primary h-7"
                >
                  Explorar calendário editorial →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 6. Card "DICA RÁPIDA" */}
          <Card className="rounded-2xl border border-border/70 bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  DICA RÁPIDA
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                Mostre bastidores: autenticidade e posts da comunidade geram 3x mais retenção do que
                posts comerciais.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* =========================================================================
          FOOTER REFINADO v0.0.109
          ========================================================================= */}
      <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p className="text-center sm:text-left">
          MidiaViva — Powered by{' '}
          <span className="font-semibold text-foreground">BestContent AI</span> · v0.0.109
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/community')}
            className="hover:text-primary transition-colors"
          >
            Novidades
          </button>
          <span>&middot;</span>
          <Link to="/app/settings" className="hover:text-primary transition-colors">
            Termos
          </Link>
          <span>&middot;</span>
          <Link to="/app/settings" className="hover:text-primary transition-colors">
            Privacidade
          </Link>
        </div>
      </div>

      {/* =========================================================================
          MODALS: Ranking, Help, Feedback, Missions
          ========================================================================= */}
      <TopRankingModal open={rankingModalOpen} onOpenChange={setRankingModalOpen} />

      {/* Help Modal */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <HelpCircle className="w-5 h-5 text-primary" />
              Central de Ajuda
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs text-muted-foreground py-2 leading-relaxed">
            <p>
              O MidiaViva ajuda você a planejar, criar e publicar conteúdos profissionais com
              inteligência artificial para suas redes sociais.
            </p>
            <div className="p-3 bg-muted/60 rounded-xl space-y-1.5">
              <p className="font-bold text-foreground">Atalhos rápidos:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong className="text-foreground">Feed:</strong> veja os posts da comunidade,
                  compartilhe ideias e interaja.
                </li>
                <li>
                  <strong className="text-foreground">Visão Geral:</strong> acompanhe a central
                  operacional de marcas e agendamentos.
                </li>
                <li>
                  <strong className="text-foreground">Criar Post:</strong> use o botão roxo para
                  abrir o gerador guiado de IA.
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Modal */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <MessageSquare className="w-5 h-5 text-primary" />
              Envie seu feedback
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tem alguma sugestão de melhoria ou nova funcionalidade? Compartilhe com a nossa equipe
              de produto.
            </p>
            <textarea
              rows={4}
              placeholder="Descreva o que você gostaria de ver no MidiaViva..."
              className="w-full text-xs p-3 rounded-xl border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
            <Button
              size="sm"
              onClick={() => {
                setFeedbackOpen(false)
                toast({
                  title: 'Feedback recebido!',
                  description: 'Obrigado por ajudar a tornar o MidiaViva ainda melhor.',
                })
              }}
              className="w-full bg-primary text-white rounded-xl text-xs font-semibold"
            >
              Enviar Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Missions Quick View Modal */}
      <Dialog open={missionsModalOpen} onOpenChange={setMissionsModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Target className="w-5 h-5 text-primary" />
              Suas Missões da Semana (0/8)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Complete os desafios editoriais para ganhar XP e subir de nível no ranking.
            </p>
            <div className="space-y-2">
              {[
                { title: 'Publicar no Feed da Comunidade', xp: '+50 XP', link: '/app/feed' },
                { title: 'Criar 3 posts esta semana', xp: '+50 XP', link: '/app/content/new' },
                { title: 'Agendar 1 post no calendário', xp: '+30 XP', link: '/app/calendar' },
                { title: 'Explorar 2 sugestões de IA', xp: '+20 XP', link: '/app/discover' },
                { title: 'Conectar ou revisar marca', xp: '+40 XP', link: '/app/brands' },
                { title: 'Assistir a 1 aula na Academy', xp: '+60 XP', link: '/app/community' },
                {
                  title: 'Comentar em 1 tópico da comunidade',
                  xp: '+25 XP',
                  link: '/app/community',
                },
                { title: 'Gerar 1 flyer promocional', xp: '+45 XP', link: '/app/criar/flyers' },
              ].map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center text-[10px] text-muted-foreground">
                      {i + 1}
                    </div>
                    <span className="font-medium text-foreground">{m.title}</span>
                  </div>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {m.xp}
                  </span>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => {
                setMissionsModalOpen(false)
                setComposerOpen(true)
              }}
              className="w-full bg-primary text-white rounded-xl text-xs font-semibold mt-2"
            >
              Publicar no Feed
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
