import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  Search,
  PenTool,
  Image as ImageIcon,
  Share2,
  Trash2,
  Eye,
  Calendar,
  Sparkles,
  Instagram,
  Video,
  Youtube,
  Linkedin,
  Facebook,
  Twitter,
  Copy,
  ExternalLink,
  Edit3,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  Archive,
  RefreshCw,
  Film,
  LayoutGrid,
  List as ListIcon,
  HelpCircle,
  MessageSquare,
  Sparkle,
  SlidersHorizontal,
  ChevronRight,
  Check,
  Star,
  Tag,
  Maximize2,
  Megaphone,
  X,
  BarChart3,
} from 'lucide-react'
import { getCampaigns, type CampaignRecord } from '@/services/campaigns'
import { CreateCampaignModal } from '@/components/campaigns/CreateCampaignModal'
import { CampaignReportModal } from '@/components/campaigns/CampaignReportModal'
import {
  togglePostFavorite,
  togglePostArchived,
  togglePostReviewed,
  bulkUpdatePostsStatus,
  bulkTogglePostsArchived,
  bulkTogglePostsFavorite,
  bulkDeletePosts,
} from '@/services/posts'
import { pb } from '@/lib/pocketbase/client'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ImageBankModal } from '@/components/ImageBankModal'
import {
  getAllPostMetrics,
  getPostMetricsListByPost,
  getSimulatedMetricFallback,
  getSimulatedMultiNetworkMetrics,
  PostMetric,
} from '@/services/post-metrics'
import {
  PostPerformanceBadge,
  PostPerformanceCard,
} from '@/components/analytics/PostPerformanceCard'
import { toast } from '@/hooks/use-toast'
import { sharePost } from '@/lib/share'
import { cn } from '@/lib/utils'
import type { Post, SocialPlatform } from '@/types'

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return 'há pouco'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'há pouco'
  const now = new Date()
  const diffMs = Math.max(0, now.getTime() - date.getTime())
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffMonths = Math.floor(diffDays / 30)

  if (diffMonths >= 1) {
    return `cerca de ${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'}`
  }
  if (diffDays >= 1) {
    return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`
  }
  if (diffHours >= 1) {
    return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  }
  if (diffMinutes >= 1) {
    return `há ${diffMinutes} min`
  }
  return 'há poucos segundos'
}

function getPlatformIcon(platform: SocialPlatform | string, className = 'w-3.5 h-3.5') {
  const p = (platform || '').toLowerCase()
  if (p.includes('instagram')) return <Instagram className={`${className} text-pink-500`} />
  if (p.includes('tiktok')) return <Video className={`${className} text-cyan-400`} />
  if (p.includes('youtube')) return <Youtube className={`${className} text-red-500`} />
  if (p.includes('linkedin')) return <Linkedin className={`${className} text-blue-500`} />
  if (p.includes('facebook')) return <Facebook className={`${className} text-blue-600`} />
  return <Twitter className={`${className} text-sky-400`} />
}

function parsePostScriptMeta(post: Post) {
  let meta: {
    type?: string
    ratio?: string
    format?: string
    badgeUser?: string
    presetImage?: string
    isVideo?: boolean
    prompt?: string
  } = {}

  if (post._raw?.script_json) {
    try {
      meta =
        typeof post._raw.script_json === 'string'
          ? JSON.parse(post._raw.script_json)
          : post._raw.script_json
    } catch {
      /* ignore */
    }
  }

  // Determine post format/aspect ratio fallback
  const isVideo =
    meta.isVideo ||
    (post._raw?.duration && post._raw.duration > 0) ||
    (post.content || '').toLowerCase().includes('vídeo')
  const ratio = meta.ratio || (isVideo ? '9:16' : meta.type === 'FLYER' ? '620:877' : '4:5')
  const typeLabel = meta.type || (isVideo ? 'VÍDEO' : (post.platform || 'POST').toUpperCase())

  return {
    meta,
    isVideo,
    ratio,
    typeLabel,
    presetImage: meta.presetImage,
    badgeUser: meta.badgeUser,
  }
}

function getPostImage(post: Post, isVideo: boolean, presetImage?: string): string {
  if (post.mediaUrls?.[0]) return post.mediaUrls[0]
  if (presetImage) return presetImage

  const contentQuery = encodeURIComponent(
    (post.content || post.caption || post.platform || 'social post').slice(0, 30),
  )

  if (isVideo) {
    return `https://img.usecurling.com/p/600/1000?q=creator%20video%20${contentQuery}&color=dark`
  }
  return `https://img.usecurling.com/p/600/750?q=social%20media%20${contentQuery}&color=purple`
}

export default function Library() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    posts,
    brands,
    selectedBrandId,
    deletePost,
    duplicatePost,
    updatePostStatus,
    refreshPosts,
  } = useSocial()

  const [activeTab, setActiveTab] = useState<
    'all' | 'drafts' | 'scheduled' | 'published' | 'approved'
  >('all')
  const [search, setSearch] = useState('')
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('active') // 'active', 'all', or specific brand ID
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [selectedFormat, setSelectedFormat] = useState('all') // 'all', 'flyer', 'video', 'post'
  const [selectedTag, setSelectedTag] = useState('all')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(() => {
    return searchParams.get('campaign') || 'all'
  })
  const [campaignsList, setCampaignsList] = useState<CampaignRecord[]>([])
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)
  const [campaignReportModalOpen, setCampaignReportModalOpen] = useState(false)
  const [selectedCampaignForReport, setSelectedCampaignForReport] = useState<CampaignRecord | null>(
    null,
  )
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [imageBankOpen, setImageBankOpen] = useState(false)
  const [viewPost, setViewPost] = useState<Post | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<Post | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Seleção múltipla & ações em lote
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  // Cache de métricas de posts carregadas do backend
  const [metricsMap, setMetricsMap] = useState<Record<string, PostMetric>>({})
  const [multiMetricsMap, setMultiMetricsMap] = useState<Record<string, PostMetric[]>>({})

  // Sincronizar query param com selectedCampaignId
  useEffect(() => {
    const fromUrl = searchParams.get('campaign')
    if (fromUrl && fromUrl !== selectedCampaignId) {
      setSelectedCampaignId(fromUrl)
    }
  }, [searchParams])

  // Carregar lista de campanhas
  useEffect(() => {
    getCampaigns().then((res) => {
      setCampaignsList(res)
    })
  }, [posts])

  useEffect(() => {
    getAllPostMetrics().then((list) => {
      const singleMap: Record<string, PostMetric> = {}
      const multiMap: Record<string, PostMetric[]> = {}
      list.forEach((m) => {
        if (m.post) {
          if (!singleMap[m.post]) singleMap[m.post] = m
          if (!multiMap[m.post]) multiMap[m.post] = []
          multiMap[m.post].push(m)
        }
      })
      setMetricsMap(singleMap)
      setMultiMetricsMap(multiMap)
    })
  }, [posts])

  // Painel lateral de detalhes / edição rápida do post selecionado
  const [detailsDrawerPost, setDetailsDrawerPost] = useState<Post | null>(null)
  const [editingTags, setEditingTags] = useState('')
  const [savingDrawer, setSavingDrawer] = useState(false)

  // Current active brand from top organization selector
  const activeBrand = useMemo(() => {
    if (selectedBrandId === 'all') return null
    return brands.find((b: any) => b.id === selectedBrandId) || null
  }, [brands, selectedBrandId])

  // Real-time counts
  const counts = useMemo(() => {
    // When selectedBrandFilter is 'active', calculate scoped to activeBrand (if any)
    const baseList =
      selectedBrandFilter === 'active' && activeBrand
        ? posts.filter((p: Post) => p.brandId === activeBrand.id)
        : selectedBrandFilter !== 'all' && selectedBrandFilter !== 'active'
          ? posts.filter((p: Post) => p.brandId === selectedBrandFilter)
          : posts

    const all = baseList.length
    const drafts = baseList.filter((p: Post) => p.status === 'draft').length
    const scheduled = baseList.filter((p: Post) => p.status === 'scheduled').length
    const published = baseList.filter((p: Post) => p.status === 'published').length
    const approved = baseList.filter((p: Post) => p.status === 'approved').length
    const favorites = baseList.filter((p: Post) => Boolean(p.isFavorite)).length

    return { all, drafts, scheduled, published, approved, favorites }
  }, [posts, selectedBrandFilter, activeBrand])

  // Todas as tags únicas disponíveis para filtro
  const allAvailableTags = useMemo(() => {
    const set = new Set<string>()
    posts.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          if (t && typeof t === 'string' && t.trim()) set.add(t.trim().toLowerCase())
        })
      }
    })
    return Array.from(set).sort()
  }, [posts])

  // Filtered posts list
  const filteredPosts = useMemo(() => {
    return posts
      .filter((post: Post) => {
        // Tab filter
        if (activeTab === 'drafts' && post.status !== 'draft') return false
        if (activeTab === 'scheduled' && post.status !== 'scheduled') return false
        if (activeTab === 'published' && post.status !== 'published') return false
        if (activeTab === 'approved' && post.status !== 'approved') return false

        // Brand filter
        if (selectedBrandFilter === 'active' && activeBrand) {
          if (post.brandId !== activeBrand.id) return false
        } else if (selectedBrandFilter !== 'all' && selectedBrandFilter !== 'active') {
          if (post.brandId !== selectedBrandFilter) return false
        }

        // Platform filter
        if (selectedPlatform !== 'all') {
          const postPlat = (post.platform || '').toLowerCase()
          if (!postPlat.includes(selectedPlatform.toLowerCase())) return false
        }

        // Format filter
        if (selectedFormat !== 'all') {
          const parsed = parsePostScriptMeta(post)
          const cFmt = post.campaignFormat || post._raw?.campaign_format || ''
          if (selectedFormat === 'flyer' && parsed.typeLabel !== 'FLYER') return false
          if (
            selectedFormat === 'video' &&
            !parsed.isVideo &&
            ![
              'talking_head_script',
              'ugc_social_proof',
              'podcast_audiogram_snippet',
              'live_script_stream',
            ].includes(cFmt)
          )
            return false
          if (selectedFormat === 'carousel' && !cFmt.includes('carousel')) return false
          if (selectedFormat === 'talking_head' && cFmt !== 'talking_head_script') return false
          if (selectedFormat === 'ugc' && cFmt !== 'ugc_social_proof') return false
          if (
            selectedFormat === 'interactive' &&
            !['story_poll_ad', 'community_forum_post', 'collab_duo_post'].includes(cFmt)
          )
            return false
          if (selectedFormat === 'post' && (parsed.isVideo || parsed.typeLabel === 'FLYER'))
            return false
        }

        // Only favorites filter
        if (onlyFavorites && !post.isFavorite) return false

        // Tag filter
        if (selectedTag !== 'all') {
          const postTags = Array.isArray(post.tags) ? post.tags.map((t) => t.toLowerCase()) : []
          if (!postTags.includes(selectedTag.toLowerCase())) return false
        }

        // Campaign filter
        if (selectedCampaignId !== 'all') {
          const postCampId = post.campaignId || post._raw?.campaign
          if (postCampId !== selectedCampaignId) return false
        }

        // Search text
        if (search.trim()) {
          const q = search.toLowerCase()
          const title = (post.content || '').toLowerCase()
          const caption = (post.caption || '').toLowerCase()
          const platform = (post.platform || '').toLowerCase()
          const bMatch = brands.find((b: any) => b.id === post.brandId)
          const brandName = (bMatch?.name || '').toLowerCase()

          if (
            !title.includes(q) &&
            !caption.includes(q) &&
            !platform.includes(q) &&
            !brandName.includes(q)
          ) {
            return false
          }
        }

        return true
      })
      .sort((a: Post, b: Post) => {
        const dateA = new Date(a._raw?.created || a.scheduledDate || 0).getTime()
        const dateB = new Date(b._raw?.created || b.scheduledDate || 0).getTime()
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
      })
  }, [
    posts,
    activeTab,
    selectedBrandFilter,
    activeBrand,
    selectedPlatform,
    selectedFormat,
    selectedTag,
    selectedCampaignId,
    onlyFavorites,
    search,
    sortOrder,
    brands,
  ])

  // Handlers
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return
    setActionLoadingId(deleteCandidate.id)
    try {
      await deletePost(deleteCandidate.id)
      toast({
        title: 'Criação excluída!',
        description: 'O conteúdo foi removido definitivamente da sua biblioteca.',
      })
      setDeleteCandidate(null)
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o post do PocketBase.',
        variant: 'destructive',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDuplicate = async (post: Post) => {
    setActionLoadingId(post.id)
    try {
      await duplicatePost(post.id)
      toast({
        title: 'Criação duplicada!',
        description: 'Uma cópia foi criada em rascunho com sucesso.',
      })
    } catch {
      toast({
        title: 'Erro ao duplicar',
        description: 'Não foi possível duplicar este conteúdo.',
        variant: 'destructive',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleStatusChange = async (
    postId: string,
    newStatus: 'draft' | 'scheduled' | 'published' | 'approved',
  ) => {
    setActionLoadingId(postId)
    try {
      await updatePostStatus(postId, newStatus)
      const labels = {
        draft: 'Rascunho',
        scheduled: 'Agendado',
        published: 'Publicado',
        approved: 'Aprovado',
      }
      toast({
        title: 'Status atualizado',
        description: `O post foi movido para "${labels[newStatus]}".`,
      })
    } catch {
      toast({
        title: 'Erro ao atualizar',
        description: 'Falha ao sincronizar o status no PocketBase.',
        variant: 'destructive',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleOpenEditor = (postId: string) => {
    navigate(`/app/editor/${postId}`)
  }

  const handleToggleFavorite = async (post: Post, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const nextVal = !post.isFavorite
    setActionLoadingId(post.id)
    try {
      await togglePostFavorite(post.id, nextVal)
      toast({
        title: nextVal ? 'Adicionado aos favoritos!' : 'Removido dos favoritos',
        description: `O post foi ${nextVal ? 'marcado com estrela' : 'desmarcado'}.`,
      })
      refreshPosts()
    } catch {
      toast({
        title: 'Erro ao atualizar favorito',
        variant: 'destructive',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleToggleReviewed = async (post: Post, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const nextVal = !post.isReviewed
    setActionLoadingId(post.id)
    try {
      await togglePostReviewed(post.id, nextVal)
      toast({
        title: nextVal ? 'Post marcado como revisado!' : 'Marcado como pendente de revisão',
        description: nextVal
          ? 'O rascunho da campanha foi revisado e aprovado para publicação.'
          : 'O rascunho retornou para a fila de revisão.',
      })
      refreshPosts()
    } catch {
      toast({
        title: 'Erro ao atualizar status de revisão',
        variant: 'destructive',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleToggleArchived = async (post: Post) => {
    const nextVal = !post.isArchived
    setActionLoadingId(post.id)
    try {
      await togglePostArchived(post.id, nextVal)
      toast({
        title: nextVal ? 'Criação arquivada' : 'Criação desarquivada',
        description: nextVal
          ? 'O conteúdo foi movido para o arquivo.'
          : 'O conteúdo retornou à biblioteca principal.',
      })
      refreshPosts()
    } catch {
      toast({
        title: 'Erro ao arquivar',
        variant: 'destructive',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const statusBadgeConfig: Record<string, { label: string; badgeClass: string; dotClass: string }> =
    {
      published: {
        label: 'Publicado',
        badgeClass:
          'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
        dotClass: 'bg-emerald-500',
      },
      scheduled: {
        label: 'Agendado',
        badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30',
        dotClass: 'bg-blue-500',
      },
      draft: {
        label: 'Rascunho',
        badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
        dotClass: 'bg-amber-500',
      },
      approved: {
        label: 'Aprovado',
        badgeClass:
          'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30',
        dotClass: 'bg-purple-500',
      },
    }

  return (
    <div className="space-y-6 pb-14 animate-fade-in text-foreground">
      {/* =========================================================================
          ESTATÍSTICAS RÁPIDAS NO TOPO DA BIBLIOTECA
          ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Geral
            </p>
            <p className="text-xl font-black text-foreground mt-0.5">{counts.all}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Publicados
            </p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {counts.published}
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Agendados
            </p>
            <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {counts.scheduled}
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Aprovados
            </p>
            <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
              {counts.approved}
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Rascunhos
            </p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {counts.drafts}
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Favoritos
            </p>
            <p className="text-xl font-black text-amber-500 mt-0.5">{counts.favorites}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Star className="w-4 h-4 fill-amber-500" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          CABEÇALHO REFINADO
          ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Biblioteca de Criações
                </h1>
                <Badge
                  variant="secondary"
                  className="bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-purple-200/60 dark:border-purple-800/60 hidden sm:inline-flex"
                >
                  {filteredPosts.length}{' '}
                  {filteredPosts.length === 1 ? 'item ativo' : 'itens ativos'}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Centralize, filtre e gerencie todos os posts, flyers, vídeos e carrosséis das suas
                marcas
              </p>
            </div>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshPosts()}
            className="rounded-xl border-border bg-card hover:bg-muted text-xs font-semibold h-9 px-2.5 sm:px-3 gap-1.5 shadow-xs flex-1 sm:flex-initial justify-center"
            title="Atualizar lista com PocketBase"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">Sincronizar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setImageBankOpen(true)}
            className="rounded-xl border-border bg-card hover:bg-muted text-xs font-semibold h-9 px-2.5 sm:px-3.5 gap-1.5 sm:gap-2 shadow-xs flex-1 sm:flex-initial justify-center"
          >
            <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="truncate">Banco de Mídias</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCampaignModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs h-9 px-2.5 sm:px-3.5 gap-1.5 sm:gap-2 shadow-xs transition-all flex-1 sm:flex-initial justify-center"
          >
            <Megaphone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Nova Campanha</span>
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/app/content/new')}
            className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-9 px-3 sm:px-4 gap-1.5 sm:gap-2 shadow-sm transition-all flex-1 sm:flex-initial justify-center"
          >
            <PenTool className="w-4 h-4 shrink-0" />
            <span className="truncate">Novo Post</span>
          </Button>
        </div>
      </div>

      {/* =========================================================================
          BARRA DE ABAS COM CONTADORES
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-2">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todos</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('published')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
              activeTab === 'published'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Publicados</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'published'
                  ? 'bg-white/20 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {counts.published}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scheduled')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
              activeTab === 'scheduled'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Agendados</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'scheduled'
                  ? 'bg-white/20 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {counts.scheduled}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drafts')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
              activeTab === 'drafts'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Rascunhos</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'drafts' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {counts.drafts}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
              activeTab === 'approved'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Aprovados</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'approved'
                  ? 'bg-white/20 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {counts.approved}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOnlyFavorites((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
              onlyFavorites
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white' : ''}`} />
            <span>Favoritos</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                onlyFavorites ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {counts.favorites}
            </span>
          </button>
        </div>

        {/* View Mode Switcher (Grid vs List) */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={`h-8 w-8 rounded-lg ${
              viewMode === 'grid'
                ? 'bg-muted text-purple-600 dark:text-purple-400 font-bold'
                : 'text-muted-foreground'
            }`}
            title="Visualização em Grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode('list')}
            className={`h-8 w-8 rounded-lg ${
              viewMode === 'list'
                ? 'bg-muted text-purple-600 dark:text-purple-400 font-bold'
                : 'text-muted-foreground'
            }`}
            title="Visualização em Lista"
          >
            <ListIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* =========================================================================
          BARRA DE AÇÕES EM LOTE (SELEÇÃO MÚLTIPLA)
          ========================================================================= */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 px-4 rounded-2xl bg-purple-600/10 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <Badge className="bg-purple-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-full">
              {selectedIds.length} selecionado{selectedIds.length > 1 ? 's' : ''}
            </Badge>
            <span className="text-xs text-foreground font-semibold">
              Ações em lote disponíveis:
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select
              onValueChange={async (status: 'draft' | 'scheduled' | 'published' | 'approved') => {
                setBulkActionLoading(true)
                try {
                  await bulkUpdatePostsStatus(selectedIds, status)
                  toast({
                    title: 'Status atualizado em lote',
                    description: `${selectedIds.length} posts movidos para ${status}.`,
                  })
                  refreshPosts()
                  setSelectedIds([])
                } catch {
                  toast({
                    title: 'Erro na atualização em lote',
                    variant: 'destructive',
                  })
                } finally {
                  setBulkActionLoading(false)
                }
              }}
              disabled={bulkActionLoading}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-card border-border w-36">
                <SelectValue placeholder="Mudar Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Mover para Rascunho</SelectItem>
                <SelectItem value="scheduled">Mover para Agendado</SelectItem>
                <SelectItem value="approved">Marcar como Aprovado</SelectItem>
                <SelectItem value="published">Marcar como Publicado</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              disabled={bulkActionLoading}
              onClick={async () => {
                setBulkActionLoading(true)
                try {
                  await bulkTogglePostsFavorite(selectedIds, true)
                  toast({
                    title: 'Favoritados em lote',
                    description: `${selectedIds.length} posts marcados com estrela.`,
                  })
                  refreshPosts()
                  setSelectedIds([])
                } catch {
                  toast({ title: 'Erro ao favoritar', variant: 'destructive' })
                } finally {
                  setBulkActionLoading(false)
                }
              }}
              className="h-8 text-xs font-semibold rounded-xl gap-1.5"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Favoritar</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={bulkActionLoading}
              onClick={async () => {
                setBulkActionLoading(true)
                try {
                  await bulkTogglePostsArchived(selectedIds, true)
                  toast({
                    title: 'Arquivados em lote',
                    description: `${selectedIds.length} posts movidos para o arquivo.`,
                  })
                  refreshPosts()
                  setSelectedIds([])
                } catch {
                  toast({ title: 'Erro ao arquivar', variant: 'destructive' })
                } finally {
                  setBulkActionLoading(false)
                }
              }}
              className="h-8 text-xs font-semibold rounded-xl gap-1.5"
            >
              <Archive className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Arquivar</span>
            </Button>

            <Button
              variant="destructive"
              size="sm"
              disabled={bulkActionLoading}
              onClick={() => setBulkDeleteOpen(true)}
              className="h-8 text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="h-8 text-xs text-muted-foreground hover:text-foreground rounded-xl"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* =========================================================================
          BARRA DE PESQUISA & FILTROS ATIVOS
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search input */}
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, legenda, formato ou marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-card border-border/80 rounded-xl text-xs sm:text-sm focus:border-purple-500 shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Brand quick filter */}
        <div className="md:col-span-2">
          <Select value={selectedBrandFilter} onValueChange={setSelectedBrandFilter}>
            <SelectTrigger
              aria-label="Filtrar por Marca"
              className="h-10 text-xs rounded-xl bg-card border-border/80 shadow-xs"
            >
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                {activeBrand ? `Marca: ${activeBrand.name}` : 'Todas marcas'}
              </SelectItem>
              <SelectItem value="all">Todas as Marcas</SelectItem>
              {brands.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Platform quick filter */}
        <div className="md:col-span-2">
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger
              aria-label="Filtrar por Rede Social"
              className="h-10 text-xs rounded-xl bg-card border-border/80 shadow-xs"
            >
              <SelectValue placeholder="Rede Social" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Redes</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="twitter">Twitter / X</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campaign quick filter */}
        <div className="md:col-span-3">
          <Select
            value={selectedCampaignId}
            onValueChange={(val) => {
              setSelectedCampaignId(val)
              if (val === 'all') {
                searchParams.delete('campaign')
                setSearchParams(searchParams)
              } else {
                setSearchParams({ ...Object.fromEntries(searchParams), campaign: val })
              }
            }}
          >
            <SelectTrigger
              aria-label="Filtrar por Campanha"
              className="h-10 text-xs rounded-xl bg-card border-border/80 shadow-xs text-purple-700 dark:text-purple-300 font-semibold"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Megaphone className="w-3.5 h-3.5 text-purple-600" />
                <SelectValue placeholder="Campanha" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Campanhas</SelectItem>
              {campaignsList.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters Popover */}
        <div className="md:col-span-2 flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                aria-label="Abrir mais filtros de formato e ordenação"
                className="w-full h-10 text-xs font-semibold gap-2 rounded-xl border-border/80 bg-card hover:bg-muted shadow-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Mais Filtros</span>
                {(selectedFormat !== 'all' || sortOrder !== 'newest') && (
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 space-y-3.5 rounded-2xl shadow-xl" align="end">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-purple-600" /> Filtros Refinados
                </h4>
                {(selectedFormat !== 'all' || sortOrder !== 'newest') && (
                  <button
                    onClick={() => {
                      setSelectedFormat('all')
                      setSortOrder('newest')
                    }}
                    className="text-[11px] text-purple-600 hover:underline"
                  >
                    Resetar
                  </button>
                )}
              </div>

              {/* Tag Filter */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Etiqueta / Tag
                </label>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger aria-label="Selecionar Tag" className="h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as tags</SelectItem>
                    {allAvailableTags.map((tag) => (
                      <SelectItem key={tag} value={tag} className="capitalize">
                        #{tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Format Filter */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Tipo de Formato
                </label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger aria-label="Selecionar Formato" className="h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os formatos</SelectItem>
                    <SelectItem value="flyer">Flyers e Banners (Retrato)</SelectItem>
                    <SelectItem value="video">Vídeos, Reels, Shorts & TikTok</SelectItem>
                    <SelectItem value="carousel">Carrosséis (Educativo, Antes & Depois)</SelectItem>
                    <SelectItem value="talking_head">Talking Head (Roteiro 9:16)</SelectItem>
                    <SelectItem value="ugc">UGC & Prova Social</SelectItem>
                    <SelectItem value="interactive">
                      Interativo / Enquete / Comunidade / Collab
                    </SelectItem>
                    <SelectItem value="post">Posts de Feed Quadrados / Retrato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Ordenação Temporal
                </label>
                <Select
                  value={sortOrder}
                  onValueChange={(val: 'newest' | 'oldest') => setSortOrder(val)}
                >
                  <SelectTrigger
                    aria-label="Selecionar Ordenação"
                    className="h-8 text-xs rounded-lg"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mais recentes primeiro</SelectItem>
                    <SelectItem value="oldest">Mais antigos primeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* =========================================================================
          BANNER INFORMATIVO DE CAMPANHA / MARCA ATIVA & ESTATÍSTICAS DE REVISÃO
          ========================================================================= */}
      {selectedCampaignId !== 'all' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/15 via-purple-500/10 to-indigo-500/10 border border-purple-500/30 space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-foreground">
                    Campanha: &ldquo;
                    {campaignsList.find((c) => c.id === selectedCampaignId)?.name || 'Campanha'}
                    &rdquo;
                  </span>
                  <Badge className="bg-purple-600 text-white text-[10px] px-2 py-0.5">
                    {filteredPosts.length}{' '}
                    {filteredPosts.length === 1 ? 'formato' : 'formatos gerados'}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Briefing integrado multi-formato: revise cada peça abaixo e marque como revisada
                  para publicar.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currCamp = campaignsList.find((c) => c.id === selectedCampaignId) || null
                  setSelectedCampaignForReport(currCamp)
                  setCampaignReportModalOpen(true)
                }}
                className="text-xs bg-purple-600/15 hover:bg-purple-600/25 border-purple-500/40 text-purple-800 dark:text-purple-200 h-8 gap-1.5 font-bold shadow-xs"
              >
                <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                <span>Relatório da Campanha</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCampaignId('all')
                  searchParams.delete('campaign')
                  setSearchParams(searchParams)
                }}
                className="text-xs text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 h-8 gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Ver todas as criações</span>
              </Button>
            </div>
          </div>

          {/* Sumário de Revisão da Campanha */}
          {(() => {
            const campaignPosts = posts.filter(
              (p: Post) => (p.campaignId || p._raw?.campaign) === selectedCampaignId,
            )
            const reviewedCount = campaignPosts.filter((p) => Boolean(p.isReviewed)).length
            const pendingCount = campaignPosts.length - reviewedCount
            const formatCounts: Record<string, number> = {}
            campaignPosts.forEach((p) => {
              const f = p.campaignFormat || p._raw?.campaign_format || p.contentType || 'geral'
              formatCounts[f] = (formatCounts[f] || 0) + 1
            })

            return (
              <div className="pt-2 border-t border-purple-500/20 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Status da Revisão:</span>
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold"
                  >
                    ✓ {reviewedCount} revisados
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold"
                  >
                    ⏳ {pendingCount} pendentes
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-muted-foreground">Formatos agrupados:</span>
                  {Object.entries(formatCounts).map(([fmt, cnt]) => (
                    <span
                      key={fmt}
                      className="px-2 py-0.5 rounded-md bg-card/80 border border-border text-[10px] font-mono text-foreground font-semibold"
                    >
                      {fmt}: {cnt}
                    </span>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {selectedCampaignId === 'all' && selectedBrandFilter === 'active' && activeBrand && (
        <div className="p-3 px-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            <span className="text-muted-foreground">
              Exibindo criações da organização ativa:{' '}
              <strong className="text-foreground">{activeBrand.name}</strong>
            </span>
          </div>
          <button
            onClick={() => setSelectedBrandFilter('all')}
            className="text-purple-600 dark:text-purple-400 font-semibold hover:underline text-left sm:text-right"
          >
            Ver de todas as marcas ({posts.length}) →
          </button>
        </div>
      )}

      {/* =========================================================================
          CONTEÚDO: GRID OU LISTA
          ========================================================================= */}
      {filteredPosts.length === 0 ? (
        <Card className="p-12 text-center space-y-4 bg-muted/20 border-dashed border-border/80 rounded-2xl">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Nenhuma criação encontrada
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Não encontramos nenhum conteúdo correspondente aos filtros atuais. Tente alterar os
              termos de busca, selecionar outra marca ou gerar uma nova criação com a IA.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setSelectedBrandFilter('all')
                setSelectedPlatform('all')
                setSelectedFormat('all')
                setActiveTab('all')
              }}
              className="text-xs rounded-xl"
            >
              Limpar Filtros
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/app/content/new')}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 rounded-xl shadow-xs"
            >
              <PenTool className="w-3.5 h-3.5" /> Criar Novo Conteúdo
            </Button>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        /* ================= GRID VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredPosts.map((post: Post) => {
            const brand = brands.find((b: any) => b.id === post.brandId)
            const { isVideo, ratio, typeLabel, presetImage, badgeUser } = parsePostScriptMeta(post)
            const mediaUrl = getPostImage(post, isVideo, presetImage)
            const relativeTime = formatRelativeTime(post._raw?.created || post.scheduledDate)
            const statusConfig = statusBadgeConfig[post.status] || statusBadgeConfig.draft

            return (
              <Card
                key={post.id}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card hover:shadow-xl hover:border-purple-500/40 transition-all duration-300 flex flex-col group relative"
              >
                {/* Media Container (Aspect Ratio) */}
                <div
                  className="relative aspect-[4/5] bg-muted/60 overflow-hidden cursor-pointer"
                  onClick={() => setViewPost(post)}
                >
                  <img
                    src={mediaUrl}
                    alt={post.content || post.caption || 'Criação'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none" />

                  {/* Checkbox de seleção múltipla (canto superior esquerdo) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedIds((prev) =>
                        prev.includes(post.id)
                          ? prev.filter((id) => id !== post.id)
                          : [...prev, post.id],
                      )
                    }}
                    title={selectedIds.includes(post.id) ? 'Desmarcar seleção' : 'Selecionar post'}
                    className={cn(
                      'absolute top-3 left-3 z-10 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shadow-md backdrop-blur-xs',
                      selectedIds.includes(post.id)
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'bg-black/60 border-white/40 text-transparent hover:border-white hover:bg-black/80',
                      brand && 'top-11',
                    )}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  {/* Top-Right Badge: Platform + Format Type + Favorite Star */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(post, e)}
                      title={post.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
                      className="p-1.5 rounded-md bg-black/60 hover:bg-black/90 backdrop-blur-xs text-white transition-all shadow-xs"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          post.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-white'
                        }`}
                      />
                    </button>
                    <span className="inline-flex items-center gap-1 bg-white/95 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider backdrop-blur-xs">
                      {isVideo && <Film className="w-3 h-3 text-slate-900" />}
                      {typeLabel}
                    </span>
                  </div>

                  {/* Top-Left Brand Pill */}
                  {brand && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[10px] text-white border border-white/10">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-3.5 h-3.5 rounded-full object-cover"
                        />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                      )}
                      <span className="font-medium truncate max-w-[90px]">{brand.name}</span>
                    </div>
                  )}

                  {/* Play icon if video */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 transition-all">
                        <Video className="w-5 h-5 ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Aspect Ratio & Template Badge */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className="bg-black/75 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-md font-mono font-medium border border-white/10">
                      {ratio}
                    </span>
                    {(post.templateId || post._raw?.template_id) && (
                      <span className="bg-purple-600/90 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-md font-bold shadow-xs flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5" /> Template
                      </span>
                    )}
                    {badgeUser && (
                      <span className="w-5 h-5 rounded-full bg-white/90 text-slate-900 text-[10px] font-bold flex items-center justify-center shadow-xs">
                        {badgeUser}
                      </span>
                    )}
                  </div>

                  {/* Status Indicator & Botão de Revisão */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                    {/* Botão de revisão rápida se for post de campanha */}
                    {(post.campaignId || post._raw?.campaign) && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleReviewed(post, e)}
                        title={
                          post.isReviewed ? 'Marcar como não revisado' : 'Marcar como revisado'
                        }
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all backdrop-blur-xs shadow-xs ${
                          post.isReviewed
                            ? 'bg-emerald-600/90 text-white hover:bg-emerald-700'
                            : 'bg-amber-500/90 text-white hover:bg-amber-600'
                        }`}
                      >
                        <Check className="w-2.5 h-2.5" />
                        <span>{post.isReviewed ? 'Revisado' : 'Revisar'}</span>
                      </button>
                    )}
                    <Badge
                      className={`${statusConfig.badgeClass} text-[10px] font-bold px-2 py-0.5 gap-1 shadow-xs backdrop-blur-xs`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>

                {/* Badge de Análise de Performance para Posts Publicados */}
                {post.status === 'published' && (
                  <div className="px-4 pt-2 -mb-1">
                    <PostPerformanceBadge
                      metrics={
                        metricsMap[post.id] ||
                        getSimulatedMetricFallback(
                          post.id,
                          post.platform,
                          post.createdAt || post._raw?.created,
                        )
                      }
                      platform={post.platform}
                      status={post.status}
                    />
                  </div>
                )}

                {/* Content & Details */}
                <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <h3
                      onClick={() => setViewPost(post)}
                      className="text-sm font-bold text-foreground line-clamp-2 leading-snug group-hover:text-purple-600 transition-colors cursor-pointer"
                      title={post.content || post.caption}
                    >
                      {post.content || post.caption || 'Sem título'}
                    </h3>
                    {post.caption && post.content && post.caption !== post.content && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {post.caption}
                      </p>
                    )}
                  </div>

                  {/* Meta strip */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate">
                      {getPlatformIcon(post.platform)}
                      <span className="capitalize truncate">{post.platform}</span>
                      <span>&middot;</span>
                      <span className="truncate">{relativeTime}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/80 shrink-0">
                      {post.width && post.height && (
                        <span>
                          {post.width}x{post.height}
                        </span>
                      )}
                      <span>({ratio})</span>
                    </div>
                  </div>

                  {/* Tags Pill List */}
                  {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {post.tags.slice(0, 3).map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium px-1.5 py-0.2 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-[9px] text-muted-foreground font-medium">
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions row */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    {/* Primary action: Abrir / Editar */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditor(post.id)}
                      className="h-8 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 px-2.5 gap-1 rounded-lg"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      {/* Painel lateral de detalhes ricos */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDetailsDrawerPost(post)
                          setEditingTags(Array.isArray(post.tags) ? post.tags.join(', ') : '')
                        }}
                        className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg"
                        title="Painel de Detalhes"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </Button>

                      {/* View details */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewPost(post)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                        title="Visualizar Modal"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>

                      {/* Share */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => sharePost(post.caption || post.content)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                        title="Compartilhar"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>

                      {/* Duplicate */}
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={actionLoadingId === post.id}
                        onClick={() => handleDuplicate(post)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                        title="Duplicar para Rascunho"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>

                      {/* More Menu (Status / Delete) */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl">
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(post.id, 'draft')}
                            className="text-xs gap-2"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-500" />
                            <span>Mover para Rascunho</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(post.id, 'approved')}
                            className="text-xs gap-2"
                          >
                            <Check className="w-3.5 h-3.5 text-purple-500" />
                            <span>Marcar como Aprovado</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(post.id, 'published')}
                            className="text-xs gap-2"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Marcar como Publicado</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleArchived(post)}
                            className="text-xs gap-2"
                          >
                            <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{post.isArchived ? 'Desarquivar' : 'Arquivar'}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteCandidate(post)}
                            className="text-xs gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir Definitivo</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* ================= LIST VIEW ================= */
        <div className="space-y-3">
          {filteredPosts.map((post: Post) => {
            const brand = brands.find((b: any) => b.id === post.brandId)
            const { isVideo, ratio, typeLabel, presetImage } = parsePostScriptMeta(post)
            const mediaUrl = getPostImage(post, isVideo, presetImage)
            const relativeTime = formatRelativeTime(post._raw?.created || post.scheduledDate)
            const statusConfig = statusBadgeConfig[post.status] || statusBadgeConfig.draft

            return (
              <Card
                key={post.id}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card hover:shadow-md hover:border-purple-500/40 transition-all p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Checkbox de seleção múltipla */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedIds((prev) =>
                        prev.includes(post.id)
                          ? prev.filter((id) => id !== post.id)
                          : [...prev, post.id],
                      )
                    }}
                    title={selectedIds.includes(post.id) ? 'Desmarcar seleção' : 'Selecionar post'}
                    className={cn(
                      'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0',
                      selectedIds.includes(post.id)
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'border-border text-transparent hover:border-purple-500 hover:bg-muted',
                    )}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  {/* Thumbnail */}
                  <div
                    onClick={() => setViewPost(post)}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-muted overflow-hidden shrink-0 relative cursor-pointer group"
                  >
                    <img
                      src={mediaUrl}
                      alt={post.content}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Video className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className={`${statusConfig.badgeClass} text-[10px] font-bold px-2 py-0.5 gap-1`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                        {statusConfig.label}
                      </Badge>
                      {(post.campaignId || post._raw?.campaign) && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleReviewed(post, e)}
                          title={
                            post.isReviewed ? 'Marcar como não revisado' : 'Marcar como revisado'
                          }
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                            post.isReviewed
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5" />
                          <span>{post.isReviewed ? 'Revisado' : 'Pendente de Revisão'}</span>
                        </button>
                      )}
                      <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {typeLabel} &middot; {ratio}
                      </span>
                      {(post.templateId || post._raw?.template_id) && (
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Layers className="w-3 h-3" /> Modelo Ativo
                        </span>
                      )}
                      {brand && (
                        <span className="text-xs font-semibold text-muted-foreground truncate max-w-[120px]">
                          {brand.name}
                        </span>
                      )}
                    </div>

                    <h4
                      onClick={() => setViewPost(post)}
                      className="text-sm font-bold text-foreground hover:text-purple-600 transition-colors cursor-pointer line-clamp-1"
                    >
                      {post.content || post.caption || 'Sem título'}
                    </h4>

                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {post.caption || post.content}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                      {getPlatformIcon(post.platform)}
                      <span className="capitalize">{post.platform}</span>
                      <span>&middot;</span>
                      <span>{relativeTime}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEditor(post.id)}
                    className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-border"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                    <span>Editar</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setViewPost(post)}
                    className="h-8 text-xs gap-1 rounded-xl"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Ver</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDuplicate(post)}
                    className="h-8 text-xs gap-1 rounded-xl"
                    title="Duplicar"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteCandidate(post)}
                    className="h-8 text-xs gap-1 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL DE VISUALIZAÇÃO DETALHADA DO POST
          ========================================================================= */}
      {viewPost && (
        <Dialog open={!!viewPost} onOpenChange={() => setViewPost(null)}>
          <DialogContent className="max-w-2xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  {getPlatformIcon(viewPost.platform, 'w-4 h-4')}
                  <DialogTitle className="text-base font-bold capitalize">
                    {viewPost.platform} &middot; Detalhes da Criação
                  </DialogTitle>
                </div>
                <Badge
                  className={
                    statusBadgeConfig[viewPost.status]?.badgeClass ||
                    statusBadgeConfig.draft.badgeClass
                  }
                >
                  {statusBadgeConfig[viewPost.status]?.label || viewPost.status}
                </Badge>
              </div>
            </DialogHeader>

            {(() => {
              const { isVideo, ratio, typeLabel, presetImage } = parsePostScriptMeta(viewPost)
              const mediaUrl = getPostImage(viewPost, isVideo, presetImage)
              const brand = brands.find((b: any) => b.id === viewPost.brandId)

              return (
                <div className="space-y-4">
                  {/* Media Banner */}
                  <div className="relative rounded-2xl overflow-hidden bg-muted max-h-80 flex items-center justify-center border border-border/80">
                    <img
                      src={mediaUrl}
                      alt="Preview do post"
                      className="w-full h-full object-contain max-h-80 bg-black/5"
                    />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-mono border border-white/10">
                      Formato: {typeLabel} ({ratio})
                    </div>
                  </div>

                  {/* Brand & Timing & Template & Approval */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/40 p-3.5 rounded-xl border border-border/60">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                        Marca
                      </span>
                      <span className="font-bold text-foreground">
                        {brand?.name || 'Geral / Não atribuída'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                        Dimensões / Resolução
                      </span>
                      <span className="font-bold text-foreground">
                        {viewPost.width && viewPost.height
                          ? `${viewPost.width}x${viewPost.height} px`
                          : ratio}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                        Nível de Aprovação
                      </span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {viewPost.approvalLevel ||
                          (viewPost.status === 'approved'
                            ? 'Nível 2 (Aprovado)'
                            : 'Nível 1 (Em Revisão)')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                        Revisões Registradas
                      </span>
                      <span className="font-bold text-foreground">
                        {viewPost.revisionCount || 1}ª versão
                      </span>
                    </div>
                  </div>

                  {/* Tags e Redes de Destino */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-card border border-border/70 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Tag className="w-3.5 h-3.5 text-purple-600" />
                      <span className="font-semibold text-muted-foreground text-[11px]">Tags:</span>
                      {Array.isArray(viewPost.tags) && viewPost.tags.length > 0 ? (
                        viewPost.tags.map((t, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] px-2 py-0">
                            #{t}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Nenhuma tag</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-muted-foreground text-[11px]">
                        Redes de Destino:
                      </span>
                      {Array.isArray(viewPost.targetNetworks) &&
                      viewPost.targetNetworks.length > 0 ? (
                        viewPost.targetNetworks.map((net, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-[10px] capitalize px-2 py-0 border-purple-500/30"
                          >
                            {net}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {viewPost.platform}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Content / Title */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Título / Conteúdo Principal
                    </label>
                    <div className="p-3 bg-card border border-border/70 rounded-xl text-xs sm:text-sm font-semibold text-foreground">
                      {viewPost.content || 'Sem título inserido'}
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Legenda Completa
                    </label>
                    <div className="p-3 bg-muted/40 border border-border/70 rounded-xl text-xs leading-relaxed text-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {viewPost.caption || 'Sem legenda'}
                    </div>
                  </div>

                  {/* Scheduled date */}
                  {viewPost.scheduledDate && (
                    <div className="flex items-center gap-2 p-3 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 rounded-xl text-xs font-semibold">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Programado para publicação em:{' '}
                        {new Date(viewPost.scheduledDate).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}

                  {/* Análise de Performance do Post Publicado */}
                  {viewPost.status === 'published' && (
                    <div className="pt-2">
                      <PostPerformanceCard
                        metrics={
                          metricsMap[viewPost.id] ||
                          getSimulatedMetricFallback(
                            viewPost.id,
                            viewPost.platform,
                            viewPost.createdAt || viewPost._raw?.created,
                          )
                        }
                        networkMetricsList={
                          multiMetricsMap[viewPost.id] ||
                          getSimulatedMultiNetworkMetrics(
                            viewPost.id,
                            Array.isArray(viewPost.targetNetworks) &&
                              viewPost.targetNetworks.length > 0
                              ? viewPost.targetNetworks
                              : [viewPost.platform || 'Instagram'],
                            viewPost.createdAt || viewPost._raw?.created,
                          )
                        }
                        brandAverageRate={5.1}
                        brandId={viewPost.brandId}
                      />
                    </div>
                  )}

                  {/* Footer actions */}
                  <DialogFooter className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/60">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        sharePost(viewPost.caption || viewPost.content)
                      }}
                      className="text-xs gap-1.5 rounded-xl"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Compartilhar Texto
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const id = viewPost.id
                          setViewPost(null)
                          navigate(`/app/editor/${id}`)
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 rounded-xl font-semibold shadow-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Abrir no Editor
                      </Button>
                    </div>
                  </DialogFooter>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>
      )}

      {/* =========================================================================
          PAINEL LATERAL DE DETALHES RICOS E EDIÇÃO RÁPIDA
          ========================================================================= */}
      {detailsDrawerPost && (
        <Dialog open={!!detailsDrawerPost} onOpenChange={() => setDetailsDrawerPost(null)}>
          <DialogContent className="max-w-xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <DialogHeader>
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-purple-600" />
                  Painel de Detalhes da Criação
                </DialogTitle>
                <Badge
                  className={
                    statusBadgeConfig[detailsDrawerPost.status]?.badgeClass ||
                    statusBadgeConfig.draft.badgeClass
                  }
                >
                  {statusBadgeConfig[detailsDrawerPost.status]?.label || detailsDrawerPost.status}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              {/* Dimensões, Redes & Nível de Aprovação */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-muted/40 p-3.5 rounded-xl border border-border/60">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                    Dimensões
                  </span>
                  <span className="font-bold text-foreground font-mono">
                    {detailsDrawerPost.width && detailsDrawerPost.height
                      ? `${detailsDrawerPost.width}x${detailsDrawerPost.height} px`
                      : '1080x1350 px'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                    Status de Revisão
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleReviewed(detailsDrawerPost)}
                    className="font-bold text-left hover:underline flex items-center gap-1 mt-0.5"
                  >
                    {detailsDrawerPost.isReviewed ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        ✓ Revisado (Aprovado)
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        ⏳ Pendente de Revisão
                      </span>
                    )}
                  </button>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                    Revisões
                  </span>
                  <span className="font-bold text-foreground">
                    {detailsDrawerPost.revisionCount || 1}ª versão
                  </span>
                </div>
              </div>

              {/* Redes de Destino */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Redes de Destino Configuradas
                </label>
                <div className="flex items-center gap-2 flex-wrap p-2.5 bg-card border border-border/70 rounded-xl">
                  {(Array.isArray(detailsDrawerPost.targetNetworks) &&
                  detailsDrawerPost.targetNetworks.length > 0
                    ? detailsDrawerPost.targetNetworks
                    : [detailsDrawerPost.platform]
                  ).map((net, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="capitalize font-bold text-[11px] px-2.5 py-0.5 rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300"
                    >
                      {net}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tags Editáveis */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Tags / Etiquetas (separadas por vírgula)</span>
                  <span className="text-purple-600 font-semibold">Editável</span>
                </label>
                <Input
                  value={editingTags}
                  onChange={(e) => setEditingTags(e.target.value)}
                  placeholder="ex: promocao, lancamento, feed, blackfriday"
                  className="h-9 text-xs rounded-xl bg-card border-border"
                />
              </div>

              {/* Histórico do Post & Metadados */}
              <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Histórico de Status & Registro
                </span>
                <div className="space-y-1.5 text-[11px] text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Criado no sistema:</span>
                    <span className="font-mono text-foreground">
                      {new Date(detailsDrawerPost._raw?.created || Date.now()).toLocaleString(
                        'pt-BR',
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Última atualização:</span>
                    <span className="font-mono text-foreground">
                      {new Date(detailsDrawerPost._raw?.updated || Date.now()).toLocaleString(
                        'pt-BR',
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status Atual:</span>
                    <Badge
                      className={
                        statusBadgeConfig[detailsDrawerPost.status]?.badgeClass ||
                        statusBadgeConfig.draft.badgeClass
                      }
                    >
                      {statusBadgeConfig[detailsDrawerPost.status]?.label ||
                        detailsDrawerPost.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailsDrawerPost(null)}
                className="rounded-xl text-xs"
              >
                Fechar
              </Button>
              <Button
                size="sm"
                disabled={savingDrawer}
                onClick={async () => {
                  setSavingDrawer(true)
                  try {
                    const parsedTags = editingTags
                      .split(',')
                      .map((t) => t.trim().replace(/^#/, ''))
                      .filter(Boolean)
                    await pb.collection('posts').update(detailsDrawerPost.id, {
                      tags: parsedTags,
                    })
                    toast({
                      title: 'Tags atualizadas com sucesso!',
                      description: 'As novas tags foram salvas no PocketBase.',
                    })
                    refreshPosts()
                    setDetailsDrawerPost(null)
                  } catch {
                    toast({
                      title: 'Erro ao salvar tags',
                      variant: 'destructive',
                    })
                  } finally {
                    setSavingDrawer(false)
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* =========================================================================
          MODAL DE CONFIRMAÇÃO DE EXCLUSÃO EM LOTE
          ========================================================================= */}
      {bulkDeleteOpen && (
        <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <DialogContent className="max-w-md p-6 rounded-2xl space-y-4">
            <DialogHeader>
              <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mb-1">
                <Trash2 className="w-5 h-5" />
              </div>
              <DialogTitle className="text-base font-bold">
                Excluir {selectedIds.length} criações selecionadas?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Esta ação removerá permanentemente todos os posts selecionados do PocketBase. Esta
                operação não poderá ser desfeita.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkDeleteOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                disabled={bulkActionLoading}
                onClick={async () => {
                  setBulkActionLoading(true)
                  try {
                    await bulkDeletePosts(selectedIds)
                    toast({
                      title: 'Criações excluídas em lote',
                      description: `${selectedIds.length} posts foram removidos da biblioteca.`,
                    })
                    refreshPosts()
                    setSelectedIds([])
                    setBulkDeleteOpen(false)
                  } catch {
                    toast({
                      title: 'Erro ao excluir em lote',
                      variant: 'destructive',
                    })
                  } finally {
                    setBulkActionLoading(false)
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                Confirmar e Excluir Todos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* =========================================================================
          MODAL DE CONFIRMAÇÃO DE EXCLUSÃO
          ========================================================================= */}
      {deleteCandidate && (
        <Dialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
          <DialogContent className="max-w-md p-6 rounded-2xl space-y-4">
            <DialogHeader>
              <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mb-1">
                <Trash2 className="w-5 h-5" />
              </div>
              <DialogTitle className="text-base font-bold">
                Excluir criação da biblioteca?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Esta ação removerá permanentemente o post &ldquo;
                <strong className="text-foreground">
                  {deleteCandidate.content || deleteCandidate.caption || 'Sem título'}
                </strong>
                &rdquo; do banco de dados do PocketBase. Esta operação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteCandidate(null)}
                className="text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                Confirmar e Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* =========================================================================
          IMAGE BANK MODAL & CREATE CAMPAIGN MODAL
          ========================================================================= */}
      <ImageBankModal open={imageBankOpen} onOpenChange={setImageBankOpen} />

      <CreateCampaignModal
        open={campaignModalOpen}
        onOpenChange={setCampaignModalOpen}
        onSuccess={(cId) => {
          setSelectedCampaignId(cId)
          searchParams.set('campaign', cId)
          setSearchParams(searchParams)
          refreshPosts()
          getCampaigns().then(setCampaignsList)
        }}
      />

      <CampaignReportModal
        open={campaignReportModalOpen}
        onOpenChange={setCampaignReportModalOpen}
        campaign={selectedCampaignForReport}
        posts={posts}
        brandName={activeBrand?.name || 'Sua Marca'}
      />

      {/* =========================================================================
          RODAPÉ PADRÃO DA PLATAFORMA
          ========================================================================= */}
      <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p className="text-center sm:text-left">
          Social 2 Powered by <span className="font-semibold text-foreground">BestContent AI</span>
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/community')}
            className="hover:text-purple-600 transition-colors"
          >
            Novidades
          </button>
          <span>&middot;</span>
          <a href="#" className="hover:text-purple-600 transition-colors">
            Termos
          </a>
          <span>&middot;</span>
          <a href="#" className="hover:text-purple-600 transition-colors">
            Privacidade
          </a>
        </div>
      </div>
    </div>
  )
}
