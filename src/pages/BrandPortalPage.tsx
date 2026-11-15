import { useEffect, useState } from 'react'
import { Loader2, AlertTriangle, Home, ArrowLeft } from 'lucide-react'
import { useParams, Link } from 'react-router-dom'
import { getPortalByToken } from '@/services/brand-portals'
import {
  fetchPublicPortalPages,
  recordPortalVisit,
  type PortalBlock,
} from '@/services/portal-pages'
import { PortalBlockView } from '@/components/settings/PortalBlocksEditor'

interface PortalData {
  id: string
  brandId: string
  brandName: string
  accentColor: string | null
  pages: Array<{
    id: string
    title: string
    slug: string
    content: { text?: string; blocks?: PortalBlock[] }
  }>
}

/** Página pública do portal (rota /portal/:token) — cor da marca + páginas internas. */
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
        recordPortalVisit(token, activeSlug || 'home')
        return fetchPublicPortalPages(token).then((pages) => {
          if (!alive) return
          setData({
            id: res.id,
            brandId: res.brandId,
            brandName: res.brandName ?? 'Portal',
            accentColor: res.accentColor,
            pages: (pages || []).map((p) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              content: (p.content as { text?: string; blocks?: PortalBlock[] }) || {},
            })),
          })
        })
      })
      .catch(() => setError('Portal não encontrado ou indisponível.'))
    return () => {
      alive = false
    }
  }, [token])

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

  const accent = data.accentColor || '#7C3AED'
  const current = data.pages.find((p) => p.slug === activeSlug)
  const heroPage = !activeSlug
  const pageText = current?.content?.text || ''
  const pageBlocks = Array.isArray(current?.content?.blocks) ? current!.content!.blocks! : []

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* accent como variável CSS para colorir tudo */}
      <style>{`:root { --portal-accent: ${accent}; }`}</style>

      <header
        className="text-white py-10 px-6"
        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs opacity-80">Portal da marca</p>
            <h1 className="text-2xl font-black">{data.brandName}</h1>
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
            <p className="text-sm text-muted-foreground">
              Bem-vindo ao portal de {data.brandName}. Confira abaixo as páginas disponíveis.
            </p>
            <div className="grid gap-3">
              {data.pages.length === 0 ? (
                <div className="p-6 rounded-2xl border border-border bg-white dark:bg-slate-900 text-center text-sm text-muted-foreground">
                  Este portal ainda não tem páginas internas.
                </div>
              ) : (
                data.pages.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveSlug(p.slug)}
                    className="text-left p-5 rounded-2xl border border-border bg-white dark:bg-slate-900 hover:shadow-md transition-shadow"
                  >
                    <span className="text-sm font-bold" style={{ color: accent }}>
                      {p.title}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-1">
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
            <article className="p-6 rounded-2xl border border-border bg-white dark:bg-slate-900">
              <h2 className="text-xl font-black mb-3" style={{ color: accent }}>
                {current?.title}
              </h2>
              <div className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">
                {pageBlocks.length > 0 ? (
                  <div className="space-y-3">
                    {pageBlocks.map((b) => (
                      <PortalBlockView key={b.id} block={b} />
                    ))}
                  </div>
                ) : (
                  pageText || 'Página sem conteúdo ainda.'
                )}
              </div>
            </article>
          </>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center">
        <p className="text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} {data.brandName} · Powered by BestContent
        </p>
      </footer>
    </div>
  )
}
