import { Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface VideoMilestones {
  m25: number
  m50: number
  m75: number
  m100: number
}

interface PortalVideoEngagementChartProps {
  /** Id da mídia selecionada no ranking (truncado no título). */
  mediaId: string
  plays: number
  milestones?: VideoMilestones
}

const STEPS: Array<{ pct: number; key: keyof VideoMilestones; label: string }> = [
  { pct: 25, key: 'm25', label: '25%' },
  { pct: 50, key: 'm50', label: '50%' },
  { pct: 75, key: 'm75', label: '75%' },
  { pct: 100, key: 'm100', label: '100%' },
]

/**
 * Gráfico de engajamento ao longo do vídeo (pedido "adicionar grafico de
 * engajamento ao longo do video"): eixo X = % da duração (marcos 25/50/75/100
 * gravados pelo player público), eixo Y = espectadores que alcançaram cada
 * marco. Estilizado só com tokens do tema (mesmo padrão do gráfico de 30 dias).
 */
export function PortalVideoEngagementChart({
  mediaId,
  plays,
  milestones,
}: PortalVideoEngagementChartProps) {
  const total = Math.max(1, plays || 0)
  const values = milestones ? STEPS.map((s) => milestones[s.key] || 0) : STEPS.map(() => 0)
  const max = Math.max(1, ...values)
  const hasData = values.some((v) => v > 0)

  return (
    <div className="mx-2 mb-2 rounded-md border border-border/60 bg-muted/30 p-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        <Activity className="w-3 h-3 text-primary" />
        Engajamento ao longo do vídeo
        <span className="font-medium normal-case text-foreground/70">· {mediaId.slice(0, 8)}…</span>
      </p>

      {!hasData ? (
        <p className="text-[11px] text-muted-foreground py-2">
          Sem marcos de progresso registrados para este vídeo ainda. O gráfico aparece quando os
          visitantes começam a assistir (25% · 50% · 75% · 100%).
        </p>
      ) : (
        <>
          <div className="flex items-end gap-2 h-24">
            {STEPS.map((s, i) => {
              const h = Math.round((values[i] / max) * 100)
              const pctOfPlays = Math.round((values[i] / total) * 100)
              return (
                <div
                  key={s.pct}
                  className="flex-1 h-full flex flex-col justify-end items-center gap-1 group"
                  title={`${s.label} da duração: ${values[i]} de ${total} espectador${total === 1 ? '' : 'es'} (${pctOfPlays}%)`}
                >
                  <span className="text-[9px] font-semibold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {values[i]} · {pctOfPlays}%
                  </span>
                  <div
                    className={cn(
                      'w-full rounded-t bg-primary/80 group-hover:bg-primary transition-colors',
                      // Marcos mais fundos no vídeo ganham peso visual maior.
                      s.pct === 100 && 'bg-emerald-500/80 group-hover:bg-emerald-500',
                    )}
                    style={{ height: `${Math.max(h, values[i] > 0 ? 8 : 2)}%` }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex gap-2">
            {STEPS.map((s) => (
              <div
                key={s.pct}
                className="flex-1 text-center text-[9px] text-muted-foreground leading-none"
              >
                {s.label}
              </div>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground">
            {plays} espectador{plays === 1 ? '' : 'es'} únicos (por sessão) · % da duração no eixo
            X.
          </p>
        </>
      )}
    </div>
  )
}
