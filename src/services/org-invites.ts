/**
 * Convites de membros por email (pedido 4).
 * Backend: hook org_invites.js — POST /backend/v1/org/invites (criar),
 * GET /backend/v1/org/invites/list (listar), GET /{token} (público, dados)
 * e POST /{token}/accept (público, aceita — aplica org_role no convidado).
 */
import pb, { pb as pbNamed } from '@/lib/pocketbase/client'

const client = pbNamed || pb

export interface OrgInvite {
  id: string
  email: string
  org_role: string
  org: string
  status: string
  expires: string
  token: string
  created: string
}

export interface OrgInvitePublic {
  email: string
  org_role: string
  org: string
  status: string
  expires: string
}

/** Cria (ou renova) o convite para um email com um cargo. Autenticado. */
export async function createOrgInvite(
  email: string,
  orgRole: string,
  org = '',
): Promise<OrgInvite> {
  const res = await client.send<{ success?: boolean; id?: string } & Partial<OrgInvite>>(
    '/backend/v1/org/invites',
    { method: 'POST', body: { email, role: orgRole, org } },
  )
  return {
    id: res?.id || '',
    email: res?.email || email,
    org_role: res?.org_role || orgRole,
    org: res?.org || org,
    status: 'pending',
    expires: res?.expires || '',
    token: res?.token || '',
    created: '',
  }
}

/** Lista os convites do usuário (o painel mostra os pendentes/expirados). */
export async function listOrgInvites(): Promise<OrgInvite[]> {
  const res = await client.send<{ invites?: OrgInvite[] }>('/backend/v1/org/invites/list', {
    method: 'GET',
  })
  return res?.invites || []
}

/** Lê os dados públicos do convite pelo token (página /convite/:token). */
export async function getOrgInviteByToken(token: string): Promise<OrgInvitePublic> {
  const res = await client.send<OrgInvitePublic>(
    `/backend/v1/org/invites/${encodeURIComponent(token)}`,
    { method: 'GET' },
  )
  return res
}

/** Aceita o convite (rota pública que exige sessão do convidado). */
export async function acceptOrgInvite(token: string): Promise<{ org_role: string; email: string }> {
  const res = await client.send<{ org_role?: string; email?: string }>(
    `/backend/v1/org/invites/${encodeURIComponent(token)}/accept`,
    { method: 'POST', body: {} },
  )
  return { org_role: res?.org_role || 'viewer', email: res?.email || '' }
}

/** Monta o link copiável do convite. */
export function buildInviteUrl(token: string): string {
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : (import.meta.env.VITE_POCKETBASE_URL as string) || ''
  return `${base}/convite/${encodeURIComponent(token)}`
}
