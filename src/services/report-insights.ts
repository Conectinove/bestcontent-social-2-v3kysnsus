import pb from '@/lib/pocketbase/client'

export interface ReportInsightsResult {
  success: boolean
  isAi: boolean
  summary: string
  whatWentWell: string[]
  whatWorsened: string[]
  recommendations: string[]
}

export interface ReportInsightsInput {
  periodDays: number
  networkFilter: string
  current: { postsCount: number; reach: number; avgEngagementRate: number; interactions: number }
  previous: { postsCount: number; reach: number; avgEngagementRate: number; interactions: number }
  diff: { posts: number; reach: number; engRate: number; interactions: number }
  highlights: {
    mostEngagedTitle?: string
    mostEngagedRate?: number
    highestReachTitle?: string
    highestReachValue?: number
    underperformingTitle?: string
    underperformingRate?: number
  }
  topNetworks: Array<{ name: string; engagementRate: number }>
}

const fmt = (n: number) => n.toLocaleString('pt-BR')

/** Fallback local: análise calculada a partir dos números comparativos (nunca vazio). */
export function buildLocalInsights(input: ReportInsightsInput): ReportInsightsResult {
  const d = input.diff
  const c = input.current
  const p = input.previous
  const sign = (v: number) => (v >= 0 ? `+${v}%` : `${v}%`)
  const up = (v: number) => v >= 0

  const good: string[] = []
  const bad: string[] = []
  if (up(d.reach)) good.push(`Alcance cresceu ${sign(d.reach)} vs o período anterior.`)
  else bad.push(`Alcance caiu ${sign(d.reach)} vs o período anterior.`)
  if (up(d.engRate))
    good.push(`Taxa média de engajamento subiu para ${c.avgEngagementRate}% (${sign(d.engRate)}).`)
  else
    bad.push(`Taxa de engajamento recuou de ${p.avgEngagementRate}% para ${c.avgEngagementRate}%.`)
  if (up(d.interactions))
    good.push(`Interações somam ${fmt(c.interactions)} (${sign(d.interactions)}).`)
  else bad.push(`Interações caíram ${sign(d.interactions)} no período.`)
  if (up(d.posts))
    good.push(`Ritmo de publicação aumentou: ${c.postsCount} posts (${sign(d.posts)}).`)
  else bad.push(`Menos posts publicados: ${c.postsCount} vs ${p.postsCount}.`)
  if (good.length === 0)
    good.push('Os indicadores ficaram estáveis — momento para testar novos formatos.')
  if (bad.length === 0) bad.push('Nenhuma métrica piorou de forma relevante neste recorte.')

  const bestNetwork = input.topNetworks[0]
  const recs = [
    up(d.engRate)
      ? `Reproduza o formato do post mais engajado${input.highlights.mostEngagedTitle ? ` ("${input.highlights.mostEngagedTitle}")` : ''} nas próximas 2 semanas.`
      : `Refaça os ganchos dos posts recentes: engajamento caiu ${sign(d.engRate)} — teste aberturas com pergunta ou estatística.`,
    bestNetwork
      ? `Dobre a frequência em ${bestNetwork.name} (melhor taxa média: ${bestNetwork.engagementRate}%) e reaproveite os campeões lá.`
      : 'Priorize a rede com melhor taxa média de engajamento no ranking por canal.',
    up(d.reach)
      ? `Distribua o alcance extra em CTA de conversão — alcance subiu ${sign(d.reach)}, use o tráfego para captar leads.`
      : `Reforce a distribuição: alcance caiu ${sign(d.reach)} — republique os melhores conteúdos com nova arte/legenda.`,
  ]

  const summary = `Nos últimos ${input.periodDays} dias, ${c.postsCount} posts geraram ${fmt(c.interactions)} interações e alcance de ${fmt(c.reach)} (variação de ${sign(d.interactions)} em interações e ${sign(d.reach)} em alcance vs o período anterior). A taxa média de engajamento está em ${c.avgEngagementRate}% (${sign(d.engRate)}).`
  return {
    success: true,
    isAi: false,
    summary,
    whatWentWell: good,
    whatWorsened: bad,
    recommendations: recs,
  }
}

/**
 * Gera o resumo de insights via endpoint próprio da casa (/backend/v1/ai/report-insights, $ai.chat
 * no servidor) com fallback local garantido — nunca deixa o painel vazio.
 */
export async function generateReportInsights(
  input: ReportInsightsInput,
): Promise<ReportInsightsResult> {
  try {
    const res = (await pb.send('/backend/v1/ai/report-insights', {
      method: 'POST',
      body: {
        periodLabel: `Últimos ${input.periodDays} dias${
          input.networkFilter !== 'all' ? ` · rede: ${input.networkFilter}` : ' · todas as redes'
        }`,
        metrics: {
          current: input.current,
          previous: input.previous,
          diffPct: input.diff,
          highlights: input.highlights,
          topNetworks: input.topNetworks,
        },
      },
    })) as Record<string, unknown>

    const insights = res?.insights as Record<string, unknown> | undefined
    const summary = String(insights?.summary || '').trim()
    const toList = (v: unknown): string[] =>
      Array.isArray(v) ? v.map((i) => String(i)).filter(Boolean) : []
    const doingWell = toList(insights?.doingWell)
    const worsened = toList(insights?.worsened)
    const recs = toList(insights?.recommendations)

    if (summary && doingWell.length > 0 && recs.length > 0) {
      return {
        success: true,
        isAi: true,
        summary,
        whatWentWell: doingWell,
        whatWorsened: worsened,
        recommendations: recs.slice(0, 4),
      }
    }
    return buildLocalInsights(input)
  } catch {
    return buildLocalInsights(input)
  }
}
