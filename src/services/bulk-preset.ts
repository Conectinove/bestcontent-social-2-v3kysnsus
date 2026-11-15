import pb from '@/lib/pocketbase/client'
import type { AdvancedCustomizationState } from '@/components/workspace/AdvancedCustomizationPanel'
import type { TextLayer } from '@/services/studio-edit-versions'
import { saveEditVersion } from '@/services/studio-edit-versions'
import { uploadImageBankAsset, type ImageBankAsset } from '@/services/image-bank'
import { dataUrlToFile, rasterizeEditedImage, type RasterizeFormat } from '@/lib/rasterize'
import { persistEditedUrl } from '@/pages/brandKit/edited-urls'

export interface BulkItem {
  assetId: string
  srcUrl: string
  name: string
  category?: string
  network?: string
  brand?: string
  aspectRatio?: string
  /** URL editada já existente (re-aplicação em cima do editado anterior). */
  previousEditedUrl?: string
}

export interface BulkProgress {
  done: number
  total: number
  currentName: string
  ok: number
  failed: number
}

/**
 * Aplica um preset (settings + textLayers) em vários assets do acervo:
 * rasteriza cada um e persiste igual ao handleAdvancedSave individual
 * (upload no acervo via uploadImageBankAsset + editedUrls + versão).
 * Chama onProgress a cada item concluído.
 */
export async function applyPresetToAssets(
  items: BulkItem[],
  preset: {
    name: string
    settings: AdvancedCustomizationState
    textLayers?: TextLayer[] | null
    aspectRatio?: string
  },
  onProgress?: (p: BulkProgress) => void,
): Promise<BulkProgress> {
  const result: BulkProgress = { done: 0, total: items.length, currentName: '', ok: 0, failed: 0 }
  for (const item of items) {
    result.currentName = item.name
    onProgress?.({ ...result })
    try {
      // Base: usa a editada anterior quando existir (acumula tratamentos).
      const base = item.previousEditedUrl || item.srcUrl
      const dataUrl = await rasterizeEditedImage({
        src: base,
        settings: preset.settings,
        textLayers: preset.textLayers || [],
        aspectRatio: preset.aspectRatio || item.aspectRatio,
        format: 'png' as RasterizeFormat,
      })
      const file = dataUrlToFile(dataUrl, `edit-${item.assetId}-${Date.now()}.png`)
      if (!file) throw new Error('rasterização vazia')
      const uploaded: ImageBankAsset = await uploadImageBankAsset(file, {
        name: `${item.name} (editado)`,
        category: item.category,
        network: item.network,
        brand: item.brand,
        tags: ['editado', 'preset'],
      })
      // URL persistida: arquivo do acervo (getAssetUrl) ou preview_url.
      const persistedUrl = uploaded.file
        ? pb.files.getURL(uploaded as any, uploaded.file)
        : uploaded.preview_url || ''
      persistEditedUrl(item.assetId, persistedUrl)
      await saveEditVersion({
        targetKey: `brandkit:${item.assetId}`,
        title: `Preset em lote: ${preset.name}`,
        settings: preset.settings,
        textLayers: preset.textLayers || [],
        aspectRatio: preset.aspectRatio || item.aspectRatio || '',
        previewUrl: base.startsWith('data:') ? '' : base,
        resultUrl: persistedUrl,
      }).catch(() => null)
      result.ok += 1
    } catch {
      result.failed += 1
    }
    result.done += 1
    onProgress?.({ ...result })
  }
  return result
}
