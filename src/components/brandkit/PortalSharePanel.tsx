import { useState } from 'react'
import { Copy, Check, Globe, Loader2, Link2, RefreshCw, Ban, Code2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  buildPortalUrl,
  buildPortalEmbedCode,
  createBrandPortal,
  revokeBrandPortal,
  type BrandPortalRecord,
} from '@/services/brand-portals'

interface PortalSharePanelProps {
  /** Marcas reais do usuário (vem de getBrands em Settings). */
  brands: Array<{ id: string; name: string }>
  /** Portais já existentes, indexados por brandId. */
  portals: Record<string, BrandPortalRecord | null>
  selectedBrandId: string
  onSelectBrand: (brandId: string) => void
  /** Notifica o Settings quando o portal de uma marca muda (gerar/revogar). */
  onPortalChange: (brandId: string, portal: BrandPortalRecord | null) => void
}

/**
 * Painel "Gerar portal / Incorporar" (pedidos 2 e 3): escolhe uma marca real,
 * mostra o link público dela, o código <iframe> de embed e ações
 * copiar/regenerar/revogar — espelho do compartilhamento de presets.
 */
export function PortalSharePanel({
  brands,
  portals,
  selectedBrandId,
  onSelectBrand,
  onPortalChange,
}: PortalSharePanelProps) {
  const { toast } = useToast()
  const [busy, setBusy] = useState<'create' | 'revoke' | null>(null)
  const [copied, setCopied] = useState<'link' | 'embed' | null>(null)
  const [embedEnabled, setEmbedEnabled] = useState(true)

  const selectedBrand = brands.find((b) => b.id === selectedBrandId) || null
  const portal: BrandPortalRecord | null = (selectedBrandId && portals[selectedBrandId]) || null

  const publicUrl = portal?.token && portal.published ? buildPortalUrl(portal.token) : ''
  const embedCode = portal?.token && portal.published ? buildPortalEmbedCode(portal.token) : ''

  async function handleGenerate() {
    if (!selectedBrand) {
      toast({
        variant: 'destructive',
        title: 'Escolha uma marca',
        description: 'Selecione a marca que vai receber o portal público.',
      })
      return
    }
    setBusy('create')
    try {
      const res = await createBrandPortal(selectedBrand.id)
      onPortalChange(selectedBrand.id, { portalId: '', token: res.token, published: true })
      toast({
        title: res.regenerated ? 'Portal renovado' : 'Portal gerado!',
        description: res.regenerated
          ? 'O link antigo deixou de valer — use o novo link/iframe.'
          : `O portal público de "${selectedBrand.name}" já está no ar.`,
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Não deu para gerar o portal',
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setBusy(null)
    }
  }

  async function handleRevoke() {
    if (!selectedBrand || !portal) return
    setBusy('revoke')
    try {
      if (portal.portalId) await revokeBrandPortal(portal.portalId)
      onPortalChange(selectedBrand.id, { ...portal, published: false })
      toast({ title: 'Portal despublicado', description: 'O link público não funciona mais.' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Não deu para revogar o portal',
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setBusy(null)
    }
  }

  async function copy(text: string, kind: 'link' | 'embed') {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      setTimeout(() => setCopied(null), 2000)
      toast({
        title: kind === 'link' ? 'Link copiado!' : 'Código copiado!',
        description:
          kind === 'link'
            ? 'Cole em qualquer lugar para abrir o portal público.'
            : 'Cole no HTML do seu site para incorporar o portal.',
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Não deu para copiar',
        description: 'Copie manualmente.',
      })
    }
  }

  return (
    <Card className="rounded-2xl border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          Gerar portal / Incorporar
        </CardTitle>
        <CardDescription>
          Crie uma página pública de uma das suas marcas, com link próprio e código de embed para o
          site — sem login.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seleção de marca */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Marca
          </Label>
          {brands.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Você ainda não tem marcas. Crie uma em “Marcas” para gerar o portal.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onSelectBrand(b.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                    selectedBrandId === b.id
                      ? 'bg-primary/10 text-primary border-primary/40'
                      : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/30',
                  )}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {!selectedBrand ? (
          <p className="text-xs text-muted-foreground pt-1">
            Selecione uma marca acima para gerar ou ver o portal.
          </p>
        ) : !portal?.published ? (
          <Button
            onClick={handleGenerate}
            disabled={busy === 'create'}
            className="w-full sm:w-auto"
          >
            {busy === 'create' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Globe className="w-4 h-4 mr-2" />
            )}
            {portal && !portal.published ? 'Reativar portal público' : 'Gerar portal'}
          </Button>
        ) : (
          <>
            {/* Link público */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" /> Link público
              </Label>
              <div className="flex gap-2">
                <Input readOnly value={publicUrl} className="font-mono text-xs h-9" />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0"
                  onClick={() => copy(publicUrl, 'link')}
                >
                  {copied === 'link' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  Copiar
                </Button>
              </div>
            </div>

            {/* Embed */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" /> Incorporar no site (iframe)
                </Label>
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={embedEnabled}
                    onCheckedChange={setEmbedEnabled}
                    id="embed-toggle"
                  />
                  <Label
                    htmlFor="embed-toggle"
                    className="text-[11px] text-muted-foreground cursor-pointer"
                  >
                    mostrar
                  </Label>
                </div>
              </div>
              {embedEnabled && (
                <>
                  <textarea
                    readOnly
                    value={embedCode}
                    rows={3}
                    className="w-full rounded-md border border-border bg-muted/40 p-2 font-mono text-[11px] leading-relaxed resize-none"
                  />
                  <Button variant="outline" size="sm" onClick={() => copy(embedCode, 'embed')}>
                    {copied === 'embed' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copiar código
                  </Button>
                </>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={busy !== null}
                className="gap-1.5"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', busy === 'create' && 'animate-spin')} />
                Regenerar link
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRevoke}
                disabled={busy !== null}
                className="text-destructive hover:text-destructive gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                Despublicar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default PortalSharePanel
