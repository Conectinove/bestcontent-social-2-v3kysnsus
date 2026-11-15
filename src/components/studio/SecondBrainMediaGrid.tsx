import React, { useEffect, useMemo, useState } from 'react'
import {
  FileText,
  History,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Plus,
  Search,
  Sliders,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { getFileUrl } from '@/lib/mappers'
import { pb } from '@/lib/pocketbase/client'
import {
  DEFAULT_CUSTOMIZATION,
  type AdvancedCustomizationState,
} from '@/components/workspace/AdvancedCustomizationPanel'
import {
  SecondBrainAdvancedImageEditor,
  buildBrainImageFilter,
} from './SecondBrainAdvancedImageEditor'
import {
  applySecondBrainMediaTemplate,
  createSecondBrainMediaTemplate,
  deleteSecondBrainMediaTemplate,
  fetchAccountMediaSource,
  fetchCuratedMediaSource,
  listSecondBrainMediaTemplates,
  listSecondBrainMediaVersions,
  saveSecondBrainMediaVersion,
  type SecondBrainMediaTemplate,
  type SecondBrainMediaVersion,
} from '@/services/second-brain-media'

export interface SecondBrainMediaItem {
  id: string
  name: string
  url: string
  kind: 'image' | 'document'
  source: string
  sourceUrl?: string
  origin?: 'documento' | 'acervo' | 'uploads' | 'biblioteca'
  tags?: string[]
}

type SourceTab = NonNullable<SecondBrainMediaItem['origin']>

interface SecondBrainDocShape {
  id: string
  title: string
  modules: Array<{
    id: string
    title: string
    blocks: Array<{
      id: string
      type: string
      content: string
      caption?: string
      metadata?: Record<string, any>
    }>
  }>
}

interface SecondBrainMediaGridProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doc: SecondBrainDocShape
  onDocUpdated: (doc: { modules: any[] }) => void
}

const SOURCE_TABS: Array<{ key: SourceTab; label: string }> = [
  { key: 'documento', label: 'Documento' },
  { key: 'acervo', label: 'Acervo' },
  { key: 'uploads', label: 'Uploads' },
  { key: 'biblioteca', label: 'Biblioteca' },
]

/** Extrai o estado de edição persistido para uma URL de mídia, varrendo os blocos. */
export function findEditStateFor(
  url: string,
  doc: SecondBrainDocShape,
): Partial<AdvancedCustomizationState> | null {
  for (const m of doc.modules) {
    for (const b of m.blocks) {
      const meta = b.metadata || {}
      if (
        meta.image_url === url ||
        meta.thumbnail_url === url ||
        meta.attachment_url === url ||
        (typeof b.content === 'string' && b.content.includes(url))
      ) {
        return (meta.advanced_edit as Partial<AdvancedCustomizationState>) || null
      }
    }
  }
  return null
}

const editStyleFor = (
  item: SecondBrainMediaItem,
  doc: SecondBrainDocShape,
): React.CSSProperties => {
  const saved = findEditStateFor(item.url, doc)
  if (!saved) return {}
  return {
    filter: buildBrainImageFilter({
      ...DEFAULT_CUSTOMIZATION,
      ...saved,
    } as AdvancedCustomizationState),
    transform: [
      saved.rotation ? `rotate(${saved.rotation}deg)` : '',
      saved.flipHorizontal ? 'scaleX(-1)' : '',
      saved.flipVertical ? 'scaleY(-1)' : '',
    ]
      .filter(Boolean)
      .join(' '),
  }
}

const isEdited = (item: SecondBrainMediaItem, doc: SecondBrainDocShape) =>
  !!findEditStateFor(item.url, doc)

function matchesSearch(item: SecondBrainMediaItem, q: string): boolean {
  const query = q.trim().toLowerCase()
  if (!query) return true
  const fileName = item.url.split('/').pop() || ''
  return [item.name, fileName, item.kind, item.source, (item.tags || []).join(' ')]
    .join(' ')
    .toLowerCase()
    .includes(query)
}

function parseTags(raw: any): string[] {
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw)
      return Array.isArray(p) ? p.map(String) : [raw]
    } catch {
      return [raw]
    }
  }
  return []
}

/**
 * Grid de mídias do Segundo Cérebro: busque, alterne entre fontes (Documento,
 * Acervo, Uploads, Biblioteca), inclua mídias no doc, restaure versões do
 * histórico (studio_edit_versions, namespace secondbrain:) e aplique modelos
 * de composição (studio_edit_presets).
 */
export const SecondBrainMediaGrid: React.FC<SecondBrainMediaGridProps> = ({
  open,
  onOpenChange,
  doc,
  onDocUpdated,
}) => {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<SourceTab>('documento')
  const [bankItems, setBankItems] = useState<SecondBrainMediaItem[]>([])
  const [bankLoading, setBankLoading] = useState(false)
  const [uploadsItems, setUploadsItems] = useState<SecondBrainMediaItem[]>([])
  const [uploadsLoading, setUploadsLoading] = useState(false)
  const [editingMedia, setEditingMedia] = useState<SecondBrainMediaItem | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [historyItem, setHistoryItem] = useState<SecondBrainMediaItem | null>(null)
  const [versions, setVersions] = useState<SecondBrainMediaVersion[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [templates, setTemplates] = useState<SecondBrainMediaTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [applyingTemplate, setApplyingTemplate] = useState<SecondBrainMediaTemplate | null>(null)
  const [nameOpen, setNameOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [pendingTemplate, setPendingTemplate] = useState<AdvancedCustomizationState | null>(null)

  const mediaItems: SecondBrainMediaItem[] = useMemo(() => {
    const items: SecondBrainMediaItem[] = []
    const seen = new Set<string>()
    doc.modules.forEach((m) => {
      m.blocks.forEach((b) => {
        const meta = b.metadata || {}
        const candidates: Array<{ url?: string; name?: string; source?: string }> = []
        if (meta.image_url)
          candidates.push({
            url: meta.image_url,
            name: meta.image_name || m.title,
            source: 'Anexo do item',
          })
        if (meta.thumbnail_url)
          candidates.push({
            url: meta.thumbnail_url,
            name: meta.image_name || m.title,
            source: 'Capa do anexo',
          })
        if (meta.attachment_url)
          candidates.push({
            url: meta.attachment_url,
            name: meta.attachment_name || m.title,
            source: 'Anexo do item',
          })
        if (
          b.type === 'image' &&
          typeof b.content === 'string' &&
          /^https?:\/\//.test(b.content.trim())
        )
          candidates.push({
            url: b.content.trim(),
            name: b.caption || m.title,
            source: 'Bloco de imagem',
          })
        if ((b.type === 'paragraph' || b.type === 'callout') && typeof b.content === 'string') {
          const match = b.content.match(/https?:\/\/[^\s)"']+\.(?:png|jpe?g|gif|webp|avif)/i)
          if (match) candidates.push({ url: match[0], name: m.title, source: 'Link em bloco' })
        }
        candidates.forEach((c) => {
          if (c.url && !seen.has(c.url)) {
            seen.add(c.url)
            items.push({
              id: `${b.id}:${c.url.slice(-24)}`,
              name: c.name || m.title || 'Mídia',
              url: c.url,
              kind: 'image',
              source: c.source || 'Anexo do item',
              origin: 'documento',
            })
          }
        })
      })
    })
    return items
  }, [doc])

  const docUrls = useMemo(() => new Set(mediaItems.map((i) => i.url)), [mediaItems])

  const docFiles = useMemo(() => {
    const files: Array<{ id: string; name: string; source: string; url?: string }> = []
    doc.modules.forEach((m) => {
      m.blocks.forEach((b) => {
        const meta = b.metadata || {}
        if (meta.attachment_url && !/\.(png|jpe?g|gif|webp|avif)$/i.test(meta.attachment_url)) {
          files.push({
            id: `${b.id}:file`,
            name: meta.attachment_name || m.title,
            source: 'Anexo do item',
            url: meta.source_url || meta.attachment_url,
          })
        }
      })
    })
    return files
  }, [doc])

  // Acervo da conta (image_bank_assets)
  useEffect(() => {
    if (!open || tab !== 'acervo' || bankItems.length || bankLoading) return
    let alive = true
    setBankLoading(true)
    fetchAccountMediaSource({ perPage: 60 })
      .then((page) => alive && setBankItems(page.items))
      .catch(() => alive && setBankItems([]))
      .finally(() => alive && setBankLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab])

  // Uploads anteriores (posts.media)
  useEffect(() => {
    if (!open || tab !== 'uploads' || uploadsItems.length || uploadsLoading) return
    let alive = true
    setUploadsLoading(true)
    ;(async () => {
      try {
        const userId = pb.authStore.record?.id as string | undefined
        const recs = await pb.collection('posts').getList(1, 60, {
          filter: userId ? `user = "${userId}"` : undefined,
          sort: '-created',
        })
        const items = (recs.items || [])
          .map((r: any): SecondBrainMediaItem | null => {
            const url = getFileUrl(r, 'media') || r.image_url || ''
            if (!url) return null
            return {
              id: `post:${r.id}`,
              name: r.title || (r.caption || '').slice(0, 60) || 'Upload anterior',
              url,
              kind: 'image',
              source: 'Upload em posts',
              origin: 'uploads',
              tags: parseTags(r.tags),
            }
          })
          .filter((i): i is SecondBrainMediaItem => Boolean(i))
        if (alive) setUploadsItems(items)
      } catch {
        if (alive) setUploadsItems([]) // indisponível: estado vazio honesto
      } finally {
        if (alive) setUploadsLoading(false)
      }
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab])

  const curatedItems = useMemo(
    () => (tab === 'biblioteca' ? fetchCuratedMediaSource(search) : []),
    [tab, search],
  )

  const sourceItems: SecondBrainMediaItem[] =
    tab === 'documento'
      ? mediaItems
      : tab === 'acervo'
        ? bankItems
        : tab === 'uploads'
          ? uploadsItems
          : curatedItems

  const sourceLoading = tab === 'acervo' ? bankLoading : tab === 'uploads' ? uploadsLoading : false

  const visibleItems = useMemo(
    () => sourceItems.filter((i) => matchesSearch(i, search)),
    [sourceItems, search],
  )

  const hasAnyContent =
    mediaItems.length > 0 || docFiles.length > 0 || bankItems.length > 0 || uploadsItems.length > 0

  /** Persiste um estado de edição avançada no bloco dono da URL. */
  const applyEditToDoc = (
    item: SecondBrainMediaItem,
    edit: Partial<AdvancedCustomizationState>,
  ) => {
    const updatedModules = doc.modules.map((m) => ({
      ...m,
      blocks: m.blocks.map((b) => {
        const meta = b.metadata || {}
        const hits =
          meta.image_url === item.url ||
          meta.thumbnail_url === item.url ||
          meta.attachment_url === item.url ||
          (typeof b.content === 'string' && b.content.includes(item.url))
        if (!hits) return b
        return {
          ...b,
          metadata: {
            ...meta,
            advanced_edit: {
              ...(meta.advanced_edit || {}),
              ...edit,
              edited_at: new Date().toISOString(),
            },
          },
        }
      }),
    }))
    onDocUpdated({ modules: updatedModules })
  }

  const saveEditedImage = async (item: SecondBrainMediaItem, state: AdvancedCustomizationState) => {
    setSavingId(item.id)
    try {
      applyEditToDoc(item, state)
      // Snapshot para o histórico de edições (best-effort, nunca bloqueia)
      await saveSecondBrainMediaVersion({
        mediaId: item.id,
        title: item.name,
        settings: state,
        previewUrl: item.url,
      })
      setEditingMedia(null)
      toast({
        title: 'Edição salva!',
        description: `"${item.name}" atualizado — o ajuste persiste ao recarregar.`,
      })
    } finally {
      setSavingId(null)
    }
  }

  const openHistory = async (item: SecondBrainMediaItem) => {
    setHistoryItem(item)
    setHistoryLoading(true)
    try {
      setVersions(await listSecondBrainMediaVersions(item.id))
    } catch {
      setVersions([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const restoreVersion = async (version: SecondBrainMediaVersion) => {
    if (!historyItem || !version.settings) {
      toast({
        title: 'Versão sem ajustes salvos',
        description: 'Este snapshot não traz um estado aplicável.',
        variant: 'destructive',
      })
      return
    }
    setRestoringId(version.id)
    try {
      applyEditToDoc(historyItem, version.settings as Partial<AdvancedCustomizationState>)
      toast({
        title: 'Versão restaurada',
        description: `Estado de ${new Date(version.created).toLocaleString('pt-BR')} aplicado a "${historyItem.name}".`,
      })
      setHistoryItem(null)
    } finally {
      setRestoringId(null)
    }
  }

  /** Inclui uma mídia de outra fonte no documento (bloco de imagem persistido). */
  const includeInDoc = (item: SecondBrainMediaItem) => {
    if (docUrls.has(item.url)) return
    const newBlock = {
      id: `blk-${Date.now()}-media`,
      type: 'image',
      content: item.url,
      caption: item.name,
      isActive: true,
      metadata: {
        image_url: item.url,
        image_name: item.name,
        media_origin: item.origin,
      },
    }
    const modules = doc.modules.length
      ? doc.modules.map((m, idx) => (idx === 0 ? { ...m, blocks: [...m.blocks, newBlock] } : m))
      : [{ id: `mod-${Date.now()}`, title: 'Mídias', blocks: [newBlock] }]
    onDocUpdated({ modules })
    toast({ title: 'Mídia incluída no documento', description: item.name })
  }

  const refreshTemplates = async () => {
    setTemplatesLoading(true)
    try {
      setTemplates(await listSecondBrainMediaTemplates())
    } catch {
      setTemplates([])
    } finally {
      setTemplatesLoading(false)
    }
  }

  const openTemplates = () => {
    setTemplatesOpen(true)
    setApplyingTemplate(null)
    refreshTemplates()
  }

  const confirmSaveTemplate = async () => {
    if (!pendingTemplate) return
    try {
      await createSecondBrainMediaTemplate({
        name: templateName || 'Modelo de mídia',
        settings: pendingTemplate,
      })
      toast({
        title: 'Modelo salvo!',
        description: 'Aplique-o em outra mídia pela galeria de modelos.',
      })
    } catch {
      toast({ title: 'Erro ao salvar modelo', variant: 'destructive' })
    } finally {
      setNameOpen(false)
      setPendingTemplate(null)
      setTemplateName('')
    }
  }

  const applyTemplateTo = (item: SecondBrainMediaItem) => {
    if (!applyingTemplate) return
    const settings = applySecondBrainMediaTemplate(applyingTemplate)
    applyEditToDoc(item, { ...DEFAULT_CUSTOMIZATION, ...settings })
    toast({
      title: 'Modelo aplicado!',
      description: `"${applyingTemplate.name}" aplicado a "${item.name}".`,
    })
    setTemplatesOpen(false)
    setApplyingTemplate(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="nb-accent-scope nb-theme-scope max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-950 border-slate-800 text-slate-100 w-[calc(100vw-1rem)] sm:w-full rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg min-w-0">
              <ImageIcon className="w-4 h-4 shrink-0 nb-accent-text" />
              <span className="truncate">Mídias &amp; Anexos — {doc.title || 'Documento'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Busque, alterne entre fontes (Documento, Acervo, Uploads, Biblioteca) e inclua mídias
              no documento. Toque em uma imagem para abrir a Edição Avançada.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome, arquivo, tag ou tipo…"
                  className="h-9 pl-8 bg-slate-900/60 border-slate-800 text-xs text-white placeholder:text-slate-500"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={openTemplates}
                className="h-9 shrink-0 text-[11px] font-bold gap-1.5 border-slate-700 text-slate-300 hover:text-white"
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Modelos</span>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {SOURCE_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors',
                    tab === t.key
                      ? 'nb-accent-grad text-white border-transparent'
                      : 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-600',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {sourceLoading ? (
            <div className="py-10 text-center text-xs text-slate-400">
              <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin opacity-60" />
              Carregando mídias…
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <ImageIcon className="w-8 h-8 mx-auto text-slate-600" />
              {search.trim() ? (
                <>
                  <p className="text-sm text-slate-300 font-semibold">
                    Nenhuma mídia encontrada para "{search.trim()}"
                  </p>
                  <p className="text-xs text-slate-500">
                    Tente outro termo (nome, arquivo, tag ou tipo) ou troque a fonte.
                  </p>
                </>
              ) : tab === 'documento' ? (
                <>
                  <p className="text-sm text-slate-400 font-semibold">
                    {hasAnyContent ? 'Nenhuma mídia nesta fonte' : 'Nenhuma mídia neste documento'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Importe contexto pelo Gmail ou Drive (botão Conectar), escolha o Acervo/Uploads
                    ou cole um link de imagem em um bloco para editá-la aqui.
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-400 font-semibold">
                  Nenhuma mídia disponível nesta fonte
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  className="group text-left rounded-xl overflow-hidden border border-slate-800 bg-slate-900/70 hover:border-slate-600 transition-all min-w-0 flex flex-col"
                >
                  <button
                    type="button"
                    disabled={savingId === item.id}
                    onClick={() => setEditingMedia(item)}
                    className="relative aspect-video bg-slate-900 overflow-hidden w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      style={editStyleFor(item, doc)}
                    />
                    {item.origin === 'documento' && isEdited(item, doc) && (
                      <Badge className="absolute top-1.5 right-1.5 bg-slate-900/90 text-[9px] uppercase gap-1 border border-slate-700">
                        <Sliders className="w-2.5 h-2.5" /> Editada
                      </Badge>
                    )}
                    {item.origin !== 'documento' && docUrls.has(item.url) && (
                      <Badge className="absolute top-1.5 right-1.5 bg-slate-900/90 text-[9px] uppercase border border-slate-700">
                        No documento
                      </Badge>
                    )}
                  </button>
                  <div className="p-2 space-y-1.5 min-w-0 flex-1 flex flex-col">
                    <p className="text-[11px] font-semibold truncate text-slate-100">{item.name}</p>
                    <p className="text-[9px] text-slate-500 truncate">{item.source}</p>
                    <div className="flex flex-wrap items-center gap-1 mt-auto pt-1">
                      {item.origin === 'documento' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => openHistory(item)}
                          className="h-6 px-1.5 text-[10px] font-bold gap-1 text-slate-400 hover:text-white"
                          title="Histórico de edições desta mídia"
                        >
                          <History className="w-3 h-3" /> Histórico
                        </Button>
                      ) : docUrls.has(item.url) ? (
                        <span className="text-[9px] text-slate-500">Já está no documento</span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => includeInDoc(item)}
                          className="h-6 px-1.5 text-[10px] font-bold gap-1 nb-accent-text hover:bg-white/5"
                          title="Incluir esta mídia no documento"
                        >
                          <Plus className="w-3 h-3" /> Incluir no doc
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'documento' && docFiles.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Documentos anexos
              </p>
              {docFiles.map((f) => (
                <a
                  key={f.id}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 hover:border-slate-600 transition-colors min-w-0"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="text-[11px] font-medium text-slate-200 truncate">{f.name}</span>
                  <span className="ml-auto text-[9px] text-slate-500 shrink-0">{f.source}</span>
                </a>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Histórico de edições da mídia (namespace secondbrain:) */}
      <Dialog open={!!historyItem} onOpenChange={(o) => !o && setHistoryItem(null)}>
        <DialogContent className="nb-accent-scope nb-theme-scope max-w-md bg-slate-950 border-slate-800 text-slate-100 w-[calc(100vw-1rem)] sm:w-full rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <History className="w-4 h-4 nb-accent-text" />
              Histórico — {historyItem?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Versões salvas a cada edição avançada. Restaure qualquer estado anterior.
            </DialogDescription>
          </DialogHeader>
          {historyLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <Loader2 className="w-4 h-4 mx-auto mb-2 animate-spin opacity-60" />
              Carregando versões…
            </div>
          ) : versions.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              Nenhuma versão ainda. Cada salvamento da Edição Avançada desta mídia cria uma versão
              restaurável aqui.
            </p>
          ) : (
            <div className="space-y-1.5">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-2.5 py-2"
                >
                  {v.preview_url || v.result_url ? (
                    <img
                      src={v.preview_url || v.result_url}
                      alt=""
                      className="w-9 h-9 rounded-md object-cover border border-slate-800 shrink-0"
                    />
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-100 truncate">
                      {v.user_name || 'Você'}
                      <span className="ml-1 font-normal text-slate-500">
                        {new Date(v.created).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </p>
                    {v.title && <p className="text-[10px] text-slate-500 truncate">{v.title}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => restoreVersion(v)}
                    disabled={restoringId === v.id}
                    className="h-7 px-2 text-[10px] font-bold gap-1 nb-accent-text hover:bg-white/5"
                  >
                    {restoringId === v.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <History className="w-3 h-3" />
                    )}
                    Restaurar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modelos de mídia: salvar/aplicar composições (studio_edit_presets) */}
      <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <DialogContent className="nb-accent-scope nb-theme-scope max-w-md bg-slate-950 border-slate-800 text-slate-100 w-[calc(100vw-1rem)] sm:w-full rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <LayoutTemplate className="w-4 h-4 nb-accent-text" />
              {applyingTemplate ? `Aplicar "${applyingTemplate.name}" em…` : 'Modelos de mídia'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {applyingTemplate
                ? 'Escolha a mídia do documento que receberá esta composição.'
                : 'Salve composições na Edição Avançada ("Salvar como modelo") e aplique-as em outra mídia.'}
            </DialogDescription>
          </DialogHeader>

          {applyingTemplate ? (
            <div className="space-y-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setApplyingTemplate(null)}
                className="h-7 text-[10px] text-slate-400 hover:text-white"
              >
                ← Voltar aos modelos
              </Button>
              {mediaItems.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">
                  Nenhuma mídia no documento para receber o modelo.
                </p>
              ) : (
                mediaItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => applyTemplateTo(item)}
                    className="w-full flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-2.5 py-2 hover:border-slate-600 transition-colors text-left"
                  >
                    <img
                      src={item.url}
                      alt=""
                      className="w-9 h-9 rounded-md object-cover border border-slate-800 shrink-0"
                    />
                    <span className="text-[11px] font-semibold text-slate-100 truncate">
                      {item.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : templatesLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <Loader2 className="w-4 h-4 mx-auto mb-2 animate-spin opacity-60" />
              Carregando modelos…
            </div>
          ) : templates.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              Nenhum modelo ainda. Abra a Edição Avançada de uma mídia e toque em "Salvar como
              modelo" para guardar a composição atual.
            </p>
          ) : (
            <div className="space-y-1.5">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-2.5 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-100 truncate">
                      {t.name.replace(/^secondbrain:/, '')}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(t.updated || t.created).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setApplyingTemplate(t)}
                    className="h-7 px-2 text-[10px] font-bold gap-1 nb-accent-text hover:bg-white/5"
                  >
                    <Plus className="w-3 h-3" /> Aplicar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await deleteSecondBrainMediaTemplate(t.id)
                        await refreshTemplates()
                        toast({ title: 'Modelo excluído' })
                      } catch {
                        toast({ title: 'Erro ao excluir modelo', variant: 'destructive' })
                      }
                    }}
                    className="h-7 px-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                    title="Excluir modelo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Nome do novo modelo */}
      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent className="nb-accent-scope nb-theme-scope max-w-sm bg-slate-950 border-slate-800 text-slate-100 w-[calc(100vw-1rem)] sm:w-full rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base">Salvar como modelo</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Guarde a composição atual da Edição Avançada para aplicar em outra mídia.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Nome do modelo (ex.: Capa com vinheta)"
            className="h-9 bg-slate-900/60 border-slate-800 text-xs text-white placeholder:text-slate-500"
          />
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setNameOpen(false)}
              className="h-8 text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirmSaveTemplate}
              disabled={!pendingTemplate}
              className="h-8 nb-accent-grad text-white font-bold text-xs"
            >
              Salvar modelo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SecondBrainAdvancedImageEditor
        open={!!editingMedia}
        onOpenChange={(o) => {
          if (!o) setEditingMedia(null)
        }}
        title={editingMedia?.name || 'Imagem'}
        imageUrl={editingMedia?.url || null}
        initialCustomization={editingMedia ? findEditStateFor(editingMedia.url, doc) : null}
        onSaveAsTemplate={(settings) => {
          setPendingTemplate(settings)
          setTemplateName('')
          setNameOpen(true)
        }}
        onSave={(result) => {
          if (!editingMedia) return
          saveEditedImage(editingMedia, result.customization)
        }}
      />
    </>
  )
}

export default SecondBrainMediaGrid
