/**
 * Parser de Markdown LEVE (próprio, sem dependências) para notas do Segundo
 * Cérebro. ESCAPA TODO HTML antes do parse — a prévia nunca executa markup
 * bruto. Suporta: negrito, itálico, código inline, links, títulos, listas,
 * imagens, VÍDEO (mp4/webm/embed YouTube/Vimeo/TikTok), ÁUDIO (mp3/wav/ogg),
 * SPOTIFY (embed) e PDF (prévia via <object>).
 */

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** Sanitiza href: aceita apenas http(s) — nunca javascript:/data:. */
const safeHref = (url: string): string | null => {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

/** Sanitiza src de mídia: aceita apenas http(s) — nunca javascript:/data:. */
const safeImgSrc = (url: string): string | null => safeHref(url)

/** Extensões de mídia reconhecidas dentro de ![alt](url). */
const VIDEO_EXT = /\.(mp4|webm|ogv|mov)(\?|#|$)/i
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac|oga|flac)(\?|#|$)/i
const PDF_EXT = /\.(pdf)(\?|#|$)/i

/** Extrai o id de vídeo de um embed do YouTube (watch, youtu.be, shorts, embed). */
export const youtubeIdFromUrl = (url: string): string | null => {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null
    if (host.endsWith('youtube.com')) {
      if (u.pathname.startsWith('/watch')) return u.searchParams.get('v')
      const m = u.pathname.match(/^\/(embed|shorts|live)\/([^/?#]+)/)
      if (m) return m[2]
    }
    return null
  } catch {
    return null
  }
}

/** Extrai o id de vídeo de um player do Vimeo. */
export const vimeoIdFromUrl = (url: string): string | null => {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return m ? m[1] : null
}

/**
 * Extrai o id numérico de um vídeo do TikTok (tiktok.com/@user/video/123,
 * vm.tiktok.com redireciona — só o padrão com id numérico é aceito).
 */
export const tiktokIdFromUrl = (url: string): string | null => {
  const m = (url || '').match(/tiktok\.com\/(?:@[^/]+\/video\/|embed\/v2\/|v\/)?(\d{6,})/)
  return m ? m[1] : null
}

/**
 * Converte uma URL do Spotify (open.spotify.com/track|album|playlist|episode|
 * show|artist/ID, com ou sem prefixo intl-xx) no caminho de embed
 * "tipo/ID". Null quando não é Spotify.
 */
export const spotifyEmbedPathFromUrl = (url: string): string | null => {
  const m = (url || '').match(
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/,
  )
  return m ? `${m[1]}/${m[2]}` : null
}

/** true quando a URL aponta para um arquivo PDF. */
export const isPdfUrl = (url: string): boolean => PDF_EXT.test(url || '')
/** true quando a URL aponta para um arquivo de áudio. */
export const isAudioUrl = (url: string): boolean => AUDIO_EXT.test(url || '')
/** true quando a URL aponta para um arquivo de vídeo. */
export const isVideoUrl = (url: string): boolean => VIDEO_EXT.test(url || '')

const iframeClass =
  'w-full aspect-video max-w-full rounded-lg border border-slate-700/60 my-2 block'

/** Renderiza ![alt](url) como vídeo/áudio quando o tipo é reconhecido. */
const renderMedia = (alt: string, url: string, fallback: string): string => {
  const src = safeImgSrc(url)
  if (!src) return fallback
  if (isAudioUrl(src)) {
    return (
      `<figure class="my-2 max-w-full">` +
      `<audio controls preload="metadata" src="${src}" class="w-full max-w-md">` +
      `</audio>` +
      (alt ? `<figcaption class="text-[11px] text-slate-400 mt-1">${alt}</figcaption>` : '') +
      `</figure>`
    )
  }
  if (isVideoUrl(src)) {
    return (
      `<video controls preload="metadata" src="${src}" ` +
      `class="w-full max-w-full rounded-lg border border-slate-700/60 my-2"></video>` +
      (alt ? `<span class="block text-[11px] text-slate-400 -mt-1 mb-2">${alt}</span>` : '')
    )
  }
  const yt = youtubeIdFromUrl(src)
  if (yt) {
    return (
      `<iframe src="https://www.youtube.com/embed/${yt}" title="${alt || 'Vídeo'}" ` +
      `allowfullscreen loading="lazy" class="${iframeClass}"></iframe>`
    )
  }
  const vm = vimeoIdFromUrl(src)
  if (vm) {
    return (
      `<iframe src="https://player.vimeo.com/video/${vm}" title="${alt || 'Vídeo'}" ` +
      `allowfullscreen loading="lazy" class="${iframeClass}"></iframe>`
    )
  }
  const tt = tiktokIdFromUrl(src)
  if (tt) {
    return (
      `<figure class="my-2 max-w-full">` +
      `<iframe src="https://www.tiktok.com/embed/v2/${tt}" title="${alt || 'Vídeo do TikTok'}" ` +
      `allow="encrypted-media;" allowfullscreen loading="lazy" ` +
      `class="w-full max-w-[340px] aspect-[9/16] h-[600px] rounded-lg border border-slate-700/60 block"></iframe>` +
      (alt ? `<figcaption class="text-[11px] text-slate-400 mt-1">${alt}</figcaption>` : '') +
      `</figure>`
    )
  }
  const sp = spotifyEmbedPathFromUrl(src)
  if (sp) {
    const tall = /^(album|playlist|show|episode)\//.test(sp)
    return (
      `<figure class="my-2 max-w-full">` +
      `<iframe src="https://open.spotify.com/embed/${sp}" title="${alt || 'Spotify'}" ` +
      `allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" ` +
      `loading="lazy" class="w-full max-w-md rounded-lg border border-slate-700/60 block" ` +
      `style="height:${tall ? 352 : 152}px"></iframe>` +
      (alt ? `<figcaption class="text-[11px] text-slate-400 mt-1">${alt}</figcaption>` : '') +
      `</figure>`
    )
  }
  if (isPdfUrl(src)) {
    return (
      `<figure class="my-2 max-w-full">` +
      `<object data="${src}" type="application/pdf" ` +
      `class="w-full h-[420px] max-w-full rounded-lg border border-slate-700/60 my-2">` +
      `<span class="text-sm text-slate-300">Prévia de PDF indisponível neste navegador — ` +
      `<a href="${src}" target="_blank" rel="noreferrer" class="text-purple-300 underline underline-offset-2">abrir o arquivo</a></span>` +
      `</object>` +
      (alt ? `<figcaption class="text-[11px] text-slate-400 mt-1">${alt}</figcaption>` : '') +
      `</figure>`
    )
  }
  return fallback
}

/** Inline: código, mídia, negrito, itálico e links (o texto já veio escapado). */
const renderInline = (escaped: string): string => {
  // Código inline guardado primeiro: mantém o conteúdo fora dos demais parses.
  const codes: string[] = []
  let out = escaped
  out = out.replace(/`([^`]+)`/g, (_m, code: string) => {
    codes.push(code)
    return `\uE000${codes.length - 1}\uE001`
  })

  out = out
    // Mídia ![alt](url) — imagem, vídeo, áudio, TikTok, Spotify ou PDF; antes dos links
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt: string, url: string) => {
      const src = safeImgSrc(url)
      const fallback =
        `<img src="${src || ''}" alt="${alt}" ` +
        `class="w-auto max-w-full h-auto rounded-lg border border-slate-700/60 my-2" ` +
        `loading="lazy" />`
      if (!src) return m
      return renderMedia(alt, url, fallback)
    })
    // Links [texto](url)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text: string, url: string) => {
      const href = safeHref(url)
      return href
        ? `<a href="${href}" target="_blank" rel="noreferrer" class="text-purple-300 underline underline-offset-2 hover:text-purple-200">${text}</a>`
        : m
    })
    // Negrito **x** / __x__
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
    .replace(/__([^_]+)__/g, '<strong class="font-bold text-white">$1</strong>')
    // Itálico *x* / _x_
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em class="italic">$2</em>')
    .replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, '$1<em class="italic">$2</em>')

  // Restaura o código inline escapado.
  out = out.replace(/\uE000(\d+)\uE001/g, (_m, idx: string) => {
    const code = codes[Number(idx)]
    return code
      ? `<code class="rounded bg-slate-800 px-1 py-0.5 text-[0.85em] text-purple-200 font-mono">${code}</code>`
      : ''
  })
  return out
}

/** Valida uma URL externa colada pelo usuário: só http(s). Null quando inválida. */
export const safeExternalUrl = (raw: string): string | null => {
  const value = (raw || '').trim()
  if (!/^https?:\/\//i.test(value)) return null
  const src = safeImgSrc(value)
  if (src) return src
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

const H_CLASS = 'font-bold text-white'
const P_CLASS = 'text-sm leading-relaxed text-slate-200'
const LI_CLASS = 'text-sm leading-relaxed text-slate-200'

/**
 * Converte Markdown leve em HTML seguro (o input é escapado ANTES do parse).
 * Blocos: títulos (# ## ###), listas (-, *, 1.), parágrafos. Suporta inline e
 * mídia (imagem/vídeo/áudio/TikTok/Spotify/PDF) via ![alt](url).
 */
export function renderMarkdownLite(src: string): string {
  const lines = escapeHtml(src || '').split(/\r?\n/)
  const html: string[] = []
  let list: 'ul' | 'ol' | null = null
  const closeList = () => {
    if (list) {
      html.push(`</${list}>`)
      list = null
    }
  }

  for (const line of lines) {
    const t = line.trim()
    if (!t) {
      closeList()
      continue
    }
    const heading = t.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      closeList()
      const level = heading[1].length + 2 // # → h3, ## → h4, ### → h5
      html.push(
        `<h${level} class="${H_CLASS} ${level === 3 ? 'text-lg' : level === 4 ? 'text-base' : 'text-sm'}">${renderInline(heading[2])}</h${level}>`,
      )
      continue
    }
    const ul = t.match(/^[-*]\s+(.*)$/)
    if (ul) {
      if (list !== 'ul') {
        closeList()
        html.push('<ul class="list-disc pl-5 space-y-1 my-2">')
        list = 'ul'
      }
      html.push(`<li class="${LI_CLASS}">${renderInline(ul[1])}</li>`)
      continue
    }
    const ol = t.match(/^\d+[.)]\s+(.*)$/)
    if (ol) {
      if (list !== 'ol') {
        closeList()
        html.push('<ol class="list-decimal pl-5 space-y-1 my-2">')
        list = 'ol'
      }
      html.push(`<li class="${LI_CLASS}">${renderInline(ol[1])}</li>`)
      continue
    }
    closeList()
    html.push(`<p class="${P_CLASS}">${renderInline(t)}</p>`)
  }
  closeList()
  return html.join('\n')
}
