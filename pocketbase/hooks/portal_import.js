// =========================================================================
// Endpoint: importar conteúdo de URL para o portal (pedido "importar com IA").
// O cliente tenta primeiro o conector Firecrawl da conta do usuário; se não
// houver, cai para $http.fetch nativo + extração de texto simples.
//
// POST /backend/v1/portals/import-url { url }
// -> { success: true, text: "..." }
//
// Toda lógica é inline no callback (limitação de scoping do JSVM).
// =========================================================================
routerAdd(
  'POST',
  '/backend/v1/portals/import-url',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('Autenticação necessária.')
    const body = e.requestInfo().body || {}
    const url = String(body.url || '').trim()
    if (!/^https?:\/\/[^\s]+$/i.test(url)) {
      return e.badRequest('URL inválida: use o formato https://exemplo.com/pagina.')
    }

    let text = ''

    // 1) Tenta o conector Firecrawl da conta do usuário, se conectado.
    try {
      const res = $connectors.execute('firecrawl', 'scrape', { url })
      const fmt = res?.data || res
      text = String(fmt?.markdown || fmt?.content || fmt?.text || '').trim()
    } catch (_) {
      text = ''
    }

    // 2) Fallback: fetch nativo + extração de texto do HTML.
    if (!text) {
      try {
        const res = $http.fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; MidiaVivaBot/1.0; +https://midiaviva.app) AppleWebKit/537.36 Chrome/120 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml',
          },
        })
        const html = res.body || ''
        // Isola o <body>, remove script/style, converte blocos em quebras de linha.
        let work = html
        const bodyStart = work.search(/<body[\s>]/i)
        if (bodyStart !== -1) work = work.slice(bodyStart)
        work = work
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
          .replace(/<!--[\s\S]*?-->/g, ' ')
          .replace(/<(h1|H1)[^>]*>/g, '\n\n# ')
          .replace(/<(h2|H2)[^>]*>/g, '\n\n## ')
          .replace(/<(h3|H3)[^>]*>/g, '\n\n### ')
          .replace(/<(p|P)[^>]*>/g, '\n')
          .replace(/<(br|BR)[^>]*\/?>/g, '\n')
          .replace(/<(li|LI)[^>]*>/g, '\n- ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&#(\d+);/g, (m, code) => String.fromCharCode(parseInt(code)))
          .replace(/[ \t]+/g, ' ')
          .replace(/\n\s+\n/g, '\n\n')
          .trim()
        text = work
      } catch (err) {
        return e.badRequest(
          'Não conseguimos baixar essa página pelo servidor. Verifique o endereço ou cole o conteúdo manualmente.',
        )
      }
    }

    if (!text) {
      return e.badRequest(
        'Não conseguimos extrair texto dessa página (pode ser muito pesada ou bloquear robôs). Cole o conteúdo manualmente.',
      )
    }

    // Limita a ~12 mil caracteres — o mesmo teto do briefing de IA no cliente.
    if (text.length > 12000) text = text.slice(0, 12000)
    return e.json(200, { success: true, text })
  },
  $apis.requireAuth(),
)
