import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Edit3,
  Share2,
  Sparkles,
  Copy,
  CheckCircle2,
  Loader2,
  FlaskConical,
  X,
  MessageSquare,
  Send,
  Clock,
  UserPlus,
  Repeat2,
  Users,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { approvePost } from '@/services/approval'
import {
  addReviewComment,
  getReviewComments,
  setPostReviewStatus,
  assignPostReviewer,
  requestPostChanges,
  getReviewerCandidates,
  ReviewCommentRecord,
} from '@/services/posts'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  getPostMetricsByPost,
  getPostMetricsListByPost,
  getSimulatedMetricFallback,
  getSimulatedMultiNetworkMetrics,
  PostMetric,
} from '@/services/post-metrics'
import { PostPerformanceCard } from '@/components/analytics/PostPerformanceCard'
import { IndividualPostReportTrigger } from '@/components/analytics/IndividualPostReportModal'

interface PostDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: any
  onEditDesign?: () => void
}

export function PostDetailsModal({
  open,
  onOpenChange,
  post,
  onEditDesign,
}: PostDetailsModalProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [approving, setApproving] = useState(false)
  const [metrics, setMetrics] = useState<PostMetric | null>(null)
  const [networkMetricsList, setNetworkMetricsList] = useState<PostMetric[]>([])
  // Workflow "Em Revisão": timeline de comentários da equipe
  const [reviewComments, setReviewComments] = useState<ReviewCommentRecord[]>([])
  const [commentDraft, setCommentDraft] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [movingToApproved, setMovingToApproved] = useState(false)
  // Workflow de aprovação: revisor atribuído + Solicitar mudança
  const [reviewerCandidates, setReviewerCandidates] = useState<
    { id: string; name?: string; email?: string }[]
  >([])
  const [assignedReviewerId, setAssignedReviewerId] = useState<string>('')
  const [assigningReviewer, setAssigningReviewer] = useState(false)
  const [requestingChanges, setRequestingChanges] = useState(false)

  // Carrega candidatos a revisor quando o modal abre (e o revisor já atribuído)
  useEffect(() => {
    if (!open || !post?.id) return
    let active = true
    getReviewerCandidates().then((list) => {
      if (active) setReviewerCandidates(list || [])
    })
    setAssignedReviewerId(post.reviewer || post.reviewer_id || '')
    return () => {
      active = false
    }
  }, [open, post?.id])

  const handleAssignReviewer = async (reviewerId: string) => {
    if (!post?.id || !reviewerId) return
    setAssignedReviewerId(reviewerId)
    setAssigningReviewer(true)
    try {
      const chosen = reviewerCandidates.find((c) => c.id === reviewerId)
      await assignPostReviewer(post.id, reviewerId, chosen?.name || chosen?.email)
      toast({
        title: 'Revisor atribuído!',
        description: `${chosen?.name || chosen?.email || 'Usuário'} agora responde pela revisão deste post.`,
      })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
      setAssignedReviewerId(post.reviewer || '')
    } finally {
      setAssigningReviewer(false)
    }
  }

  const handleRequestChanges = async () => {
    if (!post?.id || !user?.id) return
    setRequestingChanges(true)
    try {
      await requestPostChanges({
        postId: post.id,
        userId: user.id,
        authorName: user.name || user.email || 'Equipe',
        text: commentDraft.trim() || 'Mudança solicitada pela equipe de revisão.',
      })
      setCommentDraft('')
      toast({
        title: 'Mudança solicitada!',
        description: 'O post voltou para Rascunho com a solicitação registrada na timeline.',
      })
      onOpenChange(false)
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setRequestingChanges(false)
    }
  }

  useEffect(() => {
    if (!post?.id) return
    if (post.status === 'published') {
      // Buscar métricas da lista multi-rede
      getPostMetricsListByPost(post.id).then((list) => {
        if (list && list.length > 0) {
          setNetworkMetricsList(list)
          setMetrics(list[0])
        } else {
          // Fallback multi-rede baseado em targetNetworks ou plataforma
          const targetNets =
            Array.isArray(post.targetNetworks) && post.targetNetworks.length > 0
              ? post.targetNetworks
              : [post.platform || 'Instagram']
          const simulatedList = getSimulatedMultiNetworkMetrics(
            post.id,
            targetNets,
            post.created || post.createdAt,
          )
          setNetworkMetricsList(simulatedList)
          setMetrics(
            simulatedList[0] ||
              getSimulatedMetricFallback(post.id, post.platform, post.created || post.createdAt),
          )
        }
      })
    } else {
      setMetrics(null)
      setNetworkMetricsList([])
    }
  }, [post?.id, post?.status, post?.platform, post?.created, post?.createdAt, post?.targetNetworks])

  // Carrega a timeline de comentários de revisão sempre que o modal abre
  useEffect(() => {
    if (!open || !post?.id) {
      setReviewComments([])
      setCommentDraft('')
      return
    }
    let active = true
    getReviewComments(post.id).then((list) => {
      if (active) setReviewComments(list)
    })
    return () => {
      active = false
    }
  }, [open, post?.id])

  if (!post) return null

  const handleApprove = async () => {
    if (!post?.id || !user?.id) return
    setApproving(true)
    try {
      await approvePost(post.id, user.id)
      toast({
        title: 'Post aprovado!',
        description: 'Post aprovado e adicionado à fila de publicação.',
      })
      onOpenChange(false)
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setApproving(false)
    }
  }

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(post.caption || post.content || '')
    toast({ title: 'Copiado!', description: 'Texto da legenda copiado.' })
  }

  // Envia um comentário de revisão para a timeline (persistido em review_comments)
  const handleSendComment = async (kind: 'comentario' | 'ajuste_solicitado' = 'comentario') => {
    if (!post?.id || !commentDraft.trim()) return
    setSendingComment(true)
    try {
      const created = await addReviewComment({
        postId: post.id,
        userId: user?.id,
        authorName: user?.name || user?.email || 'Equipe',
        text: commentDraft,
        kind,
      })
      setReviewComments((prev) => [...prev, created])
      setCommentDraft('')
      toast({
        title: 'Comentário registrado!',
        description: 'A equipe pode ver o comentário na timeline de revisão.',
      })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSendingComment(false)
    }
  }

  // Transição Em Revisão → Aprovado
  const handleMoveToApproved = async () => {
    if (!post?.id || !user?.id) return
    setMovingToApproved(true)
    try {
      await setPostReviewStatus(post.id, 'approved')
      // Registra a aprovação na timeline
      try {
        const approvalComment = await addReviewComment({
          postId: post.id,
          userId: user?.id,
          authorName: user?.name || user?.email || 'Equipe',
          text: 'Post aprovado pela equipe.',
          kind: 'aprovacao',
        })
        setReviewComments((prev) => [...prev, approvalComment])
      } catch {
        /* aprovação já persistida — segue mesmo se o comentário falhar */
      }
      toast({
        title: 'Post aprovado!',
        description: 'Status alterado de Em Revisão para Aprovado.',
      })
      onOpenChange(false)
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setMovingToApproved(false)
    }
  }

  const isEmRevisao = post.status === 'em_revisao'
  const reviewBadgeClass = isEmRevisao
    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Top Header Card */}
        <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`text-xs font-semibold ${reviewBadgeClass}`}>
              {post.status === 'published'
                ? 'Publicado'
                : post.status === 'scheduled'
                  ? 'Agendado'
                  : post.status === 'em_revisao'
                    ? 'Em Revisão'
                    : post.status === 'approved'
                      ? 'Aprovado'
                      : 'Rascunho'}
            </Badge>
            <span className="text-xs text-muted-foreground">• 1 slide</span>
          </div>
        </div>

        {/* Center Preview Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visual Canvas Card */}
            <div className="md:col-span-5 flex justify-center">
              <div className="w-[200px] h-[350px] rounded-2xl bg-gradient-to-b from-indigo-950 via-purple-900 to-indigo-900 text-white p-3 flex flex-col justify-between shadow-lg relative border border-purple-500/30 overflow-hidden">
                <div className="space-y-1">
                  <span className="text-[8px] text-amber-300 font-bold block">
                    cnt9 • MudarCurso
                  </span>
                  <p className="text-xs font-black leading-tight">
                    {post.content ? post.content.slice(0, 50) + '...' : 'Plano de Bordo Realizador'}
                  </p>
                </div>
                <div className="p-2 rounded bg-black/40 text-[9px]">
                  <p className="line-clamp-3">{post.caption || post.content}</p>
                </div>
                <div className="py-1 bg-primary text-[9px] font-bold text-center rounded">
                  TOQUE AQUI E MUDE TUDO
                </div>
              </div>
            </div>

            {/* Post Info & Format Badges */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <h3 className="font-bold text-lg text-foreground">Post para Redes Sociais</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Criado para engajamento e alta conversão.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="text-xs bg-primary/10 text-primary border-primary/20"
                >
                  📷 {post.platform || 'Instagram'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Stories Único
                </Badge>
                <Badge variant="outline" className="text-xs">
                  1080×1920
                </Badge>
              </div>

              {/* Legenda Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Legenda</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyCaption}
                      className="text-primary hover:underline text-xs flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copiar
                    </button>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted/60 text-xs leading-relaxed text-foreground max-h-36 overflow-y-auto whitespace-pre-line border border-border">
                  {post.caption || post.content || 'Sem legenda cadastrada.'}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline de Colaboração & Revisão da Equipe */}
          <div className="pt-4 border-t border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-bold text-foreground">Colaboração & Revisão</h4>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {reviewComments.length}{' '}
                  {reviewComments.length === 1 ? 'comentário' : 'comentários'}
                </Badge>
              </div>
              {post.reviewer_name && (
                <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
                  Colaborador: {post.reviewer_name}
                </span>
              )}
            </div>

            {/* Timeline */}
            {reviewComments.length > 0 ? (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {reviewComments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-border bg-muted/40 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-purple-600/15 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px] font-black shrink-0">
                          {(c.author_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-foreground truncate">
                          {c.author_name || 'Equipe'}
                        </span>
                        {c.kind === 'ajuste_solicitado' && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 bg-rose-500/10 text-rose-600 border-rose-500/30"
                          >
                            Ajuste
                          </Badge>
                        )}
                        {c.kind === 'aprovacao' && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          >
                            Aprovação
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {c.created
                          ? new Date(c.created).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
                      {c.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nenhum comentário ainda. Deixe uma nota para a equipe.
              </p>
            )}

            {/* Revisor atribuído — seletor com candidatos (migration 0072) */}
            <div className="flex items-center gap-2 flex-wrap">
              <UserPlus className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-foreground">Revisor:</span>
              <Select
                value={assignedReviewerId || undefined}
                onValueChange={handleAssignReviewer}
                disabled={assigningReviewer}
              >
                <SelectTrigger className="h-8 w-[220px] text-xs rounded-lg">
                  <SelectValue
                    placeholder={assigningReviewer ? 'Atribuindo...' : 'Selecionar revisor...'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {reviewerCandidates.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Nenhum usuário disponível
                    </div>
                  ) : (
                    reviewerCandidates.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name || c.email || c.id}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {post.reviewer_name && !assignedReviewerId && (
                <span className="text-[11px] text-muted-foreground">
                  atual: {post.reviewer_name}
                </span>
              )}
            </div>

            {/* Campo para escrever comentário */}
            <div className="flex items-start gap-2">
              <Textarea
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Escreva um comentário de revisão para a equipe..."
                className="min-h-[64px] text-xs rounded-xl resize-none"
                disabled={sendingComment}
              />
              <div className="flex flex-col gap-1.5">
                <Button
                  size="sm"
                  onClick={() => handleSendComment('comentario')}
                  disabled={sendingComment || !commentDraft.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-9 px-3 gap-1.5"
                >
                  {sendingComment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Enviar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSendComment('ajuste_solicitado')}
                  disabled={sendingComment || !commentDraft.trim()}
                  className="text-xs h-8 px-3 gap-1.5 border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
                >
                  Ajuste
                </Button>
              </div>
            </div>
          </div>

          {/* Análise de Performance do Post (quando publicado) */}
          {post.status === 'published' && (
            <div className="pt-2 border-t border-border/80 space-y-2">
              <PostPerformanceCard
                metrics={metrics}
                networkMetricsList={networkMetricsList}
                brandAverageRate={5.1}
                brandId={post.brandId || post.brand}
              />
              {/* Relatório avançado com IA deste post individual */}
              <IndividualPostReportTrigger post={post} className="w-full" />
            </div>
          )}
        </div>

        {/* Bottom Modal Actions */}
        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEditDesign} className="text-xs gap-1.5">
              <Edit3 className="w-3.5 h-3.5" /> Editar Design
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                navigate(`/app/dashboard?postId=${post.id}`)
              }}
              className="text-xs gap-1.5"
            >
              <FlaskConical className="w-3.5 h-3.5" /> Teste A/B
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> Compartilhar
            </Button>
            {post.status === 'em_revisao' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMoveToApproved}
                disabled={movingToApproved}
                className="text-xs gap-1.5 border-purple-500/30 text-purple-600 hover:bg-purple-500/10"
              >
                {movingToApproved ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Aprovar (sair de Em Revisão)
              </Button>
            )}
            {(post.status === 'draft' || post.status === 'scheduled') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleApprove}
                disabled={approving}
                className="text-xs gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              >
                {approving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Aprovar
              </Button>
            )}
            {/* Solicitar mudança — volta o post para Rascunho com comentário na timeline */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestChanges}
              disabled={requestingChanges}
              className="text-xs gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
              title="Devolve o post para Rascunho e registra a solicitação na timeline de revisão"
            >
              {requestingChanges ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Repeat2 className="w-3.5 h-3.5" />
              )}
              Solicitar mudança
            </Button>
            <Button size="sm" className="bg-primary text-white text-xs gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Publicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
