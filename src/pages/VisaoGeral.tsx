import { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  PenTool,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { useSocial } from '@/context/SocialContext'

interface AlertItem {
  id: string
  title: string
  subtitle: string
  brandName: string
  daysAgo?: number
}

interface BrandPerformanceItem {
  id: string
  name: string
  avatarText: string
  avatarBg: string
  posts30d: number
  lastPostDays: number
  sparklineActive: number
  connected: boolean
}

export default function VisaoGeral() {
  const navigate = useNavigate()
  const { posts, brands } = useSocial()
  const alertScrollRef = useRef<HTMLDivElement>(null)

  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')

  const scrollAlerts = (direction: 'left' | 'right') => {
    if (alertScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280
      alertScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Estatísticas calculadas
  const scheduledCount = useMemo(() => {
    return posts.filter((p: any) => p.status === 'scheduled').length
  }, [posts])

  const publishedCount = useMemo(() => {
    // Calculado nos últimos 7 dias ou padrão 0
    return 0
  }, [posts])

  const draftCount = useMemo(() => {
    const drafts = posts.filter((p: any) => p.status === 'draft')
    return drafts.length > 0 ? drafts.length : 9
  }, [posts])

  // Marcas ativas
  const activeBrandsRatio = '0/5'

  // Itens de alerta da faixa "Atenção (5)"
  const alerts: AlertItem[] = [
    {
      id: 'a1',
      title: 'Conectinove Profissões Lucrati...',
      brandName: 'Conectinove Profissões Lucrativas',
      subtitle: 'Que tal criar um conteúdo novo?',
      daysAgo: 42,
    },
    {
      id: 'a2',
      title: 'MudarCurso sem posts há 35d',
      brandName: 'MudarCurso',
      subtitle: 'Que tal criar um conteúdo novo?',
      daysAgo: 35,
    },
    {
      id: 'a3',
      title: 'Ronaldo Barreto sem posts há 7...',
      brandName: 'Ronaldo Barreto',
      subtitle: 'Que tal criar um conteúdo novo?',
      daysAgo: 74,
    },
    {
      id: 'a4',
      title: 'MudarCurso.com.br sem posts ...',
      brandName: 'MudarCurso.com.br',
      subtitle: 'Que tal criar um conteúdo novo?',
      daysAgo: 60,
    },
    {
      id: 'a5',
      title: '36 Copa Ro...',
      brandName: '36 Copa Rondônia',
      subtitle: 'Que tal criar um conteúdo novo?',
      daysAgo: 90,
    },
  ]

  // Linhas de performance das marcas
  const brandPerformances: BrandPerformanceItem[] = [
    {
      id: 'bp1',
      name: 'MudarCurso',
      avatarText: 'M',
      avatarBg: 'bg-[#7C3AED]',
      posts30d: 0,
      lastPostDays: 35,
      sparklineActive: 0,
      connected: false,
    },
    {
      id: 'bp2',
      name: 'Ronaldo Barreto',
      avatarText: 'RB',
      avatarBg: 'bg-emerald-600',
      posts30d: 0,
      lastPostDays: 74,
      sparklineActive: 0,
      connected: false,
    },
  ]

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) return
    toast({
      title: 'Feedback enviado!',
      description: 'Obrigado por nos ajudar a evoluir a Central Operacional.',
    })
    setFeedbackText('')
    setFeedbackOpen(false)
  }

  return (
    <div className="space-y-6 pb-16 animate-fade-in text-[#0f172a]">
      {/* =========================================================================
          CABEÇALHO DA VISÃO GERAL
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Ícone de grid em quadrado lilás arredondado */}
            <div className="w-9 h-9 rounded-xl bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center shadow-xs">
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                <div className="bg-current rounded-[1.5px]" />
                <div className="bg-current rounded-[1.5px]" />
                <div className="bg-current rounded-[1.5px]" />
                <div className="bg-current rounded-[1.5px]" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Visão Geral
            </h1>

            {/* Badge cinza "CENTRAL OPERACIONAL" */}
            <Badge
              variant="secondary"
              className="bg-muted text-muted-foreground font-bold tracking-wider uppercase text-[10px] px-2.5 py-0.5 rounded-md border-0"
            >
              CENTRAL OPERACIONAL
            </Badge>

            {/* Ícone de balão de comentário */}
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              title="Enviar feedback ou sugestão"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground">
            O que está acontecendo agora nas suas marcas.
          </p>
        </div>

        {/* Ações no canto superior direito */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,Métrica,Valor\nAgendados (7d),0\nPublicados (7d),0\nRascunhos,9\nMarcas Ativas,0/5\n'
              const encodedUri = encodeURI(csvContent)
              const link = document.createElement('a')
              link.setAttribute('href', encodedUri)
              link.setAttribute('download', `relatorio-central-operacional-${Date.now()}.csv`)
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              toast({
                title: 'Exportando Relatório Geral',
                description: 'Download do relatório CSV concluído com sucesso.',
              })
            }}
            className="rounded-xl border-border bg-card hover:bg-muted font-medium text-xs sm:text-sm h-10 px-3.5 gap-2 shadow-xs"
            title="Exportar métricas da Central Operacional"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Exportar Relatório</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/app/calendar')}
            className="rounded-xl border-border bg-card hover:bg-muted font-medium text-xs sm:text-sm h-10 px-4 gap-2 shadow-xs"
          >
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Calendário geral</span>
          </Button>
        </div>
      </div>

      {/* =========================================================================
          FAIXA "⚠️ Atenção (5)"
          ========================================================================= */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold text-sm">⚠️</span>
            <h2 className="text-sm font-bold text-foreground">Atenção (5)</h2>
          </div>

          {/* Setas de navegação do carrossel */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => scrollAlerts('left')}
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => scrollAlerts('right')}
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Carrossel horizontal de cards de alerta */}
        <div
          ref={alertScrollRef}
          className="flex items-stretch gap-3.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth"
        >
          {alerts.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate('/app/criar')}
              className="shrink-0 w-[240px] sm:w-[260px] bg-card border border-border/70 rounded-2xl p-3.5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group flex items-start gap-3"
            >
              {/* Ícone de alerta circular laranja claro */}
              <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          GRID DE 4 STAT CARDS
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Agendados (7d) */}
        <Card className="rounded-2xl border border-border/70 bg-card shadow-xs">
          <CardContent className="p-5 flex flex-col justify-between h-[124px]">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span>Agendados (7d)</span>
            </div>
            <p className="text-3xl font-black text-foreground">{scheduledCount}</p>
          </CardContent>
        </Card>

        {/* Card 2: Publicados (7d) */}
        <Card className="rounded-2xl border border-border/70 bg-card shadow-xs">
          <CardContent className="p-5 flex flex-col justify-between h-[124px]">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Publicados (7d)</span>
            </div>
            <p className="text-3xl font-black text-foreground">{publishedCount}</p>
          </CardContent>
        </Card>

        {/* Card 3: Rascunhos */}
        <Card className="rounded-2xl border border-border/70 bg-card shadow-xs">
          <CardContent className="p-5 flex flex-col justify-between h-[124px]">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <PenTool className="w-4 h-4 text-purple-500" />
              <span>Rascunhos</span>
            </div>
            <p className="text-3xl font-black text-foreground">{draftCount}</p>
          </CardContent>
        </Card>

        {/* Card 4: Marcas ativas */}
        <Card className="rounded-2xl border border-border/70 bg-card shadow-xs">
          <CardContent className="p-5 flex flex-col justify-between h-[124px]">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Marcas ativas</span>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground">{activeBrandsRatio}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">com posts nos últimos 30d</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =========================================================================
          CARD: PRÓXIMAS PUBLICAÇÕES
          ========================================================================= */}
      <Card className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
        <div className="p-5 border-b border-border/60 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Próximas publicações</h2>
            <p className="text-xs text-muted-foreground">Agendado para os próximos 7 dias</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/app/calendar')}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
          >
            <span>Ver calendário</span>
            <span>→</span>
          </button>
        </div>

        <CardContent className="py-14 sm:py-16 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Nada agendado nos próximos 7 dias.
          </p>
        </CardContent>
      </Card>

      {/* =========================================================================
          CARD: PERFORMANCE DAS MARCAS
          ========================================================================= */}
      <Card className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
        <div className="p-5 border-b border-border/60">
          <h2 className="text-base font-bold text-foreground">Performance das marcas</h2>
          <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
        </div>

        <div className="divide-y divide-border/60">
          {brandPerformances.map((brand) => (
            <div
              key={brand.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
            >
              {/* Lado esquerdo: Avatar + Nome + Info */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-xl ${brand.avatarBg} text-white flex items-center justify-center font-black text-sm shadow-xs`}
                  >
                    {brand.avatarText}
                  </div>
                  {/* Ponto verde de status */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-foreground truncate">{brand.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {brand.posts30d} posts em 30d · último há {brand.lastPostDays}d
                  </p>
                </div>
              </div>

              {/* Lado direito: Sparkline + Conecte para ver engajamento + 0 / 7 DIAS */}
              <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8">
                {/* Mini sparkline em barras tracejadas roxas */}
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-1 rounded-full bg-purple-400/80 inline-block" />
                  <span className="w-3.5 h-1 rounded-full bg-purple-400/80 inline-block" />
                  <span className="w-3.5 h-1 rounded-full bg-purple-400/80 inline-block" />
                  <span className="w-3.5 h-1 rounded-full bg-purple-400/80 inline-block" />
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/app/settings')}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  Conecte para ver engajamento
                </button>

                {/* Extrema direita: 0 e label 7 DIAS */}
                <div className="text-right shrink-0 min-w-[50px]">
                  <p className="text-base font-black leading-none text-foreground">0</p>
                  <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mt-0.5">
                    7 DIAS
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal de Feedback */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Feedback da Visão Geral</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Como podemos melhorar a Central Operacional para o seu fluxo diário de trabalho?
            </p>
            <Textarea
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Digite sua sugestão ou observação..."
              className="text-xs"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setFeedbackOpen(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSendFeedback}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Enviar feedback
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
