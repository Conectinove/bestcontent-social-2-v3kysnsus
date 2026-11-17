/**
 * Menções @nome nos comentários do Studio (coleção studio_edit_comments —
 * migration 0108): autocomplete de membros da organização (listOrgMembers)
 * e renderização do trecho @Nome destacado na lista de comentários.
 */

export interface MentionCandidate {
  id: string
  name: string
  email: string
}

/** Quebra o texto em segmentos; os que começam com @ ficam marcados. */
export interface MentionSegment {
  text: string
  mention: boolean
}

const MENTION_RE = /@([\p{L}\p{N}._-]+)/gu

/** Divide o corpo do comentário em segmentos, marcando os @Nome. */
export function splitMentionSegments(body: string): MentionSegment[] {
  const segments: MentionSegment[] = []
  let last = 0
  for (const match of body.matchAll(MENTION_RE)) {
    const idx = match.index ?? 0
    if (idx > last) segments.push({ text: body.slice(last, idx), mention: false })
    segments.push({ text: match[0], mention: true })
    last = idx + match[0].length
  }
  if (last < body.length) segments.push({ text: body.slice(last), mention: false })
  return segments
}

/** Escapa caracteres especiais de regex (padrão escapeRegExp). */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extrai a palavra de menção em digitação a partir do cursor (até 32 chars,
 * sem espaços) — devolve o trecho SEM o @, ou null se não há menção aberta.
 */
export function extractActiveMention(
  text: string,
  cursor: number,
): { token: string; start: number; end: number } | null {
  const before = text.slice(0, cursor)
  const match = before.match(/(?:^|\s)@([^\s@]{0,32})$/)
  if (!match) return null
  const token = match[1] || ''
  return {
    token,
    start: cursor - token.length - 1,
    end: cursor,
  }
}

/** Filtra candidatos pelo token digitado (nome ou e-mail, sem acento). */
export function filterMentionCandidates(
  candidates: MentionCandidate[],
  token: string,
): MentionCandidate[] {
  const q = token
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (!q) return candidates.slice(0, 6)
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  return candidates
    .filter((c) => {
      const name = norm(c.name || '')
      const email = norm(c.email || '')
      return name.includes(q) || email.includes(q)
    })
    .slice(0, 6)
}

/** Substitui a menção aberta pelo nome completo escolhido ("@Nome"). */
export function applyMentionToDraft(
  draft: string,
  range: { start: number; end: number },
  name: string,
): string {
  const mention = `@${name.replace(/\s+/g, ' ').trim()}`
  return draft.slice(0, range.start) + mention + ' ' + draft.slice(range.end)
}

/** Regex de testes rápidos (exportada para uso pontual). */
export const mentionWordPattern = escapeRegExp
