import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Image as ImageIcon, Copy, Check, PenTool } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ImageBankModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectImage?: (url: string) => void
}

const CATEGORIES = [
  'Tecnologia',
  'Negócios',
  'Moda',
  'Pessoas',
  'Design',
  'Marketing',
  'Gastronomia',
  'Viagem',
  'Fitness',
]

const STOCK_IMAGES = [
  {
    id: '1',
    query: 'technology workspace laptop',
    title: 'Espaço de Trabalho Tech',
    category: 'Tecnologia',
  },
  {
    id: '2',
    query: 'business team meeting',
    title: 'Reunião de Equipe Executiva',
    category: 'Negócios',
  },
  {
    id: '3',
    query: 'modern fashion style portrait',
    title: 'Estilo Urbano Moderno',
    category: 'Moda',
  },
  {
    id: '4',
    query: 'creative developer coding',
    title: 'Desenvolvedor Criativo',
    category: 'Tecnologia',
  },
  {
    id: '5',
    query: 'digital marketing strategy desk',
    title: 'Mesa de Estratégia Digital',
    category: 'Marketing',
  },
  {
    id: '6',
    query: 'gourmet artisan coffee croissant',
    title: 'Café Artesanal & Croissant',
    category: 'Gastronomia',
  },
  {
    id: '7',
    query: 'scenic tropical travel beach',
    title: 'Paisagem Tropical e Mar',
    category: 'Viagem',
  },
  {
    id: '8',
    query: 'athlete workout fitness gym',
    title: 'Treino e Vida Saudável',
    category: 'Fitness',
  },
  {
    id: '9',
    query: 'abstract neon gradient background',
    title: 'Gradiente Abstrato Neon',
    category: 'Design',
  },
  {
    id: '10',
    query: 'happy team celebration startup',
    title: 'Comemoração de Startup',
    category: 'Pessoas',
  },
  {
    id: '11',
    query: 'social media phone influencer',
    title: 'Criação de Conteúdo Mobile',
    category: 'Marketing',
  },
  {
    id: '12',
    query: 'minimalist architectural space',
    title: 'Arquitetura Minimalista',
    category: 'Design',
  },
]

export function ImageBankModal({ open, onOpenChange, onSelectImage }: ImageBankModalProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('Todos')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const filteredImages = STOCK_IMAGES.filter((img) => {
    const matchesSearch =
      img.title.toLowerCase().includes(search.toLowerCase()) ||
      img.query.toLowerCase().includes(search.toLowerCase())
    const matchesCat = selectedCat === 'Todos' || img.category === selectedCat
    return matchesSearch && matchesCat
  })

  const getImageUrl = (query: string) =>
    `https://img.usecurling.com/p/800/800?q=${encodeURIComponent(query)}`

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    toast({
      title: 'Link copiado!',
      description: 'URL da imagem copiada para a área de transferência.',
    })
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const handleUseImage = (url: string) => {
    if (onSelectImage) {
      onSelectImage(url)
    } else {
      navigate('/app/content/new', { state: { mediaUrl: url } })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 gap-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" /> Banco de Imagens
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Explore e utilize gratuitamente fotografias profissionais para compor seus posts
            sociais.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar imagens (ex: café, tecnologia, pessoas)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Button
            variant={selectedCat === 'Todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCat('Todos')}
            className={`rounded-full text-[11px] h-7 shrink-0 ${
              selectedCat === 'Todos' ? 'bg-primary text-white' : ''
            }`}
          >
            Todos
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCat === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCat(cat)}
              className={`rounded-full text-[11px] h-7 shrink-0 ${
                selectedCat === cat ? 'bg-primary text-white' : ''
              }`}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-1 min-h-[350px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredImages.map((img) => {
              const url = getImageUrl(img.query)
              const isCopied = copiedUrl === url
              return (
                <div
                  key={img.id}
                  className="group relative rounded-xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <img
                      src={url}
                      alt={img.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[10px] text-white border-0">
                      {img.category}
                    </Badge>
                  </div>
                  <div className="p-2.5 flex flex-col justify-between flex-1 gap-2">
                    <p className="text-xs font-semibold line-clamp-1">{img.title}</p>
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Copiar Link"
                        onClick={() => handleCopy(url)}
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUseImage(url)}
                        className="text-[11px] h-7 px-2 bg-primary hover:bg-primary/90 text-white gap-1 flex-1"
                      >
                        <PenTool className="w-3 h-3" /> Usar Post
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
