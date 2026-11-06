import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, LayoutTemplate, Ratio, Sparkles } from 'lucide-react'
import { CarouselSlide, AspectRatioFormat } from './ProfessionalArtStudio'
import { AdvancedCustomizationState } from './AdvancedCustomizationPanel'

interface CarouselPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slides: CarouselSlide[]
  aspectRatio: AspectRatioFormat
  customization: AdvancedCustomizationState
  baseMediaUrl?: string
}

export function CarouselPreviewModal({
  open,
  onOpenChange,
  slides,
  aspectRatio,
  customization,
  baseMediaUrl,
}: CarouselPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const currentSlide = slides[currentIndex] || slides[0]
  const total = slides.length

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0))
  }

  const ratioClass =
    aspectRatio === '4:5'
      ? 'aspect-[4/5] max-h-[500px]'
      : aspectRatio === '9:16'
        ? 'aspect-[9/16] max-h-[540px]'
        : aspectRatio === '16:9'
          ? 'aspect-[16/9] max-h-[360px]'
          : 'aspect-square max-h-[440px]'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:p-6 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Prévia do Carrossel ({currentIndex + 1} de {total})
            </DialogTitle>
            <Badge
              variant="outline"
              className="text-xs border-purple-500/30 text-purple-600 dark:text-purple-400"
            >
              Formato {aspectRatio}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Navegue pelos slides como seu público verá no feed do Instagram ou LinkedIn.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 flex flex-col items-center">
          {/* Card do Slide */}
          <div
            className={`w-full max-w-md ${ratioClass} rounded-2xl relative overflow-hidden shadow-lg border border-border flex flex-col justify-between p-6 transition-all`}
            style={{
              background:
                customization.gradientMode === 'linear'
                  ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                  : customization.gradientMode === 'radial'
                    ? `radial-gradient(circle, ${customization.primaryColor}, ${customization.secondaryColor})`
                    : customization.primaryColor,
              color: '#FFFFFF',
            }}
          >
            {/* Imagem de Fundo se houver */}
            {(currentSlide?.mediaUrl || baseMediaUrl) && (
              <img
                src={currentSlide?.mediaUrl || baseMediaUrl}
                alt="Slide Media"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  filter: `brightness(${customization.brightness}%) contrast(${customization.contrast}%) saturate(${customization.saturation}%) blur(${customization.blur}px)`,
                  opacity: 0.85,
                }}
              />
            )}

            {/* Overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: customization.overlayColor,
                opacity: customization.overlayOpacity / 100,
              }}
            />

            {/* Header do Slide */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs">
                Slide {currentIndex + 1} / {total}
              </span>
              <span className="text-[10px] font-semibold opacity-80 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> MidiaViva
              </span>
            </div>

            {/* Conteúdo Central */}
            <div className="relative z-10 my-auto text-center space-y-3 px-2">
              <h3 className="text-lg sm:text-xl font-extrabold leading-tight drop-shadow-md">
                {currentSlide?.title || `Slide ${currentIndex + 1}`}
              </h3>
              {currentSlide?.captionSnippet && (
                <p className="text-xs sm:text-sm font-medium opacity-90 drop-shadow-sm max-w-xs mx-auto">
                  {currentSlide.captionSnippet}
                </p>
              )}

              {/* Camadas de texto customizadas */}
              {currentSlide?.textLayers?.map((layer) => (
                <div
                  key={layer.id}
                  className="rounded px-2 py-1 font-bold inline-block mx-auto"
                  style={{
                    color: layer.color,
                    fontSize: `${Math.max(12, layer.fontSize * 0.75)}px`,
                    backgroundColor: layer.bgColor,
                  }}
                >
                  {layer.text}
                </div>
              ))}
            </div>

            {/* Footer do Slide */}
            <div className="relative z-10 flex items-center justify-between text-[11px] font-semibold opacity-90 pt-2 border-t border-white/20">
              <span>Arraste para continuar 👉</span>
              <span>{currentIndex === total - 1 ? 'Salvar post' : 'Próximo slide'}</span>
            </div>
          </div>

          {/* Controles de Navegação */}
          <div className="flex items-center justify-between w-full max-w-md pt-4">
            <Button variant="outline" size="sm" onClick={handlePrev} className="text-xs gap-1">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>

            <div className="flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'w-6 bg-purple-600'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={handleNext} className="text-xs gap-1">
              Próximo <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
