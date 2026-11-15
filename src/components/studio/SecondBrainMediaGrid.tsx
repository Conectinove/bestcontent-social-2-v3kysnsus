import React, { useMemo, useState } from 'react'
import { FileText, Image as ImageIcon, Sliders, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  DEFAULT_CUSTOMIZATION,
  type AdvancedCustomizationState,
} from '@/components/workspace/AdvancedCustomizationPanel'
import {
  SecondBrainAdvancedImageEditor,
  buildBrainImageFilter,
} from './SecondBrainAdvancedImageEditor'

export interface SecondBrainMediaItem {
  id: string
  name: string
  url: string
  kind: 'image' | 'document'
  source: string
  sourceUrl?: string
}

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

/**
 * Grid de mídias do Segundo Cérebro: imagens e anexos vindos de Drive/Gmail/Docs/Sheets,
 * além de links de imagem salvos nos blocos. Permite abrir cada imagem na Edição
 * Avançada (mesmo motor do Studio) e persistir o resultado de volta no bloco.
 */
export const SecondBrainMediaGrid: React.FC<SecondBrainMediaGridProps> = ({
  open,
  onOpenChange,
  doc,
  onDocUpdated,
}) => {
  const { toast } = useToast()
  const [editingMedia, setEditingMedia] = useState<SecondBrainMediaItem | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const mediaItems: SecondBrainMediaItem[] = useMemo(() => {
    const items: SecondBrainMediaItem[] = []
    const seen = new Set<string>()
    doc.modules.forEach((m) => {
      m.blocks.forEach((b) => {
        const meta = b.metadata || {}
        const candidates: Array<{ url?: string; name?: string; source?: string }> = []
        if (meta.image_url) {
          candidates.push({
            url: meta.image_url,
            name: meta.image_name || m.title,
            source: 'Anexo do item',
          })
        }
        if (meta.thumbnail_url) {
          candidates.push({
            url: meta.thumbnail_url,
            name: meta.image_name || m.title,
            source: 'Capa do anexo',
          })
        }
        if (meta.attachment_url) {
          candidates.push({
            url: meta.attachment_url,
            name: meta.attachment_name || m.title,
            source: 'Anexo do item',
          })
        }
        if (
          b.type === 'image' &&
          typeof b.content === 'string' &&
          /^https?:\/\//.test(b.content.trim())
        ) {
          candidates.push({
            url: b.content.trim(),
            name: b.caption || m.title,
            source: 'Bloco de imagem',
          })
        }
        // Links de imagem em parágrafos/callouts (ex. colados do Drive/Gmail)
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
            })
          }
        })
      })
    })
    return items
  }, [doc])

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

  const saveEditedImage = async (
    item: SecondBrainMediaItem,
    newState: AdvancedCustomizationState,
  ) => {
    setSavingId(item.id)
    try {
      // Persiste o estado de edição no metadata do bloco dono do link — recarregar mantém.
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
                brightness: newState.brightness,
                contrast: newState.contrast,
                saturation: newState.saturation,
                blur: newState.blur,
                vignette: newState.vignette,
                overlayOpacity: newState.overlayOpacity,
                overlayColor: newState.overlayColor,
                rotation: newState.rotation,
                flipHorizontal: newState.flipHorizontal,
                flipVertical: newState.flipVertical,
                borderWidth: newState.borderWidth,
                borderColor: newState.borderColor,
                shadow: newState.shadow,
                layerOpacity: newState.layerOpacity,
                edited_at: new Date().toISOString(),
              },
            },
          }
        }),
      }))
      onDocUpdated({ modules: updatedModules })
      setEditingMedia(null)
      toast({
        title: 'Edição salva!',
        description: `"${item.name}" atualizado — o ajuste persiste ao recarregar.`,
      })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="nb-accent-scope nb-theme-scope max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-950 border-slate-800 text-slate-100 w-[calc(100vw-1.5rem)] sm:w-full rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg min-w-0">
              <ImageIcon className="w-4 h-4 shrink-0 nb-accent-text" />
              <span className="truncate">Mídias &amp; Anexos — {doc.title || 'Documento'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Imagens e anexos vindos dos conectores (Drive, Gmail, Docs, Sheets) e dos blocos do
              documento. Toque em uma imagem para abrir a Edição Avançada.
            </DialogDescription>
          </DialogHeader>

          {mediaItems.length === 0 && docFiles.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <ImageIcon className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm text-slate-400 font-semibold">Nenhuma mídia neste documento</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Importe contexto pelo Gmail ou Drive (botão Conectar) ou cole um link de imagem em
                um bloco para editá-la aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mediaItems.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {mediaItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={savingId === item.id}
                      onClick={() => setEditingMedia(item)}
                      className="group text-left rounded-xl overflow-hidden border border-slate-800 bg-slate-900/70 hover:border-slate-600 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-0"
                    >
                      <div className="relative aspect-video bg-slate-900 overflow-hidden">
                        <img
                          src={item.url}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          style={editStyleFor(item, doc)}
                        />
                        {isEdited(item, doc) && (
                          <Badge className="absolute top-1.5 right-1.5 bg-slate-900/90 text-[9px] uppercase gap-1 border border-slate-700">
                            <Sliders className="w-2.5 h-2.5" /> Editada
                          </Badge>
                        )}
                      </div>
                      <div className="p-2 space-y-0.5 min-w-0">
                        <p className="text-[11px] font-semibold truncate text-slate-100">
                          {item.name}
                        </p>
                        <p className="text-[9px] text-slate-500 truncate">{item.source}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {docFiles.length > 0 && (
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
                      <span className="text-[11px] font-medium text-slate-200 truncate">
                        {f.name}
                      </span>
                      <span className="ml-auto text-[9px] text-slate-500 shrink-0">{f.source}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
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
        onSave={(result) => {
          if (!editingMedia) return
          saveEditedImage(editingMedia, result.customization)
        }}
      />
    </>
  )
}

export default SecondBrainMediaGrid
