import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  PenTool,
  Trash2,
  Share2,
  Save,
  Upload,
  Users,
  TrendingUp,
  MessageCircle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { useSocial } from '@/context/SocialContext'
import { updateBrand } from '@/services/brands'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { toast } from '@/hooks/use-toast'
import { sharePost } from '@/lib/share'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { BrandAdvancedMediaDialog, dataUrlToFile } from '@/lib/advanced-media'
import { Wand2 } from 'lucide-react'
import { getFileUrl } from '@/lib/mappers'
import { TemplateSelector } from '@/components/TemplateSelector'
import type { PostTemplate } from '@/services/post-templates'

const followerData = [
  { month: 'Jan', followers: 32000 },
  { month: 'Fev', followers: 35400 },
  { month: 'Mar', followers: 39100 },
  { month: 'Abr', followers: 42000 },
  { month: 'Mai', followers: 45200 },
]

export default function BrandDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { brands, posts, ideas, deletePost, deleteBrand, refreshAll } = useSocial()
  const brand = brands.find((b: any) => b.id === id)
  const brandPosts = posts.filter((p: any) => p.brandId === id)
  const brandIdeas = ideas.filter((i: any) => i.brandId === id)
  const [edit, setEdit] = useState({
    name: brand?.name || '',
    description: brand?.description || '',
    instagram: brand?.handles?.instagram || '',
    tiktok: brand?.handles?.tiktok || '',
    youtube: brand?.handles?.youtube || '',
    facebook: brand?.handles?.facebook || '',
    website: brand?.handles?.website || '',
    color_theme: brand?.color_theme || '#BF2A95',
  })
  const [logo, setLogo] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  // Edição Avançada (motor do Studio) — logo/capa da marca
  const [advancedField, setAdvancedField] = useState<'logo' | 'cover' | null>(null)
  /** Data URL da mídia editada que substitui o logo (e a capa derivada) no save. */
  const [editedDataUrl, setEditedDataUrl] = useState<string | null>(null)
  // Fonte estável da mídia no editor: editada > upload local (object URL) > logo do PB.
  const advancedSrc = useMemo(() => {
    if (editedDataUrl) return editedDataUrl
    if (logo) return URL.createObjectURL(logo)
    return getFileUrl((brand as any)?._raw, 'logo')
  }, [editedDataUrl, logo, brand?._raw?.logo])

  if (!brand) {
    return (
      <div className="space-y-6 animate-fade-in py-12">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/app/brands')}
          className="text-xs text-muted-foreground gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Card className="p-12 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Carregando dados da marca...</h3>
            <p className="text-xs text-muted-foreground">Buscando informações no banco de dados.</p>
          </div>
        </Card>
      </div>
    )
  }

  const set = (k: string, v: string) => setEdit((p) => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(edit).forEach(([k, v]) => fd.append(k, v))
      // Mídia editada pela Edição Avançada tem precedência sobre o upload simples.
      const editedLogoFile = editedDataUrl ? dataUrlToFile(editedDataUrl, 'logo.png') : null
      if (editedLogoFile) fd.append('logo', editedLogoFile)
      else if (logo) fd.append('logo', logo)
      await updateBrand(id, fd as any)
      refreshAll()
      toast({ title: 'Salvo!', description: 'Dados da marca atualizados.' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteBrand(id)
      toast({ title: 'Excluída', description: 'Marca removida.' })
      navigate('/app/brands')
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/app/brands')}
        className="text-xs text-muted-foreground gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
        <div className="h-40 bg-muted">
          <img src={brand.coverImage} alt={brand.name} className="w-full h-full object-cover" />
        </div>
        <div className="p-6 pt-0 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 relative">
          <div className="flex items-end gap-4 -mt-12">
            <div className="w-24 h-24 rounded-full ring-4 ring-card overflow-hidden bg-white shadow-md">
              <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{brand.name}</h1>
              <p className="text-xs text-muted-foreground">{brand.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/app/onboarding?brand=${brand.id}`)}
              className="text-xs gap-1.5 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Abrir no Assistente</span>
            </Button>
            <Button
              onClick={() => setTemplateOpen(true)}
              className="bg-primary text-white text-xs gap-1 aggressive-button"
            >
              <PenTool className="w-4 h-4" /> Criar Post
            </Button>
          </div>
        </div>
      </div>

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
            Config.
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 space-y-4">
          {brandPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">Nenhum post encontrado.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {brandPosts.map((post: any) => (
                <Card key={post.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={post.status === 'published' ? 'default' : 'secondary'}
                      className="text-[10px] capitalize"
                    >
                      {post.status === 'published'
                        ? 'Publicado'
                        : post.status === 'scheduled'
                          ? 'Agendado'
                          : 'Rascunho'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-muted-foreground uppercase">
                        {post.platform}
                      </span>
                      {post.status === 'published' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => sharePost(post.caption || post.content)}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          deletePost(post.id)
                          toast({ title: 'Excluído', description: 'Post removido.' })
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs line-clamp-3 leading-relaxed">
                    {post.caption || post.content}
                  </p>
                  {post.scheduledDate && (
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(post.scheduledDate).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ideas" className="mt-4 space-y-4">
          {brandIdeas.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">Sem ideias salvas.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {brandIdeas.map((idea: any) => (
                <Card key={idea.id} className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm">{idea.title}</h4>
                  <p className="text-xs text-muted-foreground">{idea.snippet}</p>
                  <Button
                    size="sm"
                    onClick={() =>
                      navigate('/app/content/new', {
                        state: { caption: `${idea.title}\n\n${idea.snippet}`, brandId: id },
                      })
                    }
                    className="text-xs bg-primary text-white"
                  >
                    Usar esta ideia
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-primary" /> Seguidores
              </span>
              <p className="text-xl font-bold">{brand.stats.followers}</p>
            </Card>
            <Card className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" /> Engajamento
              </span>
              <p className="text-xl font-bold text-primary">{brand.stats.engagementRate}</p>
            </Card>
            <Card className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-cyan-500" /> Interações
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

        <TabsContent value="settings" className="mt-4">
          <Card className="p-6 max-w-xl space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1">Nome</label>
              <Input value={edit.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Descrição</label>
              <Textarea
                value={edit.description}
                onChange={(e) => set('description', e.target.value)}
                className="h-24 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1">Instagram</label>
                <Input value={edit.instagram} onChange={(e) => set('instagram', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">TikTok</label>
                <Input value={edit.tiktok} onChange={(e) => set('tiktok', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">YouTube</label>
                <Input value={edit.youtube} onChange={(e) => set('youtube', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Facebook</label>
                <Input value={edit.facebook} onChange={(e) => set('facebook', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Website</label>
                <Input value={edit.website} onChange={(e) => set('website', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Cor do tema</label>
                <input
                  type="color"
                  value={edit.color_theme}
                  onChange={(e) => set('color_theme', e.target.value)}
                  className="w-full h-9 rounded-md border border-border cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Logo / Capa</label>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('edit-logo')?.click()}
                >
                  <Upload className="w-3.5 h-3.5" /> {logo ? logo.name : 'Trocar logo'}
                </Button>
                <input
                  id="edit-logo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setLogo(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdvancedField(advancedField === null ? 'logo' : advancedField)}
                  className="gap-1.5 font-semibold"
                  title="Abrir a Edição Avançada (filtros, textos e IA de exportação)"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Edição avançada
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="text-xs gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Excluir Marca
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir marca?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação removerá a marca e todos os posts associados. Não pode ser desfeito.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-white text-xs gap-1"
              >
                <Save className="w-3.5 h-3.5" /> {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <TemplateSelector
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        onSelect={(template: PostTemplate) => {
          setTemplateOpen(false)
          navigate('/app/content/new', { state: { brandId: brand.id, template } })
        }}
        onSkip={() => {
          setTemplateOpen(false)
          navigate('/app/content/new', { state: { brandId: brand.id } })
        }}
      />

      {/* Motor de Edição Avançada (Studio) — logo/capa da marca */}
      {advancedField && (
        <BrandAdvancedMediaDialog
          open
          field={advancedField}
          brandName={brand.name}
          mediaUrl={advancedSrc || ''}
          onSave={(resultUrl) => {
            setEditedDataUrl(resultUrl)
            setAdvancedField(null)
            toast({
              title: 'Edição aplicada!',
              description: 'A mídia editada será gravada ao salvar a marca.',
            })
          }}
          onOpenChange={(o) => {
            if (!o) setAdvancedField(null)
          }}
        />
      )}
    </div>
  )
}
