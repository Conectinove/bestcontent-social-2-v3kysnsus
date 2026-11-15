/**
 * Exportar/importar temas do app como arquivo JSON.
 *
 * Formato do arquivo (.json):
 * {
 *   "format": "midiaviva-theme",
 *   "version": 1,
 *   "name": "...", "mode": "dark|light",
 *   "colors": { background, surface, primary, text },
 *   "network": "instagram" | null,
 *   "accentOverride": "h s% l%" | null
 * }
 *
 * Importação com validação de schema: qualquer campo fora do formato é
 * rejeitado com mensagem clara (nunca cria tema parcial).
 */
import type { StudioThemeOption, StudioCustomColors } from '@/hooks/use-studio-theme'

const FORMAT = 'midiaviva-theme'
const FORMAT_VERSION = 1

export interface StudioThemeFile {
  format: string
  version: number
  name: string
  mode: 'light' | 'dark'
  colors: StudioCustomColors
  network?: string | null
  accentOverride?: string | null
}

export interface ParsedThemeInput {
  name: string
  colors: StudioCustomColors
  network?: string | null
  accentOverride?: string | null
}

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const VALID_NETWORKS = new Set([
  'instagram',
  'tiktok',
  'linkedin',
  'facebook',
  'youtube',
  'x',
  'threads',
  'pinterest',
  'kwai',
  'telegram',
  'bluesky',
  'snapchat',
])
const ACCENT_RE = /^[\d.]+ [\d.]+% [\d.]+%$/

function isHex(v: unknown): v is string {
  return typeof v === 'string' && HEX_RE.test(v.trim())
}

/** Monta o conteúdo do arquivo a partir do tema escolhido no seletor. */
export function themeToFile(theme: StudioThemeOption): StudioThemeFile | null {
  const colors = theme.colors
  if (!colors) return null // temas embutidos/de marca não têm cores hex exportáveis
  return {
    format: FORMAT,
    version: FORMAT_VERSION,
    name: theme.name,
    mode: theme.mode,
    colors: { ...colors },
    network: theme.network || null,
    accentOverride: theme.accentOverride || null,
  }
}

/** Baixa o tema como arquivo JSON (nome de arquivo amigável). */
export function downloadThemeFile(theme: StudioThemeOption): boolean {
  const data = themeToFile(theme)
  if (!data) return false // temas embutidos/de marca não têm hex para exportar
  const slug =
    theme.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'tema'
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${slug}-tema.json`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return true
}

export interface ParseThemeResult {
  ok: boolean
  error?: string
  input?: ParsedThemeInput
}

/**
 * Valida o conteúdo de um arquivo de tema importado.
 * Retorna { ok: false, error } com mensagem em pt-BR quando inválido,
 * ou { ok: true, input } pronto para o motor criar o tema.
 */
export function parseThemeFile(raw: string): ParseThemeResult {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'Arquivo inválido: não é um JSON válido.' }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'Arquivo inválido: conteúdo inesperado.' }
  }
  const obj = data as Record<string, unknown>
  if (obj.format !== FORMAT) {
    return {
      ok: false,
      error: 'Arquivo não é um tema do MidiaViva (campo "format" não reconhecido).',
    }
  }
  if (typeof obj.version !== 'number' || obj.version > FORMAT_VERSION) {
    return { ok: false, error: 'Versão do arquivo de tema não suportada.' }
  }
  if (typeof obj.name !== 'string' || !obj.name.trim()) {
    return { ok: false, error: 'O arquivo não traz um nome de tema válido.' }
  }
  const colors = obj.colors as Record<string, unknown> | undefined
  if (!colors || typeof colors !== 'object') {
    return { ok: false, error: 'O arquivo não traz as cores do tema.' }
  }
  for (const key of ['background', 'surface', 'primary', 'text'] as const) {
    if (!isHex(colors[key])) {
      return { ok: false, error: `Cor "${key}" ausente ou em formato inválido (use hex #RRGGBB).` }
    }
  }
  const networkRaw = obj.network
  if (networkRaw !== undefined && networkRaw !== null && networkRaw !== '') {
    if (typeof networkRaw !== 'string' || !VALID_NETWORKS.has(networkRaw.toLowerCase())) {
      return { ok: false, error: `Rede social desconhecida: "${String(networkRaw)}".` }
    }
  }
  const accentRaw = obj.accentOverride
  if (accentRaw !== undefined && accentRaw !== null && accentRaw !== '') {
    if (typeof accentRaw !== 'string' || !ACCENT_RE.test(accentRaw.trim())) {
      return { ok: false, error: 'Accent de rede em formato inválido (esperado "h s% l%").' }
    }
  }
  return {
    ok: true,
    input: {
      name: (obj.name as string).trim().slice(0, 60),
      colors: {
        background: (colors.background as string).trim(),
        surface: (colors.surface as string).trim(),
        primary: (colors.primary as string).trim(),
        text: (colors.text as string).trim(),
      },
      network: networkRaw && networkRaw !== '' ? (networkRaw as string).toLowerCase() : null,
      accentOverride: accentRaw && accentRaw !== '' ? accentRaw.trim() : null,
    },
  }
}

/** Abre o seletor de arquivos e devolve o conteúdo do JSON escolhido. */
export function pickThemeFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsText(file)
    }
    input.click()
  })
}
