import { useState } from 'react'
import {
  Calendar,
  Clock,
  Send,
  Loader2,
  Sparkles,
  Share2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Post } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { createScheduledPost } from '@/services/scheduled_posts'
import { updatePost } from '@/services/posts'
import { toast } from '@/hooks/use-toast'

interface BulkScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  posts: Post[]
  onSuccess: () => void
}

const NETWORKS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitter', label: 'X (Twitter)' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'threads', label: 'Threads' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'kwai', label: 'Kwai' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'bluesky', label: 'Bluesky' },
  { id: 'snapchat', label: 'Snapchat' },
]

export function BulkScheduleModal({
  open,
  onOpenChange,
  posts,
  onSuccess,
}: BulkScheduleModalProps) {
  // Data inicial padrão: amanhã às 10:00
  const getDefaultStartDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(10, 0, 0, 0)
    // Formato YYYY-MM-DDTHH:mm
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const { user } = useAuth()
  const [startDate, setStartDate] = useState(getDefaultStartDate())
  const [network, setNetwork] = useState('instagram')
  const [intervalHours, setIntervalHours] = useState('24') // 4, 12, 24, 48, 72 horas
  const [loading, setLoading] = useState(false)
  const [keepPlatform, setKeepPlatform] = useState(false)

  // Simulação de cronograma
  const schedulePlan = posts.map((p, idx) => {
    const base = new Date(startDate)
    if (isNaN(base.getTime())) return { post: p, date: new Date() }
    const stepHours = Number(intervalHours) || 24
    base.setHours(base.getHours() + idx * stepHours)
    const targetNet = keepPlatform && p.platform ? p.platform.toLowerCase() : network
    return {
      post: p,
      date: base,
      targetNet,
    }
  })

  const handleBulkSchedule = async () => {
    if (!startDate) {
      toast({
        title: 'Data inicial obrigatória',
        description: 'Escolha quando o primeiro post deve ser publicado.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    let successCount = 0
    let failureCount = 0

    try {
      for (let i = 0; i < schedulePlan.length; i++) {
        const item = schedulePlan[i]
        const isoDate = item.date.toISOString()

        try {
          // 1. Cria registro na fila oficial scheduled_posts
          await createScheduledPost({
            content: item.post.content || item.post.caption || '',
            caption: item.post.caption || item.post.content || '',
            network: item.targetNet,
            platforms: [item.targetNet],
            scheduled_date: isoDate,
            scheduled_for: isoDate,
            status: 'scheduled',
            media_url: item.post.mediaUrls?.[0] || undefined,
            user: user?.id || undefined,
          })

          // 2. Atualiza o status do post original para 'scheduled'
          await updatePost(item.post.id, {
            status: 'scheduled',
            scheduledDate: isoDate,
            platform: item.targetNet,
          })

          successCount++
        } catch {
          failureCount++
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Agendamento em massa concluído! 🎉',
          description: `${successCount} post(s) adicionados à fila do Calendário com sucesso.${
            failureCount > 0 ? ` (${failureCount} falharam)` : ''
          }`,
        })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          title: 'Falha no agendamento em lote',
          description: 'Não foi possível agendar os posts. Verifique a conexão.',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-archivo">
                Agendamento em Massa ({posts.length} posts)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Distribua as publicações na fila do Calendário com data inicial e intervalo
                automático.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Configuração da Fila */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-muted/40 border border-border/80">
            {/* Data Inicial */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                Data do 1º Post
              </Label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs rounded-xl bg-card"
              />
            </div>

            {/* Intervalo entre posts */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Intervalo
              </Label>
              <Select value={intervalHours} onValueChange={setIntervalHours}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-card">
                  <SelectValue placeholder="Selecione o intervalo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">A cada 4 horas</SelectItem>
                  <SelectItem value="8">A cada 8 horas</SelectItem>
                  <SelectItem value="12">A cada 12 horas</SelectItem>
                  <SelectItem value="24">A cada 24 horas (Diário)</SelectItem>
                  <SelectItem value="48">A cada 2 dias (48h)</SelectItem>
                  <SelectItem value="72">A cada 3 dias (72h)</SelectItem>
                  <SelectItem value="168">Semanalmente (7 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rede Alvo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-purple-600" />
                Rede Social
              </Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-card capitalize">
                  <SelectValue placeholder="Rede" />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Opção de preservar rede original de cada post se já definida */}
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="keepPlatform"
              checked={keepPlatform}
              onChange={(e) => setKeepPlatform(e.target.checked)}
              className="rounded border-border text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
            />
            <label
              htmlFor="keepPlatform"
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              Preservar a rede original de cada post (se definida) em vez de padronizar para{' '}
              {network}
            </label>
          </div>

          {/* Prévia da Fila Cronológica */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Prévia da Fila Cronológica ({posts.length} itens)
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Persistido em <code className="text-purple-600">scheduled_posts</code>
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {schedulePlan.map(({ post, date, targetNet }, idx) => (
                <div
                  key={post.id}
                  className="p-3 rounded-2xl bg-card border border-border/80 flex items-center justify-between gap-3 text-xs hover:border-purple-500/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">
                        {post.caption?.slice(0, 35) ||
                          post.content?.slice(0, 35) ||
                          'Post sem título'}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {post.caption || post.content || 'Sem legenda'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-right">
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {targetNet}
                    </Badge>
                    <div className="text-[11px]">
                      <p className="font-bold text-foreground">
                        {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/40 text-[11px] text-muted-foreground flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              Todos os posts serão visíveis instantaneamente no <strong>Calendário</strong> e na{' '}
              <strong>Fila Completa</strong>, prontos para publicação automática ou manual.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-xl text-xs h-9"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleBulkSchedule}
            disabled={loading || posts.length === 0}
            className="rounded-xl text-xs h-9 bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1.5 shadow-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Agendar {posts.length} Posts em Lote</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
