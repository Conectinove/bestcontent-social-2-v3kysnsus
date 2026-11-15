import pb from '@/lib/pocketbase/client'
import {
  buildCustomTheme,
  type StudioThemeOption,
  type StudioCustomColors,
} from '@/hooks/use-studio-theme'

const COLLECTION = 'studio_themes'

/** Payload de uma linha da coleção studio_themes. */
export interface StudioThemeRecord {
  id: string
  user: string
  name: string
  network: string
  mode: string
  color_background: string
  color_surface: string
  color_primary: string
  color_text: string
  accent_override: string
  is_shared: boolean
  remote_id: string
  expand?: { user?: { name?: string; company?: string } }
}

/** Dados de criação/atualização de um tema (nome, cores, rede, compartilhamento). */
export interface StudioThemeInput {
  name: string
  colors: StudioCustomColors
  network?: string | null
  isShared?: boolean
  accentOverride?: string | null
}

/** Monta um StudioThemeOption a partir do record do banco. */
export function recordToThemeOption(rec: StudioThemeRecord): StudioThemeOption {
  const colors: StudioCustomColors = {
    background: rec.color_background || '#09090b',
    surface: rec.color_surface || '#18181b',
    primary: rec.color_primary || '#7c3aed',
    text: rec.color_text || '#fafafa',
  }
  const isMine = rec.user === pb.authStore.record?.id
  const option = buildCustomTheme(rec.name || 'Tema da equipe', colors, `remote-${rec.id}`)
  return {
    ...option,
    // Remapeia a preview para dar destaque ao accent por rede, quando houver
    preview: rec.accent_override
      ? `linear-gradient(135deg, hsl(${rec.accent_override}), ${colors.background})`
      : option.preview,
    network: rec.network || null,
    isShared: Boolean(rec.is_shared),
    origin: isMine ? 'mine' : 'team',
    remoteId: rec.id,
    ownerId: rec.user,
    ownerName: rec.expand?.user?.name || '',
  }
}

/** Lista os temas do usuário + os compartilhados pela sua equipe (mesma company). */
export async function fetchStudioThemes(): Promise<StudioThemeOption[]> {
  const authId = pb.authStore.record?.id
  if (!authId) return []
  const company = (pb.authStore.record as any)?.company || ''

  const mineFilter = `user = "${authId}"`
  const teamFilter =
    company && company.trim() !== ''
      ? `is_shared = true && user != "${authId}" && user.company = "${company}"`
      : `is_shared = true && user != "${authId}" && user.company = "" && user != "${authId}"`

  const [mine, team] = await Promise.all([
    pb.collection(COLLECTION).getFullList({
      filter: mineFilter,
      sort: '-updated',
      expand: 'user',
    }),
    pb
      .collection(COLLECTION)
      .getFullList({ filter: teamFilter, sort: '-updated', expand: 'user' })
      .catch(() => [] as StudioThemeRecord[]),
  ])

  const seen = new Set<string>()
  return [...mine, ...team]
    .filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    .map(recordToThemeOption)
}

/** Cria o tema no banco e devolve o StudioThemeOption correspondente. */
export async function createStudioTheme(input: StudioThemeInput): Promise<StudioThemeOption> {
  const authId = pb.authStore.record?.id
  if (!authId) throw new Error('Sessão expirada — faça login para salvar temas.')
  const rec = await pb.collection(COLLECTION).create<StudioThemeRecord>({
    user: authId,
    name: input.name,
    network: input.network || '',
    mode: '',
    color_background: input.colors.background,
    color_surface: input.colors.surface,
    color_primary: input.colors.primary,
    color_text: input.colors.text,
    accent_override: input.accentOverride || '',
    is_shared: Boolean(input.isShared),
    remote_id: '',
  })
  return recordToThemeOption(rec)
}

/** Atualiza um tema existente (nome, cores, rede, compartilhamento). */
export async function updateStudioTheme(
  remoteId: string,
  input: Partial<StudioThemeInput>,
): Promise<StudioThemeOption> {
  const data: Record<string, unknown> = {}
  if (input.name !== undefined) data.name = input.name
  if (input.colors !== undefined) {
    data.color_background = input.colors.background
    data.color_surface = input.colors.surface
    data.color_primary = input.colors.primary
    data.color_text = input.colors.text
  }
  if (input.network !== undefined) data.network = input.network || ''
  if (input.isShared !== undefined) data.is_shared = Boolean(input.isShared)
  if (input.accentOverride !== undefined) data.accent_override = input.accentOverride || ''
  const rec = await pb.collection(COLLECTION).update<StudioThemeRecord>(remoteId, data)
  return recordToThemeOption(rec)
}

/** Exclui o tema do banco (apenas o dono pode). */
export async function deleteStudioTheme(remoteId: string): Promise<void> {
  await pb.collection(COLLECTION).delete(remoteId)
}

/** Troca apenas o flag de compartilhamento (usado no seletor, botão Equipe). */
export async function toggleStudioThemeShared(
  remoteId: string,
  isShared: boolean,
): Promise<StudioThemeOption> {
  return updateStudioTheme(remoteId, { isShared })
}
