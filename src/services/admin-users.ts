import pb from '@/lib/pocketbase/client'
import { UserProfile } from '@/types'

/**
 * Gestão de usuários (somente admin): listagem paginada + troca de cargo.
 * A proteção de escrita (só admin da organização) vive nas API rules da
 * coleção users (migration 0110); aqui o guard é defensivo de UI.
 */

export interface AdminUserRecord {
  id: string
  name: string
  email: string
  avatar: string
  plan: string
  role: 'member' | 'admin' | 'gestor'
  company: string
  created: string
  verified: boolean
}

export type AdminRole = AdminUserRecord['role']

const VALID_ROLES: AdminRole[] = ['member', 'admin', 'gestor']

export function mapAdminUser(record: any): AdminUserRecord {
  return {
    id: record.id,
    name: record.name || '(sem nome)',
    email: record.email || '',
    avatar: record.avatar
      ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/${record.collectionId}/${record.id}/${record.avatar}`
      : `https://img.usecurling.com/ppl/thumbnail?seed=${record.id || 'user'}`,
    plan: record.plan || 'free',
    role: VALID_ROLES.includes(record.role) ? record.role : 'member',
    company: record.company || '',
    created: record.created || '',
    verified: !!record.verified,
  }
}

export async function listOrganizationUsers(
  page = 1,
  pageSize = 20,
  search = '',
): Promise<{ items: AdminUserRecord[]; totalItems: number; totalPages: number }> {
  const filter = search.trim()
    ? `name ~ "${search.trim()}" || email ~ "${search.trim()}"`
    : undefined
  const res = await pb.collection('users').getList<AdminUserRecord>(page, pageSize, {
    sort: '-created',
    filter,
  })
  return {
    items: res.items.map(mapAdminUser),
    totalItems: res.totalItems,
    totalPages: res.totalPages,
  }
}

export async function updateUserRole(userId: string, role: AdminRole): Promise<AdminRole> {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Cargo inválido: ${role}`)
  }
  await pb.collection('users').update(userId, { role })
  return role
}
