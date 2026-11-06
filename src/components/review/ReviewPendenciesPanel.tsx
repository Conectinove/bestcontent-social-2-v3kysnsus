import { useCallback, useEffect, useState } from 'react'
import { ClipboardCheck, RefreshCw, UserCheck, CheckCircle2, Undo2, Inbox } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  getPendingReviewPosts,
  assignPostReviewer,
  requestPostChanges,
  setPostReviewStatus,
  addReviewComment,
  getReviewerCandidates,
} from '@/services/posts'

interface ReviewerCandidate {
  id: string
  name?: string
  email?: string
}

export function ReviewPendenciesPanel({ onChanged }: { onChanged?: () => void }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Record<string, unknown>[]>([])
  const [reviewers, setReviewers] = useState<ReviewerCandidate[]>([])
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
  const [nameDraft, setNameDraft] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pending, candidates] = await Promise.all([
        getPendingReviewPosts(user?.id),
        getReviewerCandidates().catch(() => [] as ReviewerCandidate[]),
      ])
      setPosts(pending as unknown as Record<string, unknown>[])
      setReviewers(candidates)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    load()
  }, [load])

  const authorName =
    (user as { name?: string } | null)?.name ||
    (user as { email?: string } | null)?.email ||
    'Equipe'

  const runAction = async (postId: string, fn: () => Promise<unknown>, okMsg: string) => {
    setBusyId(postId)
    try {
      await fn()
      toast({ title: okMsg, description: 'Alteração registrada no fluxo de revisão.' })
      await load()
      onChanged?.()
    } catch (e) {
      console.error(e)
      toast({
        title: 'Não foi possível concluir',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleApprove = (postId: string) =>
    runAction(
      postId,
      async () => {
        await setPostReviewStatus(postId, 'approved')
        await addReviewComment({
          postId,
          userId: user?.id,
          authorName,
          text: 'Post aprovado na revisão.',
          kind: 'aprovacao',
        })
      },
      'Post aprovado',
    )

  const handleRequestChange = (postId: string) => {
    const text = (commentDraft[postId] || '').trim()
    if (!text) {
      toast({
        title: 'Escreva o ajuste solicitado',
        description: 'O comentário é obrigatório para pedir mudança.',
        variant: 'destructive',
      })
      return
    }
    return runAction(
      postId,
      () => requestPostChanges({ postId, authorName, text, userId: user?.id }),
      'Mudança solicitada — post voltou para rascunho',
    )
  }

  const handleAssign = (postId: string, reviewerId: string, reviewerName?: string) =>
    runAction(
      postId,
      () => assignPostReviewer(postId, reviewerId || undefined, reviewerName),
      'Revisor atribuído',
    )

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold">
                Aprovações em Revisão
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Posts aguardando revisão — atribua um revisor, aprove ou solicite mudanças.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[10px] font-bold"
            >
              {loading ? '…' : posts.length} pendente{posts.length === 1 ? '' : 's'}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={load}
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {loading ? (
          [1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : posts.length === 0 ? (
          <div className="py-6 text-center space-y-1.5">
            <Inbox className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Nenhum post aguardando revisão. Envie um rascunho para "Em Revisão" pela Biblioteca.
            </p>
          </div>
        ) : (
          posts.map((p) => {
            const id = String(p.id || '')
            const rawContent = String(p.caption || p.content || 'Sem título')
            const reviewerName = String(
              p.reviewer_name ||
                (p.expand as Record<string, Record<string, unknown>> | undefined)?.reviewer?.name ||
                '',
            )
            return (
              <div
                key={id}
                className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground line-clamp-1">{rawContent}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {String(p.platform || '')}{' '}
                      {p.revision_count ? `· ${p.revision_count} revisão(ões)` : ''}
                      {reviewerName ? ` · Revisor: ${reviewerName}` : ' · Sem revisor atribuído'}
                    </p>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9px] py-0 px-1.5">
                    Em Revisão
                  </Badge>
                </div>

                {/* Atribuição de revisor */}
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value=""
                    onChange={(e) => handleAssign(id, e.target.value)}
                    className="h-8 text-[11px] rounded-lg border border-border bg-card px-2 max-w-[190px] text-foreground"
                    aria-label="Atribuir revisor"
                  >
                    <option value="">Atribuir revisor da equipe…</option>
                    {reviewers.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name || r.email || r.id}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={nameDraft[id] || ''}
                      onChange={(e) => setNameDraft((s) => ({ ...s, [id]: e.target.value }))}
                      placeholder="Ou digite o nome"
                      className="h-8 w-36 text-[11px]"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] gap-1"
                      disabled={!nameDraft[id] || busyId === id}
                      onClick={() => handleAssign(id, '', nameDraft[id])}
                    >
                      <UserCheck className="w-3 h-3" />
                      Atribuir
                    </Button>
                  </div>
                </div>

                {/* Solicitar mudança */}
                <Textarea
                  value={commentDraft[id] || ''}
                  onChange={(e) => setCommentDraft((s) => ({ ...s, [id]: e.target.value }))}
                  placeholder="Descreva o ajuste solicitado (registrado como comentário na timeline)…"
                  className="min-h-[56px] text-xs"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    className="h-8 text-[11px] font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    disabled={busyId === id}
                    onClick={() => handleApprove(id)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-[11px] font-bold rounded-xl gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400"
                    disabled={busyId === id}
                    onClick={() => handleRequestChange(id)}
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    Solicitar mudança
                  </Button>
                  <span className="text-[10px] text-muted-foreground">
                    Solicitar mudança devolve o post para rascunho com o comentário registrado.
                  </span>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
