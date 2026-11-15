import React, { useEffect, useState } from 'react'
import { Download, Loader2, WandSparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { askExportAdvisor, type ExportAdvisorResult } from '@/services/export-advisor'
import type { AdvancedCustomizationState } from '@/components/workspace/AdvancedCustomizationPanel'

interface ExportAiAdviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Rede alvo da exportação (ex.: 'instagram', 'feed', 'studio'). */
  network: string
  /** O que está sendo exportado (ex.: título da mídia/post). */
  contentType: string
  /** Settings atuais da edição — contexto para o export-advisor. */
  settings: AdvancedCustomizationState
  /** Rótulo do botão de confirmação (ex.: "Baixar mídia"). */
  confirmLabel?: string
  /** Executado ao confirmar o download (fecha o dialog antes). */
  onConfirm: () => void
}

/**
 * Passo opcional de IA no fluxo de exportação final (pedido 4): antes de
 * baixar/rasterizar a mídia, mostra as sugestões do agente nativo
 * "export-advisor" (rota POST /backend/v1/ai/export-advisor, migration 0107).
 * O download SEMPRE fica disponível — a IA é sugestão, nunca bloqueio.
 * Reusa o serviço existente com fallback determinístico (sem rota nova).
 */
export const ExportAiAdviceDialog: React.FC<ExportAiAdviceDialogProps> = ({
  open,
  onOpenChange,
  network,
  contentType,
  settings,
  confirmLabel = 'Baixar mesmo assim',
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false)
  const [advice, setAdvice] = useState<ExportAdvisorResult | null>(null)

  useEffect(() => {
    if (!open) {
      setAdvice(null)
      return
    }
    let cancelled = false
    setLoading(true)
    askExportAdvisor({ network, contentType, settings })
      .then((res) => {
        if (!cancelled) setAdvice(res)
      })
      .catch(() => {
        // Sem advisor: o dialog ainda abre com o botão de baixar.
        if (!cancelled) setAdvice(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, network, contentType, settings])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <WandSparkles className="w-4 h-4 text-primary" />
            Sugestões da IA para a exportação
          </DialogTitle>
          <DialogDescription>
            Dicas do consultor de exportação antes de baixar — formato, rede e qualidade.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Consultando a IA…
          </div>
        )}

        {!loading && advice && (
          <div className="space-y-2">
            {advice.summary && (
              <p className="text-xs text-muted-foreground">
                {advice.summary}
                {advice.source === 'fallback' ? ' (modo offline)' : ''}
              </p>
            )}
            {advice.tips.length > 0 ? (
              <ul className="space-y-1">
                {advice.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-foreground/90 flex gap-1.5">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                Tudo pronto — nenhuma dica adicional para esta exportação.
              </p>
            )}
            {(advice.recommendedFormat || advice.recommendedRatio) && (
              <p className="text-[11px] text-muted-foreground">
                Recomendado: {advice.recommendedFormat}
                {advice.recommendedRatio ? ` · proporção ${advice.recommendedRatio}` : ''}
              </p>
            )}
          </div>
        )}

        {!loading && !advice && (
          <p className="py-2 text-xs text-muted-foreground">
            Consultor indisponível agora — você pode baixar normalmente.
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Voltar e ajustar
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => {
              onOpenChange(false)
              onConfirm()
            }}
          >
            <Download className="w-3.5 h-3.5" />
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExportAiAdviceDialog
