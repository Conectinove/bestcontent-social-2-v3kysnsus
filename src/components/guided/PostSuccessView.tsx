import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Share2,
  Download,
  Save,
  Copy,
  PlusCircle,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { sharePost } from '@/lib/share'
import { StructuredPostData } from '@/services/social_studio'

interface PostSuccessViewProps {
  postData: StructuredPostData
  selectedPlatform: string
  bgTheme: string
  customBgImage: string
  onSaveStatus: (status: 'published' | 'scheduled' | 'draft') => Promise<void>
  saving: boolean
}

export function PostSuccessView({
  postData,
  selectedPlatform,
  bgTheme,
  customBgImage,
  onSaveStatus,
  saving,
}: PostSuccessViewProps) {
  const navigate = useNavigate()
  const [caption, setCaption] = useState(
    `Sabe aquele desejo profundo de viver uma vida com mais propósito, leveza e realizações? ✨ Acredite, ele não é um mero sonho distante! A jornada para a 'vida boa' não precisa ser complexa ou cheia de incertezas. Com o Plano de Bordo Realizador, você terá o mapa e a bússola para navegar por águas desconhecidas e descobrir o seu verdadeiro potencial. 🧭\n\nImagine ter clareza sobre seus objetivos, um passo a passo para alcançá-los e a confiança para superar qualquer turbulência. 🚀 Este não é apenas mais um curso, é um convite para você ser o comandante da sua própria história.\n\n#MudarCurso #PlanoDeBordo #PropósitoDeVida #Transformação #Foco2026`,
  )
  const [activeTabPlatform, setActiveTabPlatform] = useState(selectedPlatform.toLowerCase())

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption)
    toast({ title: 'Legenda Copiada!', description: 'Texto copiado para a área de transferência.' })
  }

  const handleDownload = () => {
    toast({
      title: 'Download iniciado',
      description: 'Sua arte no formato 1080x1920 (9:16) foi baixada em alta resolução.',
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Title Header */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-black flex items-center justify-center gap-2">
          Post Criado com Sucesso! 🎉
        </h1>
        <p className="text-xs text-muted-foreground">
          O SOCI está orgulhoso de você! Seu conteúdo está pronto para engajar e converter.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Post Visual Canvas Preview Card */}
        <div className="md:col-span-5 flex flex-col items-center">
          <span className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" /> Preview do Post
          </span>

          <div
            className={`w-[260px] h-[460px] rounded-[28px] p-4 text-white shadow-xl relative flex flex-col justify-between overflow-hidden border-2 border-slate-800 ${
              bgTheme === 'purple'
                ? 'bg-gradient-to-b from-indigo-950 via-purple-900 to-indigo-900'
                : bgTheme === 'dark'
                  ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-zinc-950'
                  : 'bg-gradient-to-b from-orange-950 via-amber-900 to-purple-950'
            }`}
          >
            {customBgImage && (
              <div className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none">
                <img src={customBgImage} alt="Bg" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="relative z-10 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] border-b border-white/10 pb-1">
                <div className="flex items-center gap-1 font-bold">
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white text-[8px]">
                    c
                  </div>
                  <span>cnt9</span>
                </div>
                <span className="text-amber-300 font-bold text-[8px]">MudarCurso</span>
              </div>
              <h3 className="text-sm font-extrabold text-center leading-tight drop-shadow">
                {postData.headline}
              </h3>
            </div>

            <div className="relative z-10 p-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[10px] space-y-1">
              <p className="line-clamp-3 leading-snug text-white/90">{postData.body}</p>
              <div className="p-1 rounded bg-purple-950/80 border border-purple-500/30 flex justify-between text-[9px]">
                <span className="text-purple-200">Acesso imediato</span>
                <span className="text-amber-300 font-bold">R$ 0,00</span>
              </div>
            </div>

            <div className="relative z-10 space-y-1 text-center">
              <div className="py-1.5 px-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-[10px]">
                {postData.cta}
              </div>
              <span className="text-[8px] text-amber-300 block">{postData.footer}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Legenda Final, Platform Selector & Actions */}
        <div className="md:col-span-7 space-y-4">
          <Card className="p-5 space-y-4 border-primary/20 bg-card/90 shadow-md">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <span className="text-primary">•</span> Legenda Final
              </span>
              <Badge variant="outline" className="text-[10px] bg-muted">
                📷 {selectedPlatform}
              </Badge>
            </div>

            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="text-xs h-40 leading-relaxed font-medium bg-background"
            />

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{caption.length}/2000 caracteres · 5/5 hashtags</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setCaption((prev) => `${prev}\n\n✨ Refinado pela IA do Social Studio.`)
                }
                className="text-xs text-primary gap-1 h-6"
              >
                <Sparkles className="w-3.5 h-3.5" /> Refinar com IA
              </Button>
            </div>

            {/* Platform Selector Tags */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-[11px] font-bold text-muted-foreground block">
                Plataformas de destino:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTabPlatform('instagram')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTabPlatform === 'instagram'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  📷 Instagram
                </button>
                <button
                  onClick={() => setActiveTabPlatform('facebook')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTabPlatform === 'facebook'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  📘 Facebook
                </button>
              </div>

              {/* Warning Alert for incompatible platforms */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>LinkedIn não suporta este formato vertical (9:16 Stories).</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <Button
              onClick={() => onSaveStatus('published')}
              disabled={saving}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-xs py-2.5 h-10 gap-2 shadow-md"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Publicar Post Agora
            </Button>

            {/* Action Row */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-xs gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Baixar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sharePost(caption)}
                className="text-xs gap-1"
              >
                <Share2 className="w-3.5 h-3.5" /> Compartilhar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSaveStatus('draft')}
                disabled={saving}
                className="text-xs gap-1"
              >
                <Save className="w-3.5 h-3.5" /> Salvar
              </Button>
            </div>

            {/* Bottom Links */}
            <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCaption}
                className="text-xs gap-1"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar Legenda
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/criar')}
                className="text-xs text-primary gap-1 font-bold"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Criar Novo Post
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
