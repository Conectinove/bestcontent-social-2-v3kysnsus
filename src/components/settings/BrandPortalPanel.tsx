import { useCallback, useEffect, useState } from 'react'
import { Globe, Link2, Copy, ExternalLink, Loader2, RefreshCw, XCircle, Server } from 'lucide-react'
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
import {
  saveCustomDomain,
  verifyCustomDomain,
  buildCnameTarget,
  type CustomDomainState,
} from '@/services/portal-domain'

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
  const [domain, setDomain] = useState<CustomDomainState>({
    custom_domain: '',
    domain_verified: false,
  })
  const [domainInput, setDomainInput] = useState('')
  const [savingDomain, setSavingDomain] = useState(false)

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

  useEffect(() => {
    if (portal?.portalId) {
      import('@/services/portal-domain').then(({ getCustomDomain }) => {
        void getCustomDomain(portal.portalId).then(setDomain)
      })
    }
  }, [portal?.portalId])

  const handleSaveDomain = async () => {
    if (!portal?.portalId) return
    setSavingDomain(true)
    try {
      const next = await saveCustomDomain(portal.portalId, domainInput)
      setDomain(next)
      setDomainInput('')
      toast({ title: 'Domínio salvo', description: 'Siga as instruções de DNS abaixo.' })
    } catch (err) {
      toast({
        title: 'Erro ao salvar domínio',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingDomain(false)
    }
  }

  const handleVerifyDomain = async () => {
    if (!portal?.portalId) return
    setSavingDomain(true)
    try {
      const next = await verifyCustomDomain(portal.portalId)
      setDomain(next)
      toast({ title: 'Domínio marcado como verificado' })
    } catch (err) {
      toast({
        title: 'Erro ao verificar domínio',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingDomain(false)
    }
  }

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

          <Separator />

          {/* ===== Domínio próprio (pedido 2, configuração) ===== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <p className="text-xs font-bold">Domínio próprio da marca</p>
              </div>
              {domain.custom_domain && (
                <Badge
                  variant="outline"
                  className={
                    domain.domain_verified
                      ? 'text-[10px] border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                      : 'text-[10px] border-amber-500/30 text-amber-700 dark:text-amber-400'
                  }
                >
                  {domain.domain_verified ? 'DNS verificado' : 'Aguardando DNS'}
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="portal.suamarca.com"
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-xs"
              />
              <Button
                size="sm"
                className="text-xs gap-1 shrink-0"
                disabled={savingDomain}
                onClick={handleSaveDomain}
              >
                {savingDomain ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Globe className="w-3.5 h-3.5" />
                )}
                Salvar domínio
              </Button>
            </div>

            {domain.custom_domain && (
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-2">
                <p className="text-[11px] font-semibold text-foreground">
                  Domínio atual: <code className="text-primary">{domain.custom_domain}</code>
                </p>
                <div className="text-[11px] text-muted-foreground space-y-1.5">
                  <p className="font-semibold text-foreground">
                    Instruções de DNS (no provedor do domínio):
                  </p>
                  <div className="p-2 rounded bg-background border border-border/40 font-mono text-[10px] space-y-0.5">
                    <p>
                      Tipo: <span className="font-bold">CNAME</span> · Nome:{' '}
                      <span className="font-bold">{domain.custom_domain.split('.')[0]}</span> ·
                      Valor: <span className="font-bold">{buildCnameTarget(portal.token)}</span>
                    </p>
                    <p>
                      (alternativa A): apontar <span className="font-bold">@</span> para o host{' '}
                      <span className="font-bold">{buildCnameTarget(portal.token)}</span>
                    </p>
                  </div>
                  <p>
                    O portal continua acessível em{' '}
                    <code className="text-primary">{buildPortalUrl(portal.token)}</code> — o domínio
                    próprio é a configuração de apontamento; a hospedagem Skip Cloud não serve o
                    domínio diretamente.
                  </p>
                </div>
                {!domain.domain_verified && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[11px]"
                    onClick={handleVerifyDomain}
                    disabled={savingDomain}
                  >
                    Já configurei o DNS — verificar
                  </Button>
                )}
              </div>
            )}
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
