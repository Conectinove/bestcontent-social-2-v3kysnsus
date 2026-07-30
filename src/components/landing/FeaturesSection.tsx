import { Sparkles, Calendar, ShieldCheck, BarChart3 } from 'lucide-react'

export function FeaturesSection() {
  const features = [
    {
      icon: Sparkles,
      title: 'Criação Inteligente',
      description: 'Direcione sua comunicação com IA focada em conversão.',
    },
    {
      icon: Calendar,
      title: 'Controle Editorial',
      description: 'Organize, planeje e distribua seu conteúdo com um sistema eficiente.',
    },
    {
      icon: ShieldCheck,
      title: 'Identidade Preservada',
      description: 'Templates e prompts que aprendem como você fala, mantendo sua essência.',
    },
    {
      icon: BarChart3,
      title: 'Direção por Dados',
      description: 'Entenda o que funciona e replique o sucesso. Métricas que realmente importam.',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-8">
      {features.map((feat, index) => {
        const Icon = feat.icon
        return (
          <div
            key={index}
            className="flex items-start gap-4 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-purple-50 shadow-sm hover:border-purple-200 transition-all"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base">{feat.title}</h4>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">{feat.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
