import pb, { pb as pbNamed } from '@/lib/pocketbase/client'

const client = pbNamed || pb

export type OrgRole = 'owner' | 'admin' | 'editor' | 'viewer'

export const ORG_ROLES: { value: OrgRole; label: string; description: string }[] = [
  { value: 'owner', label: 'Proprietário', description: 'Acesso total, incluindo cobrança' },
  { value: 'admin', label: 'Admin', description: 'Gerencia membros, marcas e conteúdo' },
  { value: 'editor', label: 'Editor', description: 'Cria e edita conteúdo e portais' },
  { value: 'viewer', label: 'Viewer', description: 'Somente leitura de relatórios e conteúdo' },
]

export interface OrgMember {
  id: string
  name: string
  email: string
  role: string
  org_role: OrgRole | ''
  avatar?: string
  created: string
}

/**
 * Lista os membros da organização (usuários da mesma conta/instância).
 * O painel mostra quem é admin/member hoje e o novo org_role granular.
 */
export async function listOrgMembers(): Promise<OrgMember[]> {
  const records = await client.collection('users').getFullList({
    sort: '-created',
    fields: 'id,name,email,role,org_role,avatar,created',
  })
  return records as unknown as OrgMember[]
}

/** Salva o org_role de um membro — respeita a regra de servidor (só admin altera). */
export async function setMemberOrgRole(memberId: string, orgRole: OrgRole): Promise<OrgMember> {
  return client.collection('users').update(memberId, { org_role: orgRole }) as unknown as OrgMember
}
