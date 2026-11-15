/**
 * Motor de temas — variações de cor por REDE SOCIAL.
 *
 * Cada rede tem uma paleta de accent (HSL tokens "h s% l%", mesmo formato das
 * CSS vars do Tailwind). Ao escolher uma rede no seletor, o tema ativo recebe
 * o accent da rede sobreposto ao primary atual — o usuário vê o app mudar de
 * cor (Instagram roxo/rosa, TikTok ciano/rosa, LinkedIn azul etc.) sem perder
 * o modo (claro/escuro) nem o tema base escolhido.
 */

export type NetworkThemeId =
  | 'none'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'facebook'
  | 'youtube'
  | 'x'
  | 'threads'
  | 'pinterest'
  | 'kwai'
  | 'telegram'
  | 'bluesky'
  | 'snapchat'

export interface NetworkTheme {
  id: NetworkThemeId
  name: string
  /** Accent da rede (HSL tokens). */
  accent: string
  /** Cor primária da rede (HSL tokens) — usada quando o tema base não define. */
  primary: string
  /** Gradiente de prévia para o seletor. */
  preview: string
}

/** Paletas por rede — valores inspirados nas identidades oficiais de cada rede. */
export const NETWORK_THEMES: Record<Exclude<NetworkThemeId, 'none'>, NetworkTheme> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    accent: '291 60% 22%',
    primary: '291 64% 56%',
    preview: 'linear-gradient(135deg, #d6249f, #8134af, #fda085)',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    accent: '188 90% 16%',
    primary: '188 95% 44%',
    preview: 'linear-gradient(135deg, #25f4ee, #fe2c55, #111)',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    accent: '208 90% 22%',
    primary: '208 92% 44%',
    preview: 'linear-gradient(135deg, #0a66c2, #0e76a8)',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    accent: '220 88% 20%',
    primary: '220 88% 52%',
    preview: 'linear-gradient(135deg, #1877f2, #4267b2)',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    accent: '0 80% 20%',
    primary: '0 86% 54%',
    preview: 'linear-gradient(135deg, #ff0000, #cc0000)',
  },
  x: {
    id: 'x',
    name: 'X (Twitter)',
    accent: '0 0% 16%',
    primary: '0 0% 62%',
    preview: 'linear-gradient(135deg, #111, #444)',
  },
  threads: {
    id: 'threads',
    name: 'Threads',
    accent: '0 0% 14%',
    primary: '0 0% 88%',
    preview: 'linear-gradient(135deg, #222, #eee)',
  },
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    accent: '345 85% 20%',
    primary: '345 85% 50%',
    preview: 'linear-gradient(135deg, #e60023, #bd081c)',
  },
  kwai: {
    id: 'kwai',
    name: 'Kwai',
    accent: '347 92% 20%',
    primary: '347 92% 56%',
    preview: 'linear-gradient(135deg, #ff5000, #ff8a00)',
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    accent: '201 92% 18%',
    primary: '201 92% 50%',
    preview: 'linear-gradient(135deg, #2aabee, #229ed9)',
  },
  bluesky: {
    id: 'bluesky',
    name: 'Bluesky',
    accent: '211 100% 18%',
    primary: '211 100% 48%',
    preview: 'linear-gradient(135deg, #1185fe, #0a67cf)',
  },
  snapchat: {
    id: 'snapchat',
    name: 'Snapchat',
    accent: '50 96% 16%',
    primary: '50 96% 52%',
    preview: 'linear-gradient(135deg, #fffc00, #f5d800)',
  },
}

/** Lista ordenada para o seletor secundário "Rede" do switcher. */
export const NETWORK_THEME_LIST: NetworkTheme[] = [
  NETWORK_THEMES.instagram,
  NETWORK_THEMES.tiktok,
  NETWORK_THEMES.linkedin,
  NETWORK_THEMES.facebook,
  NETWORK_THEMES.youtube,
  NETWORK_THEMES.x,
  NETWORK_THEMES.threads,
  NETWORK_THEMES.pinterest,
  NETWORK_THEMES.kwai,
  NETWORK_THEMES.telegram,
  NETWORK_THEMES.bluesky,
  NETWORK_THEMES.snapchat,
]

const NETWORK_IDS = new Set<string>(Object.keys(NETWORK_THEMES))

/** Guarda: aceita somente ids de rede conhecidos (ou 'none'/''). */
export function normalizeNetworkThemeId(value: unknown): NetworkThemeId {
  if (typeof value !== 'string') return 'none'
  if (value === 'none' || value === '') return 'none'
  return NETWORK_IDS.has(value) ? (value as NetworkThemeId) : 'none'
}

const NETWORK_STORAGE_KEY = 'midiaviva_theme_network'

/**
 * Mapa rede→tema: qual TEMA COMPLETO cada rede usa quando um post dela é
 * aberto (editor/criador). Sem associação para a rede ativa, vale o tema
 * global + accent da rede (comportamento atual).
 */
export interface NetworkThemeMapEntry {
  themeId: string
  /** Accent (tokens HSL) guardado só para swatches na UI. */
  accent?: string
}

export type NetworkThemeMap = Partial<Record<NetworkThemeId, NetworkThemeMapEntry>>

const NETWORK_MAP_STORAGE_KEY = 'midiaviva_theme_network_map'

/** Guarda: descarta chaves de rede desconhecidas e entradas sem themeId. */
export function normalizeNetworkThemeMap(value: unknown): NetworkThemeMap {
  const out: NetworkThemeMap = {}
  if (!value || typeof value !== 'object') return out
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const network = normalizeNetworkThemeId(key)
    if (network === 'none') continue
    const entry = (raw || null) as Partial<NetworkThemeMapEntry> | null
    if (!entry || typeof entry.themeId !== 'string' || !entry.themeId) continue
    out[network] = {
      themeId: entry.themeId,
      accent: typeof entry.accent === 'string' ? entry.accent : undefined,
    }
  }
  return out
}

/** Lê o mapa rede→tema persistido (localStorage — sobrevive ao reload). */
export function loadNetworkThemeMap(): NetworkThemeMap {
  try {
    const raw = localStorage.getItem(NETWORK_MAP_STORAGE_KEY)
    return raw ? normalizeNetworkThemeMap(JSON.parse(raw)) : {}
  } catch {
    return {}
  }
}

/** Persiste o mapa rede→tema (mesmo mecanismo das demais escolhas de tema). */
export function saveNetworkThemeMap(map: NetworkThemeMap) {
  try {
    localStorage.setItem(NETWORK_MAP_STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* intentionally ignored */
  }
}

/** Lê a rede escolhida (persistida — sobrevive ao reload). */
export function loadNetworkThemeId(): NetworkThemeId {
  try {
    return normalizeNetworkThemeId(localStorage.getItem(NETWORK_STORAGE_KEY))
  } catch {
    return 'none'
  }
}

/** Persiste a rede escolhida (localStorage — mesmo mecanismo do tema base). */
export function saveNetworkThemeId(id: NetworkThemeId) {
  try {
    if (id === 'none') localStorage.removeItem(NETWORK_STORAGE_KEY)
    else localStorage.setItem(NETWORK_STORAGE_KEY, id)
  } catch {
    /* intentionally ignored */
  }
}
