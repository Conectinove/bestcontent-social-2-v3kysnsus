/**
 * Editor de BLOCOS arrastáveis para páginas do portal (pedido 3).
 * Tipos: título, texto, imagem, botão/CTA, espaçador. Reordenação por
 * drag & drop com HTML5 events nativos (sem lib). Grava em content.blocks.
 */
import { useRef, useState } from 'react'
import {
  Plus,
  Trash2,
  GripVertical,
  Type,
  AlignLeft,
  Image as ImageIcon,
  MousePointerClick,
  MoveVertical,
  Pencil,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PortalBlock } from '@/services/portal-pages'

const BLOCK_TYPES: { type: PortalBlock['type']; label: string; icon: typeof Type }[] = [
  { type: 'title', label: 'Título', icon: Type },
  { type: 'text', label: 'Texto', icon: AlignLeft },
  { type: 'image', label: 'Imagem (URL)', icon: ImageIcon },
  { type: 'cta', label: 'Botão / CTA', icon: MousePointerClick },
  { type: 'spacer', label: 'Espaçador', icon: MoveVertical },
]

const uid = () => `b_${Math.random().toString(36).slice(2, 9)}`

export function makeDefaultBlock(type: PortalBlock['type']): PortalBlock {
  if (type === 'title') return { id: uid(), type, text: 'Novo título' }
  if (type === 'text') return { id: uid(), type, text: 'Escreva aqui o texto deste bloco...' }
  if (type === 'image')
    return {
      id: uid(),
      type,
      text: 'Legenda da imagem (opcional)',
      url: 'https://img.usecurling.com/p/800/400?q=brand+content',
    }
  if (type === 'cta')
    return { id: uid(), type, text: 'Fale conosco', url: 'https://wa.me/5511999999999' }
  return { id: uid(), type, height: 40 }
}

interface PortalBlocksEditorProps {
  blocks: PortalBlock[]
  onChange: (blocks: PortalBlock[]) => void
}

export function PortalBlocksEditor({ blocks, onChange }: PortalBlocksEditorProps) {
  const dragIndex = useRef<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [editing, setEditing] = useState<string | null>(null)

  const addBlock = (type: PortalBlock['type']) => onChange([...blocks, makeDefaultBlock(type)])

  const removeBlock = (id: string) => onChange(blocks.filter((b) => b.id !== id))

  const updateBlock = (id: string, patch: Partial<PortalBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)))

  const handleDrop = (targetIndex: number) => {
    const from = dragIndex.current
    dragIndex.current = null
    setOverIndex(null)
    if (from === null || from === targetIndex) return
    const next = [...blocks]
    const [moved] = next.splice(from, 1)
    next.splice(targetIndex, 0, moved)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            className="text-[11px] gap-1 h-7"
            onClick={() => addBlock(type)}
          >
            <Plus className="w-3 h-3" /> {label}
          </Button>
        ))}
      </div>

      {blocks.length === 0 ? (
        <p className="text-[11px] text-muted-foreground p-3 rounded-lg bg-muted/30 border border-dashed border-border/60">
          Nenhum bloco ainda. Adicione acima — arraste pelo ícone ⠿ para reordenar.
        </p>
      ) : (
        <div className="space-y-1.5">
          {blocks.map((b, idx) => {
            const icon = BLOCK_TYPES.find((t) => t.type === b.type)?.icon || Type
            const label = BLOCK_TYPES.find((t) => t.type === b.type)?.label || b.type
            const Icon = icon
            return (
              <div
                key={b.id}
                draggable
                onDragStart={() => (dragIndex.current = idx)}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverIndex(idx)
                }}
                onDragLeave={() => setOverIndex((v) => (v === idx ? null : v))}
                onDrop={(e) => {
                  e.preventDefault()
                  handleDrop(idx)
                }}
                onDragEnd={() => {
                  dragIndex.current = null
                  setOverIndex(null)
                }}
                className={`flex items-center gap-2 p-2 rounded-lg border bg-background transition-colors ${
                  overIndex === idx ? 'border-primary/60 bg-primary/5' : 'border-border/70'
                }`}
              >
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0 cursor-grab" />
                <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  {editing === b.id ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(b.type === 'title' ||
                        b.type === 'text' ||
                        b.type === 'image' ||
                        b.type === 'cta') && (
                        <Input
                          autoFocus
                          value={b.text || ''}
                          onChange={(e) => updateBlock(b.id, { text: e.target.value })}
                          placeholder={b.type === 'cta' ? 'Texto do botão' : 'Conteúdo'}
                          className="h-7 text-[11px] flex-1 min-w-[120px]"
                        />
                      )}
                      {(b.type === 'image' || b.type === 'cta') && (
                        <Input
                          value={b.url || ''}
                          onChange={(e) => updateBlock(b.id, { url: e.target.value })}
                          placeholder={b.type === 'image' ? 'URL da imagem' : 'URL do link'}
                          className="h-7 text-[11px] flex-1 min-w-[120px]"
                        />
                      )}
                      {b.type === 'spacer' && (
                        <Input
                          type="number"
                          value={b.height ?? 40}
                          onChange={(e) =>
                            updateBlock(b.id, { height: Number(e.target.value) || 0 })
                          }
                          className="h-7 text-[11px] w-20"
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setEditing(null)}
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-foreground truncate">
                        {b.type === 'spacer'
                          ? `Espaçador (${b.height ?? 40}px)`
                          : b.type === 'cta'
                            ? b.text || 'Botão'
                            : b.text || label}
                      </p>
                      {b.url && (
                        <p className="text-[10px] text-muted-foreground truncate font-mono">
                          {b.url}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={() => setEditing((v) => (v === b.id ? null : b.id))}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0 text-destructive"
                  onClick={() => removeBlock(b.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Renderiza um bloco na página pública do portal. */
export function PortalBlockView({ block }: { block: PortalBlock }) {
  if (block.type === 'title') {
    return <h3 className="text-lg font-black text-foreground">{block.text || ''}</h3>
  }
  if (block.type === 'text') {
    return (
      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
        {block.text || ''}
      </p>
    )
  }
  if (block.type === 'image') {
    return (
      <figure className="space-y-1.5">
        {block.url && (
          <img
            src={block.url}
            alt={block.text || 'Imagem'}
            className="w-full rounded-xl border border-border/60"
            loading="lazy"
          />
        )}
        {block.text && (
          <figcaption className="text-[11px] text-muted-foreground text-center">
            {block.text}
          </figcaption>
        )}
      </figure>
    )
  }
  if (block.type === 'cta') {
    return (
      <a
        href={block.url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-white text-xs font-bold hover:opacity-90 transition-opacity"
      >
        {block.text || 'Saiba mais'}
      </a>
    )
  }
  return <div style={{ height: `${block.height ?? 40}px` }} aria-hidden="true" />
}
