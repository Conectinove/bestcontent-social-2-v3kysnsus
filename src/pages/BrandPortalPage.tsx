import { useEffect, useRef, useState } from 'react'
import { Loader2, AlertTriangle, ArrowLeft, BookOpen, ChevronRight } from 'lucide-react'
import { useParams, Link } from 'react-router-dom'
import { getPortalByToken } from '@/services/brand-portals'
import {
  fetchPublicPortalPages,
  recordPortalVisit,
  type PortalBlock,
  type PortalPageContent,
} from '@/services/portal-pages'
import { recordPortalVideoPlay, recordPortalVideoProgress } from '@/services/portal-visits'

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
  gtmContainerId: string
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

/** Player de vídeo próprio com tracking de engajamento (migration 0122):
 * registra play + marcos 25/50/75/100% e segundos assistidos via POST público,
 * sem duplicar um mesmo marco por sessão. */
function PortalVideoPlayer({
  block,
  accent,
  onVideoPlay,
  onProgress,
}: {
  block: PortalBlock
  accent: string
  onVideoPlay?: () => void
  /** Chamado em cada marco atingido: (progresso 0..100, segundos assistidos desde o último marco). */
  onProgress?: (progress: number, watchedSeconds: number) => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const firedRef = useRef<Set<number>>(new Set())
  const lastTimeRef = useRef(0)

  const handleTimeUpdate = () => {
    const el = videoRef.current
    if (!el || !isFinite(el.duration) || el.duration <= 0) return
    const pct = Math.floor((el.currentTime / el.duration) * 100)
    for (const milestone of [25, 50, 75, 100]) {
      if (pct >= milestone && !firedRef.current.has(milestone)) {
        firedRef.current.add(milestone)
        const now = el.currentTime
        const delta = Math.max(0, now - lastTimeRef.current)
        lastTimeRef.current = now
        onProgress?.(milestone, delta)
      }
    }
  }

  return (
    <video
      ref={videoRef}
      controls
      preload="metadata"
      className="aspect-video w-full overflow-hidden rounded-xl bg-black/90"
      src={block.mediaUrl}
      onPlay={() => {
        lastTimeRef.current = videoRef.current?.currentTime || 0
        onVideoPlay?.()
      }}
      onTimeUpdate={handleTimeUpdate}
    />
  )
}

export function PortalBlockView({
  block,
  accent,
  onVideoPlay,
  onVideoProgress,
}: {
  block: PortalBlock
  accent: string
  /** Chamado quando o visitante dá play num vídeo próprio (métricas de vídeo). */
  onVideoPlay?: () => void
  /** Chamado nos marcos 25/50/75/100%: (progresso, segundos assistidos no trecho). */
  onVideoProgress?: (progress: number, watchedSeconds: number) => void
}) {
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
    // Vídeo próprio enviado: URL completa do arquivo no backend, reproduzido em <video>.
    if (block.mediaId) {
      if (!block.mediaUrl) return null
      return (
        <PortalVideoPlayer
          block={block}
          accent={accent}
          onVideoPlay={onVideoPlay}
          onProgress={onVideoProgress}
        />
      )
    }
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
            gtmContainerId: res.gtmContainerId || '',
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

  // Google Tag Manager (pedido 2): injeta gtm.js só quando há ID do contêiner,
  // com guarda contra duplicação (o id só existe se ainda não injetado).
  useEffect(() => {
    const gtmId = (data?.gtmContainerId || '').trim()
    if (!gtmId) return
    const w = window as unknown as { dataLayer?: unknown[] }
    w.dataLayer = w.dataLayer || []
    w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    // Guarda de duplicação: marca o elemento com o id do contêiner.
    if (!document.getElementById(`gtm-script-${gtmId}`)) {
      const script = document.createElement('script')
      script.id = `gtm-script-${gtmId}`
      script.async = true
      script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`
      document.head.appendChild(script)
    }
    // noscript fallback logo após o body (padrão do GTM).
    if (!document.getElementById(`gtm-noscript-${gtmId}`)) {
      const noscript = document.createElement('noscript')
      noscript.id = `gtm-noscript-${gtmId}`
      noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
      document.body.prepend(noscript)
    }
  }, [data?.gtmContainerId])

  // Visita registrada por página interna também (analytics por slug).
  useEffect(() => {
    if (data) recordPortalVisit(token, activeSlug || 'home')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlug])

  // Métricas de vídeo (pedido "adicionar metricas de video"): play num vídeo
  // próprio registra visualização pública com page + mediaId.
  const handleVideoPlay = (block: PortalBlock) => {
    if (!block.mediaId) return
    recordPortalVideoPlay(token, activeSlug || 'home', String(block.mediaId), current?.id || '')
  }

  // Progresso do vídeo (migration 0122): marcos 25/50/75/100% via POST público.
  const handleVideoProgress =
    (block: PortalBlock) => (progress: number, watchedSeconds: number) => {
      if (!block.mediaId) return
      void recordPortalVideoProgress(
        token,
        String(block.mediaId),
        progress,
        watchedSeconds,
        current?.id || '',
      )
    }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 mx-auto">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </span>
          <h1 className="text-base font-bold text-foreground">Portal indisponível</h1>
          <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
          <Link to="/" className="inline-block text-xs font-semibold text-primary underline">
            Voltar ao início
          </Link>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
    <div className="min-h-screen bg-background" style={{ backgroundColor: pageBg }}>
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
          {/* Navegação mobile: seletor compacto — o nav em chips só existe a partir de sm */}
          {data.pages.length > 0 && (
            <nav className="sm:hidden w-full">
              <label className="sr-only" htmlFor="portal-page-nav">
                Ir para página
              </label>
              <select
                id="portal-page-nav"
                value={activeSlug || ''}
                onChange={(e) => setActiveSlug(e.target.value || null)}
                className="w-full rounded-xl bg-white/15 px-3 py-2 text-xs font-bold text-white outline-hidden"
                style={{ color: '#fff' }}
              >
                <option value="" style={{ color: '#111' }}>
                  Início
                </option>
                {data.pages.map((p) => (
                  <option key={p.id} value={p.slug} style={{ color: '#111' }}>
                    {p.title}
                  </option>
                ))}
              </select>
            </nav>
          )}
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
              Bem-vindo ao portal de {data.brandName}. Escolha uma página abaixo para começar.
            </p>
            <div className="grid gap-3">
              {data.pages.length === 0 ? (
                <div
                  className="p-8 rounded-2xl border border-dashed border-border bg-card text-center space-y-2"
                  style={
                    hasCustomBg ? { backgroundColor: contentSurface, color: textColor } : undefined
                  }
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl mx-auto"
                    style={{ backgroundColor: `${accent}18`, color: accent }}
                  >
                    <BookOpen className="w-5 h-5" />
                  </span>
                  <p className="text-sm font-bold" style={{ color: textColor || undefined }}>
                    Este portal ainda não tem páginas internas
                  </p>
                  <p
                    className="text-xs text-muted-foreground"
                    style={textColor ? { color: textColor, opacity: 0.7 } : undefined}
                  >
                    As páginas publicadas pelo gerenciador aparecerão aqui automaticamente.
                  </p>
                </div>
              ) : (
                data.pages.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveSlug(p.slug)}
                    className="group text-left p-5 rounded-2xl border border-border bg-card hover:shadow-md transition-all hover:border-[var(--portal-accent)]/40 flex items-center justify-between gap-3"
                    style={hasCustomBg ? { backgroundColor: contentSurface } : undefined}
                  >
                    <span className="min-w-0">
                      <span className="text-sm font-bold block" style={{ color: accent }}>
                        {p.title}
                      </span>
                      <span
                        className="block text-xs text-muted-foreground mt-1"
                        style={textColor ? { color: textColor, opacity: 0.7 } : undefined}
                      >
                        Clique para abrir /{p.slug}
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-[var(--portal-accent)] transition-colors" />
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
              className="p-6 rounded-2xl border border-border bg-card space-y-3"
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
                      <PortalBlockView
                        key={b.id}
                        block={b}
                        accent={accent}
                        onVideoPlay={() => handleVideoPlay(b)}
                        onVideoProgress={handleVideoProgress(b)}
                      />
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
