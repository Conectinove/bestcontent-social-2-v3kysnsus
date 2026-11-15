// Painel da fila de publicação automática (social_publications).
// Mostra os disparos do usuário logado com status pending/published/failed.
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  listSocialPublications,
  retrySocialPublication,
  deleteSocialPublication,
  type SocialPublication,
} from '@/services/social-publications'
import {
  InstagramIcon,
  Facebook,
  Clock,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  published: {
    label: 'Publicado',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  failed: { label: 'Falhou', className: 'bg-red-100 text-red-800 border-red-200' },
}

export function PublicationsQueuePanel() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<SocialPublication[]>([])
  const [loading, setLoading] = useState(false)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      setItems(await listSocialPublications(user.id))
    } catch {
      // silencioso: painel é informativo
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    load()
  }, [load])

  const handleRetry = async (item: SocialPublication) => {
    setRetryingId(item.id)
    try {
      await retrySocialPublication(item.id, new Date().toISOString())
      await load()
      toast({
        title: 'Publicação reenfileirada',
        description: 'Tentaremos novamente em instantes.',
      })
    } catch (err: any) {
      toast({ title: 'Erro ao reenfileirar', description: err?.message, variant: 'destructive' })
    } finally {
      setRetryingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSocialPublication(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-foreground">Fila de publicação automática</h4>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="h-7 px-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      {items.length === 0 && !loading && (
        <p className="text-[11px] text-muted-foreground">
          Nenhuma publicação na fila. Ative "Publicar automaticamente" ao agendar um post.
        </p>
      )}
      <div className="space-y-1.5">
        {items.map((item) => {
          const meta = STATUS_META[item.status] || STATUS_META.pending
          return (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2.5 rounded-lg border border-border/70 bg-card/60"
            >
              {item.network === 'instagram' ? (
                <InstagramIcon className="w-4 h-4 text-pink-500 shrink-0" />
              ) : (
                <Facebook className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">
                  {(item.expand?.post as any)?.title || 'Post sem título'}
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {fmt(item.scheduled_at)}
                  {item.attempts ? ` · ${item.attempts} tentativa(s)` : ''}
                </p>
                {item.error_message && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3" /> {item.error_message.slice(0, 80)}
                  </p>
                )}
              </div>
              <Badge variant="outline" className={`text-[10px] ${meta.className}`}>
                {item.status === 'published' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
                {meta.label}
              </Badge>
              {item.status !== 'published' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1.5"
                  onClick={() => handleRetry(item)}
                  disabled={retryingId === item.id}
                  title="Tentar novamente"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${retryingId === item.id ? 'animate-spin' : ''}`}
                  />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-1.5 text-red-500 hover:text-red-600"
                onClick={() => handleDelete(item.id)}
                title="Remover da fila"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
