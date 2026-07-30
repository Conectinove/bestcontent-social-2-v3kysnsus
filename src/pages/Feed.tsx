import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Heart,
  ExternalLink,
  Sparkles,
  PenTool,
  TrendingUp,
  Loader2,
  Share2,
  Trash2,
  Instagram,
  Video,
  Youtube,
  Linkedin,
  Facebook,
  Twitter,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRealtime } from '@/hooks/use-realtime'
import { getTrends } from '@/services/trends'
import { getCategories } from '@/services/categories'
import { getSavedPosts, createSavedPost, deleteSavedPost } from '@/services/saved_posts'
import { createPostFromTrend } from '@/services/posts'
import { toast } from '@/hooks/use-toast'
import { sharePost } from '@/lib/share'
import type { CategoryRecord, TrendRecord, Post, SocialPlatform } from '@/types'

function getPlatformIcon(platform: SocialPlatform | string) {
  const p = (platform || '').toLowerCase()
  if (p.includes('instagram')) return <Instagram className="w-3 h-3 text-pink-500" />
  if (p.includes('tiktok')) return <Video className="w-3 h-3 text-cyan-400" />
  if (p.includes('youtube')) return <Youtube className="w-3 h-3 text-red-500" />
  if (p.includes('linkedin')) return <Linkedin className="w-3 h-3 text-blue-500" />
  if (p.includes('facebook')) return <Facebook className="w-3 h-3 text-blue-600" />
  return <Twitter className="w-3 h-3 text-sky-400" />
}

function getStatusBadge(status: string) {
  if (status === 'published')
    return <Badge className="bg-emerald-600 text-white border-0 text-[10px]">Publicado</Badge>
  if (status === 'scheduled')
    return <Badge className="bg-blue-600 text-white border-0 text-[10px]">Agendado</Badge>
  return <Badge className="bg-slate-600 text-white border-0 text-[10px]">Rascunho</Badge>
}

export default function Feed() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { posts, brands, deletePost, refreshPosts } = useSocial()

  const [activeTab, setActiveTab] = useState('all')
  const [postSearch, setPostSearch] = useState('')

  const [trends, setTrends] = useState<TrendRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savedMap, setSavedMap] = useState<Map<string, string>>(new Map())
  const [trendSearch, setTrendSearch] = useState('')
  const [activeCat, setActiveCat] = useState('Todos')
  const [sortBy, setSortBy] = useState('recent')
  const [loading, setLoading] = useState(true)
  const [generatingTrendId, setGeneratingTrendId] = useState<string | null>(null)

  const loadTrends = async () => {
    try {
      const data = await getTrends()
      setTrends(data as unknown as TrendRecord[])
    } catch (_) {
      /* ignore */
    }
  }

  const loadCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data as unknown as CategoryRecord[])
    } catch (_) {
      /* ignore */
    }
  }

  const loadSaved = async () => {
    if (!user?.id) return
    try {
      const data = await getSavedPosts(user.id)
      const ids = new Set<string>()
      const map = new Map<string, string>()
      for (const r of data as unknown as Array<{ id: string; trend: string }>) {
        ids.add(r.trend)
        map.set(r.trend, r.id)
      }
      setSavedIds(ids)
      setSavedMap(map)
    } catch (_) {
      /* ignore */
    }
  }

  useEffect(() => {
    Promise.all([loadTrends(), loadCategories(), loadSaved()]).finally(() => setLoading(false))
  }, [])

  useRealtime('trends', () => loadTrends())
  useRealtime('saved_posts', () => loadSaved())
  useRealtime('posts', () => {
    if (typeof refreshPosts === 'function') refreshPosts()
  })

  const isPostPending = (post: Post) => {
    if (post.status === 'draft') return true
    if (post.status === 'scheduled' && post.scheduledDate) {
      return new Date(post.scheduledDate) < new Date()
    }
    return false
  }

  const counts = useMemo(
    () => ({
      all: posts.length,
      drafts: posts.filter((p: Post) => p.status === 'draft').length,
      scheduled: posts.filter((p: Post) => p.status === 'scheduled').length,
      published: posts.filter((p: Post) => p.status === 'published').length,
      pending: posts.filter((p: Post) => isPostPending(p)).length,
    }),
    [posts],
  )

  const filteredPosts = useMemo(() => {
    return posts.filter((post: Post) => {
      if (activeTab === 'drafts' && post.status !== 'draft') return false
      if (activeTab === 'scheduled' && post.status !== 'scheduled') return false
      if (activeTab === 'published' && post.status !== 'published') return false
      if (activeTab === 'pending' && !isPostPending(post)) return false
      if (postSearch.trim()) {
        const q = postSearch.toLowerCase()
        if (
          !(post.content || '').toLowerCase().includes(q) &&
          !(post.caption || '').toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [posts, activeTab, postSearch])

  const filteredTrends = useMemo(() => {
    let r = [...trends]
    if (trendSearch.trim()) {
      const q = trendSearch.toLowerCase()
      r = r.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q),
      )
    }
    if (activeCat !== 'Todos') r = r.filter((t) => t.expand?.category?.name === activeCat)
    if (sortBy === 'recent')
      r.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    else if (sortBy === 'popular')
      r.sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0))
    else r.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
    return r
  }, [trends, trendSearch, activeCat, sortBy])

  const toggleSave = async (trendId: string) => {
    if (!user?.id) return
    const isSaved = savedIds.has(trendId)
    setSavedIds((prev) => {
      const n = new Set(prev)
      if (isSaved) n.delete(trendId)
      else n.add(trendId)
      return n
    })
    try {
      if (isSaved) {
        const recordId = savedMap.get(trendId)
        if (recordId) await deleteSavedPost(recordId)
        setSavedMap((prev) => {
          const n = new Map(prev)
          n.delete(trendId)
          return n
        })
      } else {
        const record = await createSavedPost(trendId, user.id)
        setSavedMap((prev) => new Map(prev).set(trendId, (record as unknown as { id: string }).id))
      }
    } catch (_) {
      setSavedIds((prev) => {
        const n = new Set(prev)
        if (isSaved) n.add(trendId)
        else n.delete(trendId)
        return n
      })
      toast({ title: 'Erro', description: 'Não foi possível salvar.', variant: 'destructive' })
    }
  }

  const handleDeletePost = async (id: string) => {
    try {
      await deletePost(id)
      toast({ title: 'Post excluído', description: 'O post foi removido.' })
    } catch (_) {
      toast({ title: 'Erro', description: 'Falha ao excluir post.', variant: 'destructive' })
    }
  }

  const handleGeneratePost = async (trend: TrendRecord) => {
    if (!user?.id) return
    if (!brands.length) {
      toast({ title: 'Atenção', description: 'Crie uma marca primeiro.' })
      return
    }
    setGeneratingTrendId(trend.id)
    try {
      const brandId = brands[0].id
      const record = await createPostFromTrend(
        trend.id,
        trend.title,
        trend.description || '',
        user.id,
        brandId,
        trend.expand?.category?.name,
      )
      toast({
        title: 'Post criado!',
        description: 'Rascunho gerado com IA a partir da trend.',
      })
      navigate(`/app/editor/${(record as unknown as { id: string }).id}`)
    } catch {
      toast({
        title: 'Erro ao gerar post',
        description: 'Não foi possível gerar o post. Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setGeneratingTrendId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const tabs = [
    { key: 'all', label: 'Todos', count: counts.all },
    { key: 'drafts', label: 'Rascunhos', count: counts.drafts },
    { key: 'scheduled', label: 'Agendados', count: counts.scheduled },
    { key: 'published', label: 'Publicados', count: counts.published },
    { key: 'pending', label: 'Pendentes', count: counts.pending },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              Meus Posts
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gerencie seus posts com filtros por status.
            </p>
          </div>
          <Button
            onClick={() => navigate('/app/content/new')}
            className="bg-primary hover:bg-primary/90 text-white gap-2 font-medium self-start md:self-auto"
          >
            <PenTool className="w-4 h-4" />
            Criar Post
          </Button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full text-xs shrink-0 ${
                activeTab === tab.key ? 'bg-primary text-white' : ''
              }`}
            >
              {tab.label} ({tab.count})
            </Button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar posts por conteúdo..."
            value={postSearch}
            onChange={(e) => setPostSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {filteredPosts.length === 0 ? (
          <Card className="p-8 text-center space-y-3 bg-muted/40">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold">Nenhum post encontrado</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Tente ajustar a busca ou criar um novo post.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.map((post: Post) => {
              const brand = brands.find((b: any) => b.id === post.brandId)
              const mediaUrl =
                post.mediaUrls?.[0] ||
                `https://img.usecurling.com/p/400/500?q=${encodeURIComponent(
                  post.platform + ' social content',
                )}`
              return (
                <Card
                  key={post.id}
                  className="overflow-hidden hover:shadow-md transition-all duration-300 border-border flex flex-col group"
                >
                  <CardContent className="p-0 flex flex-col h-full">
                    <div className="relative h-40 overflow-hidden bg-muted">
                      <img
                        src={mediaUrl}
                        alt={post.caption || post.content}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[10px] text-white">
                        {getPlatformIcon(post.platform)}
                        <span className="capitalize">{post.platform}</span>
                      </div>
                      {brand && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[10px] text-white">
                          {brand.logo ? (
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              className="w-3 h-3 rounded-full"
                            />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                          <span className="truncate max-w-[70px]">{brand.name}</span>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2">{getStatusBadge(post.status)}</div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <p className="text-xs font-medium text-foreground line-clamp-2">
                        {post.caption || post.content || 'Sem legenda inserida'}
                      </p>
                      <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => sharePost(post.caption || post.content)}
                          title="Compartilhar"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeletePost(post.id)}
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Feed de Inspiração
            <TrendingUp className="w-5 h-5 text-primary" />
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Trends e ideias em alta selecionados para as suas marcas.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar trends e ideias..."
            value={trendSearch}
            onChange={(e) => setTrendSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {['Todos', ...categories.map((c) => c.name)].map((cat) => (
            <Button
              key={cat}
              variant={activeCat === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCat(cat)}
              className={`rounded-full text-xs shrink-0 ${
                activeCat === cat ? 'bg-primary text-white' : ''
              }`}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Ordenar por:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais Recentes</SelectItem>
              <SelectItem value="popular">Mais Populares</SelectItem>
              <SelectItem value="old">Mais Antigos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredTrends.length === 0 ? (
          <Card className="p-8 text-center space-y-3 bg-muted/40">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold">Nenhuma trend encontrada</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Tente ajustar a busca ou selecionar outra categoria.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTrends.map((trend) => (
              <Card
                key={trend.id}
                className="overflow-hidden hover:shadow-md transition-all duration-300 border-border flex flex-col group"
              >
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="relative h-48 overflow-hidden bg-muted">
                    <img
                      src={
                        trend.image_url ||
                        `https://img.usecurling.com/p/400/300?q=${encodeURIComponent(trend.title)}`
                      }
                      alt={trend.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      {trend.expand?.category && (
                        <Badge variant="secondary" className="text-[11px] font-semibold">
                          {trend.expand.category.name}
                        </Badge>
                      )}
                      <Badge className="bg-black/70 text-white backdrop-blur-md border-0 text-[11px] gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {trend.popularity_score || 0}
                      </Badge>
                    </div>
                    <button
                      onClick={() => toggleSave(trend.id)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${savedIds.has(trend.id) ? 'fill-pink-500 text-pink-500' : 'text-white'}`}
                      />
                    </button>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {trend.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                        {trend.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                      {trend.source_url ? (
                        <a
                          href={trend.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Ver fonte
                        </a>
                      ) : (
                        <span />
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleGeneratePost(trend)}
                        disabled={generatingTrendId === trend.id}
                        className="text-xs gap-1 h-7 ml-auto bg-primary text-white"
                      >
                        {generatingTrendId === trend.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <PenTool className="w-3 h-3" />
                        )}
                        Gerar Post
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
