import React, { useState, useEffect, useMemo } from 'react'
import {
  Send,
  CheckCircle2,
  EyeOff,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Heart,
  Clock,
  Check,
  FileSpreadsheet,
  FileText,
  FileCode,
} from 'lucide-react'
import {
  exportCommentsToCSV,
  exportCommentsToJSON,
  exportCommentsToMarkdown,
} from '@/services/comment-export'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import {
  getTwitterComments,
  replyTwitterComment,
  updateTwitterCommentStatus,
  type TwitterCommentItem,
  type TwitterCommentStatus,
} from '@/services/twitter-comments'
import { generateAiCommentReply } from '@/services/ai-reply'
import { ResponseTemplateSelector } from '@/components/feed/ResponseTemplateSelector'

function XIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

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

export function TwitterCommentsInbox() {
  const [comments, setComments] = useState<TwitterCommentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [badgeLabel, setBadgeLabel] = useState<'Dados Oficiais' | 'Estimativa Calibrada'>(
    'Estimativa Calibrada',
  )
  const [isOfficial, setIsOfficial] = useState(false)
  const [filter, setFilter] = useState<'all' | 'nao_respondidos' | 'respondidos'>('nao_respondidos')
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [suggestingId, setSuggestingId] = useState<string | null>(null)

  const loadComments = async () => {
    setLoading(true)
    try {
      const res = await getTwitterComments()
      setComments(res.comments || [])
      setBadgeLabel(
        res.badge_label || (res.is_official ? 'Dados Oficiais' : 'Estimativa Calibrada'),
      )
      setIsOfficial(Boolean(res.is_official))
    } catch (err) {
      console.warn('Erro ao carregar comentários do X:', err)
      toast({
        title: 'Erro ao sincronizar comentários',
        description: 'Usando estimativa calibrada de comentários do X.',
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

  const handleSendReply = async (comment: TwitterCommentItem) => {
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
      const res = await replyTwitterComment(comment.id, text, {
        authorHandle: comment.author_handle,
        originalText: comment.text,
      })

      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id
            ? {
                ...c,
                status: 'respondido' as TwitterCommentStatus,
                reply_text: text,
                replied_at: res.replied_at || new Date().toISOString(),
              }
            : c,
        ),
      )

      setReplyTextMap((prev) => ({ ...prev, [comment.id]: '' }))
      setActiveReplyId(null)

      toast({
        title: res.sent_via_x_api ? 'Resposta publicada no X!' : 'Resposta salva no portal!',
        description:
          res.message || `Respondido para ${comment.author_name || comment.author_handle}`,
      })
    } catch (err) {
      console.error('Erro ao responder comentário no X:', err)
      toast({
        title: 'Falha ao responder',
        description: 'Não foi possível gravar a resposta.',
        variant: 'destructive',
      })
    } finally {
      setSubmittingId(null)
    }
  }

  const handleAiSuggestReply = async (comment: TwitterCommentItem) => {
    setSuggestingId(comment.id)
    if (activeReplyId !== comment.id) {
      setActiveReplyId(comment.id)
    }
    try {
      const res = await generateAiCommentReply({
        platform: 'x',
        authorHandle: comment.author_handle,
        authorName: comment.author_name,
        commentText: comment.text,
        postContext: comment.post_title,
      })
      setReplyTextMap((prev) => ({ ...prev, [comment.id]: res.suggestion }))
      toast({
        title: res.source === 'ai' ? 'Sugestão gerada por IA' : 'Sugestão contextual gerada',
        description: 'Texto inserido na resposta. Você pode editar antes de enviar.',
      })
    } catch (err) {
      console.warn('Erro ao sugerir resposta com IA:', err)
      toast({
        title: 'Sugestão rápida',
        description: 'Usando resposta amigável padrão.',
      })
    } finally {
      setSuggestingId(null)
    }
  }

  const handleStatusChange = async (commentId: string, newStatus: TwitterCommentStatus) => {
    const target = comments.find((c) => c.id === commentId)
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, status: newStatus } : c)))

    try {
      await updateTwitterCommentStatus(commentId, newStatus, {
        authorHandle: target?.author_handle,
        originalText: target?.text,
      })
      toast({
        title: newStatus === 'ignorado' ? 'Tweet arquivado' : 'Status atualizado',
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
    <Card className="rounded-3xl border-2 border-sky-500/30 bg-gradient-to-br from-sky-950/15 via-background to-slate-950/20 shadow-xl overflow-hidden">
      <CardHeader className="p-6 sm:p-8 pb-4 border-b border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center text-white text-xl font-bold shadow-md ring-2 ring-sky-500/40 shrink-0">
              <XIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  Comentários do X (Twitter)
                </CardTitle>
                <Badge
                  className={
                    isOfficial
                      ? 'bg-emerald-600 text-white text-[10px] gap-1'
                      : 'bg-sky-600/20 text-sky-700 dark:text-sky-300 border border-sky-500/40 text-[10px] gap-1'
                  }
                >
                  {isOfficial ? (
                    <ShieldCheck className="w-3 h-3 text-white" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-sky-500" />
                  )}
                  {badgeLabel}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-sky-500/30 text-sky-600 dark:text-sky-400 text-[10px] font-mono"
                >
                  @conectinove
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Centralize o atendimento das menções e respostas recebidas no perfil oficial do X da
                Conectinove.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const rows = filteredComments.map((c) => ({
                    id: c.id,
                    platform: 'Twitter/X' as const,
                    author_handle: c.author_handle,
                    author_name: c.author_name,
                    text: c.text,
                    post_title: c.post_title,
                    post_permalink: c.post_permalink,
                    status: c.status,
                    likes_count: c.likes_count,
                    commented_at: c.commented_at,
                    reply_text: c.reply_text,
                    replied_at: c.replied_at,
                    is_official: c.is_official,
                  }))
                  exportCommentsToCSV(
                    rows,
                    `x_twitter_comentarios_${new Date().toISOString().slice(0, 10)}.csv`,
                  )
                  toast({
                    title: 'CSV exportado com sucesso',
                    description: `${rows.length} menções do X exportadas com codificação UTF-8 BOM.`,
                  })
                }}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-lg"
                title="Exportar CSV (compatível com Excel)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>CSV</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const rows = filteredComments.map((c) => ({
                    id: c.id,
                    platform: 'Twitter/X' as const,
                    author_handle: c.author_handle,
                    author_name: c.author_name,
                    text: c.text,
                    post_title: c.post_title,
                    post_permalink: c.post_permalink,
                    status: c.status,
                    likes_count: c.likes_count,
                    commented_at: c.commented_at,
                    reply_text: c.reply_text,
                    replied_at: c.replied_at,
                    is_official: c.is_official,
                  }))
                  exportCommentsToJSON(
                    rows,
                    `x_twitter_comentarios_${new Date().toISOString().slice(0, 10)}.json`,
                  )
                  toast({
                    title: 'JSON exportado com sucesso',
                    description: `${rows.length} menções do X exportadas em JSON estruturado.`,
                  })
                }}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-lg"
                title="Exportar JSON estruturado"
              >
                <FileCode className="w-3.5 h-3.5 text-sky-500" />
                <span>JSON</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const rows = filteredComments.map((c) => ({
                    id: c.id,
                    platform: 'Twitter/X' as const,
                    author_handle: c.author_handle,
                    author_name: c.author_name,
                    text: c.text,
                    post_title: c.post_title,
                    post_permalink: c.post_permalink,
                    status: c.status,
                    likes_count: c.likes_count,
                    commented_at: c.commented_at,
                    reply_text: c.reply_text,
                    replied_at: c.replied_at,
                    is_official: c.is_official,
                  }))
                  exportCommentsToMarkdown(
                    rows,
                    'Relatório de Menções X (Twitter) — Conectinove',
                    `x_twitter_comentarios_${new Date().toISOString().slice(0, 10)}.md`,
                  )
                  toast({
                    title: 'Markdown exportado com sucesso',
                    description: `${rows.length} menções formatadas em Markdown para documentação.`,
                  })
                }}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-lg"
                title="Exportar Markdown"
              >
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>MD</span>
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadComments}
              disabled={loading}
              className="rounded-xl border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 gap-1.5 h-9 text-xs font-semibold"
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
                  ? 'bg-sky-600 text-white shadow-xs'
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
                  ? 'bg-sky-600 text-white shadow-xs'
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
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              <span>Todos ({comments.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span>
              <strong>{pendingCount}</strong> menção(ões) pendente(s) no perfil
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 pt-4 space-y-4">
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-sky-500 mx-auto" />
            <p className="text-xs font-semibold text-muted-foreground">
              Carregando menções do X (Twitter)...
            </p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-border/80 rounded-2xl bg-card/40">
            <XIcon className="w-8 h-8 text-muted-foreground/60 mx-auto" />
            <p className="text-xs sm:text-sm font-bold text-foreground">
              Nenhuma menção nesta pasta
            </p>
            <p className="text-[11px] text-muted-foreground">
              {filter === 'nao_respondidos'
                ? 'Todas as menções ao @conectinove já foram respondidas ou arquivadas! Atendimento em dia.'
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
                  className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 hover:border-sky-500/40 transition-all space-y-3 shadow-xs"
                >
                  {/* Topo do Comentário */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          comment.author_avatar || 'https://img.usecurling.com/ppl/medium?seed=52'
                        }
                        alt={comment.author_name || comment.author_handle}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-500/20 shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = 'https://img.usecurling.com/i?q=x&color=black'
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-foreground">
                            {comment.author_name || comment.author_handle}
                          </span>
                          <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
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
                            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
                              <Heart className="w-3 h-3 fill-current" />
                              {comment.likes_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Origem: Tweet */}
                    {comment.post_title && (
                      <div className="flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-muted/40 border border-border/60 max-w-xs self-start sm:self-center">
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
                            className="text-muted-foreground hover:text-sky-600 shrink-0"
                            title="Abrir no X"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Texto do Tweet */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs sm:text-sm text-foreground leading-relaxed">
                    "{comment.text}"
                  </div>

                  {/* Histórico da Resposta Enviada (se respondido) */}
                  {comment.reply_text && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-foreground space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resposta da Conectinove:
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
                              ? 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700'
                              : 'text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/10'
                          }`}
                        >
                          <Send className="w-3 h-3" />
                          <span>
                            {comment.reply_text ? 'Responder Novamente' : 'Responder no X'}
                          </span>
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAiSuggestReply(comment)}
                          disabled={suggestingId === comment.id}
                          className="rounded-xl text-xs h-8 px-3 gap-1.5 min-h-[36px] bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40 font-semibold"
                          title="Gerar sugestão contextual de resposta usando IA"
                        >
                          {suggestingId === comment.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-sky-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                          )}
                          <span>
                            {suggestingId === comment.id ? 'Gerando...' : 'Sugerir resposta com IA'}
                          </span>
                        </Button>

                        {comment.status !== 'ignorado' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(comment.id, 'ignorado')}
                            className="rounded-xl text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground gap-1 min-h-[36px]"
                            title="Arquivar/Ignorar menção"
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
                        ID: {comment.tw_comment_id || comment.id.slice(0, 8)}
                      </div>
                    </div>

                    {/* Caixa de Texto de Resposta Expansível */}
                    {isReplyOpen && (
                      <div className="mt-2 p-3 rounded-2xl bg-muted/40 border border-sky-500/30 space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-[11px] gap-2 flex-wrap">
                          <span className="font-bold text-foreground">
                            Respondendo como @conectinove para{' '}
                            {comment.author_name || comment.author_handle}:
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAiSuggestReply(comment)}
                              disabled={suggestingId === comment.id}
                              className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>
                                {suggestingId === comment.id
                                  ? 'Gerando com IA...'
                                  : 'Regerar com IA'}
                              </span>
                            </button>
                            <span className="text-muted-foreground text-[10px]">
                              {isOfficial
                                ? 'Publica via API oficial do X'
                                : 'Salva registro no portal'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            type="text"
                            placeholder="Escreva sua resposta para o X..."
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
                              className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs h-9 px-4 gap-1.5 shadow-xs min-h-[38px]"
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
                              size="sm"
                              variant="ghost"
                              onClick={() => setActiveReplyId(null)}
                              className="rounded-xl text-xs h-9 px-2.5 text-muted-foreground hover:text-foreground min-h-[38px]"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>

                        {/* Templates de resposta salvos pelo usuário */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ResponseTemplateSelector
                            network="x"
                            authorName={comment.author_name || comment.author_handle}
                            authorHandle={comment.author_handle}
                            onSelect={(text) =>
                              setReplyTextMap((prev) => ({ ...prev, [comment.id]: text }))
                            }
                          />
                        </div>

                        {/* Atalhos de Resposta Rápida */}
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            Sugestões Conectinove:
                          </span>
                          {[
                            'Olá! Obrigado pelo feedback e por acompanhar a Conectinove! 🤝',
                            'Parte 2 do thread sai essa semana — fica de olho! 🚀',
                            'Atendemos sim! Vamos te chamar na DM para falar do seu negócio.',
                          ].map((quick, qIdx) => (
                            <button
                              key={qIdx}
                              type="button"
                              onClick={() =>
                                setReplyTextMap((prev) => ({ ...prev, [comment.id]: quick }))
                              }
                              className="text-[10px] text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 px-2 py-0.5 rounded-lg transition-colors text-left"
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

export default TwitterCommentsInbox
