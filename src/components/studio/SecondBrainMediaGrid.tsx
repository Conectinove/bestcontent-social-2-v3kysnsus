import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FileText,
  History,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Plus,
  Search,
  Sliders,
  Star,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { pb } from '@/lib/pocketbase/client'
import { getFileUrl } from '@/lib/mappers'
import {
  DEFAULT_CUSTOMIZATION,
  type AdvancedCustomizationState,
} from '@/components/workspace/AdvancedCustomizationPanel'
import {
  SecondBrainAdvancedImageEditor,
  buildBrainImageFilter,
} from './SecondBrainAdvancedImageEditor'
import { ConnectorButton } from '@/components/skip/ConnectorButton'
import {
  DEFAULT_MEDIA_FILTERS,
  applyMediaFilters,
  createSecondBrainMediaTemplate,
  deleteSecondBrainMediaTemplate,
  fetchAccountMediaSource,
  fetchCuratedMediaSource,
  listDriveMedia,
  listSecondBrainMediaTemplates,
  listSecondBrainMediaVersions,
  saveSecondBrainMediaVersion,
  searchStockProvider,
  stockAttribution,
  fetchStockStatus,
  type SecondBrainDateFilter,
  type SecondBrainMediaFilters,
  type SecondBrainMediaTemplate,
  type SecondBrainMediaVersion,
  type StockSearchResult,
} from '@/services/second-brain-media'
import {
  isSecondBrainFavorite,
  listSecondBrainFavorites,
  toggleSecondBrainFavorite,
  type SecondBrainFavorite,
} from '@/services/second-brain-favorites'

/** Item normalizado de mídia usado em toda a grade (todas as fontes). */
interface MediaItem {
  id: string
  name: string
  url: string
  kind: 'image' | 'document' | 'video'
  source: string
  origin: SecondBrainTab
  createdAt?: string
  tags?: string[]
  driveFileId?: string
  authorUrl?: string
}

type SecondBrainTab =
  | 'favorites'
  | 'document'
  | 'bank'
  | 'uploads'
  | 'library'
  | 'drive'
  | 'unsplash'
  | 'pexels'

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

const TABS: Array<{ key: SecondBrainTab; label: string }> = [
  { key: 'favorites', label: 'Favoritos' },
  { key: 'document', label: 'Documento' },
  { key: 'bank', label: 'Acervo' },
  { key: 'uploads', label: 'Uploads' },
  { key: 'library', label: 'Biblioteca' },
  { key: 'drive', label: 'Drive' },
  { key: 'unsplash', label: 'Unsplash' },
  { key: 'pexels', label: 'Pexels' },
]

const TYPE_CHIPS: Array<{ key: 'all' | MediaItem['kind']; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'image', label: 'Imagens' },
  { key: 'video', label: 'Vídeos' },
  { key: 'document', label: 'Anexos' },
]

const PERIODS: Array<{ key: SecondBrainDateFilter; label: string }> = [
  { key: '7d', label: 'Últimos 7 dias' },
  { key: '30d', label: 'Últimos 30 dias' },
  { key: '90d', label: 'Últimos 90 dias' },
  { key: 'all', label: 'Todo o período' },
]

const toServiceItem = (i: MediaItem) => ({
  id: i.id,
  name: i.name,
  url: i.url,
  type: (i.kind === 'video'
    ? 'video'
    : i.kind === 'document'
      ? 'anexo'
      : 'imagem') as import('@/services/second-brain-media').SecondBrainMediaType,
  createdAt: i.createdAt,
  tags: i.tags,
})

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

const editStyleFor = (item: MediaItem, doc: SecondBrainDocShape): React.CSSProperties => {
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

const isEdited = (item: MediaItem, doc: SecondBrainDocShape) => !!findEditStateFor(item.url, doc)

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
 * Grid de mídias do Segundo Cérebro: oito fontes (Favoritos, Documento,
 * Acervo, Uploads, Biblioteca, Drive, Unsplash, Pexels), busca + filtros de
 * tipo/período, favoritos (second_brain_favorites), inclusão no doc, histórico
 * de versões (studio_edit_versions, namespace secondbrain:) e modelos de
 * composição (studio_edit_presets, namespace "secondbrain:" com is_shared).
 */
export const SecondBrainMediaGrid: React.FC<SecondBrainMediaGridProps> = ({
  open,
  onOpenChange,
  doc,
  onDocUpdated,
}) => {
  const { toast } = useToast()
  const [filters, setFilters] = useState<SecondBrainMediaFilters>(DEFAULT_MEDIA_FILTERS)
  const [tab, setTab] = useState<SecondBrainTab>('document')
  const [bankItems, setBankItems] = useState<MediaItem[]>([])
  const [bankLoading, setBankLoading] = useState(false)
  const [uploadsItems, setUploadsItems] = useState<MediaItem[]>([])
  const [uploadsLoading, setUploadsLoading] = useState(false)
  const [driveItems, setDriveItems] = useState<MediaItem[]>([])
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveError, setDriveError] = useState<string | null>(null)
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null)
  const [stock, setStock] = useState<{
    unsplash: { configured: boolean | null; message: string | null; results: StockSearchResult[] }
    pexels: { configured: boolean | null; message: string | null; results: StockSearchResult[] }
  }>({
    unsplash: { configured: null, message: null, results: [] },
    pexels: { configured: null, message: null, results: [] },
  })
  const [stockQuery, setStockQuery] = useState<{ unsplash: string; pexels: string }>({
    unsplash: '',
    pexels: '',
  })
  const [stockLoading, setStockLoading] = useState<{ unsplash: boolean; pexels: boolean }>({
    unsplash: false,
    pexels: false,
  })
  const [favorites, setFavorites] = useState<SecondBrainFavorite[]>([])
  const [favBusyId, setFavBusyId] = useState<string | null>(null)
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [historyItem, setHistoryItem] = useState<MediaItem | null>(null)
  const [versions, setVersions] = useState<SecondBrainMediaVersion[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [templates, setTemplates] = useState<SecondBrainMediaTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [applyingTemplate, setApplyingTemplate] = useState<SecondBrainMediaTemplate | null>(null)
  const [nameOpen, setNameOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateShared, setTemplateShared] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<AdvancedCustomizationState | null>(null)

  /* ------------------------- Fontes do documento ------------------------ */
  const mediaItems: MediaItem[] = useMemo(() => {
    const items: MediaItem[] = []
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
              kind:
                /\.(png|jpe?g|gif|webp|avif)$/i.test(c.url) || b.type === 'image'
                  ? 'image'
                  : 'document',
              source: c.source || 'Anexo do item',
              origin: 'document',
              createdAt: (b.metadata as any)?.edited_at,
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

  /* ----------------------------- Carregadores --------------------------- */
  const refreshFavorites = useCallback(async () => {
    try {
      setFavorites(await listSecondBrainFavorites())
    } catch {
      setFavorites([])
    }
  }, [])

  useEffect(() => {
    if (open) refreshFavorites()
  }, [open, refreshFavorites])

  // Acervo da conta (image_bank_assets)
  useEffect(() => {
    if (!open || tab !== 'bank' || bankItems.length || bankLoading) return
    let alive = true
    setBankLoading(true)
    fetchAccountMediaSource({ perPage: 60 })
      .then((page) => {
        if (!alive) return
        setBankItems(
          page.items.map((i) => ({
            id: i.id,
            name: i.name,
            url: i.url,
            kind: 'image' as const,
            source: 'Acervo da conta',
            origin: 'bank' as const,
            createdAt: i.createdAt,
            tags: i.tags,
          })),
        )
      })
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
          .map((r: any): MediaItem | null => {
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
              createdAt: r.created,
            }
          })
          .filter((i): i is MediaItem => Boolean(i))
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

  // Google Drive (conectores, conta de cada usuário)
  useEffect(() => {
    if (!open || tab !== 'drive') return
    let alive = true
    setDriveLoading(true)
    listDriveMedia(filters.query)
      .then((res) => {
        if (!alive) return
        setDriveItems(
          res.items.map((i) => ({
            id: i.id,
            name: i.name,
            url: i.url,
            kind: i.type === 'video' ? ('video' as const) : ('image' as const),
            source: 'Google Drive',
            origin: 'drive' as const,
            createdAt: i.createdAt,
            driveFileId: (i.meta as any)?.driveFileId,
          })),
        )
        setDriveError(res.error)
        setDriveConnected(!res.error || res.items.length > 0)
      })
      .catch(() => {
        if (!alive) return
        setDriveItems([])
        setDriveError('Falha ao listar o Google Drive.')
      })
      .finally(() => alive && setDriveLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab])

  // Status das chaves de stock (honesto: sem chave mostra orientação, não dados)
  useEffect(() => {
    if (!open) return
    let alive = true
    fetchStockStatus()
      .then((s) => {
        if (!alive) return
        setStock((prev) => ({
          unsplash: { ...prev.unsplash, configured: s.unsplash },
          pexels: { ...prev.pexels, configured: s.pexels },
        }))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [open])

  const runStockSearch = useCallback(async (provider: 'unsplash' | 'pexels', q: string) => {
    if (!q.trim()) {
      setStock((prev) => ({
        ...prev,
        [provider]: { configured: true, message: null, results: [] },
      }))
      return
    }
    setStockLoading((prev) => ({ ...prev, [provider]: true }))
    try {
      const state = await searchStockProvider(provider, q)
      setStock((prev) => ({
        ...prev,
        [provider]: {
          configured: state.configured,
          message: state.message,
          results: state.results,
        },
      }))
    } finally {
      setStockLoading((prev) => ({ ...prev, [provider]: false }))
    }
  }, [])

  // Recarrega o stock quando a busca muda (debounce leve por tecla é evitado:
  // busca dispara no submit/Enter ou ao apertar o botão, não a cada tecla).
  const submitStockSearch = (provider: 'unsplash' | 'pexels') => {
    void runStockSearch(provider, stockQuery[provider])
  }

  /* ------------------------- Itens da fonte ativa ----------------------- */
  const stockToItems = (provider: 'unsplash' | 'pexels'): MediaItem[] =>
    stock[provider].results.map((r) => ({
      id: `${provider}_${r.id}`,
      name: r.title || `Foto ${r.id}`,
      url: r.url,
      kind: 'image' as const,
      source: provider === 'unsplash' ? 'Unsplash' : 'Pexels',
      origin: provider,
      authorUrl: r.author_url,
      tags: [provider],
    }))

  const favoritesItems: MediaItem[] = useMemo(
    () =>
      favorites.map((f) => ({
        id: `fav_${f.id}`,
        name: f.name || 'Mídia favorita',
        url: f.url,
        kind: /\.(png|jpe?g|gif|webp|avif)$/i.test(f.url) ? 'image' : 'document',
        source: `Favorito · ${f.source}`,
        origin: 'favorites' as const,
        createdAt: f.created,
        tags: ['favorito', f.source],
        driveFileId: (f.meta as any)?.driveFileId,
      })),
    [favorites],
  )

  const curatedItems = useMemo(
    () => (tab === 'library' ? fetchCuratedMediaSource(filters.query) : []),
    [tab, filters.query],
  )

  const sourceItems: MediaItem[] =
    tab === 'favorites'
      ? favoritesItems
      : tab === 'document'
        ? mediaItems
        : tab === 'bank'
          ? bankItems
          : tab === 'uploads'
            ? uploadsItems
            : tab === 'drive'
              ? driveItems
              : tab === 'unsplash'
                ? stockToItems('unsplash')
                : tab === 'pexels'
                  ? stockToItems('pexels')
                  : curatedItems

  const sourceLoading =
    tab === 'bank'
      ? bankLoading
      : tab === 'uploads'
        ? uploadsLoading
        : tab === 'drive'
          ? driveLoading
          : tab === 'unsplash'
            ? stockLoading.unsplash
            : tab === 'pexels'
              ? stockLoading.pexels
              : false

  const visibleItems = useMemo(
    () =>
      applyMediaFilters(sourceItems.map(toServiceItem), filters).map((i) => {
        const original = sourceItems.find((s) => s.id === i.id)
        return { ...(original as MediaItem), ...i }
      }),
    [sourceItems, filters],
  )

  const hasAnyContent =
    mediaItems.length > 0 ||
    docFiles.length > 0 ||
    bankItems.length > 0 ||
    uploadsItems.length > 0 ||
    favorites.length > 0

  /* ------------------------------- Ações -------------------------------- */
  /** Persiste um estado de edição avançada no bloco dono da URL. */
  const applyEditToDoc = (item: MediaItem, edit: Partial<AdvancedCustomizationState>) => {
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

  const saveEditedImage = async (item: MediaItem, state: AdvancedCustomizationState) => {
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

  const openHistory = async (item: MediaItem) => {
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
  const includeInDoc = (item: MediaItem) => {
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

  const toggleFavorite = async (item: MediaItem) => {
    setFavBusyId(item.id)
    try {
      const favSource = item.origin === 'favorites' ? undefined : item.origin
      const res = await toggleSecondBrainFavorite({
        source: favSource as any,
        mediaId: item.driveFileId || item.id,
        name: item.name,
        url: item.url,
        meta: { origin: item.origin, driveFileId: item.driveFileId },
      })
      await refreshFavorites()
      toast({
        title: res.favorited ? 'Adicionado aos favoritos' : 'Removido dos favoritos',
        description: item.name,
      })
    } catch {
      toast({ title: 'Não foi possível favoritar', variant: 'destructive' })
    } finally {
      setFavBusyId(null)
    }
  }

  const isFav = (item: MediaItem) =>
    isSecondBrainFavorite(
      favorites,
      (item.origin === 'favorites' ? 'document' : item.origin) as any,
      item.driveFileId || item.id,
    )

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
        isShared: templateShared,
      })
      toast({
        title: 'Modelo salvo!',
        description: templateShared
          ? 'Compartilhado com a equipe — aplique-o em outra mídia pela galeria.'
          : 'Aplique-o em outra mídia pela galeria de modelos.',
      })
    } catch {
      toast({ title: 'Erro ao salvar modelo', variant: 'destructive' })
    } finally {
      setNameOpen(false)
      setPendingTemplate(null)
      setTemplateName('')
      setTemplateShared(false)
    }
  }

  const applyTemplateTo = (item: MediaItem) => {
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

  /* ------------------------------- Render ------------------------------- */
  const sourceLabel = TABS.find((t) => t.key === tab)?.label || 'Mídias'

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
              Busque nas oito fontes, filtre por tipo e período, favorite para acesso rápido e
              inclua mídias no documento. Toque em uma imagem para abrir a Edição Avançada.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <Input
                  value={filters.query}
                  onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
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

            {/* Barra de filtros: tipo (chips) + período */}
            <div className="flex flex-wrap items-center gap-1.5">
              {TYPE_CHIPS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, type: c.key }))}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors',
                    filters.type === c.key
                      ? 'nb-accent-grad text-white border-transparent'
                      : 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-600',
                  )}
                >
                  {c.label}
                </button>
              ))}
              <select
                value={filters.period}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, period: e.target.value as SecondBrainDateFilter }))
                }
                className="ml-auto h-6 rounded-full border border-slate-800 bg-slate-900/60 px-2 text-[10px] font-bold text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Filtrar por período"
              >
                {PERIODS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Abas de fonte */}
            <div className="flex flex-wrap items-center gap-1.5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors',
                    tab === t.key
                      ? 'nb-accent-grad text-white border-transparent'
                      : 'border-sse-800 text-slate-400 hover:text-white hover:border-slate-600',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drive não conectado: botão de conexão (conta de cada usuário) */}
          {tab === 'drive' && driveError && driveItems.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2">
              <p className="text-xs text-slate-300 font-semibold">
                Conecte sua conta do Google Drive
              </p>
              <p className="text-[11px] text-slate-500">
                A conexão é feita na SUA conta — os arquivos listados aqui são do seu Drive, não da
                equipe. Nada é compartilhado com outros usuários.
              </p>
              <ConnectorButton toolkit="googledrive" name="Google Drive" />
            </div>
          )}
          {tab === 'drive' && !driveError && driveItems.length === 0 && !driveLoading && (
            <p className="py-6 text-center text-xs text-slate-500">
              Nenhum arquivo de mídia encontrado no Drive (listamos imagens e vídeos).
            </p>
          )}

          {/* Unsplash / Pexels: busca própria + atribuição + estado honesto */}
          {(tab === 'unsplash' || tab === 'pexels') && (
            <div className="space-y-2">
              {stock[tab].configured === false ? (
                <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-3 space-y-1">
                  <p className="text-xs font-semibold text-amber-300">
                    Configure a chave da API no painel Skip Cloud
                  </p>
                  <p className="text-[11px] text-amber-200/70">
                    {tab === 'unsplash'
                      ? 'Adicione UNSPLASH_ACCESS_KEY'
                      : 'Adicione PEXELS_API_KEY'}{' '}
                    (env vars do backend) para habilitar a busca de fotos. Enquanto isso, esta aba
                    fica vazia — não simulamos resultados.
                  </p>
                </div>
              ) : (
                <>
                  <form
                    className="flex items-center gap-1.5"
                    onSubmit={(e) => {
                      e.preventDefault()
                      submitStockSearch(tab)
                    }}
                  >
                    <Input
                      value={stockQuery[tab]}
                      onChange={(e) => setStockQuery((q) => ({ ...q, [tab]: e.target.value }))}
                      placeholder={tab === 'unsplash' ? 'Buscar no Unsplash…' : 'Buscar no Pexels…'}
                      className="h-8 bg-slate-900/60 border-slate-800 text-xs text-white placeholder:text-slate-500"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8 nb-accent-grad text-xs font-bold"
                    >
                      Buscar
                    </Button>
                    {stock[tab].message && (
                      <span className="text-[10px] text-amber-400 truncate max-w-[140px]">
                        {stock[tab].message}
                      </span>
                    )}
                  </form>
                  {stock[tab].results.length > 0 && (
                    <p className="text-[9px] text-slate-500">
                      {tab === 'unsplash' ? 'Fotos do Unsplash' : 'Fotos do Pexels'} — créditos aos
                      fotógrafos: veja a atribuição em cada foto.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {sourceLoading ? (
            <div className="py-10 text-center text-xs text-slate-400">
              <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin opacity-60" />
              Carregando mídias…
            </div>
          ) : visibleItems.length === 0 &&
            tab !== 'drive' &&
            tab !== 'unsplash' &&
            tab !== 'pexels' ? (
            <div className="py-10 text-center space-y-2">
              <ImageIcon className="w-8 h-8 mx-auto text-slate-600" />
              {filters.query.trim() ? (
                <>
                  <p className="text-sm text-slate-300 font-semibold">
                    Nenhuma mídia encontrada para "{filters.query.trim()}"
                  </p>
                  <p className="text-xs text-slate-500">
                    Tente outro termo (nome, arquivo, tag ou tipo) ou troque a fonte.
                  </p>
                </>
              ) : tab === 'favorites' ? (
                <>
                  <p className="text-sm text-slate-400 font-semibold">Nenhum favorito ainda</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Toque na estrela de qualquer mídia (Documento, Acervo, Drive, Unsplash…) para
                    vê-la aqui com acesso rápido.
                  </p>
                </>
              ) : tab === 'document' ? (
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
          ) : visibleItems.length > 0 ? (
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
                    {item.origin === 'document' && isEdited(item, doc) && (
                      <Badge className="absolute top-1.5 right-1.5 bg-slate-900/90 text-[9px] uppercase gap-1 border border-slate-700">
                        <Sliders className="w-2.5 h-2.5" /> Editada
                      </Badge>
                    )}
                    {item.origin !== 'document' && docUrls.has(item.url) && (
                      <Badge className="absolute top-1.5 right-1.5 bg-slate-900/90 text-[9px] uppercase border border-slate-700">
                        No documento
                      </Badge>
                    )}
                    {/* Estrela de favorito */}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        void toggleFavorite(item)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation()
                          void toggleFavorite(item)
                        }
                      }}
                      className={cn(
                        'absolute bottom-1.5 left-1.5 z-10 rounded-full p-1.5 transition-colors cursor-pointer',
                        isFav(item)
                          ? 'bg-amber-500/90 text-white'
                          : 'bg-slate-950/70 text-slate-400 hover:text-amber-300',
                      )}
                      title={isFav(item) ? 'Remover dos favoritos' : 'Favoritar mídia'}
                      aria-label={isFav(item) ? 'Remover dos favoritos' : 'Favoritar mídia'}
                    >
                      <Star className={cn('w-3 h-3', isFav(item) && 'fill-current')} />
                    </span>
                  </button>
                  <div className="p-2 space-y-1.5 min-w-0 flex-1 flex flex-col">
                    <p className="text-[11px] font-semibold truncate text-slate-100">{item.name}</p>
                    <p className="text-[9px] text-slate-500 truncate">
                      {item.source}
                      {(item.origin === 'unsplash' || item.origin === 'pexels') &&
                        (() => {
                          const raw = stock[item.origin].results.find(
                            (r) => `${item.origin}_${r.id}` === item.id,
                          )
                          return raw ? ` · ${stockAttribution(raw)}` : ''
                        })()}
                    </p>
                    <div className="flex flex-wrap items-center gap-1 mt-auto pt-1">
                      {item.origin === 'document' ? (
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
          ) : null}

          {tab === 'document' && docFiles.length > 0 && (
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
                  className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 hover:border-slate-600 transition-colors min-w0"
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
                : 'Salve composições na Edição Avançada ("Salvar como modelo") e aplique-as em outra mídia. Modelos compartilhados mostram o badge Equipe.'}
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
                    <p className="text-[11px] font-bold text-slate-100 truncate flex items-center gap-1.5">
                      {t.name.replace(/^secondbrain:/, '')}
                      {t.is_shared && (
                        <Badge className="bg-sky-500/20 text-sky-300 border-sky-700/50 text-[8px] uppercase font-bold shrink-0">
                          Equipe
                        </Badge>
                      )}
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

      {/* Nome do novo modelo (+ compartilhar com a equipe) */}
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
          <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 cursor-pointer">
            <Checkbox
              checked={templateShared}
              onCheckedChange={(v) => setTemplateShared(v === true)}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-slate-100">Compartilhar com a equipe</p>
              <p className="text-[10px] text-slate-500">
                Membros da mesma organização verão este modelo com o badge "Equipe".
              </p>
            </div>
          </label>
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
          setTemplateShared(false)
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
