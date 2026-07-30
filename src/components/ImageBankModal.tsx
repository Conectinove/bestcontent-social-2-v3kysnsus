import { useState, useEffect } from 'react'
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
import {
  Search,
  Image as ImageIcon,
  Copy,
  Check,
  PenTool,
  Loader2,
  AlertCircle,
} from 'lucide-react'
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

interface StockImage {
  id: string
  url: string
  title: string
  category: string
}

function generateImages(query: string): StockImage[] {
  const variations = [
    { suffix: '', label: query },
    { suffix: ' professional', label: `${query} profissional` },
    { suffix: ' modern', label: `${query} moderno` },
    { suffix: ' creative', label: `${query} criativo` },
    { suffix: ' minimal', label: `${query} minimalista` },
    { suffix: ' vibrant', label: `${query} vibrante` },
    { suffix: ' dark', label: `${query} escuro` },
    { suffix: ' light', label: `${query} claro` },
    { suffix: ' abstract', label: `${query} abstrato` },
    { suffix: ' lifestyle', label: `${query} lifestyle` },
    { suffix: ' closeup', label: `${query} close-up` },
    { suffix: ' wide angle', label: `${query} panorâmico` },
  ]
  return variations.map((v, i) => ({
    id: `${query}-${i}`,
    url: `https://img.usecurling.com/p/800/800?q=${encodeURIComponent(query + v.suffix)}&dpr=2`,
    title: v.label.charAt(0).toUpperCase() + v.label.slice(1),
    category: 'Busca',
  }))
}

export function ImageBankModal({ open, onOpenChange, onSelectImage }: ImageBankModalProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [images, setImages] = useState<StockImage[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCat, setSelectedCat] = useState('Todos')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && images.length === 0) {
      setImages(generateImages('social media content'))
    }
    if (!open) {
      setSelectedImage(null)
      setError(null)
    }
  }, [open])

  const handleSearch = () => {
    const query = search.trim()
    if (!query) return
    setLoading(true)
    setError(null)
    setTimeout(() => {
      try {
        const results = generateImages(query)
        if (results.length === 0) {
          setError('Nenhuma imagem encontrada. Tente outra palavra-chave.')
          setImages([])
        } else {
          setImages(results)
        }
      } catch {
        setError('Erro ao buscar imagens. Verifique sua conexão.')
      } finally {
        setLoading(false)
      }
    }, 500)
  }

  const handleCategorySearch = (cat: string) => {
    setSelectedCat(cat)
    setSearch(cat)
    setLoading(true)
    setError(null)
    setTimeout(() => {
      setImages(generateImages(cat.toLowerCase()))
      setLoading(false)
    }, 300)
  }

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
            Busque fotografias profissionais para compor seus posts sociais. Digite uma
            palavra-chave e pressione Enter.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar imagens (ex: nature, café, tecnologia)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 h-10 text-xs"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="bg-primary text-white text-xs gap-1"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Buscar
          </Button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Button
            variant={selectedCat === 'Todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedCat('Todos')
              setImages(generateImages('social media content'))
            }}
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
              onClick={() => handleCategorySearch(cat)}
              className={`rounded-full text-[11px] h-7 shrink-0 ${
                selectedCat === cat ? 'bg-primary text-white' : ''
              }`}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-1 min-h-[350px]">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 text-center">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null)
                  setImages(generateImages('social media content'))
                }}
                className="text-xs"
              >
                Tentar novamente
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 text-center">
              <ImageIcon className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhuma imagem encontrada. Tente outra busca.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => {
                const isCopied = copiedUrl === img.url
                const isSelected = selectedImage === img.url
                return (
                  <div
                    key={img.id}
                    className={`group relative rounded-xl overflow-hidden border-2 bg-card shadow-sm hover:shadow-md transition-all duration-300 flex flex-col ${
                      isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                    }`}
                  >
                    <div
                      className="aspect-square bg-muted relative overflow-hidden cursor-pointer"
                      onClick={() => setSelectedImage(isSelected ? null : img.url)}
                    >
                      <img
                        src={img.url}
                        alt={img.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
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
                          onClick={() => handleCopy(img.url)}
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUseImage(img.url)}
                          className="text-[11px] h-7 px-2 bg-primary hover:bg-primary/90 text-white gap-1 flex-1"
                        >
                          <PenTool className="w-3 h-3" /> Usar
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {selectedImage && (
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground">
              Imagem selecionada. Clique para anexar ao post.
            </p>
            <Button
              size="sm"
              onClick={() => handleUseImage(selectedImage)}
              className="bg-primary text-white text-xs gap-1"
            >
              <PenTool className="w-3 h-3" /> Usar Imagem Selecionada
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
