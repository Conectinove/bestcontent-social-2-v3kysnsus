import { useState } from 'react'
import { useParams, useNavigate } from 'react'
import {
  ArrowLeft,
  PenTool,
  Calendar,
  BarChart2,
  Settings,
  Sparkles,
  Trash2,
  Edit,
  TrendingUp,
  Users,
  MessageCircle,
} from 'lucide-react'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { toast } from '@/hooks/use-toast'

export default function BrandDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { brands, posts, ideas, deletePost } = useSocial()

  const brand = brands.find((b) => b.id === id) || brands[0]
  const brandPosts = posts.filter((p) => p.brandId === brand?.id)
  const brandIdeas = ideas.filter((i) => i.brandId === brand?.id)

  const [editName, setEditName] = useState(brand?.name || '')
  const [editDesc, setEditDesc] = useState(brand?.description || '')

  const followerData = [
    { month: 'Jan', followers: 32000 },
    { month: 'Fev', followers: 35400 },
    { month: 'Mar', followers: 39100 },
    { month: 'Abr', followers: 42000 },
    { month: 'Mai', followers: 45200 },
  ]

  const engagementData = [
    { day: 'Seg', eng: 4.2 },
    { day: 'Ter', eng: 5.1 },
    { day: 'Qua', eng: 4.8 },
    { day: 'Qui', eng: 6.3 },
    { day: 'Sex', eng: 7.0 },
    { day: 'Sáb', eng: 8.2 },
    { day: 'Dom', eng: 6.5 },
  ]

  if (!brand) return null

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/app/brands')}
        className="text-xs text-muted-foreground gap-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Marcas
      </Button>

      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
        <div className="h-40 bg-muted relative">
          <img src={brand.coverImage} alt={brand.name} className="w-full h-full object-cover" />
        </div>
        <div className="p-6 pt-0 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 relative">
          <div className="flex items-end gap-4 -mt-12">
            <div className="w-24 h-24 rounded-full ring-4 ring-card overflow-hidden bg-white shadow-md">
              <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{brand.name}</h1>
              <p className="text-xs text-muted-foreground">{brand.description}</p>
            </div>
          </div>

          <Button
            onClick={() => navigate('/app/content/new', { state: { brandId: brand.id } })}
            className="bg-primary text-white font-medium text-xs gap-1"
          >
            <PenTool className="w-4 h-4" />
            Novo Post para {brand.name}
          </Button>
        </div>
      </div>

      {/* Detail Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="posts" className="text-xs">
            Posts ({brandPosts.length})
          </TabsTrigger>
          <TabsTrigger value="ideas" className="text-xs">
            Ideias ({brandIdeas.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">
            Análises
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">
            Aparência
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-4 space-y-4">
          {brandPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">
              Nenhum post encontrado para esta marca.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {brandPosts.map((post) => (
                <Card key={post.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={post.status === 'published' ? 'default' : 'secondary'}
                      className="text-[10px] capitalize"
                    >
                      {post.status === 'published' ? 'Publicado' : 'Agendado'}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground uppercase">
                      {post.platform}
                    </span>
                  </div>
                  <p className="text-xs text-foreground line-clamp-3 leading-relaxed">
                    {post.caption}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                    <span>
                      {post.scheduledDate
                        ? new Date(post.scheduledDate).toLocaleDateString('pt-BR')
                        : 'Sem data'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        deletePost(post.id)
                        toast({ title: 'Excluído', description: 'Post removido com sucesso.' })
                      }}
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Ideas Tab */}
        <TabsContent value="ideas" className="mt-4 space-y-4">
          {brandIdeas.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">
              Sem ideias salvas para esta marca.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {brandIdeas.map((idea) => (
                <Card key={idea.id} className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm">{idea.title}</h4>
                  <p className="text-xs text-muted-foreground">{idea.snippet}</p>
                  <Button
                    size="sm"
                    onClick={() =>
                      navigate('/app/content/new', {
                        state: { caption: `${idea.title}\n\n${idea.snippet}` },
                      })
                    }
                    className="text-xs bg-primary text-white mt-2"
                  >
                    Usar esta ideia
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-primary" /> Crescimento de Seguidores
              </span>
              <p className="text-xl font-bold">{brand.stats.followers}</p>
            </Card>
            <Card className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" /> Taxa de Engajamento
              </span>
              <p className="text-xl font-bold text-primary">{brand.stats.engagementRate}</p>
            </Card>
            <Card className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-cyan-500" /> Interações esta Semana
              </span>
              <p className="text-xl font-bold">1,840</p>
            </Card>
          </div>

          <Card className="p-4">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-sm font-semibold">Evolução de Seguidores</CardTitle>
            </CardHeader>
            <ChartContainer
              config={{ followers: { label: 'Seguidores', color: 'hsl(var(--primary))' } }}
              className="h-52 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={followerData}>
                  <XAxis dataKey="month" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="followers"
                    stroke="#BF2A95"
                    fill="#BF2A95"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <Card className="p-6 max-w-xl space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1">Nome da Marca</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Descrição</label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="h-24 text-xs"
              />
            </div>
            <Button
              onClick={() =>
                toast({ title: 'Salvo!', description: 'Dados da marca atualizados com sucesso.' })
              }
              className="bg-primary text-white text-xs"
            >
              Salvar Alterações
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
