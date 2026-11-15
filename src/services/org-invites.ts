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

/** Cancela um convite pendente: renova o registro com status 'cancelled'
 * (o hook de criação renova em vez de duplicar só para 'pending', então
 * atualizamos o registro direto via API de records). */
export async function cancelOrgInvite(inviteId: string): Promise<void> {
  await client.collection('org_invites').update(inviteId, { status: 'cancelled' })
}

/** Reativa/reenvia um convite pendente ou expirado: chama POST
 * /backend/v1/org/invites com o mesmo email/cargo — o hook renova o
 * registro existente com token e validade novos (30 dias). */
export async function resendOrgInvite(invite: OrgInvite): Promise<void> {
  await createOrgInvite(invite.email || '', invite.org_role || 'viewer', invite.org || '')
}

/** Monta o link copiável do convite. */
export function buildInviteUrl(token: string): string {
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : (import.meta.env.VITE_POCKETBASE_URL as string) || ''
  return `${base}/convite/${encodeURIComponent(token)}`
}
