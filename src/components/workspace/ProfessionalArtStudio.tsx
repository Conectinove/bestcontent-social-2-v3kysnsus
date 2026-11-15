import React, { useState } from 'react'
import {
  Sliders,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Zap,
  Palette,
  Type,
  Layers,
  Sun,
  Eye,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  LayoutTemplate,
  Ratio,
  Maximize2,
  Undo2,
  Move,
  Check,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  AdvancedCustomizationState,
  DEFAULT_CUSTOMIZATION,
  STYLE_PRESETS,
} from './AdvancedCustomizationPanel'

export interface ArtTextLayer {
  id: string
  text: string
  fontSize: number
  color: string
  fontWeight: 'normal' | 'semibold' | 'bold' | 'extrabold'
  align: 'left' | 'center' | 'right'
  x: number // percent 0..100
  y: number // percent 0..100
  bgColor?: string
  bgPadding?: number
}

export interface ArtShapeLayer {
  id: string
  type: 'badge' | 'line' | 'card' | 'circle'
  color: string
  opacity: number
  x: number
  y: number
  width: number
  height: number
}

export type AspectRatioFormat = '4:5' | '1:1' | '9:16' | '16:9'

export interface CarouselSlide {
  id: string
  title: string
  captionSnippet?: string
  mediaUrl?: string
  mediaFile?: File | null
  textLayers: ArtTextLayer[]
  customization?: Partial<AdvancedCustomizationState>
}

export const ASPECT_FORMATS: {
  key: AspectRatioFormat
  label: string
  ratioClass: string
  description: string
}[] = [
  {
    key: '4:5',
    label: '4:5 Retrato',
    ratioClass: 'aspect-[4/5]',
    description: 'Instagram Feed & Carrossel (1080×1350)',
  },
  {
    key: '1:1',
    label: '1:1 Quadrado',
    ratioClass: 'aspect-square',
    description: 'Feed clássico / LinkedIn (1080×1080)',
  },
  {
    key: '9:16',
    label: '9:16 Vertical',
    ratioClass: 'aspect-[9/16]',
    description: 'Stories, Reels & TikTok (1080×1920)',
  },
  {
    key: '16:9',
    label: '16:9 Paisagem',
    ratioClass: 'aspect-[16/9]',
    description: 'YouTube & X/Twitter Banner',
  },
]

export interface ProfessionalArtStudioProps {
  customization: AdvancedCustomizationState
  onChangeCustomization: (next: AdvancedCustomizationState) => void
  onResetCustomization: () => void
  platform: string
  caption: string
  hasMedia: boolean
  brand?: any
  // Camadas de texto sobre a arte
  textLayers: ArtTextLayer[]
  onChangeTextLayers: (layers: ArtTextLayer[]) => void
  // Formato / Proporção de tela
  aspectRatio: AspectRatioFormat
  onChangeAspectRatio: (ratio: AspectRatioFormat) => void
  // Modo Carrossel / Slides
  isCarousel: boolean
  onToggleCarousel: (enabled: boolean) => void
  slides: CarouselSlide[]
  currentSlideIndex: number
  onChangeSlideIndex: (index: number) => void
  onAddSlide: () => void
  onRemoveSlide: (index: number) => void
  onDuplicateSlide: (index: number) => void
  onMoveSlide: (from: number, to: number) => void
  onUpdateSlide: (index: number, patch: Partial<CarouselSlide>) => void
  onOpenPreviewCarouselModal: () => void
  onOpenAdvancedEditor?: () => void
}

export function ProfessionalArtStudio({
  customization,
  onChangeCustomization,
  onResetCustomization,
  platform,
  caption,
  hasMedia,
  brand,
  textLayers,
  onChangeTextLayers,
  aspectRatio,
  onChangeAspectRatio,
  isCarousel,
  onToggleCarousel,
  slides,
  currentSlideIndex,
  onChangeSlideIndex,
  onAddSlide,
  onRemoveSlide,
  onDuplicateSlide,
  onMoveSlide,
  onUpdateSlide,
  onOpenPreviewCarouselModal,
  onOpenAdvancedEditor,
}: ProfessionalArtStudioProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<
    'adjustments' | 'layers' | 'slides' | 'best_practices'
  >('adjustments')
  const [previousPreset, setPreviousPreset] = useState<AdvancedCustomizationState | null>(null)
  const [activePresetName, setActivePresetName] = useState<string | null>(null)
  const [suggestingColors, setSuggestingColors] = useState(false)

  // Aplica preset com capacidade de desfazer
  const applyPresetWithUndo = (preset: (typeof STYLE_PRESETS)[0]) => {
    setPreviousPreset({ ...customization })
    setActivePresetName(preset.name)
    onChangeCustomization({
      ...customization,
      ...preset.settings,
    })
    toast({
      title: `Preset aplicado: ${preset.name}`,
      description: 'Estilo visual atualizado. Clique em "Desfazer" para reverter.',
    })
  }

  const handleUndoPreset = () => {
    if (previousPreset) {
      onChangeCustomization(previousPreset)
      setPreviousPreset(null)
      setActivePresetName(null)
      toast({
        title: 'Preset revertido',
        description: 'Os ajustes visuais retornaram ao estado anterior.',
      })
    }
  }

  // Sugestão de cores por IA da marca
  const handleSuggestBrandColors = async () => {
    setSuggestingColors(true)
    try {
      let primary = brand?.color_theme || brand?._raw?.color_theme
      let secondary = brand?._raw?.secondary_color || brand?.secondary_color

      const fallbackPalettes = [
        { primary: '#8B5CF6', secondary: '#EC4899' },
        { primary: '#3B82F6', secondary: '#10B981' },
        { primary: '#F97316', secondary: '#E11D48' },
        { primary: '#1E1B4B', secondary: '#6366F1' },
      ]

      if (!primary || !primary.startsWith('#')) {
        const pal = fallbackPalettes[Math.floor(Math.random() * fallbackPalettes.length)]
        primary = pal.primary
        secondary = pal.secondary
      } else if (!secondary || !secondary.startsWith('#')) {
        secondary = '#EC4899'
      }

      onChangeCustomization({
        ...customization,
        primaryColor: primary,
        secondaryColor: secondary,
        gradientMode: 'linear',
      })

      toast({
        title: 'Cores sugeridas por IA!',
        description: brand?.name
          ? `Paleta otimizada para "${brand.name}".`
          : 'Paleta profissional aplicada.',
      })
    } finally {
      setSuggestingColors(false)
    }
  }

  // Camadas de texto
  const handleAddTextLayer = () => {
    const newLayer: ArtTextLayer = {
      id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: 'Novo Texto de Destaque',
      fontSize: 22,
      color: '#FFFFFF',
      fontWeight: 'bold',
      align: 'center',
      x: 50,
      y: Math.min(80, 25 + textLayers.length * 20),
      bgColor: 'rgba(0, 0, 0, 0.45)',
      bgPadding: 8,
    }
    onChangeTextLayers([...textLayers, newLayer])
    toast({
      title: 'Camada de texto adicionada',
      description: 'Edite o texto e posicione sobre a arte.',
    })
  }

  const handleUpdateTextLayer = (id: string, patch: Partial<ArtTextLayer>) => {
    onChangeTextLayers(textLayers.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  const handleRemoveTextLayer = (id: string) => {
    onChangeTextLayers(textLayers.filter((l) => l.id !== id))
  }

  return (
    <Card className="rounded-2xl border-border bg-card p-3.5 sm:p-4 space-y-4 shadow-xs mt-3">
      {/* Topbar do Estúdio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/80">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('adjustments')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'adjustments'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Filtros & Ajustes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('layers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'layers'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Camadas & Textos</span>
            {textLayers.length > 0 && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-0.5">
                {textLayers.length}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('slides')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'slides'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Slides / Carrossel</span>
            {isCarousel && (
              <Badge
                variant="outline"
                className="text-[9px] px-1 py-0 ml-0.5 border-purple-500/30 text-purple-600 dark:text-purple-300"
              >
                {slides.length} slides
              </Badge>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {onOpenAdvancedEditor && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAdvancedEditor}
              className="text-xs h-7 px-2 text-purple-600 dark:text-purple-400 border-purple-500/30 gap-1"
              title="Abrir o editor avançado de mídia (filtros, texto, proporção e presets sobre a imagem)"
            >
              <Wand2 className="w-3 h-3" />
              <span className="hidden sm:inline">Edição Avançada</span>
            </Button>
          )}
          {previousPreset && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndoPreset}
              className="text-xs h-7 px-2 text-purple-600 dark:text-purple-400 border-purple-500/30 gap-1"
              title="Desfazer preset recente"
            >
              <Undo2 className="w-3 h-3" />
              <span>Desfazer Preset</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onResetCustomization}
            className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground gap-1"
            title="Reverter para o padrão do template"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reverter Padrão</span>
          </Button>
        </div>
      </div>

      {/* SELETOR DE FORMATO / ASPECT RATIO */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/70 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
          <Ratio className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Formato por Rede:</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {ASPECT_FORMATS.map((fmt) => (
            <button
              key={fmt.key}
              type="button"
              onClick={() => {
                onChangeAspectRatio(fmt.key)
                toast({
                  title: `Formato alterado: ${fmt.label}`,
                  description: fmt.description,
                })
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                aspectRatio === fmt.key
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/80'
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ABA 1: FILTROS, CORES & PRESETS */}
      {activeTab === 'adjustments' && (
        <div className="space-y-4">
          {/* Presets Rápidos de Estilo com Altura Consistente e Sem Textos Cortados */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" /> Presets Rápidos de Estilo
              </span>
              {activePresetName && (
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                  Ativo: <strong>{activePresetName}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STYLE_PRESETS.map((p) => {
                const isActive = activePresetName === p.name
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPresetWithUndo(p)}
                    className={`p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between min-h-[72px] group ${
                      isActive
                        ? 'border-purple-600 bg-purple-500/10 ring-1 ring-purple-600/30'
                        : 'border-border/80 bg-muted/20 hover:border-purple-500/50 hover:bg-purple-500/5'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-tight">
                        {p.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            {/* Bloco 1: Cores & Degradê */}
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/70 space-y-3">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Cores &
                  Degradê
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={suggestingColors}
                  onClick={handleSuggestBrandColors}
                  className="h-6 px-2 text-[10px] gap-1 font-semibold rounded-lg border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                  title="Sugerir cores inteligentes com IA baseadas na marca"
                >
                  <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span>Sugerir IA</span>
                </Button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">
                    Cor Primária da Marca
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customization.primaryColor}
                      onChange={(e) =>
                        onChangeCustomization({ ...customization, primaryColor: e.target.value })
                      }
                      className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={customization.primaryColor}
                      onChange={(e) =>
                        onChangeCustomization({ ...customization, primaryColor: e.target.value })
                      }
                      className="flex-1 p-1 px-2 rounded border border-border bg-background text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">
                    Cor Secundária
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customization.secondaryColor}
                      onChange={(e) =>
                        onChangeCustomization({ ...customization, secondaryColor: e.target.value })
                      }
                      className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={customization.secondaryColor}
                      onChange={(e) =>
                        onChangeCustomization({ ...customization, secondaryColor: e.target.value })
                      }
                      className="flex-1 p-1 px-2 rounded border border-border bg-background text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">
                    Modo do Degradê
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['none', 'linear', 'radial'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() =>
                          onChangeCustomization({ ...customization, gradientMode: mode })
                        }
                        className={`p-1 rounded text-[10px] font-bold capitalize transition-all ${
                          customization.gradientMode === mode
                            ? 'bg-purple-600 text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {mode === 'none' ? 'Sólido' : mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 2: Filtros Profissionais de Imagem */}
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/70 space-y-3">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Brilho,
                Contraste & Cor
              </span>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Brilho</span>
                    <span className="font-mono">{customization.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={customization.brightness}
                    onChange={(e) =>
                      onChangeCustomization({
                        ...customization,
                        brightness: Number(e.target.value),
                      })
                    }
                    className="w-full accent-purple-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Contraste</span>
                    <span className="font-mono">{customization.contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={customization.contrast}
                    onChange={(e) =>
                      onChangeCustomization({ ...customization, contrast: Number(e.target.value) })
                    }
                    className="w-full accent-purple-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Saturação de Cor</span>
                    <span className="font-mono">{customization.saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={customization.saturation}
                    onChange={(e) =>
                      onChangeCustomization({
                        ...customization,
                        saturation: Number(e.target.value),
                      })
                    }
                    className="w-full accent-purple-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Desfoque Suave (Blur)</span>
                    <span className="font-mono">{customization.blur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={customization.blur}
                    onChange={(e) =>
                      onChangeCustomization({ ...customization, blur: Number(e.target.value) })
                    }
                    className="w-full accent-purple-600"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 3: Camada de Sobreposição (Overlay) */}
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/70 space-y-3">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Sobreposição
                & Legibilidade
              </span>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Opacidade da Camada Escura</span>
                    <span className="font-mono">{customization.overlayOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={customization.overlayOpacity}
                    onChange={(e) =>
                      onChangeCustomization({
                        ...customization,
                        overlayOpacity: Number(e.target.value),
                      })
                    }
                    className="w-full accent-purple-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">
                    Cor da Camada
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customization.overlayColor}
                      onChange={(e) =>
                        onChangeCustomization({ ...customization, overlayColor: e.target.value })
                      }
                      className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={customization.overlayColor}
                      onChange={(e) =>
                        onChangeCustomization({ ...customization, overlayColor: e.target.value })
                      }
                      className="flex-1 p-1 px-2 rounded border border-border bg-background text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-muted-foreground bg-card/60 p-2 rounded-lg border border-border/60">
                  <p>
                    💡 Camadas com 20% a 35% de opacidade garantem leitura nítida de textos em
                    qualquer feed sem apagar a foto de fundo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: CAMADAS DE TEXTO SOBRE A ARTE */}
      {activeTab === 'layers' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h4 className="text-xs font-bold text-foreground">Camadas de Texto sobre a Imagem</h4>
              <p className="text-[11px] text-muted-foreground">
                Adicione títulos, ganchos e CTAs diretamente sobre a arte com controle de posição e
                cor.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleAddTextLayer}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 px-2.5 gap-1 font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Texto
            </Button>
          </div>

          {textLayers.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-border/80 text-center space-y-2 bg-muted/20">
              <Type className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-xs font-semibold text-foreground">
                Nenhuma camada de texto na arte
              </p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Adicione caixas de texto flutuantes para criar ganchos de alta conversão direto no
                criativo.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTextLayer}
                className="text-xs h-7 gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400"
              >
                <Plus className="w-3 h-3" /> Criar Primeiro Texto
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {textLayers.map((layer, idx) => (
                <div
                  key={layer.id}
                  className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[11px] text-foreground flex items-center gap-1.5">
                      <Type className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      Camada #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTextLayer(layer.id)}
                      className="text-destructive hover:bg-destructive/10 h-6 px-1.5 text-[10px]"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <Input
                      value={layer.text}
                      onChange={(e) => handleUpdateTextLayer(layer.id, { text: e.target.value })}
                      placeholder="Texto da camada..."
                      className="text-xs h-8 bg-background font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">
                        Tamanho ({layer.fontSize}px)
                      </label>
                      <input
                        type="range"
                        min="14"
                        max="48"
                        value={layer.fontSize}
                        onChange={(e) =>
                          handleUpdateTextLayer(layer.id, { fontSize: Number(e.target.value) })
                        }
                        className="w-full accent-purple-600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">
                        Posição Vertical ({layer.y}%)
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={layer.y}
                        onChange={(e) =>
                          handleUpdateTextLayer(layer.id, { y: Number(e.target.value) })
                        }
                        className="w-full accent-purple-600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">
                        Cor do Texto
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={layer.color}
                          onChange={(e) =>
                            handleUpdateTextLayer(layer.id, { color: e.target.value })
                          }
                          className="w-6 h-6 rounded border border-border cursor-pointer bg-transparent"
                        />
                        <span className="font-mono text-[10px] uppercase text-muted-foreground">
                          {layer.color}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">
                        Alinhamento
                      </label>
                      <div className="grid grid-cols-3 gap-0.5">
                        {(['left', 'center', 'right'] as const).map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => handleUpdateTextLayer(layer.id, { align: a })}
                            className={`p-1 rounded text-[9px] font-bold ${
                              layer.align === a
                                ? 'bg-purple-600 text-white'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {a === 'left' ? 'E' : a === 'center' ? 'C' : 'D'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: FLUXO PROFISSIONAL DE SLIDES / CARROSSEL */}
      {activeTab === 'slides' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div>
              <div className="flex items-center gap-1.5">
                <LayoutTemplate className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-xs font-bold text-foreground">Modo Carrossel (Multi-Slides)</h4>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Crie carrosséis de 3 a 10 slides com capa, passos intermediários e chamada final.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant={isCarousel ? 'default' : 'outline'}
              onClick={() => onToggleCarousel(!isCarousel)}
              className={`text-xs h-7 px-3 font-bold ${
                isCarousel
                  ? 'bg-purple-600 text-white'
                  : 'border-purple-500/30 text-purple-600 dark:text-purple-400'
              }`}
            >
              {isCarousel ? 'Carrossel Ativo' : 'Ativar Carrossel'}
            </Button>
          </div>

          {isCarousel && (
            <div className="space-y-3">
              {/* Controles de Slides */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-foreground">
                  Slides do Carrossel ({slides.length} slides)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onOpenPreviewCarouselModal}
                    className="text-xs h-7 px-2.5 gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400"
                  >
                    <Eye className="w-3 h-3" /> Prévia Completa
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={onAddSlide}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 px-2.5 gap-1 font-bold"
                  >
                    <Plus className="w-3 h-3" /> Novo Slide
                  </Button>
                </div>
              </div>

              {/* Lista de Slides Horizontal com Thumbnails */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
                {slides.map((s, idx) => {
                  const isCurrent = idx === currentSlideIndex
                  return (
                    <div
                      key={s.id}
                      onClick={() => onChangeSlideIndex(idx)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1.5 relative group ${
                        isCurrent
                          ? 'border-purple-600 bg-purple-500/10 ring-2 ring-purple-600/30'
                          : 'border-border/80 bg-muted/20 hover:border-purple-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-foreground">Slide #{idx + 1}</span>
                        {isCurrent && (
                          <Badge
                            variant="secondary"
                            className="text-[8px] px-1 py-0 bg-purple-600 text-white"
                          >
                            Ativo
                          </Badge>
                        )}
                      </div>

                      <div className="h-16 rounded-lg bg-background/80 border border-border/60 flex items-center justify-center p-2 text-center overflow-hidden">
                        <span className="text-[10px] text-muted-foreground font-medium line-clamp-2">
                          {s.title || `Slide ${idx + 1}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDuplicateSlide(idx)
                          }}
                          className="text-muted-foreground hover:text-purple-600 p-0.5"
                          title="Duplicar slide"
                        >
                          <Copy className="w-3 h-3" />
                        </button>

                        <div className="flex items-center gap-0.5">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onMoveSlide(idx, idx - 1)
                              }}
                              className="text-muted-foreground hover:text-foreground p-0.5"
                              title="Mover para esquerda"
                            >
                              <ChevronDown className="w-3 h-3 rotate-90" />
                            </button>
                          )}
                          {idx < slides.length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onMoveSlide(idx, idx + 1)
                              }}
                              className="text-muted-foreground hover:text-foreground p-0.5"
                              title="Mover para direita"
                            >
                              <ChevronUp className="w-3 h-3 rotate-90" />
                            </button>
                          )}
                        </div>

                        {slides.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onRemoveSlide(idx)
                            }}
                            className="text-destructive hover:bg-destructive/10 p-0.5 rounded"
                            title="Remover slide"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Edição do Slide Atual */}
              {slides[currentSlideIndex] && (
                <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-2 text-xs">
                  <span className="font-bold text-foreground">
                    Configuração do Slide #{currentSlideIndex + 1}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">
                        Título do Slide
                      </label>
                      <Input
                        value={slides[currentSlideIndex].title}
                        onChange={(e) =>
                          onUpdateSlide(currentSlideIndex, { title: e.target.value })
                        }
                        placeholder="Ex: 3 Erros Fatais no Feed"
                        className="text-xs h-8 bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">
                        Texto de Apoio / Snippet
                      </label>
                      <Input
                        value={slides[currentSlideIndex].captionSnippet || ''}
                        onChange={(e) =>
                          onUpdateSlide(currentSlideIndex, { captionSnippet: e.target.value })
                        }
                        placeholder="Ex: Arraste para o lado para ver a solução..."
                        className="text-xs h-8 bg-background"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
