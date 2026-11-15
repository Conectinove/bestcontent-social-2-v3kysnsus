import { StudioAdvancedEditorDialog } from '@/components/studio/StudioAdvancedEditorDialog'
import type { StudioCreationRecord } from '@/services/ai-studio'

interface EditorAdvancedMediaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mediaUrl: string
  title?: string
  /** Recebe a mídia resultante: data URL (rasterizada) ou a própria URL (fallback CORS). */
  onSave: (resultUrl: string) => void
}

/**
 * Ponte do motor de Edição Avançada do Studio (StudioAdvancedEditorDialog)
 * para o editor de posts em /app/editor: adapta a mídia aberta no editor
 * para o formato StudioCreationRecord sem duplicar o motor.
 */
export function EditorAdvancedMediaDialog({
  open,
  onOpenChange,
  mediaUrl,
  title,
  onSave,
}: EditorAdvancedMediaDialogProps) {
  if (!mediaUrl) return null

  const creation: StudioCreationRecord = {
    id: 'editor-media',
    user: '',
    type: 'image',
    title: title || 'Mídia do post',
    prompt: '',
    model_id: '',
    model_name: '',
    relative_cost: 0,
    credits_used: 0,
    preview_url: mediaUrl,
    aspect_ratio: '4:5',
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
