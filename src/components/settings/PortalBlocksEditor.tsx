import { useRef, useState } from 'react'
import {
  GripVertical,
  Plus,
  Trash2,
  Type,
  Heading1,
  Image as ImageIcon,
  MousePointerClick,
  MoveVertical,
  Images,
  Youtube,
  Minus,
  Quote,
  Upload,
  Loader2,
  Link2,
  FileVideo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { type PortalBlock, type PortalBlockType, slugifyTitle } from '@/services/portal-pages'
import { uploadPortalVideo, PORTAL_VIDEO_MAX_BYTES } from '@/services/portal-media'

interface PortalBlocksEditorProps {
  blocks: PortalBlock[]
  onChange: (blocks: PortalBlock[]) => void
  /** Necessário para vídeo próprio: dono do record em portal_media. */
  userId?: string
  brandId?: string
}

let seq = 0
const newId = () => `blk-${Date.now()}-${++seq}`

const BLOCK_TYPES: {
  type: PortalBlockType
  label: string
  icon: typeof Type
  defaults: Partial<PortalBlock>
}[] = [
  { type: 'title', label: 'Título', icon: Heading1, defaults: { text: 'Novo título' } },
  { type: 'text', label: 'Texto', icon: Type, defaults: { text: 'Escreva aqui…' } },
  { type: 'image', label: 'Imagem', icon: ImageIcon, defaults: { url: '', text: '' } },
  {
    type: 'cta',
    label: 'Botão',
    icon: MousePointerClick,
    defaults: { text: 'Clique aqui', url: '' },
  },
  { type: 'spacer', label: 'Espaço', icon: MoveVertical, defaults: { height: 32 } },
  {
    type: 'gallery',
    label: 'Galeria',
    icon: Images,
    defaults: { urls: [], text: 'Cole uma URL de imagem e pressione Enter' },
  },
  { type: 'video', label: 'Vídeo', icon: Youtube, defaults: { url: '' } },
  { type: 'divider', label: 'Separador', icon: Minus, defaults: {} },
  {
    type: 'quote',
    label: 'Citação',
    icon: Quote,
    defaults: { text: 'Frase de destaque…', author: '' },
  },
]

export function blockTypeLabel(type: PortalBlockType): string {
  return BLOCK_TYPES.find((b) => b.type === type)?.label ?? type
}

export function PortalBlocksEditor({ blocks, onChange, userId, brandId }: PortalBlocksEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [galleryInput, setGalleryInput] = useState<Record<string, string>>({})
  const [videoMode, setVideoMode] = useState<Record<string, 'link' | 'upload'>>({})
  const [uploadingBlock, setUploadingBlock] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  /** Envia o arquivo de vídeo escolhido e liga o bloco ao record criado. */
  const handleVideoUpload = async (block: PortalBlock, file: File | undefined) => {
    if (!file) return
    if (!userId || !brandId) {
      toast({
        title: 'Não foi possível enviar',
        description: 'Contexto do portal ausente.',
        variant: 'destructive',
      })
      return
    }
    if (file.size > PORTAL_VIDEO_MAX_BYTES) {
      toast({
        title: 'Vídeo muito grande',
        description: `O arquivo tem ${(file.size / (1024 * 1024)).toFixed(1)} MB e o limite é 50 MB. Compacte ou use um link do YouTube/Vimeo.`,
        variant: 'destructive',
      })
      return
    }
    setUploadingBlock(block.id)
    try {
      const media = await uploadPortalVideo(userId, brandId, file)
      onChange(
        blocks.map((b) =>
          b.id === block.id
            ? { ...b, mediaId: media.id, mediaName: file.name, url: '', type: 'video' }
            : b,
        ),
      )
      toast({ title: 'Vídeo enviado', description: `"${file.name}" será reproduzido no portal.` })
    } catch (err) {
      toast({
        title: 'Erro ao enviar vídeo',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setUploadingBlock(null)
    }
  }

  /** Desliga o vídeo próprio do bloco (o record continua para reuso via biblioteca). */
  const detachOwnVideo = (block: PortalBlock) => {
    onChange(
      blocks.map((b) =>
        b.id === block.id ? { ...b, mediaId: undefined, mediaName: undefined } : b,
      ),
    )
  }

  const addBlock = (type: PortalBlockType) => {
    const def = BLOCK_TYPES.find((b) => b.type === type)
    if (!def) return
    onChange([...blocks, { id: newId(), type, ...def.defaults } as PortalBlock])
  }

  const patchBlock = (id: string, patch: Partial<PortalBlock>) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }

  const removeBlock = (id: string) => onChange(blocks.filter((b) => b.id !== id))

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setOverIndex(null)
      return
    }
    const next = [...blocks]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    onChange(next)
    setDragIndex(null)
    setOverIndex(null)
  }

  const addGalleryUrl = (block: PortalBlock) => {
    const raw = (galleryInput[block.id] || '').trim()
    if (!raw) return
    if (!/^https?:\/\//i.test(raw)) {
      toast({
        title: 'URL inválida',
        description: 'Comece com http:// ou https://',
        variant: 'destructive',
      })
      return
    }
    const urls = [...(block.urls || []), raw]
    patchBlock(block.id, { urls })
    setGalleryInput((g) => ({ ...g, [block.id]: '' }))
  }

  return (
    <div className="space-y-2" ref={listRef}>
      <div className="flex flex-wrap gap-1.5">
        {BLOCK_TYPES.map((bt) => {
          const Icon = bt.icon
          return (
            <Button
              key={bt.type}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => addBlock(bt.type)}
            >
              <Icon className="size-3" />
              {bt.label}
            </Button>
          )
        })}
      </div>

      {blocks.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum bloco ainda — adicione com os botões acima e arraste para reordenar.
        </p>
      )}

      {blocks.map((block, index) => {
        const isDragging = dragIndex === index
        const isOver = overIndex === index && dragIndex !== null && dragIndex !== index
        return (
          <div
            key={block.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => {
              e.preventDefault()
              setOverIndex(index)
            }}
            onDragLeave={() => setOverIndex((o) => (o === index ? null : o))}
            onDrop={() => handleDrop(index)}
            onDragEnd={() => {
              setDragIndex(null)
              setOverIndex(null)
            }}
            className={`rounded-md border bg-card p-2.5 transition-shadow ${
              isDragging ? 'opacity-50' : ''
            } ${isOver ? 'ring-2 ring-primary/40' : ''}`}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
              <Badge variant="secondary" className="text-[10px] uppercase">
                {blockTypeLabel(block.type)}
              </Badge>
              <div className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => removeBlock(block.id)}
                aria-label="Remover bloco"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            <div className="mt-2 space-y-1.5 pl-6">
              {block.type === 'title' && (
                <Input
                  value={block.text || ''}
                  onChange={(e) => patchBlock(block.id, { text: e.target.value })}
                  placeholder="Título da seção"
                  className="h-8 text-sm"
                />
              )}

              {block.type === 'text' && (
                <textarea
                  value={block.text || ''}
                  onChange={(e) => patchBlock(block.id, { text: e.target.value })}
                  placeholder="Texto do bloco"
                  rows={3}
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                />
              )}

              {block.type === 'image' && (
                <>
                  <Input
                    value={block.url || ''}
                    onChange={(e) => patchBlock(block.id, { url: e.target.value })}
                    placeholder="URL da imagem (https://…)"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={block.text || ''}
                    onChange={(e) => patchBlock(block.id, { text: e.target.value })}
                    placeholder="Legenda (opcional)"
                    className="h-8 text-xs"
                  />
                </>
              )}

              {block.type === 'cta' && (
                <>
                  <Input
                    value={block.text || ''}
                    onChange={(e) => patchBlock(block.id, { text: e.target.value })}
                    placeholder="Texto do botão"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={block.url || ''}
                    onChange={(e) => patchBlock(block.id, { url: e.target.value })}
                    placeholder="Link (https://…)"
                    className="h-8 text-sm"
                  />
                </>
              )}

              {block.type === 'spacer' && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Altura (px)
                  <Input
                    type="number"
                    min={8}
                    max={200}
                    value={block.height ?? 32}
                    onChange={(e) => patchBlock(block.id, { height: Number(e.target.value) || 32 })}
                    className="h-7 w-20 text-sm"
                  />
                </label>
              )}

              {block.type === 'gallery' && (
                <>
                  {(block.urls || []).length > 0 && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {(block.urls || []).map((u, i) => (
                        <button
                          key={`${u}-${i}`}
                          type="button"
                          className="group relative aspect-square overflow-hidden rounded border"
                          onClick={() =>
                            patchBlock(block.id, {
                              urls: (block.urls || []).filter((_, j) => j !== i),
                            })
                          }
                          title="Clique para remover"
                        >
                          <img src={u} alt="" className="size-full object-cover" />
                          <Trash2 className="absolute right-1 top-1 size-3.5 text-white opacity-0 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  )}
                  <Input
                    value={galleryInput[block.id] || ''}
                    onChange={(e) => setGalleryInput((g) => ({ ...g, [block.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addGalleryUrl(block)
                      }
                    }}
                    placeholder="URL da imagem e Enter"
                    className="h-8 text-sm"
                  />
                </>
              )}

              {block.type === 'video' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant={
                        (!videoMode[block.id] && !block.mediaId) || videoMode[block.id] === 'link'
                          ? 'secondary'
                          : 'outline'
                      }
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => setVideoMode((m) => ({ ...m, [block.id]: 'link' }))}
                    >
                      <Link2 className="size-3" /> Link
                    </Button>
                    <Button
                      type="button"
                      variant={
                        block.mediaId || videoMode[block.id] === 'upload' ? 'secondary' : 'outline'
                      }
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => setVideoMode((m) => ({ ...m, [block.id]: 'upload' }))}
                    >
                      <Upload className="size-3" /> Vídeo próprio
                    </Button>
                  </div>

                  {(!videoMode[block.id] && !block.mediaId) || videoMode[block.id] === 'link' ? (
                    <Input
                      value={block.url || ''}
                      onChange={(e) => patchBlock(block.id, { url: e.target.value })}
                      placeholder="URL do vídeo (YouTube ou Vimeo)"
                      className="h-8 text-sm"
                    />
                  ) : block.mediaId ? (
                    <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-2 py-1.5">
                      <span className="flex min-w-0 items-center gap-1.5 text-xs">
                        <FileVideo className="size-3.5 shrink-0 text-primary" />
                        <span className="truncate">{block.mediaName || 'Vídeo enviado'}</span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 shrink-0 gap-1 text-[10px] text-destructive"
                        onClick={() => detachOwnVideo(block)}
                      >
                        <Trash2 className="size-3" /> Remover
                      </Button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-2 py-3 text-xs text-muted-foreground hover:bg-muted/40">
                      {uploadingBlock === block.id ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Enviando vídeo…
                        </>
                      ) : (
                        <>
                          <Upload className="size-3.5" />
                          Escolher arquivo de vídeo (MP4/WebM, até 50 MB)
                        </>
                      )}
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                        className="hidden"
                        disabled={uploadingBlock === block.id}
                        onChange={(e) => {
                          e.preventDefault()
                          void handleVideoUpload(block, e.target.files?.[0])
                          e.target.value = ''
                        }}
                      />
                    </label>
                  )}
                </>
              )}

              {block.type === 'divider' && (
                <div className="border-t border-dashed py-2 text-center text-[10px] text-muted-foreground">
                  linha divisória
                </div>
              )}

              {block.type === 'quote' && (
                <>
                  <textarea
                    value={block.text || ''}
                    onChange={(e) => patchBlock(block.id, { text: e.target.value })}
                    placeholder="Texto da citação"
                    rows={2}
                    className="w-full rounded-md border bg-background px-2 py-1.5 text-sm italic"
                  />
                  <Input
                    value={block.author || ''}
                    onChange={(e) => patchBlock(block.id, { author: e.target.value })}
                    placeholder="Autor (opcional)"
                    className="h-8 text-sm"
                  />
                </>
              )}
            </div>
          </div>
        )
      })}

      <div className="flex items-center gap-1 pt-1 text-muted-foreground">
        <Plus className="size-3.5" />
        <span className="text-xs">
          {blocks.length} bloco{blocks.length === 1 ? '' : 's'} · arraste pelo ícone para reordenar
        </span>
      </div>
    </div>
  )
}

export { slugifyTitle }
