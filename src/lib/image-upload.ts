import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getAssetUrl, uploadImageBankAsset } from '@/services/image-bank'

/**
 * Faz upload de uma imagem da comunidade (anexo de tópico/mídia editada)
 * usando o banco de imagens existente e devolve a URL pública do arquivo.
 */
export async function uploadCommunityImage(file: File): Promise<string> {
  const asset = await uploadImageBankAsset(file, {
    name: file.name.replace(/\.[^/.]+$/, '') || 'Imagem da comunidade',
    category: 'geral',
  })
  const url = getAssetUrl(asset)
  if (!url) {
    throw new Error('Upload concluído, mas a URL da imagem não foi gerada.')
  }
  return url
}

/** Mensagem amigável em pt-BR para falhas de upload/processamento de imagem. */
export function getImageUrlErrorMessage(err: unknown): string {
  const raw = getErrorMessage(err)
  if (raw && !/unexpected error/i.test(raw)) return raw
  return 'Não foi possível processar a imagem. Verifique o formato e tente novamente.'
}
