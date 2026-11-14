import { useState } from 'react'
import { Sparkles, Loader2, RefreshCw, TrendingUp, TrendingDown, Lightbulb, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  generateReportInsights,
  type ReportInsightsInput,
  type ReportInsightsResult,
} from '@/services/report-insights'
import { toast } from '@/hooks/use-toast'

interface AiInsightsPanelProps {
  input: ReportInsightsInput
}

export function AiInsightsPanel({ input }: AiInsightsPanelProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReportInsightsResult | null>(null)
  const [visible, setVisible] = useState(false)
  const [lastInput, setLastInput] = useState<ReportInsightsInput>(input)

  const run = async () => {
    setLoading(true)
    setVisible(true)
    const snapshot: ReportInsightsInput = input
    setLastInput(snapshot)
    try {
      const res = await generateReportInsights(snapshot)
      setResult(res)
    } catch {
      toast({
        title: 'IA indisponível',
        description: 'Exibindo análise calculada localmente a partir dos dados do período.',
      })
      setVisible(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4 md:p-5 rounded-3xl border border-purple-500/25 bg-gradient-to-br from-purple-950/15 via-background to-blue-950/10 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-600 border border-purple-500/25">
              IA
            </span>
            <span className="text-xs text-muted-foreground">
              Resumo gerado sobre os dados filtrados (janela de {lastInput.periodDays} dias
              {lastInput.networkFilter !== 'all' ? ` · ${lastInput.networkFilter}` : ''})
            </span>
          </div>
          <h3 className="text-base md:text-lg font-black text-foreground mt-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Análise com IA dos Relatórios de Performance
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={run}
            disabled={loading}
            className="rounded-xl text-xs h-9 px-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1.5 min-h-[36px]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {result ? 'Regenerar' : 'Analisar com IA'}
          </Button>
          {result && visible && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setVisible(false)}
              aria-label="Fechar painel de insights"
              className="h-9 w-9 rounded-xl text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {!result && !loading && (
        <p className="text-xs text-muted-foreground">
          Clique em “Analisar com IA” para gerar um resumo do que está indo bem, do que piorou e 3
          recomendações acionáveis — calculado sobre os mesmos números do comparativo de períodos.
        </p>
      )}

      {loading && (
        <div className="space-y-2">
          <div className="h-3 w-3/4 rounded-full bg-muted animate-pulse" />
          <div className="h-3 w-2/3 rounded-full bg-muted animate-pulse" />
          <div className="h-3 w-1/2 rounded-full bg-muted animate-pulse" />
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Analisando métricas do período…
          </p>
        </div>
      )}

      {result && visible && !loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={
                result.isAi
                  ? 'text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                  : 'text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
              }
            >
              {result.isAi ? 'Gerado por IA' : 'Análise local (IA indisponível)'}
            </Badge>
          </div>

          <p className="text-sm text-foreground/90 leading-relaxed">{result.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5">
              <p className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                O que está indo bem
              </p>
              <ul className="space-y-1">
                {result.whatWentWell.map((item, i) => (
                  <li key={i} className="text-xs text-foreground/85 flex gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-1.5">
              <p className="text-[11px] font-black uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5" />
                O que piorou
              </p>
              <ul className="space-y-1">
                {result.whatWorsened.map((item, i) => (
                  <li key={i} className="text-xs text-foreground/85 flex gap-1.5">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-blue-500/30 bg-blue-500/5 space-y-1.5">
            <p className="text-[11px] font-black uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              Recomendações acionáveis
            </p>
            <ol className="space-y-1.5">
              {result.recommendations.map((item, i) => (
                <li key={i} className="text-xs text-foreground/85 flex gap-2">
                  <span className="font-black text-blue-600">{i + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Card>
  )
}

export default AiInsightsPanel
