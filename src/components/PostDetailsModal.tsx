import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit3, Share2, Sparkles, Copy, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

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
  if (!post) return null

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
        </div>

        {/* Bottom Modal Actions */}
        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onEditDesign} className="text-xs gap-1.5">
            <Edit3 className="w-3.5 h-3.5" /> Editar Design
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> Compartilhar
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
