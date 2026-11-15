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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { type PortalBlock, type PortalBlockType, slugifyTitle } from '@/services/portal-pages'

interface PortalBlocksEditorProps {
  blocks: PortalBlock[]
  onChange: (blocks: PortalBlock[]) => void
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

export function PortalBlocksEditor({ blocks, onChange }: PortalBlocksEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [galleryInput, setGalleryInput] = useState<Record<string, string>>({})
  const listRef = useRef<HTMLDivElement>(null)

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
                <Input
                  value={block.url || ''}
                  onChange={(e) => patchBlock(block.id, { url: e.target.value })}
                  placeholder="URL do vídeo (YouTube ou Vimeo)"
                  className="h-8 text-sm"
                />
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
