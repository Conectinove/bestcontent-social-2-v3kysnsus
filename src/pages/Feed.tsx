import { useState, useRef, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Trophy,
  Zap,
  Target,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  MessageSquare,
  Calendar,
  Plus,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  Gift,
  Lightbulb,
  ExternalLink,
  ChevronDown,
  Layers,
  GraduationCap,
  Play,
  Film,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import { TopRankingModal } from '@/components/jornada/TopRankingModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Community creators data exactly as seen on screenshot
interface CommunityCreator {
  id: string
  name: string
  initials: string
  avatarColor: string
  image: string
  postTitle?: string
}

const COMMUNITY_CREATORS: CommunityCreator[] = [
  {
    id: 'c1',
    name: 'Manasci',
    initials: 'MA',
    avatarColor: 'bg-violet-600',
    image: 'https://img.usecurling.com/p/240/240?q=man%20portrait%20dark&color=purple',
    postTitle: 'Ladrão é o Banqueiro',
  },
  {
    id: 'c2',
    name: 'Lucio flavio Barbosa Nantes coelho',
    initials: 'L',
    avatarColor: 'bg-purple-700',
    image: 'https://img.usecurling.com/p/240/240?q=businessman%20speaking&color=indigo',
    postTitle: 'Trauma Superado',
  },
  {
    id: 'c3',
    name: 'Alex Machado',
    initials: 'AL',
    avatarColor: 'bg-purple-600',
    image: 'https://img.usecurling.com/p/240/240?q=bicycle%20city&color=violet',
    postTitle: 'Mobilidade Urbana',
  },
  {
    id: 'c4',
    name: 'Manasci',
    initials: 'MA',
    avatarColor: 'bg-indigo-600',
    image: 'https://img.usecurling.com/p/240/240?q=fashion%20sale%20poster&color=blue',
    postTitle: 'Fim da Taxa das Blusinhas?',
  },
  {
    id: 'c5',
    name: 'Lucio flavio Barbosa Nantes coelho',
    initials: 'L',
    avatarColor: 'bg-purple-800',
    image: 'https://img.usecurling.com/p/240/240?q=coffee%20cup%20desk&color=amber',
    postTitle: 'Apenas Cansaço?',
  },
  {
    id: 'c6',
    name: 'TRICIA PEREIRA NUNES JUNQUEIRA',
    initials: 'TP',
    avatarColor: 'bg-fuchsia-600',
    image: 'https://img.usecurling.com/p/240/240?q=skincare%20beauty%20woman&color=pink',
    postTitle: 'Share the Freshness',
  },
  {
    id: 'c7',
    name: 'Manasci',
    initials: 'MA',
    avatarColor: 'bg-violet-600',
    image: 'https://img.usecurling.com/p/240/240?q=space%20nebula%20fire&color=purple',
    postTitle: 'A História Continua',
  },
  {
    id: 'c8',
    name: 'Manasci',
    initials: 'MA',
    avatarColor: 'bg-purple-600',
    image: 'https://img.usecurling.com/p/240/240?q=soccer%20trophy%20stadium&color=violet',
    postTitle: 'Trabalhar de Graça na Copa?',
  },
  {
    id: 'c9',
    name: 'Manasci',
    initials: 'MA',
    avatarColor: 'bg-indigo-600',
    image: 'https://img.usecurling.com/p/240/240?q=podium%20speaker%20stage&color=purple',
    postTitle: 'Estratégia ou Conveniência?',
  },
  {
    id: 'c10',
    name: 'Aline Brauna dos Santos',
    initials: 'AB',
    avatarColor: 'bg-emerald-600',
    image: 'https://img.usecurling.com/p/240/240?q=checklist%20business%20woman&color=green',
    postTitle: 'Checklist Essencial ONGs',
  },
  {
    id: 'c11',
    name: 'Adriana Leocadio',
    initials: 'AL',
    avatarColor: 'bg-teal-600',
    image: 'https://img.usecurling.com/p/240/240?q=doctor%20clinic%20health&color=teal',
    postTitle: 'Regras para Cancelar?',
  },
  {
    id: 'c12',
    name: 'José Raimundo Bastos Costa',
    initials: 'JR',
    avatarColor: 'bg-amber-600',
    image: 'https://img.usecurling.com/p/240/240?q=legal%20office%20books&color=amber',
    postTitle: 'Direito na Prática',
  },
  {
    id: 'c13',
    name: 'Agencia LinkWeb',
    initials: 'AL',
    avatarColor: 'bg-blue-600',
    image: 'https://img.usecurling.com/p/240/240?q=digital%20agency%20technology&color=blue',
    postTitle: 'Design de Alta Conversão',
  },
  {
    id: 'c14',
    name: 'Mateus Marques',
    initials: 'MM',
    avatarColor: 'bg-violet-700',
    image: 'https://img.usecurling.com/p/240/240?q=startup%20founder%20smiling&color=violet',
    postTitle: 'Crescimento Acelerado',
  },
]

export default function Feed() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { posts, brands } = useSocial()

  const [rankingModalOpen, setRankingModalOpen] = useState(false)
  const [rankingExpanded, setRankingExpanded] = useState(true)
  const [helpOpen, setHelpOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [missionsModalOpen, setMissionsModalOpen] = useState(false)

  // Scroll ref for community carousel
  const communityCarouselRef = useRef<HTMLDivElement>(null)
  const creationsCarouselRef = useRef<HTMLDivElement>(null)

  const scrollCarousel = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: 'left' | 'right',
  ) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -320 : 320
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Active brand
  const activeBrand = useMemo(() => {
    return (
      brands.find((b: any) => b.name?.toLowerCase().includes('mudarcurso')) ||
      brands[0] || {
        name: 'MudarCurso',
        logo: '',
      }
    )
  }, [brands])

  // Count stats
  const stats = useMemo(() => {
    const totalPosts = posts.length > 0 ? posts.length : 2
    const scheduled = posts.filter((p: any) => p.status === 'scheduled').length
    return {
      posts: totalPosts,
      postsGrowth: '+12%',
      pautas: 0,
      agendados: scheduled,
      creditos: 3400,
      maxCreditos: 5000,
    }
  }, [posts])

  // Sample or real creations
  const creations = useMemo(() => {
    return [
      {
        id: 'creation-1',
        type: 'FLYER',
        badgeColor: 'bg-white/90 text-slate-900',
        ratio: '620:877',
        title: 'Mudar de Curso: O Começo de Algo Incrível',
        subtext: 'SDFSD — A decodificação do seu sucesso começa aqui',
        date: 'cerca de 1 mês',
        image:
          'https://img.usecurling.com/p/620/877?q=cyberpunk%20ai%20man%20futuristic%20violet&color=purple',
        badgeUser: 'R',
      },
      {
        id: 'creation-2',
        type: 'FACEBOOK',
        badgeColor: 'bg-white/90 text-slate-900',
        ratio: '9:16',
        title: 'Vídeo facebook 30/07/2026',
        subtext: 'Transforme sua vida em 7 segundos com MudarCurso',
        date: 'cerca de 1 mês',
        image:
          'https://img.usecurling.com/p/600/1000?q=smiling%20man%20glasses%20laptop%20office&color=dark',
        isVideo: true,
      },
      {
        id: 'creation-3',
        type: 'CARROSSEL',
        badgeColor: 'bg-white/90 text-slate-900',
        ratio: '1:1',
        title: '3 Passos para Reinventar sua Carreira Hoje',
        subtext: 'Descubra como migrar de área sem começar do zero',
        date: 'há 2 semanas',
        image: 'https://img.usecurling.com/p/600/600?q=career%20success%20strategy&color=purple',
      },
      {
        id: 'creation-4',
        type: 'REELS',
        badgeColor: 'bg-white/90 text-slate-900',
        ratio: '9:16',
        title: 'Bastidores: Como a IA acelera seus resultados',
        subtext: 'Roteiro de alto engajamento para criadores',
        date: 'há 3 semanas',
        image:
          'https://img.usecurling.com/p/600/1000?q=creative%20studio%20neon%20camera&color=indigo',
        isVideo: true,
      },
    ]
  }, [])

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* =========================================================================
          TOP ROW: 2 Cards (Criador Dedicado & Missões)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Criador Dedicado */}
        <Card className="rounded-2xl border border-border/70 bg-card shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              {/* Trophy icon with level badge */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground border border-border">
                  <Trophy className="w-6 h-6 text-foreground/70" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
                  4
                </div>
              </div>

              {/* Title and Progress */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-sm text-foreground truncate">Criador Dedicado</h3>
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">
                    345/600
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((345 / 600) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Streak Counter */}
            <div className="pl-4 border-l border-border/60 flex items-center gap-2 shrink-0">
              <Zap className="w-4 h-4 text-muted-foreground fill-transparent stroke-[2.2]" />
              <div className="text-left">
                <p className="text-lg font-black leading-none text-foreground">1</p>
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  DIAS
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: MISSÕES */}
        <Card
          onClick={() => setMissionsModalOpen(true)}
          className="rounded-2xl border border-border/70 bg-card shadow-xs hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group"
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  MISSÕES
                </p>
                <p className="text-base font-bold text-foreground">0/8 completas</p>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all">
              <ArrowRight className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =========================================================================
          COMMUNITY CAROUSEL: "Últimos posts da comunidade"
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
              Últimos posts da comunidade
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollCarousel(communityCarouselRef, 'left')}
              className="h-7 w-7 rounded-full border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollCarousel(communityCarouselRef, 'right')}
              className="h-7 w-7 rounded-full border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Próximo"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Horizontal scroll strip */}
        <div
          ref={communityCarouselRef}
          className="flex items-start gap-4 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
        >
          {COMMUNITY_CREATORS.map((creator) => (
            <div
              key={creator.id}
              onClick={() => navigate('/app/community')}
              className="flex flex-col items-center gap-1.5 shrink-0 w-20 sm:w-22 cursor-pointer group text-center"
            >
              {/* Circular Avatar / Image with ring */}
              <div className="relative">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full p-[2px] bg-gradient-to-tr from-primary via-purple-400 to-pink-500 group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full rounded-full overflow-hidden bg-muted border-2 border-background">
                    <img
                      src={creator.image}
                      alt={creator.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>

                {/* Badge with initials */}
                <div
                  className={`absolute -bottom-1 -right-0.5 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full ring-2 ring-background ${creator.avatarColor}`}
                >
                  {creator.initials}
                </div>
              </div>

              {/* Creator Name */}
              <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground line-clamp-1 w-full text-center transition-colors">
                {creator.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          MAIN 2-COLUMN LAYOUT: Content (Left) + Sidebar (Right)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =======================================================================
            LEFT COLUMN (8 cols): Dashboard Header, Stats, Creations, Suggestions, Academy
            ======================================================================= */}
        <div className="lg:col-span-8 space-y-7">
          {/* Dashboard Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent pt-1">
            <div className="flex items-center gap-3">
              {/* Logo / Brand Icon */}
              <div className="w-10 h-10 rounded-xl bg-purple-900/80 text-white flex items-center justify-center font-bold text-base shadow-sm ring-1 ring-white/10">
                M
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-foreground tracking-tight">
                    Dashboard
                  </h1>
                  <button
                    onClick={() => setHelpOpen(true)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Ajuda"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setFeedbackOpen(true)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Comentários"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Trabalhando em{' '}
                  <span className="font-semibold text-foreground">
                    {activeBrand.name || 'MudarCurso'}
                  </span>
                </p>
              </div>
            </div>

            {/* Actions: Agendamento & + Criar Post */}
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/calendar')}
                className="rounded-xl border-border/80 text-xs font-semibold gap-1.5 h-9 px-3.5 hover:bg-muted"
              >
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Agendamento
              </Button>

              <Button
                size="sm"
                onClick={() => navigate('/app/content/new')}
                className="rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold gap-1.5 h-9 px-4 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Criar Post
              </Button>
            </div>
          </div>

          {/* Stats Grid: 4 Columns (POSTS, PAUTAS, AGENDADOS, CRÉDITOS IA) */}
          <Card className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/60">
                {/* 1. POSTS */}
                <div className="p-5 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                    POSTS
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-foreground">{stats.posts}</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {stats.postsGrowth}
                    </span>
                  </div>
                </div>

                {/* 2. PAUTAS */}
                <div className="p-5 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                    PAUTAS
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-foreground">{stats.pautas}</span>
                    <span className="text-xs font-medium text-muted-foreground">/ 30 dias</span>
                  </div>
                </div>

                {/* 3. AGENDADOS */}
                <div className="p-5 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                    AGENDADOS
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-foreground">{stats.agendados}</span>
                    <span className="text-xs font-medium text-muted-foreground">
                      / Para esta semana
                    </span>
                  </div>
                </div>

                {/* 4. CRÉDITOS IA */}
                <div className="p-5 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                    CRÉDITOS IA
                  </p>
                  <div>
                    <span className="text-3xl font-black text-foreground">
                      {stats.creditos.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {/* Purple progress bar */}
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((stats.creditos / stats.maxCreditos) * 100)}%`,
                      }}
                    />
                  </div>
                  <div>
                    <button
                      onClick={() =>
                        toast({
                          title: 'Recarga de créditos',
                          description: 'Seus créditos são renovados mensalmente no plano Pro.',
                        })
                      }
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      + Recarregar
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* =======================================================================
              SECTION: "Suas Últimas Criações"
              ======================================================================= */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                Suas Últimas Criações
              </h2>
              <button
                onClick={() => navigate('/app/library')}
                className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
              >
                Ver biblioteca
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Creations Carousel */}
            <div className="relative">
              <div
                ref={creationsCarouselRef}
                className="flex items-stretch gap-4 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
              >
                {creations.map((creation) => (
                  <Card
                    key={creation.id}
                    onClick={() => navigate('/app/library')}
                    className="w-72 sm:w-80 shrink-0 rounded-2xl overflow-hidden border border-border/80 bg-card hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer group flex flex-col"
                  >
                    {/* Media container */}
                    <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                      <img
                        src={creation.image}
                        alt={creation.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                      {/* Badge Type (FLYER / FACEBOOK / etc.) */}
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 bg-white/95 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider backdrop-blur-xs">
                          {creation.isVideo && <Film className="w-3 h-3 text-slate-900" />}
                          {creation.type}
                        </span>
                      </div>

                      {/* Aspect Ratio / user pill */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <span className="bg-black/75 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-md font-mono font-medium">
                          {creation.ratio}
                        </span>
                        {creation.badgeUser && (
                          <span className="w-5 h-5 rounded-full bg-white/90 text-slate-900 text-[10px] font-bold flex items-center justify-center shadow-xs">
                            {creation.badgeUser}
                          </span>
                        )}
                      </div>

                      {/* Play button overlay for video */}
                      {creation.isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-primary transition-all">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {creation.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {creation.subtext}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{creation.date}</span>
                        <span className="text-primary font-semibold group-hover:underline inline-flex items-center gap-0.5">
                          Abrir <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* =======================================================================
              SECTION: "Sugestões para Você"
              ======================================================================= */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                Sugestões para Você
              </h2>
              <button
                onClick={() => navigate('/app/discover')}
                className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
              >
                Ver todas
              </button>
            </div>

            {/* Rich Suggestion Card */}
            <Card className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-4">
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-semibold text-xs gap-1">
                    🔥 trends
                  </Badge>
                  <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-semibold text-xs gap-1">
                    <Zap className="w-3 h-3" /> +60 XP ALTA
                  </Badge>
                  <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
                    carrossel
                  </Badge>
                  <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
                    Instagram
                  </Badge>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                    IA e o Futuro da Sua Carreira: Prepare-se Agora!
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Apresente as 5 principais habilidades que profissionais precisam desenvolver
                    para se manter relevantes no mercado pós-IA. Formato perfeito para salvar e
                    compartilhar.
                  </p>
                </div>

                {/* Tip highlight box */}
                <div className="p-3.5 rounded-xl bg-muted/60 border border-border/70 text-xs space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    💡 Dica do SOCI: Use slides visuais e diretos
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Estruture o primeiro slide com uma pergunta instigante (&ldquo;Sua profissão vai
                    sumir?&rdquo;) e finalize com um convite para reflexão nos comentários.
                  </p>
                </div>

                {/* Double XP callout banner */}
                <div className="p-3 rounded-xl bg-purple-500/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-xs font-bold text-primary">
                      Poste nas próximas 24h e ganhe XP em dobro!
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => navigate('/app/content/new')}
                    className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs rounded-xl h-8 px-4 aggressive-button self-start sm:self-auto"
                  >
                    Gerar Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* =======================================================================
              SECTION: "Aprenda com a Academy"
              ======================================================================= */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  Aprenda com a Academy
                </h2>
              </div>
              <button
                onClick={() => navigate('/app/community')}
                className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
              >
                Ver todas as aulas
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Academy Card 1 */}
              <Card
                onClick={() => navigate('/app/community')}
                className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                    Para Iniciantes
                  </Badge>
                  <span className="text-xs text-muted-foreground">12 min</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    Conteúdo Inteligente, do Planejamento à Execução
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    Aprenda a mapear pilares editoriais, estruturar matriz de conteúdo e alimentar
                    sua IA para gerar posts altamente alinhados.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs text-primary font-semibold">
                  <span className="inline-flex items-center gap-1 group-hover:underline">
                    Assistir aula{' '}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Card>

              {/* Academy Card 2 */}
              <Card
                onClick={() => navigate('/app/community')}
                className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-[11px] font-semibold">
                    Local
                  </Badge>
                  <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 text-[11px] font-semibold">
                    Exclusivo
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">18 min</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    Marketing Local na Prática
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    Estratégias geo-localizadas para atrair clientes de alta renda da sua região sem
                    gastar fortuna em tráfego pago.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs text-primary font-semibold">
                  <span className="inline-flex items-center gap-1 group-hover:underline">
                    Assistir aula{' '}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* =======================================================================
            RIGHT COLUMN (4 cols): Ranking, Comunidade, 500 Créditos, Datas, Dica
            ======================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          {/* 1. Ranking de Setembro Card */}
          <Card className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <CardContent className="p-4">
              <div
                onClick={() => setRankingExpanded(!rankingExpanded)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-xs sm:text-sm font-bold text-foreground">
                    Ranking de Setembro
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    1400 créd
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      rankingExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {rankingExpanded && (
                <div className="mt-3 pt-3 border-t border-border/60 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Sua posição:</span>
                    <span className="font-bold text-foreground">#4 no ranking</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Prêmio Top 3:</span>
                    <span className="font-bold text-primary">+1.400 créditos IA</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRankingModalOpen(true)}
                    className="w-full text-xs h-8 rounded-xl border-border/70 mt-1"
                  >
                    Ver classificação completa
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Comunidade Section */}
          <Card className="rounded-2xl border border-border/70 bg-card shadow-xs">
            <CardContent className="p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">Comunidade</h3>
                </div>
                <button
                  onClick={() => navigate('/app/community')}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
                >
                  Ver mais →
                </button>
              </div>

              {/* Feed items */}
              <div className="space-y-3">
                {/* Item 1 */}
                <div
                  onClick={() => navigate('/app/community')}
                  className="space-y-1.5 cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full">
                      Novidades
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    🏆 A BestContent foi indicada ao Startup Awards
                  </p>
                </div>

                {/* Item 2 */}
                <div
                  onClick={() => navigate('/app/community')}
                  className="space-y-1.5 cursor-pointer group pt-2 border-t border-border/50"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full">
                      Novidades
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    📅 O agendamento e a publicação no Facebook estão de volta!
                  </p>
                </div>

                {/* Item 3 */}
                <div
                  onClick={() => navigate('/app/community')}
                  className="space-y-1.5 cursor-pointer group pt-2 border-t border-border/50"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full">
                      Novidades
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    Novidade no Programa de Indicação: 500 créditos por cada indicação! 🎉
                  </p>
                </div>

                {/* Item 4: Dúvidas */}
                <div
                  onClick={() => navigate('/app/community')}
                  className="space-y-1.5 cursor-pointer group pt-2 border-t border-border/50"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">
                      Dúvidas
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    Alterar Instagram &middot; Dúvida sobre sincronização
                  </p>
                </div>

                {/* Item 5: Blog */}
                <div
                  onClick={() => navigate('/app/community')}
                  className="space-y-1.5 cursor-pointer group pt-2 border-t border-border/50"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded-full">
                      Blog
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    Como construir uma presença autoritária no LinkedIn
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Button Destaque "Ganhe 500 Créditos" */}
          <Button
            onClick={() => {
              navigator.clipboard?.writeText?.(window.location.origin)
              toast({
                title: 'Link copiado!',
                description: 'Compartilhe com amigos e ganhe 500 créditos por cada cadastro.',
              })
            }}
            className="w-full h-12 rounded-2xl bg-muted/70 hover:bg-muted text-foreground border border-border/80 font-bold text-sm gap-2 shadow-xs group transition-all"
          >
            <Gift className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span>Ganhe 500 Créditos</span>
          </Button>

          {/* 4. Card "Próximas Datas — Não perca nenhuma" */}
          <Card className="rounded-2xl border border-border/70 bg-card shadow-xs">
            <CardContent className="p-5 space-y-3 text-center">
              <div className="flex items-center justify-start gap-2 text-left">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <h3 className="font-bold text-sm text-foreground">Próximas Datas</h3>
                  <p className="text-[11px] text-muted-foreground">Não perca nenhuma</p>
                </div>
              </div>

              {/* Empty state elegante matching screenshot */}
              <div className="py-8 px-2 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Nenhuma data comemorativa encontrada
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/app/calendar')}
                  className="text-xs text-primary h-7"
                >
                  Explorar calendário editorial →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 5. Card "DICA RÁPIDA" */}
          <Card className="rounded-2xl border border-border/70 bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  DICA RÁPIDA
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                Mostre bastidores: autenticidade gera confiança.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* =========================================================================
          FOOTER REFINADO
          ========================================================================= */}
      <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p className="text-center sm:text-left">
          Social 2 Powered by <span className="font-semibold text-foreground">BestContent AI</span>
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/community')}
            className="hover:text-primary transition-colors"
          >
            Novidades
          </button>
          <span>&middot;</span>
          <Link to="/app/settings" className="hover:text-primary transition-colors">
            Termos
          </Link>
          <span>&middot;</span>
          <Link to="/app/settings" className="hover:text-primary transition-colors">
            Privacidade
          </Link>
        </div>
      </div>

      {/* =========================================================================
          MODALS: Ranking, Help, Feedback, Missions
          ========================================================================= */}
      <TopRankingModal open={rankingModalOpen} onOpenChange={setRankingModalOpen} />

      {/* Help Modal */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <HelpCircle className="w-5 h-5 text-primary" />
              Central de Ajuda
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs text-muted-foreground py-2 leading-relaxed">
            <p>
              O MidiaViva ajuda você a planejar, criar e publicar conteúdos profissionais com
              inteligência artificial para suas redes sociais.
            </p>
            <div className="p-3 bg-muted/60 rounded-xl space-y-1.5">
              <p className="font-bold text-foreground">Atalhos rápidos:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong className="text-foreground">Criar Post:</strong> use o botão roxo para
                  abrir o gerador guiado de IA.
                </li>
                <li>
                  <strong className="text-foreground">Agendamento:</strong> veja suas publicações em
                  linha do tempo.
                </li>
                <li>
                  <strong className="text-foreground">Biblioteca:</strong> acesse todas as suas
                  mídias, flyers e vídeos.
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Modal */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <MessageSquare className="w-5 h-5 text-primary" />
              Envie seu feedback
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tem alguma sugestão de melhoria ou nova funcionalidade? Compartilhe com a nossa equipe
              de produto.
            </p>
            <textarea
              rows={4}
              placeholder="Descreva o que você gostaria de ver no MidiaViva..."
              className="w-full text-xs p-3 rounded-xl border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
            <Button
              size="sm"
              onClick={() => {
                setFeedbackOpen(false)
                toast({
                  title: 'Feedback recebido!',
                  description: 'Obrigado por ajudar a tornar o BestContent ainda melhor.',
                })
              }}
              className="w-full bg-primary text-white rounded-xl text-xs font-semibold"
            >
              Enviar Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Missions Quick View Modal */}
      <Dialog open={missionsModalOpen} onOpenChange={setMissionsModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Target className="w-5 h-5 text-primary" />
              Suas Missões da Semana (0/8)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Complete os desafios editoriais para ganhar XP e subir de nível no ranking.
            </p>
            <div className="space-y-2">
              {[
                { title: 'Criar 3 posts esta semana', xp: '+50 XP', link: '/app/content/new' },
                { title: 'Agendar 1 post no calendário', xp: '+30 XP', link: '/app/calendar' },
                { title: 'Explorar 2 sugestões de IA', xp: '+20 XP', link: '/app/discover' },
                { title: 'Conectar ou revisar marca', xp: '+40 XP', link: '/app/brands' },
                { title: 'Assistir a 1 aula na Academy', xp: '+60 XP', link: '/app/community' },
                {
                  title: 'Comentar em 1 tópico da comunidade',
                  xp: '+25 XP',
                  link: '/app/community',
                },
                { title: 'Gerar 1 flyer promocional', xp: '+45 XP', link: '/app/criar/flyers' },
                { title: 'Indicar um criador parceiro', xp: '+100 XP', link: '/app/settings' },
              ].map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center text-[10px] text-muted-foreground">
                      {i + 1}
                    </div>
                    <span className="font-medium text-foreground">{m.title}</span>
                  </div>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {m.xp}
                  </span>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => {
                setMissionsModalOpen(false)
                navigate('/app/content/new')
              }}
              className="w-full bg-primary text-white rounded-xl text-xs font-semibold mt-2"
            >
              Começar primeira missão
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
