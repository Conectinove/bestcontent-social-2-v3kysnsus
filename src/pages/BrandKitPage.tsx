import React, { useEffect, useState, useMemo } from 'react'
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
  Monitor,
  FileText,
  Shirt,
  BookOpen,
  Presentation,
  Wand2,
  CheckSquare,
  Square,
  Loader2,
  PackageOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSocial } from '@/context/SocialContext'
import { toast } from '@/hooks/use-toast'
import { MudarCursoLogoKit } from '@/components/brandkit/MudarCursoLogoKit'
import { EditorAdvancedMediaDialog } from '@/components/editor/EditorAdvancedMediaDialog'
import { dataUrlToFile } from '@/lib/advanced-media'
import { downloadAssetMedia } from '@/lib/download-utils'
import { getImageUrlErrorMessage } from '@/lib/image-upload'
import { getAssetUrl, uploadImageBankAsset } from '@/services/image-bank'
import { rasterizeImageToFormat, type RasterizeFormat } from '@/lib/rasterize'
import { applyPresetToAssets, type BulkProgress } from '@/services/bulk-preset'
import { listEditPresets, type StudioEditPreset } from '@/services/studio-edit-presets'
import { ExportFormatDialog, BulkPresetDialog } from '@/pages/brandKit/BulkPresetDialogs'

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
  const { currentBrand } = useSocial()
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
  // URL da mídia EDITADA por asset (rasterizada no editor) — alimenta download e preview
  const [sessionEditedUrls, setEditedUrls] = useState<Record<string, string>>({})
  const [downloadingEditedId, setDownloadingEditedId] = useState<string | null>(null)
  // Export em PNG/JPG/WebP (pedido 3)
  const [exportTarget, setExportTarget] = useState<BrandAsset | null>(null)
  const [exporting, setExporting] = useState(false)
  // Aplicar preset em lote (pedido 4)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [presets, setPresets] = useState<StudioEditPreset[]>([])
  const [presetsLoading, setPresetsLoading] = useState(false)
  const [presetPickerOpen, setPresetPickerOpen] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<BulkProgress | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [persistedEditedUrls, setPersistedEditedUrls] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('brandkit:edited-urls')
      return raw ? (JSON.parse(raw) as Record<string, string>) : {}
    } catch {
      return {}
    }
  })

  // Mapa efetivo: edição desta sessão (inclui data: temporários) sobrepõe a persistida.
  const editedUrls = useMemo(
    () => ({ ...persistedEditedUrls, ...sessionEditedUrls }),
    [persistedEditedUrls, sessionEditedUrls],
  )

  // Persiste a URL editada (http, gravada no acervo) para sobreviver a reloads.
  // data: URLs ficam só em memória (quota do localStorage).
  useEffect(() => {
    try {
      const persistable = Object.fromEntries(
        Object.entries(sessionEditedUrls).filter(([, url]) => !url.startsWith('data:')),
      )
      if (Object.keys(persistable).length === 0) return
      const merged = { ...persistedEditedUrls, ...persistable }
      localStorage.setItem('brandkit:edited-urls', JSON.stringify(merged))
      setPersistedEditedUrls(merged)
    } catch {
      /* quota cheia — segue em memória */
    }
  }, [sessionEditedUrls, persistedEditedUrls])

  // Presets disponíveis para o lote: os do usuário + os compartilhados pela equipe.
  useEffect(() => {
    let alive = true
    setPresetsLoading(true)
    listEditPresets()
      .then((list) => {
        if (alive) setPresets(list)
      })
      .catch(() => {
        if (alive) setPresets([])
      })
      .finally(() => {
        if (alive) setPresetsLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

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

  /** Baixa a imagem já editada; abre o seletor PNG/JPG/WebP (pedido 3). */
  const handleDownloadEdited = (asset: BrandAsset) => {
    if (!editedUrls[asset.id]) {
      handleDownload(asset, 'original')
      return
    }
    setExportTarget(asset)
  }

  /** Re-rasteriza a versão editada no formato escolhido e baixa. */
  const handleExportEdited = async (asset: BrandAsset, format: RasterizeFormat) => {
    const editedUrl = editedUrls[asset.id]
    if (!editedUrl) return
    setExporting(true)
    try {
      const baseName = asset.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')
      const dataUrl = await rasterizeImageToFormat(editedUrl, format)
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${baseName}-editada.${format === 'jpeg' ? 'jpg' : format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast({
        title: `Download iniciado (${format === 'jpeg' ? 'JPG' : format.toUpperCase()})`,
        description: `Asset "${asset.title}" exportado com os ajustes aplicados.`,
      })
      setExportTarget(null)
    } catch {
      // Fallback CORS: baixa o arquivo persistido direto (mantém extensão pedida)
      try {
        await downloadAssetMedia(editedUrl, {
          filename: `${asset.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-editada.${
            format === 'jpeg' ? 'jpg' : format
          }`,
          mediaType: 'image',
        })
        setExportTarget(null)
      } catch {
        window.open(editedUrl, '_blank')
        toast({
          title: 'Abrimos a imagem em nova aba',
          description: 'O navegador bloqueou o download direto (CORS). Use "Salvar imagem como…".',
        })
      }
    } finally {
      setExporting(false)
    }
  }

  // Seleção múltipla (pedido 4)
  const toggleSelected = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) =>
      prev.length === filteredAssets.length ? [] : filteredAssets.map((a) => a.id),
    )
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds([])
  }

  const handleApplyBulkPreset = async (preset: StudioEditPreset) => {
    const items = selectedIds
      .map((id) => baseAssets.find((a) => a.id === id))
      .filter((a): a is BrandAsset => Boolean(a))
      .map((a) => ({
        assetId: a.id,
        srcUrl: a.imageUrl,
        name: a.title,
        category: 'geral',
        brand: currentBrand?.id,
        aspectRatio: a.aspectRatio,
        previousEditedUrl: editedUrls[a.id],
      }))
    setPresetPickerOpen(false)
    setBulkOpen(true)
    setBulkProgress({ done: 0, total: items.length, currentName: '', ok: 0, failed: 0 })
    const result = await applyPresetToAssets(items, preset, setBulkProgress)
    // Re-carrega o mapa do localStorage após o lote (badge Editado + preview)
    try {
      const raw = localStorage.getItem('brandkit:edited-urls')
      if (raw) setPersistedEditedUrls(JSON.parse(raw))
    } catch {
      /* ignore */
    }
    setBulkOpen(false)
    setBulkProgress(null)
    exitSelectMode()
    toast({
      title: `Preset “${preset.name}” aplicado em lote`,
      description: `${result.ok} asset(s) atualizados${result.failed ? `, ${result.failed} falharam` : ''}.`,
      variant: result.failed ? 'destructive' : 'default',
    })
  }

  const handleAdvancedSave = async (asset: BrandAsset, resultUrl: string) => {
    setAdvancedAsset(null)
    setSavingEdit(true)
    // Guarda o resultado editado para download/preview imediato (mesmo se o upload falhar)
    setEditedUrls((prev) => ({ ...prev, [asset.id]: resultUrl }))
    try {
      let file: File | null = null
      if (resultUrl.startsWith('data:')) {
        file = dataUrlToFile(resultUrl, `${asset.id}-editada.png`)
      } else {
        const blob = await fetch(resultUrl).then((r) => r.blob())
        file = new File([blob], `${asset.id}-editada.png`, { type: blob.type || 'image/png' })
      }
      if (!file) throw new Error('Não foi possível ler a mídia editada.')
      const saved = await uploadImageBankAsset(file, {
        name: `${asset.title} (editada)`,
        category: 'geral',
        tags: ['brand_kit', 'edicao_avancada'],
        brand: currentBrand?.id,
      })
      // Preferir a URL persistida (http) do acervo — sobrevive a reloads e alimenta o badge "Editado"
      if (saved?.id) {
        setEditedUrls((prev) => ({ ...prev, [asset.id]: getAssetUrl(saved) }))
      }
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

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={selectMode ? 'default' : 'outline'}
                onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
                className="h-9 rounded-xl text-xs font-bold gap-1.5"
                title="Selecionar vários assets para aplicar um preset em lote"
              >
                {selectMode ? (
                  <CheckSquare className="w-3.5 h-3.5" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                {selectMode ? 'Sair da seleção' : 'Selecionar'}
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Filter className="w-3.5 h-3.5 text-primary" />
                <span>
                  Exibindo <strong>{filteredAssets.length}</strong> de {baseAssets.length} assets
                </span>
              </div>
            </div>
          </div>

          {/* BARRA DO MODO SELEÇÃO (pedido 4): contagem + aplicar preset em lote */}
          {selectMode && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSelectAllFiltered}
                  className="flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary"
                >
                  {filteredAssets.length > 0 && selectedIds.length === filteredAssets.length ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  Selecionar todos ({filteredAssets.length})
                </button>
                <span className="text-xs text-muted-foreground">
                  {selectedIds.length} selecionado(s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setPresetPickerOpen(true)}
                  disabled={selectedIds.length === 0 || presetsLoading || presets.length === 0}
                  className="h-9 rounded-xl text-xs font-bold gap-1.5"
                  title={
                    presets.length === 0
                      ? 'Nenhum preset disponível — salve um na Edição Avançada'
                      : 'Aplicar o preset escolhido em todos os assets selecionados'
                  }
                >
                  {presetsLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Aplicar preset em lote
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={exitSelectMode}
                  className="h-9 rounded-xl text-xs"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

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
              const isSelected = selectMode && selectedIds.includes(asset.id)

              return (
                <div
                  key={asset.id}
                  onClick={() =>
                    selectMode &&
                    toggleSelected(asset.id, { stopPropagation: () => {} } as React.MouseEvent)
                  }
                  className={
                    'group relative rounded-3xl overflow-hidden bg-card border transition-all flex flex-col justify-between ' +
                    (isSelected
                      ? 'border-primary border-2 shadow-xl'
                      : 'border-border/70 hover:border-primary/50 hover:shadow-2xl cursor-pointer')
                  }
                >
                  {/* Checkbox de seleção (pedido 4) — só visível no modo seleção */}
                  {selectMode && (
                    <button
                      type="button"
                      onClick={(e) => toggleSelected(asset.id, e)}
                      className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-9 h-9 rounded-xl bg-black/70 backdrop-blur-md border-2 flex items-center justify-center transition-colors"
                      style={{
                        borderColor: isSelected ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.3)',
                      }}
                      aria-label={isSelected ? 'Desmarcar asset' : 'Marcar asset'}
                    >
                      {isSelected ? (
                        <Check className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-white/80" />
                      )}
                    </button>
                  )}

                  {/* Visual Preview com Overlay Violeta e Badge de Proporção */}
                  <div
                    className={`relative w-full overflow-hidden bg-muted ${
                      isReels ? 'aspect-[9/16]' : isBanner ? 'aspect-[16/9]' : 'aspect-square'
                    }`}
                  >
                    <img
                      src={editedUrls[asset.id] || asset.imageUrl}
                      alt={asset.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Indicador de asset editado (Edição Avançada aplicada) */}
                    {editedUrls[asset.id] && (
                      <div className="absolute top-4 left-4 z-20 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/90 text-white shadow-md">
                        <Wand2 className="w-3 h-3" />
                        <span className="text-[10px] font-black tracking-wider uppercase">
                          Editado
                        </span>
                      </div>
                    )}

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
                            if (editedUrls[asset.id]) {
                              handleDownloadEdited(asset)
                            } else {
                              handleDownload(asset, 'original')
                            }
                          }}
                          disabled={downloadingEditedId === asset.id || selectMode}
                          className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs gap-1.5 shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>
                            {downloadingEditedId === asset.id
                              ? 'Baixando…'
                              : editedUrls[asset.id]
                                ? 'Baixar Editada'
                                : 'Baixar Original'}
                          </span>
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
                        disabled={savingEdit || selectMode}
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
          mediaUrl={editedUrls[advancedAsset.id] || advancedAsset.imageUrl}
          mediaId={`brandkit:${advancedAsset.id}`}
          aspectRatio={advancedAsset.aspectRatio}
          title={advancedAsset.title}
          onSave={(url) => handleAdvancedSave(advancedAsset, url)}
        />
      )}

      {/* Seletor de formato PNG/JPG/WebP para o asset editado (pedido 3) */}
      <ExportFormatDialog
        open={Boolean(exportTarget)}
        onOpenChange={(o) => !o && setExportTarget(null)}
        assetName={exportTarget?.title}
        busy={exporting}
        onExport={(format) => handleExportEdited(exportTarget as BrandAsset, format)}
      />

      {/* Seletor de preset + progresso do lote (pedido 4) */}
      <BulkPresetDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        presetName={bulkProgress?.currentName || ''}
        progress={bulkProgress}
      />
      <PresetPickerDialog
        open={presetPickerOpen}
        onOpenChange={setPresetPickerOpen}
        presets={presets}
        loading={presetsLoading}
        selectedCount={selectedIds.length}
        onPick={handleApplyBulkPreset}
      />

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
                {editedUrls[selectedAsset.id] && (
                  <Badge className="mb-2 ml-1 bg-emerald-500 text-white text-xs font-bold uppercase">
                    Editado
                  </Badge>
                )}
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
                src={editedUrls[selectedAsset.id] || selectedAsset.imageUrl}
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
                onClick={() =>
                  editedUrls[selectedAsset.id]
                    ? handleDownloadEdited(selectedAsset)
                    : handleDownload(selectedAsset, 'original')
                }
                disabled={downloadingEditedId === selectedAsset.id}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-extrabold text-sm uppercase tracking-wider shadow-lg"
              >
                {downloadingEditedId === selectedAsset.id
                  ? 'Baixando…'
                  : editedUrls[selectedAsset.id]
                    ? 'Baixar Versão Editada'
                    : 'Original em Alta Resolução'}
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

/**
 * Escolhe qual preset aplicar no lote de assets selecionados (pedido 4):
 * lista presets do usuário + compartilhados pela equipe (migration 0112).
 */
function PresetPickerDialog({
  open,
  onOpenChange,
  presets,
  loading,
  selectedCount,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  presets: StudioEditPreset[]
  loading: boolean
  selectedCount: number
  onPick: (preset: StudioEditPreset) => void
}) {
  return (
    <BulkPresetDialogWrapper
      open={open}
      onOpenChange={onOpenChange}
      presets={presets}
      loading={loading}
      selectedCount={selectedCount}
      onPick={onPick}
    />
  )
}

function BulkPresetDialogWrapper(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  presets: StudioEditPreset[]
  loading: boolean
  selectedCount: number
  onPick: (preset: StudioEditPreset) => void
}) {
  return <PresetListDialog {...props} />
}

function PresetListDialog({
  open,
  onOpenChange,
  presets,
  loading,
  selectedCount,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  presets: StudioEditPreset[]
  loading: boolean
  selectedCount: number
  onPick: (preset: StudioEditPreset) => void
}) {
  return <BulkPresetPickerDialog {...props} />
}

function BulkPresetPickerDialog({
  open,
  onOpenChange,
  presets,
  loading,
  selectedCount,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  presets: StudioEditPreset[]
  loading: boolean
  selectedCount: number
  onPick: (preset: StudioEditPreset) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <PackageOpen className="w-4 h-4 text-primary" />
            Aplicar preset em {selectedCount} asset(s)
          </DialogTitle>
          <DialogDescription>
            Escolha o preset — ele será rasterizado sobre cada asset selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] overflow-y-auto space-y-1.5">
          {loading && (
            <p className="text-xs text-muted-foreground flex items-center gap-2 py-4 justify-center">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando presets…
            </p>
          )}
          {!loading && presets.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Nenhum preset salvo ainda. Salve um na Edição Avançada de qualquer asset.
            </p>
          )}
          {!loading &&
            presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onPick(preset)}
                className="w-full flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 hover:border-primary/50 hover:bg-primary/5 text-left"
              >
                <span className="text-xs font-bold text-foreground truncate">{preset.name}</span>
                {preset.is_shared && (
                  <Badge variant="outline" className="text-[9px] shrink-0">
                    Equipe
                  </Badge>
                )}
              </button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
