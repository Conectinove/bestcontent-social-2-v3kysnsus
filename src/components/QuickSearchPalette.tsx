import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  TrendingUp,
  Sparkles,
  PlusCircle,
  Video,
  Lightbulb,
  FileBarChart,
  Calendar,
  Compass,
  Filter,
  Share2,
  FolderOpen,
  ArrowRight,
  Send,
  Bot,
  Zap,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { useSocial } from '@/context/SocialContext'

export interface QuickSearchPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface TrendingItem {
  id: string
  term: string
  countLabel: string
  category: 'trending' | 'topic'
}

export interface ActionItem {
  id: string
  title: string
  subtitle: string
  icon: React.ElementType
  iconColor: string
  badge?: string
  path: string
  isPrimary?: boolean
  onClick?: () => void
}

const STORAGE_KEY = 'midiaviva_recent_searches'

const INITIAL_TRENDING: TrendingItem[] = [
  {
    id: '1',
    term: 'ChatGPT e Agentes IA nos Estudos',
    countLabel: '2,4 mil buscas',
    category: 'trending',
  },
  {
    id: '2',
    term: 'Redação Concursos: Temas mais cotados',
    countLabel: '1,8 mil buscas',
    category: 'trending',
  },
  {
    id: '3',
    term: 'Produtividade com Pacote Office & Excel',
    countLabel: '1,2 mil buscas',
    category: 'trending',
  },
  {
    id: '4',
    term: 'Técnicas de Foco e Rotina Pomodoro',
    countLabel: '950 buscas',
    category: 'trending',
  },
  {
    id: '5',
    term: 'Transição de Carreira para Tecnologia',
    countLabel: '820 buscas',
    category: 'trending',
  },
  {
    id: '6',
    term: 'Ganchos de 3s para Reels e Shorts',
    countLabel: '1,5 mil buscas',
    category: 'topic',
  },
  {
    id: '7',
    term: 'Black Friday: Carrosséis de Conversão',
    countLabel: '3,1 mil buscas',
    category: 'topic',
  },
  {
    id: '8',
    term: 'Copywriting para Anúncios Meta e X',
    countLabel: '1,1 mil buscas',
    category: 'topic',
  },
]

export function QuickSearchPalette({ open, onOpenChange }: QuickSearchPaletteProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const { posts = [] } = useSocial?.() || {}
  const [query, setQuery] = useState('')
  const [recents, setRecents] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Carregar recentes do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setRecents(JSON.parse(saved))
      } else {
        setRecents([
          'Técnicas de Redação Nota 1000',
          'ChatGPT e Agentes IA nos Estudos',
          'Atalhos do Excel para Trabalho',
          'Inteligência Artificial na Educação',
        ])
      }
    } catch {
      setRecents([
        'Técnicas de Redação Nota 1000',
        'ChatGPT e Agentes IA nos Estudos',
        'Atalhos do Excel para Trabalho',
      ])
    }
  }, [])

  // Foco no input ao abrir
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [open])

  // Ações Rápidas (adaptadas do modelo DonnaVende com comunidades e atalhos de alta conversão)
  const quickActions: ActionItem[] = useMemo(
    () => [
      {
        id: 'create-post',
        title: 'Criar Post / Carrossel',
        subtitle: 'Com gerador de copy IA e A/B de ganchos',
        icon: PlusCircle,
        iconColor: 'text-violet-500 bg-violet-500/10',
        badge: 'Principal',
        path: '/app/content/new',
        isPrimary: true,
      },
      {
        id: 'what-to-post',
        title: 'O que postar hoje?',
        subtitle: 'Sugestões com IA preditiva e tendências de conteúdo',
        icon: Sparkles,
        iconColor: 'text-amber-500 bg-amber-500/10',
        badge: 'IA Preditiva',
        path: '/app/explorar?modal=what-to-post',
      },
      {
        id: 'create-video',
        title: 'Criar Vídeo com IA',
        subtitle: 'Roteiros verticais e gancho magnético de 3s',
        icon: Video,
        iconColor: 'text-purple-500 bg-purple-500/10',
        path: '/app/criar/videos',
      },
      {
        id: 'new-report',
        title: 'Novo Relatório Avançado',
        subtitle: 'Resumo executivo por IA e insights cruzados de canais',
        icon: FileBarChart,
        iconColor: 'text-emerald-500 bg-emerald-500/10',
        path: '/app/performance?action=new-report',
      },
      {
        id: 'calendar',
        title: 'Abrir Calendário Editorial',
        subtitle: 'Planejamento semanal e horários de pico',
        icon: Calendar,
        iconColor: 'text-blue-500 bg-blue-500/10',
        path: '/app/calendar',
      },
      {
        id: 'explore-ideas',
        title: 'Explorar Ideias & Tendências',
        subtitle: 'Biblioteca de inspirações e busca por hashtag',
        icon: Compass,
        iconColor: 'text-rose-500 bg-rose-500/10',
        path: '/app/explorar',
      },
      {
        id: 'funnel',
        title: 'Funil de Vendas & Anúncios',
        subtitle: 'Meta Ads, Google Ads, X Ads e ROAS consolidado',
        icon: Filter,
        iconColor: 'text-indigo-500 bg-indigo-500/10',
        path: '/app/funnel',
      },
      {
        id: 'social-hub',
        title: 'Hub Social & Biblioteca',
        subtitle: 'Métricas multi-rede e gestão de ativos da marca',
        icon: Share2,
        iconColor: 'text-cyan-500 bg-cyan-500/10',
        path: '/app/social-hub',
      },
    ],
    [],
  )

  // Salvar busca no histórico recente
  const saveSearchTerm = (term: string) => {
    if (!term.trim()) return
    const updated = [
      term.trim(),
      ...recents.filter((t) => t.toLowerCase() !== term.trim().toLowerCase()),
    ].slice(0, 8)
    setRecents(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  // Remover termo individual
  const removeRecentTerm = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = recents.filter((t) => t !== termToRemove)
    setRecents(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  // Ação ao selecionar um termo
  const handleSelectTerm = (term: string) => {
    saveSearchTerm(term)
    onOpenChange(false)
    navigate(`/app/explorar?q=${encodeURIComponent(term)}`)
  }

  // Ação ao selecionar uma ação rápida
  const handleSelectAction = (action: ActionItem) => {
    if (action.onClick) {
      action.onClick()
    } else if (action.path) {
      navigate(action.path)
    }
    onOpenChange(false)
  }

  // Filtragem de Posts da Biblioteca e Ideias quando o usuário digita (título, texto, legenda, tags e rede)
  const matchingPosts = useMemo(() => {
    if (!query.trim() || query.trim().length < 2) return []
    const q = query.toLowerCase()
    return (posts || [])
      .filter((p: any) => {
        const title = (p.title || p.content || '').toLowerCase()
        const content = (p.content || '').toLowerCase()
        const caption = (p.caption || '').toLowerCase()
        const platform = (p.platform || '').toLowerCase()
        const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : ''
        const mediaPrompt = (p.mediaPrompt || p._raw?.media_prompt || '').toLowerCase()
        const hookText = (p.hook || p._raw?.hook || '').toLowerCase()
        const ctaText = (p.cta || p._raw?.cta || '').toLowerCase()
        return (
          title.includes(q) ||
          content.includes(q) ||
          caption.includes(q) ||
          platform.includes(q) ||
          tags.includes(q) ||
          mediaPrompt.includes(q) ||
          hookText.includes(q) ||
          ctaText.includes(q)
        )
      })
      .slice(0, 4)
  }, [posts, query])

  // Templates recomendados pré-definidos para busca rápida
  const BUILTIN_TEMPLATES = useMemo(
    () => [
      {
        id: 'tpl-1',
        title: 'Carrossel Educativo 7 Passos',
        category: 'Carrossel Instagram',
        tags: 'educativo tutorial carrossel engajamento',
        content: 'Passo a passo visual para ensinar sua audiência com slides de alta retenção',
        path: '/app/templates',
      },
      {
        id: 'tpl-2',
        title: 'Story com Enquete de Engajamento',
        category: 'Stories',
        tags: 'interativo enquete perguntas stories',
        content:
          'Aumente o alcance e interação dos seus stories com caixas de perguntas e enquetes',
        path: '/app/templates',
      },
      {
        id: 'tpl-3',
        title: 'Roteiro de Reels com Gancho 3s',
        category: 'Vídeo Vertical',
        tags: 'reels tiktok shorts gancho viral',
        content: 'Roteiro rápido com gancho nos primeiros 3 segundos para reter atenção',
        path: '/app/criar/videos',
      },
      {
        id: 'tpl-4',
        title: 'Post de Autoridade e Prova Social',
        category: 'LinkedIn / Feed',
        tags: 'autoridade linkedin depoimento b2b',
        content: 'Mostre resultados reais e estudos de caso para converter seguidores em clientes',
        path: '/app/content/new',
      },
      {
        id: 'tpl-5',
        title: 'Thread de Curadoria de Ferramentas',
        category: 'Threads / X / Twitter',
        tags: 'threads x twitter lista curadoria',
        content: 'Curadoria de recursos e hacks práticos com alto potencial de repost',
        path: '/app/templates',
      },
      {
        id: 'tpl-6',
        title: 'Pin de Infográfico e Dicas Rápidas',
        category: 'Pinterest',
        tags: 'pinterest infografico trafego dicas',
        content: 'Design vertical otimizado para cliques e tráfego orgânico no Pinterest',
        path: '/app/templates',
      },
    ],
    [],
  )

  const matchingTemplates = useMemo(() => {
    if (!query.trim() || query.trim().length < 2) return []
    const q = query.toLowerCase()
    return BUILTIN_TEMPLATES.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.tags && t.tags.toLowerCase().includes(q)) ||
        (t.content && t.content.toLowerCase().includes(q)),
    ).slice(0, 4)
  }, [BUILTIN_TEMPLATES, query])

  // Filtragem conforme a digitação
  const filteredRecents = useMemo(() => {
    if (!query.trim()) return recents
    return recents.filter((r) => r.toLowerCase().includes(query.toLowerCase()))
  }, [recents, query])

  const filteredTrending = useMemo(() => {
    if (!query.trim()) return INITIAL_TRENDING
    return INITIAL_TRENDING.filter((t) => t.term.toLowerCase().includes(query.toLowerCase()))
  }, [query])

  const filteredActions = useMemo(() => {
    if (!query.trim()) return quickActions
    return quickActions.filter(
      (a) =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(query.toLowerCase()),
    )
  }, [quickActions, query])

  // Lista navegável de itens para teclado (setas cima/baixo + enter)
  const navigableItems = useMemo(() => {
    const list: Array<{
      type: 'recent' | 'trending' | 'action' | 'post' | 'template'
      data: any
    }> = []
    filteredRecents.forEach((r) => list.push({ type: 'recent', data: r }))
    filteredTrending.forEach((t) => list.push({ type: 'trending', data: t }))
    filteredActions.forEach((a) => list.push({ type: 'action', data: a }))
    matchingPosts.forEach((p) => list.push({ type: 'post', data: p }))
    matchingTemplates.forEach((t) => list.push({ type: 'template', data: t }))
    return list
  }, [filteredRecents, filteredTrending, filteredActions, matchingPosts, matchingTemplates])

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, navigableItems.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(
        (prev) => (prev - 1 + navigableItems.length) % Math.max(1, navigableItems.length),
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (query.trim() && navigableItems.length === 0) {
        handleSelectTerm(query.trim())
        return
      }
      const item = navigableItems[selectedIndex]
      if (item) {
        if (item.type === 'recent') {
          handleSelectTerm(item.data)
        } else if (item.type === 'trending') {
          handleSelectTerm(item.data.term)
        } else if (item.type === 'action') {
          handleSelectAction(item.data)
        } else if (item.type === 'post') {
          onOpenChange(false)
          navigate(`/app/editor/${item.data.id}`)
        } else if (item.type === 'template') {
          onOpenChange(false)
          navigate(item.data.path)
        }
      } else if (query.trim()) {
        handleSelectTerm(query.trim())
      }
    } else if (e.key === 'Escape') {
      onOpenChange(false)
    }
  }

  // Destaque do texto pesquisado
  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <span className="bg-purple-500/20 text-purple-600 font-bold rounded px-0.5">
          {text.slice(idx, idx + q.length)}
        </span>
        {text.slice(idx + q.length)}
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 overflow-hidden max-w-2xl bg-card border border-border/80 shadow-2xl rounded-t-3xl sm:rounded-3xl gap-0 max-h-[88vh] flex flex-col focus:outline-none max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none sm:top-[12%] sm:translate-y-0 sm:max-h-[82vh]"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">Busca Rápida e Ações (Ctrl+K)</DialogTitle>
        <DialogDescription className="sr-only">
          Pesquise termos recentes, assuntos em alta e atalhos rápidos do MidiaViva.
        </DialogDescription>

        {/* Topo do Modelo DonnaVende: Input com Ícone de Lupa e Badge */}
        <div className="p-3 sm:p-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-purple-500/40 bg-card shadow-xs focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
            {/* Pill de contexto r/mudarcurso (fiel ao visual DonnaVende) */}
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold text-xs shrink-0 border border-purple-500/20">
              <Search className="w-3 h-3 text-purple-600" />
              <span>r/mudarcurso</span>
            </span>
            <Search className="w-4 h-4 text-purple-600 shrink-0 sm:hidden" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              placeholder="Buscar no Reddit MudarCurso ou MidiaViva..."
              className="flex-1 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground outline-none font-medium min-w-0"
              aria-label="Campo de busca rápida"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-muted text-muted-foreground rounded border border-border">
                  ESC
                </kbd>
              </div>
            )}
          </div>

          {/* Banner Modelo: "Perguntar à Donna IA / BestContent IA" */}
          <div
            onClick={() => {
              onOpenChange(false)
              navigate('/app/content/new')
            }}
            className="mt-2.5 p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-transparent border border-emerald-500/20 flex items-center justify-between cursor-pointer hover:border-emerald-500/40 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-bold text-foreground group-hover:text-emerald-600 transition-colors block">
                  Perguntar à BestContent IA
                </span>
                <span className="text-[11px] text-muted-foreground line-clamp-1">
                  Tire dúvidas, gere ideias estratégicas ou crie posts instantaneamente
                </span>
              </div>
            </div>
            <Send className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </div>

        {/* Corpo com Scroll: Recentes, Em Alta e Ações Rápidas (Comunidades) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* Seção 1: RECENTES */}
          {filteredRecents.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 flex items-center justify-between">
                <span>RECENTES</span>
                <span className="text-[10px] lowercase text-muted-foreground/80 font-normal">
                  histórico local
                </span>
              </div>
              <div className="space-y-0.5">
                {filteredRecents.map((item, idx) => {
                  const globalIdx = idx
                  const isSelected = selectedIndex === globalIdx
                  return (
                    <div
                      key={item}
                      onClick={() => handleSelectTerm(item)}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold'
                          : 'hover:bg-muted/70 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{highlightMatch(item, query)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => removeRecentTerm(item, e)}
                        className="p-1 rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                        title="Remover das buscas recentes"
                        aria-label="Remover termo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Seção 2: EM ALTA */}
          {filteredTrending.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 flex items-center gap-1.5">
                <span className="text-orange-500">🔥</span>
                <span>EM ALTA</span>
              </div>
              <div className="space-y-0.5">
                {filteredTrending.map((item, idx) => {
                  const globalIdx = filteredRecents.length + idx
                  const isSelected = selectedIndex === globalIdx
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectTerm(item.term)}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold'
                          : 'hover:bg-muted/70 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{highlightMatch(item.term, query)}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono shrink-0 ml-2">
                        {item.countLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Seção 3: AÇÕES RÁPIDAS (Adaptação de "Comunidades em alta" do modelo DonnaVende) */}
          {filteredActions.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-border/50">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 flex items-center justify-between">
                <span>AÇÕES RÁPIDAS & ATALHOS</span>
                <span className="text-[10px] text-purple-600 font-bold flex items-center gap-0.5">
                  Navegação direta
                </span>
              </div>
              <div className="space-y-1.5">
                {filteredActions.map((action, idx) => {
                  const globalIdx = filteredRecents.length + filteredTrending.length + idx
                  const isSelected = selectedIndex === globalIdx
                  const Icon = action.icon
                  return (
                    <div
                      key={action.id}
                      onClick={() => handleSelectAction(action)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-border/60 bg-card hover:border-purple-500/30 hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${action.iconColor}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                              {action.title}
                            </span>
                            {action.badge && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 border-purple-500/30 text-purple-600"
                              >
                                {action.badge}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground block truncate">
                            {action.subtitle}
                          </span>
                        </div>
                      </div>

                      {action.isPrimary ? (
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-7 px-2.5 rounded-lg shrink-0 gap-1 shadow-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectAction(action)
                          }}
                        >
                          <span>Acessar</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Seção 4: RESULTADOS NA BIBLIOTECA & TEMPLATES (quando pesquisa ativa) */}
          {matchingPosts.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-border/50">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 flex items-center justify-between">
                <span>POSTS DA BIBLIOTECA</span>
                <span className="text-[10px] text-muted-foreground">conteúdo salvo</span>
              </div>
              <div className="space-y-1">
                {matchingPosts.map((post: any, idx) => {
                  const globalIdx =
                    filteredRecents.length + filteredTrending.length + filteredActions.length + idx
                  const isSelected = selectedIndex === globalIdx
                  return (
                    <div
                      key={post.id}
                      onClick={() => {
                        onOpenChange(false)
                        navigate(`/app/editor/${post.id}`)
                      }}
                      className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-border/60 bg-card hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <FolderOpen className="w-4 h-4 text-purple-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">
                            {post.content || post.caption || 'Sem título'}
                          </p>
                          <p className="text-[10px] text-muted-foreground capitalize">
                            {post.platform || 'Geral'} • {post.status || 'rascunho'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
                        Abrir
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {matchingTemplates.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-border/50">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground px-2 flex items-center justify-between">
                <span>TEMPLATES SUGERIDOS</span>
                <span className="text-[10px] text-muted-foreground">modelos prontos</span>
              </div>
              <div className="space-y-1">
                {matchingTemplates.map((tpl, idx) => {
                  const globalIdx =
                    filteredRecents.length +
                    filteredTrending.length +
                    filteredActions.length +
                    matchingPosts.length +
                    idx
                  const isSelected = selectedIndex === globalIdx
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => {
                        onOpenChange(false)
                        navigate(tpl.path)
                      }}
                      className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-border/60 bg-card hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">{tpl.title}</p>
                          <p className="text-[10px] text-muted-foreground">{tpl.category}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
                        Usar
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé informativo */}
        <div className="p-2 sm:p-2.5 border-t border-border/60 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground px-4">
          <div className="flex items-center gap-2">
            <span>
              Use <strong className="text-foreground">↑</strong>{' '}
              <strong className="text-foreground">↓</strong> para navegar
            </span>
            <span>•</span>
            <span>
              <strong className="text-foreground">Enter</strong> para selecionar
            </span>
          </div>
          <span className="hidden sm:inline text-purple-600 font-semibold">
            MidiaViva Search Engine
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
