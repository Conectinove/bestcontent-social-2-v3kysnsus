import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  type BrandKitMaterialItem,
  type BrandMaterialCategory,
  generateMaterialSvg,
} from '@/services/brand-materials'
import {
  Sparkles,
  Sliders,
  Eye,
  PlusCircle,
  Upload,
  Layers,
  Palette,
  FileCode,
  Image as ImageIcon,
  Check,
  Type,
  LayoutTemplate,
} from 'lucide-react'

interface CreateOrEditMaterialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMaterial?: BrandKitMaterialItem | null
  onSave: (
    material: Omit<BrandKitMaterialItem, 'id'> & { id?: string },
    file?: File,
  ) => Promise<void> | void
}

const CATEGORY_OPTIONS: { id: BrandMaterialCategory; label: string; desc: string }[] = [
  { id: 'variation', label: 'Variação de Logo', desc: 'Versão técnica adicional da marca' },
  { id: 'badge', label: 'Selo Oficial', desc: 'Badge circular com tipografia e selo' },
  { id: 'social_cover', label: 'Capa / Banner', desc: 'Banner horizontal para cabeçalhos' },
  { id: 'watermark', label: 'Marca d’água', desc: 'Aplicação sutil para fundos e mídia' },
  { id: 'stamp', label: 'Carimbo / Stencil', desc: 'Layout monocromático de alta pressão' },
  { id: 'custom', label: 'Outro Material', desc: 'Peça gráfica livre para o kit' },
]

const LAYOUT_OPTIONS: {
  id: BrandKitMaterialItem['layoutType']
  label: string
  hint: string
}[] = [
  { id: 'horizontal', label: 'Horizontal (Padrão)', hint: 'Símbolo + Texto lado a lado' },
  { id: 'stacked', label: 'Vertical / Quadrado', hint: 'Símbolo acima do nome centralizado' },
  { id: 'badge-round', label: 'Selo Circular', hint: 'Com texto curvado e bordas duplas' },
  { id: 'banner', label: 'Banner 1200×400', hint: 'Proporção horizontal para cabeçalhos' },
  { id: 'symbol-only', label: 'Apenas Símbolo', hint: 'Ícone isolado em alta resolução' },
]

export function CreateOrEditMaterialModal({
  open,
  onOpenChange,
  initialMaterial,
  onSave,
}: CreateOrEditMaterialModalProps) {
  const { toast } = useToast()
  const isEditing = Boolean(initialMaterial?.id)

  const [title, setTitle] = useState(initialMaterial?.title || 'Novo Material MudarCurso')
  const [subtitle, setSubtitle] = useState(
    initialMaterial?.subtitle || 'Variação personalizada para o Brand Kit',
  )
  const [category, setCategory] = useState<BrandMaterialCategory>(
    initialMaterial?.category || 'variation',
  )
  const [layoutType, setLayoutType] = useState<BrandKitMaterialItem['layoutType']>(
    initialMaterial?.layoutType || 'horizontal',
  )
  const [fileNameCustom, setFileNameCustom] = useState(
    initialMaterial?.fileNameCustom || 'mudarcurso-novo-material',
  )
  const [customText, setCustomText] = useState(initialMaterial?.customText || 'MudarCurso')
  const [tagline, setTagline] = useState(initialMaterial?.tagline || 'TRANSFORMAÇÃO CONTÍNUA')
  const [primaryColor, setPrimaryColor] = useState(initialMaterial?.primaryColor || '#5B21B6')
  const [secondaryColor, setSecondaryColor] = useState(initialMaterial?.secondaryColor || '#FF2E93')
  const [monoColor, setMonoColor] = useState(initialMaterial?.monoColor || '#0F0B1F')
  const [symbolSize, setSymbolSize] = useState(initialMaterial?.symbolSize || 100)
  const [logoPosition, setLogoPosition] = useState<'left' | 'center' | 'right'>(
    initialMaterial?.logoPosition || 'left',
  )
  const [altText, setAltText] = useState(initialMaterial?.altText || 'Material oficial MudarCurso')
  const [showSafeArea, setShowSafeArea] = useState(initialMaterial?.showSafeArea ?? false)
  const [draftWatermark, setDraftWatermark] = useState(initialMaterial?.draftWatermark ?? false)
  const [transparentBg, setTransparentBg] = useState(initialMaterial?.transparentBg ?? true)
  const [svgRaw, setSvgRaw] = useState(initialMaterial?.svgRaw || '')

  // Modo de criação: "editor" nativo ou "upload"
  const [sourceMode, setSourceMode] = useState<'editor' | 'upload' | 'svgcode'>(
    initialMaterial?.svgRaw ? 'svgcode' : 'editor',
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)

  const [previewBg, setPreviewBg] = useState<'light' | 'dark' | 'violet'>('dark')
  const [isSaving, setIsSaving] = useState(false)

  // Sincronizar quando initialMaterial mudar
  useEffect(() => {
    if (initialMaterial) {
      setTitle(initialMaterial.title)
      setSubtitle(initialMaterial.subtitle)
      setCategory(initialMaterial.category)
      setLayoutType(initialMaterial.layoutType)
      setFileNameCustom(initialMaterial.fileNameCustom)
      setCustomText(initialMaterial.customText)
      setTagline(initialMaterial.tagline)
      setPrimaryColor(initialMaterial.primaryColor)
      setSecondaryColor(initialMaterial.secondaryColor)
      setMonoColor(initialMaterial.monoColor)
      setSymbolSize(initialMaterial.symbolSize)
      setLogoPosition(initialMaterial.logoPosition)
      setAltText(initialMaterial.altText)
      setShowSafeArea(initialMaterial.showSafeArea)
      setDraftWatermark(initialMaterial.draftWatermark)
      setTransparentBg(initialMaterial.transparentBg)
      setSvgRaw(initialMaterial.svgRaw || '')
      if (initialMaterial.svgRaw) {
        setSourceMode('svgcode')
      }
    } else {
      // Resetar para novo
      setTitle('Nova Variação MudarCurso')
      setSubtitle('Material oficial para o Kit de Marca')
      setCategory('variation')
      setLayoutType('horizontal')
      setFileNameCustom(`mudarcurso-material-${Date.now().toString().slice(-4)}`)
      setCustomText('MudarCurso')
      setTagline('TRANSFORMAÇÃO CONTÍNUA')
      setPrimaryColor('#5B21B6')
      setSecondaryColor('#FF2E93')
      setMonoColor('#0F0B1F')
      setSymbolSize(100)
      setLogoPosition('left')
      setAltText('Material oficial MudarCurso')
      setShowSafeArea(false)
      setDraftWatermark(false)
      setTransparentBg(true)
      setSvgRaw('')
      setSourceMode('editor')
      setSelectedFile(null)
      setFilePreviewUrl(null)
    }
  }, [initialMaterial, open])

  // Gerar o preview dinâmico do material em SVG
  const draftItem: BrandKitMaterialItem = {
    id: initialMaterial?.id || 'temp',
    title,
    subtitle,
    category,
    kindSlug: category,
    fileNameCustom,
    primaryColor,
    secondaryColor,
    monoColor,
    symbolSize,
    logoPosition,
    altText,
    customText,
    tagline,
    layoutType,
    showSafeArea,
    draftWatermark,
    transparentBg,
    svgRaw: sourceMode === 'svgcode' ? svgRaw : undefined,
  }

  const liveSvg = generateMaterialSvg(draftItem, {
    background: previewBg,
  })

  // Lidar com upload de arquivo SVG/PNG
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setFilePreviewUrl(url)

    // Se for SVG, tenta ler o código diretamente
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result as string
        if (text && text.includes('<svg')) {
          setSvgRaw(text)
        }
      }
      reader.readAsText(file)
    }

    if (!title || title === 'Nova Variação MudarCurso') {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1))
      setFileNameCustom(file.name.replace(/\.[^/.]+$/, '').toLowerCase())
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor dê um título para este material.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      await onSave(
        {
          id: initialMaterial?.id,
          title,
          subtitle,
          category,
          kindSlug: category,
          fileNameCustom: fileNameCustom || 'mudarcurso-material',
          primaryColor,
          secondaryColor,
          monoColor,
          symbolSize,
          logoPosition,
          altText,
          customText,
          tagline,
          layoutType,
          showSafeArea,
          draftWatermark,
          transparentBg,
          svgRaw: sourceMode === 'svgcode' || sourceMode === 'upload' ? svgRaw : '',
        },
        selectedFile || undefined,
      )

      toast({
        title: isEditing ? 'Material atualizado!' : 'Novo material criado!',
        description: `"${title}" foi adicionado ao seu Brand Kit com downloads em SVG, PNG, JPG e PDF.`,
      })
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar material',
        description: err?.message || 'Não foi possível gravar o material no sistema.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-3xl bg-background border border-purple-500/40 text-foreground shadow-2xl">
        {/* Header estilo MidiaViva */}
        <div className="bg-gradient-to-r from-[#1B0A4D] via-[#2B0A8A] to-[#5B1FE0] p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                {isEditing ? (
                  <Sliders className="w-5 h-5 text-purple-200" />
                ) : (
                  <PlusCircle className="w-5 h-5 text-pink-300" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-black text-white">
                    {isEditing ? `Editar Material · ${title}` : 'Criar Novo Material no Brand Kit'}
                  </DialogTitle>
                  <Badge className="bg-white/20 text-white text-[10px] font-mono uppercase">
                    SYS · LOGO KIT v1.0
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-purple-200 mt-0.5">
                  Adicione novas peças técnicas, selos ou variações de logo com preview imediato e
                  downloads em todos os formatos.
                </DialogDescription>
              </div>
            </div>
          </div>
        </div>

        {/* Abas de Modo: Editor Nativo x Upload x Código SVG */}
        <div className="px-6 pt-4 border-b border-border/60 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSourceMode('editor')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              sourceMode === 'editor'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Gerador Gráfico Integrado</span>
          </button>
          <button
            type="button"
            onClick={() => setSourceMode('upload')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              sourceMode === 'upload'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Inserir via Upload (SVG/PNG)</span>
          </button>
          <button
            type="button"
            onClick={() => setSourceMode('svgcode')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              sourceMode === 'svgcode'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Código SVG Direto</span>
          </button>
        </div>

        {/* Corpo com Grid: Controles (7 cols) + Preview (5 cols) */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controles */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Informações Básicas & Categoria */}
            <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/70">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>1. Identificação do Material</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="mat-title" className="text-xs font-bold">
                    Título da Peça / Variação
                  </Label>
                  <Input
                    id="mat-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Selo Holográfico 2026"
                    className="h-9 text-xs rounded-xl bg-card border-border/80"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mat-subtitle" className="text-xs font-bold">
                    Subtítulo Técnico
                  </Label>
                  <Input
                    id="mat-subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ex: Aplicação para crachás e eventos"
                    className="h-9 text-xs rounded-xl bg-card border-border/80"
                  />
                </div>
              </div>

              {/* Seletor de Categoria */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-bold">Categoria da Peça</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2 rounded-xl text-left border transition-all text-xs ${
                        category === cat.id
                          ? 'border-purple-600 bg-purple-500/10 dark:bg-purple-950/30 font-bold text-purple-600 dark:text-purple-300'
                          : 'border-border/80 bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="truncate">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nome do Arquivo */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="mat-filename" className="text-xs font-bold">
                  Nome do Arquivo Exportado (slug)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="mat-filename"
                    value={fileNameCustom}
                    onChange={(e) => setFileNameCustom(e.target.value)}
                    placeholder="mudarcurso-material-novo"
                    className="h-9 text-xs font-mono rounded-xl bg-card border-border/80"
                  />
                  <span className="text-xs text-muted-foreground font-mono">.svg / .png</span>
                </div>
              </div>
            </div>

            {/* SE MODO UPLOAD */}
            {sourceMode === 'upload' && (
              <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/70">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload de Arte (SVG ou PNG)</span>
                </h4>

                <div
                  onClick={() => document.getElementById('mat-upload-input')?.click()}
                  className="border-2 border-dashed border-border/80 hover:border-purple-500 rounded-2xl p-6 text-center bg-card hover:bg-purple-500/5 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 group-hover:scale-110 flex items-center justify-center mx-auto transition-transform mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-foreground">
                    Clique para selecionar um arquivo SVG ou PNG
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Arquivos SVG terão vetorização completa no kit; PNG até 10MB
                  </p>
                  <input
                    id="mat-upload-input"
                    type="file"
                    accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {selectedFile && (
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <ImageIcon className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="font-bold truncate">{selectedFile.name}</span>
                      <span className="text-muted-foreground font-mono">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Pronto</Badge>
                  </div>
                )}
              </div>
            )}

            {/* SE MODO SVGCODE */}
            {sourceMode === 'svgcode' && (
              <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/70">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Código SVG Vetorial Direto</span>
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Cole o código SVG completo (&lt;svg...&gt;&lt;/svg&gt;). O preview e os downloads
                  em SVG, PNG, JPG e PDF serão renderizados em alta definição.
                </p>
                <textarea
                  value={svgRaw}
                  onChange={(e) => setSvgRaw(e.target.value)}
                  placeholder="<svg viewBox='0 0 1200 360' xmlns='http://www.w3.org/2000/svg'>...</svg>"
                  rows={8}
                  className="w-full text-[11px] font-mono p-3 rounded-xl bg-card border border-border/80 focus:border-purple-500 focus:outline-hidden"
                />
              </div>
            )}

            {/* SE MODO GERADOR INTEGRADO */}
            {sourceMode === 'editor' && (
              <>
                {/* 2. Seleção de Layout */}
                <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/70">
                  <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <LayoutTemplate className="w-3.5 h-3.5" />
                    <span>2. Estrutura & Layout Visual</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {LAYOUT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLayoutType(opt.id)}
                        className={`p-2.5 rounded-xl text-left border transition-all text-xs ${
                          layoutType === opt.id
                            ? 'border-purple-600 bg-purple-500/10 dark:bg-purple-950/30 font-bold text-purple-600 dark:text-purple-300'
                            : 'border-border/80 bg-card text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className="font-bold">{opt.label}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                          {opt.hint}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Textos da Peça */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="custom-txt" className="text-xs font-bold">
                        Wordmark Principal
                      </Label>
                      <Input
                        id="custom-txt"
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="MudarCurso"
                        className="h-9 text-xs rounded-xl bg-card border-border/80"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="custom-tagline" className="text-xs font-bold">
                        Tagline / Apoio
                      </Label>
                      <Input
                        id="custom-tagline"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="TRANSFORMAÇÃO CONTÍNUA"
                        className="h-9 text-xs rounded-xl bg-card border-border/80"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Paleta de Cores da Peça */}
                <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/70">
                  <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    <span>3. Paleta de Cores Técnica</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold block">Primária (Violeta)</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-border/80 p-0.5 bg-card"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="h-8 text-xs font-mono rounded-lg bg-card"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold block">Destaque (Rosa Neon)</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-border/80 p-0.5 bg-card"
                        />
                        <Input
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="h-8 text-xs font-mono rounded-lg bg-card"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold block">Fundo / Apoio</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={monoColor}
                          onChange={(e) => setMonoColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-border/80 p-0.5 bg-card"
                        />
                        <Input
                          value={monoColor}
                          onChange={(e) => setMonoColor(e.target.value)}
                          className="h-8 text-xs font-mono rounded-lg bg-card"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Escala e Posição */}
                <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/70">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      4. Proporção do Símbolo ({symbolSize}%)
                    </h4>
                  </div>
                  <Slider
                    min={60}
                    max={160}
                    step={5}
                    value={[symbolSize]}
                    onValueChange={(val) => setSymbolSize(val[0])}
                    className="py-1"
                  />
                  {layoutType === 'horizontal' && (
                    <div className="space-y-1.5 pt-2">
                      <Label className="text-xs font-semibold block">Posição no Eixo</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['left', 'center', 'right'] as const).map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => setLogoPosition(pos)}
                            className={`h-8 rounded-xl text-xs font-bold capitalize transition-all ${
                              logoPosition === pos
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-card border border-border/80 text-muted-foreground'
                            }`}
                          >
                            {pos === 'left'
                              ? 'À Esquerda'
                              : pos === 'center'
                                ? 'Centro'
                                : 'À Direita'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 5. Parâmetros Técnicos & Toggles */}
            <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/70">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Parâmetros Técnicos & Exportação
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold">Visualizar Área de Proteção (X)</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Exibe margem segura de respiro no preview
                    </p>
                  </div>
                  <Switch checked={showSafeArea} onCheckedChange={setShowSafeArea} />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold">Marca d'água "Rascunho"</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Adiciona selo diagonal de aprovação interna
                    </p>
                  </div>
                  <Switch checked={draftWatermark} onCheckedChange={setDraftWatermark} />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold">Fundo Transparente</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Exportações em SVG e PNG terão canal alpha limpo
                    </p>
                  </div>
                  <Switch checked={transparentBg} onCheckedChange={setTransparentBg} />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Preview em Tempo Real */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-purple-600" />
                  <span>Preview do Novo Material</span>
                </span>
                <Badge variant="outline" className="text-[10px] font-mono border-purple-500/30">
                  {layoutType.toUpperCase()}
                </Badge>
              </div>

              {/* Botões de Fundo */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewBg('light')}
                  className={`h-8 rounded-xl text-xs font-bold transition-all ${
                    previewBg === 'light'
                      ? 'bg-white text-black border-2 border-purple-600 shadow-sm'
                      : 'bg-muted border border-border/80 text-muted-foreground'
                  }`}
                >
                  Fundo Claro
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('dark')}
                  className={`h-8 rounded-xl text-xs font-bold transition-all ${
                    previewBg === 'dark'
                      ? 'bg-[#0F0B1F] text-white border-2 border-purple-500 shadow-sm'
                      : 'bg-muted border border-border/80 text-muted-foreground'
                  }`}
                >
                  Fundo Escuro
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('violet')}
                  className={`h-8 rounded-xl text-xs font-bold transition-all ${
                    previewBg === 'violet'
                      ? 'bg-[#5B21B6] text-white border-2 border-pink-500 shadow-sm'
                      : 'bg-muted border border-border/80 text-muted-foreground'
                  }`}
                >
                  Fundo Violeta
                </button>
              </div>

              {/* Canvas Preview */}
              <div
                className={`relative rounded-2xl p-6 min-h-[260px] flex items-center justify-center border transition-all ${
                  previewBg === 'light'
                    ? 'bg-white border-slate-300 text-slate-900'
                    : previewBg === 'dark'
                      ? 'bg-[#0F0B1F] border-purple-500/30 text-white'
                      : 'bg-[#5B21B6] border-purple-400/40 text-white'
                }`}
              >
                {sourceMode === 'upload' && filePreviewUrl && !svgRaw ? (
                  <img
                    src={filePreviewUrl}
                    alt={title}
                    className="max-h-[200px] max-w-full object-contain"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center max-h-[220px]"
                    dangerouslySetInnerHTML={{ __html: liveSvg }}
                  />
                )}
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-700 dark:text-purple-300 leading-relaxed">
                ✨ <strong>Integração Completa:</strong> Ao salvar, esta peça receberá card próprio
                no grid do Brand Kit, com downloads individuais (SVG, PNG em várias resoluções, JPG,
                PDF) e opções de edição/exclusão.
              </div>
            </div>

            {/* Ações Inferiores */}
            <div className="pt-4 flex items-center justify-between border-t border-border/70">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="rounded-xl text-xs font-bold bg-[#5B21B6] hover:bg-[#6D28D9] text-white shadow-md gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {isSaving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Material'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
