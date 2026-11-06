import { useState } from 'react'
import {
  Globe,
  Search,
  Link2,
  Check,
  Sparkles,
  ExternalLink,
  Layers,
  Image as ImageIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import {
  searchStockAssets,
  importExternalAssetToLibrary,
  type ExternalStockAsset,
} from '@/services/studio-external-assets'
interface ExternalAssetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectAsset: (assetUrl: string) => void
}

export const ExternalAssetModal: React.FC<ExternalAssetModalProps> = ({
  open,
  onOpenChange,
  onSelectAsset,
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'url'>('stock')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [urlInput, setUrlInput] = useState('')
  const [urlTitle, setUrlTitle] = useState('')
  const [importing, setImporting] = useState(false)

  const stockList = searchStockAssets(searchQuery, categoryFilter)

  const handleSelectStock = async (stock: ExternalStockAsset) => {
    try {
      setImporting(true)
      const res = await importExternalAssetToLibrary({
        title: stock.title,
        imageUrl: stock.url,
        source: 'stock',
        category: stock.category || 'Geral',
        tags: stock.tags,
      })

      onSelectAsset(res.assetUrl)
      toast({
        title: 'Asset externo anexado!',
        description: `"${stock.title}" foi vinculado à criação e salvo na Biblioteca do app.`,
      })
      onOpenChange(false)
    } catch {
      toast({
        title: 'Erro ao importar',
        description: 'Não foi possível importar a imagem stock.',
        variant: 'destructive',
      })
    } finally {
      setImporting(false)
    }
  }

  const handleImportByUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUrl = urlInput.trim()
    if (!cleanUrl) {
      toast({
        title: 'URL obrigatória',
        description: 'Insira o link direto de uma imagem (ex.: .png, .jpg, .webp).',
        variant: 'destructive',
      })
      return
    }

    try {
      setImporting(true)
      const title = urlTitle.trim() || 'Imagem Externa por URL'
      const res = await importExternalAssetToLibrary({
        title: urlTitle.trim() || 'Imagem Externa vinculada',
        imageUrl: cleanUrl,
        source: 'url',
        category: 'Geral',
        tags: ['link-externo', 'studio', 'url'],
      })

      onSelectAsset(res.assetUrl)
      toast({
        title: 'Asset por URL anexado!',
        description: 'A imagem externa foi vinculada à criação e salva na Biblioteca.',
      })
      setUrlInput('')
      setUrlTitle('')
      onOpenChange(false)
    } catch {
      toast({
        title: 'Erro ao importar URL',
        description: 'Verifique se a URL da imagem é válida e acessível.',
        variant: 'destructive',
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card border-border/80 shadow-2xl p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Globe className="w-4 h-4" />
            </div>
            <DialogTitle className="font-heading text-lg font-bold tracking-tight">
              Biblioteca de Assets Externa
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Puxe assets de bancos stock gratuitos ou cole uma URL direta. O item é anexado à criação
            e salvo automaticamente na Biblioteca do MidiaViva.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
          <TabsList className="grid grid-cols-2 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="stock" className="text-xs font-semibold gap-2 py-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Banco Stock Gratuito (Pexels / Unsplash)
            </TabsTrigger>
            <TabsTrigger value="url" className="text-xs font-semibold gap-2 py-2">
              <Link2 className="w-3.5 h-3.5 text-cyan-500" />
              Colar Link Direto (URL de Imagem)
            </TabsTrigger>
          </TabsList>

          {/* ABA STOCK GRATUITO */}
          <TabsContent value="stock" className="space-y-4 pt-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar imagens stock (ex.: produto, modelo, cyberpunk, escritório)..."
                  className="pl-9 text-xs h-9"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['todas', 'produto', 'personagem', 'cenario', 'logo'].map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={categoryFilter === cat ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-[11px] capitalize px-2.5"
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {/* Grid de assets stock */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {stockList.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-xl border border-border/60 bg-muted/20 hover:border-primary/60 transition-all overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[4/3] bg-muted/40 overflow-hidden">
                    <img
                      src={item.thumbUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <Badge className="absolute top-1.5 left-1.5 text-[9px] uppercase px-1.5 py-0 bg-background/80 backdrop-blur-md text-foreground border-border/40 font-mono">
                      {item.source}
                    </Badge>
                  </div>
                  <div className="p-2 flex-1 flex flex-col justify-between gap-1.5">
                    <div
                      className="text-[11px] font-semibold text-foreground truncate"
                      title={item.title}
                    >
                      {item.title}
                    </div>
                    <Button
                      size="sm"
                      className="w-full h-7 text-[10px] font-bold gap-1 shadow-sm"
                      onClick={() => handleSelectStock(item)}
                      disabled={importing}
                    >
                      <Check className="w-3 h-3" />
                      Anexar & Salvar
                    </Button>
                  </div>
                </div>
              ))}
              {stockList.length === 0 && (
                <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
                  Nenhum asset encontrado para &quot;{searchQuery}&quot;. Tente outros termos como
                  produto, estúdio ou neon.
                </div>
              )}
            </div>
          </TabsContent>

          {/* ABA URL DIRETA */}
          <TabsContent value="url" className="space-y-4 pt-3">
            <form
              onSubmit={handleImportByUrl}
              className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-primary" />
                  URL Direta da Imagem (HTTPS)
                </label>
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://exemplo.com/imagens/produto-hero.webp"
                  className="text-xs h-9 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                  Nome / Rótulo do Asset (opcional)
                </label>
                <Input
                  value={urlTitle}
                  onChange={(e) => setUrlTitle(e.target.value)}
                  placeholder="Ex.: Foto do Produto - Campanha Outono"
                  className="text-xs h-9"
                />
              </div>

              {urlInput.trim() && (
                <div className="p-3 bg-card border border-border/70 rounded-lg flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-muted/50 border overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <img
                      src={urlInput.trim()}
                      alt="Prévia"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="text-xs flex-1 truncate">
                    <div className="font-semibold text-foreground truncate">
                      {urlTitle.trim() || 'Asset por URL'}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate font-mono">
                      {urlInput.trim()}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={importing}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="gap-1.5 font-bold"
                  disabled={!urlInput.trim() || importing}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {importing ? 'Importando...' : 'Anexar e Salvar na Biblioteca'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
