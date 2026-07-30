import { useState } from 'react'
import { Sparkles, HelpCircle } from 'lucide-react'
import { LandingHeader } from '@/components/landing/Header'
import { WaitlistForm } from '@/components/landing/WaitlistForm'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { ManifestoSection } from '@/components/landing/ManifestoSection'
import { PricingSection } from '@/components/landing/PricingSection'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(undefined)

  const handleSelectPlan = (plan: string) => {
    setSelectedPlan(plan)
    const formElement = document.getElementById('waitlist-form')
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 antialiased selection:bg-purple-500 selection:text-white">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-20 lg:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-200/40 via-purple-50/20 to-transparent" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Hero Content Left */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50/80 px-3.5 py-1.5 text-xs font-bold text-purple-700 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Lançamento em Breve
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
                Pare de improvisar. <br />
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Comece a crescer.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl font-medium">
                Postar "qualquer coisa" não é estratégia. Transforme sua presença digital com Seu
                Sistema Operacional de Marketing.
              </p>

              <FeaturesSection />
            </div>

            {/* Waitlist Form Right */}
            <div className="lg:col-span-5">
              <WaitlistForm
                selectedPlan={selectedPlan}
                onPlanClear={() => setSelectedPlan(undefined)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto Section */}
      <ManifestoSection />

      {/* Pricing Section */}
      <PricingSection onSelectPlan={handleSelectPlan} />

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center justify-center gap-2">
              <HelpCircle className="h-6 w-6 text-purple-600" />
              Perguntas Frequentes
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem
              value="item-1"
              className="bg-white rounded-2xl border border-slate-200 px-6"
            >
              <AccordionTrigger className="text-left font-bold text-slate-900 py-4">
                Quando a MídiaViva será lançada?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4 text-sm leading-relaxed">
                Estamos finalizando os últimos ajustes do sistema. Os convites da lista VIP serão
                enviados em breve por ordem de inscrição.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-2"
              className="bg-white rounded-2xl border border-slate-200 px-6"
            >
              <AccordionTrigger className="text-left font-bold text-slate-900 py-4">
                Quais as vantagens de entrar na lista de espera?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4 text-sm leading-relaxed">
                Quem entra para a lista VIP garante acesso prioritário, bônus exclusivo de créditos
                de IA e descontos especiais nos planos Pro e Advanced.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-3"
              className="bg-white rounded-2xl border border-slate-200 px-6"
            >
              <AccordionTrigger className="text-left font-bold text-slate-900 py-4">
                Preciso cadastrar cartão de crédito agora?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-4 text-sm leading-relaxed">
                Não! A inscrição na lista de espera é 100% gratuita e sem compromisso.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4">
          <p>
            © {new Date().getFullYear()} MídiaViva. Todos os direitos reservados. Seu Sistema
            Operacional de Marketing.
          </p>
        </div>
      </footer>
    </div>
  )
}
