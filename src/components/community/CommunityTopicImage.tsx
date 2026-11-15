import { useState } from 'react'
import { Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EditorAdvancedMediaDialog } from '@/components/editor/EditorAdvancedMediaDialog'
import { cn } from '@/lib/utils'

interface CommunityTopicImageProps {
  src: string
  alt?: string
  /** Ativa o botão flutuante de Edição Avançada (motor do Studio). */
  editable?: boolean
  /** Chamado com a mídia resultante (data URL rasterizada ou a própria URL). */
  onEditedSave?: (resultUrl: string) => void
  className?: string
}

/**
 * Imagem de tópico/post da comunidade com ponto de entrada para a Edição Avançada
 * (mesmo motor do Studio e do editor de posts — StudioAdvancedEditorDialog).
 */
export function CommunityTopicImage({
  src,
  alt = '',
  editable = false,
  onEditedSave,
  className,
}: CommunityTopicImageProps) {
  const [advOpen, setAdvOpen] = useState(false)

  return (
    <div
      className={cn(
        'relative group/img overflow-hidden rounded-2xl border border-border',
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />

      {editable && (
        <>
          <Button
            type="button"
            size="sm"
            onClick={() => setAdvOpen(true)}
            className="absolute top-2 right-2 h-8 gap-1.5 rounded-full bg-background/85 text-foreground backdrop-blur-sm border border-border shadow-sm opacity-0 group-hover/img:opacity-100 focus-visible:opacity-100 transition-opacity"
            title="Abrir na Edição Avançada"
          >
            <Wand2 className="w-3.5 h-3.5 text-primary" />
            Edição Avançada
          </Button>

          <EditorAdvancedMediaDialog
            open={advOpen}
            onOpenChange={setAdvOpen}
            mediaUrl={src}
            title={alt || 'Mídia da comunidade'}
            onSave={onEditedSave || (() => {})}
          />
        </>
      )}
    </div>
  )
}

export default CommunityTopicImage
