import { toast } from '@/hooks/use-toast'

interface DownloadOptions {
  filename?: string
  mediaType?: 'image' | 'video' | 'audio' | string
  onProgress?: (progress: number) => void
}

/**
 * Faz download de qualquer mídia ou asset da web para o dispositivo.
 * 1. Tenta fetch com blob (para arquivos com CORS habilitado ou da mesma origem)
 * 2. Se falhar por restrição de CORS / rede, aciona fallback abrindo link direto com download ou target _blank
 * 3. Mostra feedback visual com toast explicativo
 */
export async function downloadAssetMedia(
  url: string,
  options?: DownloadOptions,
): Promise<{ success: boolean; fallbackUsed: boolean }> {
  if (!url) {
    toast({
      title: 'URL inválida',
      description: 'Nenhum link de mídia disponível para download.',
      variant: 'destructive',
    })
    return { success: false, fallbackUsed: false }
  }

  const { filename, mediaType } = options || {}

  // Determinar extensão e nome de arquivo
  let safeFilename = filename
  if (!safeFilename) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    let ext = 'jpg'
    if (mediaType === 'video' || url.includes('.mp4') || url.includes('video')) ext = 'mp4'
    else if (mediaType === 'audio' || url.includes('.mp3') || url.includes('audio')) ext = 'mp3'
    else if (url.includes('.png')) ext = 'png'
    else if (url.includes('.webp')) ext = 'webp'
    safeFilename = `midiaviva-asset-${timestamp}.${ext}`
  }

  try {
    // 1. Tentativa via Fetch Blob
    const response = await fetch(url, { credentials: 'omit', mode: 'cors' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = safeFilename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)

    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000)

    toast({
      title: 'Download iniciado',
      description: `Arquivo ${safeFilename} salvo no seu dispositivo com sucesso.`,
    })

    return { success: true, fallbackUsed: false }
  } catch (error) {
    // 2. Fallback resiliente para origens externas com bloqueio de CORS (ex: CDNs externos, S3, etc.)
    console.warn('Download direto bloqueado por CORS, ativando fallback em nova aba:', error)

    try {
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      anchor.download = safeFilename
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)

      toast({
        title: 'Abrindo mídia externa',
        description: 'Asset de origem externa aberto para download direto pelo navegador.',
      })

      return { success: true, fallbackUsed: true }
    } catch (fallbackError) {
      toast({
        title: 'Erro ao baixar arquivo',
        description: 'Não foi possível salvar o arquivo automaticamente. Tente abrir em nova aba.',
        variant: 'destructive',
      })
      return { success: false, fallbackUsed: true }
    }
  }
}
