import { useMemo } from 'react'
import { StudioAdvancedEditorDialog } from '@/components/studio/StudioAdvancedEditorDialog'
import type { StudioCreationRecord } from '@/services/ai-studio'

export type BrandMediaField = 'logo' | 'cover'

interface BrandAdvancedMediaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Campo da marca que receberá a mídia editada: 'logo' (1:1) ou 'cover' (16:9). */
  field: BrandMediaField
  brandName: string
  /** URL da mídia a abrir no editor (arquivo local via object URL ou URL do PB). */
  mediaUrl: string
  /** Recebe a mídia resultante: data URL (rasterizada) ou a própria URL (fallback CORS). */
  onSave: (resultUrl: string) => void
}

/**
 * Ponte do motor de Edição Avançada (StudioAdvancedEditorDialog) para as mídias
 * da página de marca (logo/capa) — reutiliza o mesmo motor, presets, histórico
 * e IA de exportação, sem duplicar nada.
 */
export function BrandAdvancedMediaDialog({
  open,
  onOpenChange,
  field,
  brandName,
  mediaUrl,
  onSave,
}: BrandAdvancedMediaDialogProps) {
  const creation: StudioCreationRecord | null = useMemo(() => {
    if (!mediaUrl) return null
    return {
      id: `brand-${field}-${brandName || 'nova'}`,
      user: '',
      type: 'image',
      title: `${field === 'cover' ? 'Capa da marca' : 'Logo da marca'} · ${brandName || 'Marca'}`,
      prompt: '',
      model_id: '',
      model_name: '',
      relative_cost: 0,
      credits_used: 0,
      preview_url: mediaUrl,
      aspect_ratio: field === 'cover' ? '16:9' : '1:1',
    }
  }, [field, brandName, mediaUrl])

  if (!creation) return null

  return (
    <StudioAdvancedEditorDialog
      open={open}
      onOpenChange={onOpenChange}
      creation={creation}
      onSave={onSave}
    />
  )
}

export default BrandAdvancedMediaDialog
