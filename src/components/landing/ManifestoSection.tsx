import { useState } from 'react'
import { Play, Sparkles, CheckCircle2, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const manifestoScript: { section: string; lines: string[] }[] = [
  {
    section: 'Abertura - Direta e Emocional',
    lines: [
      'Você não abriu o seu negócio para virar escravo do Instagram.',
      'Todo dia é a mesma coisa: a tela em branco, a pressão para postar, a sensação de que você está sempre atrasado. E o pior? O resultado quase nunca compensa o esforço.',
      'Mas e se houvesse um jeito de criar não apenas posts, mas uma máquina de resultados?',
    ],
  },
  {
    section: 'Apresentação BestContent Social 2',
    lines: [
      'Apresentamos a Social 2 Powered by BestContent AI. Não somos apenas um editor. Não somos apenas inteligência artificial. Somos o seu Sistema Operacional de Marketing.',
      'Planeje, crie, aprove e analise. Tudo no mesmo lugar, focado no que importa: crescimento.',
    ],
  },
]

export function ManifestoSection() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-purple-50/50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
            <Sparkles className="h-3.5 w-3.5" /> Nosso Manifesto
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Conheça o Social 2 Powered by BestContent AI
          </h2>
          <p className="mt-3 text-lg text-slate-600 leading-relaxed">
            Assista ao nosso manifesto e descubra como vamos transformar a sua maneira de criar
            conteúdo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <div
              onClick={() => setIsOpen(true)}
              className="group relative cursor-pointer overflow-hidden rounded-3xl border border-purple-200/80 bg-slate-900 shadow-2xl shadow-purple-950/20 aspect-video flex items-center justify-center"
            >
              <img
                src="https://img.usecurling.com/p/1200/675?q=social%20media%20creator%20studio&color=purple"
                alt="Manifesto Social 2"
                className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-purple-950/40 to-transparent" />

              <div className="relative z-10 text-center p-6">
                <Button
                  size="lg"
                  className="h-16 w-16 rounded-full bg-purple-600 text-white shadow-xl shadow-purple-600/50 hover:bg-purple-500 hover:scale-110 transition-all p-0"
                >
                  <Play className="h-8 w-8 fill-white ml-1" />
                </Button>
                <div className="mt-4 font-extrabold text-white text-lg tracking-wide">
                  Reproduzir Manifesto
                </div>
                <span className="text-xs text-purple-200 font-medium">Assista em 1:30 min</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-md space-y-4">
              <blockquote className="text-lg font-bold italic text-slate-800 border-l-4 border-purple-600 pl-4">
                "Você não abriu o seu negócio para virar escravo do Instagram..."
              </blockquote>
              <p className="text-sm text-slate-600 leading-relaxed">
                Apresentamos a BestContent Social 2... Seu Sistema Operacional de Marketing feito
                para simplificar sua rotina e acelerar seus resultados.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span>Chega de improvisar postagens sem estratégia clara.</span>
                </div>
                <div className="flex items-start gap-2 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span>Crie com IA mantendo a essência e o tom da sua marca.</span>
                </div>
                <div className="flex items-start gap-2 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <span>Organização completa do planejamento à publicação.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Manifesto Script */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="rounded-3xl border border-purple-100 bg-white p-8 sm:p-10 shadow-md">
            <div className="flex items-center gap-2 mb-8">
              <Quote className="h-6 w-6 text-purple-600" />
              <h3 className="text-xl font-black text-slate-900">Roteiro Completo do Manifesto</h3>
            </div>

            <div className="space-y-8">
              {manifestoScript.map((block, blockIdx) => (
                <div key={blockIdx}>
                  <div className="mb-3 inline-block rounded-lg bg-purple-50 px-3 py-1">
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">
                      {block.section}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {block.lines.map((line, lineIdx) => (
                      <p
                        key={lineIdx}
                        className="text-base text-slate-700 leading-relaxed font-medium pl-4 border-l-2 border-purple-200"
                      >
                        "{line}"
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-950 border-slate-800">
          <DialogHeader className="p-4 border-b border-slate-800 bg-slate-900/50">
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Manifesto Social 2 Powered by BestContent AI
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full bg-black flex items-center justify-center relative">
            <div className="p-8 text-center max-w-xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-600/20 text-purple-400">
                <Play className="h-8 w-8 fill-purple-400 ml-1" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Vídeo do Manifesto Social 2</h3>
              <p className="text-slate-400 text-sm mb-6">
                "Postar 'qualquer coisa' não é estratégia. Transforme sua presença digital com Seu
                Sistema Operacional de Marketing."
              </p>
              <Button onClick={() => setIsOpen(false)} variant="secondary" className="rounded-xl">
                Fechar Apresentação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
