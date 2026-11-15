import { useEffect, useState } from 'react'
import { Globe, Loader2, ExternalLink, RefreshCw, Settings2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { PortalPagesManager } from '@/components/settings/PortalPagesManager'
import { useSocial } from '@/context/SocialContext'
import {
  getBrandPortal,
  createBrandPortal,
  buildPortalUrl,
  type BrandPortalRecord,
} from '@/services/brand-portals'

/** Aba WEB do Labs: conecta com os portais — páginas internas + link público "ver no portal". */
export function LabsWebTab() {
  const { brands } = useSocial()
  const [brandId, setBrandId] = useState('')
  const [portal, setPortal] = useState<BrandPortalRecord | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!brandId && brands.length > 0) setBrandId(brands[0].id)
  }, [brands, brandId])

  useEffect(() => {
    if (!brandId) return
    let cancelled = false
    setLoadingPortal(true)
    getBrandPortal(brandId)
      .then((p) => {
        if (!cancelled) setPortal(p)
      })
      .catch(() => {
        if (!cancelled) setPortal(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingPortal(false)
      })
    return () => {
      cancelled = true
    }
  }, [brandId])

  const handleCreatePortal = async () => {
    if (!brandId) return
    setCreating(true)
    try {
      const created = await createBrandPortal(brandId)
      setPortal({
        portalId: created.portalId,
        token: created.token,
        published: true,
      })
      toast({ title: 'Portal criado!', description: 'Link público gerado — confira abaixo.' })
    } catch (err) {
      console.error('Erro ao criar portal:', err)
      toast({
        title: 'Erro ao criar portal',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const selectedBrand = brands.find((b) => b.id === brandId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" /> Web
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Páginas do portal da marca — gerencie conteúdo e compartilhe o link público.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {brands.length > 1 && (
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="h-9 rounded-xl border border-border bg-background text-xs px-3 font-semibold focus:outline-none"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          {portal?.token ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <a href={buildPortalUrl(portal.token)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" /> Ver no portal
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Status do portal público */}
      <Card className="p-4 rounded-2xl border border-border/80 bg-card">
        {loadingPortal ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando portal...
          </div>
        ) : portal?.token ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black text-foreground flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-primary" />
                Portal {portal.published ? 'publicado' : 'rascunho'} —{' '}
                {selectedBrand?.name || 'marca'}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                {buildPortalUrl(portal.token)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(buildPortalUrl(portal.token))
                toast({ title: 'Link copiado!' })
              }}
              className="text-xs font-bold shrink-0"
            >
              <RefreshCw className="w-3 h-3" /> Copiar link
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {selectedBrand ? (
                <>
                  <strong className="text-foreground">{selectedBrand.name}</strong> ainda não tem
                  portal público.{' '}
                </>
              ) : (
                'Nenhuma marca selecionada. '
              )}
              Crie um para publicar as páginas.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={handleCreatePortal}
              disabled={creating || !brandId}
              className="rounded-xl text-xs font-black gap-1.5 shrink-0"
            >
              {creating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
              Criar portal
            </Button>
          </div>
        )}
      </Card>

      {/* Gestão de páginas (reaproveita o painel de Configurações → Organização) */}
      {brandId ? (
        <PortalPagesManager brandId={brandId} userId={brandId} />
      ) : (
        <div className="text-center py-10 rounded-3xl border border-dashed border-border/80">
          <p className="text-sm font-bold text-foreground">Nenhuma marca encontrada</p>
          <p className="text-xs text-muted-foreground mt-1">
            Crie uma marca para gerenciar páginas do portal.
          </p>
        </div>
      )}
    </div>
  )
}

export default LabsWebTab
