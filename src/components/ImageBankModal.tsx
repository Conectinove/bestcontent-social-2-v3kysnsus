import { useState, useEffect, useRef, useMemo } from 'react'
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
  Star,
  Trash2,
  Dumbbell,
  Plane,
  Building2,
  TrendingUp,
  Heart,
  Dog,
  UtensilsCrossed,
  Trophy,
  PartyPopper,
  Briefcase,
  GraduationCap,
  Cpu,
  Smile,
  Shirt,
  Sparkle,
  LayoutGrid,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
  ImageBankAsset,
  getImageBankAssets,
  uploadImageBankAsset,
  deleteImageBankAsset,
  toggleImageBankFavorite,
  getAssetUrl,
} from '@/services/image-bank'

interface ImageBankModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectImage?: (url: string) => void
  onSelect?: (url: string) => void
}

interface CategoryOption {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const CATEGORIES: CategoryOption[] = [
  { id: 'todas', label: 'Todas', icon: LayoutGrid },
  { id: 'negocios', label: 'Negócios', icon: Briefcase },
  { id: 'educacao', label: 'Educação', icon: GraduationCap },
  { id: 'alimentacao', label: 'Alimentação', icon: UtensilsCrossed },
  { id: 'tecnologia', label: 'Tecnologia', icon: Cpu },
  { id: 'estilo_de_vida', label: 'Estilo de Vida', icon: Smile },
  { id: 'saude', label: 'Saúde', icon: Heart },
  { id: 'moda', label: 'Moda', icon: Shirt },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'viagem', label: 'Viagem', icon: Plane },
  { id: 'imoveis', label: 'Imóveis', icon: Building2 },
  { id: 'financas', label: 'Finanças', icon: TrendingUp },
  { id: 'beleza', label: 'Beleza', icon: Sparkle },
  { id: 'pets', label: 'Pets', icon: Dog },
  { id: 'gastronomia', label: 'Gastronomia', icon: UtensilsCrossed },
  { id: 'esportes', label: 'Esportes', icon: Trophy },
  { id: 'eventos', label: 'Eventos', icon: PartyPopper },
  { id: 'geral', label: 'Geral', icon: Layers },
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
  const [allAssets, setAllAssets] = useState<ImageBankAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [selectedCat, setSelectedCat] = useState('todas')
  const [sourceTab, setSourceTab] = useState<'all' | 'curated' | 'mine' | 'favorites'>('all')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(16)

  const loadAssets = async (cat = selectedCat, tab = sourceTab, searchQuery = search) => {
    setLoading(true)
    setError(null)
    try {
      const items = await getImageBankAssets({
        category: cat !== 'todas' ? cat : undefined,
        search: searchQuery.trim() || undefined,
        onlyCurated: tab === 'curated' ? true : undefined,
        onlyMine: tab === 'mine' ? true : undefined,
        onlyFavorites: tab === 'favorites' ? true : undefined,
      })
      setAllAssets(items)
      setVisibleCount(16)
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
      setConfirmDeleteId(null)
    }
  }, [open, selectedCat, sourceTab])

  // Contadores por categoria para os chips
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { todas: allAssets.length }
    for (const a of allAssets) {
      counts[a.category] = (counts[a.category] || 0) + 1
    }
    return counts
  }, [allAssets])

  const handleSearch = () => {
    loadAssets(selectedCat, sourceTab, search)
  }

  const handleCategorySelect = (catId: string) => {
    setSelectedCat(catId)
    loadAssets(catId, sourceTab, search)
  }

  const handleTabChange = (tab: 'all' | 'curated' | 'mine' | 'favorites') => {
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

  const handleToggleFavorite = async (e: React.MouseEvent, asset: ImageBankAsset) => {
    e.stopPropagation()
    const current = Boolean(asset.is_favorite)
    try {
      const updated = await toggleImageBankFavorite(asset.id, current)
      setAllAssets((prev) =>
        prev.map((item) => (item.id === asset.id ? { ...item, is_favorite: updated } : item)),
      )
      toast({
        title: updated ? 'Adicionada aos favoritos' : 'Removida dos favoritos',
        description: `"${asset.name}" agora ${updated ? 'está' : 'não está mais'} nos seus favoritos.`,
      })
    } catch {
      toast({
        title: 'Erro ao favoritar',
        description: 'Não foi possível atualizar o favorito.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteUpload = async (e: React.MouseEvent, asset: ImageBankAsset) => {
    e.stopPropagation()
    if (confirmDeleteId !== asset.id) {
      setConfirmDeleteId(asset.id)
      return
    }

    setDeletingId(asset.id)
    try {
      await deleteImageBankAsset(asset.id)
      setAllAssets((prev) => prev.filter((item) => item.id !== asset.id))
      setConfirmDeleteId(null)
      toast({
        title: 'Upload excluído',
        description: `"${asset.name}" foi removida do seu acervo com sucesso.`,
      })
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir esta imagem. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
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
        category: (selectedCat !== 'todas' ? selectedCat : 'geral') as any,
        tags: ['upload', 'usuario', selectedCat],
      })
      toast({
        title: 'Upload concluído!',
        description: `"${created.name}" adicionada ao seu banco privado.`,
      })
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

  const displayedAssets = allAssets.slice(0, visibleCount)
  const hasMore = visibleCount < allAssets.length

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
              <span>Acervo Curado & Ilimitado</span>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Acervo interno curado de alta qualidade sem APIs externas pagas, com novos nichos e seus
            próprios uploads no PocketBase. Escolha uma arte como fundo ou base da sua publicação.
          </DialogDescription>
        </DialogHeader>

        {/* Linha de Busca, Tabs de Origem e Upload */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, nicho ou tag (ex: fitness, pets, finanças, imóvel)..."
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

          {/* Abas: Todas, Curadas, Meus Uploads, Favoritas */}
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
                  Todas ({allAssets.length})
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
                  Curadas
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
              <button
                type="button"
                onClick={() => handleTabChange('favorites')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  sourceTab === 'favorites'
                    ? 'bg-card text-amber-500 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Favoritas
                </span>
              </button>
            </div>

            <span className="text-[11px] text-muted-foreground hidden md:inline">
              Formatos suportados: PNG, JPG, WebP, SVG
            </span>
          </div>

          {/* Chips de Categorias com Ícones e Contadores */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const count = categoryCounts[cat.id]
              return (
                <Button
                  key={cat.id}
                  type="button"
                  variant={selectedCat === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`rounded-full text-[11px] h-7 shrink-0 px-3 gap-1.5 ${
                    selectedCat === cat.id
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{cat.label}</span>
                  {typeof count === 'number' && count > 0 && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                        selectedCat === cat.id
                          ? 'bg-purple-700/80 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Grade de Imagens com Scroll e Paginação Dinâmica */}
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
              <span className="text-xs text-muted-foreground">Carregando acervo expandido...</span>
            </div>
          ) : displayedAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 space-y-3 text-center">
              <ImageIcon className="w-10 h-10 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Nenhuma imagem disponível nesta seleção.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {displayedAssets.map((asset) => {
                  const imgUrl = getAssetUrl(asset)
                  const isCopied = copiedUrl === imgUrl
                  const isSelected = selectedImage === imgUrl
                  const isFav = Boolean(asset.is_favorite)
                  const isConfirmingDelete = confirmDeleteId === asset.id

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

                        {/* Botão de Favoritar no topo direito */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(e, asset)}
                          title={isFav ? 'Remover dos favoritos' : 'Favoritar imagem'}
                          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-colors ${
                            isFav
                              ? 'bg-amber-500/90 text-white shadow-xs'
                              : 'bg-black/40 text-white/80 hover:text-amber-400 hover:bg-black/60 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-white' : ''}`} />
                        </button>
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

                          {/* Excluir upload próprio */}
                          {!asset.is_curated && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deletingId === asset.id}
                              className={`h-7 w-7 rounded-lg transition-colors ${
                                isConfirmingDelete
                                  ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                                  : 'text-muted-foreground hover:text-red-500'
                              }`}
                              title={
                                isConfirmingDelete
                                  ? 'Clique novamente para confirmar a exclusão'
                                  : 'Excluir este upload'
                              }
                              onClick={(e) => handleDeleteUpload(e, asset)}
                            >
                              {deletingId === asset.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          )}

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

              {/* Botão carregar mais */}
              {hasMore && (
                <div className="text-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleCount((prev) => prev + 16)}
                    className="text-xs rounded-xl px-4 border-purple-200 dark:border-purple-900"
                  >
                    Carregar mais imagens ({allAssets.length - visibleCount} restantes)
                  </Button>
                </div>
              )}
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
