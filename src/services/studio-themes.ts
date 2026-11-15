import pb from '@/lib/pocketbase/client'
import {
  buildCustomTheme,
  hexToHslTokens,
  type StudioThemeOption,
  type StudioCustomColors,
} from '@/hooks/use-studio-theme'

const COLLECTION = 'studio_themes'

/** Payload de uma linha da coleção studio_themes (migration 0097). */
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
  scope: string
  is_org_default?: boolean
  created?: string
  updated?: string
  expand?: { user?: { id?: string; name?: string; company?: string } }
}

/** Dados de criação/atualização de um tema (nome, cores, rede, compartilhamento). */
export interface StudioThemeInput {
  name: string
  colors: StudioCustomColors
  network?: string | null
  isShared?: boolean
  accentOverride?: string | null
  /** "team" (equipe) ou "personal" (só para mim) — default "team". */
  scope?: 'team' | 'personal'
}

const INVALID_NETWORK = new Set(['', 'none'])
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

function safeNetwork(value: string | null | undefined): string {
  const v = (value || '').toLowerCase()
  return !v || INVALID_NETWORK.has(v) || !VALID_NETWORKS.has(v) ? '' : v
}

/** Monta um StudioThemeOption a partir do record do banco. */
export function recordToThemeOption(rec: StudioThemeRecord): StudioThemeOption {
  const colors: StudioCustomColors = {
    background: rec.color_background || '#09090b',
    surface: rec.color_surface || '#18181b',
    primary: rec.color_primary || '#7c3aed',
    text: rec.color_text || '#fafafa',
  }
  const authId = pb.authStore.record?.id
  const isMine = rec.user === authId
  const option = buildCustomTheme(rec.name || 'Tema da equipe', colors, `remote-${rec.id}`)
  // accent_override do banco: tokens "h s% l%" → css `hsl(h s% l%)` para a prévia
  const accentTokens = rec.accent_override
    ? hexToHslTokens('#000000') && rec.accent_override.match(/^[\d.]+ [\d.]+% [\d.]+%$/)
      ? rec.accent_override
      : null
    : null
  return {
    ...option,
    preview: accentTokens
      ? `linear-gradient(135deg, hsl(${accentTokens}), ${colors.primary})`
      : option.preview,
    network: rec.network || undefined,
    accentOverride: rec.accent_override || undefined,
    isShared: Boolean(rec.is_shared),
    scope: rec.scope === 'personal' ? 'personal' : 'team',
    origin: isMine ? 'mine' : 'team',
    remoteId: rec.id,
    ownerId: rec.user,
    ownerName: rec.expand?.user?.name || '',
    isOrgDefault: Boolean(rec.is_org_default),
  }
}

/**
 * Usuário atual pode gerenciar temas de outros membros? admin/gestor (campo
 * role da migration 0099) ou plan max/enterprise (fallback de admin).
 */
export function isTeamThemeManager(): boolean {
  const rec = pb.authStore.record as any
  if (!rec?.id) return false
  return (
    rec.role === 'admin' || rec.role === 'gestor' || rec.plan === 'max' || rec.plan === 'enterprise'
  )
}

/** Id da company do usuário logado ('' quando não tem). */
export function currentCompany(): string {
  return String((pb.authStore.record as any)?.company || '')
}

/**
 * Lista os temas do usuário + os compartilhados pela sua equipe (mesma company).
 * A regra de API da coleção já filtra (dono OU is_shared + mesma company);
 * o filtro extra de equipe é best-effort — se falhar, usa só o filtro do dono.
 */
export async function fetchStudioThemes(): Promise<StudioThemeOption[]> {
  const authId = pb.authStore.record?.id
  if (!authId) return []
  const company = ((pb.authStore.record as any)?.company || '') as string
  if (typeof company !== 'string') return []

  const mine = await pb
    .collection(COLLECTION)
    .getFullList<StudioThemeRecord>({
      filter: `user = "${authId}"`,
      sort: '-updated',
      expand: 'user',
    })
    .catch(() => [] as StudioThemeRecord[])

  let team: StudioThemeRecord[] = []
  if (company && company.trim() !== '') {
    const teamRaw = await pb
      .collection(COLLECTION)
      .getFullList<StudioThemeRecord>({
        filter: `is_shared = true && user != "${authId}" && user.company = "${company}"`,
        sort: '-updated',
        expand: 'user',
      })
      .catch(() => [] as StudioThemeRecord[])
    // scope = "personal": aplica só na conta do dono — nunca entra na lista da equipe
    team = teamRaw.filter((r) => r.scope !== 'personal')
  }

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
    network: safeNetwork(input.network),
    mode: (input.colors.background || '#09090b').toLowerCase().startsWith('#')
      ? hexToHslTokens(input.colors.background)!.l > 50
        ? 'light'
        : 'dark'
      : 'dark',
    color_background: input.colors.background,
    color_surface: input.colors.surface,
    color_primary: input.colors.primary,
    color_text: input.colors.text,
    accent_override: input.accentOverride || '',
    is_shared: Boolean(input.isShared),
    remote_id: '',
    // Novo tema criado pelo usuário: scope = personal quando não marcado como equipe
    scope: input.scope === 'team' ? 'team' : 'personal',
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
  if (input.network !== undefined) data.network = safeNetwork(input.network)
  if (input.isShared !== undefined) data.is_shared = Boolean(input.isShared)
  if (input.accentOverride !== undefined) data.accent_override = input.accentOverride || ''
  if (input.scope !== undefined) data.scope = input.scope === 'team' ? 'team' : 'personal'
  const rec = await pb.collection(COLLECTION).update<StudioThemeRecord>(remoteId, data)
  return recordToThemeOption(rec)
}

/** Exclui o tema do banco (apenas o dono pode, pela regra de API). */
export async function deleteStudioTheme(remoteId: string): Promise<void> {
  await pb.collection(COLLECTION).delete(remoteId)
}

/** Troca apenas o flag de compartilhamento (toggle "Compartilhar com a equipe"). */
export async function toggleStudioThemeShared(
  remoteId: string,
  isShared: boolean,
): Promise<StudioThemeOption> {
  return updateStudioTheme(remoteId, { isShared })
}

/**
 * Define (ou remove) o tema padrão da organização: marca is_org_default no
 * tema alvo e desmarca nos demais temas compartilhados da mesma company —
 * uma só padrão por org. Best-effort: falhas nos "false" são ignoradas.
 */
export async function setStudioThemeOrgDefault(
  remoteId: string,
  company: string,
  isDefault: boolean,
): Promise<void> {
  if (company) {
    const others = await pb
      .collection(COLLECTION)
      .getFullList<StudioThemeRecord>({
        filter: `is_org_default = true && user.company = "${company}"`,
      })
      .catch(() => [] as StudioThemeRecord[])
    await Promise.all(
      others
        .filter((r) => r.id !== remoteId)
        .map((r) =>
          pb
            .collection(COLLECTION)
            .update(r.id, { is_org_default: false })
            .catch(() => {}),
        ),
    )
  }
  await pb
    .collection(COLLECTION)
    .update(remoteId, { is_org_default: isDefault })
    .catch(() => {
      throw new Error(isDefault ? 'Falha ao definir o tema padrão da org.' : '')
    })
}
