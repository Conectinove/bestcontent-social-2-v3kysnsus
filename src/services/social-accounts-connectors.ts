// Conectores sociais (Instagram / Facebook) — sempre na conta de CADA usuário.
// Os slugs abaixo são os tools reais expostos pelos toolkits `instagram` e
// `facebook` (fonte: find_app_connector_tools). Nenhum OAuth manual: tudo via
// execute() do skipConnectors, que age com a sessão do usuário logado.
import { execute } from '@/lib/skipConnectors'

export interface SocialAccountItem {
  id: string
  name: string
  subtitle?: string
  picture?: string
  followers?: number
}

/** Normaliza a resposta defensivamente: um shape inesperado vira lista vazia + erro, nunca um palpite. */
const pickArray = (data: unknown): any[] => {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const rec = data as Record<string, unknown>
    for (const key of ['data', 'accounts', 'pages', 'items', 'results']) {
      if (Array.isArray(rec[key])) return rec[key] as any[]
    }
    // Objeto único (ex.: INSTAGRAM_GET_USER_INFO de "me") vira lista de 1
    if ('id' in rec || 'username' in rec) return [rec]
  }
  return []
}

/**
 * Contas comerciais do Instagram conectadas pelo usuário (INSTAGRAM_GET_USER_INFO com "me").
 */
export async function fetchInstagramAccounts(): Promise<SocialAccountItem[]> {
  const errors: string[] = []

  // 1) Informação da conta profissional autenticada
  try {
    const res = await execute('INSTAGRAM_GET_USER_INFO', {
      ig_user_id: 'me',
      fields: 'id,username,name,profile_picture_url,followers_count,biography',
    })
    if (res.successful) {
      const list = pickArray(res.data)
      const mapped = list
        .map((acc: any) => ({
          id: String(acc.id || acc.ig_user_id || acc.username || ''),
          name: acc.name || acc.username || 'Conta do Instagram',
          subtitle: acc.username ? `@${acc.username}` : 'Instagram Professional',
          picture: acc.profile_picture_url,
          followers: typeof acc.followers_count === 'number' ? acc.followers_count : undefined,
        }))
        .filter((a) => a.id)
      if (mapped.length > 0) return mapped
    } else if (res.error) {
      errors.push(res.error)
    }
  } catch (err: any) {
    errors.push(err?.message || String(err))
  }

  // 2) Fallback: páginas do Facebook gerenciadas costumam carregar o IG vinculado
  try {
    const pages = await fetchFacebookPages()
    const withIg = pages.filter((p) => p.instagramLinked)
    if (withIg.length > 0) {
      return withIg.map((p) => ({
        id: p.instagramId || p.id,
        name: p.name,
        subtitle: `Instagram vinculado à Página ${p.name}`,
        picture: p.picture,
        followers: p.followers,
      }))
    }
  } catch (_) {
    // ignora: o erro principal já está em `errors`
  }

  if (errors.length > 0) {
    console.warn('[social-accounts-connectors] Instagram:', errors.join(' | '))
  }
  return []
}

/**
 * Páginas do Facebook gerenciadas pelo usuário (FACEBOOK_LIST_MANAGED_PAGES).
 */
export async function fetchFacebookPages(): Promise<
  (SocialAccountItem & { instagramLinked?: boolean; instagramId?: string })[]
> {
  try {
    const res = await execute('FACEBOOK_LIST_MANAGED_PAGES', {
      fields: 'id,name,category,fan_count,link,picture,instagram_business_account{id,username}',
    })
    if (res.successful) {
      const list = pickArray(res.data)
      return list
        .map((p: any) => ({
          id: String(p.id || ''),
          name: p.name || 'Página do Facebook',
          subtitle: p.category || 'Página do Facebook',
          picture: p.picture?.data?.url || undefined,
          followers: typeof p.fan_count === 'number' ? p.fan_count : undefined,
          instagramLinked: Boolean(p.instagram_business_account?.id),
          instagramId: p.instagram_business_account?.id
            ? String(p.instagram_business_account.id)
            : undefined,
        }))
        .filter((p) => p.id)
    }
    console.warn('[social-accounts-connectors] Facebook pages:', res.error)
  } catch (err: any) {
    console.warn('[social-accounts-connectors] Erro ao listar Páginas:', err?.message || err)
  }
  return []
}
