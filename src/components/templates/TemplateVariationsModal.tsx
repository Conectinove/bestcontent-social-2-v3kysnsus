import { useEffect, useState } from 'react'
import { Wand2, ArrowRight, Loader2, Palette } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { generateTemplateVariations, type TemplateVariation } from '@/services/template-variations'
import type { PostTemplate } from '@/services/post-templates'

interface TemplateVariationsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: PostTemplate | null
  brandName?: string
  styleGuidelines?: Record<string, unknown> | string | null
  onUse: (template: PostTemplate, caption: string) => void
}

export function TemplateVariationsModal({
  open,
  onOpenChange,
  template,
  brandName,
  styleGuidelines,
  onUse,
}: TemplateVariationsModalProps) {
  const [loading, setLoading] = useState(false)
  const [variations, setVariations] = useState<TemplateVariation[]>([])
  const [source, setSource] = useState<'ia' | 'local'>('local')

  useEffect(() => {
    if (!open || !template) return
    let isMounted = true
    setLoading(true)
    setVariations([])
    generateTemplateVariations({
      templateName: template.name,
      category: template.category,
      network: template.network,
      brandName,
      styleGuidelines,
    })
      .then((res) => {
        if (isMounted) {
          setVariations(res.variations)
          setSource(res.source)
        }
      })
      .catch(() => {
        /* o serviço nunca deveria lançar, mas protege o fluxo */
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [open, template?.id, template?.name, brandName, styleGuidelines])

  const handleUse = (v: TemplateVariation) => {
    if (!template) return
    const applied: PostTemplate = {
      ...template,
      name: `${template.name} · ${v.label.replace('Variação ', '')}`,
      style_settings: {
        ...(template.style_settings || {}),
        palette: v.palette,
        visual_direction: v.visual_direction,
        ai_variation: v.id,
      },
      layout_data: {
        ...(template.layout_data || {}),
        copy_hint: v.caption,
      },
    }
    onUse(applied, v.caption)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Wand2 className="w-5 h-5 text-purple-600 shrink-0" />
            <span className="truncate">Gerar variações com IA</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {template
              ? `Variações de copy e direção visual para "${template.name}", respeitando as diretrizes da marca/campanha.`
              : 'Selecione um template para gerar variações.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3 py-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={
                  source === 'ia'
                    ? 'border-purple-500/40 text-purple-600 dark:text-purple-300 bg-purple-500/10 text-[10px]'
                    : 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[10px]'
                }
              >
                {source === 'ia' ? 'Gerado com IA' : 'Fallback local (IA instável)'}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {variations.length} variações prontas — aplique no criador
              </span>
            </div>

            {variations.map((v) => (
              <div
                key={v.id}
                className="p-3.5 rounded-2xl border border-border bg-card hover:border-purple-500/50 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground truncate">{v.label}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {v.palette.map((c, idx) => (
                      <span
                        key={idx}
                        title={c}
                        className="w-4 h-4 rounded-full border border-border inline-block"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs font-semibold text-foreground line-clamp-2">{v.hook}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {v.body}
                </p>
                <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                  <Palette className="w-3 h-3 mt-0.5 shrink-0 text-purple-500" />
                  <span className="line-clamp-2">{v.visual_direction}</span>
                </p>

                <div className="flex items-center justify-between pt-1.5 border-t border-border/60">
                  <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[60%]">
                    CTA: {v.cta}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleUse(v)}
                    className="h-8 text-[11px] font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                  >
                    Usar no criador
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            {variations.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Preparando variações…
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
