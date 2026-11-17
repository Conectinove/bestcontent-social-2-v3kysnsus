// Geração de imagem de capa com IA via conector OpenAI do PRÓPRIO usuário
// (decisão do usuário v0.0.158: conectores no modo "conta de cada usuário").
// Nada de OAuth hand-rolled ou chave de API: o fluxo é connect() → consentimento
// → execute('OPENAI_CREATE_IMAGE', …) através do mecanismo injetado de conectores.
import { execute, listConnectors, type ConnectorResult } from '@/lib/skipConnectors'

export const OPENAI_TOOLKIT = 'openai'

/** A ferramenta real do toolkit (find_app_connector_tools — nunca adivinhar slug). */
const IMAGE_TOOL = 'OPENAI_CREATE_IMAGE'

export type OpenAiCoverStatus = 'connected' | 'not_connected' | 'expired' | 'unknown'

/** Estado da conexão OpenAI do usuário logado (null = ainda consultando). */
export async function getOpenAiStatus(): Promise<OpenAiCoverStatus> {
  try {
    const all = await listConnectors()
    const found = all.find((c) => c.toolkit === OPENAI_TOOLKIT)
    return found?.status ?? 'not_connected'
  } catch {
    return 'unknown'
  }
}

/** Primeira URL de imagem (http/https/data:) presente na resposta, percorrendo o objeto. */
function extractImageUrl(data: unknown, depth = 0): string | null {
  if (depth > 6 || data == null) return null
  if (typeof data === 'string') {
    return /^(https?:\/\/|data:image\/)/i.test(data) ? data : null
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = extractImageUrl(item, depth + 1)
      if (found) return found
    }
    return null
  }
  if (typeof data === 'object') {
    const rec = data as Record<string, unknown>
    // Composio costuma devolver hosted image asset em url/image_url/data
    for (const key of ['url', 'image_url', 'imageUrl', 'data', 'output', 'result']) {
      if (key in rec) {
        const found = extractImageUrl(rec[key], depth + 1)
        if (found) return found
      }
    }
    for (const value of Object.values(rec)) {
      const found = extractImageUrl(value, depth + 1)
      if (found) return found
    }
  }
  return null
}

export interface GeneratedCoverImage {
  url: string
}

/**
 * Gera a imagem de capa com a conta OpenAI conectada do usuário.
 * Lança erro com mensagem em pt-BR pronta para exibir.
 */
export async function generateCoverWithAi(
  prompt: string,
  opts: { size?: string } = {},
): Promise<GeneratedCoverImage> {
  const clean = prompt.trim()
  if (!clean) {
    throw new Error('Descreva a capa que você quer gerar antes de continuar.')
  }
  if (clean.length > 1000) {
    throw new Error('O prompt da capa está muito longo (máximo de 1000 caracteres).')
  }

  let result: ConnectorResult
  try {
    result = await execute(IMAGE_TOOL, {
      prompt: clean,
      model: 'gpt-image-1',
      size: opts.size ?? '1024x1024',
      n: 1,
    })
  } catch {
    throw new Error(
      'Não foi possível falar com a OpenAI agora. Confira sua conexão e se a conta OpenAI ainda está conectada, depois tente de novo.',
    )
  }

  if (!result.successful) {
    const detail = result.error?.trim()
    throw new Error(
      detail
        ? `A OpenAI recusou a geração da capa: ${detail}`
        : 'A OpenAI não conseguiu gerar a capa. Ajuste a descrição e tente de novo.',
    )
  }

  const url = extractImageUrl(result.data)
  if (!url) {
    throw new Error('A OpenAI respondeu sem imagem utilizável. Tente gerar novamente em instantes.')
  }
  return { url }
}
