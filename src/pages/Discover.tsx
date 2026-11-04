import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Sparkles,
  Video,
  FileImage,
  Lightbulb,
  Calendar as CalendarIcon,
  BookOpen,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Share2,
  Wand2,
  Layers,
  CalendarDays,
  Zap,
  Flame,
  PlusCircle,
  RefreshCw,
  Search,
  X,
  Target,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { evaluateIdeaRelevance, type SemanticMatchResult } from '@/services/semantic-search'
import { Input } from '@/components/ui/input'
import { WhatToPostTodayModal } from '@/components/analytics/WhatToPostTodayModal'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { createIdea, getIdeas } from '@/services/ideas'
import pb from '@/lib/pocketbase/client'

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
  funnelObjective?: 'Atração' | 'Autoridade' | 'Conversão' | 'Comunidade'
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
    funnelObjective: 'Conversão',
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
    funnelObjective: 'Autoridade',
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
    funnelObjective: 'Conversão',
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
    funnelObjective: 'Atração',
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
    funnelObjective: 'Comunidade',
    coverImage: 'https://img.usecurling.com/p/600/400?q=designer%20creative%20desk&color=cyan',
    targetTheme: 'Como usamos inteligência artificial no dia a dia criativo',
  },
  {
    id: 'debate-comunidade-futuro',
    kind: 'curated',
    author: '@midiaviva.ai',
    title: 'Debate: O que você nunca terceirizaria para uma IA no seu conteúdo?',
    description:
      'Enquete e discussão franca sobre autenticidade humana versus ganho de velocidade com inteligência artificial.',
    category: 'Comunidade',
    badge: 'Engajamento · Post',
    format: 'Post Feed',
    funnelObjective: 'Comunidade',
    coverImage:
      'https://img.usecurling.com/p/600/400?q=discussion%20community%20podcast&color=purple',
    targetTheme: 'Debate comunitário: limites éticos e criativos do uso de IA',
  },
  {
    id: 'reels-bastidores-lancamento',
    kind: 'trending',
    author: '@midiaviva.ai',
    title: 'Bastidores em 20 segundos: Como nasce uma campanha do zero',
    description:
      'Cortes dinâmicos mostrando a tela do criador, a paleta de cores e o post final renderizado em alta definição.',
    category: 'Atração / Bastidores',
    badge: 'Viral · Reels',
    format: 'Reels',
    funnelObjective: 'Atração',
    coverImage: 'https://img.usecurling.com/p/600/400?q=video%20editing%20timeline&color=cyan',
    targetTheme: 'Roteiro de 20s dos bastidores da produção de campanhas',
  },
  {
    id: 'story-enquete-estrategica',
    kind: 'curated',
    author: '@ronaldo.barreto1',
    title: 'Story Interativo: Termômetro do seu Funil de Vendas Hoje',
    description:
      'Sequência de 3 stickers de enquete para mapear o maior gargalo dos seguidores e direcionar para direct de diagnóstico.',
    category: 'Story Interativo',
    badge: 'Interativo · Story',
    format: 'Story',
    funnelObjective: 'Conversão',
    coverImage: 'https://img.usecurling.com/p/600/400?q=mobile%20social%20poll&color=orange',
    targetTheme: 'Sequência de stories com enquetes de diagnóstico de funil',
  },
]

export default function Discover() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { selectedBrandId, brands } = useSocial()

  const [savedIdeaTitles, setSavedIdeaTitles] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'dates' | 'trending'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [formatFilter, setFormatFilter] = useState<
    'all' | 'Reels' | 'Story' | 'Carrossel' | 'Post Feed'
  >('all')
  const [funnelFilter, setFunnelFilter] = useState<
    'all' | 'Atração' | 'Autoridade' | 'Conversão' | 'Comunidade'
  >('all')
  const [isWhatToPostModalOpen, setIsWhatToPostModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dbTrends, setDbTrends] = useState<SuggestedIdea[]>([])

  // Suporte a âncora direta para rolar até a seção de inspiração se vier com hash #inspiracao
  useEffect(() => {
    if (location.hash === '#inspiracao') {
      const el = document.getElementById('secao-inspiracao')
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 150)
      }
    }
  }, [location.hash])

  // Load existing ideas & trends from PocketBase
  const loadData = async () => {
    setIsLoading(true)
    try {
      const [ideasRes, trendsRes] = await Promise.allSettled([
        getIdeas(user?.id),
        pb.collection('trends').getList(1, 6, { sort: '-popularity_score' }),
      ])

      if (ideasRes.status === 'fulfilled' && Array.isArray(ideasRes.value)) {
        const titles = new Set<string>()
        ideasRes.value.forEach((r: any) => {
          if (r.title) titles.add(r.title.trim().toLowerCase())
        })
        setSavedIdeaTitles(titles)
      }

      if (trendsRes.status === 'fulfilled' && trendsRes.value?.items) {
        const trendsMapped: SuggestedIdea[] = trendsRes.value.items.map((t: any) => ({
          id: `trend-${t.id}`,
          kind: 'trending',
          title: t.title,
          description:
            t.description || 'Tendência identificada pela IA com alto potencial de engajamento.',
          category: 'Tendência IA',
          badge: `${t.popularity_score || 85}% Relevância`,
          format: 'Post Feed',
          coverImage:
            t.image_url ||
            'https://img.usecurling.com/p/600/400?q=digital%20marketing%20growth&color=purple',
          targetTheme: t.title,
        }))
        setDbTrends(trendsMapped)
      }
    } catch {
      // non-blocking
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
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
    const fmt = idea.format || 'Post Feed'
    // Se o formato sugerido for vídeo/reels, vai para o criador de vídeos; se for imagem/carrossel, para imagens
    if (fmt === 'Reels') {
      navigate(`/app/criar/videos?prompt=${encodeURIComponent(prompt)}`)
    } else {
      navigate(
        `/app/criar/imagens?prompt=${encodeURIComponent(prompt)}&format=${encodeURIComponent(fmt)}`,
      )
    }
  }

  // Combina ideias estáticas com tendências vindas do PocketBase sem duplicar títulos
  const allIdeas = useMemo(() => {
    const combined = [...INSPIRATION_IDEAS]
    dbTrends.forEach((trend) => {
      if (!combined.some((c) => c.title.toLowerCase() === trend.title.toLowerCase())) {
        combined.push(trend)
      }
    })
    return combined
  }, [dbTrends])

  // Busca Semântica Inteligente com normalização, sinônimos, intenções e ranqueamento
  const { filteredIdeas, semanticMatchesMap } = useMemo(() => {
    const matchesMap = new Map<string, SemanticMatchResult>()

    const candidates = allIdeas.filter((idea) => {
      // 1. Filtro das abas principais (Todas / Datas / Em alta)
      if (activeFilter === 'dates' && idea.kind !== 'date') return false
      if (activeFilter === 'trending' && idea.kind !== 'trending' && idea.kind !== 'curated') {
        return false
      }

      // 2. Filtro de formato (Reels / Story / Carrossel / Post Feed)
      if (formatFilter !== 'all') {
        const ideaFmt = (idea.format || '').toLowerCase()
        const targetFmt = formatFilter.toLowerCase()
        if (!ideaFmt.includes(targetFmt)) {
          return false
        }
      }

      // 3. Filtro de objetivo de funil (Atração / Autoridade / Conversão / Comunidade)
      if (funnelFilter !== 'all') {
        const ideaFunnel = idea.funnelObjective || ''
        const ideaCategory = idea.category || ''
        const matchesFunnel =
          ideaFunnel.toLowerCase() === funnelFilter.toLowerCase() ||
          ideaCategory.toLowerCase().includes(funnelFilter.toLowerCase())
        if (!matchesFunnel) {
          return false
        }
      }

      // 4. Busca semântica inteligente por texto / intenção (ex: "vender mais", "autoridade", "engajar")
      if (searchQuery.trim()) {
        const evaluation = evaluateIdeaRelevance(searchQuery, {
          title: idea.title,
          description: idea.description,
          category: idea.category,
          targetTheme: idea.targetTheme,
          format: idea.format,
          funnelObjective: idea.funnelObjective,
          badge: idea.badge,
        })

        if (!evaluation.isMatch) {
          return false
        }
        matchesMap.set(idea.id, evaluation)
      }

      return true
    })

    // Ranqueamento inteligente por score de relevância quando há busca ativa
    if (searchQuery.trim()) {
      candidates.sort((a, b) => {
        const scoreA = matchesMap.get(a.id)?.score || 0
        const scoreB = matchesMap.get(b.id)?.score || 0
        return scoreB - scoreA
      })
    }

    return { filteredIdeas: candidates, semanticMatchesMap: matchesMap }
  }, [allIdeas, activeFilter, formatFilter, funnelFilter, searchQuery])

  const hasActiveCustomFilters =
    searchQuery.trim() !== '' || formatFilter !== 'all' || funnelFilter !== 'all'

  const clearAllFilters = () => {
    setSearchQuery('')
    setFormatFilter('all')
    setFunnelFilter('all')
    setActiveFilter('all')
  }

  return (
    <div className="space-y-10 pb-12 w-full max-w-full overflow-x-hidden">
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
            to="/app/criar/videos"
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
            to="/app/criar/imagens"
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
          <a
            href="#secao-inspiracao"
            onClick={(e) => {
              e.preventDefault()
              const el = document.getElementById('secao-inspiracao')
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
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
          </a>

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

      {/* 4. SEÇÃO: Inspiração (âncora #secao-inspiracao) */}
      <section id="secao-inspiracao" className="space-y-6 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl sm:text-2xl font-black text-foreground">Inspiração</h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Tendências, datas, notícias e ideias com copywriting e formato prontos
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsWhatToPostModalOpen(true)}
              className="bg-purple-600/10 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-600/20 text-xs font-bold gap-1.5 h-9 rounded-xl"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>O que postar hoje? (IA)</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              title="Atualizar ideias"
              className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground rounded-xl"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Barra de Busca em Tempo Real e Filtros Avançados */}
        <div className="space-y-3 p-4 sm:p-5 rounded-2xl border border-border/80 bg-card/60 shadow-xs">
          {/* Campo de Busca em Tempo Real */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar ideias por tema, palavra-chave, data ou objetivo (ex: Black Friday, reels, conversão)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-10 rounded-xl bg-background border-border/80 text-sm focus-visible:ring-purple-500/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Linha de Abas Principais + Filtros de Formato e Objetivo */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 border-t border-border/50">
            {/* Abas Principais (Todas, Datas, Em alta) */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase mr-1 shrink-0 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3" /> Origem:
              </span>
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Todas ({allIdeas.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('dates')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFilter === 'dates'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Datas Comerciais
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('trending')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFilter === 'trending'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Em alta & Tendências
              </button>
            </div>

            {/* Contador de Resultados & Limpar Filtros */}
            <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 text-xs">
              <span className="text-muted-foreground">
                Mostrando <strong className="text-foreground">{filteredIdeas.length}</strong> de{' '}
                {allIdeas.length} ideias
              </span>
              {hasActiveCustomFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-purple-600 dark:text-purple-400 hover:underline font-semibold ml-1 flex items-center gap-1 text-[11px]"
                >
                  <X className="w-3 h-3" /> Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Chips de Formato e Objetivo de Funil */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            {/* Chips de Formato */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase mr-1 shrink-0 flex items-center gap-1">
                <Layers className="w-3 h-3 text-purple-500" /> Formato:
              </span>
              {[
                { key: 'all', label: 'Todos os Formatos' },
                { key: 'Reels', label: 'Reels (Vídeo Curto)' },
                { key: 'Story', label: 'Story Interativo' },
                { key: 'Carrossel', label: 'Carrossel (Slides)' },
                { key: 'Post Feed', label: 'Post Feed' },
              ].map((fmt) => {
                const active = formatFilter === fmt.key
                return (
                  <button
                    key={fmt.key}
                    type="button"
                    onClick={() => setFormatFilter(fmt.key as any)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      active
                        ? 'bg-purple-600 text-white font-bold shadow-xs'
                        : 'bg-card text-muted-foreground hover:text-foreground border border-border/60 hover:border-border'
                    }`}
                  >
                    {fmt.label}
                  </button>
                )
              })}
            </div>

            {/* Chips de Objetivo de Funil */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase mr-1 shrink-0 flex items-center gap-1">
                <Target className="w-3 h-3 text-sky-500" /> Funil:
              </span>
              {[
                { key: 'all', label: 'Todos os Objetivos' },
                { key: 'Atração', label: '🎯 Atração (Alcance / Topo)' },
                { key: 'Autoridade', label: '⭐ Autoridade (Meio)' },
                { key: 'Conversão', label: '💰 Conversão (Fundo)' },
                { key: 'Comunidade', label: '💬 Comunidade (Retenção)' },
              ].map((fnl) => {
                const active = funnelFilter === fnl.key
                return (
                  <button
                    key={fnl.key}
                    type="button"
                    onClick={() => setFunnelFilter(fnl.key as any)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                      active
                        ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/40 font-bold'
                        : 'bg-card text-muted-foreground hover:text-foreground border border-border/60 hover:border-border'
                    }`}
                  >
                    {fnl.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden rounded-2xl border border-border bg-card/50">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
                <div className="p-5 pt-0 flex justify-between gap-2 border-t border-border/40 mt-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredIdeas.length === 0 ? (
          /* Empty State com Ação */
          <Card className="p-8 sm:p-12 text-center border-dashed border-2 rounded-2xl bg-card/40 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-bold text-lg text-foreground">Nenhuma ideia nesta categoria</h3>
              <p className="text-sm text-muted-foreground">
                Tente selecionar outro filtro acima ou crie uma ideia do zero com inteligência
                artificial.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setActiveFilter('all')}>
                Ver todas as ideias
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/app/criar')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                Criar ideia do zero
              </Button>
            </div>
          </Card>
        ) : (
          /* Grid de Ideias & Cards de Inspiração */
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

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

                        <div className="flex items-center gap-1">
                          {idea.format && (
                            <Badge
                              variant="outline"
                              className="bg-black/60 backdrop-blur-md text-white border-white/20 text-[10px] uppercase font-bold"
                            >
                              {idea.format}
                            </Badge>
                          )}
                          {idea.funnelObjective && (
                            <Badge
                              variant="outline"
                              className="bg-sky-950/80 backdrop-blur-md text-sky-200 border-sky-400/40 text-[10px] font-bold"
                            >
                              🎯 {idea.funnelObjective}
                            </Badge>
                          )}
                        </div>
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
                      {/* Badge Curto de Correspondência Semântica por IA quando busca por intenção */}
                      {semanticMatchesMap.has(idea.id) &&
                        semanticMatchesMap.get(idea.id)?.matchReason && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[11px] font-semibold border border-purple-500/20">
                            <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span>{semanticMatchesMap.get(idea.id)?.matchReason}</span>
                          </div>
                        )}

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
                      className={`text-xs font-semibold gap-1.5 transition-colors ${
                        isSaved
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : ''
                      }`}
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
        )}
      </section>

      {/* Modal O que postar hoje? (IA) com sincronização dos filtros da tela Explorar */}
      <WhatToPostTodayModal
        open={isWhatToPostModalOpen}
        onOpenChange={setIsWhatToPostModalOpen}
        brandName={activeBrand?.name || 'Sua Marca'}
        brandNiche={activeBrand?.segment || 'Geral'}
        brandTone={activeBrand?.tone || 'Profissional e dinâmico'}
        network="Instagram"
        initialFormat={formatFilter !== 'all' ? formatFilter : undefined}
        initialObjective={funnelFilter !== 'all' ? funnelFilter : undefined}
        onApplyIdea={(idea) => {
          setIsWhatToPostModalOpen(false)
          navigate(
            `/app/criar/imagens?prompt=${encodeURIComponent(idea.title)}&format=${encodeURIComponent(
              idea.format || 'Post Feed',
            )}`,
          )
        }}
      />
    </div>
  )
}
