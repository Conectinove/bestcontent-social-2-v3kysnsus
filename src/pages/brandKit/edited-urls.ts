/** Chave única do localStorage que persiste URLs editadas por asset do brand-kit. */
export const EDITED_URLS_KEY = 'brandkit:edited-urls'

/** Mapa assetId → URL persistida da versão editada (só http sobrevive a reloads). */
export function loadEditedUrlsMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(EDITED_URLS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

/** Grava (ou remove, com url vazia) a URL editada de um asset. */
export function persistEditedUrl(assetId: string, url: string) {
  const map = loadEditedUrlsMap()
  if (url && url.startsWith('http')) {
    map[assetId] = url
  } else {
    delete map[assetId]
  }
  try {
    localStorage.setItem(EDITED_URLS_KEY, JSON.stringify(map))
  } catch {
    // cota cheia: segue em sessão
  }
}
