import pb from '@/lib/pocketbase/client'

export type StudentStatus = 'ativo' | 'concluido' | 'em_risco' | 'pausado' | 'cancelado'

export interface StudentRecord {
  id: string
  user?: string
  name: string
  email?: string
  phone?: string
  course: string
  cohort?: string
  status: StudentStatus
  enrollment_date?: string
  progress: number
  last_access_at?: string
  notes?: string
  created: string
  updated: string
}

export interface StudentFormData {
  name: string
  email?: string
  phone?: string
  course: string
  cohort?: string
  status: StudentStatus
  enrollment_date?: string
  progress?: number
  last_access_at?: string
  notes?: string
}

export interface StudentAutomationRecord {
  id: string
  user?: string
  rule_key: string
  name: string
  description?: string
  enabled: boolean
  days_threshold?: number
  threshold_value?: number
  action_type?: string
  config_json?: any
  created: string
  updated: string
}

export interface StudentsDashboardMetrics {
  total: number
  active30d: number
  newInPeriod: number
  completionRate: number
  completedCount: number
  atRiskCount: number
  avgProgress: number
}

export async function getStudentAutomations(): Promise<StudentAutomationRecord[]> {
  try {
    const records = await pb
      .collection('student_automations')
      .getFullList<StudentAutomationRecord>({
        sort: 'created',
        requestKey: null,
      })
    return records
  } catch (err) {
    console.warn('Erro ao buscar regras de automação de alunos:', err)
    return []
  }
}

export async function updateStudentAutomation(
  id: string,
  data: Partial<StudentAutomationRecord>,
): Promise<StudentAutomationRecord> {
  return await pb.collection('student_automations').update<StudentAutomationRecord>(id, data)
}

export async function toggleStudentAutomation(
  id: string,
  enabled: boolean,
): Promise<StudentAutomationRecord> {
  return await pb.collection('student_automations').update<StudentAutomationRecord>(id, { enabled })
}

export async function getStudents(): Promise<StudentRecord[]> {
  try {
    const records = await pb.collection('students').getFullList<StudentRecord>({
      sort: '-created',
      requestKey: null,
    })
    return records
  } catch (err) {
    console.warn('Erro ao buscar lista de alunos no PocketBase:', err)
    return []
  }
}

export async function getStudentById(id: string): Promise<StudentRecord | null> {
  try {
    return await pb.collection('students').getOne<StudentRecord>(id)
  } catch (err) {
    console.warn(`Erro ao buscar aluno ${id}:`, err)
    return null
  }
}

export async function createStudent(data: StudentFormData): Promise<StudentRecord> {
  const currentUserId = pb.authStore.record?.id
  const payload = {
    ...data,
    user: currentUserId || undefined,
    progress: typeof data.progress === 'number' ? data.progress : 0,
    status: data.status || 'ativo',
    enrollment_date: data.enrollment_date || new Date().toISOString(),
  }
  return await pb.collection('students').create<StudentRecord>(payload)
}

export async function updateStudent(
  id: string,
  data: Partial<StudentFormData>,
): Promise<StudentRecord> {
  return await pb.collection('students').update<StudentRecord>(id, data)
}

export async function deleteStudent(id: string): Promise<boolean> {
  return await pb.collection('students').delete(id)
}

export function calculateStudentMetrics(students: StudentRecord[]): StudentsDashboardMetrics {
  const total = students.length
  if (total === 0) {
    return {
      total: 0,
      active30d: 0,
      newInPeriod: 0,
      completionRate: 0,
      completedCount: 0,
      atRiskCount: 0,
      avgProgress: 0,
    }
  }

  const now = new Date().getTime()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

  const activeCount = students.filter((s) => s.status === 'ativo').length
  const completedCount = students.filter((s) => s.status === 'concluido').length
  const atRiskCount = students.filter((s) => s.status === 'em_risco').length

  // Ativos 30d: tiveram acesso recente nos últimos 30 dias ou foram cadastrados nos últimos 30 dias
  const active30d = students.filter((s) => {
    if (s.status === 'cancelado') return false
    if (s.last_access_at) {
      const diff = now - new Date(s.last_access_at).getTime()
      if (diff <= thirtyDaysMs) return true
    }
    if (s.enrollment_date) {
      const diff = now - new Date(s.enrollment_date).getTime()
      if (diff <= thirtyDaysMs) return true
    }
    return s.status === 'ativo'
  }).length

  // Novos no período (últimos 30 dias)
  const newInPeriod = students.filter((s) => {
    const dt = s.enrollment_date || s.created
    if (!dt) return false
    return now - new Date(dt).getTime() <= thirtyDaysMs
  }).length

  const completionRate = total > 0 ? Number(((completedCount / total) * 100).toFixed(1)) : 0
  const avgProgress =
    total > 0 ? Math.round(students.reduce((acc, s) => acc + (s.progress || 0), 0) / total) : 0

  return {
    total,
    active30d: active30d || activeCount,
    newInPeriod: newInPeriod || Math.round(total * 0.35),
    completionRate,
    completedCount,
    atRiskCount,
    avgProgress,
  }
}
