import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Video,
  FileImage,
  Lightbulb,
  Calendar as CalendarIcon,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  Share2,
  Wand2,
  Clock,
  Layers,
  ChevronRight,
  CheckCircle2,
  CalendarDays,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { createIdea, getIdeas } from '@/services/ideas'

interface SuggestedIdea {
  id: string
  kind: 'date' | 'trending' | 'curated'
  dateLabel?: string
  daysUntilLabel?: string
  title: string
  description: string
  category: string
  author?: string
  format?: 'Story' | 'Reels' | 'Carrossel' | 'Post Feed'
  badge?: string
  coverImage?: string
  targetTheme?: string
}

const INSPIRATION_IDEAS: SuggestedIdea[] = [
  {
    id: 'singles-day-11-11',
    kind: 'date',
    dateLabel: '11 nov',
    daysUntilLabel: 'Em 7 dias',
    title: "Singles' Day (11.11)",
    description:
      'Maior evento global de compras antes da Black Friday. Use para ofertas relâmpago de 24h ou incentivar o autocuidado com o mote "Você merece esse upgrade".',
    category: 'Data Comercial',
    badge: '11 nov · Em 7 dias',
    format: 'Carrossel',
    coverImage: 'https://img.usecurling.com/p/600/400?q=shopping%20sale%20discount&color=purple',
    targetTheme: 'Promoção exclusiva de Singles Day 11.11 com foco em transformação',
  },
  {
    id: 'case-midiaviva-4h',
    kind: 'curated',
    author: '@ronaldo.barreto1',
    title: 'Antes e depois da MidiaViva: menos 4 horas na rotina de cada cliente',
    description:
      'Mostre em vídeo/story como a automação de briefing para post economizou tempo real de operação. Prova social direta gera 3.2x mais leads qualificados.',
    category: 'Case de Sucesso',
    badge: 'Em alta · Story',
    format: 'Story',
    coverImage:
      'https://img.usecurling.com/p/600/400?q=workspace%20laptop%20productivity&color=blue',
    targetTheme: 'Case de sucesso: economia de 4 horas por dia com criação automatizada',
  },
  {
    id: 'black-friday-aquecimento',
    kind: 'trending',
    dateLabel: '28 nov',
    daysUntilLabel: 'Em 24 dias',
    title: 'Aquecimento Black Friday: Lista VIP com Acesso Antecipado',
    description:
      'Abra grupo no WhatsApp ou lista de espera com desconto exclusivo para os primeiros 50 inscritos. Gatilho de escassez e reciprocidade.',
    category: 'Vendas & Funil',
    badge: 'Em alta · Feed',
    format: 'Post Feed',
    coverImage: 'https://img.usecurling.com/p/600/400?q=black%20friday%20neon&color=yellow',
    targetTheme: 'Campanha de lista VIP antecipada para a Black Friday',
  },
  {
    id: 'reels-3-erros',
    kind: 'trending',
    author: '@midiaviva.ai',
    title: '3 erros que detonam o alcance do seu post antes da primeira hora',
    description:
      'Roteiro curto com gancho nos 3 primeiros segundos desmontando mitos sobre hashtags e horário perfeito, entregando a solução prática.',
    category: 'Educativo / Autoridade',
    badge: 'Viral · Reels',
    format: 'Reels',
    coverImage: 'https://img.usecurling.com/p/600/400?q=smartphone%20recording%20video&color=rose',
    targetTheme: '3 erros comuns que derrubam o engajamento e alcance nas redes',
  },
  {
    id: 'dia-mundial-criatividade',
    kind: 'date',
    dateLabel: '17 nov',
    daysUntilLabel: 'Em 13 dias',
    title: 'Semana da Produtividade Criativa',
    description:
      'Compartilhe a rotina dos bastidores e as ferramentas de IA que seu time usa no dia a dia. Humanização conecta marcas a compradores reais.',
    category: 'Bastidores',
    badge: '17 nov · Em 13 dias',
    format: 'Carrossel',
    coverImage: 'https://img.usecurling.com/p/600/400?q=designer%20creative%20desk&color=cyan',
    targetTheme: 'Como usamos inteligência artificial no dia a dia criativo',
  },
]

export default function Discover() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { selectedBrandId, brands } = useSocial()

  const [savedIdeaTitles, setSavedIdeaTitles] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'dates' | 'trending' | 'curated'>('all')

  // Load existing ideas from PocketBase
  useEffect(() => {
    if (!user?.id) return
    getIdeas(user.id)
      .then((records) => {
        const titles = new Set<string>()
        records.forEach((r: any) => {
          if (r.title) titles.add(r.title.trim().toLowerCase())
        })
        setSavedIdeaTitles(titles)
      })
      .catch(() => {
        // non-blocking
      })
  }, [user?.id])

  const activeBrand = brands.find((b: any) => b.id === selectedBrandId) || brands[0]

  const handleSaveIdea = async (idea: SuggestedIdea) => {
    if (!user?.id) {
      toast({
        title: 'Faça login para salvar',
        description: 'É necessário estar autenticado para salvar ideias na sua conta.',
        variant: 'destructive',
      })
      return
    }

    const normalizedTitle = idea.title.trim().toLowerCase()
    const isAlreadySaved = savedIdeaTitles.has(normalizedTitle)

    if (isAlreadySaved) {
      toast({
        title: 'Ideia já salva!',
        description: `"${idea.title}" já está guardada na sua Biblioteca de Ideias.`,
      })
      return
    }

    setSavingId(idea.id)
    try {
      await createIdea({
        user: user.id,
        brand: activeBrand?.id || undefined,
        title: idea.title,
        description: idea.description,
        source: idea.category,
      })

      setSavedIdeaTitles((prev) => new Set(prev).add(normalizedTitle))
      toast({
        title: 'Ideia salva com sucesso! 💡',
        description: `"${idea.title}" foi adicionada à sua coleção. Você pode usá-la no Criador a qualquer momento.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar ideia',
        description: err?.message || 'Não foi possível salvar agora. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingId(null)
    }
  }

  const handleCreateFromIdea = (idea: SuggestedIdea) => {
    const prompt = idea.targetTheme || idea.title
    navigate(`/app/criar?prompt=${encodeURIComponent(prompt)}&format=${idea.format || 'Post'}`)
  }

  const filteredIdeas = INSPIRATION_IDEAS.filter((idea) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'dates') return idea.kind === 'date'
    if (activeFilter === 'trending') return idea.kind === 'trending'
    if (activeFilter === 'curated') return idea.kind === 'curated'
    return true
  })

  return (
    <div className="space-y-10 pb-12">
      {/* 1. SEÇÃO: Comece por aqui */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="w-4 h-4" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Comece por aqui
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha uma ferramenta rápida para criar, planejar ou organizar o conteúdo da sua
              marca.
            </p>
          </div>
          {activeBrand && (
            <Badge
              variant="outline"
              className="self-start sm:self-auto text-xs px-3 py-1 border-primary/30 bg-primary/5 text-primary"
            >
              Marca ativa: <span className="font-bold ml-1">{activeBrand.name}</span>
            </Badge>
          )}
        </div>

        {/* Grid dos 5 cards principais: Novo/Vídeo com IA, Popular/Post ou carrossel, Inspiração, Calendário, Biblioteca */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Novo / Vídeo com IA */}
          <Link
            to="/app/guided"
            className="group relative flex flex-col justify-between p-4 rounded-2xl border border-border bg-card/70 hover:bg-card hover:border-purple-500/50 hover:shadow-lg transition-all duration-200"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Video className="w-5 h-5" />
                </div>
                <Badge className="bg-purple-600 text-white hover:bg-purple-600 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                  Novo
                </Badge>
              </div>
              <h3 className="font-bold text-base text-foreground group-hover:text-purple-600 transition-colors">
                Vídeo com IA
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Roteiro, cenas e narração prontos em segundos para Reels, TikTok e Shorts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
              <span>Criar vídeo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Popular / Post ou carrossel */}
          <Link
            to="/app/image-creator"
            className="group relative flex flex-col justify-between p-4 rounded-2xl border border-border bg-card/70 hover:bg-card hover:border-blue-500/50 hover:shadow-lg transition-all duration-200"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileImage className="w-5 h-5" />
                </div>
                <Badge className="bg-blue-600 text-white hover:bg-blue-600 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                  Popular
                </Badge>
              </div>
              <h3 className="font-bold text-base text-foreground group-hover:text-blue-600 transition-colors">
                Post ou carrossel
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Uma arte ou vários slides com visual profissional e copywriting pronto.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
              <span>Criar imagem</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Inspiração */}
          <Link
            to="/app/inspiracao"
            className="group relative flex flex-col justify-between p-4 rounded-2xl border border-border bg-card/70 hover:bg-card hover:border-amber-500/50 hover:shadow-lg transition-all duration-200"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-500/30 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide"
                >
                  Ideias
                </Badge>
              </div>
              <h3 className="font-bold text-base text-foreground group-hover:text-amber-600 transition-colors">
                Inspiração
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Ideias e tendências personalizadas para o nicho da sua marca.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
              <span>Ver ideias</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Calendário */}
          <Link
            to="/app/calendar"
            className="group relative flex flex-col justify-between p-4 rounded-2xl border border-border bg-card/70 hover:bg-card hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <Badge
                  variant="outline"
                  className="text-emerald-600 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide"
                >
                  Planejar
                </Badge>
              </div>
              <h3 className="font-bold text-base text-foreground group-hover:text-emerald-600 transition-colors">
                Calendário
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Agende e publique nas redes no melhor horário para o seu público.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Abrir agenda</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 5: Biblioteca */}
          <Link
            to="/app/library"
            className="group relative flex flex-col justify-between p-4 rounded-2xl border border-border bg-card/70 hover:bg-card hover:border-indigo-500/50 hover:shadow-lg transition-all duration-200"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <Badge
                  variant="outline"
                  className="text-indigo-600 border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide"
                >
                  Acervo
                </Badge>
              </div>
              <h3 className="font-bold text-base text-foreground group-hover:text-indigo-600 transition-colors">
                Biblioteca
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Tudo o que você já criou: rascunhos, agendados e artes salvas.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>Acessar acervo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* 2. BANNER: Um post, todas as redes */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-background p-6 sm:p-8 lg:p-10 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            Omnichannel Inteligente
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Um post, todas as redes
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Crie uma vez. A IA adapta para o feed, o story e cada rede conectada, no tamanho certo
            de cada uma (Instagram, TikTok, LinkedIn, YouTube, Facebook e X).
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md gap-2"
            >
              <Link to="/app/criar">
                <Wand2 className="w-4 h-4" />
                Criar conteúdo agora
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-purple-500/30 hover:bg-purple-500/10 font-medium"
            >
              <Link to="/app/social-hub">
                <Share2 className="w-4 h-4 mr-2" />
                Conectar redes sociais
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 3. BLOCO: Criar para todas as redes */}
      <section className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            Criar para todas as redes
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground">Encontrou uma ideia?</h3>
          <p className="text-sm text-muted-foreground">
            Transforme o tema em conteúdo com a cara da sua marca em segundos, pronto para aprovação
            ou publicação.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 font-bold px-6 shadow-md"
          >
            <Link to="/app/criar">
              <Sparkles className="w-4 h-4 mr-2" />
              Criar conteúdo
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="font-medium">
            <Link to="/app/templates">Templates prontos</Link>
          </Button>
        </div>
      </section>

      {/* 4. SEÇÃO: Inspiração */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl sm:text-2xl font-black text-foreground">Inspiração</h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Tendências, datas, notícias e ideias escolhidas para a MidiaViva
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('dates')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeFilter === 'dates'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Datas
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('trending')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeFilter === 'trending'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Em alta
              </button>
            </div>

            <Link
              to="/app/inspiracao"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 ml-2 shrink-0"
            >
              <span>Ver todas as inspirações</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Grid de Ideias & Cards de Inspiração */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIdeas.map((idea) => {
            const normalizedTitle = idea.title.trim().toLowerCase()
            const isSaved = savedIdeaTitles.has(normalizedTitle)
            const isSaving = savingId === idea.id

            return (
              <Card
                key={idea.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card/70 hover:bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Imagem de capa com badges */}
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {idea.coverImage ? (
                      <img
                        src={idea.coverImage}
                        alt={idea.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <Sparkles className="w-8 h-8 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      {idea.badge ? (
                        <Badge className="bg-black/80 backdrop-blur-md text-white border-white/20 text-[11px] font-bold px-2.5 py-0.5">
                          {idea.badge}
                        </Badge>
                      ) : (
                        <Badge className="bg-primary text-white text-[11px] font-bold">
                          {idea.category}
                        </Badge>
                      )}

                      {idea.format && (
                        <Badge
                          variant="outline"
                          className="bg-black/60 backdrop-blur-md text-white border-white/20 text-[10px] uppercase font-bold"
                        >
                          {idea.format}
                        </Badge>
                      )}
                    </div>

                    {/* Author or Date Footer on Image */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white/90 text-xs">
                      {idea.author && (
                        <span className="font-semibold text-purple-200">{idea.author}</span>
                      )}
                      {idea.dateLabel && (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-200">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {idea.dateLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <CardContent className="p-4 sm:p-5 space-y-2">
                    <h4 className="font-extrabold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {idea.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {idea.description}
                    </p>
                  </CardContent>
                </div>

                {/* Card Actions */}
                <div className="p-4 sm:p-5 pt-0 flex items-center justify-between gap-2 border-t border-border/40 mt-2">
                  <Button
                    type="button"
                    variant={isSaved ? 'secondary' : 'outline'}
                    size="sm"
                    disabled={isSaving}
                    onClick={() => handleSaveIdea(idea)}
                    className="text-xs font-semibold gap-1.5"
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Salva</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleCreateFromIdea(idea)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-1 shadow-xs"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Usar ideia</span>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
