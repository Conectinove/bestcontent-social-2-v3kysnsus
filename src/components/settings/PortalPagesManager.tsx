import { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, GripVertical, Eye, EyeOff, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import {
  listPortalPages,
  createPortalPage,
  updatePortalPage,
  deletePortalPage,
  slugifyTitle,
  type PortalPage,
  type PortalPageContent,
  type PortalBlock,
} from '@/services/portal-pages'
import { PortalBlocksEditor } from '@/components/settings/PortalBlocksEditor'

interface PortalPagesManagerProps {
  brandId: string
  userId: string
}

interface DraftState {
  id: string | null
  title: string
  slug: string
  blocks: PortalBlock[]
  is_visible: boolean
  sort_order: number
}

const emptyDraft = (order: number): DraftState => ({
  id: null,
  title: '',
  slug: '',
  blocks: [],
  is_visible: true,
  sort_order: order,
})

/** Gestão de páginas internas do portal (pedido 4): criar/editar/excluir/ordenar. */
export function PortalPagesManager({ brandId, userId }: PortalPagesManagerProps) {
  const [pages, setPages] = useState<PortalPage[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<DraftState | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setPages(await listPortalPages(brandId))
    } catch (err) {
      console.error('Erro ao carregar páginas do portal:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId])

  const handleSave = async () => {
    if (!draft) return
    if (!draft.title.trim()) {
      toast({ title: 'Atenção', description: 'Dê um título à página.', variant: 'destructive' })
      return
    }
    setSaving(true)
    const slug = (draft.slug || slugifyTitle(draft.title)).slice(0, 100)
    const content: PortalPageContent = { blocks: draft.blocks }
    try {
      if (draft.id) {
        await updatePortalPage(draft.id, {
          title: draft.title.trim(),
          slug,
          content,
          sort_order: draft.sort_order,
          is_visible: draft.is_visible,
        })
      } else {
        await createPortalPage({
          user: userId,
          brand: brandId,
          title: draft.title.trim(),
          slug,
          content,
          sort_order: draft.sort_order ?? pages.length,
          is_visible: draft.is_visible,
        })
      }
      toast({
        title: 'Página salva',
        description: `"${draft.title.trim()}" já aparece no portal público.`,
      })
      setDraft(null)
      await load()
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao salvar página',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePortalPage(id)
      setPages((prev) => prev.filter((p) => p.id !== id))
      toast({ title: 'Página removida' })
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  const handleToggleVisible = async (page: PortalPage) => {
    try {
      await updatePortalPage(page.id, { is_visible: !page.is_visible })
      setPages((prev) =>
        prev.map((p) => (p.id === page.id ? { ...p, is_visible: !p.is_visible } : p)),
      )
    } catch {
      toast({ title: 'Erro ao atualizar visibilidade', variant: 'destructive' })
    }
  }

  const handleMove = async (page: PortalPage, dir: -1 | 1) => {
    const idx = pages.findIndex((p) => p.id === page.id)
    const target = pages[idx + dir]
    if (!target) return
    try {
      await updatePortalPage(page.id, { sort_order: target.sort_order })
      await updatePortalPage(target.id, { sort_order: page.sort_order })
      await load()
    } catch {
      toast({ title: 'Erro ao reordenar', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Páginas internas aparecem como navegação no portal público (ex: Sobre, Contato, Serviços).
        </p>
        {!draft && (
          <Button
            size="sm"
            className="text-xs gap-1"
            onClick={() => setDraft(emptyDraft(pages.length))}
          >
            <Plus className="w-3.5 h-3.5" /> Nova página
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : (
        pages.length > 0 && (
          <div className="space-y-2">
            {pages.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border/70 bg-muted/30"
              >
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">/{p.slug}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleMove(p, -1)}
                  disabled={idx === 0}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleMove(p, 1)}
                  disabled={idx === pages.length - 1}
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleToggleVisible(p)}
                >
                  {p.is_visible ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() =>
                    setDraft({
                      id: p.id,
                      title: p.title,
                      slug: p.slug,
                      blocks: Array.isArray(p.content?.blocks) ? p.content.blocks : [],
                      is_visible: p.is_visible,
                      sort_order: p.sort_order,
                    })
                  }
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive"
                  onClick={() => handleDelete(p.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )
      )}

      {draft && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">
              {draft.id ? 'Editar página' : 'Nova página interna'}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setDraft(null)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Título</label>
              <Input
                value={draft.title}
                onChange={(e) =>
                  setDraft((d) =>
                    d
                      ? {
                          ...d,
                          title: e.target.value,
                          slug: d.id ? d.slug : slugifyTitle(e.target.value),
                        }
                      : d,
                  )
                }
                placeholder="Sobre nós"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Slug (URL interna)</label>
              <Input
                value={draft.slug}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, slug: slugifyTitle(e.target.value) } : d))
                }
                placeholder="sobre-nos"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Conteúdo (blocos arrastáveis)</label>
            <PortalBlocksEditor
              blocks={draft.blocks}
              onChange={(blocks) => setDraft((d) => (d ? { ...d, blocks } : d))}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold">
              <Switch
                checked={draft.is_visible}
                onCheckedChange={(v) => setDraft((d) => (d ? { ...d, is_visible: v } : d))}
              />
              Visível no portal
            </label>
            <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs gap-1">
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Salvar página
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
