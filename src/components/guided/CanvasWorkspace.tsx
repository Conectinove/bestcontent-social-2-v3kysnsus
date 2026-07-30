import { ChangeEvent } from 'react'
import {
  Type,
  Shapes,
  Image as ImageIcon,
  RotateCcw,
  Undo,
  Redo,
  Upload,
  Plus,
  Copy,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BookOpen,
  UserCheck,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StructuredPostData } from '@/services/social_studio'

export type ThemePreset = 'purple' | 'dark' | 'orange' | 'blue' | 'green'

interface CanvasWorkspaceProps {
  postData: StructuredPostData
  bgTheme: ThemePreset
  customBgImage: string
  onBgUpload: (e: ChangeEvent<HTMLInputElement>) => void
  onSelectTheme: (theme: ThemePreset) => void
  onToolClick?: (toolName: string) => void
}

export function CanvasWorkspace({
  postData,
  bgTheme,
  customBgImage,
  onBgUpload,
  onSelectTheme,
  onToolClick,
}: CanvasWorkspaceProps) {
  const getThemeClasses = () => {
    switch (bgTheme) {
      case 'purple':
        return 'bg-gradient-to-b from-indigo-950 via-purple-900 to-indigo-900 border-purple-500/30'
      case 'dark':
        return 'bg-gradient-to-b from-slate-950 via-slate-900 to-zinc-950 border-slate-700/50'
      case 'orange':
        return 'bg-gradient-to-b from-orange-950 via-amber-900 to-purple-950 border-orange-500/30'
      case 'blue':
        return 'bg-gradient-to-b from-blue-950 via-cyan-900 to-blue-950 border-blue-500/30'
      case 'green':
        return 'bg-gradient-to-b from-emerald-950 via-green-900 to-teal-950 border-emerald-500/30'
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center gap-6 w-full max-w-2xl justify-center">
        {/* Left Toolbar */}
        <div className="bg-card border border-border rounded-2xl p-2 flex flex-col gap-3 shadow-md shrink-0">
          <div className="flex flex-col gap-1 pb-2 border-b border-border text-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Ferramentas
            </span>
            <div className="flex items-center justify-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <Undo className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <Redo className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <button
            onClick={() => onToolClick?.('Texto')}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors text-xs gap-1"
          >
            <Type className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-medium">Texto</span>
          </button>

          <button
            onClick={() => onToolClick?.('Elementos')}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors text-xs gap-1"
          >
            <Shapes className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-medium">Elementos</span>
          </button>

          <label className="flex flex-col items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors text-xs gap-1 cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={onBgUpload}
              className="hidden"
            />
            <ImageIcon className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-medium">Imagens</span>
          </label>

          <button
            onClick={() => onToolClick?.('Corrigir')}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors text-xs gap-1 pt-2 border-t border-border"
          >
            <RotateCcw className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-medium text-amber-500">Corrigir</span>
          </button>
        </div>

        {/* Center 9:16 Canvas (1080x1920) */}
        <div className="relative group">
          <div
            className={`w-[340px] sm:w-[360px] h-[640px] rounded-[36px] p-5 text-white shadow-2xl relative flex flex-col justify-between overflow-hidden border-4 transition-all duration-300 ${getThemeClasses()}`}
          >
            {/* Background image overlay with blend mode */}
            {customBgImage && (
              <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none">
                <img
                  src={customBgImage}
                  alt="Background Overlay"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Top Brand Logo Header */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/80 border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5 font-bold tracking-tight">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-[11px] font-extrabold shadow-sm">
                    c
                  </div>
                  <span className="text-sm">cnt9</span>
                  <span className="text-white/40 text-[10px] font-normal">conectinove.com.br</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                  MudarCurso
                </span>
              </div>

              {/* Headline & Subtitle */}
              <div className="text-center space-y-1 pt-1">
                <h2 className="text-2xl font-black leading-tight drop-shadow-md tracking-tight">
                  Cansado de apenas{' '}
                  <span className="text-purple-300 underline decoration-purple-400">existir?</span>
                </h2>
                <h3 className="text-sm font-extrabold text-amber-200 drop-shadow">
                  Chegou a hora de <span className="text-purple-200 font-extrabold">viver</span> a
                  sua vocação.
                </h3>
              </div>
            </div>

            {/* Body Bullet Points Card */}
            <div className="relative z-10 my-auto p-3.5 rounded-2xl bg-black/50 backdrop-blur-md border border-white/15 space-y-2.5 text-xs shadow-xl">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 shrink-0 mt-0.5">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] leading-relaxed text-white/95">
                  A jornada para a sua <strong className="text-purple-200">"Vida Boa"</strong>{' '}
                  começa com um mapa real.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 shrink-0 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] leading-relaxed text-white/95">
                  Chega de se sentir estagnado ou sem direção em 2026.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 shrink-0 mt-0.5">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] leading-relaxed text-white/95">
                  Com o <strong className="text-amber-300">Plano de Bordo Realizador</strong>, você
                  domina sua rotina e encontra propósito.
                </p>
              </div>

              {/* Price Offer Tag Box */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-950/90 to-indigo-950/90 border border-purple-400/40 flex items-center justify-between text-[11px] mt-2 shadow-inner">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-purple-200 font-semibold block">
                    Acesso imediato
                  </span>
                  <span className="text-[10px] text-white/70">Oportunidade especial de</span>
                </div>
                <div className="text-right">
                  <span className="line-through text-white/50 text-[10px] block font-semibold">
                    R$ 1.299,99
                  </span>
                  <span className="font-black text-amber-300 text-sm tracking-wide">
                    por R$ 0,00
                  </span>
                </div>
              </div>

              {/* Extra Badges */}
              <div className="grid grid-cols-2 gap-1.5 text-[9px] pt-1 text-white/80">
                <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1">
                  <span>👥</span> Junte-se aos sonhadores que decidiram agir.
                </div>
                <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1">
                  <span>💡</span> Ferramenta prática para mentes criativas.
                </div>
              </div>
            </div>

            {/* Bottom Call to Action & Footer */}
            <div className="relative z-10 space-y-2 text-center pb-1">
              <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-black text-xs shadow-xl hover:scale-102 transition-transform tracking-wider uppercase flex items-center justify-center gap-1.5 border border-white/20">
                {postData.cta || 'TOQUE AQUI E MUDE TUDO 🚀'}
              </button>

              <div className="text-[10px] text-white/70 flex items-center justify-between px-2 pt-1 font-semibold">
                <span className="tracking-widest text-[9px]">⌃ ARRASTE PARA CIMA</span>
                <span className="text-amber-300 font-bold">
                  {postData.footer || '@ronaldo.barreto1'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Canvas Toolbar Controls */}
      <div className="mt-4 flex items-center gap-4 bg-card border border-border rounded-full px-4 py-2 shadow-sm text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
            1
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="font-semibold text-[11px]">36%</span>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
