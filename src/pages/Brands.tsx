import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Palette, ArrowRight, Instagram, Globe, Upload, Sparkles } from 'lucide-react'
import { QuickOnboardingModal } from '@/components/QuickOnboardingModal'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const EMPTY_FORM = {
  name: '',
  description: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  facebook: '',
  website: '',
  color_theme: '#BF2A95',
}

export default function Brands() {
  const { brands, addBrand } = useSocial()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [quickOnboardOpen, setQuickOnboardOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [logo, setLogo] = useState<File | null>(null)

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast({ title: 'Erro', description: 'O nome da marca é obrigatório.' })
      return
    }
    setLoading(true)
    try {
      await addBrand({ ...form, logo })
      toast({ title: 'Marca criada!', description: `${form.name} foi adicionada.` })
      setForm(EMPTY_FORM)
      setLogo(null)
      setOpen(false)
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

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
            variant="outline"
            onClick={() => navigate('/app/onboarding')}
            className="gap-2 text-xs"
          >
            Onboarding Completo
          </Button>
          <Button
            onClick={() => setOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white gap-2 text-xs"
          >
            <Plus className="w-4 h-4" /> Adicionar Marca
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand: any) => (
          <Card
            key={brand.id}
            className="overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col"
          >
            <div className="relative h-28 bg-muted">
              <img src={brand.coverImage} alt={brand.name} className="w-full h-full object-cover" />
              <div className="absolute -bottom-6 left-4 ring-4 ring-card rounded-full overflow-hidden bg-white w-14 h-14 shadow-sm">
                <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
              </div>
            </div>
            <CardContent className="pt-8 px-4 pb-4 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-bold text-lg">{brand.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {brand.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
                  {brand.handles.instagram && (
                    <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                      <Instagram className="w-3 h-3 text-pink-500" />
                      {brand.handles.instagram}
                    </span>
                  )}
                  {brand.handles.tiktok && (
                    <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                      <Globe className="w-3 h-3 text-cyan-500" />
                      {brand.handles.tiktok}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Marca</DialogTitle>
              <DialogDescription>
                Cadastre sua empresa para gerar posts sob medida.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 my-4">
              <div>
                <label className="text-xs font-semibold mb-1 block">Nome da Marca *</label>
                <Input
                  placeholder="Ex: Aurora Fitwear"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Descrição</label>
                <Textarea
                  placeholder="Segmento, diferenciais e tom de voz"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  className="h-20 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Logo</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('logo-input')?.click()}
                  >
                    <Upload className="w-3.5 h-3.5" /> {logo ? logo.name : 'Escolher arquivo'}
                  </Button>
                  <input
                    id="logo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setLogo(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Instagram</label>
                  <Input
                    placeholder="@aurora.fit"
                    value={form.instagram}
                    onChange={(e) => set('instagram', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">TikTok</label>
                  <Input
                    placeholder="@aurorafit"
                    value={form.tiktok}
                    onChange={(e) => set('tiktok', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">YouTube</label>
                  <Input
                    placeholder="@aurorafit"
                    value={form.youtube}
                    onChange={(e) => set('youtube', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Facebook</label>
                  <Input
                    placeholder="/aurorafit"
                    value={form.facebook}
                    onChange={(e) => set('facebook', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Website</label>
                  <Input
                    placeholder="aurora.com"
                    value={form.website}
                    onChange={(e) => set('website', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Cor do tema</label>
                  <input
                    type="color"
                    value={form.color_theme}
                    onChange={(e) => set('color_theme', e.target.value)}
                    className="w-full h-9 rounded-md border border-border cursor-pointer"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-primary text-white">
                {loading ? 'Criando...' : 'Criar Marca'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <QuickOnboardingModal open={quickOnboardOpen} onOpenChange={setQuickOnboardOpen} />
    </div>
  )
}
