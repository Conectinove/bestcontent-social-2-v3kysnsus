/**
 * Domínio próprio da marca (pedido "personalizar domínio próprio de cada marca").
 * Ressalva: hospedagem Skip Cloud não serve domínio próprio real — entregamos a
 * CONFIGURAÇÃO: o domínio é salvo em brand_portals.custom_domain (migration 0116)
 * e o painel mostra as instruções de DNS/CNAME apontando pro link do portal.
 */
import pb, { pb as pbNamed } from '@/lib/pocketbase/client'

const client = pbNamed || pb

export interface CustomDomainState {
  custom_domain: string
  domain_verified: boolean
}

/** Salva (ou limpa, com domain '') o domínio da marca — rota POST /portals/domain. */
export async function saveCustomDomain(
  portalId: string,
  domain: string,
): Promise<CustomDomainState> {
  const res = await client.send<CustomDomainState>('/backend/v1/portals/domain', {
    method: 'POST',
    body: { portalId, domain },
  })
  return {
    custom_domain: res?.custom_domain || '',
    domain_verified: Boolean(res?.domain_verified),
  }
}

/** Confirma o CNAME (dono marca domain_verified após o DNS propagar). */
export async function verifyCustomDomain(portalId: string): Promise<CustomDomainState> {
  const res = await client.send<CustomDomainState>('/backend/v1/portals/domain/verify', {
    method: 'POST',
    body: { portalId },
  })
  return {
    custom_domain: res?.custom_domain || '',
    domain_verified: Boolean(res?.domain_verified),
  }
}

/** Lê o estado atual do domínio direto do registro do portal. */
export async function getCustomDomain(portalId: string): Promise<CustomDomainState> {
  try {
    const rec = (await client.collection('brand_portals').getOne(portalId, {
      fields: 'id,custom_domain,domain_verified',
    })) as { custom_domain?: string; domain_verified?: boolean }
    return {
      custom_domain: rec?.custom_domain || '',
      domain_verified: Boolean(rec?.domain_verified),
    }
  } catch {
    return { custom_domain: '', domain_verified: false }
  }
}

/** Registro CNAME que o dono deve criar no provedor de DNS. */
export function buildCnameTarget(token: string): string {
  const base =
    typeof window !== 'undefined'
      ? window.location.hostname
      : (import.meta.env.VITE_POCKETBASE_URL as string) || 'app.exemplo.com'
  return base
}
