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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import type { LogoKitVariationConfig, LogoVariationKind } from '@/services/logo-kit'
import { generateMudarCursoSvg } from '@/services/mudarcurso-logo-svg'
import { Sparkles, Sliders, Eye, RefreshCw, Check, Undo2 } from 'lucide-react'

interface AdvancedLogoEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialConfig: LogoKitVariationConfig
  onSave: (updated: LogoKitVariationConfig) => Promise<void> | void
  onResetToDefault?: () => void
}

export function AdvancedLogoEditorModal({
  open,
  onOpenChange,
  initialConfig,
  onSave,
  onResetToDefault,
}: AdvancedLogoEditorModalProps) {
  const { toast } = useToast()
  const [config, setConfig] = useState<LogoKitVariationConfig>(initialConfig)
  const [previewBg, setPreviewBg] = useState<'light' | 'dark' | 'violet'>('dark')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setConfig(initialConfig)
  }, [initialConfig, open])

  // Gerar SVG em tempo real com as opções de edição
  const liveSvg = generateMudarCursoSvg(config, {
    background: previewBg,
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(config)
      toast({
        title: 'Edição salva com sucesso!',
        description: `As alterações na "${config.title}" foram gravadas no sistema.`,
      })
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar edição',
        description: err?.message || 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (onResetToDefault) {
      onResetToDefault()
    }
    toast({
      title: 'Valores redefinidos',
      description: 'As configurações padrão da logo foram restauradas.',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-3xl bg-background border border-purple-500/40 text-foreground shadow-2xl">
        {/* Header do editor */}
        <div className="bg-gradient-to-r from-[#1B0A4D] via-[#2B0A8A] to-[#5B1FE0] p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
                <Sliders className="w-5 h-5 text-purple-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-black text-white">
                    Edição Avançada · {config.title}
                  </DialogTitle>
                  <Badge className="bg-white/20 text-white text-[10px] font-mono uppercase">
                    {config.kind}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-purple-200 mt-0.5">
                  Personalize cores, proporção do símbolo, área de segurança, marca d'água e
                  exportação.
                </DialogDescription>
              </div>
            </div>
          </div>
        </div>

        {/* Corpo com Grid: Painel de Controles + Preview em Tempo Real */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Controles (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Nome do arquivo & Texto Alternativo */}
            <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/70">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Identificação & Acessibilidade
              </h4>
              <div className="space-y-1.5">
                <Label htmlFor="custom-filename" className="text-xs font-bold">
                  Nome Base do Arquivo
                </Label>
                <Input
                  id="custom-filename"
                  value={config.fileNameCustom}
                  onChange={(e) => setConfig({ ...config, fileNameCustom: e.target.value })}
                  placeholder="mudarcurso-logo-oficial"
                  className="h-9 text-xs rounded-xl bg-card border-border/80"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alt-text" className="text-xs font-bold">
                  Texto Alternativo (Alt Text / Screen Readers)
                </Label>
                <Input
                  id="alt-text"
                  value={config.altText}
                  onChange={(e) => setConfig({ ...config, altText: e.target.value })}
                  placeholder="Logo oficial MudarCurso"
                  className="h-9 text-xs rounded-xl bg-card border-border/80"
                />
              </div>
            </div>

            {/* 2. Cores (Primária, Secundária e Monocromática) */}
            <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/70">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Paleta de Cores da Peça
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Cor Primária */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold block">Cor Primária (Violeta)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-border/80 p-0.5 bg-card"
                    />
                    <Input
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="h-8 text-xs font-mono rounded-lg bg-card"
                    />
                  </div>
                </div>

                {/* Cor Secundária / Destaque */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold block">Destaque (Rosa Neon)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-border/80 p-0.5 bg-card"
                    />
                    <Input
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                      className="h-8 text-xs font-mono rounded-lg bg-card"
                    />
                  </div>
                </div>

                {/* Cor Monocromática */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold block">Monocromática</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.monoColor}
                      onChange={(e) => setConfig({ ...config, monoColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-border/80 p-0.5 bg-card"
                    />
                    <Input
                      value={config.monoColor}
                      onChange={(e) => setConfig({ ...config, monoColor: e.target.value })}
                      className="h-8 text-xs font-mono rounded-lg bg-card"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Escala do Símbolo e Posição */}
            <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/70">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Dimensões & Alinhamento
                </h4>
                <span className="text-xs font-mono font-bold text-foreground">
                  {config.symbolSize}%
                </span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Tamanho do Símbolo (Escala)</Label>
                <Slider
                  min={70}
                  max={150}
                  step={5}
                  value={[config.symbolSize]}
                  onValueChange={(val) => setConfig({ ...config, symbolSize: val[0] })}
                  className="py-1"
                />
              </div>

              {config.kind !== 'mark' && (
                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs font-semibold block">Posição no Eixo Horizontal</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['left', 'center', 'right'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setConfig({ ...config, logoPosition: pos })}
                        className={`h-8 rounded-xl text-xs font-bold capitalize transition-all ${
                          config.logoPosition === pos
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {pos === 'left'
                          ? 'À Esquerda'
                          : pos === 'center'
                            ? 'Centralizado'
                            : 'À Direita'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Toggles Técnicos (Área de Proteção, Marca d'água de rascunho, Fundo Transparente) */}
            <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/70">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Parâmetros Técnicos & Exportação
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold">Visualizar Área de Proteção (X)</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Exibe linhas guias de margem segura proporcional ao símbolo
                    </p>
                  </div>
                  <Switch
                    checked={config.showSafeArea}
                    onCheckedChange={(val) => setConfig({ ...config, showSafeArea: val })}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold">Marca d'água "Rascunho"</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Inclui selo diagonal para aprovação preliminar interna
                    </p>
                  </div>
                  <Switch
                    checked={config.draftWatermark}
                    onCheckedChange={(val) => setConfig({ ...config, draftWatermark: val })}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold">Fundo Transparente (Padrão)</Label>
                    <p className="text-[11px] text-muted-foreground">
                      SVG e PNG exportados com alpha transparente
                    </p>
                  </div>
                  <Switch
                    checked={config.transparentBg}
                    onCheckedChange={(val) => setConfig({ ...config, transparentBg: val })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Preview em Tempo Real (5 cols) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-purple-600" />
                  <span>Preview em Tempo Real</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">SVG Dinâmico</span>
              </div>

              {/* Seletor de fundo do preview */}
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

              {/* Canvas Preview Container */}
              <div
                className={`relative rounded-2xl p-6 min-h-[260px] flex items-center justify-center border transition-all ${
                  previewBg === 'light'
                    ? 'bg-white border-slate-300 text-slate-900'
                    : previewBg === 'dark'
                      ? 'bg-[#0F0B1F] border-purple-500/30 text-white'
                      : 'bg-[#5B21B6] border-purple-400/40 text-white'
                }`}
              >
                <div
                  className="w-full h-full flex items-center justify-center max-h-[220px]"
                  dangerouslySetInnerHTML={{ __html: liveSvg }}
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-700 dark:text-purple-300 leading-relaxed">
                💡 <strong>Dica de Conformidade:</strong> A logo MudarCurso utiliza Archivo Black
                para o wordmark e Plus Jakarta Sans para apoios. As edições salvam os parâmetros na
                sua conta para uso contínuo em todas as exportações e downloads.
              </div>
            </div>

            {/* Ações inferiores */}
            <div className="pt-4 flex items-center justify-between border-t border-border/70">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </Button>

              <div className="flex items-center gap-2">
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
                  size="sm"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-5 shadow-sm gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Salvando...' : 'Salvar Edição'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
