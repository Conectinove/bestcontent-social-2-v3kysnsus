import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, Sparkles, TrendingUp, Search, PenTool, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'

export default function Discover() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('Tecnologia')

  const categories = ['Tecnologia', 'Moda', 'Beleza', 'Gastronomia', 'Viagem', 'Fitness']

  const trendingTopics = [
    '#InteligenciaArtificial',
    '#Sustentabilidade',
    '#CafeEspecial',
    '#RotinaProdutiva',
    '#LuzAzulSkincare',
  ]

  const discoverCards = [
    {
      id: 'disc-1',
      source: 'TechCrunch',
      title: 'A revolução do conteúdo gerado por IA na América Latina em 2025',
      image: 'https://img.usecurling.com/p/400/300?q=artificial%20intelligence',
      category: 'Tecnologia',
    },
    {
      id: 'disc-2',
      source: 'Vogue Tech',
      title: 'Ingredientes biológicos que estão transformando o mercado de Skincare',
      image: 'https://img.usecurling.com/p/400/300?q=natural%20cosmetics',
      category: 'Beleza',
    },
    {
      id: 'disc-3',
      source: 'Food & Wine',
      title: 'Métodos de extração de café gelado viram febre entre jovens',
      image: 'https://img.usecurling.com/p/400/300?q=cold%20brew%20coffee',
      category: 'Gastronomia',
    },
  ]

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

      {/* Trending Hashtags row */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-pink-500/10 to-amber-500/10 border border-primary/20 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <TrendingUp className="w-4 h-4" />
          <span>Hashtags e Tópicos em Alta Hoje</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {trendingTopics.map((topic) => (
            <span
              key={topic}
              className="bg-background/80 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-foreground border border-border"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
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

      {/* Grid of discover items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {discoverCards.map((card) => (
          <Card
            key={card.id}
            className="overflow-hidden hover:shadow-md transition-all duration-300"
          >
            <div className="h-40 bg-muted overflow-hidden">
              <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
            </div>
            <CardContent className="p-4 space-y-3">
              <Badge variant="secondary" className="text-[10px]">
                {card.source}
              </Badge>
              <h3 className="font-bold text-sm text-foreground leading-snug">{card.title}</h3>
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Button
                  size="sm"
                  onClick={() => navigate('/app/content/new', { state: { caption: card.title } })}
                  className="bg-primary text-white text-xs flex-1 gap-1"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Criar Post
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
