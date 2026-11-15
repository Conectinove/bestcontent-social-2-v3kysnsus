import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquare,
  Eye,
  Heart,
  Plus,
  Search,
  Sparkles,
  User as UserIcon,
  Award,
  BookOpen,
  Image as ImageIcon,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import useRealtime from '@/hooks/use-realtime'
import { CommunityRoleBadge, CommunityStatusBadges } from '@/components/community/CommunityBadges'
import { getImageUrlErrorMessage, uploadCommunityImage } from '@/lib/image-upload'
import { EditorAdvancedMediaDialog } from '@/components/editor/EditorAdvancedMediaDialog'
import {
  getCommunityCategories,
  getCommunityTopics,
  createCommunityTopic,
  searchCommunityTopics,
} from '@/services/community'
import { getTopicRoleBadge, formatRelative, FALLBACK_AVATAR_M } from '@/lib/community-format'
import { CommunityCategory, CommunityTopic, TopContributor } from '@/types/community'

const TOP_CONTRIBUTORS: TopContributor[] = [
  {
    rank: 1,
    id: '1',
    name: 'Aline Pazin',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=101',
    badgeTitle: 'Lenda do Conteúdo',
    xp: 1129,
    roleBadge: 'BASIC',
  },
  {
    rank: 2,
    id: '2',
    name: 'Adenilson Santos',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=102',
    badgeTitle: 'Grandmaster',
    xp: 783,
    roleBadge: 'ADMIN',
  },
  {
    rank: 3,
    id: '3',
    name: 'Luiz Filho',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=103',
    badgeTitle: 'Virtuoso',
    xp: 748,
    roleBadge: 'PRO',
  },
  {
    rank: 4,
    id: '4',
    name: 'MARCO ANTONIO ALESSIO',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=104',
    badgeTitle: 'Autoridade',
    xp: 461,
    roleBadge: 'MAX',
  },
  {
    rank: 5,
    id: '5',
    name: 'Eliezer Lemos',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=105',
    badgeTitle: 'Mestre Criador',
    xp: 449,
    roleBadge: 'PRO',
  },
  {
    rank: 6,
    id: '6',
    name: 'Dalmo Rebelo',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=106',
    badgeTitle: 'Mestre',
    xp: 227,
    roleBadge: 'BASIC',
  },
  {
    rank: 7,
    id: '7',
    name: 'Taís Pereira Estrategista ECO...',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=107',
    badgeTitle: 'Virtuoso',
    xp: 212,
    roleBadge: 'PRO',
  },
  {
    rank: 8,
    id: '8',
    name: 'Dra. Mariana Ferreira',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=108',
    badgeTitle: 'Virtuoso',
    xp: 197,
    roleBadge: 'BASIC',
  },
  {
    rank: 9,
    id: '9',
    name: 'Barbearia ForMen',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=109',
    badgeTitle: 'Mestre Criador',
    xp: 192,
    roleBadge: 'PRO',
  },
  {
    rank: 10,
    id: '10',
    name: 'Speculum Studio',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=110',
    badgeTitle: 'Criador Jr.',
    xp: 125,
    roleBadge: 'BASIC',
  },
]

export default function CommunityDashboard() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<CommunityCategory[]>([])
  const [topics, setTopics] = useState<CommunityTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [activeTab, setActiveTab] = useState<'recentes' | 'populares' | 'fixados'>('recentes')

  // Create Topic Modal State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [advOpen, setAdvOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const loadData = async () => {
    try {
      const [cats, topList] = await Promise.all([getCommunityCategories(), getCommunityTopics()])
      setCategories(cats)
      setTopics(topList)
    } catch {
      toast({ title: 'Erro ao carregar a comunidade', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('community_topics', () => {
    loadData()
  })

  useRealtime('community_replies', () => {
    loadData()
  })

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      loadData()
      return
    }
    setLoading(true)
    try {
      const results = await searchCommunityTopics(searchQuery)
      setTopics(results)
    } catch {
      toast({ title: 'Erro ao buscar tópicos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim() || !newCategory) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' })
      return
    }
    setIsSubmitting(true)
    try {
      await createCommunityTopic({
        title: newTitle,
        content: newContent,
        category: newCategory,
        tags: ['Novidades'],
      })
      toast({ title: 'Tópico criado com sucesso!' })
      setDialogOpen(false)
      setNewTitle('')
      setNewContent('')
      setNewCategory('')
      setNewImagePreview(null)
      setAdvOpen(false)
      loadData()
    } catch {
      toast({ title: 'Erro ao criar tópico', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredTopics = useMemo(() => {
    let result = [...topics]

    if (selectedCategory !== 'todos') {
      result = result.filter(
        (t) => t.expand?.category?.slug === selectedCategory || t.category === selectedCategory,
      )
    }

    if (activeTab === 'populares') {
      result.sort(
        (a, b) => b.likes_count + (b.views_count || 0) - (a.likes_count + (a.views_count || 0)),
      )
    } else if (activeTab === 'fixados') {
      result = result.filter((t) => t.is_pinned)
    } else {
      result.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    }

    return result
  }, [topics, selectedCategory, activeTab])

  const totalViews = useMemo(() => {
    return topics.reduce((acc, curr) => acc + (curr.views_count || 0), 9989)
  }, [topics])

  const totalReplies = useMemo(() => {
    return topics.reduce((acc, curr) => acc + (curr.replies_count || 0), 623)
  }, [topics])

  const handleImageSelected = async (file: File) => {
    setIsUploadingImage(true)
    try {
      const url = await uploadCommunityImage(file)
      setNewImagePreview(url)
      toast({ title: 'Imagem anexada ao tópico!' })
    } catch (err) {
      toast({
        title: 'Não foi possível anexar a imagem',
        description: getImageUrlErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeNewImage = () => {
    setNewImagePreview(null)
    setAdvOpen(false)
  }

  /** Resultado do motor de Edição Avançada (Studio) aplicado à imagem do novo tópico. */
  const handleAdvSave = async (resultUrl: string) => {
    if (newImagePreview && resultUrl !== newImagePreview && resultUrl.startsWith('data:')) {
      try {
        const blob = await (await fetch(resultUrl)).blob()
        const editedUrl = await uploadCommunityImage(
          new File([blob], 'topico-editado.png', { type: 'image/png' }),
        )
        setNewImagePreview(editedUrl)
        return
      } catch (err) {
        toast({
          title: 'Edição aplicada, mas não foi possível salvar a nova versão',
          description: getImageUrlErrorMessage(err),
          variant: 'destructive',
        })
      }
    }
    setNewImagePreview(resultUrl)
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Comunidade</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Troque ideias, compartilhe cases e aprenda com outros criadores
        </p>
      </div>

      {/* Top Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{186 + topics.length}</div>
            <div className="text-xs text-muted-foreground font-medium">Tópicos</div>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{totalReplies}</div>
            <div className="text-xs text-muted-foreground font-medium">Respostas</div>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">133</div>
            <div className="text-xs text-muted-foreground font-medium">Membros ativos</div>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{totalViews}</div>
            <div className="text-xs text-muted-foreground font-medium">Visualizações</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Feed + Right Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Topic List Main Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Feed Controls Header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as any)}
              className="w-auto"
            >
              <TabsList className="bg-secondary/60 p-1 rounded-xl">
                <TabsTrigger value="recentes" className="rounded-lg text-xs font-semibold px-4">
                  Recentes
                </TabsTrigger>
                <TabsTrigger value="populares" className="rounded-lg text-xs font-semibold px-4">
                  Populares
                </TabsTrigger>
                <TabsTrigger value="fixados" className="rounded-lg text-xs font-semibold px-4">
                  Fixados
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search + New Topic Button */}
            <div className="flex items-center gap-3">
              <form onSubmit={handleSearch} className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar tópicos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-card border-border rounded-xl text-xs h-10"
                />
              </form>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs h-10 px-4 gap-1.5 shadow-md">
                    <Plus className="w-4 h-4" /> Novo Tópico
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Criar Novo Tópico</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateTopic} className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="title" className="text-xs font-semibold">
                        Título do Tópico
                      </Label>
                      <Input
                        id="title"
                        placeholder="Ex: Dúvida sobre agendamento no TikTok"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="category" className="text-xs font-semibold">
                        Categoria
                      </Label>
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="content" className="text-xs font-semibold">
                        Conteúdo / Descrição
                      </Label>
                      <Textarea
                        id="content"
                        placeholder="Escreva em detalhes a sua ideia, dúvida ou caso de sucesso..."
                        rows={5}
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        required
                        className="rounded-xl resize-none"
                      />
                    </div>

                    {/* Imagem do tópico + Edição Avançada (motor do Studio) */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Imagem (opcional)</Label>
                      {newImagePreview && (
                        <div className="relative overflow-hidden rounded-xl border border-border">
                          <img
                            src={newImagePreview}
                            alt="Prévia da imagem do tópico"
                            className="w-full max-h-56 object-cover"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-7 text-xs bg-background/85 text-foreground backdrop-blur-sm border border-border"
                            onClick={removeNewImage}
                          >
                            Remover
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageSelected(file)
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingImage}
                          className="rounded-xl text-xs gap-1.5"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-primary" />
                          {isUploadingImage ? 'Enviando...' : 'Anexar imagem'}
                        </Button>
                        {newImagePreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-xs gap-1.5"
                            onClick={() => setAdvOpen(true)}
                          >
                            <Wand2 className="w-3.5 h-3.5 text-primary" />
                            Edição Avançada
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        className="rounded-xl text-xs"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary rounded-xl text-xs font-semibold"
                      >
                        {isSubmitting ? 'Publicando...' : 'Publicar Tópico'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>

                {/* Motor da Edição Avançada (Studio) sobre a imagem anexada */}
                <EditorAdvancedMediaDialog
                  open={advOpen}
                  onOpenChange={setAdvOpen}
                  mediaUrl={newImagePreview || undefined}
                  title={newTitle || 'Imagem do tópico'}
                  onSave={handleAdvSave}
                />
              </Dialog>
            </div>
          </div>

          {/* Topics List */}
          {loading ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              Carregando tópicos...
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="bg-card border border-border p-12 text-center rounded-2xl space-y-3">
              <MessageSquare className="w-10 h-10 text-muted-foreground/50 mx-auto" />
              <p className="font-semibold text-foreground">Nenhum tópico encontrado</p>
              <p className="text-xs text-muted-foreground">
                Tente alterar os filtros ou crie um novo tópico!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTopics.map((topic) => {
                const authorName = topic.expand?.user?.name || 'Adenilson Santos'
                const authorAvatar = topic.expand?.user?.avatar || FALLBACK_AVATAR_M

                return (
                  <div
                    key={topic.id}
                    className="bg-card hover:border-primary/40 border border-border p-5 rounded-2xl transition-all shadow-sm group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <img
                        src={authorAvatar}
                        alt={authorName}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-border"
                      />

                      {/* Content Right */}
                      <div className="flex-1 space-y-2.5">
                        {/* Status Tags (tokens do tema) */}
                        <CommunityStatusBadges
                          category={topic.expand?.category?.name}
                          tags={topic.tags}
                          isPinned={topic.is_pinned}
                        />

                        {/* Title Link */}
                        <Link
                          to={`/app/community/topic/${topic.id}`}
                          className="block text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug"
                        >
                          {topic.title}
                        </Link>

                        {/* Snippet */}
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {topic.content}
                        </p>

                        {/* Author Info & Interaction Footer */}
                        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{authorName}</span>
                            {getTopicRoleBadge(authorName, topic.tags || []).map((b) => (
                              <CommunityRoleBadge key={b} roleBadge={b} />
                            ))}
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {topic.replies_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              {topic.views_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                              {topic.likes_count || 0}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatRelative(topic.created)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-6">
          {/* Categorias Widget */}
          <div className="bg-card border border-border p-5 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <BookOpen className="w-4 h-4 text-primary" /> Categorias
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('todos')}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                  selectedCategory === 'todos'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'bg-secondary/70 hover:bg-secondary text-foreground'
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                    selectedCategory === cat.slug
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'bg-secondary/70 hover:bg-secondary text-foreground'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Top Contribuidores Widget */}
          <div className="bg-card border border-border p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Award className="w-4 h-4 text-primary" /> Top Contribuidores
            </div>

            <div className="space-y-3">
              {TOP_CONTRIBUTORS.map((contributor) => (
                <div key={contributor.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-muted-foreground w-4 text-center">
                      {contributor.rank}
                    </span>
                    <img
                      src={contributor.avatar}
                      alt={contributor.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-border"
                    />
                    <div className="truncate max-w-[130px]">
                      <p className="font-bold text-foreground truncate">{contributor.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {contributor.badgeTitle} · {contributor.xp} XP
                      </p>
                    </div>
                  </div>
                  <CommunityRoleBadge roleBadge={contributor.roleBadge} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
