import { useState, useEffect, useCallback } from 'react'
import { Star, Layout, Square, X, Loader2 } from 'lucide-react'
import { getTemplates, toggleFavorite, type PostTemplate } from '@/services/post-templates'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface TemplateSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (template: PostTemplate) => void
}

export function TemplateSelector({ open, onOpenChange, onSelect }: TemplateSelectorProps) {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<PostTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'all' | 'feed' | 'story'>('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  const loadTemplates = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const result = await getTemplates(user.id, {
        type: typeFilter === 'all' ? undefined : typeFilter,
        favoritesOnly,
      })
      setTemplates(result as unknown as PostTemplate[])
    } catch {
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, typeFilter, favoritesOnly])

  useEffect(() => {
    if (open) loadTemplates()
  }, [open, loadTemplates])

  const handleToggleFav = async (template: PostTemplate, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const newVal = await toggleFavorite(template.id, template.is_favorite)
      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? { ...t, is_favorite: newVal } : t)),
      )
    } catch {
      toast({ title: 'Erro', description: 'Falha ao atualizar favorito.', variant: 'destructive' })
    }
  }

  const handleSelect = (template: PostTemplate) => {
    onSelect(template)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            Templates de Alta Conversão
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <Button
            size="sm"
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('all')}
            className="text-xs font-bold"
          >
            Todos
          </Button>
          <Button
            size="sm"
            variant={typeFilter === 'feed' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('feed')}
            className="text-xs font-bold gap-1"
          >
            <Layout className="w-3.5 h-3.5" /> Feed
          </Button>
          <Button
            size="sm"
            variant={typeFilter === 'story' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('story')}
            className="text-xs font-bold gap-1"
          >
            <Square className="w-3.5 h-3.5" /> Story
          </Button>
          <div className="flex-1" />
          <Button
            size="sm"
            variant={favoritesOnly ? 'default' : 'outline'}
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className="text-xs font-bold gap-1"
          >
            <Star className={cn('w-3.5 h-3.5', favoritesOnly && 'fill-current')} />
            Favoritos
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 -mx-1 px-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-20 space-y-2">
              <p className="text-sm font-bold text-muted-foreground">Nenhum template encontrado.</p>
              <p className="text-xs text-muted-foreground">
                Ajuste os filtros ou crie novos templates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-2">
              {templates.map((tpl) => {
                const styles = tpl.style_settings || {}
                const bgColor = (styles.bgColor as string) || '#0A0A0A'
                const accentColor = (styles.accentColor as string) || '#BF2A95'
                const textColor = (styles.textColor as string) || '#FFFFFF'
                const isStory = tpl.type === 'story'
                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelect(tpl)}
                    className="group relative cursor-pointer rounded-xl overflow-hidden border-2 border-border hover:border-primary transition-all duration-200 hover:shadow-elevation"
                  >
                    <div
                      className={cn(
                        'relative flex items-center justify-center',
                        isStory ? 'aspect-[9/16]' : 'aspect-square',
                      )}
                      style={{ backgroundColor: bgColor }}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 gap-2">
                        <div
                          className="w-full h-1/2 rounded-md flex items-center justify-center"
                          style={{ border: `2px solid ${accentColor}` }}
                        >
                          <span
                            className="text-[10px] font-black uppercase opacity-50"
                            style={{ color: textColor }}
                          >
                            {tpl.type}
                          </span>
                        </div>
                        <div
                          className="w-3/4 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: accentColor }}
                        >
                          <span className="text-[8px] font-black uppercase text-white">CTA</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleToggleFav(tpl, e)}
                        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                      >
                        <Star
                          className={cn(
                            'w-4 h-4 text-yellow-400',
                            tpl.is_favorite && 'fill-yellow-400',
                          )}
                        />
                      </button>
                    </div>
                    <div className="p-2 bg-card">
                      <p className="text-xs font-black truncate">{tpl.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {tpl.type}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
