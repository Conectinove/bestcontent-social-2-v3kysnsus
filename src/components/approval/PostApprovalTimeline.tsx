import React, { useState, useEffect } from 'react'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  History,
  Clock,
  User,
  ShieldCheck,
  PlusCircle,
  FileCheck2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  getPostApprovalHistory,
  addApprovalHistoryRecord,
  type ApprovalHistoryItem,
  type ApprovalAction,
} from '@/services/approval-history'

interface PostApprovalTimelineProps {
  postId: string
  postTitle?: string
  currentStatus?: string
  canAddReview?: boolean
  compact?: boolean
  onActionComplete?: () => void
}

export const PostApprovalTimeline: React.FC<PostApprovalTimelineProps> = ({
  postId,
  postTitle,
  currentStatus,
  canAddReview = true,
  compact = false,
  onActionComplete,
}) => {
  const [history, setHistory] = useState<ApprovalHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [actionType, setActionType] = useState<ApprovalAction>('approved')
  const [actorName, setActorName] = useState('Cliente VIP')
  const [actorRole, setActorRole] = useState('Aprovador Final')
  const [comment, setComment] = useState('')
  const [versionLabel, setVersionLabel] = useState('v1.0')
  const [saving, setSaving] = useState(false)

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await getPostApprovalHistory(postId)
      setHistory(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (postId) {
      loadHistory()
    }
  }, [postId])

  const handleOpenAdd = (type: ApprovalAction) => {
    setActionType(type)
    if (type === 'approved') {
      setComment('Conteúdo aprovado conforme briefing e estratégia definida.')
    } else if (type === 'requested_changes') {
      setComment('Solicito ajuste pontual na chamada para ação e revisão do texto.')
    } else if (type === 'rejected') {
      setComment('Material não aprovado no formato atual. Necessário recomeçar o ângulo.')
    } else {
      setComment('Nova versão submetida para validação.')
    }
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSaving(true)
    try {
      await addApprovalHistoryRecord({
        postId,
        action: actionType,
        actorName: actorName.trim() || 'Aprovador',
        actorRole: actorRole.trim() || 'Cliente',
        comment: comment.trim(),
        versionLabel: versionLabel.trim() || 'v1.0',
      })
      await loadHistory()
      setModalOpen(false)
      onActionComplete?.()
    } finally {
      setSaving(false)
    }
  }

  const getActionBadge = (action: ApprovalAction) => {
    switch (action) {
      case 'approved':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 gap-1 font-bold text-[11px]">
            <CheckCircle2 className="w-3 h-3" /> Aprovado
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 gap-1 font-bold text-[11px]">
            <XCircle className="w-3 h-3" /> Rejeitado
          </Badge>
        )
      case 'requested_changes':
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 gap-1 font-bold text-[11px]">
            <AlertCircle className="w-3 h-3" /> Ajustes Solicitados
          </Badge>
        )
      case 'submitted':
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 gap-1 font-bold text-[11px]">
            <Send className="w-3 h-3" /> Submetido p/ Revisão
          </Badge>
        )
      case 'restored':
        return (
          <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 gap-1 font-bold text-[11px]">
            <History className="w-3 h-3" /> Versão Restaurada
          </Badge>
        )
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl text-slate-100 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center ring-1 ring-purple-500/20">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
              Histórico de Aprovações
              <span className="text-[10px] font-semibold text-purple-400 normal-case bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/40">
                Timeline Oficial
              </span>
            </h4>
            {postTitle && <p className="text-xs text-slate-400 truncate max-w-xs">{postTitle}</p>}
          </div>
        </div>

        {canAddReview && (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleOpenAdd('requested_changes')}
              className="h-8 text-xs bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 gap-1 font-bold"
            >
              <AlertCircle className="w-3.5 h-3.5" /> Pedir Ajuste
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleOpenAdd('approved')}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1 font-black shadow-lg shadow-emerald-950/50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Registrar Aprovação
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 animate-spin text-purple-400" /> Carregando timeline...
        </div>
      ) : history.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">
          Nenhum registro de aprovação gravado ainda.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {history.map((item, idx) => (
            <div key={item.id || idx} className="relative group">
              <span
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ring-4 ring-slate-900 ${
                  item.action === 'approved'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : item.action === 'rejected'
                      ? 'bg-rose-500 text-white font-black'
                      : item.action === 'requested_changes'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-purple-500 text-white font-black'
                }`}
              >
                {idx + 1}
              </span>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2 hover:border-slate-700/80 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getActionBadge(item.action)}
                    <span className="text-xs font-bold text-slate-200">{item.actor_name}</span>
                    {item.actor_role && (
                      <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                        {item.actor_role}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    {item.version_label && (
                      <span className="font-mono text-purple-300 font-semibold bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800/30">
                        {item.version_label}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(item.created).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {item.comment && (
                  <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
                    “{item.comment}”
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Adicionar Evento de Aprovação */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              Registrar no Histórico de Aprovações
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Grave quem tomou a decisão, observações e a versão correspondente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Decisão / Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={actionType === 'approved' ? 'default' : 'outline'}
                  onClick={() => setActionType('approved')}
                  className={
                    actionType === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold'
                      : 'border-slate-800 text-slate-300'
                  }
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aprovado
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={actionType === 'requested_changes' ? 'default' : 'outline'}
                  onClick={() => setActionType('requested_changes')}
                  className={
                    actionType === 'requested_changes'
                      ? 'bg-amber-600 hover:bg-amber-500 text-white font-bold'
                      : 'border-slate-800 text-slate-300'
                  }
                >
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> Pedir Ajustes
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Aprovador</label>
                <Input
                  value={actorName}
                  onChange={(e) => setActorName(e.target.value)}
                  placeholder="Ex: Ronaldo Barreto"
                  className="bg-slate-950 border-slate-800 text-xs h-9"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Cargo / Função
                </label>
                <Input
                  value={actorRole}
                  onChange={(e) => setActorRole(e.target.value)}
                  placeholder="Ex: Cliente VIP / Diretor"
                  className="bg-slate-950 border-slate-800 text-xs h-9"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Identificador de Versão
              </label>
              <Input
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder="Ex: v1.0, v2.1 (Aprovada)"
                className="bg-slate-950 border-slate-800 text-xs h-9"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Parecer / Comentário da Decisão
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Descreva o motivo da aprovação ou ajustes necessários..."
                className="bg-slate-950 border-slate-800 text-xs"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="text-xs text-slate-400"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              >
                {saving ? 'Gravando...' : 'Salvar no Histórico'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PostApprovalTimeline
