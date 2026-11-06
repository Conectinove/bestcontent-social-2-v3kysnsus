import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit3, Share2, Sparkles, Copy, CheckCircle2, Loader2, FlaskConical, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { approvePost } from '@/services/approval'
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Top Header Card */}
        <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-semibold">
              {post.status === 'published'
                ? 'Publicado'
                : post.status === 'scheduled'
                  ? 'Agendado'
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
            <Button size="sm" className="bg-primary text-white text-xs gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Publicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
