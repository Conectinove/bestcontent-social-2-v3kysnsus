/**
 * Exportar/importar presets de edição avançada como arquivo JSON.
 *
 * Formato do arquivo (.json):
 * {
 *   "format": "midiaviva-preset",
 *   "version": 1,
 *   "name": "...",
 *   "settings": { ...AdvancedCustomizationState... }
 * }
 *
 * Mesmo padrão do tema (src/lib/theme-file.ts): importação com validação de
 * schema — qualquer campo fora do formato é rejeitado com mensagem clara
 * (nunca cria preset parcial).
 */
import { DEFAULT_CUSTOMIZATION } from '@/components/workspace/AdvancedCustomizationPanel'
import type { AdvancedCustomizationState } from '@/components/workspace/AdvancedCustomizationPanel'

const FORMAT = 'midiaviva-preset'
const FORMAT_VERSION = 1

export interface EditPresetFile {
  format: string
  version: number
  name: string
  settings: AdvancedCustomizationState
}

export interface ParsedPresetInput {
  name: string
  settings: AdvancedCustomizationState
}

export interface ParsePresetResult {
  ok: boolean
  error?: string
  input?: ParsedPresetInput
}

/**
 * Novo formato múltiplo (pedido 3): um único arquivo "midiaviva-presets"
 * com VÁRIOS presets. A importação continua aceitando também o formato
 * antigo de 1 preset ("midiaviva-preset") — compatibilidade garantida.
 */
const MULTI_FORMAT = 'midiaviva-presets'

export interface EditPresetsBundleFile {
  format: typeof MULTI_FORMAT
  version: number
  presets: { name: string; settings: AdvancedCustomizationState }[]
}

export interface ParsePresetsBundleResult {
  ok: boolean
  error?: string
  /** Presets validados prontos para criar; rejeitados não entram. */
  inputs: ParsedPresetInput[]
  /** Quantos presets vieram no arquivo no total. */
  total: number
  /** Quantos foram rejeitados pela validação (com motivo agregado). */
  rejected: number
  rejectReason?: string
}

/** Monta o conteúdo do arquivo múltiplo a partir dos presets selecionados. */
export function presetsBundleToFile(
  presets: { name: string; settings: AdvancedCustomizationState }[],
): EditPresetsBundleFile {
  return {
    format: MULTI_FORMAT,
    version: FORMAT_VERSION,
    presets: presets.map((p) => ({ name: p.name, settings: { ...p.settings } })),
  }
}

/** Baixa VÁRIOS presets num único arquivo JSON "midiaviva-presets". */
export function downloadPresetsBundleFile(
  presets: { name: string; settings: AdvancedCustomizationState }[],
): void {
  const data = presetsBundleToFile(presets)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `presets-midiaviva-${presets.length}.json`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/**
 * Valida um arquivo importado — aceita TANTO o formato múltiplo novo
 * ("midiaviva-presets") quanto o de 1 preset ("midiaviva-preset").
 * Valida cada entrada: válidos entram em inputs; inválidos são contados
 * em rejected (nunca interrompe os outros).
 */
export function parsePresetsBundleFile(raw: string): ParsePresetsBundleResult {
  const empty = { ok: false, inputs: [], total: 0, rejected: 0 } as ParsePresetsBundleResult
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { ...empty, error: 'Arquivo inválido: não é um JSON válido.' }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ...empty, error: 'Arquivo inválido: conteúdo inesperado.' }
  }
  const obj = data as Record<string, unknown>

  // Formato antigo (1 preset): revalida pelo parser de 1 e empacota.
  if (obj.format === FORMAT) {
    const one = parsePresetFile(raw)
    if (!one.ok || !one.input) {
      return { ...empty, error: one.error }
    }
    return { ok: true, inputs: [one.input], total: 1, rejected: 0 }
  }

  if (obj.format !== MULTI_FORMAT) {
    return {
      ...empty,
      error: 'Arquivo não é um preset do MidiaViva (campo "format" não reconhecido).',
    }
  }
  if (typeof obj.version !== 'number' || obj.version > FORMAT_VERSION) {
    return { ...empty, error: 'Versão do arquivo de presets não suportada.' }
  }
  if (!Array.isArray(obj.presets)) {
    return { ...empty, error: 'O arquivo não traz a lista de presets ("presets").' }
  }

  const inputs: ParsedPresetInput[] = []
  let rejected = 0
  let rejectReason: string | undefined
  const total = obj.presets.length

  for (const entry of obj.presets) {
    // Revalida cada entrada pelo validador de 1 preset, embrulhando-a.
    const wrapped = JSON.stringify({
      format: FORMAT,
      version: FORMAT_VERSION,
      ...(entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {}),
    })
    const one = parsePresetFile(wrapped)
    if (one.ok && one.input) {
      // Evita duplicar nome já importado no mesmo arquivo.
      const base = one.input.name
      let finalName = base
      let n = 2
      while (inputs.some((i) => i.name === finalName)) {
        finalName = `${base} (${n++})`
      }
      inputs.push({ ...one.input, name: finalName })
    } else {
      rejected++
      rejectReason = one.error
    }
  }

  if (total > 0 && inputs.length === 0) {
    return {
      ...empty,
      error: rejectReason || 'Nenhum preset do arquivo passou na validação.',
      total,
      rejected,
    }
  }

  return { ok: true, inputs, total, rejected, rejectReason }
}

const NUMERIC_FIELDS = [
  'fontSize',
  'letterSpacing',
  'lineHeight',
  'brightness',
  'contrast',
  'saturation',
  'blur',
  'vignette',
  'overlayOpacity',
  'rotation',
  'borderWidth',
  'shadow',
  'layerOpacity',
] as const

const BOOLEAN_FIELDS = ['flipHorizontal', 'flipVertical'] as const

const STRING_FIELDS = [
  'primaryColor',
  'secondaryColor',
  'fontFamily',
  'overlayColor',
  'borderColor',
] as const

const ENUM_FIELDS: { key: 'gradientMode' | 'fontWeight' | 'textAlign'; values: string[] }[] = [
  { key: 'gradientMode', values: ['none', 'linear', 'radial'] },
  { key: 'fontWeight', values: ['normal', 'semibold', 'bold', 'extrabold'] },
  { key: 'textAlign', values: ['left', 'center', 'right'] },
]

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function isHex(v: unknown): v is string {
  return typeof v === 'string' && HEX_RE.test(v.trim())
}

/** Monta o conteúdo do arquivo a partir do preset escolhido no painel. */
export function presetToFile(name: string, settings: AdvancedCustomizationState): EditPresetFile {
  return {
    format: FORMAT,
    version: FORMAT_VERSION,
    name,
    settings: { ...settings },
  }
}

/** Baixa o preset como arquivo JSON (nome de arquivo amigável). */
export function downloadPresetFile(name: string, settings: AdvancedCustomizationState): void {
  const data = presetToFile(name, settings)
  const slug =
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'preset'
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${slug}-preset.json`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/**
 * Valida o conteúdo de um arquivo de preset importado.
 * Retorna { ok: false, error } com mensagem em pt-BR quando inválido,
 * ou { ok: true, input } pronto para o serviço criar o preset.
 */
export function parsePresetFile(raw: string): ParsePresetResult {
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
      error: 'Arquivo não é um preset do MidiaViva (campo "format" não reconhecido).',
    }
  }
  if (typeof obj.version !== 'number' || obj.version > FORMAT_VERSION) {
    return { ok: false, error: 'Versão do arquivo de preset não suportada.' }
  }
  if (typeof obj.name !== 'string' || !obj.name.trim()) {
    return { ok: false, error: 'O arquivo não traz um nome de preset válido.' }
  }
  const settings = obj.settings
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return { ok: false, error: 'O arquivo não traz os ajustes do preset ("settings").' }
  }
  const s = settings as Record<string, unknown>

  const merged = { ...DEFAULT_CUSTOMIZATION } as unknown as Record<string, unknown>
  let touched = false

  for (const key of STRING_FIELDS) {
    const v = s[key]
    if (v === undefined || v === null || v === '') continue
    if (
      key === 'primaryColor' ||
      key === 'secondaryColor' ||
      key === 'overlayColor' ||
      key === 'borderColor'
    ) {
      if (!isHex(v)) {
        return { ok: false, error: `Cor "${key}" inválida (use hex #RRGGBB).` }
      }
    } else if (typeof v !== 'string') {
      return { ok: false, error: `Campo "${key}" inválido.` }
    }
    merged[key] = typeof v === 'string' ? v.trim() : v
    touched = true
  }

  for (const key of NUMERIC_FIELDS) {
    const v = s[key]
    if (v === undefined || v === null) continue
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      return { ok: false, error: `Campo numérico "${key}" inválido.` }
    }
    merged[key] = v
    touched = true
  }

  for (const key of BOOLEAN_FIELDS) {
    const v = s[key]
    if (v === undefined || v === null) continue
    if (typeof v !== 'boolean') {
      return { ok: false, error: `Campo booleano "${key}" inválido (esperado true/false).` }
    }
    merged[key] = v
    touched = true
  }

  for (const { key, values } of ENUM_FIELDS) {
    const v = s[key]
    if (v === undefined || v === null || v === '') continue
    if (typeof v !== 'string' || !values.includes(v)) {
      return {
        ok: false,
        error: `Campo "${key}" deve ser um de: ${values.join(', ')}.`,
      }
    }
    merged[key] = v
    touched = true
  }

  if (!touched) {
    return {
      ok: false,
      error: 'O arquivo não traz nenhum ajuste reconhecível do painel de Edição Avançada.',
    }
  }

  return {
    ok: true,
    input: {
      name: (obj.name as string).trim().slice(0, 120),
      settings: merged as unknown as AdvancedCustomizationState,
    },
  }
}

/** Abre o seletor de arquivos e devolve o conteúdo do JSON escolhido. */
export function pickPresetFile(): Promise<string | null> {
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
