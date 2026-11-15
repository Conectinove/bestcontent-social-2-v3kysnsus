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
  /** Contexto da marca — alimenta a IA (edit-assistant) com rede e tipo de mídia. */
  brandContext?: { brandName: string; field: BrandMediaField; network?: string }
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
  brandContext,
  onSave,
}: BrandAdvancedMediaDialogProps) {
  const network = brandContext?.network || ''
  const creation: StudioCreationRecord | null = useMemo(() => {
    if (!mediaUrl) return null
    return {
      id: `brand-${field}-${brandName || 'nova'}`,
      user: '',
      type: 'image',
      title: `${field === 'cover' ? 'Capa da marca' : 'Logo da marca'} · ${brandName || 'Marca'}`,
      // Contexto enviado ao agente edit-assistant como mediaPrompt.
      prompt: brandContext
        ? `Tratamento de ${field === 'cover' ? 'capa' : 'logo'} da marca ${brandName || 'Marca'}${
            network ? ` para ${network}` : ''
          } — dicas de tratamento de imagem/logo antes de salvar.`
        : '',
      model_id: '',
      model_name: '',
      relative_cost: 0,
      credits_used: 0,
      preview_url: mediaUrl,
      aspect_ratio: field === 'cover' ? '16:9' : '1:1',
    }
  }, [field, brandName, mediaUrl, brandContext, network])

  if (!creation) return null

  return (
    <StudioAdvancedEditorDialog
      open={open}
      onOpenChange={onOpenChange}
      creation={creation}
      network={network || 'marca'}
      onSave={onSave}
    />
  )
}

export default BrandAdvancedMediaDialog

/** Converte um data URL (resultado da rasterização do canvas) em File para upload no PocketBase. */
export function dataUrlToFile(dataUrl: string, fileName: string): File | null {
  try {
    const [meta, b64] = dataUrl.split(',')
    if (!b64) return null
    const mimeMatch = meta.match(/data:([^;]+)/)
    const mime = mimeMatch?.[1] || 'image/png'
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return new File([bytes], fileName, { type: mime })
  } catch {
    return null
  }
}
