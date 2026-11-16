import pb, { pb as pbNamed } from '@/lib/pocketbase/client'

const client = pbNamed || pb

export type OrgRole = 'owner' | 'admin' | 'editor' | 'viewer'

export const ORG_ROLES: { value: OrgRole; label: string; description: string }[] = [
  { value: 'owner', label: 'Proprietário', description: 'Acesso total, incluindo cobrança' },
  { value: 'admin', label: 'Admin', description: 'Gerencia membros, marcas e conteúdo' },
  { value: 'editor', label: 'Editor', description: 'Cria e edita conteúdo e portais' },
  {
    value: 'viewer',
    label: 'Visualizador',
    description: 'Somente leitura de relatórios e conteúdo',
  },
]

export interface OrgMember {
  id: string
  name: string
  email: string
  role: string
  org_role: OrgRole | ''
  org_permissions?: OrgPermissions | null
  avatar?: string
  created: string
  /** Última atividade conhecida (atualização do registro no PocketBase). */
  updated: string
  verified?: boolean
}

/** Permissões granulares por recurso (users.org_permissions, migration 0128). */
export interface OrgPermissions {
  blog_publish?: boolean
  secondbrain_edit?: boolean
  media_upload?: boolean
  reports_export?: boolean
}

/** Metadados das permissões granulares (label + descrição pt-BR). */
export const ORG_PERMISSIONS: Array<{
  key: keyof OrgPermissions
  label: string
  description: string
}> = [
  {
    key: 'blog_publish',
    label: 'Publicar no blog',
    description: 'Pode publicar e despublicar posts do blog/labs',
  },
  {
    key: 'secondbrain_edit',
    label: 'Editar Segundo Cérebro',
    description: 'Pode criar e editar notas no Segundo Cérebro',
  },
  {
    key: 'media_upload',
    label: 'Enviar mídias',
    description: 'Pode subir imagens e vídeos para o acervo',
  },
  {
    key: 'reports_export',
    label: 'Exportar relatórios',
    description: 'Pode baixar PDFs/CSVs de relatórios e métricas',
  },
]

/** Cargo default a partir do cargo antigo `role` (fallback do painel). */
export const roleFromMember = (m: OrgMember): OrgRole =>
  (m.org_role || m.role || 'viewer') as OrgRole

/** Cargo default por role legado (viewer só lê; admin/owner tudo). */
export const defaultPermissionsForRole = (role: OrgRole): OrgPermissions =>
  role === 'viewer'
    ? { blog_publish: false, secondbrain_edit: false, media_upload: false, reports_export: false }
    : { blog_publish: true, secondbrain_edit: true, media_upload: true, reports_export: true }

/** Lê permissões do membro: org_permissions explícito ou default do cargo. */
export function permissionsOf(m: OrgMember): OrgPermissions {
  if (m.org_permissions && typeof m.org_permissions === 'object') {
    return { ...defaultPermissionsForRole(roleFromMember(m)), ...m.org_permissions }
  }
  return defaultPermissionsForRole(roleFromMember(m))
}

/**
 * Lista os membros da organização (usuários da mesma conta/instância).
 * `updated` funciona como proxy de "última atividade" (o schema não tem campo próprio).
 */
export async function listOrgMembers(): Promise<OrgMember[]> {
  const records = await client.collection('users').getFullList({
    sort: '-updated',
    fields: 'id,name,email,role,org_role,org_permissions,avatar,created,updated,verified',
  })
  return records as unknown as OrgMember[]
}

/** Salva o org_role de um membro — respeita a regra de servidor (só admin altera). */
export async function setMemberOrgRole(memberId: string, orgRole: OrgRole): Promise<OrgMember> {
  return client.collection('users').update(memberId, { org_role: orgRole }) as unknown as OrgMember
}

/** Salva as permissões granulares de um membro (users.org_permissions). */
export async function setMemberPermissions(
  memberId: string,
  permissions: OrgPermissions,
): Promise<OrgMember> {
  return client
    .collection('users')
    .update(memberId, { org_permissions: permissions }) as unknown as OrgMember
}

/** Registro do histórico de mudanças de cargo (coleção org_role_history). */
export interface OrgRoleHistoryEntry {
  id: string
  user: string
  by: string
  from_role: string
  to_role: string
  note?: string
  created: string
  expand?: { user?: { name?: string; email?: string }; by?: { name?: string; email?: string } }
}

/** Histórico de mudanças de cargo de um membro (mais recente primeiro). */
export async function listRoleHistory(memberId: string): Promise<OrgRoleHistoryEntry[]> {
  try {
    const recs = await client.collection('org_role_history').getFullList({
      filter: `user = "${memberId}"`,
      sort: '-created',
      expand: 'user,by',
    })
    return recs as unknown as OrgRoleHistoryEntry[]
  } catch {
    return []
  }
}

/** Grava uma entrada no histórico (usado junto com setMemberOrgRole). */
export async function recordRoleChange(
  memberId: string,
  fromRole: string,
  toRole: string,
  note = '',
): Promise<void> {
  try {
    await client.collection('org_role_history').create({
      user: memberId,
      by: client.authStore.record?.id || '',
      from_role: fromRole,
      to_role: toRole,
      note,
    })
  } catch {
    // histórico é best-effort: não bloqueia a troca de cargo
  }
}
