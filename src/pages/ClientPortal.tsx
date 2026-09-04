import { useState, useEffect } from 'react'
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
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
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

type ActiveTab = 'foco' | 'grid' | 'lista' | 'rascunhos' | 'arquivados'

interface ClientCalendarLink {
  id: string
  title: string
  clientName: string
  slug: string
  postsCount: number
  status: 'active' | 'draft' | 'archived'
  createdAt: string
  passwordProtected: boolean
}

export default function ClientPortal() {
  const { brands } = useSocial()
  const [activeTab, setActiveTab] = useState<ActiveTab>('foco')
  const [currentTipIndex, setCurrentTipIndex] = useState(5) // Inicia na dica 5 ("Preview no celular...") que aparece no print
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [newLinkOpen, setNewLinkOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  // Novo link form state
  const [calendarTitle, setCalendarTitle] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [clientName, setClientName] = useState('')
  const [requirePassword, setRequirePassword] = useState(false)
  const [password, setPassword] = useState('')
  const [createdLinks, setCreatedLinks] = useState<ClientCalendarLink[]>([])

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

    const newLink: ClientCalendarLink = {
      id: `link-${Date.now()}`,
      title: calendarTitle,
      clientName: clientName || 'Cliente VIP',
      slug: calendarTitle.toLowerCase().replace(/\s+/g, '-'),
      postsCount: 0,
      status: 'active',
      createdAt: 'Hoje',
      passwordProtected: requirePassword,
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
    navigator.clipboard.writeText(fullUrl)
    toast({
      title: 'Link copiado!',
      description: 'URL enviada para a área de transferência.',
    })
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-[#0f172a]">
      {/* =========================================================================
          CABEÇALHO DO PORTAL DO CLIENTE
          ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Portal do Cliente
            </h1>

            {/* Badge roxo claro com coroa "👑 MAX" */}
            <Badge
              variant="secondary"
              className="bg-[#f3e8ff] dark:bg-purple-950/60 text-[#7c3aed] dark:text-purple-300 font-bold tracking-wide text-xs px-2.5 py-0.5 rounded-full border border-purple-200/50 flex items-center gap-1"
            >
              <Crown className="w-3.5 h-3.5 fill-[#7c3aed] text-[#7c3aed]" />
              <span>MAX</span>
            </Badge>

            {/* Ícone de balão de comentário */}
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              title="Feedback sobre o Portal do Cliente"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground">
            Crie calendários de aprovação para compartilhar com seus clientes
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
            <span>Buscar</span>
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
            className="rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm h-10 px-4 gap-2 shadow-sm"
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
        {/* Aba Foco 0 */}
        <button
          type="button"
          onClick={() => setActiveTab('foco')}
          className={`flex items-center gap-1.5 pb-2.5 transition-colors relative whitespace-nowrap ${
            activeTab === 'foco'
              ? 'text-foreground font-bold border-b-2 border-foreground -mb-[1px]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
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
              ? 'text-foreground font-bold border-b-2 border-foreground -mb-[1px]'
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
              ? 'text-foreground font-bold border-b-2 border-foreground -mb-[1px]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Lista</span>
        </button>

        {/* Aba Rascunhos 0 */}
        <button
          type="button"
          onClick={() => setActiveTab('rascunhos')}
          className={`flex items-center gap-1.5 pb-2.5 transition-colors relative whitespace-nowrap ${
            activeTab === 'rascunhos'
              ? 'text-foreground font-bold border-b-2 border-foreground -mb-[1px]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Rascunhos</span>
          <span className="text-xs text-muted-foreground ml-0.5">
            {createdLinks.filter((l) => l.status === 'draft').length}
          </span>
        </button>

        {/* Aba Arquivados 0 */}
        <button
          type="button"
          onClick={() => setActiveTab('arquivados')}
          className={`flex items-center gap-1.5 pb-2.5 transition-colors relative whitespace-nowrap ${
            activeTab === 'arquivados'
              ? 'text-foreground font-bold border-b-2 border-foreground -mb-[1px]'
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* COLUNA ESQUERDA (Cards principais e Recentes) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card grande: Estado Vazio ou Lista */}
          {createdLinks.length === 0 ? (
            <Card className="rounded-3xl border border-border/70 bg-card shadow-xs">
              <CardContent className="py-20 text-center">
                <p className="text-sm text-muted-foreground font-medium">
                  Nenhum calendário aguardando atenção.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {createdLinks.map((link) => (
                <Card
                  key={link.id}
                  className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground">{link.title}</h4>
                        <Badge variant="outline" className="text-[10px]">
                          {link.clientName}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {link.postsCount} posts inclusos · Criado {link.createdAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(link.slug)}
                        className="h-8 text-xs gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copiar Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/review/${link.slug}`, '_blank')}
                        className="h-8 text-xs gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Ver
                      </Button>
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
                className="w-full sm:w-[220px] h-[190px] rounded-3xl bg-card border border-border/70 p-5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group flex flex-col items-center justify-center text-center"
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
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA (Sidebar: Stats, Clientes, Dica MAX) */}
        <div className="space-y-5">
          {/* Card 1: STATS DO MÊS em grid 2×2 */}
          <Card className="rounded-3xl border border-border/70 bg-card p-6 shadow-xs">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-5">
              STATS DO MÊS
            </h3>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              {/* Calendários */}
              <div className="space-y-1">
                <p className="text-3xl font-black text-foreground">{createdLinks.length}</p>
                <p className="text-xs text-muted-foreground font-medium">Calendários</p>
              </div>

              {/* Taxa de aprov. */}
              <div className="space-y-1">
                <p className="text-3xl font-black text-foreground">0%</p>
                <p className="text-xs text-muted-foreground font-medium">Taxa de aprov.</p>
              </div>

              {/* Resposta média */}
              <div className="space-y-1">
                <p className="text-3xl font-black text-foreground">0h</p>
                <p className="text-xs text-muted-foreground font-medium">Resposta média</p>
              </div>

              {/* Clientes ativos */}
              <div className="space-y-1">
                <p className="text-3xl font-black text-foreground">0</p>
                <p className="text-xs text-muted-foreground font-medium">Clientes ativos</p>
              </div>
            </div>
          </Card>

          {/* Card 2: Clientes */}
          <Card className="rounded-3xl border border-border/70 bg-card p-6 shadow-xs">
            <h3 className="text-sm font-bold text-foreground mb-4">Clientes</h3>
            <p className="text-xs text-muted-foreground">Nenhum cliente ainda.</p>
          </Card>

          {/* Card 3: Card preto arredondado "+ DICA MAX" */}
          <div className="rounded-3xl bg-[#0f172a] text-white p-6 shadow-md relative flex flex-col justify-between min-h-[190px]">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#c084fc] uppercase tracking-wider mb-3">
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
                      ? 'w-5 bg-[#c084fc]'
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
            <div className="w-4 h-4 rounded bg-gradient-to-tr from-pink-500 to-purple-600" />
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
                title: 'Novidades v2.6.0',
                description: 'Novo Portal do Cliente MAX e Central Operacional Visão Geral.',
              })
            }
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <span>📣</span>
            <span>Novidades</span>
          </button>
          <span>·</span>
          <a href="#" className="hover:text-foreground transition-colors">
            Termos
          </a>
          <span>·</span>
          <a href="#" className="hover:text-foreground transition-colors">
            Privacidade
          </a>
          <span>·</span>
          <span className="font-mono text-muted-foreground/70">v2.6.0</span>
        </div>
      </div>

      {/* =========================================================================
          MODAL: NOVO LINK DO CALENDÁRIO
          ========================================================================= */}
      <Dialog open={newLinkOpen} onOpenChange={setNewLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              Novo Link de Aprovação do Cliente
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateLink} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Título do Calendário / Campanha
              </label>
              <Input
                placeholder="Ex: Calendário Setembro 2026 - Lançamento"
                value={calendarTitle}
                onChange={(e) => setCalendarTitle(e.target.value)}
                className="text-xs"
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
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Marca Vinculada
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full text-xs rounded-md border border-input bg-background px-3 py-2"
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
                  type="checkbox"
                  checked={requirePassword}
                  onChange={(e) => setRequirePassword(e.target.checked)}
                  className="rounded text-primary"
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
                    className="text-xs"
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
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-white hover:bg-primary/90">
                Gerar Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Buscar */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Buscar Calendários de Clientes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Digite o nome do cliente, campanha ou tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Mostrando resultados filtrados em tempo real.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Filtrar */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Filtrar Calendários</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="font-semibold text-foreground">Status do Link</p>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-primary" />
                <span>Aguardando revisão do cliente</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-primary" />
                <span>Aprovados totalmente</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-primary" />
                <span>Com comentários / pedidos de ajuste</span>
              </label>
            </div>
            <div className="pt-3 flex justify-end">
              <Button size="sm" onClick={() => setFilterOpen(false)}>
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Feedback */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="sm:max-w-md">
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
              className="w-full rounded-md border border-input bg-background p-2 text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setFeedbackOpen(false)}>
                Fechar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  toast({ title: 'Feedback recebido!', description: 'Obrigado por sua mensagem.' })
                  setFeedbackOpen(false)
                }}
                className="bg-primary text-white"
              >
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
