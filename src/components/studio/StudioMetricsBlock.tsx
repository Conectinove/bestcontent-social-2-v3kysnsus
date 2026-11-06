import React from 'react'
import {
  BarChart3,
  Video,
  Image as ImageIcon,
  Mic,
  Coins,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  Zap,
  Layers,
  CheckCircle2,
  Cpu,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StudioUsageMetrics } from '@/services/studio-metrics'

interface StudioMetricsBlockProps {
  metrics: StudioUsageMetrics | null
  loading?: boolean
  externalStatusBadge?: string
}

export const StudioMetricsBlock: React.FC<StudioMetricsBlockProps> = ({
  metrics,
  loading = false,
  externalStatusBadge,
}) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!metrics || metrics.totalCreations === 0) {
    return (
      <Card className="border-border/80 bg-gradient-to-br from-card via-card to-muted/20">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            Métricas de Uso do AI Studio
          </CardTitle>
          {externalStatusBadge && (
            <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300">
              {externalStatusBadge}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-xl space-y-1">
            <Sparkles className="w-6 h-6 mx-auto text-purple-400/60" />
            <p className="font-semibold text-foreground">Ainda não há criações registradas</p>
            <p className="text-[11px]">
              Gere seus primeiros vídeos, imagens ou áudios para visualizar métricas em tempo real.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const {
    totalCreations,
    creationsByType,
    creditsSpentMonth,
    creditsSpentTotal,
    creditsSpentLastMonth,
    trendVsLastMonthPercentage,
    trendCreationsPercentage,
    costPerRealCreation,
    costPerLocalCreation,
    externalSuccessRate,
    fallbackRate,
    syncedToLibraryCount,
    syncedPercentage,
    mostUsedModel,
    creationsByWeek,
    externalApiCount,
    localCalibratedCount,
    averageRelativeCost,
  } = metrics

  const maxWeeklyCount = Math.max(...creationsByWeek.map((w) => w.count), 1)
  const maxTypeCount = Math.max(
    creationsByType.video,
    creationsByType.image,
    creationsByType.audio,
    1,
  )

  return (
    <Card className="border-border/80 bg-gradient-to-br from-card via-card to-purple-950/10 shadow-sm overflow-hidden">
      <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold font-archivo tracking-tight">
              Métricas de Uso do AI Studio
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Consumo real de criações, modelos multimodais e créditos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {externalStatusBadge && (
            <Badge
              variant="outline"
              className="text-[10px] border-purple-500/40 text-purple-300 bg-purple-950/20"
            >
              {externalStatusBadge}
            </Badge>
          )}
          <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-[10px]">
            {totalCreations} produções no total
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Grid de KPIs Principais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Card 1: Gerações por Aba */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span className="font-semibold text-foreground">Gerações por Aba</span>
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
            </div>

            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[11px] text-purple-300">
                  <Video className="w-3 h-3 text-purple-400" /> Vídeo
                </span>
                <span className="font-bold font-mono text-foreground">{creationsByType.video}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[11px] text-pink-300">
                  <ImageIcon className="w-3 h-3 text-pink-400" /> Imagem
                </span>
                <span className="font-bold font-mono text-foreground">{creationsByType.image}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[11px] text-blue-300">
                  <Mic className="w-3 h-3 text-blue-400" /> Áudio
                </span>
                <span className="font-bold font-mono text-foreground">{creationsByType.audio}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Modelo Mais Usado */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span className="font-semibold text-foreground">Modelo Mais Usado</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>

            <div className="pt-0.5">
              <span className="font-bold text-foreground text-xs line-clamp-1">
                {mostUsedModel.name}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="outline" className="text-[10px] py-0 uppercase font-mono">
                  {mostUsedModel.type}
                </Badge>
                <span className="text-[11px] text-emerald-400 font-bold font-mono">
                  {mostUsedModel.count} ({mostUsedModel.percentage}%)
                </span>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/40">
              Custo médio: <strong className="text-foreground">{averageRelativeCost}×</strong>
            </p>
          </div>

          {/* Card 3: Créditos Gastos no Mês e Total */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span className="font-semibold text-foreground">Créditos Gastos</span>
              <Coins className="w-3.5 h-3.5 text-amber-400" />
            </div>

            <div className="pt-0.5">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black font-archivo text-amber-400">
                  {creditsSpentMonth.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-muted-foreground">no mês</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Total acumulado:{' '}
                <strong className="text-foreground font-mono">
                  {creditsSpentTotal.toLocaleString('pt-BR')}
                </strong>
              </p>
            </div>

            <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/40">
              Débito dinâmico por modelo ativo
            </p>
          </div>

          {/* Card 4: Distribuição por Semana */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span className="font-semibold text-foreground">Criações por Semana</span>
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            </div>

            {/* Minigráfico de barras CSS */}
            <div className="flex items-end justify-between gap-1.5 h-12 pt-1">
              {creationsByWeek.map((week, idx) => {
                const heightPercent =
                  maxWeeklyCount > 0
                    ? Math.max(12, Math.round((week.count / maxWeeklyCount) * 100))
                    : 12

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full bg-muted rounded-t relative flex items-end h-8 overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-purple-600 to-indigo-400 rounded-t transition-all"
                        style={{ height: `${heightPercent}%` }}
                        title={`${week.label}: ${week.count} produções (${week.credits} créditos)`}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground">{week.label}</span>
                  </div>
                )
              })}
            </div>

            {externalApiCount > 0 && (
              <p className="text-[10px] text-emerald-400 pt-0.5 font-medium">
                {externalApiCount} via API Externa Oficial
              </p>
            )}
          </div>
        </div>

        {/* ================= BLOCO APROFUNDADO: TENDÊNCIAS, COMPARATIVO LADO A LADO E CUSTO REAL ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          {/* Coluna 1: Tendência vs Mês Anterior */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span className="font-semibold text-foreground">Tendência vs Mês Anterior</span>
              {trendVsLastMonthPercentage >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Consumo de créditos:</span>
                <span
                  className={`font-mono font-bold flex items-center gap-1 ${
                    trendVsLastMonthPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {trendVsLastMonthPercentage >= 0 ? '+' : ''}
                  {trendVsLastMonthPercentage}%
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Volume de produções:</span>
                <span
                  className={`font-mono font-bold ${
                    trendCreationsPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {trendCreationsPercentage >= 0 ? '+' : ''}
                  {trendCreationsPercentage}%
                </span>
              </div>
              <div className="pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground flex justify-between">
                <span>Mês passado: {creditsSpentLastMonth.toLocaleString('pt-BR')} créditos</span>
                <span className="font-mono text-foreground font-semibold">
                  {metrics.creationsLastMonth} criações
                </span>
              </div>
            </div>
          </div>

          {/* Coluna 2: Comparativo Entre Abas (Barras Proporcionais) */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span className="font-semibold text-foreground">Comparativo Entre Abas</span>
              <Layers className="w-3.5 h-3.5 text-purple-400" />
            </div>

            <div className="space-y-2 pt-0.5">
              {/* Barra Vídeo */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-purple-300">
                    <Video className="w-3 h-3 text-purple-400" /> Vídeo
                  </span>
                  <span className="font-mono font-semibold">
                    {creationsByType.video} (
                    {totalCreations > 0
                      ? Math.round((creationsByType.video / totalCreations) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{
                      width: `${Math.max(6, Math.round((creationsByType.video / maxTypeCount) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Barra Imagem */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-pink-300">
                    <ImageIcon className="w-3 h-3 text-pink-400" /> Imagem
                  </span>
                  <span className="font-mono font-semibold">
                    {creationsByType.image} (
                    {totalCreations > 0
                      ? Math.round((creationsByType.image / totalCreations) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 rounded-full transition-all"
                    style={{
                      width: `${Math.max(6, Math.round((creationsByType.image / maxTypeCount) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Barra Áudio */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-blue-300">
                    <Mic className="w-3 h-3 text-blue-400" /> Áudio
                  </span>
                  <span className="font-mono font-semibold">
                    {creationsByType.audio} (
                    {totalCreations > 0
                      ? Math.round((creationsByType.audio / totalCreations) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: `${Math.max(6, Math.round((creationsByType.audio / maxTypeCount) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 3: Chamadas Reais vs Fallback Local e Sync com Biblioteca */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span className="font-semibold text-foreground">Execução & Eficiência Real</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>

            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Custo por criação real:</span>
                <span className="font-mono font-bold text-amber-400">
                  {costPerRealCreation > 0 ? `${costPerRealCreation} cr` : 'N/D (sem API)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Custo modo local:</span>
                <span className="font-mono font-semibold text-foreground">
                  {costPerLocalCreation} cr
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Taxa API externa / Fallback:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {externalSuccessRate}%{' '}
                  <span className="text-muted-foreground font-normal">/ {fallbackRate}%</span>
                </span>
              </div>

              <div className="pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 text-purple-300">
                  <CheckCircle2 className="w-3 h-3 text-purple-400" /> Sync Biblioteca:
                </span>
                <span className="font-mono font-bold text-foreground">
                  {syncedToLibraryCount} ({syncedPercentage}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
