import React, { useState, useMemo } from 'react'
import {
  Sparkles,
  Download,
  Share2,
  Heart,
  Copy,
  ExternalLink,
  Layers,
  Palette,
  Check,
  Filter,
  Image as ImageIcon,
  Smartphone,
  Square,
  Monitor,
  FileText,
  Shirt,
  BookOpen,
  Presentation,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSocial } from '@/context/SocialContext'
import { toast } from '@/hooks/use-toast'
import { MudarCursoLogoKit } from '@/components/brandkit/MudarCursoLogoKit'
import { EditorAdvancedMediaDialog } from '@/components/editor/EditorAdvancedMediaDialog'
import { dataUrlToFile } from '@/lib/advanced-media'
import { getImageUrlErrorMessage } from '@/lib/image-upload'
import { uploadImageBankAsset } from '@/services/image-bank'

export interface BrandAsset {
  id: string
  title: string
  category:
    | 'social'
    | 'stories'
    | 'apresentacao'
    | 'camiseta'
    | 'caderno'
    | 'banner'
    | 'og'
    | 'wallpaper'
  categoryLabel: string
  aspectRatio: '9:16' | '1:1' | '16:9' | '4:5'
  ratioLabel: string
  imageUrl: string
  downloadOptions: {
    thumb: string
    social: string
    banner: string
    original: string
  }
  headline: string
  subhead?: string
  accentColor?: string
  isFavorite?: boolean
}

export function BrandKitPage() {
  const { currentBrand, brands } = useSocial()
  const activeBrandName = currentBrand?.name || 'MudarCurso'
  const activeBrandColor = currentBrand?.color_theme || '#7C3AED'

  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<BrandAsset | null>(null)
  // Asset aberto no motor de Edição Avançada (Studio) e estado de gravação da edição
  const [advancedAsset, setAdvancedAsset] = useState<BrandAsset | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  // Assets da identidade visual inspirados na referência visual MudarCurso
  // Fotografia com iluminação violeta elétrica, proporções 9:16, 1:1, 16:9
  const baseAssets: BrandAsset[] = useMemo(
    () => [
      {
        id: 'asset-1',
        title: 'Luz Violeta & Decisão de Carreira',
        category: 'social',
        categoryLabel: 'Redes Sociais',
        aspectRatio: '9:16',
        ratioLabel: '9:16 · REELS / SHORTS',
        imageUrl:
          'https://img.usecurling.com/p/1080/1920?q=woman%20laptop%20purple%20glow&color=purple',
        downloadOptions: {
          thumb:
            'https://img.usecurling.com/p/320/568?q=woman%20laptop%20purple%20glow&color=purple',
          social:
            'https://img.usecurling.com/p/1080/1920?q=woman%20laptop%20purple%20glow&color=purple',
          banner:
            'https://img.usecurling.com/p/1920/1080?q=woman%20laptop%20purple%20glow&color=purple',
          original:
            'https://img.usecurling.com/p/1080/1920?q=woman%20laptop%20purple%20glow&color=purple',
        },
        headline: 'MUDAR É O VERBO. ASSUMA A SUA ROTA.',
        subhead: 'Como virar a chave da sua carreira criativa em menos de 90 dias',
        accentColor: '#5B1FE0',
      },
      {
        id: 'asset-2',
        title: 'Retrato Carreira & Alta Performance',
        category: 'social',
        categoryLabel: 'Redes Sociais',
        aspectRatio: '1:1',
        ratioLabel: '1:1 · FEED',
        imageUrl:
          'https://img.usecurling.com/p/1080/1080?q=smiling%20woman%20laptop%20purple%20studio&color=purple',
        downloadOptions: {
          thumb:
            'https://img.usecurling.com/p/400/400?q=smiling%20woman%20laptop%20purple%20studio&color=purple',
          social:
            'https://img.usecurling.com/p/1080/1080?q=smiling%20woman%20laptop%20purple%20studio&color=purple',
          banner:
            'https://img.usecurling.com/p/1920/1080?q=smiling%20woman%20laptop%20purple%20studio&color=purple',
          original:
            'https://img.usecurling.com/p/1080/1080?q=smiling%20woman%20laptop%20purple%20studio&color=purple',
        },
        headline: 'SEU SUCESSO PEDE PASSAGEM',
        subhead: 'O próximo passo profissional começa com clareza e ferramentas certas',
        accentColor: '#6D28D9',
      },
      {
        id: 'asset-3',
        title: 'Manifesto Neon Stories',
        category: 'stories',
        categoryLabel: 'Stories',
        aspectRatio: '9:16',
        ratioLabel: '9:16 · STORIES',
        imageUrl:
          'https://img.usecurling.com/p/1080/1920?q=neon%20violet%20typography%20manifesto&color=purple',
        downloadOptions: {
          thumb:
            'https://img.usecurling.com/p/320/568?q=neon%20violet%20typography%20manifesto&color=purple',
          social:
            'https://img.usecurling.com/p/1080/1920?q=neon%20violet%20typography%20manifesto&color=purple',
          banner:
            'https://img.usecurling.com/p/1920/1080?q=neon%20violet%20typography%20manifesto&color=purple',
          original:
            'https://img.usecurling.com/p/1080/1920?q=neon%20violet%20typography%20manifesto&color=purple',
        },
        headline: 'MUDAR DE CURSO É POSSÍVEL.',
        subhead: 'Troque a inércia por clareza profissional radical.',
        accentColor: '#C44BFF',
      },
      {
        id: 'asset-4',
        title: 'Hero Banner Institucional 16:9',
        category: 'banner',
        categoryLabel: 'Banner',
        aspectRatio: '16:9',
        ratioLabel: '16:9 · BANNER & HERO',
        imageUrl:
          'https://img.usecurling.com/p/1920/1080?q=futuristic%20violet%20dark%20technology%20banner&color=purple',
        downloadOptions: {
          thumb:
            'https://img.usecurling.com/p/640/360?q=futuristic%20violet%20dark%20technology%20banner&color=purple',
          social:
            'https://img.usecurling.com/p/1200/675?q=futuristic%20violet%20dark%20technology%20banner&color=purple',
          banner:
            'https://img.usecurling.com/p/1920/1080?q=futuristic%20violet%20dark%20technology%20banner&color=purple',
          original:
            'https://img.usecurling.com/p/1920/1080?q=futuristic%20violet%20dark%20technology%20banner&color=purple',
        },
        headline: 'PLATAFORMA QUE MUDA SUA ROTA.',
        subhead: '15+ setores criativos · 200+ trilhas de formação',
        accentColor: '#5B1FE0',
      },
      {
        id: 'asset-5',
        title: 'Slide Deck Master — Pitch & Apresentação',
        category: 'apresentacao',
        categoryLabel: 'Apresentação',
        aspectRatio: '16:9',
        ratioLabel: '16:9 · SLIDE MASTER',
        imageUrl:
          'https://img.usecurling.com/p/1920/1080?q=keynote%20presentation%20slide%20violet%20dark&color=purple',
        downloadOptions: {
          thumb:
            'https://img.usecurling.com/p/640/360?q=keynote%20presentation%20slide%20violet%20dark&color=purple',
          social:
            'https://img.usecurling.com/p/1200/675?q=keynote%20presentation%20slide%20violet%20dark&color=purple',
          banner:
            'https://img.usecurling.com/p/1920/1080?q=keynote%20presentation%20slide%20violet%20dark&color=purple',
          original:
            'https://img.usecurling.com/p/1920/1080?q=keynote%20presentation%20slide%20violet%20dark&color=purple',
        },
        headline: 'SISTEMA DE IDENTIDADE EM MOVIMENTO',
        subhead: 'Consistência visual em cada ponto de contato da marca',
        accentColor: '#7C3AED',
      },
      {
        id: 'asset-6',
        title: 'Open Graph / Compartilhamento de Link',
        category: 'og',
        categoryLabel: 'OG Image',
        aspectRatio: '16:9',
        ratioLabel: '1200x630 · SOCIAL SHARE',
        imageUrl:
          'https://img.usecurling.com/p/1200/630?q=creative%20branding%20dark%20violet%20share&color=purple',
        downloadOptions: {
          thumb:
            'https://img.usecurling.com/p/600/315?q=creative%20branding%20dark%20violet%20share&color=purple',
          social:
            'https://img.usecurling.com/p/1200/630?q=creative%20branding%20dark%20violet%20share&color=purple',
          banner:
            'https://img.usecurling.com/p/1200/630?q=creative%20branding%20dark%20violet%20share&color=purple',
          original:
            'https://img.usecurling.com/p/1200/630?q=creative%20branding%20dark%20violet%20share&color=purple',
        },
        headline: 'VISUAL IDENTITY SYSTEM & EDUCAÇÃO',
        subhead: 'Curadoria técnica da identidade da marca ativa',
        accentColor: '#C44BFF',
      },
      {
        id: 'asset-7',
        title: 'Mockup Camiseta Oficial Violet Pulse',
        category: 'camiseta',
        categoryLabel: 'Camiseta',
        aspectRatio: '1:1',
        ratioLabel: '1:1 · MOCKUP',
        imageUrl:
          'https://img.usecurling.com/p/1080/1080?q=black%20tshirt%20purple%20neon%20logo%20mockup&color=purple',
        downloadOptions: {
          thumb:
            'https://img.usecurling.com/p/400/400?q=black%20tshirt%20purple%20neon%20logo%20mockup&color=purple',
          social:
            'https://img.usecurling.com/p/1080/1080?q=black%20tshirt%20purple%20neon%20logo%20mockup&color=purple',
          banner:
            'https://img.usecurling.com/p/1920/1080?q=black%20tshirt%20purple%20neon%20logo%20mockup&color=purple',
          original:
            'https://img.usecurling.com/p/1080/1080?q=black%20tshirt%20purple%20neon%20logo%20mockup&color=purple',
        },
        headline: 'CAMISETA STAFF & COMUNIDADE',
        subhead: 'Aplicação do logo em transfer elétrico no peito',
        accentColor: '#5B1FE0',
      },
      {
        id: 'asset-8',
        title: 'Caderno de Bordo & Papelaria',
        category: 'caderno',
        categoryLabel: 'Caderno',
        aspectRatio: '1:1',
        ratioLabel: '1:1 · PAPELARIA',
        imageUrl:
          'https://img.usecurling.com/p/1080/1080?q=notebook%20pen%20dark%20purple%20desk&color=purple',
        downloadOptions: {
          thumb:
            'https://img.usecurling.com/p/400/400?q=notebook%20pen%20dark%20purple%20desk&color=purple',
          social:
            'https://img.usecurling.com/p/1080/1080?q=notebook%20pen%20dark%20purple%20desk&color=purple',
          banner:
            'https://img.usecurling.com/p/1920/1080?q=notebook%20pen%20dark%20purple%20desk&color=purple',
          original:
            'https://img.usecurling.com/p/1080/1080?q=notebook%20pen%20dark%20purple%20desk&color=purple',
        },
        headline: 'CADERNO DE ROTA PROFISSIONAL',
        subhead: 'Capa rígida em acabamento soft touch violeta profundo',
        accentColor: '#1E1B4B',
      },
    ],
    [],
  )

  const categories = [
    { id: 'all', label: 'Tudo', count: baseAssets.length, icon: Layers },
    {
      id: 'favorites',
      label: 'Favoritos',
      count: Object.values(favorites).filter(Boolean).length,
      icon: Heart,
    },
    {
      id: 'social',
      label: 'Redes Sociais',
      count: baseAssets.filter((a) => a.category === 'social').length,
      icon: Smartphone,
    },
    {
      id: 'stories',
      label: 'Stories',
      count: baseAssets.filter((a) => a.category === 'stories').length,
      icon: Smartphone,
    },
    {
      id: 'apresentacao',
      label: 'Apresentação',
      count: baseAssets.filter((a) => a.category === 'apresentacao').length,
      icon: Presentation,
    },
    {
      id: 'camiseta',
      label: 'Camiseta',
      count: baseAssets.filter((a) => a.category === 'camiseta').length,
      icon: Shirt,
    },
    {
      id: 'caderno',
      label: 'Caderno',
      count: baseAssets.filter((a) => a.category === 'caderno').length,
      icon: BookOpen,
    },
    {
      id: 'banner',
      label: 'Banner',
      count: baseAssets.filter((a) => a.category === 'banner').length,
      icon: Monitor,
    },
    {
      id: 'og',
      label: 'OG Image',
      count: baseAssets.filter((a) => a.category === 'og').length,
      icon: FileText,
    },
  ]

  const filteredAssets = useMemo(() => {
    return baseAssets.filter((asset) => {
      if (activeCategory === 'favorites') {
        if (!favorites[asset.id]) return false
      } else if (activeCategory !== 'all' && asset.category !== activeCategory) {
        return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          asset.title.toLowerCase().includes(q) ||
          asset.headline.toLowerCase().includes(q) ||
          asset.categoryLabel.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [baseAssets, activeCategory, favorites, searchQuery])

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      toast({
        title: next[id] ? 'Adicionado aos favoritos' : 'Removido dos favoritos',
        description: 'Asset atualizado no seu Brand Kit.',
      })
      return next
    })
  }

  const handleDownload = (
    asset: BrandAsset,
    format: 'thumb' | 'social' | 'banner' | 'original',
  ) => {
    const url = asset.downloadOptions[format]
    window.open(url, '_blank')
    toast({
      title: 'Download iniciado',
      description: `Baixando asset "${asset.title}" no formato ${format.toUpperCase()}.`,
    })
  }

  const handleCopyLink = (asset: BrandAsset) => {
    navigator.clipboard.writeText(asset.imageUrl)
    setCopiedId(asset.id)
    toast({
      title: 'Link copiado!',
      description: 'URL do asset em alta resolução copiada para a área de transferência.',
    })
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleShare = async (asset: BrandAsset) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${activeBrandName} — ${asset.title}`,
          text: asset.headline,
          url: asset.imageUrl,
        })
      } catch {
        /* intentionally ignored */
      }
    } else {
      handleCopyLink(asset)
    }
  }

  const handleDownloadFullKit = () => {
    toast({
      title: 'Compilando Kit Completo',
      description: `Baixando todos os ${baseAssets.length} assets de identidade visual da marca ${activeBrandName}.`,
    })
    // Abre o primeiro como demonstração
    if (baseAssets[0]) {
      window.open(baseAssets[0].imageUrl, '_blank')
    }
  }

  /** Grava a mídia editada (data:→PNG) no acervo de imagens, vinculada à marca ativa. */
  const handleAdvancedSave = async (asset: BrandAsset, resultUrl: string) => {
    setAdvancedAsset(null)
    setSavingEdit(true)
    try {
      let file: File | null = null
      if (resultUrl.startsWith('data:')) {
        file = dataUrlToFile(resultUrl, `${asset.id}-editada.png`)
      } else {
        const blob = await fetch(resultUrl).then((r) => r.blob())
        file = new File([blob], `${asset.id}-editada.png`, { type: blob.type || 'image/png' })
      }
      if (!file) throw new Error('Não foi possível ler a mídia editada.')
      await uploadImageBankAsset(file, {
        name: `${asset.title} (editada)`,
        category: 'geral',
        tags: ['brand_kit', 'edicao_avancada'],
        brand: currentBrand?.id,
      })
      toast({
        title: 'Edição salva!',
        description: 'A versão editada foi gravada no acervo da marca.',
      })
    } catch (err) {
      toast({
        title: 'Erro ao salvar a edição',
        description: getImageUrlErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="space-y-12 pb-20">
      {/* SEÇÃO PRINCIPAL NO TOPO: LOGO KIT COMPLETO DA MUDARCURSO */}
      <MudarCursoLogoKit />

      {/* SEÇÃO SECUNDÁRIA: ACERVO VISUAL & MODELOS DE POST EXISTENTES */}
      <div className="pt-8 border-t border-border/80 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-foreground">
              Acervo de Aplicações & Modelos de Post
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fotografia, mockups e diretrizes de layout mantendo a identidade visual do portal
              MudarCurso em cada superfície.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono border-primary/40 text-primary">
            {baseAssets.length} Assets Curados
          </Badge>
        </div>

        {/* HEADER HERO ESTILO MUDARCURSO */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-card to-primary/5 text-foreground p-6 sm:p-10 border border-primary/30 shadow-2xl">
          {/* Glow de fundo */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-3xl pointer-events-none rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/30 blur-3xl pointer-events-none rounded-full" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground font-extrabold tracking-wide uppercase px-3 py-1 border-0">
                  Visual Identity System
                </Badge>
                <Badge
                  variant="outline"
                  className="border-primary/40 text-muted-foreground text-xs max-w-[16rem] truncate"
                >
                  {activeBrandName}
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Visual Identity <span className="italic text-primary">System</span>
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Curadoria técnica da identidade{' '}
                <strong className="text-foreground">{activeBrandName}</strong> em diferentes
                superfícies — a cor primária do tema mantém a consistência em cada ponto de contato.
              </p>

              <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-primary" />
                  Paleta Ativa: {activeBrandColor}
                </span>
                <span>•</span>
                <span>{baseAssets.length} Assets Curados</span>
                <span>•</span>
                <span className="text-primary font-semibold">● Sincronizado</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <Button
                onClick={handleDownloadFullKit}
                className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm shadow-lg gap-2 uppercase tracking-wider"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Kit Completo ↓</span>
              </Button>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground justify-center">
                <span>Proporções: 9:16 · 1:1 · 16:9 · 4:5</span>
              </div>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTROS & BUSCA */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Buscar peça por título, formato ou objetivo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-4 pr-10 rounded-2xl bg-card border-border/70 text-sm shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="w-3.5 h-3.5 text-primary" />
              <span>
                Exibindo <strong>{filteredAssets.length}</strong> de {baseAssets.length} assets
              </span>
            </div>
          </div>

          {/* CHIPS DE CATEGORIA ESTILO MUDARCURSO */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.id
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-background/80 text-muted-foreground'
                    }`}
                  >
                    {String(cat.count).padStart(2, '0')}
                  </span>
                </button>
              )
            })}
            {activeCategory !== 'all' && (
              <button
                onClick={() => {
                  setActiveCategory('all')
                  setSearchQuery('')
                }}
                className="text-xs text-primary hover:underline px-2 shrink-0 font-semibold"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* GRID DE ASSETS ESTILO MUDARCURSO */}
        {filteredAssets.length === 0 ? (
          <Card className="p-12 text-center rounded-3xl border-dashed border-border/80 space-y-3">
            <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="font-bold text-foreground">Nenhum asset encontrado</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Não encontramos peças com os filtros selecionados. Tente limpar os filtros para ver
              todo o acervo.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setActiveCategory('all')
                setSearchQuery('')
              }}
              className="rounded-xl text-xs"
            >
              Ver Todos os Assets
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => {
              const isFav = Boolean(favorites[asset.id])
              const isCopied = copiedId === asset.id
              const isReels = asset.aspectRatio === '9:16'
              const isBanner = asset.aspectRatio === '16:9'

              return (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className="group relative rounded-3xl overflow-hidden bg-card border border-border/70 hover:border-primary/50 hover:shadow-2xl transition-all cursor-pointer flex flex-col justify-between"
                >
                  {/* Visual Preview com Overlay Violeta e Badge de Proporção */}
                  <div
                    className={`relative w-full overflow-hidden bg-muted ${
                      isReels ? 'aspect-[9/16]' : isBanner ? 'aspect-[16/9]' : 'aspect-square'
                    }`}
                  >
                    <img
                      src={asset.imageUrl}
                      alt={asset.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient Overlay Roxo no Rodapé */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                    {/* Botão de Favorito no Canto Superior Direito */}
                    <button
                      onClick={(e) => toggleFavorite(asset.id, e)}
                      className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:scale-110 transition-transform"
                      aria-label="Favoritar asset"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFav ? 'fill-rose-500 text-rose-500' : 'text-white/80'
                        }`}
                      />
                    </button>

                    {/* Marca da Marca no Canto Inferior Esquerdo */}
                    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-black tracking-wider uppercase text-white">
                        {activeBrandName}
                      </span>
                    </div>

                    {/* Proporção no Canto Inferior Direito */}
                    <div className="absolute bottom-4 right-4 z-20">
                      <Badge className="bg-black/70 backdrop-blur-md border border-white/10 text-white font-mono text-[9px]">
                        {asset.ratioLabel}
                      </Badge>
                    </div>
                  </div>

                  {/* Bloco de Informações & Ações Rápidas */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold text-primary border-primary/30"
                        >
                          {asset.categoryLabel}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {asset.aspectRatio}
                        </span>
                      </div>

                      <h3 className="font-bold text-foreground text-sm line-clamp-2 break-words group-hover:text-primary transition-colors">
                        {asset.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {asset.headline}
                      </p>
                    </div>

                    {/* Ações de Download e Compartilhamento */}
                    <div className="space-y-2 pt-2 border-t border-border/60">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(asset, 'original')
                          }}
                          className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs gap-1.5 shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Baixar Original</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopyLink(asset)
                          }}
                          className="h-9 px-2.5 rounded-xl border-border/80 text-foreground hover:bg-muted text-xs"
                          title="Copiar Link"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleShare(asset)
                          }}
                          className="h-9 px-2.5 rounded-xl border-border/80 text-foreground hover:bg-muted text-xs"
                          title="Compartilhar"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Edição Avançada: abre o motor do Studio sobre esta imagem */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setAdvancedAsset(asset)
                        }}
                        disabled={savingEdit}
                        className="w-full h-9 rounded-xl border-primary/40 text-primary hover:bg-primary/10 text-xs font-semibold gap-1.5"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Edição Avançada</span>
                      </Button>

                      {/* Variações de Tamanho */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                        <span>Variações:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(asset, 'thumb')
                            }}
                            className="hover:text-primary underline font-medium"
                          >
                            Thumb
                          </button>
                          <span>·</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(asset, 'social')
                            }}
                            className="hover:text-primary underline font-medium"
                          >
                            Social
                          </button>
                          <span>·</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(asset, 'banner')
                            }}
                            className="hover:text-primary underline font-medium"
                          >
                            Banner
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Fechamento da seção secundária */}
      </div>

      {/* EDIÇÃO AVANÇADA: motor do Studio (mesmo usado no editor de posts e na marca) */}
      {advancedAsset && (
        <EditorAdvancedMediaDialog
          open
          onOpenChange={(o) => {
            if (!o) setAdvancedAsset(null)
          }}
          mediaUrl={advancedAsset.imageUrl}
          title={advancedAsset.title}
          onSave={(url) => handleAdvancedSave(advancedAsset, url)}
        />
      )}

      {/* MODAL DETALHE DO ASSET (INSPIRADO NA REFERÊNCIA DO LOVABLE) */}
      {selectedAsset && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-card border border-primary/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge className="bg-primary text-primary-foreground text-xs font-bold uppercase mb-2">
                  {selectedAsset.categoryLabel} · {selectedAsset.aspectRatio}
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black text-foreground break-words">
                  {selectedAsset.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">{selectedAsset.headline}</p>
              </div>

              <button
                onClick={() => setSelectedAsset(null)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Imagem em destaque */}
            <div className="relative rounded-2xl overflow-hidden bg-black/60 max-h-[420px] flex items-center justify-center">
              <img
                src={selectedAsset.imageUrl}
                alt={selectedAsset.title}
                className="max-h-[400px] w-auto object-contain rounded-xl"
              />
            </div>

            {/* Opções de download rápido no estilo Lovable */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold text-primary text-center uppercase tracking-wider">
                Baixar Asset
              </p>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(selectedAsset, 'thumb')}
                  className="rounded-xl text-xs font-semibold"
                >
                  Thumb
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(selectedAsset, 'social')}
                  className="rounded-xl text-xs font-semibold"
                >
                  Social
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(selectedAsset, 'banner')}
                  className="rounded-xl text-xs font-semibold"
                >
                  Banner
                </Button>
              </div>

              <Button
                onClick={() => handleDownload(selectedAsset, 'original')}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-extrabold text-sm uppercase tracking-wider shadow-lg"
              >
                Original em Alta Resolução
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const asset = selectedAsset
                  setSelectedAsset(null)
                  setAdvancedAsset(asset)
                }}
                className="w-full rounded-2xl border-primary/40 text-primary hover:bg-primary/10 font-semibold text-sm gap-2"
              >
                <Wand2 className="w-4 h-4" />
                <span>Edição Avançada</span>
              </Button>

              <div className="flex items-center justify-center gap-6 pt-3 text-xs text-muted-foreground">
                <button
                  onClick={() => handleCopyLink(selectedAsset)}
                  className="hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link</span>
                </button>
                <span>·</span>
                <button
                  onClick={() => handleShare(selectedAsset)}
                  className="hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartilhar</span>
                </button>
                <span>·</span>
                <a
                  href={selectedAsset.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Janela</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
