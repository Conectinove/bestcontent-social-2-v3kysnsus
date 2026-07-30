import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Search,
  PenTool,
  Image as ImageIcon,
  Filter,
  Share2,
  Trash2,
  Eye,
  Calendar,
  Sparkles,
  Trophy,
  Instagram,
  Video,
  Youtube,
  Linkedin,
  Facebook,
  Twitter,
} from 'lucide-react'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ImageBankModal } from '@/components/ImageBankModal'
import { toast } from '@/hooks/use-toast'
import { sharePost } from '@/lib/share'
import type { Post, SocialPlatform } from '@/types'

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return 'há pouco'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffMonths = Math.floor(diffDays / 30)

  if (diffMonths >= 1) {
    return `há cerca de ${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'}`
  }
  if (diffDays >= 1) {
    return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`
  }
  if (diffHours >= 1) {
    return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  }
  return 'há alguns minutos'
}

function getPlatformIcon(platform: SocialPlatform | string) {
  const p = (platform || '').toLowerCase()
  if (p.includes('instagram')) return <Instagram className="w-3 h-3 text-pink-500" />
  if (p.includes('tiktok')) return <Video className="w-3 h-3 text-cyan-400" />
  if (p.includes('youtube')) return <Youtube className="w-3 h-3 text-red-500" />
  if (p.includes('linkedin')) return <Linkedin className="w-3 h-3 text-blue-500" />
  if (p.includes('facebook')) return <Facebook className="w-3 h-3 text-blue-600" />
  return <Twitter className="w-3 h-3 text-sky-400" />
}

function getStatusBadge(status: string, isPending: boolean) {
  if (isPending) {
    return (
      <Badge className="bg-amber-500/90 text-white border-0 text-[10px] font-bold px-1.5 py-0.5 gap-1 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> R
      </Badge>
    )
  }
  if (status === 'published') {
    return (
      <Badge className="bg-emerald-600 text-white border-0 text-[10px] font-bold px-1.5 py-0.5 gap-1 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-white" /> P
      </Badge>
    )
  }
  if (status === 'scheduled') {
    return (
      <Badge className="bg-blue-600 text-white border-0 text-[10px] font-bold px-1.5 py-0.5 gap-1 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-white" /> A
      </Badge>
    )
  }
  return (
    <Badge className="bg-slate-700 text-white border-0 text-[10px] font-bold px-1.5 py-0.5 gap-1 shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> R
    </Badge>
  )
}

export default function Library() {
  const navigate = useNavigate()
  const { posts, brands, deletePost } = useSocial()

  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [imageBankOpen, setImageBankOpen] = useState(false)
  const [viewPost, setViewPost] = useState<Post | null>(null)

  const isPostPending = (post: Post) => {
    if (post.status === 'draft') return true
    if (post.status === 'scheduled' && post.scheduledDate) {
      return new Date(post.scheduledDate) < new Date()
    }
    return false
  }

  const counts = useMemo(() => {
    let all = posts.length
    let drafts = posts.filter((p: Post) => p.status === 'draft').length
    let scheduled = posts.filter((p: Post) => p.status === 'scheduled').length
    let published = posts.filter((p: Post) => p.status === 'published').length
    let pending = posts.filter((p: Post) => isPostPending(p)).length
    return { all, drafts, scheduled, published, pending }
  }, [posts])

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post: Post) => {
        if (activeTab === 'drafts' && post.status !== 'draft') return false
        if (activeTab === 'scheduled' && post.status !== 'scheduled') return false
        if (activeTab === 'published' && post.status !== 'published') return false
        if (activeTab === 'pending' && !isPostPending(post)) return false

        if (search.trim()) {
          const q = search.toLowerCase()
          const matchesContent = (post.content || '').toLowerCase().includes(q)
          const matchesCaption = (post.caption || '').toLowerCase().includes(q)
          if (!matchesContent && !matchesCaption) return false
        }

        if (selectedBrand !== 'all' && post.brandId !== selectedBrand) return false
        if (
          selectedPlatform !== 'all' &&
          post.platform?.toLowerCase() !== selectedPlatform.toLowerCase()
        )
          return false

        return true
      })
      .sort((a: Post, b: Post) => {
        const dateA = new Date(a._raw?.created || a.scheduledDate || 0).getTime()
        const dateB = new Date(b._raw?.created || b.scheduledDate || 0).getTime()
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
      })
  }, [posts, activeTab, search, selectedBrand, selectedPlatform, sortOrder])

  const handleDelete = async (id: string) => {
    try {
      await deletePost(id)
      toast({ title: 'Post excluído', description: 'O post foi removido da biblioteca.' })
    } catch (_) {
      toast({ title: 'Erro', description: 'Falha ao excluir post.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Biblioteca de Posts</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {filteredPosts.length}{' '}
            {filteredPosts.length === 1 ? 'post encontrado' : 'posts encontrados'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImageBankOpen(true)}
            className="text-xs gap-2 border-border/80 hover:bg-muted"
          >
            <ImageIcon className="w-4 h-4 text-primary" />
            Banco de Imagens
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/app/content/new')}
            className="bg-primary hover:bg-primary/90 text-white text-xs gap-2 font-semibold shadow-sm"
          >
            <PenTool className="w-4 h-4" />
            Novo Post
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('all')}
          className={`rounded-full text-xs h-8 px-4 gap-1.5 font-medium ${
            activeTab === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-muted/50 hover:bg-muted'
          }`}
        >
          Todos <span className="opacity-75 font-normal">{counts.all}</span>
        </Button>
        <Button
          variant={activeTab === 'drafts' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('drafts')}
          className={`rounded-full text-xs h-8 px-4 gap-1.5 font-medium ${
            activeTab === 'drafts'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-muted/50 hover:bg-muted'
          }`}
        >
          Rascunhos <span className="opacity-75 font-normal">{counts.drafts}</span>
        </Button>
        <Button
          variant={activeTab === 'scheduled' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('scheduled')}
          className={`rounded-full text-xs h-8 px-4 gap-1.5 font-medium ${
            activeTab === 'scheduled'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-muted/50 hover:bg-muted'
          }`}
        >
          Agendados <span className="opacity-75 font-normal">{counts.scheduled}</span>
        </Button>
        <Button
          variant={activeTab === 'published' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('published')}
          className={`rounded-full text-xs h-8 px-4 gap-1.5 font-medium ${
            activeTab === 'published'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-muted/50 hover:bg-muted'
          }`}
        >
          Publicados <span className="opacity-75 font-normal">{counts.published}</span>
        </Button>
        <Button
          variant={activeTab === 'pending' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('pending')}
          className={`rounded-full text-xs h-8 px-4 gap-1.5 font-medium ${
            activeTab === 'pending'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" /> Pendentes{' '}
          <span className="opacity-75 font-normal">{counts.pending}</span>
        </Button>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-muted/30 border-border/70 rounded-xl text-xs"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-10 text-xs gap-2 rounded-xl border-border/70"
            >
              <Filter className="w-4 h-4 text-muted-foreground" />
              Filtros
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 space-y-3" align="end">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Filtros Avançados
            </h4>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Marca</label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todas as marcas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as marcas</SelectItem>
                  {brands.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Rede Social</label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todas as redes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as redes</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Ordenação</label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mais Recentes</SelectItem>
                  <SelectItem value="oldest">Mais Antigos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Grid of Posts */}
      {filteredPosts.length === 0 ? (
        <Card className="p-12 text-center space-y-3 bg-muted/20 border-dashed border-border/80 rounded-2xl">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold">Nenhum post encontrado</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Não há conteúdos correspondentes ao filtro selecionado. Tente ajustar os termos de busca
            ou crie um novo post!
          </p>
          <Button
            size="sm"
            onClick={() => navigate('/app/content/new')}
            className="bg-primary text-white text-xs gap-1.5"
          >
            <PenTool className="w-3.5 h-3.5" /> Criar Conteúdo Agora
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredPosts.map((post: Post) => {
            const brand = brands.find((b: any) => b.id === post.brandId)
            const postPending = isPostPending(post)
            const mediaUrl =
              post.mediaUrls?.[0] ||
              `https://img.usecurling.com/p/400/500?q=${encodeURIComponent(
                post.platform + ' ' + (post.content || 'social content'),
              )}`

            const relativeTime = formatRelativeTime(post._raw?.created || post.scheduledDate)

            return (
              <Card
                key={post.id}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card hover:shadow-lg transition-all duration-300 flex flex-col group relative"
              >
                {/* Media Preview (4:5 Ratio) */}
                <div className="relative aspect-[4/5] bg-muted overflow-hidden">
                  <img
                    src={mediaUrl}
                    alt={post.caption || post.content}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Top Right Platform Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] text-white font-medium border border-white/10">
                    {getPlatformIcon(post.platform)}
                    <span className="capitalize">{post.platform}</span>
                  </div>

                  {/* Brand Pill */}
                  {brand && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[10px] text-white">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-3.5 h-3.5 rounded-full object-cover"
                        />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                      <span className="font-medium truncate max-w-[80px]">{brand.name}</span>
                    </div>
                  )}

                  {/* Aspect Ratio Label */}
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
                    4:5
                  </div>

                  {/* Status Indicator Dot */}
                  <div className="absolute bottom-3 right-3">
                    {getStatusBadge(post.status, postPending)}
                  </div>
                </div>

                {/* Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                  <p className="text-xs font-medium text-foreground line-clamp-2 leading-relaxed">
                    {post.caption || post.content || 'Sem legenda inserida'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                    <span className="truncate">{relativeTime}</span>
                    <span className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80">
                      Post Portrait
                    </span>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-end gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setViewPost(post)}
                      title="Visualizar Post"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => sharePost(post.caption || post.content)}
                      title="Compartilhar"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(post.id)}
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detail Dialog */}
      {viewPost && (
        <Dialog open={!!viewPost} onOpenChange={() => setViewPost(null)}>
          <DialogContent className="max-w-lg p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center justify-between">
                <span>Detalhes do Conteúdo</span>
                <Badge variant="outline" className="text-xs capitalize">
                  {viewPost.platform}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden max-h-64 bg-muted flex items-center justify-center">
                <img
                  src={
                    viewPost.mediaUrls?.[0] ||
                    `https://img.usecurling.com/p/500/500?q=${encodeURIComponent(viewPost.platform)}`
                  }
                  alt="Post preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Legenda / Conteúdo
                </label>
                <p className="text-xs leading-relaxed bg-muted/40 p-3 rounded-lg whitespace-pre-wrap">
                  {viewPost.caption || viewPost.content}
                </p>
              </div>

              {viewPost.scheduledDate && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>
                    Agendado para: {new Date(viewPost.scheduledDate).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Bank Modal */}
      <ImageBankModal open={imageBankOpen} onOpenChange={setImageBankOpen} />
    </div>
  )
}
