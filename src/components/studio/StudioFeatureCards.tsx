import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight, Wand2, Film, Layers } from 'lucide-react'

export interface StudioFeatureCardsProps {
  userCredits: number
  totalCreditsLimit?: number
  onViewPlans: () => void
  onSelectFeaturePrompt: (prompt: string, type: 'video' | 'image' | 'audio' | '3d') => void
  className?: string
}

export const StudioFeatureCards: React.FC<StudioFeatureCardsProps> = ({
  userCredits,
  totalCreditsLimit = 125000,
  onViewPlans,
  onSelectFeaturePrompt,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 gap-4 ${className}`}>
      {/* Coluna Esquerda: Banner Escuro Seedance 2.5 (428 vídeos/mês - 125.000 créditos/mês no Pro - Ver planos) */}
      <div className="md:col-span-5 relative rounded-3xl overflow-hidden bg-neutral-950 text-white border border-border/50 shadow-xl flex flex-col justify-end p-5 min-h-[200px] group">
        <img
          src="https://img.usecurling.com/p/800/500?q=medieval+army+knights+epic+cinematic&color=orange"
          alt="Seedance 2.5"
          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

        <div className="relative z-10 space-y-3">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight font-heading leading-tight">
              Seedance 2.5
            </h3>
            <p className="text-xl font-extrabold text-neutral-100">428 vídeos/mês</p>
            <p className="text-xs text-neutral-300 mt-1">
              {userCredits.toLocaleString('pt-BR')} de {totalCreditsLimit.toLocaleString('pt-BR')}{' '}
              créditos/mês no Pro
            </p>
          </div>

          <Button
            size="sm"
            onClick={onViewPlans}
            className="rounded-full bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs px-4 h-9 shadow-md transition-transform active:scale-98"
          >
            Ver planos
          </Button>
        </div>
      </div>

      {/* Coluna Direita: Grid 2x2 com os 4 Cards Exatos do Genspark */}
      <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Card 1: Rascunho do Seedance 2.5 [NOVO] */}
        <button
          type="button"
          onClick={() =>
            onSelectFeaturePrompt(
              'Rascunho rápido em 480p para testar transição de câmera, iluminação de golden hour e movimento dinâmico do personagem.',
              'video',
            )
          }
          className="p-4 rounded-2xl bg-card border border-border/80 hover:border-purple-500/50 hover:shadow-lg transition-all text-left flex flex-col justify-between group shadow-xs"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-sm">
              M
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Vídeo
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-extrabold text-foreground group-hover:text-purple-600 transition-colors">
                Rascunho do Seedance 2.5
              </span>
              <Badge className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0 h-4">
                NOVO
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              Prévia em 480p, finalize a melhor tomada com rapidez
            </p>
          </div>
        </button>

        {/* Card 2: Vídeo explicativo [EM ALTA] */}
        <button
          type="button"
          onClick={() =>
            onSelectFeaturePrompt(
              'Vídeo explicativo com animação vetorial em código: infográfico interativo que ilustra o crescimento exponencial de vendas e métricas.',
              'video',
            )
          }
          className="p-4 rounded-2xl bg-card border border-border/80 hover:border-purple-500/50 hover:shadow-lg transition-all text-left flex flex-col justify-between group shadow-xs"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm">
              ✨
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Agente
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-extrabold text-foreground group-hover:text-purple-600 transition-colors">
                Vídeo explicativo
              </span>
              <Badge className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0 h-4">
                EM ALTA
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              Vídeo em código, cada quadro editável e animado
            </p>
          </div>
        </button>

        {/* Card 3: 3D-BOX [EM ALTA] */}
        <button
          type="button"
          onClick={() =>
            onSelectFeaturePrompt(
              'Composição 3D isométrica de produto de luxo com vidro fosco, iluminação volumétrica e reflexos cáusticos realistas.',
              '3d',
            )
          }
          className="p-4 rounded-2xl bg-card border border-border/80 hover:border-purple-500/50 hover:shadow-lg transition-all text-left flex flex-col justify-between group shadow-xs"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black text-sm">
              🧊
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              3D
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-extrabold text-foreground group-hover:text-purple-600 transition-colors">
                3D-BOX
              </span>
              <Badge className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0 h-4">
                EM ALTA
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              Monte em 3D, finalize com realismo e física apurada
            </p>
          </div>
        </button>

        {/* Card 4: Magia MidiaViva [NOVO] (Magia Genspark renomeada para a casa) */}
        <button
          type="button"
          onClick={() =>
            onSelectFeaturePrompt(
              'Mantenha a coreografia e movimentos originais, substituindo o cenário por um ambiente futurista neon com partículas cintilantes.',
              'video',
            )
          }
          className="p-4 rounded-2xl bg-card border border-border/80 hover:border-purple-500/50 hover:shadow-lg transition-all text-left flex flex-col justify-between group shadow-xs"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-sm">
              🪄
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Troca
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-extrabold text-foreground group-hover:text-purple-600 transition-colors">
                Magia MidiaViva
              </span>
              <Badge className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0 h-4">
                NOVO
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              Mesmos movimentos, troque o resto com inteligência artificial
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}
export default StudioFeatureCards
