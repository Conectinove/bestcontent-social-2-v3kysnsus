import { useState, useEffect, useRef } from 'react'
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
  UploadCloud,
  Sparkles,
  FolderLock,
  Layers,
  Crown,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
  ImageBankAsset,
  getImageBankAssets,
  uploadImageBankAsset,
  getAssetUrl,
} from '@/services/image-bank'

interface ImageBankModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectImage?: (url: string) => void
  onSelect?: (url: string) => void
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'negocios', label: 'Negócios' },
  { id: 'educacao', label: 'Educação' },
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'tecnologia', label: 'Tecnologia' },
  { id: 'estilo_de_vida', label: 'Estilo de Vida' },
  { id: 'saude', label: 'Saúde' },
  { id: 'moda', label: 'Moda' },
  { id: 'geral', label: 'Geral' },
]

export function ImageBankModal({
  open,
  onOpenChange,
  onSelectImage,
  onSelect,
}: ImageBankModalProps) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [assets, setAssets] = useState<ImageBankAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedCat, setSelectedCat] = useState('todas')
  const [sourceTab, setSourceTab] = useState<'all' | 'curated' | 'mine'>('all')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadAssets = async (cat = selectedCat, tab = sourceTab, searchQuery = search) => {
    setLoading(true)
    setError(null)
    try {
      const items = await getImageBankAssets({
        category: cat !== 'todas' ? cat : undefined,
        search: searchQuery.trim() || undefined,
        onlyCurated: tab === 'curated' ? true : undefined,
        onlyMine: tab === 'mine' ? true : undefined,
      })
      setAssets(items)
      if (items.length === 0) {
        setError('Nenhuma imagem encontrada para os filtros aplicados.')
      }
    } catch {
      setError('Não foi possível carregar o banco de imagens. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadAssets(selectedCat, sourceTab, search)
    } else {
      setSelectedImage(null)
      setError(null)
    }
  }, [open, selectedCat, sourceTab])

  const handleSearch = () => {
    loadAssets(selectedCat, sourceTab, search)
  }

  const handleCategorySelect = (catId: string) => {
    setSelectedCat(catId)
    loadAssets(catId, sourceTab, search)
  }

  const handleTabChange = (tab: 'all' | 'curated' | 'mine') => {
    setSourceTab(tab)
    loadAssets(selectedCat, tab, search)
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
    if (onSelect) {
      onSelect(url)
    } else if (onSelectImage) {
      onSelectImage(url)
    } else {
      navigate('/app/content/new', { state: { mediaUrl: url } })
    }
    onOpenChange(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const file = files[0]

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo suportado é de 10 MB.',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    try {
      const created = await uploadImageBankAsset(file, {
        name: file.name.replace(/\.[^/.]+$/, ''),
        category: selectedCat !== 'todas' ? selectedCat : 'geral',
        tags: ['upload', 'usuario', selectedCat],
      })
      toast({
        title: 'Upload concluído!',
        description: `"${created.name}" adicionada ao seu banco privado.`,
      })
      // Selecionar aba 'mine' e recarregar
      setSourceTab('mine')
      loadAssets(selectedCat, 'mine', search)
    } catch {
      toast({
        title: 'Erro no upload',
        description: 'Falha ao salvar a imagem no banco. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-6 gap-4 bg-card border-border rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <ImageIcon className="w-4 h-4" />
              </div>
              Banco de Imagens Interno
            </DialogTitle>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground bg-purple-50/80 dark:bg-purple-950/30 px-2.5 py-1 rounded-full border border-purple-200/50 dark:border-purple-900/40">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Plano Max: Ilimitado</span>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Acervo interno curado de alta qualidade e seus próprios uploads salvos com segurança no
            PocketBase. Escolha uma imagem como fundo ou base da sua publicação.
          </DialogDescription>
        </DialogHeader>

        {/* Linha de Busca, Tabs de Origem e Upload */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, tag ou nicho (ex: negócios, tech, café)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 h-10 text-xs bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 h-10 px-4 rounded-xl"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Buscar
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs gap-1.5 h-10 px-3.5 rounded-xl border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                title="Fazer upload de imagem do seu computador"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                ) : (
                  <UploadCloud className="w-4 h-4 text-purple-600" />
                )}
                <span>Enviar imagem</span>
              </Button>
            </div>
          </div>

          {/* Abas: Todas, Curadas da Plataforma, Meus Uploads */}
          <div className="flex items-center justify-between border-b border-border pb-2 gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleTabChange('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  sourceTab === 'all'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Todas ({assets.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('curated')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  sourceTab === 'curated'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  Curadas (Social 2)
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('mine')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  sourceTab === 'mine'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <FolderLock className="w-3.5 h-3.5" />
                  Meus Uploads
                </span>
              </button>
            </div>

            <span className="text-[11px] text-muted-foreground hidden md:inline">
              Formatos suportados: PNG, JPG, WebP, SVG
            </span>
          </div>

          {/* Chips de Categorias */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                type="button"
                variant={selectedCat === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategorySelect(cat.id)}
                className={`rounded-full text-[11px] h-7 shrink-0 px-3 ${
                  selectedCat === cat.id
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Grade de Imagens */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-[340px]">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full py-12 space-y-3 text-center">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
              <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCat('todas')
                  setSourceTab('all')
                  setSearch('')
                  loadAssets('todas', 'all', '')
                }}
                className="text-xs rounded-xl"
              >
                Limpar filtros e recarregar
              </Button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-full py-16 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="text-xs text-muted-foreground">Carregando acervo...</span>
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 space-y-3 text-center">
              <ImageIcon className="w-10 h-10 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Nenhuma imagem disponível nesta seleção.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {assets.map((asset) => {
                const imgUrl = getAssetUrl(asset)
                const isCopied = copiedUrl === imgUrl
                const isSelected = selectedImage === imgUrl

                return (
                  <div
                    key={asset.id}
                    className={`group relative rounded-2xl overflow-hidden border-2 bg-card shadow-xs hover:shadow-md transition-all duration-200 flex flex-col ${
                      isSelected
                        ? 'border-purple-600 ring-2 ring-purple-600/30'
                        : 'border-border/80 hover:border-purple-500/50'
                    }`}
                  >
                    <div
                      className="aspect-square bg-muted/60 relative overflow-hidden cursor-pointer"
                      onClick={() => setSelectedImage(isSelected ? null : imgUrl)}
                    >
                      <img
                        src={imgUrl}
                        alt={asset.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-purple-600/25 flex items-center justify-center backdrop-blur-2xs">
                          <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md animate-in zoom-in-75">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex items-center gap-1 flex-wrap">
                        {asset.is_curated ? (
                          <Badge className="bg-purple-900/80 backdrop-blur-md text-[10px] text-white border-0 shadow-xs flex items-center gap-1 py-0 px-1.5">
                            <Sparkles className="w-2.5 h-2.5 text-purple-300" /> Curada
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-900/80 backdrop-blur-md text-[10px] text-white border-0 shadow-xs py-0 px-1.5">
                            Meu Upload
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 flex flex-col justify-between flex-1 gap-2">
                      <div>
                        <p className="text-xs font-semibold line-clamp-1 text-foreground">
                          {asset.name}
                        </p>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {asset.category.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                          title="Copiar Link"
                          onClick={() => handleCopy(imgUrl)}
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUseImage(imgUrl)}
                          className="text-[11px] h-7 px-2.5 bg-purple-600 hover:bg-purple-700 text-white gap-1 flex-1 rounded-lg"
                        >
                          <PenTool className="w-3 h-3" /> Aplicar
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Rodapé de Aplicação Direta */}
        {selectedImage && (
          <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/50 animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg overflow-hidden border border-purple-300 dark:border-purple-800 shrink-0">
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-foreground font-medium">
                Imagem selecionada. Pronto para aplicar como fundo da arte.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleUseImage(selectedImage)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 rounded-xl shadow-xs"
            >
              <PenTool className="w-3.5 h-3.5" /> Usar Imagem
            </Button>
          </div>
        )}

        <div className="text-center pt-1 border-t border-border/40">
          <span className="text-[10px] text-muted-foreground">
            Social 2 Powered by BestContent AI · Banco de Imagens Interno
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
