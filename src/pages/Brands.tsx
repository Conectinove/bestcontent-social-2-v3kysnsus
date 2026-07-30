import { useState } from 'react'
import { useNavigate } from 'react'
import { Plus, Palette, ArrowRight, Instagram, Youtube, Twitter, Globe } from 'lucide-react'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

export default function Brands() {
  const { brands, addBrand } = useSocial()
  const navigate = useNavigate()

  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instagram, setInstagram] = useState('')
  const [tiktok, setTiktok] = useState('')

  const handleCreateBrand = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({ title: 'Erro', description: 'O nome da marca é obrigatório.' })
      return
    }

    addBrand({
      name,
      description: description || 'Sem descrição cadastrada.',
      logo: `https://img.usecurling.com/p/200/200?q=${encodeURIComponent(name)}%20logo`,
      coverImage: `https://img.usecurling.com/p/800/400?q=${encodeURIComponent(name)}%20brand`,
      handles: {
        instagram: instagram ? `@${instagram.replace('@', '')}` : undefined,
        tiktok: tiktok ? `@${tiktok.replace('@', '')}` : undefined,
      },
    })

    toast({ title: 'Marca criada!', description: `A marca ${name} foi adicionada com sucesso.` })
    setName('')
    setDescription('')
    setInstagram('')
    setTiktok('')
    setModalOpen(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            Minhas Marcas
            <Palette className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie perfis sociais, tom de voz e estratégias de conteúdo individualmente.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white font-medium gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Adicionar Marca
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand) => (
          <Card
            key={brand.id}
            className="overflow-hidden hover:shadow-md transition-all duration-300 border-border flex flex-col justify-between"
          >
            <div className="relative h-28 bg-muted">
              <img src={brand.coverImage} alt={brand.name} className="w-full h-full object-cover" />
              <div className="absolute -bottom-6 left-4 ring-4 ring-card rounded-full overflow-hidden bg-white w-14 h-14 shadow-sm">
                <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
              </div>
            </div>

            <CardContent className="pt-8 px-4 pb-4 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-bold text-lg text-foreground">{brand.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {brand.description}
                </p>

                {/* Handles */}
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

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-muted/50 text-center text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Posts/sem</span>
                  <span className="font-semibold text-foreground">{brand.stats.postsThisWeek}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Engajamento</span>
                  <span className="font-semibold text-primary">{brand.stats.engagementRate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Seguidores</span>
                  <span className="font-semibold text-foreground">{brand.stats.followers}</span>
                </div>
              </div>

              <Button
                onClick={() => navigate(`/app/brands/${brand.id}`)}
                variant="outline"
                className="w-full text-xs font-medium gap-2 hover:bg-primary hover:text-white transition-colors"
              >
                Gerenciar Marca
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Brand Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateBrand}>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Marca</DialogTitle>
              <DialogDescription>
                Cadastre informações sobre a sua empresa para gerar posts sob medida com IA.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 my-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Nome da Marca *
                </label>
                <Input
                  placeholder="Ex: Aurora Fitwear"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Descrição da Marca
                </label>
                <Textarea
                  placeholder="Qual é o segmento, diferenciais e tom de voz?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-20 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Instagram
                  </label>
                  <Input
                    placeholder="@aurora.fit"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">TikTok</label>
                  <Input
                    placeholder="@aurorafit"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary text-white">
                Criar Marca
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
