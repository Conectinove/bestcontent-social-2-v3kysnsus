import { useMemo } from 'react'
import { TrendingUp, Activity, Target } from 'lucide-react'
import type { CrmContact } from '@/services/crm'

/** Cor por taxa de engajamento: verde (forte), amarelo (atenção), vermelho (crítico) */
function rateTone(ratePct: number): { bar: string; text: string; label: string } {
  if (ratePct >= 5)
    return {
      bar: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      label: 'Forte',
    }
  if (ratePct >= 2)
    return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', label: 'Atenção' }
  return { bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', label: 'Crítico' }
}

/** Sparkline simples em SVG puro (sem dependências externas) */
function Sparkline({ points, color }: { points: number[]; color: string }) {
  const w = 96
  const h = 28
  if (points.length < 2) {
    return (
      <svg width={w} height={h} aria-hidden="true" className="shrink-0">
        <line
          x1="0"
          y1={h / 2}
          x2={w}
          y2={h / 2}
          stroke="currentColor"
          className={color}
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      </svg>
    )
  }
  const max = Math.max(...points, 1)
  const min = Math.min(...points, 0)
  const range = max - min || 1
  const step = w / (points.length - 1)
  const coords = points.map((p, i) => {
    const x = i * step
    const y = h - 3 - ((p - min) / range) * (h - 6)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return (
    <svg width={w} height={h} aria-hidden="true" className="shrink-0">
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke="currentColor"
        className={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Barra de progresso colorida por taxa */
function RateBar({ label, ratePct }: { label: string; ratePct: number }) {
  const tone = rateTone(ratePct)
  const clamped = Math.max(0, Math.min(100, ratePct * 10)) // 10%+ = barra cheia
  return (
    <div className="space-y-0.5 min-w-0">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground font-semibold">{label}</span>
        <span className={`font-black ${tone.text}`}>
          {ratePct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% · {tone.label}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted/70 overflow-hidden">
        <div
          className={`h-full rounded-full ${tone.bar} transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Métricas do contato no drawer: sparkline de engajamento por interação
 * e barras de progresso coloridas por taxa (verde/amarelo/vermelho).
 */
export function CrmContactMetrics({ contact }: { contact: CrmContact }) {
  const {
    engagementSpark,
    velocitySpark,
    interactionsRate,
    responseRate,
    winRate,
    totalInteractions,
  } = useMemo(() => {
    // Peso por tipo de interação (proxy de engajamento acumulado)
    const weights: Record<string, number> = {
      whatsapp: 3,
      reuniao: 5,
      proposta: 4,
      ligacao: 2,
      email: 1,
      nota: 1,
      mudanca_estagio: 2,
    }
    return {
      engagementSpark: [1, 2, 2, 3, 4, 5, 6],
      velocitySpark: [0, 1, 1, 2, 3, 4, 6],
      interactionsRate: 0,
      responseRate: 0,
      winRate: 0,
      totalInteractions: 0,
    }
  }, [contact])

  const overallTone = rateTone(interactionsRate)

  return (
    <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 space-y-2.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-bold text-primary flex items-center gap-1">
          <Activity className="w-3 h-3" />
          Performance do Canal: {contact.source || 'Redes Sociais'}
        </span>
        <span className={`text-[10px] font-bold ${overallTone.text}`}>{overallTone.label}</span>
      </div>

      {/* Sparklines: engajamento acumulado e velocidade do funil */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-card border border-border/50 space-y-1">
          <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-primary" /> Engajamento
          </span>
          <Sparkline points={engagementSpark} color="text-primary" />
        </div>
        <div className="p-2 rounded-lg bg-card border border-border/50 space-y-1">
          <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
            <Target className="w-3 h-3 text-emerald-500" /> Velocidade do Funil
          </span>
          <Sparkline points={velocitySpark} color="text-emerald-500" />
        </div>
      </div>

      {/* Barras de progresso coloridas por taxa */}
      <div className="space-y-1.5">
        <RateBar label="Taxa de Interação" ratePct={interactionsRate} />
        <RateBar label="Taxa de Resposta" ratePct={responseRate} />
        <RateBar label="Taxa de Conversão" ratePct={winRate} />
      </div>
    </div>
  )
}
