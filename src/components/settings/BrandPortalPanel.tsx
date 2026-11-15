import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Globe,
  Link2,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  XCircle,
  Server,
  ImagePlus,
  Trash2,
  BarChart3,
  Tag,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  createBrandPortal,
  revokeBrandPortal,
  buildPortalUrl,
  buildPortalEmbedCode,
  getBrandPortal,
  uploadPortalLogo,
  removePortalLogo,
  savePortalGaId,
  savePortalGtmId,
  validateGaMeasurementId,
  validateGtmContainerId,
  type BrandPortalRecord,
  type PortalColors,
} from '@/services/brand-portals'
import { getPortalMetrics, type PortalMetrics } from '@/services/portal-visits'
import { listPortalPages } from '@/services/portal-pages'
import {
  PortalVisitsMetrics,
  type PortalPageOption,
} from '@/components/settings/PortalVisitsMetrics'
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
  /** Nome da marca — usado como título do arquivo CSV exportado. */
  brandName?: string
}

/** Painel "Gerar portal / Incorporar" (Settings): analytics + cor + páginas internas. */
export function BrandPortalPanel({ brandId, userId, brandName }: BrandPortalPanelProps) {
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
  const [logoBusy, setLogoBusy] = useState(false)
  const [gaInput, setGaInput] = useState('')
  const [savingGa, setSavingGa] = useState(false)
  const [gtmInput, setGtmInput] = useState('')
  const [savingGtm, setSavingGtm] = useState(false)
  const [pageFilter, setPageFilter] = useState('')
  const [pageOptions, setPageOptions] = useState<PortalPageOption[]>([])
  const logoInputRef = useRef<HTMLInputElement>(null)

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
      setMetrics(await getPortalMetrics(portal.portalId, pageFilter))
    } catch (err) {
      console.error('Erro ao carregar métricas do portal:', err)
      setMetrics(null)
    } finally {
      setLoadingMetrics(false)
    }
  }, [portal?.portalId, pageFilter])

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

  useEffect(() => {
    setGaInput(portal?.gaMeasurementId || '')
  }, [portal?.gaMeasurementId])

  useEffect(() => {
    setGtmInput(portal?.gtmContainerId || '')
  }, [portal?.gtmContainerId])

  // Opções do filtro de analytics (pedido "filtrar analytics por pagina"):
  // lista as páginas internas do portal pelo serviço de portal-pages.
  useEffect(() => {
    let alive = true
    listPortalPages(brandId)
      .then((pages) => {
        if (alive) setPageOptions(pages.map((p) => ({ id: p.id, title: p.title })))
      })
      .catch(() => {
        if (alive) setPageOptions([])
      })
    return () => {
      alive = false
    }
  }, [brandId])

  const initialColors: Partial<PortalColors> | undefined = portal
    ? {
        accentColor: portal.accentColor || '',
        bgColor: portal.bgColor || '',
        textColor: portal.textColor || '',
        buttonColor: portal.buttonColor || '',
      }
    : undefined

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

  const handleLogoUpload = async (file: File) => {
    if (!portal?.portalId) return
    setLogoBusy(true)
    try {
      await uploadPortalLogo(portal.portalId, file)
      toast({ title: 'Logo enviado', description: 'A página pública já mostra o novo logo.' })
      void loadPortal()
    } catch (err) {
      toast({
        title: 'Erro ao enviar logo',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLogoBusy(false)
    }
  }

  const handleLogoRemove = async () => {
    if (!portal?.portalId) return
    setLogoBusy(true)
    try {
      await removePortalLogo(portal.portalId)
      toast({ title: 'Logo removido' })
      void loadPortal()
    } catch (err) {
      toast({
        title: 'Erro ao remover logo',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLogoBusy(false)
    }
  }

  const handleSaveGa = async () => {
    if (!portal?.portalId) return
    const raw = gaInput.trim()
    if (raw && validateGaMeasurementId(raw) === null) {
      toast({
        title: 'Measurement ID inválido',
        description: 'Use G-XXXXXXXXXX (GA4) ou UA-XXXXXXX-X (Universal Analytics).',
        variant: 'destructive',
      })
      return
    }
    setSavingGa(true)
    try {
      await savePortalGaId(portal.portalId, raw)
      toast({
        title: raw ? 'Google Analytics salvo' : 'Google Analytics removido',
        description: raw
          ? 'A página pública já carrega o script de tracking.'
          : 'O script de tracking deixou de ser injetado.',
      })
      void loadPortal()
    } catch (err) {
      toast({
        title: 'Erro ao salvar o ID',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingGa(false)
    }
  }

  const handleSaveGtm = async () => {
    if (!portal?.portalId) return
    const raw = gtmInput.trim().toUpperCase()
    if (raw && validateGtmContainerId(raw) !== null) {
      toast({
        title: 'ID do GTM inválido',
        description: 'Use o formato GTM-XXXXXX (contêiner do Google Tag Manager).',
        variant: 'destructive',
      })
      return
    }
    setSavingGtm(true)
    try {
      await savePortalGtmId(portal.portalId, raw)
      toast({
        title: raw ? 'Google Tag Manager salvo' : 'Google Tag Manager removido',
        description: raw
          ? 'A página pública já carrega o script do GTM.'
          : 'O script do GTM deixou de ser injetado.',
      })
      void loadPortal()
    } catch (err) {
      toast({
        title: 'Erro ao salvar o ID',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingGtm(false)
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
          <PortalVisitsMetrics
            metrics={metrics}
            loading={loadingMetrics}
            portalId={portal.portalId}
            brandName={brandName}
            pageOptions={pageOptions}
            pageFilter={pageFilter}
            onPageFilterChange={setPageFilter}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <p className="text-sm font-bold">Cores do portal por marca</p>
          <BrandThemeColorPicker
            brandId={brandId}
            initialColors={initialColors}
            onSaved={() => {
              void loadPortal()
            }}
          />
        </CardContent>
      </Card>

      {/* ===== Logo da marca (pedido 2, upload por marca) ===== */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold">Logo da marca no portal</p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Envia um arquivo de imagem (PNG, JPG ou SVG) exibido no topo da página pública. Sem logo
            enviado, o portal usa o logo da marca ou a letra inicial.
          </p>
          <div className="flex items-center gap-3">
            {portal.logoUrl ? (
              <img
                src={portal.logoUrl}
                alt="Logo do portal"
                className="h-14 w-14 rounded-lg border border-border object-contain bg-background p-1"
              />
            ) : (
              <div className="h-14 w-14 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
                <ImagePlus className="w-5 h-5" />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleLogoUpload(file)
                  e.target.value = ''
                }}
              />
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1"
                disabled={logoBusy}
                onClick={() => logoInputRef.current?.click()}
              >
                {logoBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="w-3.5 h-3.5" />
                )}
                Enviar logo
              </Button>
              {portal.logoUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs gap-1 text-destructive"
                  disabled={logoBusy}
                  onClick={handleLogoRemove}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Google Analytics (pedido 3, script na página pública) ===== */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold">Google Analytics do portal</p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Cole o Measurement ID (G-XXXXXXXXXX ou UA-XXXXXXX-X). A página pública injeta o script
            gtag.js apenas quando o ID está preenchido; vazio desativa o tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={gaInput}
              onChange={(e) => setGaInput(e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="font-mono text-xs flex-1"
            />
            <Button
              size="sm"
              className="text-xs gap-1 shrink-0"
              disabled={savingGa}
              onClick={handleSaveGa}
            >
              {savingGa ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Salvar ID
            </Button>
          </div>
          {gaInput.trim() && validateGaMeasurementId(gaInput) === null && (
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Formato inválido — use G-XXXXXXXXXX (GA4) ou UA-XXXXXXX-X (Universal Analytics).
            </p>
          )}
          {portal.gaMeasurementId && (
            <p className="text-[10px] text-muted-foreground">
              ID atual: <span className="font-mono font-bold">{portal.gaMeasurementId}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* ===== Google Tag Manager (pedido 2, script na página pública) ===== */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold">Google Tag Manager do portal</p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Cole o ID do contêiner (GTM-XXXXXX). A página pública injeta o script gtm.js apenas
            quando o ID está preenchido; vazio remove o tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={gtmInput}
              onChange={(e) => setGtmInput(e.target.value)}
              placeholder="GTM-XXXXXX"
              className="font-mono text-xs flex-1"
            />
            <Button
              size="sm"
              className="text-xs gap-1 shrink-0"
              disabled={savingGtm}
              onClick={handleSaveGtm}
            >
              {savingGtm ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Salvar ID
            </Button>
          </div>
          {gtmInput.trim() && validateGtmContainerId(gtmInput) !== null && (
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Formato inválido — use GTM-XXXXXX (contêiner do Google Tag Manager).
            </p>
          )}
          {portal.gtmContainerId && (
            <p className="text-[10px] text-muted-foreground">
              ID atual: <span className="font-mono font-bold">{portal.gtmContainerId}</span>
            </p>
          )}
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
