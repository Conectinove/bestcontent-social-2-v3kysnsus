/**
 * Controles avançados da grade de mídias (orientação, cor, ordenação).
 * v0.0.293: compartilhados pelas abas de stock (Unsplash/Pexels — filtrado pela
 * API) e pelas abas locais (Documento, Acervo, Uploads, Biblioteca, Favoritos —
 * analisado no próprio dispositivo via src/lib/image-analysis.ts).
 */
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  COLOR_OPTIONS,
  ORIENTATION_OPTIONS,
  MEDIA_SORT_OPTIONS,
  type SecondBrainMediaSort,
  type SecondBrainOrientationFilter,
  type SecondBrainColorFilter,
} from '@/services/second-brain-media'

interface Props {
  /** Aba local: orientação/cor analisadas no cliente (não na API). */
  local: boolean
  orientation: SecondBrainOrientationFilter
  color: SecondBrainColorFilter
  sortBy: SecondBrainMediaSort
  analyzing?: boolean
  onOrientationChange: (v: SecondBrainOrientationFilter) => void
  onColorChange: (v: SecondBrainColorFilter) => void
  onSortChange: (v: SecondBrainMediaSort) => void
}

export function MediaGridAdvancedControls({
  local,
  orientation,
  color,
  sortBy,
  analyzing,
  onOrientationChange,
  onColorChange,
  onSortChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-end gap-2 pb-2 shrink-0">
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Orientação</Label>
        <Select value={orientation} onValueChange={onOrientationChange}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORIENTATION_OPTIONS.map((o) => (
              <SelectItem key={o.key} value={o.key}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Cor</Label>
        <Select value={color} onValueChange={onColorChange}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLOR_OPTIONS.map((c) => (
              <SelectItem key={c.key} value={c.key}>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-3 h-3 rounded-full border border-border shrink-0"
                    style={{ backgroundColor: c.hex }}
                    aria-hidden
                  />
                  {c.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Ordenação</Label>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEDIA_SORT_OPTIONS.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {local ? (
        <span className="text-[10px] text-muted-foreground max-w-56 leading-tight pb-1">
          {analyzing ? (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Analisando imagens...
            </span>
          ) : (
            'Orientação e cor analisadas no próprio dispositivo (imagens locais).'
          )}
        </span>
      ) : (
        <span className="text-[10px] text-muted-foreground max-w-56 leading-tight pb-1">
          Filtros aplicados pela API do provedor.
        </span>
      )}
    </div>
  )
}

export default MediaGridAdvancedControls
