/**
 * PocketBase Hook: second_brain_media.js
 * Rotas de mídia da grade "Mídias & Anexos" do Segundo Cérebro:
 *
 *  GET /backend/v1/secondbrain/stock-status
 *    → { unsplash_configured, pexels_configured } (lê segredos do ambiente)
 *
 *  GET /backend/v1/secondbrain/stock-search?provider=unsplash|pexels&q=...
 *    → busca imagens reais na API pública (Unsplash / Pexels) quando a chave
 *      está configurada; sem chave, retorna configured:false + estado vazio
 *      honesto (nunca simula dados).
 *
 * Padrão da casa: lógica inline no routerAdd (JSVM não enxerga funções de
 * nível superior em callbacks), $http.send com timeout, erros em e.json(200).
 */
routerAdd('GET', '/backend/v1/secondbrain/stock-status', (e) => {
  const unsplashKey = ($os.getenv('UNSPLASH_ACCESS_KEY') || '').trim()
  const pexelsKey = ($os.getenv('PEXELS_API_KEY') || '').trim()
  e.json(200, {
    unsplash_configured: Boolean(unsplashKey && unsplashKey.length > 5),
    pexels_configured: Boolean(pexelsKey && pexelsKey.length > 5),
  })
})

routerAdd('GET', '/backend/v1/secondbrain/stock-search', (e) => {
  const info = e.requestInfo()
  const q = info.query || {}
  const provider = String(q.provider || 'unsplash').toLowerCase()
  const query = String(q.q || '').trim()

  if (!query) {
    return e.json(200, {
      success: false,
      configured: true,
      message: 'Termo de busca obrigatório.',
      results: [],
    })
  }

  if (provider === 'unsplash') {
    const key = ($os.getenv('UNSPLASH_ACCESS_KEY') || '').trim()
    if (!key || key.length < 6) {
      return e.json(200, {
        success: false,
        configured: false,
        message:
          'Configure a chave UNSPLASH_ACCESS_KEY no painel Skip Cloud para buscar no Unsplash.',
        results: [],
      })
    }
    try {
      const res = $http.send({
        url:
          'https://api.unsplash.com/search/photos?per_page=24&content_filter=high&query=' +
          encodeURIComponent(query),
        method: 'GET',
        headers: { Authorization: 'Client-ID ' + key },
        timeout: 20,
      })
      if (res.statusCode !== 200) {
        return e.json(200, {
          success: false,
          configured: true,
          message: 'Unsplash respondeu ' + res.statusCode + '. Tente novamente em instantes.',
          results: [],
        })
      }
      const items = (res.json && res.json.results) || []
      const results = []
      for (let i = 0; i < items.length; i++) {
        const p = items[i]
        results.push({
          id: p.id || 'us-' + i,
          title: (p.description || p.alt_description || query).slice(0, 120),
          thumb_url: p.urls && (p.urls.small || p.urls.thumb || p.urls.regular),
          url: p.urls && (p.urls.regular || p.urls.full),
          width: p.width,
          height: p.height,
          author: p.user && p.user.name,
          author_url: p.user && ((p.user.links && p.user.links.html) || ''),
          source: 'unsplash',
        })
      }
      return e.json(200, { success: true, configured: true, provider: 'unsplash', results })
    } catch (err) {
      return e.json(200, {
        success: false,
        configured: true,
        message: 'Falha ao consultar o Unsplash: ' + (err && err.message ? err.message : 'erro'),
        results: [],
      })
    }
  }

  if (provider === 'pexels') {
    const key = ($os.getenv('PEXELS_API_KEY') || '').trim()
    if (!key || key.length < 6) {
      return e.json(200, {
        success: false,
        configured: false,
        message: 'Configure a chave PEXELS_API_KEY no painel Skip Cloud para buscar no Pexels.',
        results: [],
      })
    }
    try {
      const res = $http.send({
        url: 'https://api.pexels.com/v1/search?per_page=24&query=' + encodeURIComponent(query),
        method: 'GET',
        headers: { Authorization: key },
        timeout: 20,
      })
      if (res.statusCode !== 200) {
        return e.json(200, {
          success: false,
          configured: true,
          message: 'Pexels respondeu ' + res.statusCode + '. Tente novamente em instantes.',
          results: [],
        })
      }
      const items = (res.json && res.json.photos) || []
      const results = []
      for (let i = 0; i < items.length; i++) {
        const p = items[i]
        results.push({
          id: String(p.id || 'px-' + i),
          title: (p.alt || query).slice(0, 120),
          thumb_url: p.src && (p.src.medium || p.src.small || p.src.large),
          url: p.src && (p.src.large || p.src.large2x || p.src.original),
          width: p.width,
          height: p.height,
          author: p.photographer,
          author_url: p.photographer_url,
          source: 'pexels',
        })
      }
      return e.json(200, { success: true, configured: true, provider: 'pexels', results })
    } catch (err) {
      return e.json(200, {
        success: false,
        configured: true,
        message: 'Falha ao consultar o Pexels: ' + (err && err.message ? err.message : 'erro'),
        results: [],
      })
    }
  }

  return e.json(200, {
    success: false,
    configured: true,
    message: 'Provedor desconhecido.',
    results: [],
  })
})
