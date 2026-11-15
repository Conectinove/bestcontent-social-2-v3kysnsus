import { useCallback, useEffect, useState } from 'react'
import { Globe, Link2, Copy, ExternalLink, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  createBrandPortal,
  revokeBrandPortal,
  buildPortalUrl,
  buildPortalEmbedCode,
  getBrandPortal,
  type BrandPortalRecord,
} from '@/services/brand-portals'
import { getPortalMetrics, type PortalMetrics } from '@/services/portal-visits'
import { PortalVisitsMetrics } from '@/components/settings/PortalVisitsMetrics'
import { PortalPagesManager } from '@/components/settings/PortalPagesManager'
import { BrandThemeColorPicker } from '@/components/settings/BrandThemeColorPicker'

interface BrandPortalPanelProps {
  brandId: string
  userId: string
}

/** Painel "Gerar portal / Incorporar" (Settings): analytics + cor + páginas internas. */
export function BrandPortalPanel({ brandId, userId }: BrandPortalPanelProps) {
  const [portal, setPortal] = useState<BrandPortalRecord | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(true)
  const [busy, setBusy] = useState(false)
  const [metrics, setMetrics] = useState<PortalMetrics | null>(null)
  const [loadingMetrics, setLoadingMetrics] = useState(false)

  const loadPortal = useCallback(async () => {
    setLoadingPortal(true)
    try {
      setPortal(await getBrandPortal(brandId))
    } finally {
      setLoadingPortal(false)
    }
  }, [brandId])

  const loadMetrics = useCallback(async () => {
    if (!portal?.portalId) return
    setLoadingMetrics(true)
    try {
      setMetrics(await getPortalMetrics(portal.portalId))
    } catch (err) {
      console.error('Erro ao carregar métricas do portal:', err)
      setMetrics(null)
    } finally {
      setLoadingMetrics(false)
    }
  }, [portal?.portalId])

  useEffect(() => {
    void loadPortal()
  }, [loadPortal])

  useEffect(() => {
    void loadMetrics()
  }, [loadMetrics])

  const handleGenerate = async () => (
    await createBrandPortal(brandId),
    loadMetrics(),
    loadPortal(),
    null
  )
  const handleRevoke = async () => (await revokeBrandPortal(portal!.portalId), loadPortal(), null)
  const run = (fn: () => Promise<unknown>) => async () => {
    setBusy(true)
    try {
      await fn()
      toast({ title: 'Feito' })
    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  if (loadingPortal) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    )
  }

  if (!portal) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center space-y-3">
          <Globe className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-semibold">Nenhum portal gerado para esta marca.</p>
          <p className="text-xs text-muted-foreground">
            Gere um portal para habilitar analytics de visitas, cor própria e páginas internas.
          </p>
          <Button size="sm" onClick={run(handleGenerate)} disabled={busy} className="text-xs gap-1">
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            Gerar portal público
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-bold">Portal público da marca</h4>
              <Badge variant="outline" className="text-[10px]">
                {portal.published ? 'Publicado' : 'Revogado'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1"
                onClick={run(handleGenerate)}
                disabled={busy}
              >
                {busy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Renovar link
              </Button>
              {portal.published && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1 text-destructive"
                  onClick={run(handleRevoke)}
                  disabled={busy}
                >
                  {busy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  Revogar
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/60">
            <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <code className="text-[11px] truncate flex-1">{buildPortalUrl(portal.token)}</code>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(buildPortalUrl(portal.token))
                toast({ title: 'Link copiado' })
              }}
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <a href={buildPortalUrl(portal.token)} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-bold">Embed / Incorporar</p>
            <Textarea
              readOnly
              value={buildPortalEmbedCode(portal.token)}
              rows={2}
              className="font-mono text-[11px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <p className="text-sm font-bold">Analytics de visitas</p>
          <PortalVisitsMetrics metrics={metrics} loading={loadingMetrics} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <p className="text-sm font-bold">Cor do tema por marca</p>
          <BrandThemeColorPicker
            brandId={brandId}
            onSaved={() => {
              void loadPortal()
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <p className="text-sm font-bold">Páginas internas do portal</p>
          <PortalPagesManager brandId={brandId} userId={userId} />
        </CardContent>
      </Card>
    </div>
  )
}
