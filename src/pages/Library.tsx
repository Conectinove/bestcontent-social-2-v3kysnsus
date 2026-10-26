import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
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
import { toast } from '@/hooks/use-toast'
import { sharePost } from '@/lib/share'
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
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [imageBankOpen, setImageBankOpen] = useState(false)
  const [viewPost, setViewPost] = useState<Post | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<Post | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

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

    return { all, drafts, scheduled, published, approved }
  }, [posts, selectedBrandFilter, activeBrand])

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
          if (selectedFormat === 'flyer' && parsed.typeLabel !== 'FLYER') return false
          if (selectedFormat === 'video' && !parsed.isVideo) return false
          if (selectedFormat === 'post' && (parsed.isVideo || parsed.typeLabel === 'FLYER'))
            return false
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
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshPosts()}
            className="rounded-xl border-border bg-card hover:bg-muted text-xs font-semibold h-9 px-3 gap-1.5 shadow-xs"
            title="Atualizar lista com PocketBase"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Sincronizar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setImageBankOpen(true)}
            className="rounded-xl border-border bg-card hover:bg-muted text-xs font-semibold h-9 px-3.5 gap-2 shadow-xs"
          >
            <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Banco de Imagens</span>
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/app/content/new')}
            className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-9 px-4 gap-2 shadow-sm transition-all"
          >
            <PenTool className="w-4 h-4" />
            <span>Novo Post</span>
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
        <div className="md:col-span-3">
          <Select value={selectedBrandFilter} onValueChange={setSelectedBrandFilter}>
            <SelectTrigger
              aria-label="Filtrar por Marca"
              className="h-10 text-xs rounded-xl bg-card border-border/80 shadow-xs"
            >
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                {activeBrand ? `Marca Ativa: ${activeBrand.name}` : 'Todas as marcas'}
              </SelectItem>
              <SelectItem value="all">Todas as Marcas (Geral)</SelectItem>
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
                    <SelectItem value="video">Vídeos, Reels e Shorts</SelectItem>
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
          BANNER INFORMATIVO DA MARCA SELECIONADA
          ========================================================================= */}
      {selectedBrandFilter === 'active' && activeBrand && (
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

                  {/* Top-Right Badge: Platform + Format Type */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
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

                  {/* Status Indicator */}
                  <div className="absolute bottom-3 right-3">
                    <Badge
                      className={`${statusConfig.badgeClass} text-[10px] font-bold px-2 py-0.5 gap-1 shadow-xs`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>

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

                    <span className="text-[10px] font-mono text-muted-foreground/80 shrink-0">
                      {ratio}
                    </span>
                  </div>

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
                      {/* View details */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewPost(post)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                        title="Visualizar Detalhes"
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

                  {/* Brand & Timing & Template */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-muted/40 p-3.5 rounded-xl border border-border/60">
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
                        Criado em
                      </span>
                      <span className="font-bold text-foreground">
                        {viewPost._raw?.created
                          ? new Date(viewPost._raw.created).toLocaleString('pt-BR')
                          : 'Recentemente'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                        Modelo Aplicado
                      </span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {viewPost.templateId || viewPost._raw?.template_id
                          ? 'Sim (Vinculado)'
                          : 'Personalizado'}
                      </span>
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
          IMAGE BANK MODAL
          ========================================================================= */}
      <ImageBankModal open={imageBankOpen} onOpenChange={setImageBankOpen} />

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
