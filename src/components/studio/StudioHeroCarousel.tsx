import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface StudioHeroSlide {
  id: string
  title: string
  subtitle: string
  ctaText: string
  bgImage: string
  tag: string
  badgeColor?: string
  promptSuggestion: string
  mediaType: 'video' | 'image' | 'audio' | '3d'
}

export interface StudioHeroCarouselProps {
  activeHeroTab: string
  onSelectHeroTab: (tab: string) => void
  onApplyPrompt: (prompt: string, type: 'video' | 'image' | 'audio' | '3d') => void
  className?: string
}

export const StudioHeroCarousel: React.FC<StudioHeroCarouselProps> = ({
  activeHeroTab,
  onSelectHeroTab,
  onApplyPrompt,
  className = '',
}) => {
  const slides: StudioHeroSlide[] = [
    {
      id: 'slide-1',
      title: 'MidiaViva Magia',
      subtitle: 'Transforme movimentos existentes trocando cenários, personagens e iluminação',
      ctaText: 'Experimentando com o Kling 4.0 →',
      bgImage: 'https://img.usecurling.com/p/1200/500?q=cinematic+dancers+rooftop+urban&color=blue',
      tag: 'KLING 4.0 OUTPUT',
      badgeColor: 'bg-emerald-500 text-black',
      promptSuggestion:
        'Coreografia sincronizada de dançarinos em terraço moderno ao pôr do sol com iluminação cinematográfica, câmera circular dinâmica em 4K.',
      mediaType: 'video',
    },
    {
      id: 'slide-2',
      title: 'START → END',
      subtitle:
        'Defina o primeiro e o último quadro. A IA preenche todo o movimento com física realista.',
      ctaText: 'Experimentando com o Kling 4.0 →',
      bgImage:
        'https://img.usecurling.com/p/1200/500?q=dinosaur+museum+cinematic+motion&color=green',
      tag: 'START → END FLOW',
      badgeColor: 'bg-lime-400 text-black',
      promptSuggestion:
        'Start frame: visitante entra no saguão de vidro. End frame: t-rex realista passa pela entrada envidraçada em câmera lenta com reflexos volumétricos.',
      mediaType: 'video',
    },
    {
      id: 'slide-3',
      title: 'Seedance 2.5 Cinema',
      subtitle: '428 vídeos/mês com fidelidade máxima e consistência temporal entre cenas',
      ctaText: 'Criar tomada épica com Seedance 2.5 →',
      bgImage:
        'https://img.usecurling.com/p/1200/500?q=medieval+knights+epic+battlefield&color=orange',
      tag: 'NOVO · SEEDANCE 2.5',
      badgeColor: 'bg-amber-400 text-black',
      promptSuggestion:
        'Cavaleiro com armadura reflexiva lidera exército marchando em campo aberto sob névoa matinal dramática, tom cinematográfico de cinema de época.',
      mediaType: 'video',
    },
  ]

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  // Auto-play suave a cada 7s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [slides.length])

  const currentSlide = slides[currentSlideIndex]

  const heroTabs = [
    { id: 'inicio', label: 'Início' },
    { id: 'destaques', label: 'Destaques' },
    { id: 'inspire-se', label: 'Inspire-se' },
    { id: 'magia-midiaviva', label: 'Magia MidiaViva' },
    { id: 'estudio-anuncios', label: 'Estúdio de Anúncios' },
  ]

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Navegação Superior do Hero (igualzinha ao print Genspark) */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 text-sm font-semibold overflow-x-auto py-1 scrollbar-none">
        {heroTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectHeroTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap text-xs sm:text-sm ${
              activeHeroTab === tab.id
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Banner Carrossel com Efeito Cilíndrico/Panorâmico */}
      <div className="relative rounded-3xl overflow-hidden bg-neutral-950 text-white shadow-2xl border border-border/40 aspect-[21/9] min-h-[220px] max-h-[380px] flex items-center justify-center group">
        {/* Imagem de Fundo com Fade */}
        <img
          src={currentSlide.bgImage}
          alt={currentSlide.title}
          className="absolute inset-0 w-full h-full object-cover opacity-80 transition-opacity duration-700 select-none"
        />

        {/* Gradientes de Vinheta para destacar o texto central */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />

        {/* Setas Laterais ‹ › */}
        <button
          type="button"
          onClick={() =>
            setCurrentSlideIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
          }
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/80 dark:bg-neutral-900/80 text-neutral-900 dark:text-white backdrop-blur-md flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-20"
          aria-label="Slide anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % slides.length)}
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/80 dark:bg-neutral-900/80 text-neutral-900 dark:text-white backdrop-blur-md flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-20"
          aria-label="Próximo slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Conteúdo Central Sobreposto */}
        <div className="relative z-10 text-center max-w-2xl px-6 space-y-2.5 sm:space-y-3">
          <Badge
            className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 shadow-md ${currentSlide.badgeColor || 'bg-white text-black'}`}
          >
            {currentSlide.tag}
          </Badge>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight font-heading drop-shadow-md">
            {currentSlide.title}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-200 line-clamp-2 max-w-lg mx-auto drop-shadow-xs">
            {currentSlide.subtitle}
          </p>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => onApplyPrompt(currentSlide.promptSuggestion, currentSlide.mediaType)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-neutral-900 hover:bg-neutral-100 font-bold text-xs sm:text-sm shadow-xl transition-transform active:scale-98"
            >
              <span>{currentSlide.ctaText}</span>
            </button>
          </div>
        </div>

        {/* Indicadores de Dots Paginados Embaixo */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlideIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                currentSlideIndex === idx
                  ? 'w-6 bg-white shadow-sm'
                  : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Ir para slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
export default StudioHeroCarousel
