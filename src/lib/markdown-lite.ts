/**
 * Parser de Markdown LEVE (próprio, sem dependências) para notas do Segundo
 * Cérebro. ESCAPA TODO HTML antes do parse — a prévia nunca executa markup
 * bruto. Suporta: negrito, itálico, código inline, links e títulos e listas.
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

/** Sanitiza src de imagem: aceita apenas http(s) — nunca javascript:/data:. */
const safeImgSrc = (url: string): string | null => {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

/** Inline: código, imagens, negrito, itálico e links (o texto já veio escapado). */
const renderInline = (escaped: string): string => {
  // Código inline guardado primeiro: mantém o conteúdo fora dos demais parses.
  const codes: string[] = []
  let out = escaped
  out = out.replace(/`([^`]+)`/g, (_m, code: string) => {
    codes.push(code)
    return `\uE000${codes.length - 1}\uE001`
  })

  out = out
    // Imagens ![alt](url) — antes dos links, para não virar <a> aninhado
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt: string, url: string) => {
      const src = safeImgSrc(url)
      return src
        ? `<img src="${src}" alt="${alt}" class="max-w-full rounded-lg border border-slate-700/60 my-2" loading="lazy" />`
        : m
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
 * Blocos: títulos (# ## ###), listas (-, *, 1.), parágrafos. Suporta inline.
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
