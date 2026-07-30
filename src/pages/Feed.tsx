import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Heart, ExternalLink, Sparkles, PenTool, TrendingUp, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
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
import { toast } from '@/hooks/use-toast'
import type { CategoryRecord, TrendRecord } from '@/types'

export default function Feed() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [trends, setTrends] = useState<TrendRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savedMap, setSavedMap] = useState<Map<string, string>>(new Map())
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('Todos')
  const [sortBy, setSortBy] = useState('recent')
  const [loading, setLoading] = useState(true)

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

  useRealtime('trends', () => {
    loadTrends()
  })
  useRealtime('saved_posts', () => {
    loadSaved()
  })

  const filtered = useMemo(() => {
    let r = [...trends]
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q),
      )
    }
    if (activeCat !== 'Todos') {
      r = r.filter((t) => t.expand?.category?.name === activeCat)
    }
    if (sortBy === 'recent') {
      r.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    } else if (sortBy === 'popular') {
      r.sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0))
    } else {
      r.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
    }
    return r
  }, [trends, search, activeCat, sortBy])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            Feed de Inspiração
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Trends e ideias em alta selecionados para as suas marcas.
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Pesquisar trends e ideias..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
            className={`rounded-full text-xs shrink-0 ${activeCat === cat ? 'bg-primary text-white' : ''}`}
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

      {filtered.length === 0 ? (
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
          {filtered.map((trend) => (
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
                  {trend.source_url && (
                    <a
                      href={trend.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver fonte original
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
