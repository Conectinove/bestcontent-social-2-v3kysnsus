import { StudioAdvancedEditorDialog } from '@/components/studio/StudioAdvancedEditorDialog'
import type { StudioCreationRecord } from '@/services/ai-studio'

interface EditorAdvancedMediaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mediaUrl: string
  title?: string
  /**
   * Identificador estável da mídia (opcional). Quando informado, o histórico
   * de versões (studio_edit_versions) e a colaboração passam a ser POR MÍDIA
   * em vez de compartilhados entre todas as mídias que abrem a ponte.
   */
  mediaId?: string
  /** Proporção inicial do canvas — ex.: '9:16' para stories/reels. */
  aspectRatio?: '16:9' | '1:1' | '4:5' | '9:16'
  /** Recebe a mídia resultante: data URL (rasterizada) ou a própria URL (fallback CORS). */
  onSave: (resultUrl: string) => void
}

/**
 * Ponte do motor de Edição Avançada do Studio (StudioAdvancedEditorDialog)
 * para telas externas (editor de posts, feed, comunidade, brand-kit):
 * adapta a mídia aberta no editor para o formato StudioCreationRecord
 * sem duplicar o motor.
 */
export function EditorAdvancedMediaDialog({
  open,
  onOpenChange,
  mediaUrl,
  title,
  mediaId,
  aspectRatio,
  onSave,
}: EditorAdvancedMediaDialogProps) {
  if (!mediaUrl) return null

  const creation: StudioCreationRecord = {
    // id não-vazio → targetKey "creation:<id>" (histórico por mídia)
    id: mediaId || `editor-media:${title || 'sem-titulo'}:${mediaUrl.slice(0, 120)}`,
    user: '',
    type: 'image',
    title: title || 'Mídia do post',
    prompt: '',
    model_id: '',
    model_name: '',
    relative_cost: 0,
    credits_used: 0,
    preview_url: mediaUrl,
    aspect_ratio: aspectRatio || '4:5',
  }

  return (
    <StudioAdvancedEditorDialog
      open={open}
      onOpenChange={onOpenChange}
      creation={creation}
      onSave={onSave}
    />
  )
}

export default EditorAdvancedMediaDialog
