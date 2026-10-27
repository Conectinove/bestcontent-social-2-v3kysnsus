import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  ShieldCheck,
  Calendar,
  Lock,
  Sparkles,
  Share2,
  ChevronLeft,
  ArrowRight,
  Send,
  Eye,
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

interface ReviewPost {
  id: string
  title: string
  date: string
  time: string
  network: string
  format: string
  caption: string
  imageUrl: string
  status: 'pending' | 'approved' | 'rejected'
  feedback?: string
}

const SAMPLE_POSTS: ReviewPost[] = [
  {
    id: 'p-1',
    title: 'Transforme sua Carreira em 2026',
    date: 'Seg, 15 Set',
    time: '09:00',
    network: 'Instagram Feed',
    format: 'Carrossel (1080×1350)',
    caption:
      '🚀 Você está pronto para acelerar suas metas? Confira os 5 passos práticos para dominar a nova economia digital com nossos cursos práticos. Comente EU QUERO para receber o guia completo no direct! 💡 #educacao #carreira #mudarcurso #inovacao',
    imageUrl: 'https://img.usecurling.com/p/800/800?q=education+study+student',
    status: 'approved',
  },
  {
    id: 'p-2',
    title: 'Bastidores: Como Criamos Nossas Aulas',
    date: 'Qua, 17 Set',
    time: '18:30',
    network: 'Reels / TikTok',
    format: 'Vídeo 9:16',
    caption:
      '🎬 Um dia na produção dos melhores conteúdos para você aprender de verdade. Conte nos comentários qual profissão você quer ver na próxima semana! 👇',
    imageUrl: 'https://img.usecurling.com/p/800/1000?q=video+studio+recording',
    status: 'pending',
  },
  {
    id: 'p-3',
    title: 'Depoimento Aluno Destaque',
    date: 'Sex, 19 Set',
    time: '12:00',
    network: 'LinkedIn & Instagram',
    format: 'Card Notícia (1:1)',
    caption:
      '⭐ "Em menos de 3 meses consegui meu primeiro contrato como gestor de tráfego." Parabéns ao nosso aluno pela conquista! O próximo case pode ser você.',
    imageUrl: 'https://img.usecurling.com/p/800/800?q=success+office+happy',
    status: 'pending',
  },
]

export default function ClientApprovalPage() {
  const { slug } = useParams<{ slug: string }>()

  // Recupera dados do link salvo no localStorage ou usa fallback
  const linkData = useMemo(() => {
    try {
      const saved = localStorage.getItem('client_portal_links')
      if (saved) {
        const list = JSON.parse(saved)
        const found = list.find((item: any) => item.slug === slug || item.id === slug)
        if (found) return found
      }
    } catch {
      /* fallback */
    }
    return {
      title: 'Calendário de Conteúdos Estratégicos',
      clientName: 'Cliente VIP',
      brandName: 'MudarCurso',
      passwordProtected: false,
      postsCount: 3,
    }
  }, [slug])

  const [isUnlocked, setIsUnlocked] = useState(!linkData.passwordProtected)
  const [enteredPassword, setEnteredPassword] = useState('')
  const [posts, setPosts] = useState<ReviewPost[]>(SAMPLE_POSTS)
  const [selectedPost, setSelectedPost] = useState<ReviewPost | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [batchApproved, setBatchApproved] = useState(false)

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!enteredPassword.trim()) {
      toast({
        title: 'Senha obrigatória',
        description: 'Digite a senha fornecida pela sua agência.',
        variant: 'destructive',
      })
      return
    }
    // Aceita qualquer senha preenchida para conveniência do preview
    setIsUnlocked(true)
    toast({
      title: 'Acesso liberado!',
      description: 'Bem-vindo ao portal de aprovação do seu calendário.',
    })
  }

  const handleApprove = (id: string) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p)))
    toast({
      title: 'Post aprovado com sucesso!',
      description: 'Sua agência foi notificada da aprovação.',
    })
  }

  const handleOpenReject = (post: ReviewPost) => {
    setSelectedPost(post)
    setFeedbackText(post.feedback || '')
    setFeedbackDialogOpen(true)
  }

  const handleSubmitFeedback = () => {
    if (!selectedPost) return
    setPosts((prev) =>
      prev.map((p) =>
        p.id === selectedPost.id ? { ...p, status: 'rejected', feedback: feedbackText } : p,
      ),
    )
    toast({
      title: 'Ajuste solicitado',
      description: 'Sua observação foi salva e encaminhada para a agência.',
    })
    setFeedbackDialogOpen(false)
    setSelectedPost(null)
    setFeedbackText('')
  }

  const handleApproveAll = () => {
    setPosts((prev) => prev.map((p) => ({ ...p, status: 'approved' })))
    setBatchApproved(true)
    toast({
      title: 'Todos os posts foram aprovados!',
      description: 'Obrigado por validar o calendário completo.',
    })
  }

  const approvedCount = posts.filter((p) => p.status === 'approved').length
  const pendingCount = posts.filter((p) => p.status === 'pending').length
  const rejectedCount = posts.filter((p) => p.status === 'rejected').length
  const approvalPercent = Math.round((approvedCount / posts.length) * 100)

  // Tela de bloqueio por senha
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center ring-1 ring-purple-500/20">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white">Calendário Protegido</h2>
            <p className="text-xs text-slate-400">
              {linkData.title} · {linkData.clientName}
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3">
            <Input
              type="password"
              placeholder="Digite a senha de acesso"
              value={enteredPassword}
              onChange={(e) => setEnteredPassword(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white rounded-xl text-center text-sm"
              autoFocus
            />
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm h-11"
            >
              Liberar Acesso
            </Button>
          </form>

          <p className="text-[11px] text-slate-500">
            MidiaViva — Portal de Aprovação White-Label para Clientes
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Brand Bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-xs">
            {linkData.brandName ? linkData.brandName[0]?.toUpperCase() : 'M'}
          </div>
          <div>
            <h1 className="font-bold text-sm text-foreground line-clamp-1">{linkData.title}</h1>
            <p className="text-xs text-muted-foreground">
              Preparado para <strong className="text-foreground">{linkData.clientName}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="hidden sm:inline-flex bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold border-purple-500/20 text-xs px-2.5 py-1"
          >
            {approvalPercent}% Aprovado
          </Badge>
          <Button
            size="sm"
            onClick={handleApproveAll}
            disabled={batchApproved || pendingCount === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 h-9"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Aprovar Calendário Todo</span>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Banner de status */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-900/40 via-purple-800/30 to-indigo-900/40 border border-purple-500/20 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Central de Aprovação do Cliente
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              Revise e aprove suas publicações
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              Nossa equipe preparou as peças abaixo alinhadas à sua estratégia. Você pode aprovar em
              lote ou deixar comentários específicos em cada card.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-card/70 border border-border rounded-2xl px-4 py-3 text-center min-w-[90px]">
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {approvedCount}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">Aprovados</p>
            </div>
            <div className="bg-card/70 border border-border rounded-2xl px-4 py-3 text-center min-w-[90px]">
              <p className="text-2xl font-black text-amber-500">{pendingCount}</p>
              <p className="text-[11px] text-muted-foreground font-medium">Pendentes</p>
            </div>
            <div className="bg-card/70 border border-border rounded-2xl px-4 py-3 text-center min-w-[90px]">
              <p className="text-2xl font-black text-rose-500">{rejectedCount}</p>
              <p className="text-[11px] text-muted-foreground font-medium">Ajustes</p>
            </div>
          </div>
        </div>

        {/* Grade de posts do calendário */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                {/* Imagem do post */}
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <Badge className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold border-none">
                      {post.network}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    {post.status === 'approved' && (
                      <Badge className="bg-emerald-500 text-white font-bold text-xs gap-1 border-none shadow-xs">
                        <Check className="w-3 h-3" /> Aprovado
                      </Badge>
                    )}
                    {post.status === 'pending' && (
                      <Badge className="bg-amber-500 text-white font-bold text-xs gap-1 border-none shadow-xs">
                        <Clock className="w-3 h-3" /> Pendente
                      </Badge>
                    )}
                    {post.status === 'rejected' && (
                      <Badge className="bg-rose-500 text-white font-bold text-xs gap-1 border-none shadow-xs">
                        <XCircle className="w-3 h-3" /> Ajuste
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Dados da peça */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {post.date} às {post.time}
                    </span>
                    <span className="text-[11px]">{post.format}</span>
                  </div>

                  <h3 className="font-bold text-base text-foreground leading-snug">{post.title}</h3>

                  <div className="bg-muted/40 p-3 rounded-2xl border border-border/60">
                    <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto scrollbar-thin">
                      {post.caption}
                    </p>
                  </div>

                  {post.feedback && (
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
                      <strong>Seu comentário de ajuste:</strong> {post.feedback}
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="p-5 pt-0 border-t border-border/50 flex items-center justify-between gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenReject(post)}
                  className="rounded-xl text-xs gap-1.5 flex-1 border-rose-300/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Pedir Ajuste</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleApprove(post.id)}
                  disabled={post.status === 'approved'}
                  className="rounded-xl text-xs gap-1.5 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{post.status === 'approved' ? 'Aprovado' : 'Aprovar'}</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Rodapé do cliente */}
        <div className="border-t border-border pt-6 text-center space-y-2 text-xs text-muted-foreground">
          <p>
            Dúvidas ou alterações urgentes? Entre em contato com seu gestor de conta pelo WhatsApp.
          </p>
          <p className="text-[11px] text-muted-foreground/70">
            MidiaViva — Powered by BestContent AI · Portal do Cliente Seguro
          </p>
        </div>
      </main>

      {/* Modal: Solicitar Ajuste */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-rose-500" />
              Solicitar Ajuste neste Post
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground">
              Descreva detalhadamente o que você gostaria de mudar (ex: trocar foto, alterar preço,
              mudar tom da legenda):
            </p>
            <textarea
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Ex: Favor ajustar a data limite da promoção para domingo e alterar a frase inicial..."
              className="w-full rounded-2xl border border-input bg-background p-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFeedbackDialogOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmitFeedback}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl gap-1.5 font-bold"
            >
              <Send className="w-3.5 h-3.5" /> Enviar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
