import React, { useRef, useState } from 'react'
import {
  Sparkles,
  Video,
  Image as ImageIcon,
  Mic,
  Box,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Zap,
  RefreshCw,
  Upload,
  X,
  FileImage,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  STUDIO_MODELS,
  STUDIO_QUALITY_OPTIONS,
  StudioMediaType,
  StudioModelOption,
  StudioQualityTier,
} from '@/services/ai-studio'
import { toast } from '@/hooks/use-toast'

export interface StudioGenerationBarProps {
  activeTab: StudioMediaType
  onTabChange: (tab: StudioMediaType) => void
  prompt: string
  onPromptChange: (val: string) => void
  selectedModel: StudioModelOption
  onSelectModel: (model: StudioModelOption) => void
  selectedQuality: StudioQualityTier
  onSelectQuality: (quality: StudioQualityTier) => void
  uploadedAssets: string[]
  onAddUploadedAsset: (url: string) => void
  onRemoveUploadedAsset: (index: number) => void
  onOpenConfigModal?: () => void
  onGenerate: () => void
  isGenerating: boolean
  className?: string
}

export const StudioGenerationBar: React.FC<StudioGenerationBarProps> = ({
  activeTab,
  onTabChange,
  prompt,
  onPromptChange,
  selectedModel,
  onSelectModel,
  selectedQuality,
  onSelectQuality,
  uploadedAssets,
  onAddUploadedAsset,
  onRemoveUploadedAsset,
  onOpenConfigModal,
  onGenerate,
  isGenerating,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isAssetDrawerOpen, setIsAssetDrawerOpen] = useState(false)

  // Placeholders idênticos ao print Genspark
  const placeholders: Record<StudioMediaType, string> = {
    geral: 'Descreva a mídia que você deseja criar com inteligência artificial...',
    video: 'Descreva o vídeo que você deseja.',
    image: 'Descreva a imagem de alto impacto que você deseja criar.',
    audio: 'Insira o texto para locução ou descreva a trilha sonora comercial.',
    '3d': 'Descreva o objeto ou cena 3D que você deseja modelar.',
  }

  // Abas superiores do console
  const tabs: {
    id: StudioMediaType
    label: string
    icon: React.ComponentType<{ className?: string }>
  }[] = [
    { id: 'geral', label: 'Geral', icon: Sparkles },
    { id: 'video', label: 'Vídeo', icon: Video },
    { id: 'image', label: 'Imagem', icon: ImageIcon },
    { id: 'audio', label: 'Áudio', icon: Mic },
    { id: '3d', label: '3D', icon: Box },
  ]

  const qualityConfig =
    STUDIO_QUALITY_OPTIONS.find((q) => q.id === selectedQuality) || STUDIO_QUALITY_OPTIONS[0]

  // Handler de upload real de imagem para asset de criação
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Formato não suportado',
          description: 'Por favor, selecione uma imagem (PNG, JPG, WebP).',
          variant: 'destructive',
        })
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onAddUploadedAsset(reader.result)
          toast({
            title: 'Asset adicionado!',
            description: `${file.name} foi incorporado aos elementos da criação.`,
          })
        }
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Ícone visual da marca para a lista de modelos
  const renderBrandIcon = (brand?: string) => {
    switch (brand) {
      case 'kling':
        return (
          <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
            K
          </span>
        )
      case 'semente':
        return (
          <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
            M
          </span>
        )
      case 'minimax':
        return (
          <span className="w-5 h-5 rounded-md bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
            H
          </span>
        )
      case 'gemini':
        return (
          <span className="w-5 h-5 rounded-md bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
            G
          </span>
        )
      case 'grok':
        return (
          <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
            X
          </span>
        )
      case 'flux':
        return (
          <span className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
            ▲
          </span>
        )
      default:
        return (
          <span className="w-5 h-5 rounded-md bg-neutral-800 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
            ⚡
          </span>
        )
    }
  }

  return (
    <div
      className={`bg-card/95 border border-border/80 rounded-3xl p-3 sm:p-5 shadow-2xl relative ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Linha Superior: Abas Geral / Vídeo / Imagem / Áudio / 3D */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-border/50 pb-3 mb-3 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Painel Expansível de Upload de Assets (quando ativado pelo botão +) */}
      {isAssetDrawerOpen && (
        <div className="mb-3 p-4 rounded-2xl bg-muted/40 border border-border/80 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-foreground">
                Envie o que vai aparecer no seu vídeo
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Personagens, cenários, produtos, logos… adicione um ou quantos quiser.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAssetDrawerOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl text-xs font-bold gap-1.5 h-9 border-dashed border-border hover:border-purple-500"
            >
              <Upload className="w-3.5 h-3.5 text-purple-600" />
              <span>Selecionar do dispositivo</span>
            </Button>

            {uploadedAssets.map((asset, index) => (
              <div
                key={index}
                className="relative w-12 h-12 rounded-xl overflow-hidden border border-border group"
              >
                <img src={asset} alt="Asset" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemoveUploadedAsset(index)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Textarea Grande */}
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={placeholders[activeTab]}
          rows={3}
          className="w-full text-sm sm:text-base resize-none rounded-2xl border-none bg-transparent focus-visible:ring-0 p-2 sm:p-3 font-normal placeholder:text-muted-foreground/70"
        />
      </div>

      {/* Linha Inferior de Controles (Exata aos prints do Genspark) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/50">
        {/* Esquerda: Botão +, Pill do Modelo selecionado, Botão Configurações */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Botão + */}
          <button
            type="button"
            onClick={() => setIsAssetDrawerOpen(!isAssetDrawerOpen)}
            title="Adicionar referências e assets visuais"
            className="w-8 h-8 rounded-full border border-border/80 bg-background hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Pill do Modelo Selecionado com Dropdown Completo */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="rounded-full h-8 px-3 bg-background border-border/80 hover:bg-muted text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
              >
                {renderBrandIcon(selectedModel.brandIcon)}
                <span className="max-w-[130px] truncate">{selectedModel.name}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              className="w-84 max-h-[380px] overflow-y-auto p-2 rounded-2xl shadow-2xl border border-border/80 bg-popover"
            >
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-1">
                Modelos de {activeTab.toUpperCase()} & Custo Relativo
              </div>

              {(STUDIO_MODELS[activeTab] || STUDIO_MODELS.video).map((model) => {
                const isSelected = selectedModel.id === model.id
                return (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => onSelectModel(model)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer ${
                      isSelected
                        ? 'bg-muted font-bold text-foreground'
                        : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderBrandIcon(model.brandIcon)}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {model.name}
                          </span>
                          {model.badge && (
                            <Badge
                              className={`text-[8px] font-black px-1 py-0 h-3.5 uppercase ${
                                model.badge === 'NOVO'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {model.badge}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {model.provider}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        $$$ {model.relativeCost.toFixed(2).replace('.', ',')}×
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-foreground shrink-0" />}
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botão Configu... */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenConfigModal}
            className="rounded-full text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground gap-1"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Configu...</span>
          </Button>
        </div>

        {/* Direita: Seletor de Qualidade ("Caminho") + Botão Cinza Escuro "Gerar" */}
        <div className="flex items-center gap-2">
          {/* Dropdown de Qualidade (Caminho: Padrão Recomendado / Ultra / Mega) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-xs h-8 px-3 text-muted-foreground hover:text-foreground gap-1.5 border border-border/60"
              >
                <span className="font-bold text-foreground">{qualityConfig.name}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-80 p-3 rounded-2xl shadow-2xl border border-border/80 bg-popover space-y-2"
            >
              <div className="border-b border-border/50 pb-2">
                <p className="text-xs font-black text-foreground">Caminho</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                  Defina seu modo de IA. Modos mais rápidos consomem menos créditos; modos mais
                  inteligentes entregam maior qualidade.
                </p>
              </div>

              {STUDIO_QUALITY_OPTIONS.map((q) => {
                const isSelected = selectedQuality === q.id
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onSelectQuality(q.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-start justify-between gap-2 ${
                      isSelected ? 'bg-muted/80 border border-border' : 'hover:bg-muted/40'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-foreground">{q.name}</span>
                        {q.badge && (
                          <Badge className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0 h-4">
                            {q.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {q.description}
                      </p>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-foreground shrink-0 mt-0.5" />}
                  </button>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botão Cinza-Escuro / Preto "Gerar" */}
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            className="rounded-full px-5 h-9 font-bold text-xs sm:text-sm bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 shadow-md min-w-[84px] transition-transform active:scale-98"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Gerar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
export default StudioGenerationBar
