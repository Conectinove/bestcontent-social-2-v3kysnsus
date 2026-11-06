import pb from '@/lib/pocketbase/client'

export interface ScheduledPostRecord {
  id: string
  created: string
  updated: string
  user: string
  post: string
  brand?: string
  scheduled_at: string
  status: 'scheduled' | 'published' | 'cancelled' | 'failed'
  platform?: string
  auto_queue?: boolean
  is_recurring?: boolean
  recurrence_rule?: 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'custom'
  recurrence_days?: string // ex: "1,2,3,4,5" (seg-sex)
  recurrence_time?: string // ex: "10:00"
  recurrence_end_at?: string
  last_executed_at?: string
  next_run_at?: string
  expand?: {
    post?: {
      id: string
      title?: string
      caption?: string
      status?: string
      scheduled_at?: string
      image_url?: string
      brand?: string
    }
    brand?: {
      id: string
      name: string
    }
  }
}

export const getScheduledPosts = (userId: string): Promise<ScheduledPostRecord[]> =>
  pb.collection('scheduled_posts').getFullList<ScheduledPostRecord>({
    filter: `user = "${userId}"`,
    sort: 'scheduled_at',
    expand: 'post,post.brand',
  })

function sanitizeScheduledPayload(data: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = { ...data }
  const relationKeys = ['post', 'brand', 'user']
  for (const k of relationKeys) {
    if (k in cleaned) {
      const v = cleaned[k]
      if (
        v === null ||
        v === undefined ||
        v === '' ||
        v === 'all' ||
        v === 'undefined' ||
        v === 'null'
      ) {
        delete cleaned[k]
      }
    }
  }
  return cleaned
}

export const createScheduledPost = (data: Record<string, unknown>): Promise<ScheduledPostRecord> =>
  pb.collection('scheduled_posts').create<ScheduledPostRecord>(sanitizeScheduledPayload(data))

export const updateScheduledPost = (
  id: string,
  data: Record<string, unknown>,
): Promise<ScheduledPostRecord> =>
  pb.collection('scheduled_posts').update<ScheduledPostRecord>(id, sanitizeScheduledPayload(data))

export const deleteScheduledPost = (id: string): Promise<boolean> =>
  pb.collection('scheduled_posts').delete(id)

/**
 * Calcula a próxima execução de um agendamento recorrente
 */
export function calculateNextRecurringDate(
  rule: 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'custom',
  time: string = '10:00',
  days: number[] = [1, 2, 3, 4, 5],
  baseDate: Date = new Date(),
): Date {
  const [hours, mins] = time.split(':').map((v) => parseInt(v, 10) || 0)
  const candidate = new Date(baseDate)
  candidate.setHours(hours, mins, 0, 0)

  // Se o horário de hoje já passou, começa olhando para amanhã
  if (candidate.getTime() <= baseDate.getTime()) {
    candidate.setDate(candidate.getDate() + 1)
  }

  if (rule === 'daily') {
    return candidate
  }

  if (rule === 'weekdays') {
    while (candidate.getDay() === 0 || candidate.getDay() === 6) {
      candidate.setDate(candidate.getDate() + 1)
    }
    return candidate
  }

  if (rule === 'weekly') {
    return candidate
  }

  if (rule === 'custom' && days.length > 0) {
    for (let i = 0; i < 14; i++) {
      if (days.includes(candidate.getDay())) {
        return candidate
      }
      candidate.setDate(candidate.getDate() + 1)
    }
  }

  if (rule === 'monthly') {
    candidate.setMonth(candidate.getMonth() + 1)
    return candidate
  }

  return candidate
}
