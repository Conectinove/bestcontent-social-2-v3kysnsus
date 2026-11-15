import { useCallback, useEffect, useState } from 'react'
import {
  CalendarClock,
  Loader2,
  Sparkles,
  FileText,
  Clock,
  BarChart3,
  LayoutList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { pb } from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useAuth } from '@/context/AuthContext'
import { LabsScheduledDashboard } from '@/components/labs/LabsScheduledDashboard'
import { LabsPostMetrics } from '@/components/labs/LabsPostMetrics'

// =========================================================================
// ABA POST — Criação e AGENDAMENTO de posts sociais
// =========================================================================
// Grava direto na coleção `posts` (schema real: platform select, caption,
// target_networks json, user, brand, status, scheduled_date).
// O agendamento REUSA o cron existente cron_process_scheduled_posts.js —
// que transiciona status 'scheduled' → 'published' quando scheduled_date
// chega. NUNCA criar um segundo cron varrendo `posts` (publicaria em dobro).
// Status traduzido apenas na UI (rascunho/agendado/publicado).
// =========================================================================

// Redes suportadas pelo campo `platform` da coleção posts
// (select expandido na migration 0126: + WhatsApp, Threads, Pinterest,
//  Telegram, Kwai, Google Business)
const NETWORKS = [
  { id: 'Instagram', label: 'Instagram' },
  { id: 'TikTok', label: 'TikTok' },
  { id: 'LinkedIn', label: 'LinkedIn' },
  { id: 'Facebook', label: 'Facebook' },
  { id: 'YouTube', label: 'YouTube' },
  { id: 'Twitter/X', label: 'Twitter/X' },
  { id: 'WhatsApp', label: 'WhatsApp' },
  { id: 'Threads', label: 'Threads' },
  { id: 'Pinterest', label: 'Pinterest' },
  { id: 'Telegram', label: 'Telegram' },
  { id: 'Kwai', label: 'Kwai' },
  { id: 'Google Business', label: 'Google Business' },
] as const

type NetworkId = (typeof NETWORKS)[number]['id']

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  published: 'Publicado',
  approved: 'Aprovado',
  em_revisao: 'Em revisão',
}

const statusBadgeClass = (status: string): string => {
  switch (status) {
    case 'published':
      return 'border-emerald-500/40 text-emerald-600'
    case 'scheduled':
      return 'border-amber-500/40 text-amber-600'
    default:
      return 'border-border text-muted-foreground'
  }
}

const formatDateTime = (value?: string): string => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface RecentPost {
  id: string
  caption: string
  content: string
  platform: string
  status: string
  scheduled_date: string
  created: string
}

export function LabsPostTab() {
  const { toast } = useToast()
  const { user } = useAuth()

  const [caption, setCaption] = useState('')
  const [network, setNetwork] = useState<NetworkId>('Instagram')
  const [scheduledAt, setScheduledAt] = useState('')
  const [creating, setCreating] = useState(false)
  const [recent, setRecent] = useState<RecentPost[]>([])
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [section, setSection] = useState<'agendados' | 'metricas' | 'recentes'>('agendados')
  const [reloadKey, setReloadKey] = useState(0)

  const loadRecent = useCallback(async () => {
    if (!user) return
    setLoadingRecent(true)
    try {
      const records = await pb.collection('posts').getList(1, 10, {
        filter: `user = "${user.id}"`,
        sort: '-created',
      })
      setRecent(
        records.items.map((r: any) => ({
          id: r.id,
          caption: r.caption || '',
          content: r.content || '',
          platform: r.platform || 'Instagram',
          status: r.status || 'draft',
          scheduled_date: r.scheduled_date || '',
          created: r.created,
        })),
      )
    } catch (err) {
      // Falha silenciosa: lista de recentes é acessório, o form continua usável
      console.warn('Falha ao carregar posts recentes:', getErrorMessage(err))
    } finally {
      setLoadingRecent(false)
    }
  }, [user])

  useEffect(() => {
    loadRecent()
  }, [loadRecent])

  const handleCreate = async () => {
    if (!user) {
      toast({
        title: 'Sessão necessária',
        description: 'Faça login para criar posts.',
        variant: 'destructive',
      })
      return
    }
    if (!caption.trim()) {
      toast({
        title: 'Conteúdo obrigatório',
        description: 'Escreva o texto do post.',
        variant: 'destructive',
      })
      return
    }

    setCreating(true)
    try {
      // brand é obrigatório no schema; usa a primeira marca do usuário (padrão do app)
      let brandId = ''
      try {
        const b = await pb.collection('brands').getList(1, 1, { filter: `user = "${user.id}"` })
        brandId = b.items[0]?.id || ''
      } catch {
        /* marca segue vazia; o create vai falhar com o erro do schema se obrigatório */
      }

      if (!brandId) {
        toast({
          title: 'Nenhuma marca encontrada',
          description: 'Crie uma marca em Marcas antes de postar.',
          variant: 'destructive',
        })
        return
      }

      const isScheduled = Boolean(scheduledAt)
      const payload: Record<string, unknown> = {
        user: user.id,
        brand: brandId,
        content: caption.trim(),
        caption: caption.trim(),
        platform: network,
        target_networks: [network],
        status: isScheduled ? 'scheduled' : 'draft',
        ...(isScheduled ? { scheduled_date: new Date(scheduledAt).toISOString() } : {}),
      }

      await pb.collection('posts').create(payload)

      toast({
        title: isScheduled ? 'Post agendado' : 'Post criado',
        description: isScheduled
          ? `Publicação marcada para ${formatDateTime(scheduledAt)} — o processador de agendamento publicará automaticamente.`
          : `Post salvo como rascunho para ${network}.`,
      })

      setCaption('')
      setScheduledAt('')
      loadRecent()
      setReloadKey((k) => k + 1)
    } catch (err) {
      toast({
        title: 'Falha ao salvar',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Criar post social</h3>
          <Badge variant="outline" className="text-[9px] font-bold uppercase">
            Labs
          </Badge>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Texto do post</Label>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={5}
            placeholder="Escreva a legenda do post..."
            className="text-xs rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Rede social</Label>
          <div className="flex flex-wrap gap-2">
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setNetwork(n.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                  network === n.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="post-schedule" className="text-xs font-semibold">
            Agendar para (opcional)
          </Label>
          <Input
            id="post-schedule"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="text-xs rounded-xl max-w-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            Deixe vazio para salvar como rascunho. Com data futura, o post entra como{' '}
            <span className="font-semibold text-foreground">Agendado</span> e é publicado
            automaticamente pelo processador de agendamento já existente do portal.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleCreate}
          disabled={creating}
          className="rounded-xl text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {creating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {creating ? 'Salvando…' : scheduledAt ? 'Agendar post' : 'Salvar rascunho'}
        </Button>
      </Card>

      {/* Seções: Dashboard de agendamento | Métricas | Posts recentes */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: 'agendados', label: 'Agendados', icon: LayoutList },
              { id: 'metricas', label: 'Métricas de engajamento', icon: BarChart3 },
              { id: 'recentes', label: 'Posts recentes', icon: Clock },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors inline-flex items-center gap-1.5 ${
                section === id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/40'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {section === 'agendados' && <LabsScheduledDashboard reloadKey={reloadKey} />}
        {section === 'metricas' && (
          <LabsPostMetrics posts={recent} reloadKey={reloadKey + recent.length} />
        )}

        {section === 'recentes' &&
          (loadingRecent ? (
            <Card className="p-6 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </Card>
          ) : recent.length === 0 ? (
            <Card className="p-6 text-center space-y-1">
              <p className="text-xs font-semibold text-foreground">Nenhum post ainda</p>
              <p className="text-[11px] text-muted-foreground">
                Crie seu primeiro post no formulário acima.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recent.map((p) => (
                <Card key={p.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] font-bold uppercase">
                        {p.platform}
                      </Badge>
                      <Badge variant="outline" className={statusBadgeClass(p.status)}>
                        {STATUS_LABELS[p.status] || p.status}
                      </Badge>
                    </div>
                    {p.status === 'scheduled' && p.scheduled_date && (
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold border-amber-500/40 text-amber-600 gap-1"
                      >
                        <CalendarClock className="w-3 h-3" />
                        Agendado para {formatDateTime(p.scheduled_date)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                    {p.caption || p.content}
                  </p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDateTime(p.created)}
                  </p>
                </Card>
              ))}
            </div>
          ))}
      </div>
    </div>
  )
}
