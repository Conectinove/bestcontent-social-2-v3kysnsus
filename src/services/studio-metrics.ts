import { StudioCreationRecord, StudioMediaType } from './ai-studio'

export interface StudioUsageMetrics {
  totalCreations: number
  creationsByType: {
    video: number
    image: number
    audio: number
  }
  creditsSpentTotal: number
  creditsSpentMonth: number
  mostUsedModel: {
    id: string
    name: string
    count: number
    type: StudioMediaType
    percentage: number
  }
  creationsByWeek: {
    label: string // Ex: "Sem 1", "Sem 2", "Sem 3", "Sem 4"
    count: number
    credits: number
  }[]
  externalApiCount: number
  localCalibratedCount: number
  averageRelativeCost: number
}

/**
 * Calcula métricas de uso a partir da lista real de studio_creations
 */
export function calculateStudioUsageMetrics(creations: StudioCreationRecord[]): StudioUsageMetrics {
  const total = creations.length

  if (total === 0) {
    return {
      totalCreations: 0,
      creationsByType: { video: 0, image: 0, audio: 0 },
      creditsSpentTotal: 0,
      creditsSpentMonth: 0,
      mostUsedModel: {
        id: 'nano-banana-2-flash',
        name: 'Nano Banana 2 Flash Lite',
        count: 0,
        type: 'image',
        percentage: 0,
      },
      creationsByWeek: [
        { label: 'Sem 1', count: 0, credits: 0 },
        { label: 'Sem 2', count: 0, credits: 0 },
        { label: 'Sem 3', count: 0, credits: 0 },
        { label: 'Sem 4', count: 0, credits: 0 },
      ],
      externalApiCount: 0,
      localCalibratedCount: 0,
      averageRelativeCost: 1.0,
    }
  }

  const byType: { video: number; image: number; audio: number } = { video: 0, image: 0, audio: 0 }
  const modelCounts: Record<
    string,
    { id: string; name: string; type: StudioMediaType; count: number }
  > = {}

  let totalCredits = 0
  let monthCredits = 0
  let sumRelativeCost = 0
  let externalCount = 0

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Distribuição semanal (últimas 4 semanas)
  const weekBuckets = [
    { label: 'Sem 1', count: 0, credits: 0 },
    { label: 'Sem 2', count: 0, credits: 0 },
    { label: 'Sem 3', count: 0, credits: 0 },
    { label: 'Sem 4', count: 0, credits: 0 },
  ]

  creations.forEach((item) => {
    // Tipo
    if (item.type && byType[item.type] !== undefined) {
      byType[item.type]++
    }

    // Créditos
    const credits = typeof item.credits_used === 'number' ? item.credits_used : 20
    totalCredits += credits

    // Data
    const createdDate = item.created ? new Date(item.created) : now
    if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
      monthCredits += credits
    }

    // Semanas (distribuição por dia do mês)
    const day = createdDate.getDate()
    const weekIdx = Math.min(3, Math.floor((day - 1) / 7))
    weekBuckets[weekIdx].count++
    weekBuckets[weekIdx].credits += credits

    // Modelo
    const mId = item.model_id || 'default-model'
    const mName = item.model_name || 'Modelo Studio'
    if (!modelCounts[mId]) {
      modelCounts[mId] = {
        id: mId,
        name: mName,
        type: item.type || 'image',
        count: 0,
      }
    }
    modelCounts[mId].count++

    // Custo relativo
    sumRelativeCost += typeof item.relative_cost === 'number' ? item.relative_cost : 1.0

    // API externa
    if ((item as any).is_external_api) {
      externalCount++
    }
  })

  // Modelo mais usado
  let topModel = {
    id: 'nano-banana-2-flash',
    name: 'Nano Banana 2 Flash Lite',
    count: 0,
    type: 'image' as StudioMediaType,
    percentage: 0,
  }

  const sortedModels = Object.values(modelCounts).sort((a, b) => b.count - a.count)
  if (sortedModels.length > 0) {
    const best = sortedModels[0]
    topModel = {
      id: best.id,
      name: best.name,
      count: best.count,
      type: best.type,
      percentage: total > 0 ? Math.round((best.count / total) * 100) : 0,
    }
  }

  return {
    totalCreations: total,
    creationsByType: byType,
    creditsSpentTotal: totalCredits,
    creditsSpentMonth: monthCredits || totalCredits,
    mostUsedModel: topModel,
    creationsByWeek: weekBuckets,
    externalApiCount: externalCount,
    localCalibratedCount: total - externalCount,
    averageRelativeCost: Number((sumRelativeCost / total).toFixed(2)),
  }
}

// Alias para compatibilidade
export const calculateStudioMetrics = calculateStudioUsageMetrics
