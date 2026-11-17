import { useEffect, useState } from 'react'
import {
  Plus,
  Trash2,
  Loader2,
  GripVertical,
  Eye,
  EyeOff,
  Pencil,
  X,
  CalendarClock,
  History,
  AlertTriangle,
  RotateCcw,
  FileText,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import {
  listPortalPages,
  createPortalPage,
  updatePortalPage,
  deletePortalPage,
  slugifyTitle,
  isPageScheduled,
  type PortalPage,
  type PortalPageContent,
  type PortalBlock,
} from '@/services/portal-pages'
import { PortalBlocksEditor } from '@/components/settings/PortalBlocksEditor'
import { PortalPageVersionsDialog } from '@/components/settings/PortalPageVersionsDialog'
import { generateLabsWebSections } from '@/services/labs-ai'
import { LabsAiGeneratorDialog } from '@/components/labs/LabsAiGeneratorDialog'

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
  /** Publicação agendada no formato "YYYY-MM-DDTHH:MM" (input datetime-local). */
  publish_at: string
}

const emptyDraft = (order: number): DraftState => ({
  id: null,
  title: '',
  slug: '',
  blocks: [],
  is_visible: true,
  sort_order: order,
  publish_at: '',
})

/** Converte "YYYY-MM-DDTHH:MM" do input para "YYYY-MM-DD HH:MM:SS" gravável no backend. */
const toBackendSchedule = (local: string): string => {
  if (!local) return ''
  return `${local.replace('T', ' ')}:00`
}

/** Converte "YYYY-MM-DD HH:MM:SS" do backend para o formato do input datetime-local. */
const fromBackendSchedule = (raw: string): string => {
  const v = (raw || '').trim()
  if (!v) return ''
  return v.replace(' ', 'T').slice(0, 16)
}

/** Gestão de páginas internas do portal: criar/editar/excluir/ordenar/agendar/versões. */
export function PortalPagesManager({ brandId, userId }: PortalPagesManagerProps) {
  const [pages, setPages] = useState<PortalPage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftState | null>(null)
  const [saving, setSaving] = useState(false)
  const [versionsPage, setVersionsPage] = useState<PortalPage | null>(null)
  const [aiOpen, setAiOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setPages(await listPortalPages(brandId))
    } catch (err) {
      console.error('Erro ao carregar páginas do portal:', err)
      setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar as páginas.')
      toast({
        title: 'Erro ao carregar páginas',
        description: 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      })
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
    const publishAt = toBackendSchedule(draft.publish_at)
    try {
      if (draft.id) {
        await updatePortalPage(draft.id, {
          title: draft.title.trim(),
          slug,
          content,
          sort_order: draft.sort_order,
          is_visible: draft.is_visible,
          publish_at: publishAt,
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
          publish_at: publishAt,
        })
      }
      toast({
        title: 'Página salva',
        description: publishAt
          ? `Publicação agendada para ${publishAt.slice(0, 16).replace('T', ' ')}.`
          : `"${draft.title.trim()}" já aparece no portal público.`,
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

  /** Gera textos de seção via studio-agent e monta blocos título+texto no rascunho (usuário edita antes de salvar). */
  const handleAiGenerate = async (briefing: string) => {
    const sections = await generateLabsWebSections(briefing)
    const blocks = sections.flatMap((s) => [
      {
        id: `blk-ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'title' as const,
        text: s.heading,
      },
      {
        id: `blk-ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'text' as const,
        text: s.text,
      },
    ])
    setDraft({
      id: null,
      title: sections[0]?.heading || 'Página gerada por IA',
      slug: '',
      blocks,
      is_visible: true,
      sort_order: pages.length,
      publish_at: '',
    })
    toast({
      title: 'Página gerada!',
      description: 'Revise os blocos de título e texto antes de salvar.',
    })
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
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1"
              onClick={() => setAiOpen(true)}
            >
              <Wand2 className="w-3.5 h-3.5" /> Gerar com IA
            </Button>
            <Button
              size="sm"
              className="text-xs gap-1"
              onClick={() => setDraft(emptyDraft(pages.length))}
            >
              <Plus className="w-3.5 h-3.5" /> Nova página
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border border-destructive/30 bg-destructive/5 text-center">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <p className="text-sm font-semibold">Falha ao carregar as páginas</p>
          <p className="text-xs text-muted-foreground max-w-xs">{loadError}</p>
          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => void load()}>
            <RotateCcw className="w-3.5 h-3.5" /> Tentar novamente
          </Button>
        </div>
      ) : pages.length === 0 ? (
        !draft && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border border-dashed border-border text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </span>
            <p className="text-sm font-semibold">Nenhuma página interna ainda</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Crie a primeira página (ex: Sobre, Contato, Serviços) para dar navegação ao seu portal
              público.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1"
              onClick={() => setDraft(emptyDraft(0))}
            >
              <Plus className="w-3.5 h-3.5" /> Criar primeira página
            </Button>
          </div>
        )
      ) : (
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
                {isPageScheduled(p) && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" />
                    Agendada para {p.publish_at.slice(0, 16).replace('T', ' ')}
                  </p>
                )}
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
                title="Histórico de versões"
                onClick={() => setVersionsPage(p)}
              >
                <History className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                title="Editar página"
                onClick={() =>
                  setDraft({
                    id: p.id,
                    title: p.title,
                    slug: p.slug,
                    blocks: Array.isArray(p.content?.blocks) ? p.content.blocks : [],
                    is_visible: p.is_visible,
                    sort_order: p.sort_order,
                    publish_at: fromBackendSchedule(p.publish_at),
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
              userId={userId}
              brandId={brandId}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold flex items-center gap-1">
                <CalendarClock className="w-3.5 h-3.5" />
                Publicação agendada (opcional)
              </label>
              <Input
                type="datetime-local"
                value={draft.publish_at}
                onChange={(e) => setDraft((d) => (d ? { ...d, publish_at: e.target.value } : d))}
              />
              <p className="text-[10px] text-muted-foreground">
                A página só aparece no portal público a partir dessa data/hora. Vazio = publicada
                imediatamente.
              </p>
            </div>
            <div className="flex items-end justify-between gap-2">
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
        </div>
      )}

      {versionsPage && (
        <PortalPageVersionsDialog
          page={versionsPage}
          onRestored={async () => {
            await load()
            toast({
              title: 'Versão restaurada',
              description: 'O conteúdo antigo voltou para a página.',
            })
          }}
          onClose={() => setVersionsPage(null)}
        />
      )}

      {/* Geração por IA (studio-agent) */}
      <LabsAiGeneratorDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        title="Gerar página com IA"
        description="Descreva o objetivo da página e a marca — a IA cria os textos de seção (títulos + parágrafos) que entram nos blocos para você revisar e editar."
        placeholder="Ex.: página Sobre de uma escola de idiomas focada em conversação desde o primeiro dia"
        generatingLabel="Gerando página…"
        onGenerate={handleAiGenerate}
      />
    </div>
  )
}
