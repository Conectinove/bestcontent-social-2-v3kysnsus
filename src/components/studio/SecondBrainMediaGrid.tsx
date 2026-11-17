import { useEffect, useMemo, useState } from 'react'
import { Check, RefreshCw, Search, Star, Filter, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  listSecondBrainFavorites,
  toggleSecondBrainFavorite,
  type SecondBrainFavorite,
  type SecondBrainFavoriteSource,
} from '@/services/second-brain-favorites'
import {
  fetchAccountMediaSource,
  fetchCuratedMediaSource,
  searchStockProvider,
  fetchStockStatus,
  listSecondBrainMediaTemplates,
  createSecondBrainMediaTemplate,
  deleteSecondBrainMediaTemplate,
  type SecondBrainMediaItem,
  type StockSearchResult,
  type SecondBrainMediaSort,
  type SecondBrainOrientationFilter,
  type SecondBrainColorFilter,
  MEDIA_SORT_OPTIONS,
  ORIENTATION_OPTIONS,
  COLOR_OPTIONS,
  sortMediaItems,
} from '@/services/second-brain-media'
import { Input } from '@/components/ui/input'
import { analyzeImagesInto, dominantColorOf, orientationOf } from '@/lib/image-analysis'
import {
  safeExternalUrl,
  isAudioUrl,
  isVideoUrl,
  isPdfUrl,
  youtubeIdFromUrl,
  vimeoIdFromUrl,
  tiktokIdFromUrl,
  spotifyEmbedPathFromUrl,
} from '@/lib/markdown-lite'
import type { SecondBrainDoc, SecondBrainModule, SecondBrainBlock } from '@/services/second-brain'
import { cn } from '@/lib/utils'
import { MediaGridAdvancedControls } from '@/components/studio/MediaGridAdvancedControls'

/* ================================ TIPOS ================================ */

export type MediaTab =
  | 'favoritos'
  | 'documento'
  | 'acervo'
  | 'uploads'
  | 'biblioteca'
  | 'url'
  | 'drive'
  | 'unsplash'
  | 'pexels'

const TABS: { key: MediaTab; label: string }[] = [
  { key: 'favoritos', label: 'Favoritos' },
  { key: 'documento', label: 'Documento' },
  { key: 'acervo', label: 'Acervo' },
  { key: 'uploads', label: 'Uploads' },
  { key: 'biblioteca', label: 'Biblioteca' },
  { key: 'url', label: 'URL externa' },
  { key: 'drive', label: 'Drive' },
  { key: 'unsplash', label: 'Unsplash' },
  { key: 'pexels', label: 'Pexels' },
]

type TypeFilter = 'all' | 'imagem' | 'video' | 'anexo' | 'link'
type DateFilter = 'all' | 'today' | '7d' | '30d' | 'custom'

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'imagem', label: 'Imagens' },
  { key: 'video', label: 'Vídeos' },
  { key: 'anexo', label: 'Anexos' },
  { key: 'link', label: 'Links' },
]

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'all', label: 'Tudo' },
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'custom', label: 'Custom' },
]

/** Abas de mídia LOCAL que recebem a busca avançada (orientação/cor/ordenação). */
const LOCAL_ADVANCED_TABS: Set<MediaTab> = new Set([
  'documento',
  'acervo',
  'uploads',
  'biblioteca',
  'favoritos',
])

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Documento ativo: "Incluir no doc" anexa o bloco a doc.modules e chama onDocUpdated. */
  doc: SecondBrainDoc
  onDocUpdated: (updated: { modules: SecondBrainModule[] }) => void | Promise<void>
}

/** Formato usado pelo grid inteiro — deriva de SecondBrainMediaItem. */
interface GridItem {
  id: string
  name: string
  url: string
  thumbUrl: string
  type: 'imagem' | 'video' | 'anexo' | 'link'
  source: MediaTab
  createdAt: string
  author?: string
  width?: number
  height?: number
  tags?: string[]
}

const toGridItem = (m: SecondBrainMediaItem, source: MediaTab): GridItem => ({
  id: `${source}:${m.id}`,
  name: m.name || 'Sem título',
  url: m.url,
  thumbUrl: m.thumbUrl || m.url,
  type: (['imagem', 'video', 'anexo', 'link'].includes(m.type)
    ? m.type
    : 'anexo') as GridItem['type'],
  source,
  createdAt: m.createdAt || '',
  author: m.meta?.author as string | undefined,
  width: m.meta?.width as number | undefined,
  height: m.meta?.height as number | undefined,
  tags: Array.isArray(m.tags) ? m.tags : [],
})

const stockToItem = (r: StockSearchResult, source: 'unsplash' | 'pexels'): GridItem => ({
  id: `${source}:${r.id}`,
  name: r.title || 'Sem título',
  url: r.url,
  thumbUrl: r.thumb_url || r.url,
  type: 'imagem',
  source,
  createdAt: '',
  author: r.author,
  width: r.width,
  height: r.height,
  tags: [],
})

/* ========================= FILTROS DE PERÍODO ========================= */

const isWithinDate = (createdAt: string, f: DateFilter, from?: string, to?: string): boolean => {
  if (f === 'all') return true
  if (!createdAt) return false
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return false
  if (f === 'custom') {
    const t = d.getTime()
    if (from) {
      const f1 = new Date(`${from}T00:00:00`).getTime()
      if (Number.isNaN(f1) || t < f1) return false
    }
    if (to) {
      const t1 = new Date(`${to}T23:59:59`).getTime()
      if (Number.isNaN(t1) || t > t1) return false
    }
    return true
  }
  const now = new Date()
  if (f === 'today') return d.toDateString() === now.toDateString()
  const days = f === '7d' ? 7 : 30
  return now.getTime() - d.getTime() <= days * 86400000
}

/* ============ URL EXTERNA: vídeo, áudio, TikTok, Spotify e PDF ============ */

type UrlKind = 'auto' | 'video' | 'audio' | 'link'

const detectUrlKind = (url: string): UrlKind => {
  if (isAudioUrl(url)) return 'audio'
  if (
    isVideoUrl(url) ||
    youtubeIdFromUrl(url) ||
    vimeoIdFromUrl(url) ||
    tiktokIdFromUrl(url) ||
    spotifyEmbedPathFromUrl(url)
  ) {
    return 'video'
  }
  if (isPdfUrl(url)) return 'pdf' as UrlKind
  return 'link'
}

const URL_KIND_OPTIONS: { key: UrlKind; label: string }[] = [
  { key: 'auto', label: 'Detectar' },
  { key: 'video', label: 'Vídeo' },
  { key: 'audio', label: 'Áudio' },
  { key: 'link', label: 'Link' },
]

/* ============================== COMPONENTE ============================= */

export function SecondBrainMediaGrid({ open, onOpenChange, doc, onDocUpdated }: Props) {
  const [tab, setTab] = useState<MediaTab>('favoritos')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [search, setSearch] = useState('')
  // Chips de tags: seleção MÚLTIPLA com modo E (todas) / OU (qualquer) — v0.0.300.
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagMode, setTagMode] = useState<'and' | 'or'>('and')
  const resetFilters = () => {
    setSelectedTags([])
  }

  // Busca avançada: orientação, cor e ordenação (stock + abas locais)
  const [orientation, setOrientation] = useState<SecondBrainOrientationFilter>('any')
  const [color, setColor] = useState<SecondBrainColorFilter>('any')
  const [sortBy, setSortBy] = useState<SecondBrainMediaSort>('recent')
  const [stock, setStock] = useState<
    Record<
      string,
      {
        loading: boolean
        configured: boolean | null
        message: string | null
        results: StockSearchResult[]
      }
    >
  >({})
  const [stockStatus, setStockStatus] = useState({ unsplash: false, pexels: false })

  const [favorites, setFavorites] = useState<SecondBrainFavorite[]>([])
  const [favIds, setFavIds] = useState<Set<string>>(new Set())
  const [documentItems, setDocumentItems] = useState<GridItem[]>([])
  const [acervoItems, setAcervoItems] = useState<GridItem[]>([])
  const [uploads, setUploads] = useState<GridItem[]>([])
  const [templates, setTemplates] = useState<
    Awaited<ReturnType<typeof listSecondBrainMediaTemplates>>
  >([])
  const [newTemplateName, setNewTemplateName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* Aba "URL externa": vídeo (mp4/webm/YouTube/Vimeo/TikTok), áudio (mp3/wav/ogg),
   * Spotify (embed) e PDF (prévia via <object> no markdown-lite). */
  const [urlName, setUrlName] = useState('')
  const [urlValue, setUrlValue] = useState('')
  const [urlKind, setUrlKind] = useState<UrlKind>('auto')
  const [urlDocs, setUrlDocs] = useState<GridItem[]>([])

  const handleAddUrl = () => {
    const value = urlValue.trim()
    const safe = safeExternalUrl(value)
    if (!safe) {
      setError('Informe uma URL válida começando com http:// ou https://.')
      return
    }
    const detected = detectUrlKind(safe)
    const isTikTok = Boolean(tiktokIdFromUrl(safe))
    const isSpotify = Boolean(spotifyEmbedPathFromUrl(safe))
    const isPdf = isPdfUrl(safe)
    // Tipo do item na grade: TikTok/Spotify entram como vídeo (têm player embed);
    // PDF entra como anexo (prévia de documento); resto mantém o comportamento atual.
    let kind: GridItem['type']
    if (urlKind === 'auto') {
      if (detected === 'audio') kind = 'anexo'
      else if (isPdf) kind = 'anexo'
      else if (detected === 'video') kind = 'video'
      else kind = 'link'
    } else if (urlKind === 'audio') {
      if (detected !== 'audio') {
        setError('Essa URL não parece ser um arquivo de áudio (mp3, wav, ogg).')
        return
      }
      kind = 'anexo'
    } else {
      kind = urlKind
    }
    const name = urlName.trim() || safe.replace(/^https?:\/\//, '').slice(0, 60) || 'Mídia externa'
    // Tags derivadas do formato detectado (tiktok/spotify/pdf) além do tipo geral.
    const formatTag = isTikTok ? 'tiktok' : isSpotify ? 'spotify' : isPdf ? 'pdf' : ''
    const kindTag = detected === 'audio' ? 'áudio' : detected === 'video' ? 'vídeo' : 'link'
    const item: GridItem = {
      id: `url:${safe}`,
      name,
      url: safe,
      thumbUrl: '',
      type: kind,
      source: 'url',
      createdAt: new Date().toISOString(),
      tags: formatTag ? ['externa', kindTag, formatTag] : ['externa', kindTag],
    }
    setUrlDocs((prev) => [item, ...prev.filter((i) => i.id !== item.id)])
    setUrlValue('')
    setUrlName('')
    setError(null)
  }

  /* Carrega o conteúdo da aba ativa (best-effort, nunca bloqueia a UI). */
  const loadTab = async (t: MediaTab) => {
    if (t === 'favoritos') {
      setLoading(true)
      try {
        const favs = await listSecondBrainFavorites()
        setFavorites(favs)
        const ids: Set<string> = new Set()
        for (const f of favs) {
          ids.add(`${f.source}:${f.media_id}`)
          if (f.meta?.thumb_url || f.meta?.url) {
            setDocumentItems((prev) => {
              if (prev.some((i) => i.id === `${f.source}:${f.media_id}`)) return prev
              return [
                ...prev,
                {
                  id: `${f.source}:${f.media_id}`,
                  name: String(f.meta?.title || f.meta?.name || f.name || 'Favorito'),
                  url: String(f.meta?.url || f.url || ''),
                  thumbUrl: String(f.meta?.thumb_url || f.meta?.url || f.url || ''),
                  type: String(f.meta?.type || 'imagem') as GridItem['type'],
                  source: (f.source as MediaTab) || 'acervo',
                  createdAt: f.created || '',
                  tags: [],
                },
              ]
            })
          }
        }
        setFavIds(ids)
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Falha ao carregar favoritos.')
      } finally {
        setLoading(false)
      }
    } else if (t === 'acervo') {
      setLoading(true)
      try {
        const { items, error: err } = await fetchAccountMediaSource()
        setAcervoItems(items.map((i) => toGridItem(i, 'acervo')))
        setError(err)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Falha ao carregar o acervo.')
      } finally {
        setLoading(false)
      }
    } else if (t === 'drive') {
      setLoading(true)
      setError(null)
      try {
        const { listDriveMedia } = await import('@/services/second-brain-media')
        const res = await listDriveMedia(search)
        if (res.items.length > 0) {
          setDocumentItems((prev) => [
            ...res.items.map((i) => toGridItem(i, 'drive')),
            ...prev.filter((p) => p.source !== 'drive'),
          ])
          setError(null)
        } else {
          setError(
            res.error || 'Conecte sua conta do Google Drive (aba Conectores) para ver os arquivos.',
          )
        }
      } catch {
        setError('Conecte sua conta do Google Drive (aba Conectores) para ver os arquivos.')
      } finally {
        setLoading(false)
      }
    } else if (t === 'unsplash' || t === 'pexels') {
      setStock((prev) => ({
        ...prev,
        [t]: { loading: true, configured: null, message: null, results: prev[t]?.results || [] },
      }))
      try {
        const state = await searchStockProvider(t, search, { orientation, color })
        setStock((prev) => ({ ...prev, [t]: state }))
        if (state.message) setError(null)
      } catch (e) {
        setStock((prev) => ({
          ...prev,
          [t]: {
            loading: false,
            configured: true,
            message: e instanceof Error ? e.message : 'Falha na busca.',
            results: [],
          },
        }))
      }
    }
  }

  /* Busca na aba de estoque dispara recarga quando muda termo/filtros. */
  useEffect(() => {
    if (open && (tab === 'unsplash' || tab === 'pexels')) {
      const id = setTimeout(() => {
        loadTab(tab)
      }, 350)
      return () => clearTimeout(id)
    }
  }, [tab, search, orientation, color, open, stockStatus.unsplash, stockStatus.pexels])

  useEffect(() => {
    if (open && tab !== 'unsplash' && tab !== 'pexels') loadTab(tab)
  }, [tab, open])

  useEffect(() => {
    if (!open) return
    fetchStockStatus().then(setStockStatus)
    listSecondBrainMediaTemplates().then((ts) => setTemplates(ts))
  }, [open])

  const handleToggleFavorite = async (item: GridItem) => {
    const bareId = item.id.split(':').slice(1).join(':')
    const favKey = `${item.source}:${bareId}`
    const isFav = favIds.has(favKey)
    // Mapeia a aba do grid para o source do serviço de favoritos.
    const favSource = (
      item.source === 'documento'
        ? 'document'
        : item.source === 'acervo'
          ? 'bank'
          : item.source === 'biblioteca'
            ? 'library'
            : item.source
    ) as SecondBrainFavoriteSource
    try {
      const res = await toggleSecondBrainFavorite({
        source: favSource,
        mediaId: bareId,
        name: item.name,
        url: item.url,
        meta: { title: item.name, url: item.url, thumb_url: item.thumbUrl, type: item.type },
      })
      if (res.favorited) {
        setFavIds((prev) => new Set(prev).add(favKey))
        setFavorites((prev) => [
          {
            id: `${favSource}:${bareId}`,
            source: favSource,
            media_id: bareId,
            name: item.name,
            url: item.url,
            meta: { title: item.name, url: item.url, thumb_url: item.thumbUrl, type: item.type },
            created: new Date().toISOString(),
          },
          ...prev,
        ])
      } else {
        setFavIds((prev) => {
          const n = new Set(prev)
          n.delete(favKey)
          return n
        })
        setFavorites((prev) =>
          prev.filter((f) => !(f.media_id === bareId && f.source === favSource)),
        )
      }
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao favoritar.')
    }
  }

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) return
    try {
      const t = await createSecondBrainMediaTemplate({
        name: newTemplateName.trim(),
        settings: {} as Parameters<typeof createSecondBrainMediaTemplate>[0]['settings'],
        isShared: false,
      })
      setTemplates((prev) => [t, ...prev])
      setNewTemplateName('')
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar modelo.')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteSecondBrainMediaTemplate(id)
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao remover modelo.')
    }
  }

  /* "Incluir no doc": anexa um bloco ao módulo final e persiste via onDocUpdated.
   * TikTok, Spotify e PDF usam o snippet ![alt](url) — o markdown-lite renderiza
   * o player de embed ou a prévia de PDF a partir da própria URL. */
  const handleInsert = async (item: GridItem) => {
    let content: string
    if (item.type === 'video') {
      content = `![${item.name}](${item.url})`
    } else if (item.type === 'anexo' && (isAudioUrl(item.url) || isPdfUrl(item.url))) {
      content = `![${item.name}](${item.url})`
    } else if (item.type === 'imagem') {
      content = `![${item.name}](${item.url})`
    } else if (item.type === 'link') {
      content = `[${item.name}](${item.url})`
    } else {
      content = item.name
    }
    const block: SecondBrainBlock = {
      id: `blk-${Date.now()}`,
      type: 'paragraph',
      content,
      caption:
        item.source === 'unsplash' || item.source === 'pexels'
          ? `Fonte: ${item.source}`
          : undefined,
      isActive: true,
      metadata: { grid_source: item.source, media_url: item.url, media_thumb: item.thumbUrl },
    }
    const modules = (
      doc.modules && doc.modules.length > 0
        ? [...doc.modules]
        : [{ id: `mod-${Date.now()}`, title: 'Mídias', blocks: [] as SecondBrainBlock[] }]
    ) as SecondBrainModule[]
    const last = modules[modules.length - 1]
    modules[modules.length - 1] = {
      ...last,
      blocks: [...(last.blocks || []), block],
    }
    await onDocUpdated({ modules })
    onOpenChange(false)
  }

  /* ------------------------- DERIVAÇÃO DA LISTA ------------------------- */

  const rawItems: GridItem[] = useMemo(() => {
    switch (tab) {
      case 'favoritos':
        return favorites.map((f) => ({
          id: `${f.source}:${f.media_id}`,
          name: String(f.meta?.title || f.meta?.name || f.name || 'Favorito'),
          url: String(f.meta?.url || f.url || ''),
          thumbUrl: String(f.meta?.thumb_url || f.meta?.url || f.url || ''),
          type: String(f.meta?.type || 'imagem') as GridItem['type'],
          source: (f.source as MediaTab) || 'acervo',
          createdAt: f.created || '',
          tags: [],
        }))
      case 'documento':
        return documentItems
      case 'acervo':
        return acervoItems
      case 'uploads':
        return uploads
      case 'url':
        return urlDocs
      case 'biblioteca':
        return fetchCuratedMediaSource(search).map((i) => toGridItem(i, 'biblioteca'))
      case 'drive':
        return documentItems.filter((i) => i.source === 'drive')
      case 'unsplash':
      case 'pexels':
        return (stock[tab]?.results || []).map((r) => stockToItem(r, tab))
      default:
        return []
    }
  }, [
    tab,
    favorites,
    documentItems,
    acervoItems,
    uploads,
    urlDocs,
    search,
    stock,
    orientation,
    color,
  ])

  /* Análise local de imagem (orientação via dimensões + cor dominante via canvas)
   * só nas abas locais, só para itens de imagem ainda não analisados. */
  const needsAnalysis = useMemo(
    () =>
      LOCAL_ADVANCED_TABS.has(tab) &&
      (orientation !== 'any' || color !== 'any') &&
      rawItems.some((i) => i.type === 'imagem'),
    [tab, orientation, color, rawItems],
  )

  const [analyzed, setAnalyzed] = useState<Record<string, { w: number; h: number; dom: string }>>(
    {},
  )

  useEffect(() => {
    if (!needsAnalysis) return
    let cancelled = false
    const pending = rawItems
      .filter((i) => i.type === 'imagem' && i.thumbUrl && !analyzed[i.id])
      .map((i) => ({ id: i.id, src: i.thumbUrl }))
    if (pending.length === 0) return
    analyzeImagesInto(pending, analyzed, (next) => {
      if (!cancelled) setAnalyzed(next)
    })
    return () => {
      cancelled = true
    }
  }, [needsAnalysis, rawItems, analyzed])

  /** Tags disponíveis na aba atual (derivadas dos itens; ordenadas por uso). */
  const availableTags: string[] = useMemo(() => {
    if (!LOCAL_ADVANCED_TABS.has(tab) && tab !== 'url') return []
    const counts = new Map<string, number>()
    for (const i of rawItems) for (const t of i.tags || []) counts.set(t, (counts.get(t) || 0) + 1)
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([t]) => t)
  }, [tab, rawItems])

  /* Chips deixam de ser selecionáveis quando a aba muda e a tag sumiu. */
  useEffect(() => {
    setSelectedTags((prev) => prev.filter((t) => availableTags.includes(t)))
  }, [availableTags])

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const items: GridItem[] = useMemo(() => {
    let out = rawItems.filter((i) => typeFilter === 'all' || i.type === typeFilter)
    out = out.filter((i) => isWithinDate(i.createdAt, dateFilter, customFrom, customTo))
    if (search.trim() && tab !== 'unsplash' && tab !== 'pexels') {
      const q = search.trim().toLowerCase()
      out = out.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.tags || []).some((t) => t.toLowerCase().includes(q)),
      )
    }
    // Chips de tags: modo E (item precisa ter TODAS as tags) ou OU (qualquer uma).
    if (selectedTags.length > 0) {
      const wanted = selectedTags.map((t) => t.toLowerCase())
      out = out.filter((i) => {
        const own = (i.tags || []).map((t) => t.toLowerCase())
        return tagMode === 'and'
          ? wanted.every((t) => own.includes(t))
          : wanted.some((t) => own.includes(t))
      })
    }
    if (orientation !== 'any' || color !== 'any') {
      if (tab === 'unsplash' || tab === 'pexels' || LOCAL_ADVANCED_TABS.has(tab)) {
        out = out.filter((i) => {
          if (i.type !== 'imagem') return orientation === 'any' && color === 'any'
          const info =
            tab === 'unsplash' || tab === 'pexels'
              ? orientationOf(i.width, i.height)
              : orientationOf(analyzed[i.id]?.w ?? i.width, analyzed[i.id]?.h ?? i.height)
          if (orientation !== 'any' && info !== orientation) return false
          if (color !== 'any') {
            if (tab === 'unsplash' || tab === 'pexels') {
              // Nas abas de stock a cor já foi filtrada pela API; nada a refazer aqui.
              return true
            }
            if (!analyzed[i.id]) return false // ainda analisando
            return dominantColorOf(analyzed[i.id].dom) === color
          }
          return true
        })
      }
    }
    if (tab === 'unsplash' || tab === 'pexels' || LOCAL_ADVANCED_TABS.has(tab)) {
      out = sortMediaItems(out, sortBy)
    }
    return out
  }, [
    rawItems,
    typeFilter,
    dateFilter,
    customFrom,
    customTo,
    search,
    selectedTags,
    tagMode,
    tab,
    sortBy,
    orientation,
    color,
    analyzed,
  ])

  const showStockWarning =
    (tab === 'unsplash' && stockStatus.unsplash === false) ||
    (tab === 'pexels' && stockStatus.pexels === false)

  /* =============================== RENDER =============================== */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Biblioteca de Mídias — Segundo Cérebro</DialogTitle>
        </DialogHeader>

        {/* 9 abas */}
        <div className="flex flex-wrap items-center gap-1 border-b border-border pb-2 shrink-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
                tab === t.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filtros por tipo e data */}
        <div className="flex flex-wrap items-center gap-2 py-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1" />
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setTypeFilter(f.key)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors',
                  typeFilter === f.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1 ml-auto">
            {DATE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setDateFilter(f.key)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors',
                  dateFilter === f.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          {dateFilter === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 w-full">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="sb-from" className="text-[11px] text-muted-foreground">
                  De
                </Label>
                <Input
                  id="sb-from"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-8 w-36 text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Label htmlFor="sb-to" className="text-[11px] text-muted-foreground">
                  Até
                </Label>
                <Input
                  id="sb-to"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-8 w-36 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Busca */}
        <div className="flex items-center gap-2 pb-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                tab === 'unsplash' || tab === 'pexels'
                  ? `Buscar no ${tab === 'unsplash' ? 'Unsplash' : 'Pexels'}...`
                  : 'Buscar mídias ou tags...'
              }
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={() => loadTab(tab)}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Atualizar
          </Button>
        </div>

        {/* Chips de tags (abas locais + URL externa): seleção múltipla com modo E/OU,
         * combinável com busca, tipo e data */}
        {availableTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pb-2 shrink-0">
            <span className="text-[10px] font-semibold text-muted-foreground mr-1">Tags:</span>
            {availableTags.map((t) => {
              const active = selectedTags.includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40',
                  )}
                >
                  #{t}
                </button>
              )
            })}
            {selectedTags.length > 1 && (
              <div className="flex items-center gap-1 ml-1">
                <span className="text-[10px] text-muted-foreground">modo</span>
                <button
                  type="button"
                  onClick={() => setTagMode('and')}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors',
                    tagMode === 'and'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                  title="O item precisa ter TODAS as tags selecionadas"
                >
                  E
                </button>
                <button
                  type="button"
                  onClick={() => setTagMode('or')}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors',
                    tagMode === 'or'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                  title="O item basta ter QUALQUER uma das tags selecionadas"
                >
                  OU
                </button>
              </div>
            )}
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-1 text-[10px] font-semibold text-muted-foreground hover:text-destructive underline underline-offset-2"
              >
                limpar
              </button>
            )}
          </div>
        )}

        {/* Busca avançada — abas de stock (API) e abas locais (análise no cliente) */}
        {(tab === 'unsplash' || tab === 'pexels' || LOCAL_ADVANCED_TABS.has(tab)) && (
          <MediaGridAdvancedControls
            local={LOCAL_ADVANCED_TABS.has(tab)}
            analyzing={
              LOCAL_ADVANCED_TABS.has(tab) &&
              needsAnalysis &&
              Object.keys(analyzed).length < rawItems.filter((i) => i.type === 'imagem').length
            }
            orientation={orientation}
            onOrientationChange={setOrientation}
            color={color}
            onColorChange={setColor}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}

        {/* Aviso de chaves ausentes (Unsplash/Pexels) — sempre em pt-BR */}
        {showStockWarning && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {tab === 'unsplash'
                ? 'As buscas no Unsplash precisam da chave UNSPLASH_ACCESS_KEY, que ainda não está configurada neste projeto. '
                : 'As buscas no Pexels precisam da chave PEXELS_API_KEY, que ainda não está configurada neste projeto. '}
              Cadastre-a no painel Skip Cloud → Secrets para habilitar a busca de imagens. Enquanto
              isso, os demais recursos continuam funcionando.
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto text-destructive/80 hover:text-destructive shrink-0"
              title="Fechar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Grade */}
        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-video w-full rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              Nenhuma mídia encontrada com os filtros atuais.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-2">
              {items.map((item) => {
                const isFav = favIds.has(item.id)
                return (
                  <div
                    key={item.id}
                    className="group relative rounded-xl overflow-hidden border border-border bg-muted/30 hover:border-primary/50 transition-all"
                  >
                    <div className="aspect-video bg-muted relative">
                      {item.type === 'imagem' || item.type === 'video' ? (
                        item.thumbUrl ? (
                          <img
                            src={item.thumbUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                            Sem prévia
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-3 text-center">
                          <span className="text-[10px] text-muted-foreground line-clamp-3">
                            {item.type === 'link' ? '🔗' : '📄'} {item.name}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(item)}
                        className={cn(
                          'absolute top-1.5 right-1.5 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border transition-all',
                          isFav
                            ? 'text-amber-400 border-amber-400/50'
                            : 'text-muted-foreground border-border hover:text-amber-400',
                        )}
                        title={isFav ? 'Remover dos favoritos' : 'Favoritar'}
                      >
                        <Star className={cn('w-3.5 h-3.5', isFav && 'fill-current')} />
                      </button>
                    </div>
                    <div className="p-2 space-y-1">
                      <p className="text-[11px] font-semibold text-foreground line-clamp-1">
                        {item.name}
                      </p>
                      <div className="flex items-center justify-between gap-1">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {item.type}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[10px] font-bold gap-1"
                          onClick={() => handleInsert(item)}
                        >
                          <Check className="w-3 h-3" />
                          Incluir no doc
                        </Button>
                      </div>
                      {(item.tags?.length || 0) > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags!.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-[9px] rounded-full bg-muted px-1.5 py-0 text-muted-foreground"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Aba "URL externa": vídeo (mp4/webm/YouTube/Vimeo/TikTok), áudio (mp3/wav/ogg),
         * Spotify (player embed) e PDF (prévia de documento) */}
        {tab === 'url' && (
          <div className="space-y-2 pb-2 shrink-0 border-t border-border pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={urlName}
                onChange={(e) => setUrlName(e.target.value)}
                placeholder="Nome (opcional) — ex: Vídeo do lançamento"
                className="h-8 w-52 text-xs"
              />
              <Input
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://... (vídeo, YouTube/Vimeo/TikTok, Spotify, mp3 ou PDF)"
                className="h-8 flex-1 min-w-[220px] text-xs"
              />
              <div className="flex items-center gap-1">
                {URL_KIND_OPTIONS.map((k) => (
                  <button
                    key={k.key}
                    type="button"
                    onClick={() => setUrlKind(k.key)}
                    className={cn(
                      'px-2 py-1 rounded-md text-[10px] font-semibold border transition-colors',
                      urlKind === k.key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                className="h-8 text-[11px] gap-1"
                onClick={handleAddUrl}
                disabled={!urlValue.trim()}
              >
                <Check className="w-3.5 h-3.5" />
                Adicionar
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Cole a URL de um vídeo (arquivo mp4/webm, YouTube, Vimeo ou TikTok), de um áudio
              (mp3/wav/ogg), de um conteúdo do Spotify (música, álbum, playlist ou podcast) ou de um
              PDF e clique em Adicionar — ela entra na grade e, ao "Incluir no doc", é inserida como
              bloco com player (vídeo, áudio ou Spotify) ou prévia de PDF na nota. "Detectar"
              reconhece o tipo pela própria URL.
            </p>
          </div>
        )}

        {/* Modelos salvos (studio_edit_presets com namespace secondbrain:) */}
        {tab === 'acervo' && (
          <div className="border-t border-border pt-2 space-y-2 shrink-0">
            <p className="text-[11px] font-semibold text-muted-foreground">
              Modelos de composição (aplicáveis ao acervo):
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Nome do modelo..."
                className="h-8 w-48 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-[11px]"
                onClick={handleSaveTemplate}
              >
                Salvar modelo
              </Button>
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-1 rounded-md border border-border px-2 py-1"
                >
                  <span className="text-[11px] font-semibold">
                    {t.name.replace('secondbrain:', '')}
                  </span>
                  {t.is_shared && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      Equipe
                    </Badge>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(t.id)}
                    className="text-muted-foreground hover:text-destructive text-[11px] font-bold ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SecondBrainMediaGrid
