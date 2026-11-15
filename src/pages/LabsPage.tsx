import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FlaskConical,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Search,
  Zap,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Calendar,
  Share2,
  Check,
  ShieldAlert,
  HelpCircle,
  Hash,
  PenTool,
  BarChart2,
  Wand2,
  Globe,
  Mail,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useLabsFeatures } from '@/hooks/use-labs-features'
import { LAB_FEATURES, type LabFeature, type FeatureStatus } from '@/services/labs-features'
import { LabsBlogTab } from '@/components/labs/LabsBlogTab'
import { LabsWebTab } from '@/components/labs/LabsWebTab'
import { LabsEmailTab } from '@/components/labs/LabsEmailTab'
import { LabsPostTab } from '@/components/labs/LabsPostTab'

type LabsTab = 'geral' | 'blog' | 'web' | 'email' | 'post'

const LABS_TABS: { id: LabsTab; label: string; icon: LucideIcon }[] = [
  { id: 'geral', label: 'Visão geral', icon: FlaskConical },
  { id: 'blog', label: 'Blog', icon: BookOpen },
  { id: 'web', label: 'Web', icon: Globe },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'post', label: 'Post', icon: FileText },
]

interface ArticleEntry {
  id: string
  date: string
  title: string
  summary: string
  category: string
  author: string
  readTime: string
  featureId?: string
  targetRoute: string
  featured?: boolean
}

const EDITORIAL_ARTICLES: ArticleEntry[] = [
  {
    id: 'art-1',
    date: '18 de Fevereiro, 2026',
    title: 'A Nova Camada de Customização: Degradês Vetoriais e Contraste em Tempo Real',
    summary:
      'Uma análise aprofundada de como o novo painel de edição do canvas equilibra liberdade criativa com coerência visual automática, mitigando quebras de layout nas redes sociais.',
    category: 'Análise Técnica & Produto',
    author: 'Equipe de Engenharia Visual',
    readTime: '6 min de leitura',
    featureId: 'canvas-advanced-customization',
    targetRoute: '/app/editor/new',
    featured: true,
  },
  {
    id: 'art-2',
    date: '15 de Fevereiro, 2026',
    title: 'O Fim da Logo Ruidosa: Por Que Parâmetros Fechados Garantem Autoridade',
    summary:
      'Por trás das decisões do Logo Kit da MudarCurso: área de segurança proporcional a X, tipografia Archivo Black ancorada e por que monocromia técnica ainda é vital.',
    category: 'Design Systems & Brand',
    author: 'Curadoria de Marca MidiaViva',
    readTime: '5 min de leitura',
    featureId: 'brand-kit-logo-editor',
    targetRoute: '/app/brand-kit',
    featured: true,
  },
  {
    id: 'art-3',
    date: '12 de Fevereiro, 2026',
    title: 'SEO para Redes Sociais: A Anatomia dos Primeiros 100 Caracteres na Descoberta Orgânica',
    summary:
      'Como os motores de busca internos de Instagram e TikTok tratam o gancho inicial e de que maneira a segmentação por intenção supera o antigo excesso de tags.',
    category: 'Algoritmos & Distribuição',
    author: 'Laboratório de Descoberta',
    readTime: '7 min de leitura',
    featureId: 'seo-social-widget',
    targetRoute: '/app/seo',
    featured: true,
  },
  {
    id: 'art-4',
    date: '09 de Fevereiro, 2026',
    title: 'Da Inspiração ao Agendamento: Otimizando o Ciclo de Produção com IA Contextual',
    summary:
      'Uma reflexão editorial sobre a calibração de prompts em redes específicas e como manter autenticidade sem cair na armadilha do texto genérico gerado por máquina.',
    category: 'Inteligência Artificial',
    author: 'BestContent AI Labs',
    readTime: '4 min de leitura',
    featureId: 'ai-voice-tone-engine',
    targetRoute: '/app/criar',
  },
  {
    id: 'art-5',
    date: '04 de Fevereiro, 2026',
    title: 'O Declínio do Hashtag Stuffing e o Triunfo das Tags Semânticas de Nicho',
    summary:
      'Comparamos os limites saudáveis de metadados entre LinkedIn, TikTok e Twitter/X — e como estruturamos o novo gerador algorítmico do MidiaViva.',
    category: 'Crescimento & Métricas',
    author: 'Laboratório de Redes Sociais',
    readTime: '4 min de leitura',
    featureId: 'network-hashtag-generator',
    targetRoute: '/app/content/new',
  },
  {
    id: 'art-6',
    date: '28 de Janeiro, 2026',
    title: 'Campanhas Multi-Formato em Escala: Como Manter a Qualidade com Modo Revisão',
    summary:
      'O desafio de entregar 10 variações por pauta sem cometer deslizes em proporções 9:16 ou chamadas truncadas — o esteira de revisão da Biblioteca.',
    category: 'Fluxo Operacional',
    author: 'Time de Produto',
    readTime: '5 min de leitura',
    featureId: 'campaign-review-mode',
    targetRoute: '/app/library',
  },
]

export function LabsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { features, featureStates, toggleFeature, enableAll, disableAll, activeCount, totalCount } =
    useLabsFeatures()

  const [tab, setTab] = useState<LabsTab>('geral')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  // Contador de toggles usados na sessão/histórico
  const [toggleCount, setToggleCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('midiaviva_labs_toggles_used_count')
      return stored ? parseInt(stored, 10) : 14
    } catch {
      return 14
    }
  })

  // Filtragem dos recursos funcionais
  const filteredFeatures = useMemo(() => {
    return features.filter((feat) => {
      if (categoryFilter !== 'all' && feat.category !== categoryFilter) return false
      if (statusFilter !== 'all' && feat.status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesTitle = feat.title.toLowerCase().includes(q)
        const matchesSubtitle = feat.subtitle.toLowerCase().includes(q)
        const matchesDesc = feat.description.toLowerCase().includes(q)
        const matchesCat = feat.category.toLowerCase().includes(q)
        if (!matchesTitle && !matchesSubtitle && !matchesDesc && !matchesCat) return false
      }
      return true
    })
  }, [features, categoryFilter, statusFilter, searchQuery])

  const incrementToggleCounter = (count = 1) => {
    setToggleCount((prev) => {
      const next = prev + count
      try {
        localStorage.setItem('midiaviva_labs_toggles_used_count', next.toString())
      } catch {
        /* intentionally ignored */
      }
      return next
    })
  }

  const handleToggle = (feature: LabFeature) => {
    const willBeEnabled = !featureStates[feature.id]
    toggleFeature(feature.id)
    incrementToggleCounter(1)
    toast({
      title: willBeEnabled
        ? `Recurso ativado: ${feature.title}`
        : `Recurso desativado: ${feature.title}`,
      description: willBeEnabled
        ? `Os controles de "${feature.title}" agora estão visíveis nas telas correspondentes.`
        : `O recurso foi recolhido das telas para simplificar a interface.`,
    })
  }

  const handleEnableAll = () => {
    enableAll()
    incrementToggleCounter(totalCount)
    toast({
      title: 'Todos os recursos avançados ativados',
      description: `${totalCount} ferramentas experimentais habilitadas em toda a plataforma.`,
    })
  }

  const handleDisableAll = () => {
    disableAll()
    incrementToggleCounter(totalCount)
    toast({
      title: 'Recursos avançados desativados',
      description: 'A interface retornou ao modo essencial simplificado.',
    })
  }

  const handleShareLabs = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
      toast({
        title: 'Link copiado!',
        description: 'Compartilhe o MidiaViva Labs com sua equipe editorial.',
      })
    }
  }

  const getStatusBadge = (status: FeatureStatus) => {
    switch (status) {
      case 'estavel':
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-bold px-2 py-0.5 rounded-full border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 uppercase tracking-wider"
          >
            ● Estável
          </Badge>
        )
      case 'beta':
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-bold px-2 py-0.5 rounded-full border-primary/40 text-primary bg-primary/10 uppercase tracking-wider"
          >
            ✦ Beta
          </Badge>
        )
      case 'experimental':
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-bold px-2 py-0.5 rounded-full border-pink-500/40 text-pink-600 dark:text-pink-400 bg-pink-500/10 uppercase tracking-wider animate-pulse"
          >
            ⚡ Experimental
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-12 pb-24 max-w-6xl mx-auto">
      {/* =========================================================================
          1. MASTHEAD EDITORIAL (ESTÉTICA STRATECHERY ADAPTADA A MIDIAVIVA)
          ========================================================================= */}
      <header className="border-b-2 border-border/80 pb-6 pt-2 space-y-4">
        {/* Top bar do masthead: Edição, Data e Patrocínio */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground border-b border-border/50 pb-3">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
            <span className="font-bold text-foreground">MidiaViva Labs</span>
            <span>&middot;</span>
            <span className="text-primary font-bold">Edição Semanal #48</span>
            <span>&middot;</span>
            <span className="text-muted-foreground">Fevereiro de 2026</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Bloco "Apresentado por BestContent AI" */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px]">
              <span className="text-muted-foreground font-medium">Apresentado por</span>
              <span className="font-black text-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                BestContent AI
              </span>
            </div>

            <button
              type="button"
              onClick={handleShareLabs}
              className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 font-semibold transition-colors"
              title="Copiar link desta edição"
            >
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{copiedLink ? 'Copiado' : 'Compartilhar'}</span>
            </button>
          </div>
        </div>

        {/* Bloco Título do Masthead */}
        <div className="py-2 text-center sm:text-left space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 border border-primary/30 text-xs font-bold text-primary">
            <FlaskConical className="w-3.5 h-3.5 text-primary" />
            <span>Laboratório de Inovação & Edição Avançada</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground font-serif leading-tight">
            MidiaViva <span className="italic text-primary">Labs</span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            Uma publicação editorial contínua e centro de controle para recursos experimentais da
            plataforma. Ative os novos motores visuais, explore ensaios sobre estratégias de
            distribuição social e teste em primeira mão as ferramentas que moldam a próxima geração
            de conteúdo.
          </p>
        </div>

        {/* Sub-menu estilo editorial (só na Visão geral — são âncoras das seções abaixo) */}
        {tab === 'geral' && (
          <div className="flex items-center gap-4 pt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground overflow-x-auto scrollbar-none border-t border-border/40">
            <a href="#laboratorio" className="text-primary hover:underline py-1 shrink-0">
              Laboratório & Toggles ↓
            </a>
            <span>&middot;</span>
            <a
              href="#destaques-semana"
              className="hover:text-foreground hover:underline py-1 shrink-0"
            >
              Esta Semana nos Labs
            </a>
            <span>&middot;</span>
            <a
              href="#artigos-updates"
              className="hover:text-foreground hover:underline py-1 shrink-0"
            >
              Artigos & Ensaios
            </a>
            <span>&middot;</span>
            <Link
              to="/app/brand-kit"
              className="hover:text-foreground hover:underline py-1 shrink-0"
            >
              Brand Kit Oficial
            </Link>
            <span>&middot;</span>
            <Link to="/app/seo" className="hover:text-foreground hover:underline py-1 shrink-0">
              SEO Social
            </Link>
          </div>
        )}

        {/* Navegação por abas do Labs */}
        <nav className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {LABS_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 border',
                tab === t.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-card text-muted-foreground border-border/80 hover:text-foreground hover:border-primary/40',
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Abas de ferramentas: Blog | Web | Email | Post */}
      {tab === 'blog' && <LabsBlogTab />}
      {tab === 'web' && <LabsWebTab />}
      {tab === 'email' && <LabsEmailTab />}
      {tab === 'post' && <LabsPostTab />}

      {/* =========================================================================
          2. VISÃO GERAL — NÚCLEO FUNCIONAL: O LABORATÓRIO DE EDIÇÃO AVANÇADA
          ========================================================================= */}
      {tab === 'geral' && (
        <>
          <section id="laboratorio" className="scroll-mt-6 space-y-6">
            {/* Estatísticas Reais da Central de Edição Avançada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 rounded-2xl border border-primary/30 bg-card flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground">
                    Recursos Ativos
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-foreground">{activeCount}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      / {totalCount} total
                    </span>
                  </div>
                  <p className="text-[11px] text-primary font-semibold">
                    {Math.round((activeCount / (totalCount || 1)) * 100)}% da plataforma turbinada
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 fill-primary/20" />
                </div>
              </Card>

              <Card className="p-4 rounded-2xl border border-border/80 bg-card flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground">
                    Toggles Acionados
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-foreground">{toggleCount}</span>
                    <span className="text-xs text-muted-foreground font-mono">ações</span>
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Histórico persistido em tempo real
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
              </Card>

              <Card className="p-4 rounded-2xl border border-border/80 bg-card flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground">
                    Recurso Mais Usado
                  </span>
                  <div className="text-sm font-black text-foreground truncate max-w-[140px]">
                    Widget SEO Social
                  </div>
                  <p className="text-[11px] text-muted-foreground">Score orgânico & hashtags</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </Card>

              <Card className="p-4 rounded-2xl border border-border/80 bg-card flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground">
                    Estabilidade Geral
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-emerald-600">99.8%</span>
                    <span className="text-xs text-muted-foreground font-mono">uptime</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Zero crash em produção</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FlaskConical className="w-5 h-5" />
                </div>
              </Card>
            </div>

            {/* Header do painel de controle */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-primary text-primary-foreground shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary-foreground/15 backdrop-blur-md flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black">Central de Edição Avançada</h2>
                  <Badge className="bg-primary-foreground/20 text-primary-foreground text-[10px] font-mono uppercase">
                    {activeCount} de {totalCount} ativos
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-primary-foreground/80 max-w-2xl leading-relaxed">
                  Ative ou desative seletivamente os módulos de edição avançada. Suas preferências
                  são salvas instantaneamente no seu navegador e aplicadas aos editores, canvas e
                  ferramentas de IA.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDisableAll}
                  className="rounded-xl text-xs font-bold bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20"
                >
                  Desativar todos
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleEnableAll}
                  className="rounded-xl text-xs font-black bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-md gap-1"
                >
                  <Zap className="w-3.5 h-3.5 fill-primary" />
                  <span>Ativar todos</span>
                </Button>
              </div>
            </div>

            {/* Banner explicativo honesto sobre estabilidade */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-foreground">
                <strong className="font-bold text-amber-700 dark:text-amber-400 block">
                  Nota Editorial de Confiabilidade
                </strong>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Recursos com selo <strong className="text-foreground">Estável</strong> são prontos
                  para produção em contas críticas. Recursos rotulados como{' '}
                  <strong className="text-primary">Beta</strong> ou{' '}
                  <strong className="text-pink-600 dark:text-pink-400">Experimental</strong>{' '}
                  refletem trabalhos em andamento e seus parâmetros ou saídas podem evoluir
                  semanalmente conforme recebemos feedback da redação e dos criadores.
                </p>
              </div>
            </div>

            {/* Barra de Filtros e Busca de Recursos */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Filtrar recursos avançados..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-xl bg-card border-border/80"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Filtros por categoria & status */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs">
                  {[
                    { id: 'all', label: 'Todas as Áreas' },
                    { id: 'Editor & Canvas', label: 'Canvas' },
                    { id: 'Identidade Visual', label: 'Identidade' },
                    { id: 'Otimização & IA', label: 'IA & SEO' },
                    { id: 'Métricas & Relatórios', label: 'Métricas' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryFilter(c.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                        categoryFilter === c.id
                          ? 'bg-primary text-primary-foreground shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs">
                  {[
                    { id: 'all', label: 'Status' },
                    { id: 'estavel', label: 'Estável' },
                    { id: 'beta', label: 'Beta' },
                    { id: 'experimental', label: 'Exp.' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatusFilter(s.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                        statusFilter === s.id
                          ? 'bg-primary text-primary-foreground shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Galeria de Cards dos Recursos Avançados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredFeatures.map((feat) => {
                const isEnabled = featureStates[feat.id] ?? true

                return (
                  <Card
                    key={feat.id}
                    className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                      isEnabled
                        ? 'border-primary/40 bg-card shadow-md shadow-primary/5'
                        : 'border-border/60 bg-muted/20 opacity-75 hover:opacity-95'
                    }`}
                  >
                    {/* Top do card: Categoria, Status, Versão e Toggle */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                            {feat.category}
                          </span>
                          <span className="text-muted-foreground/50">&middot;</span>
                          <span className="text-[10px] font-mono text-primary font-bold">
                            {feat.version}
                          </span>
                          {getStatusBadge(feat.status)}
                        </div>

                        {/* Switch de Ativação do Recurso */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[11px] font-bold ${
                              isEnabled ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          >
                            {isEnabled ? 'Ativo' : 'Desativado'}
                          </span>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => handleToggle(feat)}
                            aria-label={`Ativar ou desativar ${feat.title}`}
                            className="data-[state=checked]:bg-primary"
                          />
                        </div>
                      </div>

                      {/* Título e Subtítulo */}
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                          <span>{feat.title}</span>
                          {feat.id.includes('canvas') && (
                            <Sliders className="w-4 h-4 text-primary shrink-0" />
                          )}
                          {feat.id.includes('brand') && (
                            <PenTool className="w-4 h-4 text-primary shrink-0" />
                          )}
                          {feat.id.includes('seo') && (
                            <Search className="w-4 h-4 text-primary shrink-0" />
                          )}
                          {feat.id.includes('hashtag') && (
                            <Hash className="w-4 h-4 text-primary shrink-0" />
                          )}
                          {feat.id.includes('report') && (
                            <BarChart2 className="w-4 h-4 text-primary shrink-0" />
                          )}
                          {feat.id.includes('tone') && (
                            <Wand2 className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </h3>
                        <p className="text-xs text-primary font-medium mt-0.5 leading-snug">
                          {feat.subtitle}
                        </p>
                      </div>

                      {/* Descrição em Prosa */}
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feat.description}
                      </p>

                      {/* Impacto observável em métricas */}
                      {feat.metricsEffect && (
                        <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-foreground flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>
                            <strong className="text-primary font-semibold">
                              Efeito Observado:
                            </strong>{' '}
                            {feat.metricsEffect}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Rodapé do Card: Metadados editoriais e Botão Abrir */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3 text-xs">
                      <div className="text-[11px] text-muted-foreground truncate">
                        <span>{feat.author}</span> &middot; <span>{feat.readTime}</span>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant={isEnabled ? 'default' : 'outline'}
                        onClick={() => navigate(feat.targetRoute)}
                        className={`rounded-xl text-xs font-bold gap-1.5 shrink-0 ${
                          isEnabled
                            ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs'
                            : 'border-border/80 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span>{feat.targetLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>

            {filteredFeatures.length === 0 && (
              <div className="text-center py-12 p-6 rounded-3xl border border-dashed border-border/80 space-y-3">
                <FlaskConical className="w-10 h-10 text-muted-foreground mx-auto" />
                <h4 className="text-sm font-bold text-foreground">Nenhum recurso encontrado</h4>
                <p className="text-xs text-muted-foreground">
                  Tente redefinir os filtros de busca ou de categoria para visualizar os recursos do
                  Labs.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCategoryFilter('all')
                    setStatusFilter('all')
                    setSearchQuery('')
                  }}
                  className="text-xs rounded-xl"
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </section>

          {/* =========================================================================
            3. SEÇÃO "ESTA SEMANA NOS LABS" (ESTILO "THIS WEEK IN STRATECHERY")
            ========================================================================= */}
          <section
            id="destaques-semana"
            className="scroll-mt-6 space-y-6 pt-4 border-t-2 border-border/80"
          >
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
                  Digest Semanal & Ensaios
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground font-serif">
                  Esta Semana nos Labs
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Três destaques técnicos com contexto de mercado e assinatura editorial.
              </p>
            </div>

            {/* Grid com os 3 Destaques da Semana */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {EDITORIAL_ARTICLES.filter((a) => a.featured).map((item, idx) => (
                <article
                  key={item.id}
                  className="p-6 rounded-3xl bg-card border border-border/80 hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold uppercase border-primary/30 text-primary"
                      >
                        {item.category}
                      </Badge>
                      <span className="font-mono text-[10px]">{item.readTime}</span>
                    </div>

                    <h3 className="text-base font-bold text-foreground font-serif group-hover:text-primary transition-colors leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed">{item.summary}</p>
                  </div>

                  <div className="pt-3 border-t border-border/60 space-y-3">
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span className="font-semibold text-foreground">{item.author}</span>
                      <span className="text-[10px]">{item.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.featureId && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(item.targetRoute)}
                          className="w-full text-xs rounded-xl font-bold border-primary/30 text-primary hover:bg-primary/10 justify-between"
                        >
                          <span>Abrir recurso</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* =========================================================================
            4. SEÇÃO "ARTIGOS E UPDATES" EM LISTA (ESTILO STRATECHERY ARTICLES)
            ========================================================================= */}
          <section
            id="artigos-updates"
            className="scroll-mt-6 space-y-4 pt-4 border-t-2 border-border/80"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
                  Arquivo Cronológico
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-foreground font-serif">
                  Artigos, Ensaios & Notas de Lançamento
                </h2>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {EDITORIAL_ARTICLES.length} Registros
              </Badge>
            </div>

            {/* Lista de Entradas Estilo Ben Thompson */}
            <div className="divide-y divide-border/60 rounded-2xl border border-border/80 bg-card overflow-hidden">
              {EDITORIAL_ARTICLES.map((art) => (
                <div
                  key={art.id}
                  className="p-4 sm:p-5 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 group"
                >
                  <div className="space-y-1.5 flex-1 pr-2">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                      <span className="font-mono text-primary font-bold">{art.date}</span>
                      <span>&middot;</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        {art.category}
                      </Badge>
                      <span>&middot;</span>
                      <span>{art.readTime}</span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-foreground font-serif group-hover:text-primary transition-colors">
                      {art.title}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {art.summary}
                    </p>

                    <p className="text-[11px] text-muted-foreground/80 italic pt-0.5">
                      Por {art.author}
                    </p>
                  </div>

                  <div className="shrink-0 self-end sm:self-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(art.targetRoute)}
                      className="rounded-xl text-xs font-bold text-primary hover:bg-primary/10 gap-1"
                    >
                      <span>Acessar</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =========================================================================
            5. BLOCO INFORMATIVO DE RODAPÉ (MANIFESTO EDITORIAL DO LABS)
            ========================================================================= */}
          <footer className="p-8 rounded-3xl bg-gradient-to-br from-card via-card to-primary/10 border border-primary/30 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
              <FlaskConical className="w-6 h-6" />
            </div>

            <div className="space-y-1 max-w-xl mx-auto">
              <h3 className="text-lg font-black text-foreground font-serif">
                Sobre o Espírito Editorial do MidiaViva Labs
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Inspirado na precisão analítica e no rigor de publicações editoriais de tecnologia,
                o Labs combina narrativa estratégica com controle prático da sua esteira criativa.
                Cada recurso ativado aqui tem impacto real no dia a dia da sua equipe de conteúdo.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/brand-kit')}
                className="rounded-xl text-xs font-bold border-border/80"
              >
                Ir para o Brand Kit MudarCurso
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setTab('post')}
                className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Criar Post com Recursos Labs
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground/60 font-mono pt-2">
              MidiaViva Labs &middot; Powered by BestContent AI &middot; Edição Contínua 2026
            </p>
          </footer>
        </>
      )}
    </div>
  )
}

export default LabsPage
