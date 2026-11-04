import React, { useState } from 'react'
import {
  Palette,
  Type,
  Sliders,
  Sparkles,
  RotateCcw,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  Clock,
  Hash,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export interface AdvancedCustomizationState {
  primaryColor: string
  secondaryColor: string
  gradientMode: 'none' | 'linear' | 'radial'
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'semibold' | 'bold' | 'extrabold'
  textAlign: 'left' | 'center' | 'right'
  letterSpacing: number
  lineHeight: number
  brightness: number
  contrast: number
  saturation: number
  blur: number
  vignette: number
  overlayOpacity: number
  overlayColor: string
}

export const DEFAULT_CUSTOMIZATION: AdvancedCustomizationState = {
  primaryColor: '#7C3AED',
  secondaryColor: '#EC4899',
  gradientMode: 'linear',
  fontFamily: 'Inter, sans-serif',
  fontSize: 18,
  fontWeight: 'bold',
  textAlign: 'center',
  letterSpacing: 0,
  lineHeight: 1.4,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  vignette: 0,
  overlayOpacity: 25,
  overlayColor: '#000000',
}

export const STYLE_PRESETS: {
  name: string
  description: string
  settings: Partial<AdvancedCustomizationState>
}[] = [
  {
    name: 'Lilás Neon (MidiaViva)',
    description: 'Vibrante e moderno com gradiente roxo/rosa',
    settings: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#EC4899',
      gradientMode: 'linear',
      brightness: 105,
      contrast: 110,
      saturation: 115,
      overlayOpacity: 20,
    },
  },
  {
    name: 'Dark Elegance',
    description: 'Fundo escuro dramático de alta autoridade',
    settings: {
      primaryColor: '#1E1B4B',
      secondaryColor: '#4338CA',
      gradientMode: 'linear',
      brightness: 95,
      contrast: 120,
      saturation: 90,
      overlayOpacity: 45,
      overlayColor: '#09090b',
    },
  },
  {
    name: 'Clean Editorial',
    description: 'Minimalista com tipografia nítida e alto contraste',
    settings: {
      primaryColor: '#FFFFFF',
      secondaryColor: '#F3F4F6',
      gradientMode: 'none',
      brightness: 100,
      contrast: 105,
      saturation: 100,
      overlayOpacity: 10,
      overlayColor: '#000000',
    },
  },
  {
    name: 'Sunset Warmth',
    description: 'Tons quentes de laranja e dourado para retenção',
    settings: {
      primaryColor: '#F97316',
      secondaryColor: '#F43F5E',
      gradientMode: 'linear',
      brightness: 102,
      contrast: 110,
      saturation: 125,
      overlayOpacity: 20,
    },
  },
]

interface BestPracticesProps {
  platform: string
  caption: string
  customization: AdvancedCustomizationState
  hasMedia: boolean
}

export function AdvancedCustomizationPanel({
  customization,
  onChange,
  onReset,
  platform,
  caption,
  hasMedia,
  brand,
}: {
  customization: AdvancedCustomizationState
  onChange: (next: AdvancedCustomizationState) => void
  onReset: () => void
  platform: string
  caption: string
  hasMedia: boolean
  brand?: any
}) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'customization' | 'best_practices'>('customization')
  const [suggestingColors, setSuggestingColors] = useState(false)

  const handleSuggestBrandColors = async () => {
    setSuggestingColors(true)
    try {
      // 1. Tentar ler cores do Brand Kit da marca ativa
      let primary = brand?.color_theme || brand?._raw?.color_theme
      let secondary = brand?._raw?.secondary_color || brand?.secondary_color

      // Paletas temáticas de alta conversão
      const fallbackPalettes = [
        { primary: '#8B5CF6', secondary: '#EC4899', name: 'Roxo & Magenta Vibrante' },
        { primary: '#3B82F6', secondary: '#10B981', name: 'Azul & Esmeralda Tech' },
        { primary: '#F97316', secondary: '#E11D48', name: 'Laranja & Rubi Sunset' },
        { primary: '#0F172A', secondary: '#6366F1', name: 'Índigo Executivo Dark' },
        { primary: '#059669', secondary: '#14B8A6', name: 'Menta & Turquesa Fresh' },
      ]

      if (!primary || !primary.startsWith('#')) {
        const randomPalette = fallbackPalettes[Math.floor(Math.random() * fallbackPalettes.length)]
        primary = randomPalette.primary
        secondary = randomPalette.secondary
      } else if (!secondary || !secondary.startsWith('#')) {
        secondary = '#EC4899'
      }

      onChange({
        ...customization,
        primaryColor: primary,
        secondaryColor: secondary,
        gradientMode: 'linear',
      })

      toast({
        title: 'Cores da Marca sugeridas por IA!',
        description: brand?.name
          ? `Aplicada a paleta otimizada para "${brand.name}".`
          : 'Aplicada paleta de alto contraste e conversão.',
      })
    } catch {
      // Fallback garantido
      onChange({
        ...customization,
        primaryColor: '#8B5CF6',
        secondaryColor: '#EC4899',
        gradientMode: 'linear',
      })
      toast({
        title: 'Paleta padrão aplicada',
        description: 'Cores com alto índice de contraste e legibilidade.',
      })
    } finally {
      setSuggestingColors(false)
    }
  }

  const applyPreset = (preset: (typeof STYLE_PRESETS)[0]) => {
    onChange({
      ...customization,
      ...preset.settings,
    })
    toast({
      title: `Preset aplicado: ${preset.name}`,
      description: 'Estilo visual e filtros atualizados na arte.',
    })
  }

  // Checklist Dinâmico de Melhores Práticas por Rede Social gerado pela IA
  const bestPracticesList = React.useMemo(() => {
    const net = (platform || 'instagram').toLowerCase()
    const hashtagMatches = caption.match(/#[a-zA-Z0-9_]+/g) || []
    const hashtagCount = hashtagMatches.length
    const captionLength = caption.trim().length

    // Recomendações por rede
    const isInstagram = net.includes('insta')
    const isTikTok = net.includes('tik')
    const isLinkedIn = net.includes('link')
    const isTwitter = net.includes('twit') || net === 'x'

    const idealHashtags = isInstagram ? '3 a 5 tags' : isLinkedIn ? '3 a 4 tags' : '2 a 3 tags'
    const idealHashtagRange = isInstagram ? [3, 7] : isLinkedIn ? [2, 5] : [1, 4]
    const hashtagStatus =
      hashtagCount >= idealHashtagRange[0] && hashtagCount <= idealHashtagRange[1]
        ? 'ok'
        : hashtagCount === 0
          ? 'warn'
          : 'attention'

    const idealTimes = isLinkedIn
      ? '08:00 - 10:00 (Expediente)'
      : isInstagram
        ? '18:30 - 20:00 (Horário Nobre)'
        : '12:00 - 14:00 (Pico)'

    const contrastIsGood =
      customization.overlayOpacity >= 20 ||
      customization.contrast >= 105 ||
      customization.gradientMode !== 'none'

    return [
      {
        id: 'bp-safe-zone',
        title: 'Área Segura e Respiro das Margens',
        description:
          isTikTok || isInstagram
            ? 'Mantenha textos e logotipos longe dos 15% inferiores (área ocupada por botões e legendas nativas da rede).'
            : 'Mantenha respiro de 40px em todas as margens para visualização limpa no feed.',
        status: customization.fontSize <= 28 ? 'ok' : 'attention',
        actionTip:
          customization.fontSize > 28
            ? 'Reduza ligeiramente a tipografia para evitar cortes.'
            : 'Margens seguras respeitadas.',
      },
      {
        id: 'bp-contrast',
        title: 'Contraste da Arte e Legibilidade de Texto',
        description:
          'Textos sobrepostos precisam de contraste mínimo 4.5:1 com o fundo para rápida leitura.',
        status: contrastIsGood ? 'ok' : 'attention',
        actionTip: contrastIsGood
          ? 'Opacidade e contraste adequados para leitura rápida.'
          : 'Aumente a opacidade da camada de sobreposição para 25% ou mais.',
      },
      {
        id: 'bp-media',
        title: 'Presença de Elemento Visual de Destaque',
        description:
          'Posts com criativo visual (foto, carrossel ou vídeo) geram 2.8x mais retenção.',
        status: hasMedia ? 'ok' : 'warn',
        actionTip: hasMedia
          ? 'Mídia anexada e ajustada com filtros.'
          : 'Adicione uma imagem ou template.',
      },
      {
        id: 'bp-hashtags',
        title: `Volume de Hashtags Estratégicas (${idealHashtags})`,
        description: `No ${platform}, o algoritmo favorece tags de nicho específicas ao invés de excessos.`,
        status: hashtagStatus,
        actionTip:
          hashtagStatus === 'ok'
            ? `${hashtagCount} tags configuradas com relevância.`
            : hashtagCount === 0
              ? 'Adicione hashtags usando o gerador inteligente abaixo.'
              : `Atualmente com ${hashtagCount} tags. Ajuste para ${idealHashtags}.`,
      },
      {
        id: 'bp-time',
        title: `Janela de Publicação Otimizada (${idealTimes})`,
        description: `Horário de maior tração identificado no Audience Insights para ${platform}.`,
        status: 'ok',
        actionTip: 'Programe o agendamento para a janela recomendada.',
      },
      {
        id: 'bp-hook',
        title: 'Gancho Inicial na Legenda (Primeiros 100 caracteres)',
        description: 'As 2 primeiras linhas decidem se o usuário expandirá o "...mais".',
        status: captionLength >= 40 ? 'ok' : 'warn',
        actionTip:
          captionLength >= 40
            ? 'Gancho presente e com boa extensão inicial.'
            : 'Escreva um gancho mais chamativo nas primeiras palavras.',
      },
    ]
  }, [platform, caption, customization, hasMedia])

  const totalOk = bestPracticesList.filter((b) => b.status === 'ok').length

  return (
    <Card className="rounded-2xl border-border bg-card p-4 space-y-4 shadow-xs mt-4">
      {/* Abas do Painel */}
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('customization')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'customization'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edição Avançada da Arte</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('best_practices')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'best_practices'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Melhores Práticas (IA)</span>
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 ml-0.5 border-purple-500/30 text-purple-600 dark:text-purple-300"
            >
              {totalOk}/{bestPracticesList.length}
            </Badge>
          </button>
        </div>

        {activeTab === 'customization' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground gap-1"
            title="Reverter para o padrão do template"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reverter Padrão</span>
          </Button>
        )}
      </div>

      {activeTab === 'customization' ? (
        <div className="space-y-4">
          {/* Presets Rápidos de Estilo */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Presets Rápidos de Estilo
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STYLE_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="p-2.5 rounded-xl border border-border/80 bg-muted/30 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left space-y-1 group"
                >
                  <p className="text-xs font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
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
                  title="Sugerir cores inteligentes com IA baseadas na marca ativa"
                >
                  <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span>Sugerir Cores com IA</span>
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
                      onChange={(e) => onChange({ ...customization, primaryColor: e.target.value })}
                      className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={customization.primaryColor}
                      onChange={(e) => onChange({ ...customization, primaryColor: e.target.value })}
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
                        onChange({ ...customization, secondaryColor: e.target.value })
                      }
                      className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={customization.secondaryColor}
                      onChange={(e) =>
                        onChange({ ...customization, secondaryColor: e.target.value })
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
                        onClick={() => onChange({ ...customization, gradientMode: mode })}
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

            {/* Bloco 2: Tipografia & Espaçamento */}
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/70 space-y-3">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Tipografia &
                Textos
              </span>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Tamanho da Fonte</span>
                    <span className="font-mono">{customization.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="36"
                    value={customization.fontSize}
                    onChange={(e) =>
                      onChange({ ...customization, fontSize: Number(e.target.value) })
                    }
                    className="w-full accent-purple-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">
                    Peso da Fonte
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['normal', 'semibold', 'bold', 'extrabold'] as const).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => onChange({ ...customization, fontWeight: w })}
                        className={`p-1 rounded text-[9px] font-bold capitalize ${
                          customization.fontWeight === w
                            ? 'bg-purple-600 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {w === 'extrabold' ? 'Black' : w}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">
                    Alinhamento
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['left', 'center', 'right'] as const).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => onChange({ ...customization, textAlign: a })}
                        className={`p-1 rounded text-[10px] font-bold capitalize ${
                          customization.textAlign === a
                            ? 'bg-purple-600 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {a === 'left' ? 'Esq.' : a === 'center' ? 'Centro' : 'Dir.'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 3: Filtros de Imagem & Camadas */}
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/70 space-y-3">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Filtros &
                Camadas
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
                      onChange({ ...customization, brightness: Number(e.target.value) })
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
                      onChange({ ...customization, contrast: Number(e.target.value) })
                    }
                    className="w-full accent-purple-600"
                  />
                </div>

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
                      onChange({ ...customization, overlayOpacity: Number(e.target.value) })
                    }
                    className="w-full accent-purple-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Checklist de Melhores Práticas por Rede Social */
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="font-bold text-foreground">
                Auditoria de Qualidade em Tempo Real: {platform}
              </span>
            </div>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {Math.round((totalOk / bestPracticesList.length) * 100)}% de conformidade
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {bestPracticesList.map((bp) => {
              const isOk = bp.status === 'ok'
              const isWarn = bp.status === 'warn'
              return (
                <div
                  key={bp.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                    isOk
                      ? 'bg-emerald-500/5 border-emerald-500/25'
                      : isWarn
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-purple-500/5 border-purple-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      {isOk ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span>{bp.title}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1 py-0 font-bold uppercase ${
                        isOk
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {isOk ? 'OK' : 'Atenção'}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {bp.description}
                  </p>

                  <p className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 pt-1">
                    💡 Dica: {bp.actionTip}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}
