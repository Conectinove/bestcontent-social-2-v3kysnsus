import { useState } from 'react'
import { useNavigate } from 'react'
import { Sparkles, Heart, Bookmark, Share2, PenTool, ExternalLink, Filter } from 'lucide-react'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function Feed() {
  const { ideas, toggleLikeIdea, toggleSaveIdea, searchQuery, selectedBrandId } = useSocial()
  const [activeCategory, setActiveCategory] = useState<string>('Todas')
  const navigate = useNavigate()

  const categories = ['Todas', 'Trending', 'Notícias', 'Ideias', 'Dicas']

  const filteredIdeas = ideas.filter((item) => {
    if (selectedBrandId !== 'all' && item.brandId && item.brandId !== selectedBrandId) {
      return false
    }
    if (activeCategory !== 'Todas' && item.category !== activeCategory) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return item.title.toLowerCase().includes(q) || item.snippet.toLowerCase().includes(q)
    }
    return true
  })

  const handleShare = (title: string) => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: 'Link copiado!',
      description: `A ideia "${title}" foi copiada para compartilhamento.`,
    })
  }

  const handleCreateFromIdea = (ideaTitle: string, snippet: string) => {
    navigate('/app/content/new', { state: { caption: `${ideaTitle}\n\n${snippet}` } })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            Feed de Inspiração
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Trends, notícias e ideias em alta selecionadas para as suas marcas.
          </p>
        </div>

        <Button
          onClick={() => navigate('/app/content/new')}
          className="bg-primary hover:bg-primary/90 text-white gap-2 font-medium self-start md:self-auto"
        >
          <PenTool className="w-4 h-4" />
          Criar Post a partir de Ideia
        </Button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full text-xs shrink-0 ${
              activeCategory === cat ? 'bg-primary text-white' : ''
            }`}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Feed List Cards */}
      {filteredIdeas.length === 0 ? (
        <Card className="p-8 text-center space-y-3 bg-muted/40">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold">Nenhuma ideia encontrada</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Tente selecionar outra marca ou categoria, ou limpe a busca para encontrar novos
            insights.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIdeas.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden hover:shadow-md transition-all duration-300 border-border flex flex-col justify-between group"
            >
              <CardContent className="p-0 flex flex-col h-full">
                {/* Thumbnail Image */}
                <div className="relative h-48 overflow-hidden bg-muted">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-black/70 text-white backdrop-blur-md border-0 text-[11px]">
                      {item.source}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px] font-semibold">
                      {item.category}
                    </Badge>
                  </div>
                </div>

                {/* Content details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                      {item.snippet}
                    </p>
                  </div>

                  {/* Actions bar */}
                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLikeIdea(item.id)}
                        className={`h-8 px-2 text-xs gap-1 ${
                          item.isLiked ? 'text-pink-600 font-semibold' : 'text-muted-foreground'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${item.isLiked ? 'fill-pink-600' : ''}`} />
                        <span>{item.likesCount}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSaveIdea(item.id)}
                        className={`h-8 px-2 text-xs gap-1 ${
                          item.isSaved ? 'text-primary font-semibold' : 'text-muted-foreground'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${item.isSaved ? 'fill-primary' : ''}`} />
                        <span>{item.isSaved ? 'Salvo' : 'Salvar'}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShare(item.title)}
                        className="h-8 w-8 text-muted-foreground"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleCreateFromIdea(item.title, item.snippet)}
                      className="bg-primary/10 hover:bg-primary text-primary hover:text-white font-medium text-xs h-8 gap-1 rounded-md transition-colors"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Criar Post</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
