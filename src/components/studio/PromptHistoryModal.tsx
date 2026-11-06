import { useState, useEffect } from 'react'
import { History, Trash2, Copy, ArrowUpRight, Clock, Sparkles, Layers, Filter } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  getStudioPromptHistory,
  deleteStudioPromptHistoryItem,
  type StudioPromptHistoryItem,
} from '@/services/studio-prompt-history'
import type { StudioMediaType } from '@/services/ai-studio'

interface PromptHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentType: StudioMediaType
  onApplyPrompt: (prompt: string, mediaType?: StudioMediaType, modelId?: string) => void
}

export const PromptHistoryModal: React.FC<PromptHistoryModalProps> = ({
  open,
  onOpenChange,
  currentType,
  onApplyPrompt,
}) => {
  const [historyList, setHistoryList] = useState<StudioPromptHistoryItem[]>([])
  const [filterType, setFilterType] = useState<string>('todos')
  const [loading, setLoading] = useState(false)

  const loadHistory = async () => {
    try {
      setLoading(true)
      const list = await getStudioPromptHistory()
      setHistoryList(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadHistory()
    }
  }, [open])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteStudioPromptHistoryItem(id)
    setHistoryList((prev) => prev.filter((item) => item.id !== id))
    toast({
      title: 'Prompt removido do histórico',
    })
  }

  const handleApply = (item: StudioPromptHistoryItem) => {
    onApplyPrompt(item.prompt, item.media_type, item.model_id)
    toast({
      title: 'Prompt reaplicado!',
      description: 'A caixa de geração do Studio foi preenchida com o prompt selecionado.',
    })
    onOpenChange(false)
  }

  const filteredList = historyList.filter((item) => {
    if (filterType === 'todos') return true
    return item.media_type === filterType
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border/80 shadow-2xl p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <History className="w-4 h-4" />
              </div>
              <DialogTitle className="font-heading text-lg font-bold tracking-tight">
                Histórico de Prompts do Studio
              </DialogTitle>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
              {filteredList.length} registrados
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Cada prompt enviado é guardado aqui com o modelo e tipo de mídia. Clique em qualquer
            item para preencher a textarea de novo em 1 clique.
          </DialogDescription>
        </DialogHeader>

        {/* Filtros de Mídia */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1">
          <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1 flex-shrink-0" />
          {['todos', 'video', 'image', 'audio', 'geral', '3d'].map((cat) => (
            <Button
              key={cat}
              type="button"
              variant={filterType === cat ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-[11px] capitalize px-2.5"
              onClick={() => setFilterType(cat)}
            >
              {cat === 'todos' ? 'Todos os Tipos' : cat}
            </Button>
          ))}
        </div>

        {/* Lista de prompts */}
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 mt-2">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Carregando histórico de prompts...
            </div>
          ) : filteredList.length > 0 ? (
            filteredList.map((item) => (
              <div
                key={item.id}
                onClick={() => handleApply(item)}
                className="group p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-primary/60 cursor-pointer transition-all flex flex-col gap-2 relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge className="text-[9px] uppercase px-1.5 py-0 bg-primary/10 text-primary border-primary/20 font-mono">
                      {item.media_type}
                    </Badge>
                    {item.model_name && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 font-mono text-muted-foreground"
                      >
                        {item.model_name}
                      </Badge>
                    )}
                    {item.quality_tier && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 font-mono text-cyan-500 uppercase"
                      >
                        {item.quality_tier}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {item.created && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 mr-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 text-muted-foreground hover:text-destructive opacity-70 group-hover:opacity-100"
                      onClick={(e) => handleDelete(e, item.id)}
                      title="Excluir do histórico"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-foreground/90 font-medium leading-relaxed line-clamp-3">
                  &ldquo;{item.prompt}&rdquo;
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[11px] text-primary font-semibold">
                  <span className="flex items-center gap-1 group-hover:underline">
                    <ArrowUpRight className="w-3 h-3" />
                    Reutilizar prompt na geração
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    1 clique para preencher
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl p-8">
              <Sparkles className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-50" />
              Nenhum prompt encontrado no histórico para o filtro selecionado. Envie uma criação no
              Studio para registrar automaticamente.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
