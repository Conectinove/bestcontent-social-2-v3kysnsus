/**
 * Link externo de preset de edição (pedido 2): gerar link copiável que,
 * aberto por outra conta, importa o preset. O token vive na nova coluna
 * share_token (migration 0113) e as rotas ficam no hook preset_share.js —
 * regenerar invalida o link anterior (revogar = botão de novo token/limpar).
 */
import pb from '@/lib/pocketbase/client'
import type { EditPresetFile } from '@/lib/preset-file'

/** Gera (ou renova — invalida o link anterior) o token do preset. */
export async function createPresetShareLink(presetId: string): Promise<string> {
  const res = await pb.send<{ success?: boolean; token?: string }>('/backend/v1/presets/share', {
    method: 'POST',
    body: { presetId },
  })
  if (!res?.token) throw new Error('O backend não devolveu o token do link.')
  return buildPresetShareUrl(res.token)
}

/** Monta a URL completa do importador a partir do token. */
export function buildPresetShareUrl(token: string): string {
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : (import.meta.env.VITE_POCKETBASE_URL as string) || ''
  return `${base}/importar-preset?t=${encodeURIComponent(token)}`
}

/** Busca o preset público pelo token (rota pública do hook). */
export async function fetchSharedPreset(token: string): Promise<EditPresetFile> {
  const data = await pb.send<EditPresetFile>(
    `/backend/v1/presets/share/${encodeURIComponent(token)}`,
    {
      method: 'GET',
    },
  )
  if (!data || data.format !== 'midiaviva-preset') {
    throw new Error('Este link não aponta para um preset válido do MidiaViva.')
  }
  return data
}

/** Salva o preset importado na conta do usuário logado (coleção 0101). */
export async function importSharedPreset(token: string): Promise<{ name: string }> {
  const data = await fetchSharedPreset(token)
  // Validação idêntica à do import por arquivo (mesmo parser da casa).
  const { parsePresetFile } = await import('@/lib/preset-file')
  const parsed = parsePresetFile(JSON.stringify(data))
  if (!parsed.ok || !parsed.input) throw new Error(parsed.error || 'Preset inválido.')
  const { saveEditPreset } = await import('@/services/studio-edit-presets')
  const created = await saveEditPreset(parsed.input.name, parsed.input.settings)
  return { name: created.name }
}
