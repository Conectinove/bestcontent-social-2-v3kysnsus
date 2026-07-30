import { Check, Star, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PricingSectionProps {
  onSelectPlan: (plan: string) => void
}

interface Plan {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  ctaAction: () => void
  highlighted: boolean
  icon: typeof Star
}

export function PricingSection({ onSelectPlan }: PricingSectionProps) {
  const plans: Plan[] = [
    {
      name: 'Free',
      price: 'R$ 0',
      period: '/mês',
      description: 'Para começar a organizar suas redes sociais.',
      features: [
        '1 Usuário',
        '1 Marca',
        '20 conteúdos/mês',
        '50 créditos de IA',
        'Editor Básico',
        'Calendário Básico',
      ],
      cta: 'Entrar na Lista',
      ctaAction: () => onSelectPlan('Free'),
      highlighted: false,
      icon: Check,
    },
    {
      name: 'Pro',
      price: 'R$ 59',
      period: '/mês',
      description: 'Para quem leva crescimento a sério.',
      features: [
        '3 Usuários',
        '5 Marcas',
        '200 conteúdos/mês',
        '500 créditos de IA',
        'Editor Completo',
        'Calendário Avançado',
        "Sem Marca d'Água",
        'Suporte Prioritário',
      ],
      cta: 'Garantir Vaga VIP',
      ctaAction: () => onSelectPlan('Pro'),
      highlighted: true,
      icon: Star,
    },
    {
      name: 'Advanced',
      price: 'R$ 149',
      period: '/mês',
      description: 'Para agências e equipes em escala.',
      features: [
        '10 Usuários',
        'Marcas Ilimitadas',
        'Conteúdo Ilimitado',
        '2000 créditos de IA',
        'Automações',
        'Insights Avançados',
        'Aprovação em Múltiplos Níveis',
      ],
      cta: 'Falar com Vendas',
      ctaAction: () => {
        window.location.href = 'mailto:vendas@mediaviva.com.br?subject=Plano Advanced - MídiaViva'
      },
      highlighted: false,
      icon: MessageCircle,
    },
  ]

  return (
    <section className="py-16 sm:py-24 bg-white border-t border-slate-200/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
            Planos & Preços
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Escolha seu plano de crescimento
          </h2>
          <p className="mt-3 text-lg text-slate-600 leading-relaxed">
            Comece grátis e evolua conforme sua estratégia cresce. Sem fidelidade, sem burocracia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.name}
                className={cn(
                  'relative rounded-3xl border p-6 sm:p-8 transition-all duration-300',
                  plan.highlighted
                    ? 'border-purple-300 bg-gradient-to-b from-purple-50/80 to-white shadow-2xl shadow-purple-500/15 md:scale-105 md:-mt-2'
                    : 'border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md',
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30">
                      <Star className="h-3.5 w-3.5 fill-white" />
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div
                    className={cn(
                      'mb-4 flex h-12 w-12 items-center justify-center rounded-xl',
                      plan.highlighted
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-100 text-purple-600',
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                </div>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-sm font-medium text-slate-500">{plan.period}</span>
                </div>

                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check
                        className={cn(
                          'h-4.5 w-4.5 shrink-0 mt-0.5',
                          plan.highlighted ? 'text-purple-600' : 'text-slate-400',
                        )}
                      />
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={plan.ctaAction}
                  className={cn(
                    'w-full h-12 rounded-xl font-bold transition-all text-sm',
                    plan.highlighted
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25 hover:from-purple-700 hover:to-indigo-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800',
                  )}
                >
                  {plan.cta}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
