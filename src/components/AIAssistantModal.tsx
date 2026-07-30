import { useState } from 'react'
import { Sparkles, Loader2, Copy, Check, Wand2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'

interface AIAssistantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplyText: (text: string, hashtags?: string[]) => void
  initialTopic?: string
}

export function AIAssistantModal({
  open,
  onOpenChange,
  onApplyText,
  initialTopic = '',
}: AIAssistantModalProps) {
  const [topic, setTopic] = useState(initialTopic)
  const [tone, setTone] = useState<'casual' | 'profissional' | 'engraçado' | 'inspiracional'>(
    'casual',
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResult, setGeneratedResult] = useState<{
    caption: string
    hashtags: string[]
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast({ title: 'Atenção', description: 'Por favor, insira um tema ou palavras-chave.' })
      return
    }

    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      const suggestions = {
        casual: {
          caption: `Gente, vocês também sentem que o dia só começa de verdade depois daquele momento especial? ✨ Se liga nessa dica incrível que preparamos para tornar a sua rotina muito mais leve e produtiva! Quer saber mais? Deixa um comentário aqui! 👇`,
          hashtags: ['#DicaDoDia', '#RotinaLeve', '#Bastidores', '#VidaReal'],
        },
        profissional: {
          caption: `A inovação e a atenção aos detalhes são pilares fundamentais para alcançar resultados de alta performance. Apresentamos uma visão estratégica sobre como otimizar seus processos e impactar positivamente seus resultados. Saiba mais no link da bio.`,
          hashtags: ['#Inovacao', '#Estrategia', '#Negocios', '#AltaPerformance'],
        },
        engraçado: {
          caption: `Aquele momento em que você percebe que a semana mal começou e você já precisa de três vidas extras 😂 Fica tranquilo que a solução tá bem na sua frente! Compartilha com aquele amigo que precisa ver isso hoje! 🚀`,
          hashtags: ['#Meme', '#HumorSemanal', '#QuemNunca', '#Relaxa'],
        },
        inspiracional: {
          caption: `Grandes transformações começam com pequenos passos consistentes todos os dias. Acredite no seu potencial e celebre cada pequena vitória na sua jornada. Onde você quer chegar até o final deste ano? 🌱✨`,
          hashtags: ['#Motivacao', '#Inspiração', '#FocoNoObjetivo', '#MentePositiva'],
        },
      }

      setGeneratedResult(suggestions[tone])
    }, 1200)
  }

  const handleApply = () => {
    if (generatedResult) {
      onApplyText(generatedResult.caption, generatedResult.hashtags)
      onOpenChange(false)
      toast({ title: 'Sucesso!', description: 'Texto e hashtags aplicados ao post.' })
    }
  }

  const handleCopy = () => {
    if (generatedResult) {
      navigator.clipboard.writeText(
        `${generatedResult.caption}\n\n${generatedResult.hashtags.join(' ')}`,
      )
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
            Assistente de IA BestContent
          </DialogTitle>
          <DialogDescription>
            Gere legendas cativantes e hashtags otimizadas de acordo com o tom da sua marca.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Sobre o que é o seu post?
            </label>
            <Textarea
              placeholder="Ex: Lançamento do novo café de inverno com notas de avelã..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="text-sm h-20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Tom de Voz</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['casual', 'profissional', 'engraçado', 'inspiracional'] as const).map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={tone === t ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTone(t)}
                  className={`capitalize text-xs ${tone === t ? 'bg-primary text-white' : ''}`}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-primary via-pink-500 to-purple-600 text-white font-medium"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando magia com IA...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Gerar Legenda com IA
              </>
            )}
          </Button>

          {generatedResult && (
            <div className="p-3 rounded-lg bg-muted border border-border space-y-3 animate-fade-in text-xs">
              <div>
                <span className="font-semibold text-foreground block mb-1">Legenda Sugerida:</span>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {generatedResult.caption}
                </p>
              </div>
              <div>
                <span className="font-semibold text-foreground block mb-1">
                  Hashtags Sugeridas:
                </span>
                <div className="flex flex-wrap gap-1">
                  {generatedResult.hashtags.map((h) => (
                    <span
                      key={h}
                      className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] font-medium"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Button
                  size="sm"
                  onClick={handleApply}
                  className="bg-primary text-white flex-1 text-xs"
                >
                  Usar no meu post
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopy} className="text-xs">
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
