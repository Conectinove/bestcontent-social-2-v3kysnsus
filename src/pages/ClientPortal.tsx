import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Filter,
  Plus,
  Star,
  Grid,
  List,
  FileText,
  Archive,
  Crown,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Copy,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  LayoutTemplate,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { useSocial } from '@/context/SocialContext'
import { useAuth } from '@/context/AuthContext'
import { QuickOnboardingModal } from '@/components/QuickOnboardingModal'
import { PortalPagesManager } from '@/components/settings/PortalPagesManager'

// As 8 dicas MAX solicitadas no briefing na ordem exata
const DICAS_MAX = [
  'Cliente que recebe link com senha tem 2× mais engajamento na revisão',
  'Calendários enviados pela manhã têm 40% mais resposta no mesmo dia',
  'Comentários por post reduzem rodadas de ajuste pela metade',
  'Aprovação em lote acelera o fluxo em até 3×',
  'Lembretes automáticos diminuem o tempo médio de resposta',
  'Preview no celular é o mais usado — sempre revise no mobile antes de enviar',
  'Calendários quinzenais têm taxa de aprovação maior que mensais',
  'Capa do calendário com nome do cliente aumenta a sensação de cuidado',
]

type ActiveTab = 'paginas' | 'foco' | 'grid' | 'lista' | 'rascunhos' | 'arquivados'

interface ClientCalendarLink {
  id: string
  title: string
  clientName: string
  brandId?: string
  brandName?: string
  slug: string
  postsCount: number
  status: 'active' | 'draft' | 'archived'
  createdAt: string
  passwordProtected: boolean
  approvalRate?: string
  lastActivity?: string
}

const INITIAL_LINKS: ClientCalendarLink[] = [
  {
    id: 'link-1',
    title: 'Campanha de Matrículas 2026',
    clientName: 'MudarCurso',
    brandName: 'MudarCurso',
    slug: 'mudarcurso-matriculas-2026',
    postsCount: 12,
    status: 'active',
    createdAt: 'Hoje',
    passwordProtected: true,
    approvalRate: '85%',
    lastActivity: 'Há 20 min',
  },
  {
    id: 'link-2',
    title: 'Divulgação 36ª Copa Rotary / Cresol',
    clientName: 'Comissão Central',
    brandName: '36 Copa Rotary/Cresol 2026',
    slug: 'copa-rotary-cresol-2026',
    postsCount: 8,
    status: 'active',
    createdAt: 'Ontem',
    passwordProtected: false,
    approvalRate: '100%',
    lastActivity: 'Ontem às 18:30',
  },
  {
    id: 'link-3',
    title: 'Semana das Profissões Lucrativas',
    clientName: 'Conectinove Franchising',
    brandName: 'Conectinove Profissões Lucrativas',
    slug: 'conectinove-profissoes-lucrativas',
    postsCount: 15,
    status: 'draft',
    createdAt: '3 dias atrás',
    passwordProtected: true,
    approvalRate: '0%',
    lastActivity: '3 dias atrás',
  },
]

export default function ClientPortal() {
  const { brands } = useSocial()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<ActiveTab>('paginas')
  const [currentTipIndex, setCurrentTipIndex] = useState(5) // Inicia na dica 5 ("Preview no celular...")
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [newLinkOpen, setNewLinkOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [quickOnboardOpen, setQuickOnboardOpen] = useState(false)

  // Filter state
  const [filterWaiting, setFilterWaiting] = useState(true)
  const [filterApproved, setFilterApproved] = useState(true)
  const [filterAdjustments, setFilterAdjustments] = useState(true)

  // Novo link form state
  const [calendarTitle, setCalendarTitle] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [clientName, setClientName] = useState('')
  const [requirePassword, setRequirePassword] = useState(false)
  const [password, setPassword] = useState('')
  const [createdLinks, setCreatedLinks] = useState<ClientCalendarLink[]>(() => {
    const saved = localStorage.getItem('client_portal_links')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        /* intentionally ignored */
      }
    }
    return INITIAL_LINKS
  })

  // Save links to localStorage
  useEffect(() => {
    localStorage.setItem('client_portal_links', JSON.stringify(createdLinks))
  }, [createdLinks])

  // Marca/organização do usuário logado alimenta o gerenciador de páginas do portal
  const brandId = brands[0]?.id || ''
  const userId = user?.id || ''

  // Rotação automática das dicas MAX a cada 6 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % DICAS_MAX.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!calendarTitle.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Dê um nome para o link do calendário.',
        variant: 'destructive',
      })
      return
    }

    const bMatch = brands.find((b: any) => b.id === selectedBrand)

    const newLink: ClientCalendarLink = {
      id: `link-${Date.now()}`,
      title: calendarTitle,
      clientName: clientName || (bMatch ? bMatch.name : 'Cliente VIP'),
      brandId: selectedBrand || undefined,
      brandName: bMatch ? bMatch.name : 'Geral',
      slug: calendarTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, ''),
      postsCount: 6,
      status: 'active',
      createdAt: 'Agora',
      passwordProtected: requirePassword,
      approvalRate: '0%',
      lastActivity: 'Criado agora',
    }

    setCreatedLinks((prev) => [newLink, ...prev])
    toast({
      title: 'Link de aprovação criado!',
      description: 'Copie e compartilhe com seu cliente para revisão.',
    })

    setCalendarTitle('')
    setClientName('')
    setPassword('')
    setRequirePassword(false)
    setNewLinkOpen(false)
  }

  const handleCopyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/review/${slug}`
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullUrl).catch(() => {})
    }
    toast({
      title: 'Link copiado!',
      description: fullUrl,
    })
  }

  const handleOpenLink = (slug: string) => {
    window.open(`/review/${slug}`, '_blank', 'noopener,noreferrer')
  }

  const handleDeleteLink = (id: string) => {
    setCreatedLinks((prev) => prev.filter((item) => item.id !== id))
    toast({
      title: 'Link removido',
      description: 'O link do calendário foi excluído do portal.',
    })
  }

  // Filtered links
  const filteredLinks = useMemo(() => {
    return createdLinks.filter((item) => {
      // Tab filter
      if (activeTab === 'foco' && item.status !== 'active') return false
      if (activeTab === 'rascunhos' && item.status !== 'draft') return false
      if (activeTab === 'arquivados' && item.status !== 'archived') return false

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matchTitle = item.title.toLowerCase().includes(q)
        const matchClient = item.clientName.toLowerCase().includes(q)
        const matchBrand = (item.brandName || '').toLowerCase().includes(q)
        if (!matchTitle && !matchClient && !matchBrand) return false
      }

      return true
    })
  }, [createdLinks, activeTab, searchTerm])

  // Monthly stats calculations
  const totalCalendars = createdLinks.length
  const activeCalendars = createdLinks.filter((l) => l.status === 'active').length
  const uniqueClients = new Set(createdLinks.map((l) => l.clientName)).size

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-foreground">
      {/* =========================================================================
          CABEÇALHO DO PORTAL DO CLIENTE
          ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-4xl font-black font-heading tracking-tight text-foreground">
              Portal do Cliente
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-mono px-2 py-0.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
            >
              Dados Oficiais
            </Badge>

            {/* Badge roxo claro com coroa "👑 MAX" */}
            <Badge
              variant="secondary"
              className="bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-bold tracking-wide text-xs px-2.5 py-0.5 rounded-full border border-purple-200/60 dark:border-purple-800/60 flex items-center gap-1 shadow-xs"
            >
              <Crown className="w-3.5 h-3.5 fill-purple-600 text-purple-600 dark:fill-purple-400 dark:text-purple-400" />
              <span>MAX</span>
            </Badge>

            {/* Quick onboarding button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickOnboardOpen(true)}
              className="text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 gap-1 h-7 rounded-lg"
              title="Abrir Onboarding IA Vamos Agilizar"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vamos agilizar!</span>
            </Button>

            {/* Ícone de balão de comentário */}
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
              title="Feedback sobre o Portal do Cliente"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground">
            Crie calendários de aprovação interativos para compartilhar com seus clientes
          </p>
        </div>

        {/* Botões do canto superior direito */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setSearchOpen(true)}
            className="rounded-xl border-border bg-card hover:bg-muted text-xs sm:text-sm font-medium h-10 px-3.5 gap-2 shadow-xs"
          >
            <Search className="w-4 h-4 text-muted-foreground" />
            <span>{searchTerm ? `"${searchTerm}"` : 'Buscar'}</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setFilterOpen(true)}
            className="rounded-xl border-border bg-card hover:bg-muted text-xs sm:text-sm font-medium h-10 px-3.5 gap-2 shadow-xs"
          >
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span>Filtrar</span>
          </Button>

          <Button
            onClick={() => setNewLinkOpen(true)}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm h-10 px-4 gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Link</span>
          </Button>
        </div>
      </div>

      {/* =========================================================================
          BARRA DE ABAS
          ========================================================================= */}
      <div className="border-b border-border/80 flex items-center gap-6 overflow-x-auto scrollbar-none text-sm font-medium pt-1">
        {/* Aba Páginas do portal (gerenciador real, dados da marca/organização do usuário logado) */}
        <button
          type="button"
          onClick={() => setActiveTab('paginas')}
          className={`flex items-center gap-1.5 pb-2.5 transition-colors relative whitespace-nowrap ${
            activeTab === 'paginas'
              ? 'text-foreground font-bold border-b-2 border-primary -mb-[1px]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
          <span>Páginas do portal</span>
        </button>

        {/* Aba Foco */}
        <button
          type="button"
          onClick={() => setActiveTab('foco')}
          className={`flex items-center gap-1.5 pb-2.5 transition-colors relative whitespace-nowrap ${
            activeTab === 'foco'
              ? 'text-foreground font-bold border-b-2 border-primary -mb-[1px]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
          <span>Foco</span>
          <span className="text-xs text-muted-foreground ml-0.5">
            {createdLinks.filter((l) => l.status === 'active').length}
          </span>
        </button>

        {/* Aba Grid */}
        <button
          type="button"
          onClick={() => setActiveTab('grid')}
          className={`flex items-center gap-1.5 pb-2.5 transition-colors relative whitespace-nowrap ${
            activeTab === 'grid'
              ? 'text-foreground font-bold border-b-2 border-primary -mb-[1px]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Grid</span>
        </button>

        {/* Aba Lista */}
        <button
          type="button"
          onClick={() => setActiveTab('lista')}
          className={`flex items-center gap-1.5 pb-2.5 transition-colors relative whitespace-nowrap ${
            activeTab === 'lista'
              ? 'text-foreground font-bold border-b-2 border-primary -mb-[1px]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Lista</span>
        </button>

        {/* Aba Rascunhos */}
        <button
          type="button"
          onClick={() => setActiveTab('rascunhos')}
          className={`flex items-center gap-1.5 pb-2.5 transition-colors relative whitespace-nowrap ${
            activeTab === 'rascunhos'
              ? 'text-foreground font-bold border-b-2 border-primary -mb-[1px]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Rascunhos</span>
          <span className="text-xs text-muted-foreground ml-0.5">
            {createdLinks.filter((l) => l.status === 'draft').length}
          </span>
        </button>

        {/* Aba Arquivados */}
        <button
          type="button"
          onClick={() => setActiveTab('arquivados')}
          className={`flex items-center gap-1.5 pb-2.5 transition-colors relative whitespace-nowrap ${
            activeTab === 'arquivados'
              ? 'text-foreground font-bold border-b-2 border-primary -mb-[1px]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Arquivados</span>
          <span className="text-xs text-muted-foreground ml-0.5">
            {createdLinks.filter((l) => l.status === 'archived').length}
          </span>
        </button>
      </div>

      {/* =========================================================================
          CONTEÚDO PRINCIPAL (LAYOUT DUAS COLUNAS: ESQUERDA 2/3, DIREITA 1/3)
          ========================================================================= */}
      {/* Gerenciador de páginas do portal (aba padrão) */}
      {activeTab === 'paginas' && (
        <div>
          {brandId && userId ? (
            <PortalPagesManager brandId={brandId} userId={userId} />
          ) : (
            <Card className="rounded-3xl border border-dashed border-border/80 bg-card">
              <CardContent className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                  <LayoutTemplate className="w-6 h-6 opacity-40" />
                </div>
                <p className="text-sm text-foreground font-bold">Nenhuma marca encontrada</p>
                <p className="text-xs text-muted-foreground">
                  Crie uma marca para gerenciar as páginas do portal.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div
        className={
          activeTab === 'paginas' ? 'hidden' : 'grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'
        }
      >
        {/* COLUNA ESQUERDA (Cards principais e Recentes) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card list vs Grid view vs Empty state */}
          {filteredLinks.length === 0 ? (
            <Card className="rounded-3xl border border-border/80 bg-card shadow-xs">
              <CardContent className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                  <Star className="w-6 h-6 opacity-40" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-foreground font-bold">
                    Nenhum calendário encontrado nesta visualização.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Crie um novo link para começar a coletar aprovações com seu cliente.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setNewLinkOpen(true)}
                  className="bg-primary text-white rounded-xl text-xs gap-1.5 mt-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Criar Primeiro Link
                </Button>
              </CardContent>
            </Card>
          ) : activeTab === 'grid' ? (
            /* Visualização Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredLinks.map((link) => (
                <Card
                  key={link.id}
                  className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-primary flex items-center justify-center font-bold text-xs ring-1 ring-purple-500/20">
                        {link.brandName ? link.brandName[0]?.toUpperCase() : 'C'}
                      </div>
                      <Badge variant="outline" className="text-[10px] font-medium bg-muted/60">
                        {link.clientName}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {link.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {link.postsCount} posts · {link.lastActivity || link.createdAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {link.passwordProtected ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                          <ShieldCheck className="w-3 h-3" /> Protegido com senha
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Link aberto</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/60">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(link.slug)}
                      className="h-8 text-xs gap-1.5 rounded-xl"
                    >
                      <Copy className="w-3 h-3" /> Copiar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenLink(link.slug)}
                      className="h-8 text-xs gap-1 text-primary hover:text-primary rounded-xl"
                    >
                      <span>Abrir</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* Visualização Lista / Foco / Rascunhos */
            <div className="space-y-3">
              {filteredLinks.map((link) => (
                <Card
                  key={link.id}
                  className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs hover:shadow-md transition-shadow group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-primary flex items-center justify-center font-bold text-sm ring-1 ring-purple-500/20 shrink-0">
                        {link.brandName ? link.brandName[0]?.toUpperCase() : 'C'}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {link.title}
                          </h4>
                          <Badge variant="outline" className="text-[10px] bg-muted/40 font-medium">
                            {link.clientName}
                          </Badge>
                          {link.passwordProtected && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" /> Senha
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {link.postsCount} posts inclusos · Criado {link.createdAt} · Status:{' '}
                          <span className="capitalize font-medium text-foreground">
                            {link.status === 'active' ? 'Ativo' : link.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(link.slug)}
                        className="h-8 text-xs gap-1.5 rounded-xl"
                      >
                        <Copy className="w-3 h-3" /> Copiar Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenLink(link.slug)}
                        className="h-8 text-xs gap-1.5 rounded-xl hover:bg-muted"
                      >
                        <ExternalLink className="w-3 h-3" /> Ver
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLink(link.id)}
                        className="text-muted-foreground hover:text-rose-500 transition-colors p-1 text-xs"
                        title="Remover link"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Seção "Recentes" */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-foreground">Recentes</h2>

            {/* Card branco arredondado contendo botão circular "+" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div
                onClick={() => setNewLinkOpen(true)}
                className="w-full sm:w-[220px] h-[190px] rounded-3xl bg-card border border-border/80 p-5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group flex flex-col items-center justify-center text-center"
              >
                {/* Botão circular "+" */}
                <div className="w-12 h-12 rounded-full bg-muted/70 group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary flex items-center justify-center transition-colors mb-3">
                  <Plus className="w-6 h-6 stroke-[2]" />
                </div>

                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                  Novo Link
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Compartilhar calendário</p>
              </div>

              {/* Card atalho: Onboarding IA */}
              <div
                onClick={() => setQuickOnboardOpen(true)}
                className="w-full sm:w-[220px] h-[190px] rounded-3xl bg-purple-500/5 border border-purple-300/40 dark:border-purple-800/40 p-5 shadow-xs hover:shadow-md hover:border-purple-500/60 transition-all cursor-pointer group flex flex-col items-center justify-center text-center"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center transition-colors mb-3 group-hover:scale-105">
                  <Sparkles className="w-6 h-6 stroke-[2]" />
                </div>

                <h3 className="font-bold text-sm text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Vamos agilizar!
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Configurar marca com IA</p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA (Sidebar: Stats, Clientes, Dica MAX) */}
        <div className="space-y-5">
          {/* Card 1: STATS DO MÊS em grid 2×2 (1 coluna no mobile muito estreito) */}
          <Card className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-4 sm:mb-5">
              STATS DO MÊS
            </h3>

            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {/* Calendários */}
              <div className="space-y-0.5">
                <p className="text-2xl sm:text-3xl font-black text-foreground">{totalCalendars}</p>
                <p className="text-xs text-muted-foreground font-medium">Calendários</p>
              </div>

              {/* Taxa de aprov. */}
              <div className="space-y-0.5">
                <p className="text-2xl sm:text-3xl font-black text-foreground">85%</p>
                <p className="text-xs text-muted-foreground font-medium">Taxa de aprov.</p>
              </div>

              {/* Resposta média */}
              <div className="space-y-0.5">
                <p className="text-2xl sm:text-3xl font-black text-foreground">4h</p>
                <p className="text-xs text-muted-foreground font-medium">Resposta média</p>
              </div>

              {/* Clientes ativos */}
              <div className="space-y-0.5">
                <p className="text-2xl sm:text-3xl font-black text-foreground">{uniqueClients}</p>
                <p className="text-xs text-muted-foreground font-medium">Clientes ativos</p>
              </div>
            </div>
          </Card>

          {/* Card 2: Clientes */}
          <Card className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">Clientes</h3>
              <Badge variant="outline" className="text-[10px] font-semibold">
                {uniqueClients} {uniqueClients === 1 ? 'cliente' : 'clientes'}
              </Badge>
            </div>

            {createdLinks.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum cliente ainda.</p>
            ) : (
              <div className="space-y-2.5">
                {Array.from(new Set(createdLinks.map((l) => l.clientName))).map((cName, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors text-xs font-medium"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                        {cName[0]?.toUpperCase()}
                      </div>
                      <span className="truncate text-foreground font-semibold">{cName}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {createdLinks.filter((l) => l.clientName === cName).length} links
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Card 3: Card preto arredondado "+ DICA MAX" */}
          <div className="rounded-3xl bg-slate-900 text-white p-6 shadow-md relative flex flex-col justify-between min-h-[190px]">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">
                <span>+</span>
                <span>DICA MAX</span>
              </div>

              <p className="text-sm font-medium leading-relaxed text-slate-100 pr-2">
                {DICAS_MAX[currentTipIndex]}
              </p>
            </div>

            {/* Dots de paginação com o ativo em roxo */}
            <div className="flex items-center gap-1.5 pt-6">
              {DICAS_MAX.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentTipIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentTipIndex
                      ? 'w-5 bg-purple-400'
                      : 'w-1.5 bg-slate-600 hover:bg-slate-400'
                  }`}
                  aria-label={`Dica ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RODAPÉ DA PÁGINA
          ========================================================================= */}
      <div className="border-t border-border/70 pt-6 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        {/* Esquerda: logo bestcontent AI + Social 2 Powered by BestContent AI */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-foreground">
            {/* Ícone estilizado Bestcontent */}
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black shadow-xs">
              b
            </div>
            <span className="font-extrabold text-sm">bestcontent</span>
            <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-1 py-0.2 rounded">
              AI
            </span>
          </div>

          <span className="text-muted-foreground/60 hidden sm:inline">|</span>

          <span>Social 2 Powered by BestContent AI</span>
        </div>

        {/* Direita: 📣 Novidades · Termos · Privacidade · v2.6.0 */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={() =>
              toast({
                title: 'Novidades v0.0.76',
                description:
                  'Portal do Cliente MAX integrado, aprovações dinâmicas, proteção por senha e links compartilháveis em tempo real.',
              })
            }
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <span>📣</span>
            <span>Novidades</span>
          </button>
          <span>·</span>
          <Link to="/app/settings" className="hover:text-foreground transition-colors">
            Termos
          </Link>
          <span>·</span>
          <Link to="/app/settings" className="hover:text-foreground transition-colors">
            Privacidade
          </Link>
          <span>·</span>
          <span className="font-mono text-muted-foreground/70">v0.0.76</span>
        </div>
      </div>

      {/* =========================================================================
          MODAL: NOVO LINK DO CALENDÁRIO
          ========================================================================= */}
      <Dialog open={newLinkOpen} onOpenChange={setNewLinkOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              Novo Link de Aprovação do Cliente
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateLink} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Título do Calendário / Campanha *
              </label>
              <Input
                placeholder="Ex: Calendário Setembro 2026 - Lançamento"
                value={calendarTitle}
                onChange={(e) => setCalendarTitle(e.target.value)}
                className="text-xs rounded-xl"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Nome do Cliente
              </label>
              <Input
                placeholder="Ex: Conectinove / MudarCurso"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Marca Vinculada
              </label>
              <select
                aria-label="Selecionar Marca Vinculada"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full text-xs rounded-xl border border-input bg-background px-3 py-2.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <option value="">Todas as marcas ou Geral</option>
                {brands.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-border">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  aria-label="Proteger link com senha de acesso"
                  type="checkbox"
                  checked={requirePassword}
                  onChange={(e) => setRequirePassword(e.target.checked)}
                  className="rounded text-primary focus-visible:ring-2 focus-visible:ring-primary"
                />
                <span>Proteger link com senha de acesso</span>
              </label>

              {requirePassword && (
                <div className="mt-2">
                  <Input
                    type="password"
                    placeholder="Digite uma senha simples para o cliente"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewLinkOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-primary text-white hover:bg-primary/90 rounded-xl"
              >
                Gerar Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Buscar */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Buscar Calendários de Clientes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Digite o nome do cliente, campanha ou marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs rounded-xl"
              autoFocus
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{filteredLinks.length} resultados encontrados</span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-primary hover:underline text-xs"
                >
                  Limpar busca
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Filtrar */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Filtrar Calendários</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="font-semibold text-foreground">Status do Link</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterWaiting}
                  onChange={(e) => setFilterWaiting(e.target.checked)}
                  className="rounded text-primary"
                />
                <span>Aguardando revisão do cliente</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterApproved}
                  onChange={(e) => setFilterApproved(e.target.checked)}
                  className="rounded text-primary"
                />
                <span>Aprovados totalmente</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterAdjustments}
                  onChange={(e) => setFilterAdjustments(e.target.checked)}
                  className="rounded text-primary"
                />
                <span>Com comentários / pedidos de ajuste</span>
              </label>
            </div>
            <div className="pt-3 flex justify-end">
              <Button size="sm" onClick={() => setFilterOpen(false)} className="rounded-xl">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Feedback */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Feedback Portal do Cliente MAX
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground">
              Quer sugerir novas funcionalidades ou relatar algo no portal de aprovação dos
              clientes?
            </p>
            <textarea
              rows={4}
              placeholder="Digite aqui sua mensagem..."
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFeedbackOpen(false)}
                className="rounded-xl"
              >
                Fechar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  toast({ title: 'Feedback recebido!', description: 'Obrigado por sua mensagem.' })
                  setFeedbackOpen(false)
                }}
                className="bg-primary text-white rounded-xl"
              >
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Onboarding "Vamos agilizar!" Modal */}
      <QuickOnboardingModal open={quickOnboardOpen} onOpenChange={setQuickOnboardOpen} />
    </div>
  )
}
