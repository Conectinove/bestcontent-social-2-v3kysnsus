import { useNavigate } from 'react-router-dom'
import { Plus, Palette, ArrowRight, Instagram, Globe, Sparkles } from 'lucide-react'
import { QuickOnboardingModal } from '@/components/QuickOnboardingModal'
import { OrganizationBrandManager } from '@/components/brandkit/OrganizationBrandManager'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useState } from 'react'

export default function Brands() {
  const { brands } = useSocial()
  const navigate = useNavigate()
  const [quickOnboardOpen, setQuickOnboardOpen] = useState(false)

  const openWizard = () => navigate('/app/brand-wizard/new')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            Minhas Marcas <Palette className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie perfis sociais e estratégias de conteúdo.
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => setQuickOnboardOpen(true)}
            className="gap-2 text-xs border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
          >
            <Sparkles className="w-4 h-4 text-primary" /> Vamos agilizar! (IA)
          </Button>
          <Button
            onClick={openWizard}
            className="bg-primary hover:bg-primary/90 text-white gap-2 text-xs"
          >
            <Plus className="w-4 h-4" /> Nova marca
          </Button>
        </div>
      </div>

      {/* Gestão Unificada & Deduplicação de Marcas */}
      <OrganizationBrandManager onAddNewBrand={openWizard} />

      <div className="pt-4 border-t border-border">
        <h2 className="text-base font-bold text-foreground mb-3">Cards Visuais de Marcas</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand: any) => (
          <Card
            key={brand.id}
            className="overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col"
          >
            <div className="relative h-28 bg-muted">
              {brand.coverImage && (
                <img
                  src={brand.coverImage}
                  alt={brand.name}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute -bottom-6 left-4 ring-4 ring-card rounded-full overflow-hidden bg-white w-14 h-14 shadow-sm">
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg">
                    {(brand.name || 'M')[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <CardContent className="pt-8 px-4 pb-4 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-bold text-lg">{brand.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {brand.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
                  {brand.handles?.instagram && (
                    <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                      <Instagram className="w-3 h-3 text-pink-500" />
                      {brand.handles.instagram}
                    </span>
                  )}
                  {brand.handles?.tiktok && (
                    <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                      <Globe className="w-3 h-3 text-cyan-500" />
                      {brand.handles.tiktok}
                    </span>
                  )}
                  {brand.handles?.youtube && (
                    <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                      <Globe className="w-3 h-3 text-red-500" />
                      {brand.handles.youtube}
                    </span>
                  )}
                </div>
              </div>
              <Button
                onClick={() => navigate(`/app/brands/${brand.id}`)}
                variant="outline"
                className="w-full text-xs gap-2 hover:bg-primary hover:text-white transition-colors"
              >
                Ver Detalhes <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <QuickOnboardingModal open={quickOnboardOpen} onOpenChange={setQuickOnboardOpen} />
    </div>
  )
}
