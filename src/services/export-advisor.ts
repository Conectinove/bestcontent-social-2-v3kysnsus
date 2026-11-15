/**
 * Serviço do "Consultor de Exportação" — agente NATIVO do Skip Cloud
 * (export-advisor-agent, migration 0107). Analisa o estado atual da edição +
 * destino do arquivo e recomenda ajustes finais ANTES de baixar. O fallback
 * determinístico vive no hook (sempre há resposta aplicável).
 */
import pb from '@/lib/pocketbase/client'

export interface ExportAdvisorResult {
  success: boolean
  source: 'agent' | 'fallback'
  tips: string[]
  recommendedFormat: string
  recommendedRatio: string
  summary: string
}

export async function askExportAdvisor(input: {
  network?: string
  aspectRatio?: string
  contentType?: string
  settings: unknown
}): Promise<ExportAdvisorResult> {
  try {
    const res = await pb.send<ExportAdvisorResult>('/backend/v1/ai/export-advisor', {
      method: 'POST',
      body: {
        network: input.network || 'Instagram',
        aspectRatio: input.aspectRatio || '16:9',
        contentType: input.contentType || 'post estático',
        settings: input.settings,
      },
    })
    return {
      success: !!res?.success,
      source: res?.source === 'agent' ? 'agent' : 'fallback',
      tips: Array.isArray(res?.tips) ? res.tips : [],
      recommendedFormat: res?.recommendedFormat || 'PNG',
      recommendedRatio: res?.recommendedRatio || '',
      summary: res?.summary || '',
    }
  } catch {
    return {
      success: false,
      source: 'fallback',
      tips: [],
      recommendedFormat: 'PNG',
      recommendedRatio: '',
      summary: 'Consultor de exportação indisponível agora — tente novamente em instantes.',
    }
  }
}
