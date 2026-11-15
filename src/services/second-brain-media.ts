/**
 * Mídias do Segundo Cérebro — tipos compartilhados + serviço de fontes externas
 * de mídia (acervo da conta, uploads anteriores e biblioteca externa curada),
 * além do histórico de edições e dos modelos (templates) de composição de mídia.
 *
 * Regras da casa respeitadas:
 * - Histórico e modelos reusam os serviços existentes (studio_edit_versions e
 *   studio_edit_presets, migrations 0103/0101) com namespace próprio, sem
 *   criar coleção nova.
 * - Todo record novo leva `user` obrigatório; falhas de rede são tratadas
 *   como estado vazio honesto (não simulam dados).
 */
import { pb } from '@/lib/pocketbase/client'
import type { AdvancedCustomizationState } from '@/components/workspace/AdvancedCustomizationPanel'
import {
  saveEditVersion,
  listEditVersions,
  type StudioEditVersionRecord,
} from '@/services/studio-edit-versions'
import {
  listEditPresets,
  saveEditPreset,
  type StudioEditPreset,
} from '@/services/studio-edit-presets'
import {
  getImageBankAssets,
  getAssetUrl,
  type ImageBankAsset,
  type GetImageBankParams,
} from '@/services/image-bank'
import { searchStockAssets, type ExternalStockAsset } from '@/services/studio-external-assets'

/** Prefixo do Segundo Cérebro nas chaves de versões e nos nomes de presets/modelos. */
export const SB_MEDIA_PREFIX = 'secondbrain'

/** Chave estável de uma mídia (por URL) para o histórico de edições. */
export function sbMediaVersionKey(mediaId: string): string {
  return `${SB_MEDIA_PREFIX}:${mediaId}`
}

/** Tipo "kind" de mídia — 'image' ou 'document' (anexo não visual). */
export type SecondBrainMediaKind = 'image' | 'document'

/**
 * Fontes de mídia da grade: além das mídias do próprio documento,
 * a conta (image_bank_assets — acervo alimentando brand-kit/editor) e o
 * catálogo externo curado (o mesmo do Studio). Documentos do doc continuam
 * listados, mas sem editar (não são imagens).
 */
export type SecondBrainMediaSource = 'documento' | 'acervo' | 'uploads' | 'biblioteca'

export interface SecondBrainMediaItem {
  id: string
  name: string
  url: string
  kind: SecondBrainMediaKind
  source: string
  sourceUrl?: string
  /** Fonte estruturada da mídia — alimenta filtros e badges da grade. */
  origin: SecondBrainMediaSource
  /** Tags textuais para busca (ex.: categorias do acervo). */
  tags?: string[]
}

/* ------------------------------------------------------------------ */
/* Fontes externas de mídia                                            */
/* ------------------------------------------------------------------ */

export interface MediaSourcePage {
  items: SecondBrainMediaItem[]
  /** True quando a fonte está indisponível (sem conexão, coleção inacessível). */
  unavailable: boolean
}

/** Acervo da conta: image_bank_assets do usuário + curados da plataforma. */
export async function fetchAccountMediaSource(
  params: GetImageBankParams = {},
): Promise<MediaSourcePage> {
  try {
    const assets: ImageBankAsset[] = await getImageBankAssets(params)
    return {
      items: assets
        .map((a) => toMediaItemFromBank(a))
        .filter((i): i is SecondBrainMediaItem => Boolean(i)),
      unavailable: false,
    }
  } catch {
    // Falha de rede/regra = estado vazio honesto, nunca simulação
    return { items: [], unavailable: true }
  }
}

function toMediaItemFromBank(asset: ImageBankAsset): SecondBrainMediaItem | null {
  const url = getAssetUrl(asset)
  if (!url) return null
  return {
    id: `bank:${asset.id}`,
    name: asset.name || 'Imagem do acervo',
    url,
    kind: 'image',
    source: asset.user ? 'Acervo da conta' : 'Acervo curado',
    origin: asset.user ? 'acervo' : 'acervo',
    tags: (asset.tags || []).concat([asset.category]),
  }
}

/** Biblioteca externa curada (mesmo catálogo do Studio, busca por texto/categoria). */
export function fetchCuratedMediaSource(query = '', category = 'todas'): SecondBrainMediaItem[] {
  return searchStockAssets(query, category).map((asset: ExternalStockAsset) => ({
    id: `stock:${asset.id}`,
    name: asset.title,
    url: asset.thumbUrl || asset.url,
    kind: 'image',
    source: 'Biblioteca externa',
    origin: 'biblioteca',
    tags: asset.tags,
  }))
}

/* ------------------------------------------------------------------ */
/* Histórico de edições (namespace secondbrain:)                       */
/* ------------------------------------------------------------------ */

export interface SecondBrainMediaVersion extends StudioEditVersionRecord {}

/** Grava um snapshot da edição avançada de uma mídia (best-effort). */
export async function saveSecondBrainMediaVersion(input: {
  mediaId: string
  title: string
  settings: AdvancedCustomizationState
  previewUrl?: string
}): Promise<StudioEditVersionRecord | null> {
  return saveEditVersion({
    targetKey: sbMediaVersionKey(input.mediaId),
    title: input.title,
    settings: input.settings,
    previewUrl: input.previewUrl,
    resultUrl: input.previewUrl,
  })
}

/** Lista as versões acumuladas de uma mídia, mais recentes primeiro. */
export async function listSecondBrainMediaVersions(
  mediaId: string,
  limit = 30,
): Promise<SecondBrainMediaVersion[]> {
  try {
    return await listEditVersions(sbMediaVersionKey(mediaId), limit)
  } catch {
    return [] // histórico é best-effort; nunca bloqueia a grade
  }
}

/* ------------------------------------------------------------------ */
/* Modelos (templates) de composição de mídia                          */
/* ------------------------------------------------------------------ */

/**
 * Modelos de mídia reusam a coleção studio_edit_presets (mesmo motor de
 * presets do brand-kit/Studio), com o nome prefixado por "secondbrain:" —
 * nenhum enum/collection nova, nenhum campo novo.
 */
const SB_TEMPLATE_PREFIX = `${SB_MEDIA_PREFIX}:`

export type SecondBrainMediaTemplate = StudioEditPreset

const isSbTemplate = (p: StudioEditPreset) => p.name.startsWith(SB_TEMPLATE_PREFIX)

/** Cria um modelo de mídia nomeado (composição/ajustes salvos). */
export async function createSecondBrainMediaTemplate(input: {
  name: string
  settings: AdvancedCustomizationState
}): Promise<SecondBrainMediaTemplate> {
  const clean = input.name.trim() || 'Modelo de mídia'
  return saveEditPreset(`${SB_TEMPLATE_PREFIX}${clean}`, input.settings)
}

/** Lista os modelos de mídia do Segundo Cérebro. */
export async function listSecondBrainMediaTemplates(): Promise<SecondBrainMediaTemplate[]> {
  try {
    const all = await listEditPresets()
    return all.filter(isSbTemplate)
  } catch {
    return []
  }
}

/** Aplica (replica) o modelo em outra mídia — devolve apenas o settings. */
export function applySecondBrainMediaTemplate(
  template: SecondBrainMediaTemplate,
): Partial<AdvancedCustomizationState> {
  return template.settings || {}
}

/** Exclui um modelo de mídia. */
export async function deleteSecondBrainMediaTemplate(id: string): Promise<void> {
  // studio_edit_presets guarda o nome com prefixo; deleção direta pelo id.
  await pb.collection('studio_edit_presets').delete(id)
}
