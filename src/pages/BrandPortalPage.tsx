import { useEffect, useState } from 'react'
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react'
import { useParams, Link } from 'react-router-dom'
import { getPortalByToken } from '@/services/brand-portals'
import {
  fetchPublicPortalPages,
  recordPortalVisit,
  type PortalBlock,
  type PortalPageContent,
} from '@/services/portal-pages'

interface PortalData {
  id: string
  brandId: string
  brandName: string
  description: string
  logoUrl: string
  accentColor: string
  bgColor: string
  textColor: string
  buttonColor: string
  gaMeasurementId: string
  website: string
  pages: Array<{ id: string; title: string; slug: string; content: PortalPageContent }>
}

const BASE = import.meta.env.VITE_POCKETBASE_URL || ''

/** URL do logo: caminho relativo do hook (/api/files/…) vira URL absoluta do backend. */
function absolutizeLogo(url: string): string {
  const raw = (url || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return `${BASE}${raw.startsWith('/') ? '' : '/'}${raw}`
}

/* ------------------------------------------------------------------ */
/* Render dos blocos (usado também pelas páginas internas)             */
/* ------------------------------------------------------------------ */

/** Converte URL de YouTube/Vimeo em URL de embed; devolve '' se não reconhecer. */
export function toVideoEmbedUrl(url: string): string {
  const raw = (url || '').trim()
  if (!raw) return ''
  const yt =
    raw.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,20})/i) || null
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = raw.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/i)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return raw
}

export function PortalBlockView({ block, accent }: { block: PortalBlock; accent: string }) {
  if (block.type === 'title') {
    return (
      <h3 className="text-lg font-black" style={{ color: accent }}>
        {block.text}
      </h3>
    )
  }
  if (block.type === 'text') {
    return <p className="text-sm whitespace-pre-wrap leading-relaxed">{block.text}</p>
  }
  if (block.type === 'image') {
    if (!block.url) return null
    return (
      <figure className="space-y-1">
        <img
          src={block.url}
          alt={block.text || ''}
          className="w-full rounded-xl object-cover max-h-96"
        />
        {block.text && (
          <figcaption className="text-[11px] text-muted-foreground">{block.text}</figcaption>
        )}
      </figure>
    )
  }
  if (block.type === 'cta') {
    if (!block.url) return null
    return (
      <a
        href={block.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: accent }}
      >
        {block.text || 'Clique aqui'}
      </a>
    )
  }
  if (block.type === 'spacer') {
    return <div style={{ height: `${block.height ?? 32}px` }} aria-hidden />
  }
  if (block.type === 'gallery') {
    const urls = Array.isArray(block.urls) ? block.urls.filter(Boolean) : []
    if (urls.length === 0) return null
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {urls.map((u, i) => (
          <img
            key={`${u}-${i}`}
            src={u}
            alt=""
            className="w-full aspect-square object-cover rounded-lg"
          />
        ))}
      </div>
    )
  }
  if (block.type === 'video') {
    const embed = toVideoEmbedUrl(block.url || '')
    if (!embed) return null
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black/90">
        <iframe
          src={embed}
          title="Vídeo"
          className="size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }
  if (block.type === 'divider') {
    return (
      <hr className="border-t border-dashed border-border" style={{ borderColor: `${accent}55` }} />
    )
  }
  if (block.type === 'quote') {
    return (
      <blockquote
        className="border-l-4 pl-4 py-1 italic text-sm leading-relaxed"
        style={{ borderColor: accent }}
      >
        {block.text}
        {block.author && (
          <footer className="mt-1 text-[11px] not-italic text-muted-foreground">
            — {block.author}
          </footer>
        )}
      </blockquote>
    )
  }
  return null
}

/** Página pública do portal (rota /portal/:token) — cores da marca + logo + GA + blocos. */
export default function BrandPortalPage() {
  const { token = '' } = useParams<{ token: string }>()
  const [data, setData] = useState<PortalData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setError(null)
    getPortalByToken(token)
      .then((res) => {
        if (!alive) return
        recordPortalVisit(token, 'home')
        return fetchPublicPortalPages(token).then((pages) => {
          if (!alive) return
          setData({
            id: res.id,
            brandId: res.brandId,
            brandName: res.brandName || 'Portal',
            description: res.description,
            logoUrl: absolutizeLogo(res.logoUrl),
            accentColor: res.accentColor || '',
            bgColor: res.bgColor || '',
            textColor: res.textColor || '',
            buttonColor: res.buttonColor || '',
            gaMeasurementId: res.gaMeasurementId || '',
            website: res.website,
            pages: (pages || []).map((p) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              content: (p.content as PortalPageContent) || {},
            })),
          })
        })
      })
      .catch(() => setError('Portal não encontrado ou indisponível.'))
    return () => {
      alive = false
    }
  }, [token])

  // Google Analytics (pedido 3): injeta gtag.js só quando há Measurement ID.
  useEffect(() => {
    const gaId = data?.gaMeasurementId || ''
    if (!gaId) return
    const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void }
    w.dataLayer = w.dataLayer || []
    w.gtag = function gtag(...args: unknown[]) {
      w.dataLayer!.push(args)
    }
    w.gtag('js', new Date())
    w.gtag('config', gaId)
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [data?.gaMeasurementId])

  // Visita registrada por página interna também (analytics por slug).
  useEffect(() => {
    if (data) recordPortalVisit(token, activeSlug || 'home')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlug])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link to="/" className="text-xs text-primary underline">
            Voltar ao início
          </Link>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  // Cores da marca (pedido 1): extras configurados no painel, com fallback.
  const accent = data.accentColor || data.buttonColor || '#7C3AED'
  const buttonColor = data.buttonColor || accent
  const hasCustomBg = Boolean(data.bgColor)
  const textColor = data.textColor
  const pageBg = data.bgColor || undefined
  const contentSurface = hasCustomBg ? 'rgba(255,255,255,0.72)' : undefined

  const current = data.pages.find((p) => p.slug === activeSlug)
  const heroPage = !activeSlug
  const pageText = current?.content?.text || ''
  const pageBlocks = Array.isArray(current?.content?.blocks) ? current!.content!.blocks! : []
  const logoUrl = data.logoUrl

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950" style={{ backgroundColor: pageBg }}>
      {/* variáveis CSS: tudo dentro do portal usa a paleta da marca */}
      <style>{`
        :root {
          --portal-accent: ${accent};
          --portal-button: ${buttonColor};
          ${textColor ? `--portal-text: ${textColor};` : ''}
        }
      `}</style>

      <header
        className="py-10 px-6"
        style={{
          background: textColor
            ? `linear-gradient(135deg, ${accent}, ${accent}CC)`
            : `linear-gradient(135deg, ${accent}, ${accent}CC)`,
          color: '#fff',
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={data.brandName}
                className="h-14 w-14 rounded-xl bg-white/90 object-contain p-1.5 shadow-sm"
              />
            ) : (
              <div
                className="h-14 w-14 rounded-xl flex items-center justify-center text-xl font-black bg-white/90"
                style={{ color: accent }}
              >
                {(data.brandName || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs opacity-80">Portal da marca</p>
              <h1 className="text-2xl font-black truncate">{data.brandName}</h1>
            </div>
          </div>
          {data.pages.length > 0 && (
            <nav className="hidden sm:flex items-center gap-1 flex-wrap justify-end">
              <button
                onClick={() => setActiveSlug(null)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                style={{
                  backgroundColor:
                    activeSlug === null ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                }}
              >
                Início
              </button>
              {data.pages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveSlug(p.slug)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                  style={{
                    backgroundColor:
                      activeSlug === p.slug ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                  }}
                >
                  {p.title}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {heroPage ? (
          <>
            <p
              className="text-sm text-muted-foreground"
              style={textColor ? { color: textColor, opacity: 0.75 } : undefined}
            >
              Bem-vindo ao portal de {data.brandName}. Confira abaixo as páginas disponíveis.
            </p>
            <div className="grid gap-3">
              {data.pages.length === 0 ? (
                <div
                  className="p-6 rounded-2xl border border-border bg-white dark:bg-slate-900 text-center text-sm text-muted-foreground"
                  style={
                    hasCustomBg ? { backgroundColor: contentSurface, color: textColor } : undefined
                  }
                >
                  Este portal ainda não tem páginas internas.
                </div>
              ) : (
                data.pages.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveSlug(p.slug)}
                    className="text-left p-5 rounded-2xl border border-border bg-white dark:bg-slate-900 hover:shadow-md transition-shadow"
                    style={hasCustomBg ? { backgroundColor: contentSurface } : undefined}
                  >
                    <span className="text-sm font-bold" style={{ color: accent }}>
                      {p.title}
                    </span>
                    <span
                      className="block text-xs text-muted-foreground mt-1"
                      style={textColor ? { color: textColor, opacity: 0.7 } : undefined}
                    >
                      Clique para abrir /{p.slug}
                    </span>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveSlug(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold"
              style={{ color: accent }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao início
            </button>
            <article
              className="p-6 rounded-2xl border border-border bg-white dark:bg-slate-900 space-y-3"
              style={hasCustomBg ? { backgroundColor: contentSurface } : undefined}
            >
              <h2 className="text-xl font-black" style={{ color: accent }}>
                {current?.title}
              </h2>
              <div
                className="text-sm text-foreground/85 leading-relaxed"
                style={textColor ? { color: textColor } : undefined}
              >
                {pageBlocks.length > 0 ? (
                  <div className="space-y-3">
                    {pageBlocks.map((b) => (
                      <PortalBlockView key={b.id} block={b} accent={accent} />
                    ))}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{pageText || 'Página sem conteúdo ainda.'}</p>
                )}
              </div>
            </article>
          </>
        )}
      </main>

      <footer
        className="border-t border-border py-6 text-center"
        style={textColor ? { borderColor: `${textColor}33` } : undefined}
      >
        <p
          className="text-[11px] text-muted-foreground"
          style={textColor ? { color: textColor, opacity: 0.6 } : undefined}
        >
          © {new Date().getFullYear()} {data.brandName} · Powered by BestContent
        </p>
      </footer>
    </div>
  )
}
