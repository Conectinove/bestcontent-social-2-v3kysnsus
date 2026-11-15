import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Palette,
  ArrowRight,
  Instagram,
  Globe,
  Sparkles,
  Youtube,
  ImageOff,
} from 'lucide-react'
import { QuickOnboardingModal } from '@/components/QuickOnboardingModal'
import { OrganizationBrandManager } from '@/components/brandkit/OrganizationBrandManager'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Brands() {
  const { brands, loading } = useSocial()
  const navigate = useNavigate()
  const [quickOnboardOpen, setQuickOnboardOpen] = useState(false)

  const openWizard = () => navigate('/app/brand-wizard/new')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <span className="min-w-0 break-words">Minhas Marcas</span>
            <Palette className="w-6 h-6 text-primary shrink-0" />
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie perfis sociais e estratégias de conteúdo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => setQuickOnboardOpen(true)}
            className="gap-2 text-xs border-primary/30 text-primary hover:bg-primary/10"
          >
            <Sparkles className="w-4 h-4 text-primary shrink-0" /> Vamos agilizar! (IA)
          </Button>
          <Button
            onClick={openWizard}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-xs"
          >
            <Plus className="w-4 h-4 shrink-0" /> Nova marca
          </Button>
        </div>
      </div>

      {/* Gestão Unificada & Deduplicação de Marcas */}
      <OrganizationBrandManager onAddNewBrand={openWizard} />

      <div className="pt-4 border-t border-border">
        <h2 className="text-base font-bold text-foreground mb-3">Cards Visuais de Marcas</h2>
      </div>

      {/* Carregando */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-28 w-full rounded-none" />
              <CardContent className="pt-8 px-4 pb-4 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-8 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Vazio */}
      {!loading && brands.length === 0 && (
        <Card className="p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <ImageOff className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-base font-bold">Nenhuma marca por aqui ainda</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Crie sua primeira marca para organizar posts, ideias e criativos — ou use o assistente
            com IA para agilizar.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <Button
              onClick={openWizard}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-xs"
            >
              <Plus className="w-4 h-4" /> Criar marca
            </Button>
            <Button
              variant="outline"
              onClick={() => setQuickOnboardOpen(true)}
              className="gap-2 text-xs border-primary/30 text-primary hover:bg-primary/10"
            >
              <Sparkles className="w-4 h-4 text-primary" /> Vamos agilizar! (IA)
            </Button>
          </div>
        </Card>
      )}

      {/* Grid de cards */}
      {!loading && brands.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand: any) => (
            <Card
              key={brand.id}
              className="overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col"
            >
              <div className="relative h-28 bg-muted">
                {brand.coverImage ? (
                  <img
                    src={brand.coverImage}
                    alt={brand.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center">
                    <Palette className="w-8 h-8 text-primary/40" />
                  </div>
                )}
                <div className="absolute -bottom-6 left-4 ring-4 ring-card rounded-full overflow-hidden bg-card w-14 h-14 shadow-sm">
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center font-bold text-lg">
                      {(brand.name || 'M')[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <CardContent className="pt-8 px-4 pb-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-lg truncate">{brand.name}</h3>
                  {brand.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 break-words">
                      {brand.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
                    {brand.handles?.instagram && (
                      <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded min-w-0">
                        <Instagram className="w-3 h-3 text-pink-500 shrink-0" />
                        <span className="truncate max-w-[160px]">{brand.handles.instagram}</span>
                      </span>
                    )}
                    {brand.handles?.tiktok && (
                      <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded min-w-0">
                        <Globe className="w-3 h-3 text-cyan-500 shrink-0" />
                        <span className="truncate max-w-[160px]">{brand.handles.tiktok}</span>
                      </span>
                    )}
                    {brand.handles?.youtube && (
                      <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded min-w-0">
                        <Youtube className="w-3 h-3 text-red-500 shrink-0" />
                        <span className="truncate max-w-[160px]">{brand.handles.youtube}</span>
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => navigate(`/app/brands/${brand.id}`)}
                  variant="outline"
                  className="w-full text-xs gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  Ver Detalhes <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <QuickOnboardingModal open={quickOnboardOpen} onOpenChange={setQuickOnboardOpen} />
    </div>
  )
}
