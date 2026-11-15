const FALLBACK_AVATAR_M = 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=102'
const FALLBACK_AVATAR_F = 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=101'

/** Formata data relativa em pt-BR (agora mesmo, há X min, ontem, data). */
export function formatRelative(dateStr?: string): string {
  if (!dateStr) return 'recente'
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / (1000 * 60))
    if (mins < 1) return 'agora mesmo'
    if (mins < 60) return `há ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `há ${hours} h`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'ontem'
    if (days < 30) return `há ${days} dias`
    return new Date(dateStr).toLocaleDateString('pt-BR')
  } catch {
    return 'recente'
  }
}

/**
 * Cargo do autor derivado do nome (regras herdadas da comunidade):
 * Admin detecta pelo nome, tiers por tags do tópico.
 */
export function getTopicRoleBadge(authorName?: string, tags: string[] = []): string[] {
  const badges: string[] = []
  const name = (authorName || '').toLowerCase()
  if (name.includes('adenilson') || name.includes('midiaviva')) badges.push('ADMIN')
  if (tags?.includes('PRO')) badges.push('PRO')
  if (tags?.includes('MAX')) badges.push('MAX')
  return badges
}

export { FALLBACK_AVATAR_M, FALLBACK_AVATAR_F }
