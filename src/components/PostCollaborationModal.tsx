import { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { pb } from '@/lib/pocketbase/client'
import {
  assignPostReviewer,
  addReviewComment,
  getReviewComments,
  setPostReviewStatus,
  type ReviewCommentRecord,
} from '@/services/posts'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface PostCollaborationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: string | null
  postTitle?: string
  currentReviewerId?: string
  currentReviewerName?: string
  onReviewerAssigned?: (reviewerId: string, reviewerName: string) => void
}

interface ReviewerCandidate {
  id: string
  name?: string
  email?: string
}

export function PostCollaborationModal({
  open,
  onOpenChange,
  postId,
  postTitle,
  currentReviewerId,
  currentReviewerName,
  onReviewerAssigned,
}: PostCollaborationModalProps) {
  const { user } = useAuth()
  const [candidates, setCandidates] = useState<ReviewerCandidate[]>([])
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>(currentReviewerId || '')
  const [reviewerName, setReviewerName] = useState<string>(currentReviewerName || '')
  const [assigning, setAssigning] = useState(false)
  const [comments, setComments] = useState<ReviewCommentRecord[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  // Carrega candidatos a revisor da coleção users
  useEffect(() => {
    if (!open) return
    let active = true
    pb.collection('users')
      .getFullList({ sort: 'name', requestKey: null })
      .then((records) => {
        if (!active) return
        const mapped = records
          .filter((r) => r.id !== user?.id)
          .map((r) => ({
            id: r.id,
            name: (r.name as string) || (r.email as string) || r.id,
            email: r.email as string,
          }))
        setCandidates(mapped)
      })
      .catch((err) => {
        console.warn('Falha ao listar usuários para colaboração:', err)
      })
    return () => {
      active = false
    }
  }, [open, user?.id])

  // Carrega comentários se o post já foi salvo
  useEffect(() => {
    if (!open || !postId) {
      setComments([])
      return
    }
    setLoadingComments(true)
    getReviewComments(postId)
      .then((recs) => setComments(recs))
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false))
  }, [open, postId])

  // Atualiza revisor selecionado se vier via props
  useEffect(() => {
    if (currentReviewerId) setSelectedReviewerId(currentReviewerId)
    if (currentReviewerName) setReviewerName(currentReviewerName)
  }, [currentReviewerId, currentReviewerName])

  const handleAssignReviewer = async (newId: string) => {
    setSelectedReviewerId(newId)
    const target = candidates.find((c) => c.id === newId)
    const targetName = target?.name || target?.email || 'Colaborador'
    setReviewerName(targetName)

    if (!postId) {
      // Post ainda não foi persistido no banco — guarda localmente
      if (onReviewerAssigned) onReviewerAssigned(newId, targetName)
      toast({
        title: 'Colaborador selecionado',
        description: `${targetName} será atribuído quando você salvar o post.`,
      })
      return
    }

    setAssigning(true)
    try {
      await assignPostReviewer(postId, newId, targetName)
      await setPostReviewStatus(postId, 'em_revisao')
      toast({
        title: 'Colaborador atribuído!',
        description: `${targetName} foi convidado para revisar o post. O status mudou para "Em Revisão".`,
      })
      if (onReviewerAssigned) onReviewerAssigned(newId, targetName)

      // Adiciona nota na timeline
      try {
        const comment = await addReviewComment({
          postId,
          userId: user?.id,
          authorName: user?.name || user?.email || 'Autor',
          text: `Atribuiu ${targetName} como revisor do post.`,
          kind: 'comentario',
        })
        setComments((prev) => [...prev, comment])
      } catch {
        /* ok */
      }
    } catch (err) {
      toast({
        title: 'Erro ao atribuir colaborador',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setAssigning(false)
    }
  }

  const handleSendComment = async (kind: 'comentario' | 'ajuste_solicitado' = 'comentario') => {
    if (!commentDraft.trim()) return
    if (!postId) {
      toast({
        title: 'Salve o post primeiro',
        description: 'Salve o rascunho antes de publicar comentários na timeline.',
      })
      return
    }

    setSendingComment(true)
    try {
      const created = await addReviewComment({
        postId,
        userId: user?.id,
        authorName: user?.name || user?.email || 'Equipe',
        text: commentDraft.trim(),
        kind,
      })
      setComments((prev) => [...prev, created])
      setCommentDraft('')
      toast({
        title: kind === 'ajuste_solicitado' ? 'Ajuste solicitado!' : 'Comentário enviado!',
        description: 'Visível para todos os colaboradores do post.',
      })
    } catch (err) {
      toast({
        title: 'Erro ao registrar comentário',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSendingComment(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-lg max-h-[88vh] sm:max-h-[90vh] rounded-2xl border border-purple-500/20 bg-card p-4 sm:p-6 shadow-2xl overflow-y-auto">
        <DialogHeader className="space-y-2 border-b border-border/70 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/10 text-purple-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                Colaboração & Revisão
                <Badge
                  variant="secondary"
                  className="bg-purple-600/10 text-purple-700 dark:text-purple-300 font-bold text-[10px]"
                >
                  Workflow de Equipe
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Convide um colaborador para revisar e comente na timeline do post.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* Seletor de Revisor / Colaborador */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-purple-600" />
                Atribuir Colaborador / Revisor:
              </span>
              {reviewerName && (
                <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                  Atual: {reviewerName}
                </span>
              )}
            </div>

            <Select
              value={selectedReviewerId || undefined}
              onValueChange={handleAssignReviewer}
              disabled={assigning}
            >
              <SelectTrigger className="text-xs rounded-xl h-10 bg-background">
                <SelectValue
                  placeholder={assigning ? 'Atribuindo...' : 'Selecione um membro da equipe...'}
                />
              </SelectTrigger>
              <SelectContent>
                {candidates.length === 0 ? (
                  <div className="p-2 text-xs text-muted-foreground">
                    Nenhum outro usuário cadastrado
                  </div>
                ) : (
                  candidates.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name} {c.email ? `(${c.email})` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              O colaborador atribuído recebe notificação e o post entra no status{' '}
              <strong className="text-foreground">Em Revisão</strong>.
            </p>
          </div>

          {/* Timeline de Comentários / Ajustes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                Timeline de Comentários ({comments.length})
              </span>
              {loadingComments && <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />}
            </div>

            {comments.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-foreground">{c.author_name || 'Equipe'}</span>
                      <div className="flex items-center gap-1.5">
                        {c.kind === 'ajuste_solicitado' && (
                          <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">
                            Ajuste
                          </Badge>
                        )}
                        {c.kind === 'aprovacao' && (
                          <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 h-4">
                            Aprovado
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {c.created
                            ? new Date(c.created).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                    </div>
                    <p className="text-foreground/90 whitespace-pre-line text-xs">{c.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground">
                Nenhum comentário na timeline ainda. Deixe uma nota ou instrução para a equipe.
              </div>
            )}

            {/* Campo de Novo Comentário */}
            <div className="space-y-2 pt-1">
              <Textarea
                placeholder="Escreva um comentário ou feedback para o colaborador..."
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                className="text-xs rounded-xl min-h-[70px] resize-none"
                disabled={sendingComment}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {!postId
                    ? 'Salve o post primeiro para registrar comentários.'
                    : 'Comentários persistidos no banco.'}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendComment('ajuste_solicitado')}
                    disabled={sendingComment || !commentDraft.trim() || !postId}
                    className="text-xs h-8 rounded-xl border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    Solicitar Ajuste
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSendComment('comentario')}
                    disabled={sendingComment || !commentDraft.trim() || !postId}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 px-3 rounded-xl gap-1.5"
                  >
                    {sendingComment ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
