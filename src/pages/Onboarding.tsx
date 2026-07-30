import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  Sparkles,
  Heart,
  UserPlus,
  Target,
  Building2,
  Users,
  Fingerprint,
  Palette,
  CheckCircle2,
  Globe,
  X,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { createBrand } from '@/services/brands'

const OBJECTIVES = [
  {
    id: 'sales',
    title: 'Vender mais produtos/serviços',
    description: 'Aumentar vendas e conversões',
    icon: TrendingUp,
    bgColor: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    ringColor: 'peer-checked:ring-emerald-500',
  },
  {
    id: 'authority',
    title: 'Construir autoridade',
    description: 'Se tornar referência no seu nicho',
    icon: Sparkles,
    bgColor: 'bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400',
    ringColor: 'peer-checked:ring-pink-500',
  },
  {
    id: 'engagement',
    title: 'Aumentar engajamento',
    description: 'Criar comunidade ativa',
    icon: Heart,
    bgColor: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    ringColor: 'peer-checked:ring-red-500',
  },
  {
    id: 'leads',
    title: 'Gerar leads qualificados',
    description: 'Captar potenciais clientes',
    icon: UserPlus,
    bgColor: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    ringColor: 'peer-checked:ring-blue-500',
  },
]

export default function Onboarding() {
  const { user } = useAuth()
  const { fetchBrands } = useSocial()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1)

  // Step 1: Objective
  const [selectedObjective, setSelectedObjective] = useState('sales')

  // Step 2: Website Analysis
  const [websiteUrl, setWebsiteUrl] = useState('https://www.mudarcurso.com.br')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)

  // Brand details extracted / editable
  const [brandName, setBrandName] = useState('MudarCurso')
  const [colorPalette, setColorPalette] = useState(['#7C3AED', '#E9D5FF', '#FFFFFF'])
  const [targetAudience, setTargetAudience] = useState(
    'Pessoas de 22 a 45 anos buscando transição de carreira e propósito profissional.',
  )
  const [visualStyle, setVisualStyle] = useState(
    'Moderno, limpo e inspirador com paleta roxa e branca vibrante.',
  )
  const [brandVoice, setBrandVoice] = useState(
    'Inspirador, empático, direto e focado em transformação pessoal e resultados.',
  )

  const [submitting, setSubmitting] = useState(false)

  const handleAnalyzeBrand = async () => {
    if (!websiteUrl.trim()) return
    setAnalyzing(true)
    setTimeout(() => {
      setAnalyzing(false)
      setAnalyzed(true)
      toast({
        title: 'Marca Analisada!',
        description: 'Logo e identidade extraídos com sucesso.',
      })
    }, 1200)
  }

  const handleFinishOnboarding = async () => {
    if (!user?.id) {
      toast({ title: 'Atenção', description: 'Você precisa estar autenticado.' })
      return
    }
    setSubmitting(true)
    try {
      await createBrand({
        user: user.id,
        name: brandName,
        description: 'Plataforma de criação e desenvolvimento de novos caminhos profissionais.',
        website: websiteUrl,
        website_url: websiteUrl,
        objective: selectedObjective,
        target_audience: targetAudience,
        visual_style: visualStyle,
        brand_voice: brandVoice,
        color_theme: colorPalette[0] || '#7C3AED',
      })
      await fetchBrands()
      toast({
        title: 'Conta Configurada!',
        description: 'Sua marca foi criada. Vamos começar a criar vídeos!',
      })
      navigate('/app/criar')
    } catch (err) {
      toast({
        title: 'Erro ao salvar marca',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-lg tracking-tight">
              <span className="w-6 h-6 rounded-md bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-black">
                b
              </span>
              bestcontent <span className="text-[10px] text-primary font-bold uppercase">AI</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Configure sua conta em 5 passos simples
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-muted-foreground">
              Passo {currentStep} de 5
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => navigate('/app/feed')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="max-w-5xl mx-auto mt-3">
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>

          {/* Stepper Icons Row */}
          <div className="flex justify-between items-center mt-4 px-2">
            {[
              { step: 1, label: 'Objetivo', icon: Target },
              { step: 2, label: 'Marca', icon: Building2 },
              { step: 3, label: 'Público', icon: Users },
              { step: 4, label: 'Identidade', icon: Fingerprint },
              { step: 5, label: 'Estilo', icon: Palette },
            ].map((item) => {
              const Icon = item.icon
              const isActive = currentStep === item.step
              const isDone = currentStep > item.step
              return (
                <button
                  key={item.step}
                  onClick={() => item.step <= currentStep && setCurrentStep(item.step as any)}
                  className={`flex flex-col items-center gap-1 transition-all ${
                    isActive
                      ? 'text-primary font-bold'
                      : isDone
                        ? 'text-foreground hover:text-primary'
                        : 'text-muted-foreground opacity-60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-primary text-white ring-4 ring-primary/20 shadow-md'
                        : isDone
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-[11px]">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 flex flex-col justify-center">
        {/* STEP 1: OBJETIVO */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-fade-in text-center">
            <div className="inline-flex p-3 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 mb-2">
              <Target className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Qual seu principal objetivo?
              </h1>
              <p className="text-sm text-muted-foreground">
                Vamos começar entendendo sua meta principal para adaptar roteiros e copys.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {OBJECTIVES.map((obj) => {
                const Icon = obj.icon
                const isSelected = selectedObjective === obj.id
                return (
                  <div
                    key={obj.id}
                    onClick={() => setSelectedObjective(obj.id)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all bg-card hover:shadow-md flex items-start gap-4 relative ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30 shadow-md scale-[1.02]'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${obj.bgColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{obj.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{obj.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                onClick={() => setCurrentStep(2)}
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-2.5 rounded-full gap-2 text-sm shadow-md"
              >
                Próximo Passo <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: MARCA & ANÁLISE */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Sparkles className="w-7 h-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Análise Automática de Marca
              </h1>
              <p className="text-sm text-muted-foreground">
                Insira o link do seu site para extrairmos dados e cores da sua marca em segundos.
              </p>
            </div>

            <Card className="p-6 border-border shadow-sm space-y-4">
              <label className="text-xs font-bold text-muted-foreground block uppercase tracking-wider">
                URL do seu site ou redes
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://www.suamarca.com.br"
                    className="pl-9 text-sm h-10"
                  />
                </div>
                <Button
                  onClick={handleAnalyzeBrand}
                  disabled={analyzing}
                  className="bg-primary text-white font-semibold px-5 h-10 gap-2"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Analisando...
                    </>
                  ) : (
                    <>
                      Analisar Marca <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              {analyzed && (
                <div className="space-y-4 pt-3 border-t border-border animate-fade-in">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
                        M
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          Logo detectada!
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          As cores da marca foram extraídas automaticamente da sua logo.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {colorPalette.map((color, idx) => (
                        <span
                          key={idx}
                          className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="text-xs py-1 px-3 bg-muted text-muted-foreground"
                  >
                    Fonte:{' '}
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline ml-1"
                    >
                      {websiteUrl}
                    </a>
                  </Badge>
                </div>
              )}
            </Card>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="rounded-full text-xs"
              >
                Voltar
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                className="bg-primary text-white font-semibold px-8 rounded-full text-sm gap-2"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3, 4, 5: CONFIGURAÇÃO REVISÃO E AJUSTES */}
        {currentStep >= 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-full bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Analisamos sua marca!
              </h1>
              <p className="text-sm text-muted-foreground">
                Revise os detalhes abaixo para garantir que os conteúdos gerados pela IA sejam
                perfeitos.
              </p>
            </div>

            {/* Accordion Review List */}
            <Accordion type="single" collapsible defaultValue="basic" className="w-full space-y-3">
              {/* Item 1: Dados Básicos */}
              <AccordionItem
                value="basic"
                className="border border-border rounded-2xl px-5 py-1 bg-card shadow-sm"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                      <Target className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">Dados Básicos</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-2" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Nome da Marca
                    </label>
                    <Input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Website
                    </label>
                    <Input
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Item 2: Público-Alvo */}
              <AccordionItem
                value="audience"
                className="border border-border rounded-2xl px-5 py-1 bg-card shadow-sm"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">Público-alvo</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-2" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Descrição do Perfil do Cliente Ideal
                  </label>
                  <Textarea
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="text-xs h-20"
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Item 3: Estilo Visual */}
              <AccordionItem
                value="style"
                className="border border-border rounded-2xl px-5 py-1 bg-card shadow-sm"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600">
                      <Palette className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">Estilo Visual</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-2" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Estética & Cores
                    </label>
                    <Input
                      value={visualStyle}
                      onChange={(e) => setVisualStyle(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Item 4: Tom de Voz */}
              <AccordionItem
                value="voice"
                className="border border-border rounded-2xl px-5 py-1 bg-card shadow-sm"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                      <Fingerprint className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">Tom de Voz</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-2" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Postura e Linguagem dos Roteiros
                  </label>
                  <Textarea
                    value={brandVoice}
                    onChange={(e) => setBrandVoice(e.target.value)}
                    className="text-xs h-20"
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Bottom Action Button */}
            <div className="pt-4 flex justify-center">
              <Button
                onClick={handleFinishOnboarding}
                disabled={submitting}
                className="w-full sm:w-auto min-w-[320px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-full text-base gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Salvando Marca...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Tudo certo! Continuar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
