import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, Search, PenTool, TrendingUp, Loader2, ExternalLink, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRealtime } from '@/hooks/use-realtime'
import { getTrends } from '@/services/trends'
import { getCategories } from '@/services/categories'
import type { CategoryRecord, TrendRecord } from '@/types'

export default function Discover() {
  const navigate = useNavigate()
  const [trends, setTrends] = useState<TrendRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('all')
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

  useEffect(() => {
    Promise.all([loadTrends(), loadCategories()]).finally(() => setLoading(false))
  }, [])

  useRealtime('trends', () => loadTrends())

  const trendingHashtags = useMemo(
    () => categories.slice(0, 6).map((c) => `#${c.name.replace(/\s/g, '')}`),
    [categories],
  )

  const filtered = useMemo(() => {
    let r = [...trends]
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q),
      )
    }
    if (activeCat !== 'all') {
      r = r.filter((t) => t.expand?.category?.name === activeCat)
    }
    r.sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0))
    return r
  }, [trends, search, activeCat])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          Descobrir
          <Compass className="w-6 h-6 text-primary" />
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Explore os assuntos virais e matérias em alta no seu mercado de atuação.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-pink-500/10 to-amber-500/10 border border-primary/20 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <TrendingUp className="w-4 h-4" />
          <span>Categorias em Alta</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {trendingHashtags.map((topic) => (
            <span
              key={topic}
              className="bg-background/80 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-foreground border border-border"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Pesquisar trends e inspirações..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Button
          variant={activeCat === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCat('all')}
          className={`rounded-full text-xs shrink-0 ${activeCat === 'all' ? 'bg-primary text-white' : ''}`}
        >
          Todas
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCat === cat.name ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCat(cat.name)}
            className={`rounded-full text-xs shrink-0 ${activeCat === cat.name ? 'bg-primary text-white' : ''}`}
          >
            {cat.name}
          </Button>
        ))}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((trend) => (
            <Card
              key={trend.id}
              className="overflow-hidden hover:shadow-md transition-all duration-300 border-border flex flex-col group"
            >
              <div className="relative h-40 bg-muted overflow-hidden">
                <img
                  src={
                    trend.image_url ||
                    `https://img.usecurling.com/p/400/300?q=${encodeURIComponent(trend.title)}`
                  }
                  alt={trend.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {trend.expand?.category && (
                    <Badge variant="secondary" className="text-[10px] font-semibold">
                      {trend.expand.category.name}
                    </Badge>
                  )}
                  <Badge className="bg-black/70 text-white backdrop-blur-md border-0 text-[10px] gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {trend.popularity_score || 0}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-foreground leading-snug line-clamp-2">
                    {trend.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                    {trend.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button
                    size="sm"
                    onClick={() =>
                      navigate('/app/content/new', { state: { caption: trend.title } })
                    }
                    className="bg-primary text-white text-xs flex-1 gap-1"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    Criar Post
                  </Button>
                  {trend.source_url && (
                    <a
                      href={trend.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
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
