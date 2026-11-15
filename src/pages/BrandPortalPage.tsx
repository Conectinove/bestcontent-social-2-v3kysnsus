import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Building2, Globe, Loader2, Sparkles, XCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { fetchPublicPortal, type BrandPortalData } from '@/services/brand-portals'

/**
 * Página PÚBLICA do portal de marca (pedidos "gerar portais" + "incorporar"):
 * servida fora do layout autenticado em /portal/:token. Mostra logo, nome,
 * descrição e o tema (snapshot de cores) da marca — sem login.
 */
export default function BrandPortalPage() {
  const { token = '' } = useParams()
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [data, setData] = useState<BrandPortalData | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('O link não trouxe o código do portal.')
      return
    }
    let alive = true
    fetchPublicPortal(token)
      .then((res) => {
        if (!alive) return
        setData(res)
        setState('ok')
      })
      .catch((err: unknown) => {
        if (!alive) return
        setState('error')
        setMessage(err instanceof Error ? err.message : 'Falha ao carregar o portal.')
      })
    return () => {
      alive = false
    }
  }, [token])

  // Aplica o tema da marca (se houver color_theme hex) como accent da página.
  const themeHex = data?.color_theme || ''
  const accentStyle = /^#?[0-9a-fA-F]{6}$/.test(themeHex)
    ? ({
        '--portal-accent': themeHex.startsWith('#') ? themeHex : `#${themeHex}`,
      } as React.CSSProperties)
    : undefined

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Carregando portal…
        </div>
      </div>
    )
  }

  if (state === 'error' || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-3">
            <div className="mx-auto rounded-full bg-destructive/10 p-3 w-fit">
              <XCircle className="w-6 h-6 text-destructive" aria-hidden />
            </div>
            <h1 className="font-black text-lg">Portal indisponível</h1>
            <p className="text-sm text-muted-foreground break-words">{message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const accent = accentStyle?.['--portal-accent'] as string | undefined

  return (
    <div className="min-h-screen bg-background" style={accentStyle}>
      {/* Capa com o accent da marca */}
      <div
        className="h-40 sm:h-52 w-full"
        style={{
          background: accent
            ? `linear-gradient(135deg, ${accent}, ${accent}55)`
            : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.3))',
        }}
      />
      <div className="max-w-2xl mx-auto px-4 -mt-14 pb-12">
        <Card className="rounded-2xl shadow-lg border-border/60 overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-muted border-4 border-card shadow-md flex items-center justify-center shrink-0">
                {data.logo ? (
                  <img src={data.logo} alt={data.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-2xl font-black truncate">{data.name}</h1>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    style={{
                      color: accent || 'hsl(var(--primary))',
                      borderColor: `${accent || 'hsl(var(--primary))'}44`,
                      background: `${accent || 'hsl(var(--primary))'}14`,
                    }}
                  >
                    <Sparkles className="w-3 h-3" /> Portal oficial
                  </span>
                </div>
                {data.description && (
                  <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
                )}
              </div>
            </div>

            {data.website && (
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-semibold hover:underline"
                style={{ color: accent || 'hsl(var(--primary))' }}
              >
                <ExternalLink className="w-4 h-4" />
                {data.website}
              </a>
            )}

            <div className="pt-2 border-t border-border/60 flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              <span>
                Este é um portal público criado com <strong>MidiaViva</strong>.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
