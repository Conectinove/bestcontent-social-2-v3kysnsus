import React, { useState, useEffect, useMemo } from 'react'
import {
  MessageCircle,
  Send,
  CheckCircle2,
  EyeOff,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Heart,
  Clock,
  Filter,
  Check,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import {
  getInstagramComments,
  replyInstagramComment,
  updateInstagramCommentStatus,
  type InstagramCommentItem,
  type InstagramCommentStatus,
} from '@/services/instagram-comments'

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'recente'
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / (1000 * 60))
    if (mins < 1) return 'agora mesmo'
    if (mins < 60) return `há ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `há ${hours} h`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'ontem'
    if (days < 30) return `há ${days} dias`
    return new Date(dateStr).toLocaleDateString('pt-BR')
  } catch {
    return 'recente'
  }
}

export function InstagramCommentsInbox() {
  const [comments, setComments] = useState<InstagramCommentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [badgeLabel, setBadgeLabel] = useState<'Dados Oficiais' | 'Estimativa Calibrada'>(
    'Estimativa Calibrada',
  )
  const [isOfficial, setIsOfficial] = useState(false)
  const [filter, setFilter] = useState<'all' | 'nao_respondidos' | 'respondidos'>('nao_respondidos')
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  const loadComments = async () => {
    setLoading(true)
    try {
      const res = await getInstagramComments()
      setComments(res.comments || [])
      setBadgeLabel(
        res.badge_label || (res.is_official ? 'Dados Oficiais' : 'Estimativa Calibrada'),
      )
      setIsOfficial(Boolean(res.is_official))
    } catch (err) {
      console.warn('Erro ao carregar comentários do Instagram:', err)
      toast({
        title: 'Erro ao sincronizar comentários',
        description: 'Usando estimativa calibrada de comentários.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [])

  const pendingCount = useMemo(() => {
    return comments.filter((c) => c.status === 'novo').length
  }, [comments])

  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      if (filter === 'nao_respondidos') return c.status === 'novo'
      if (filter === 'respondidos') return c.status === 'respondido'
      return true
    })
  }, [comments, filter])

  const handleSendReply = async (comment: InstagramCommentItem) => {
    const text = (replyTextMap[comment.id] || '').trim()
    if (!text) {
      toast({
        title: 'Resposta em branco',
        description: 'Digite uma resposta antes de enviar.',
        variant: 'destructive',
      })
      return
    }

    setSubmittingId(comment.id)
    try {
      const res = await replyInstagramComment(comment.id, text, {
        authorHandle: comment.author_handle,
        originalText: comment.text,
      })

      // Atualiza o estado local imediatamente
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id
            ? {
                ...c,
                status: 'respondido',
                reply_text: text,
                replied_at: res.replied_at || new Date().toISOString(),
              }
            : c,
        ),
      )

      setReplyTextMap((prev) => ({ ...prev, [comment.id]: '' }))
      setActiveReplyId(null)

      toast({
        title: res.sent_via_graph_api
          ? 'Resposta enviada ao Instagram!'
          : 'Resposta salva no portal!',
        description: res.message || `Respondido para @${comment.author_handle}`,
      })
    } catch (err) {
      console.error('Erro ao responder comentário:', err)
      toast({
        title: 'Falha ao responder',
        description: 'Não foi possível gravar a resposta.',
        variant: 'destructive',
      })
    } finally {
      setSubmittingId(null)
    }
  }

  const handleStatusChange = async (commentId: string, newStatus: InstagramCommentStatus) => {
    const target = comments.find((c) => c.id === commentId)
    // Atualização otimista
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, status: newStatus } : c)))

    try {
      await updateInstagramCommentStatus(commentId, newStatus, {
        authorHandle: target?.author_handle,
        originalText: target?.text,
      })
      toast({
        title: newStatus === 'ignorado' ? 'Comentário arquivado' : 'Status atualizado',
        description: `Marcado como ${newStatus}.`,
      })
    } catch {
      toast({
        title: 'Erro ao mudar status',
        description: 'Não foi possível atualizar o banco.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="rounded-3xl border-2 border-pink-500/30 bg-gradient-to-br from-pink-950/15 via-background to-purple-950/20 shadow-xl overflow-hidden">
      <CardHeader className="p-6 sm:p-8 pb-4 border-b border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white text-xl font-bold shadow-md ring-2 ring-pink-500/40 shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  Caixa de Entrada de Comentários
                </CardTitle>
                <Badge
                  className={
                    isOfficial
                      ? 'bg-emerald-600 text-white text-[10px] gap-1'
                      : 'bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 text-[10px] gap-1'
                  }
                >
                  {isOfficial ? (
                    <ShieldCheck className="w-3 h-3 text-white" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-purple-500" />
                  )}
                  {badgeLabel}
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Centralize o atendimento dos comentários recebidos nas postagens e Reels do
                Instagram da marca.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={loadComments}
              disabled={loading}
              className="rounded-xl border-pink-500/30 text-pink-600 dark:text-pink-400 hover:bg-pink-500/10 gap-1.5 h-9 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </Button>
          </div>
        </div>

        {/* Filtros e Contador de Pendentes */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border/60 mt-4">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setFilter('nao_respondidos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[36px] ${
                filter === 'nao_respondidos'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              <span>Não respondidos</span>
              {pendingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-black">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilter('respondidos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[36px] ${
                filter === 'respondidos'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              <span>Respondidos</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                ({comments.filter((c) => c.status === 'respondido').length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[36px] ${
                filter === 'all'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              <span>Todos ({comments.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              <strong>{pendingCount}</strong> comentário(s) aguardando sua resposta
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 pt-4 space-y-4">
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-pink-500 mx-auto" />
            <p className="text-xs font-semibold text-muted-foreground">
              Carregando comentários do Instagram...
            </p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-border/80 rounded-2xl bg-card/40">
            <MessageCircle className="w-8 h-8 text-muted-foreground/60 mx-auto" />
            <p className="text-xs sm:text-sm font-bold text-foreground">
              Nenhum comentário nesta pasta
            </p>
            <p className="text-[11px] text-muted-foreground">
              {filter === 'nao_respondidos'
                ? 'Todos os comentários recebidos já foram respondidos ou arquivados! Bom trabalho.'
                : 'Alterne os filtros acima para visualizar o histórico.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredComments.map((comment) => {
              const isReplyOpen = activeReplyId === comment.id
              const currentReplyText = replyTextMap[comment.id] || ''

              return (
                <div
                  key={comment.id}
                  className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 hover:border-pink-500/40 transition-all space-y-3 shadow-xs"
                >
                  {/* Topo do Comentário */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          comment.author_avatar || 'https://img.usecurling.com/ppl/medium?seed=12'
                        }
                        alt={comment.author_handle}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500/20 shrink-0"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://img.usecurling.com/i?q=instagram&color=rose'
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-foreground">
                            {comment.author_name || comment.author_handle}
                          </span>
                          <span className="text-[11px] font-mono text-pink-600 dark:text-pink-400 font-semibold">
                            @{comment.author_handle}
                          </span>
                          {comment.status === 'novo' ? (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[9px] px-1.5 py-0 h-4 uppercase font-bold">
                              Pendente
                            </Badge>
                          ) : comment.status === 'respondido' ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[9px] px-1.5 py-0 h-4 uppercase font-bold">
                              Respondido
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground text-[9px] px-1.5 py-0 h-4 uppercase font-bold">
                              Arquivado
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground/70" />
                            {formatRelativeTime(comment.commented_at)}
                          </span>
                          {typeof comment.likes_count === 'number' && comment.likes_count > 0 && (
                            <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-medium">
                              <Heart className="w-3 h-3 fill-current" />
                              {comment.likes_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Origem: Post associado */}
                    {comment.post_title && (
                      <div className="flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-muted/40 border border-border/60 max-w-xs self-start sm:self-center">
                        {comment.post_thumbnail && (
                          <img
                            src={comment.post_thumbnail}
                            alt="Post"
                            className="w-6 h-6 rounded-md object-cover shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <span
                          className="text-[11px] text-muted-foreground truncate"
                          title={comment.post_title}
                        >
                          {comment.post_title}
                        </span>
                        {comment.post_permalink && (
                          <a
                            href={comment.post_permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-pink-600 shrink-0"
                            title="Abrir no Instagram"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Texto do Comentário */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs sm:text-sm text-foreground leading-relaxed">
                    "{comment.text}"
                  </div>

                  {/* Histórico da Resposta Enviada (se respondido) */}
                  {comment.reply_text && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-foreground space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sua Resposta:
                        </span>
                        {comment.replied_at && (
                          <span className="font-normal font-mono text-muted-foreground">
                            {formatRelativeTime(comment.replied_at)}
                          </span>
                        )}
                      </div>
                      <p className="italic text-foreground/90 pl-5">"{comment.reply_text}"</p>
                    </div>
                  )}

                  {/* Barra de Ações & Campo de Resposta */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveReplyId(isReplyOpen ? null : comment.id)}
                          className={`rounded-xl text-xs h-8 px-3 gap-1.5 min-h-[36px] ${
                            isReplyOpen
                              ? 'bg-pink-600 text-white border-pink-600 hover:bg-pink-700'
                              : 'text-pink-600 dark:text-pink-400 border-pink-500/30 hover:bg-pink-500/10'
                          }`}
                        >
                          <Send className="w-3 h-3" />
                          <span>
                            {comment.reply_text ? 'Responder Novamente' : 'Responder no Instagram'}
                          </span>
                        </Button>

                        {comment.status !== 'ignorado' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(comment.id, 'ignorado')}
                            className="rounded-xl text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground gap-1 min-h-[36px]"
                            title="Arquivar/Ignorar comentário"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Arquivar</span>
                          </Button>
                        )}

                        {comment.status === 'ignorado' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(comment.id, 'novo')}
                            className="rounded-xl text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground gap-1 min-h-[36px]"
                          >
                            <span>Desarquivar</span>
                          </Button>
                        )}
                      </div>

                      <div className="text-[10px] text-muted-foreground font-mono">
                        ID: {comment.ig_comment_id || comment.id.slice(0, 8)}
                      </div>
                    </div>

                    {/* Caixa de Texto de Resposta Expansível */}
                    {isReplyOpen && (
                      <div className="mt-2 p-3 rounded-2xl bg-muted/40 border border-pink-500/30 space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-foreground">
                            Respondendo publicamente para @{comment.author_handle}:
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            {isOfficial
                              ? 'Envia via Graph API oficial'
                              : 'Salva registro no portal'}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            type="text"
                            placeholder="Escreva sua resposta amigável e profissional..."
                            value={currentReplyText}
                            onChange={(e) =>
                              setReplyTextMap((prev) => ({ ...prev, [comment.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSendReply(comment)
                              }
                            }}
                            className="text-xs h-9 rounded-xl bg-card border-border flex-1 min-h-[38px]"
                          />
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleSendReply(comment)}
                              disabled={submittingId === comment.id}
                              className="rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold text-xs h-9 px-4 gap-1.5 shadow-xs min-h-[38px]"
                            >
                              {submittingId === comment.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>Enviar Resposta</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveReplyId(null)}
                              className="rounded-xl text-xs h-9 px-2.5 text-muted-foreground hover:text-foreground min-h-[38px]"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>

                        {/* Atalhos de Resposta Rápida com Tom Profissional */}
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            Sugestões rápidas:
                          </span>
                          {[
                            'Obrigado pelo carinho e feedback! 🚀',
                            'Com certeza! Te mandamos mais detalhes no Direct.',
                            'Exatamente isso! Salve o post para consultar sempre.',
                          ].map((quick, qIdx) => (
                            <button
                              key={qIdx}
                              type="button"
                              onClick={() =>
                                setReplyTextMap((prev) => ({ ...prev, [comment.id]: quick }))
                              }
                              className="text-[10px] text-pink-600 dark:text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 px-2 py-0.5 rounded-lg transition-colors text-left"
                            >
                              {quick}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
