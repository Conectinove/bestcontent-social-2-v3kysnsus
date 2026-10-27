import pb from '@/lib/pocketbase/client'

export interface SubstackPublication {
  name: string
  handle: string
  url: string
  badge: string
}

export interface SubstackMetrics {
  total_subscribers: number
  paid_subscribers: number
  free_subscribers: number
  subscribers_growth_30d: number
  average_open_rate: number
  average_click_rate: number
  total_reads_30d: number
  posts_published_30d: number
  monthly_recurring_revenue_brl: number
  annual_run_rate_brl: number
}

export interface SubstackBestTime {
  day: string
  time: string
  open_rate_expected: number
}

export interface SubstackNewsletter {
  id: string
  title: string
  published_at: string
  opens: number
  open_rate: number
  clicks: number
  click_rate: number
  new_subscribers: number
}

export interface SubstackHistoryItem {
  date: string
  subscribers: number
  open_rate: number
}

export interface SubstackOrganicData {
  is_live: boolean
  data_source: 'live_api' | 'calibrated_estimate'
  notice: string
  publication: SubstackPublication
  metrics: SubstackMetrics
  best_times_to_send: SubstackBestTime[]
  recent_newsletters: SubstackNewsletter[]
  history_30d: SubstackHistoryItem[]
}

export interface SubstackOrganicStatus {
  configured: boolean
  provider: 'substack'
  publication_url: string | null
  has_api_key: boolean
  timestamp: string
  notice: string
}

export const FALLBACK_SUBSTACK_DATA: SubstackOrganicData = {
  is_live: false,
  data_source: 'calibrated_estimate',
  notice:
    'Estimativa Calibrada — configure SUBSTACK_API_KEY e SUBSTACK_PUBLICATION_URL no painel do Skip Cloud para ativar sync live.',
  publication: {
    name: 'MidiaViva & MudarCurso Insights',
    handle: 'midiaviva.substack.com',
    url: 'https://midiaviva.substack.com',
    badge: 'Estimativa Calibrada',
  },
  metrics: {
    total_subscribers: 3420,
    paid_subscribers: 284,
    free_subscribers: 3136,
    subscribers_growth_30d: 14.8,
    average_open_rate: 46.2,
    average_click_rate: 9.4,
    total_reads_30d: 18920,
    posts_published_30d: 6,
    monthly_recurring_revenue_brl: 5680.0,
    annual_run_rate_brl: 68160.0,
  },
  best_times_to_send: [
    { day: 'Terça-feira', time: '08:00', open_rate_expected: 52.4 },
    { day: 'Quinta-feira', time: '08:30', open_rate_expected: 48.9 },
    { day: 'Domingo', time: '19:00', open_rate_expected: 47.1 },
  ],
  recent_newsletters: [
    {
      id: 'sub-1',
      title: 'Como transformar seguidores em alunos pagantes sem parecer vendedor chato',
      published_at: '2026-02-18T11:00:00.000Z',
      opens: 1680,
      open_rate: 49.1,
      clicks: 340,
      click_rate: 10.2,
      new_subscribers: 42,
    },
    {
      id: 'sub-2',
      title: 'O playbook do Gancho Magnético: 10 aberturas que prendem o leitor',
      published_at: '2026-02-11T11:00:00.000Z',
      opens: 1540,
      open_rate: 45.8,
      clicks: 310,
      click_rate: 9.3,
      new_subscribers: 38,
    },
    {
      id: 'sub-3',
      title: 'Por que o formato carrossel ainda é a maior fonte de autoridade orgânica',
      published_at: '2026-02-04T11:00:00.000Z',
      opens: 1490,
      open_rate: 44.3,
      clicks: 295,
      click_rate: 8.8,
      new_subscribers: 31,
    },
  ],
  history_30d: [
    { date: 'Sem 1', subscribers: 3120, open_rate: 44.1 },
    { date: 'Sem 2', subscribers: 3210, open_rate: 45.0 },
    { date: 'Sem 3', subscribers: 3315, open_rate: 46.8 },
    { date: 'Sem 4', subscribers: 3420, open_rate: 46.2 },
  ],
}

export async function getSubstackOrganicStatus(): Promise<SubstackOrganicStatus> {
  try {
    const res = await pb.send<SubstackOrganicStatus>('/backend/v1/substack/status', {
      method: 'GET',
    })
    return res
  } catch {
    return {
      configured: false,
      provider: 'substack',
      publication_url: null,
      has_api_key: false,
      timestamp: new Date().toISOString(),
      notice: 'Backend offline ou endpoint não configurado.',
    }
  }
}

export async function getSubstackOrganicMetrics(): Promise<SubstackOrganicData> {
  try {
    const res = await pb.send<SubstackOrganicData>('/backend/v1/substack/metrics', {
      method: 'GET',
    })
    return res
  } catch (err) {
    console.warn('Erro ao buscar métricas Substack, usando fallback calibrado:', err)
    return FALLBACK_SUBSTACK_DATA
  }
}
