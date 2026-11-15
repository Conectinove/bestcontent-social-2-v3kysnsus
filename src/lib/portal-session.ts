/**
 * Identidade de sessão do visitante do portal (dedupe de plays/visitas):
 * um id por sessão (sessionStorage — some quando a aba fecha), gerado uma
 * única vez por portal. Navegar entre páginas internas e voltar mantém a
 * MESMA sessão (não soma play/visita); fechar a aba e voltar cria outra
 * (assistir de novo mais tarde soma).
 */
const KEY_PREFIX = 'bc_portal_session_'

export function getPortalSessionId(portalToken: string): string {
  if (typeof window === 'undefined') return ''
  const key = KEY_PREFIX + (portalToken || 'default')
  let sid = ''
  try {
    sid = window.sessionStorage.getItem(key) || ''
  } catch {
    sid = ''
  }
  if (!sid) {
    sid = 's-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-6)
    try {
      window.sessionStorage.setItem(key, sid)
    } catch {
      /* sessionStorage bloqueado: sessão efêmera (cada POST vira dedupe por body) */
    }
  }
  return sid
}
