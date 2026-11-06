import { useState, useEffect } from 'react'
import { FileText, Clock, Trash2, ArrowRight, Sparkles, RefreshCw, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { pb } from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { deletePost, Post } from '@/services/posts'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export interface SavedDraftItem {
  id: string
  title?: string
  content: string
  caption?: string
  platform?: string
  brandId?: string
  mediaUrl?: string
  created: string
  updated?: string
  templateId?: string
}

interface SavedDraftsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectDraft: (draft: SavedDraftItem) => void
  currentDraftId?: string | null
}

export function SavedDraftsDrawer({
  open,
  onOpenChange,
  onSelectDraft,
  currentDraftId,
}: SavedDraftsDrawerProps) {
  const { toast } = useToast()
  const [drafts, setDrafts] = useState<SavedDraftItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadDrafts = async () => {
    setLoading(true)
    try {
      // Busca posts com status='draft' no PocketBase
      const records = await pb.collection('posts').getList(1, 50, {
        filter: "status = 'draft'",
        sort: '-updated,-created',
      })

      const items: SavedDraftItem[] = records.items.map((item: any) => ({
        id: item.id,
        title: item.title || '',
        content: item.content || item.caption || '',
        caption: item.caption || '',
        platform: item.platform || 'Instagram',
        brandId: item.brand || item.brandId || '',
        mediaUrl: item.media_url || item.mediaUrl || '',
        created: item.created,
        updated: item.updated,
        templateId: item.template_id || item.templateId || '',
      }))

      setDrafts(items)
    } catch (err) {
      console.warn('Falha ao carregar rascunhos salvos:', err)
      // Fallback para rascunho salvo em localStorage se houver
      try {
        const raw = localStorage.getItem('bestcontent_social2_create_post_draft')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed.content || parsed.caption) {
            setDrafts([
              {
                id: 'local-session-draft',
                title: 'Rascunho da Sessão Local',
                content: parsed.content || parsed.caption,
                caption: parsed.caption || '',
                platform: parsed.platform || 'Instagram',
                brandId: parsed.brandId,
                created: new Date().toISOString(),
                templateId: parsed.template?.id,
              },
            ])
          }
        }
      } catch {
        /* intentionally ignored */
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadDrafts()
    }
  }, [open])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (id === 'local-session-draft') {
      try {
        localStorage.removeItem('bestcontent_social2_create_post_draft')
        setDrafts((prev) => prev.filter((d) => d.id !== id))
        toast({ title: 'Rascunho local removido' })
      } catch {
        /* intentionally ignored */
      }
      return
    }

    setDeletingId(id)
    try {
      await deletePost(id)
      setDrafts((prev) => prev.filter((d) => d.id !== id))
      toast({
        title: 'Rascunho excluído',
        description: 'O rascunho foi removido com sucesso.',
      })
    } catch (err) {
      toast({
        title: 'Erro ao excluir rascunho',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const filteredDrafts = drafts.filter((d) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      d.content.toLowerCase().includes(q) ||
      (d.title && d.title.toLowerCase().includes(q)) ||
      (d.caption && d.caption.toLowerCase().includes(q)) ||
      (d.platform && d.platform.toLowerCase().includes(q))
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 rounded-3xl">
        <DialogHeader className="pr-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="hi-title text-xl tracking-tight text-foreground">
                  Biblioteca de Rascunhos Salvos
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Retome a edição com 1 clique com todo o conteúdo, mídia e configurações.
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadDrafts}
              disabled={loading}
              className="h-8 px-2.5 text-xs gap-1.5 shrink-0 rounded-xl"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>

          <div className="pt-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar rascunho por conteúdo, tema ou rede..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-card border-border/70"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-2 min-h-[240px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
              <p className="text-xs">Carregando seus rascunhos...</p>
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 space-y-2">
              <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-bold text-foreground">Nenhum rascunho encontrado</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {search.trim()
                  ? 'Nenhum rascunho bate com os termos pesquisados.'
                  : 'Ao escrever um post no Criador, clique em "Salvar Rascunho" para guardar o progresso e retomar depois.'}
              </p>
            </div>
          ) : (
            filteredDrafts.map((draft) => {
              const isCurrent = currentDraftId === draft.id
              const previewText = draft.content || draft.caption || 'Sem texto'
              const dateFormatted =
                draft.updated || draft.created
                  ? new Date(draft.updated || draft.created).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recentemente'

              return (
                <div
                  key={draft.id}
                  onClick={() => {
                    onSelectDraft(draft)
                    onOpenChange(false)
                  }}
                  className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-purple-500 bg-purple-500/10 shadow-sm'
                      : 'border-border/70 bg-card hover:border-purple-500/50 hover:bg-muted/40 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {draft.title ? (
                          <span className="font-bold text-xs text-foreground truncate max-w-[240px]">
                            {draft.title}
                          </span>
                        ) : (
                          <span className="font-bold text-xs text-foreground">
                            Rascunho de Post
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-mono px-1.5 py-0 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                        >
                          {draft.platform || 'Multi'}
                        </Badge>
                        {isCurrent && (
                          <Badge className="text-[10px] bg-purple-600 text-white py-0">
                            Em edição
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono ml-auto">
                          <Clock className="w-3 h-3" />
                          {dateFormatted}
                        </span>
                      </div>

                      <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed">
                        {previewText}
                      </p>

                      {draft.caption && draft.caption !== draft.content && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 italic">
                          Legenda: {draft.caption}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === draft.id}
                        onClick={(e) => handleDelete(draft.id, e)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                        title="Excluir rascunho"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        className="h-8 px-3 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-1 shadow-2xs group-hover:scale-102 transition-transform"
                      >
                        <span>Retomar</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>{drafts.length} rascunhos disponíveis no banco</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8 rounded-xl"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
