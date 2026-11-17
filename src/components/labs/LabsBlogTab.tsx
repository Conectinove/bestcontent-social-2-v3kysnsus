import { useEffect, useState } from 'react'
import {
  BookOpen,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Save,
  Globe,
  ImagePlus,
  Share2,
  ShieldCheck,
  Info,
  Wand2,
  AlertCircle,
  RotateCcw,
  Users,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/hooks/use-toast'
import { pb } from '@/lib/pocketbase/client'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import {
  listLabsBlogPosts,
  saveLabsBlogPost,
  setLabsBlogPostStatus,
  deleteLabsBlogPost,
  type LabsBlogPost,
  type LabsBlogStatus,
} from '@/services/labs-blog'
import { createPost } from '@/services/labs-posts'
import { generateLabsBlogDraft } from '@/services/labs-ai'
import { StudioAdvancedEditorDialog } from '@/components/studio/StudioAdvancedEditorDialog'
import { StudioEditCommentsPanel } from '@/components/studio/StudioEditCommentsPanel'
import { useLiveEditCollaboration } from '@/hooks/use-live-edit-collaboration'
import { saveEditVersion } from '@/services/studio-edit-versions'
import type { AdvancedCustomizationState } from '@/components/workspace/AdvancedCustomizationPanel'
import { LabsAiGeneratorDialog } from '@/components/labs/LabsAiGeneratorDialog'
import { LabsCoverAiDialog } from '@/components/labs/LabsCoverAiDialog'
import type { StudioCreationRecord } from '@/services/ai-studio'

interface Draft {
  id: string | null
  title: string
  cover_url: string
  content: string
  status: LabsBlogStatus
}

const emptyDraft = (): Draft => ({
  id: null,
  title: '',
  cover_url: '',
  content: '',
  status: 'draft',
})

// Redes-alvo para compartilhar o artigo (chips) — mesmos valores do select
// `platform` da coleção posts (expandido na migration 0126). Um post é criado
// por rede selecionada, com título + trecho (180 chars) como legenda.
const SHARE_NETWORKS = [
  { id: 'Instagram', label: 'Instagram' },
  { id: 'Facebook', label: 'Facebook' },
  { id: 'LinkedIn', label: 'LinkedIn' },
  { id: 'Twitter/X', label: 'Twitter/X' },
  { id: 'TikTok', label: 'TikTok' },
  { id: 'YouTube', label: 'YouTube' },
  { id: 'WhatsApp', label: 'WhatsApp' },
  { id: 'Threads', label: 'Threads' },
  { id: 'Pinterest', label: 'Pinterest' },
  { id: 'Telegram', label: 'Telegram' },
  { id: 'Kwai', label: 'Kwai' },
  { id: 'Google Business', label: 'Google Business' },
] as const

/** Caption derivada do artigo: título + trecho curto do conteúdo. */
const deriveCaption = (post: { title: string; content: string }): string => {
  const excerpt = (post.content || '').replace(/\s+/g, ' ').trim().slice(0, 180)
  return `${post.title}\n\n${excerpt}${(post.content || '').length > 180 ? '…' : ''}`
}

const isAdminUser = (u: any): boolean =>
  Boolean(u && (u.role === 'admin' || u.isAdmin === true || u.profile?.role === 'admin'))

/** Snapshot do artigo gravado em studio_edit_versions a cada salvamento —
 *  é ele que alimenta o aviso de edição remota nas outras sessões. */
interface BlogEditSnapshot {
  title: string
  cover_url: string
  content: string
  status: LabsBlogStatus
}

/** Payload do record = campo settings (snapshot do artigo). Definido fora do
 *  componente para manter identidade estável (deps do subscribe do hook). */
const mapBlogEditRecord = (_rec: Record<string, unknown>, payload: unknown) =>
  (payload && typeof payload === 'object' ? payload : null) as Partial<BlogEditSnapshot> | null

/** Editor + lista de artigos do Blog do Labs (persistidos em labs_blog_posts). */
export function LabsBlogTab() {
  const { user } = useAuth()
  const { brands } = useSocial()
  const isAdmin = isAdminUser(user)

  const [posts, setPosts] = useState<LabsBlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [brandId, setBrandId] = useState('')
  const [coverDialogOpen, setCoverDialogOpen] = useState(false)
  const [coverAiOpen, setCoverAiOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [aiOpen, setAiOpen] = useState(false)

  // Colaboração ao vivo (mesmo motor do Studio, v0.0.311): enquanto o editor
  // está aberto num artigo EXISTENTE, assina studio_edit_versions por target_key
  // e mostra presença + aviso quando outra pessoa salva o mesmo material.
  const collabKey = draft.id ? `blog:${draft.id}` : null
  const {
    users: collabUsers,
    remoteEdit,
    dismissRemoteEdit,
    registerOwnSave,
  } = useLiveEditCollaboration<Partial<BlogEditSnapshot>>(collabKey, collabKey !== null, {
    mapRecord: mapBlogEditRecord,
  })

  // Compartilhar nas redes
  const [sharePost, setSharePost] = useState<LabsBlogPost | null>(null)
  const [shareNetworks, setShareNetworks] = useState<string[]>([])
  const [sharing, setSharing] = useState(false)

  // Painel de quem pode publicar (admins da org)
  const [admins, setAdmins] = useState<string[]>([])
  const [adminsLoading, setAdminsLoading] = useState(false)

  const load = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      setPosts(await listLabsBlogPosts(user.id))
      setLoadError(false)
    } catch (err) {
      // Estado de erro com retry — não deixa a lista "vazia" enganar o usuário
      console.error('Erro ao carregar artigos do blog:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  const loadAdmins = async () => {
    setAdminsLoading(true)
    try {
      const records = await pb.collection('users').getList(1, 30, {
        filter: `role = "admin"`,
        sort: '-created',
      })
      setAdmins(records.items.map((r: any) => r.name || r.email || r.username || 'Admin sem nome'))
    } catch {
      // Sem permissão de listar users ou campo role indisponível — painel fica vazio
      setAdmins([])
    } finally {
      setAdminsLoading(false)
    }
  }

  useEffect(() => {
    void load()
    void loadAdmins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    if (!brandId && brands.length > 0) setBrandId(brands[0].id)
  }, [brands, brandId])

  const startNew = () => {
    setEditingId('new')
    setDraft(emptyDraft())
  }

  /** Gera rascunho de artigo via studio-agent e preenche o editor (usuário edita antes de salvar). */
  const handleAiGenerate = async (briefing: string) => {
    setEditingId('new')
    setDraft(emptyDraft())
    const generated = await generateLabsBlogDraft(briefing)
    setDraft({
      id: null,
      title: generated.title,
      cover_url: '',
      content: generated.body,
      status: 'draft',
    })
    toast({ title: 'Rascunho gerado!', description: 'Revise e edite o texto antes de salvar.' })
  }

  const startEdit = (post: LabsBlogPost) => {
    setEditingId(post.id)
    setDraft({
      id: post.id,
      title: post.title,
      cover_url: post.cover_url,
      content: post.content,
      status: post.status,
    })
  }

  const persist = async (status: LabsBlogStatus) => {
    if (!user?.id) return
    if (status === 'published' && !isAdmin) {
      toast({
        title: 'Publicação restrita',
        description: 'Somente administradores publicam artigos. Salve como rascunho.',
        variant: 'destructive',
      })
      return
    }
    if (!draft.title.trim()) {
      toast({ title: 'Dê um título ao artigo', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const saved = await saveLabsBlogPost({
        id: draft.id || undefined,
        user: user.id,
        brand: brandId || brands[0]?.id || user.id,
        title: draft.title,
        cover_url: draft.cover_url,
        content: draft.content,
        status,
      })
      // Colaboração: grava o snapshot em studio_edit_versions (mesma coleção do
      // Studio) — as outras sessões com este artigo aberto recebem o aviso ao
      // vivo. Best-effort: nunca bloqueia nem falha o salvamento do artigo.
      void saveEditVersion({
        targetKey: `blog:${saved.id}`,
        title: saved.title,
        settings: {
          title: saved.title,
          cover_url: saved.cover_url,
          content: saved.content,
          status: saved.status,
        } as unknown as AdvancedCustomizationState,
        aspectRatio: '16:9',
        previewUrl: saved.cover_url,
      })
        .then((v) => {
          if (v) registerOwnSave(v.id)
        })
        .catch(() => {})
      toast({
        title: status === 'published' ? 'Artigo publicado!' : 'Rascunho salvo!',
        description:
          status === 'published'
            ? `"${draft.title}" está no ar no Blog do Labs.`
            : `"${draft.title}" guardado como rascunho.`,
      })
      setEditingId(null)
      setDraft(emptyDraft())
      await load()
    } catch (err) {
      console.error('Erro ao salvar artigo:', err)
      toast({ title: 'Erro ao salvar artigo', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (post: LabsBlogPost) => {
    if (!isAdmin) {
      toast({
        title: 'Publicação restrita',
        description: 'Somente administradores podem publicar artigos.',
        variant: 'destructive',
      })
      return
    }
    const next: LabsBlogStatus = post.status === 'published' ? 'draft' : 'published'
    try {
      await setLabsBlogPostStatus(post.id, next)
      toast({ title: next === 'published' ? 'Artigo publicado' : 'Artigo voltou para rascunho' })
      await load()
    } catch {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const remove = async (post: LabsBlogPost) => {
    try {
      await deleteLabsBlogPost(post.id)
      toast({ title: 'Artigo excluído', description: `"${post.title}" foi removido.` })
      await load()
    } catch {
      toast({ title: 'Erro ao excluir artigo', variant: 'destructive' })
    }
  }

  const toggleShareNetwork = (id: string) => {
    setShareNetworks((prev) => {
      if (prev.includes(id)) return prev.filter((n) => n !== id)
      return [...prev, id]
    })
  }

  const handleShare = async () => {
    if (!user?.id || !sharePost) return
    if (shareNetworks.length === 0) {
      toast({
        title: 'Escolha ao menos uma rede',
        description: 'Selecione as redes nas quais quer compartilhar o artigo.',
        variant: 'destructive',
      })
      return
    }
    setSharing(true)
    try {
      const caption = deriveCaption(sharePost)
      for (const net of shareNetworks) {
        await createPost({
          user: user.id,
          brand: brandId || brands[0]?.id || user.id,
          content: caption,
          caption,
          platform: net,
          template_type: 'feed',
        })
      }
      toast({
        title: 'Compartilhado!',
        description: `"${sharePost.title}" virou ${shareNetworks.length} ${
          shareNetworks.length === 1 ? 'post' : 'posts'
        } na(s) rede(s) escolhida(s), pronto(s) no calendário.`,
      })
      setSharePost(null)
      setShareNetworks([])
    } catch (err) {
      console.error('Erro ao compartilhar artigo:', err)
      toast({ title: 'Erro ao compartilhar', variant: 'destructive' })
    } finally {
      setSharing(false)
    }
  }

  const handleCoverSaved = (url: string) => {
    setDraft((prev) => ({ ...prev, cover_url: url }))
    setCoverDialogOpen(false)
    toast({ title: 'Capa aplicada ao artigo' })
  }

  const coverCreation: StudioCreationRecord = {
    id: '',
    user: user?.id || '',
    type: 'image' as const,
    title: draft.title || 'Capa do artigo',
    prompt: '',
    model_id: '',
    model_name: '',
    relative_cost: 0,
    credits_used: 0,
    aspect_ratio: '16:9',
    preview_url: draft.cover_url,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Blog
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Crie artigos com capa, salve rascunhos e publique — tudo persistido na sua conta.
            {!isAdmin && ' A publicação é feita por um administrador.'}
          </p>
        </div>
        {editingId === null && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAiOpen(true)}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <Wand2 className="w-4 h-4" /> Gerar com IA
            </Button>
            <Button
              type="button"
              onClick={startNew}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <Plus className="w-4 h-4" /> Novo artigo
            </Button>
          </div>
        )}
      </div>

      {/* Editor */}
      {editingId !== null && (
        <Card className="p-5 rounded-3xl border border-border/80 bg-card space-y-4">
          {/* Colaboração ao vivo: presença + comentários + aviso de edição remota */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {collabUsers.map((u) => (
                <Badge
                  key={u.userId}
                  variant="outline"
                  className="gap-1.5 text-[10px] font-bold border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                >
                  <Users className="w-3 h-3" />
                  {u.userId === user?.id ? 'Você' : `${u.name} está editando`}
                </Badge>
              ))}
            </div>
            <StudioEditCommentsPanel
              targetKey={collabKey}
              materialLabel={draft.title || 'Artigo'}
            />
          </div>
          {remoteEdit && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
              <Users className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="text-foreground/90">
                <b>{remoteEdit.userName}</b> editou este artigo agora.
              </span>
              <div className="flex-1" />
              <Button
                size="sm"
                onClick={() => {
                  const payload = remoteEdit.payload
                  if (payload) setDraft((p) => ({ ...p, ...payload }))
                  dismissRemoteEdit()
                }}
                className="h-7 px-2 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white"
              >
                Atualizar agora
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={dismissRemoteEdit}
                className="h-7 px-2 text-[11px] font-bold"
                title="Manter meu trabalho em andamento"
              >
                Manter o meu
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Título</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                placeholder="Título do artigo..."
                className="h-10 text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Marca</Label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background text-xs px-3 font-semibold focus:outline-none"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Capa (opcional, com Edição Avançada)</Label>
            <div className="flex items-center gap-2">
              {draft.cover_url ? (
                <img
                  src={draft.cover_url}
                  alt="Capa do artigo"
                  className="w-28 h-16 object-cover rounded-xl border border-border"
                />
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCoverDialogOpen(true)}
                className="rounded-xl text-xs font-bold gap-1.5"
              >
                <ImagePlus className="w-3.5 h-3.5" />{' '}
                {draft.cover_url ? 'Editar capa' : 'Adicionar capa'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCoverAiOpen(true)}
                className="rounded-xl text-xs font-bold gap-1.5 text-primary border-primary/40 hover:bg-primary/10"
              >
                <Wand2 className="w-3.5 h-3.5" /> Gerar capa com IA
              </Button>
              {draft.cover_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDraft((p) => ({ ...p, cover_url: '' }))}
                  className="text-xs text-muted-foreground"
                >
                  Remover
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Conteúdo</Label>
            <Textarea
              rows={10}
              value={draft.content}
              onChange={(e) => setDraft((p) => ({ ...p, content: e.target.value }))}
              placeholder="Escreva o artigo... parágrafos separados por linha em branco viram blocos na prévia."
              className="text-sm rounded-2xl resize-y bg-muted/30"
            />
          </div>

          {/* Prévia */}
          {draft.content.trim() && (
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Prévia
              </span>
              {draft.cover_url && (
                <img
                  src={draft.cover_url}
                  alt=""
                  className="w-full max-h-56 object-cover rounded-xl"
                />
              )}
              <h3 className="text-lg font-black text-foreground font-serif">
                {draft.title || 'Sem título'}
              </h3>
              {draft.content
                .split(/\n{2,}/)
                .filter(Boolean)
                .map((par, i) => (
                  <p
                    key={i}
                    className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap"
                  >
                    {par}
                  </p>
                ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditingId(null)}
              className="text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => persist('draft')}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Salvando...' : 'Salvar rascunho'}
            </Button>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={isAdmin ? -1 : 0}>
                    <Button
                      type="button"
                      size="sm"
                      disabled={saving || !isAdmin}
                      onClick={() => persist('published')}
                      className="rounded-xl text-xs font-black gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" /> Publicar
                    </Button>
                  </span>
                </TooltipTrigger>
                {!isAdmin && (
                  <TooltipContent>
                    <p className="text-[11px] max-w-[220px]">
                      Somente administradores publicam artigos. Salve como rascunho e peça a um
                      admin da organização para publicar.
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </Card>
      )}

      {/* Lista de artigos */}
      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando artigos...
        </div>
      ) : loadError ? (
        <div className="text-center py-10 rounded-3xl border border-destructive/30 bg-destructive/5 space-y-2">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm font-bold text-foreground">Falha ao carregar artigos</p>
          <p className="text-xs text-muted-foreground">
            Não foi possível buscar seus artigos do blog.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            className="text-xs rounded-xl gap-1.5 font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Tentar novamente
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 rounded-3xl border border-dashed border-border/80 space-y-2">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-bold text-foreground">Nenhum artigo ainda</p>
          <p className="text-xs text-muted-foreground">Clique em "Novo artigo" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="p-4 rounded-2xl border border-border/80 bg-card space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold uppercase ${
                    post.status === 'published'
                      ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
                      : 'border-amber-500/40 text-amber-600 bg-amber-500/10'
                  }`}
                >
                  {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {post.updated ? new Date(post.updated).toLocaleDateString('pt-BR') : ''}
                </span>
              </div>
              {post.cover_url && (
                <img src={post.cover_url} alt="" className="w-full h-28 object-cover rounded-xl" />
              )}
              <h3 className="text-sm font-black text-foreground font-serif">{post.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                {post.content || 'Sem conteúdo.'}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(post)}
                  className="text-xs rounded-xl gap-1 flex-1"
                >
                  <Pencil className="w-3 h-3" /> Editar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSharePost(post)
                    setShareNetworks([])
                  }}
                  className="text-xs rounded-xl gap-1 flex-1"
                >
                  <Share2 className="w-3 h-3" /> Compartilhar
                </Button>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={isAdmin && post.status !== 'published' ? -1 : 0}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!isAdmin && post.status !== 'published'}
                          onClick={() => togglePublish(post)}
                          className="text-xs rounded-xl gap-1 flex-1"
                        >
                          {post.status === 'published' ? (
                            <Pencil className="w-3 h-3" />
                          ) : (
                            <Globe className="w-3 h-3" />
                          )}
                          {post.status === 'published' ? 'Despublicar' : 'Publicar'}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!isAdmin && post.status !== 'published' && (
                      <TooltipContent>
                        <p className="text-[11px] max-w-[220px]">
                          Somente administradores publicam artigos.
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(post)}
                  className="text-xs rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Compartilhar nas redes */}
      {sharePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="p-5 rounded-3xl bg-card w-full max-w-md space-y-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Compartilhar nas redes</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              O artigo <span className="font-semibold text-foreground">"{sharePost.title}"</span>{' '}
              virá como legenda (título + trecho). Escolha as redes — um post por rede:
            </p>
            <div className="flex flex-wrap gap-2">
              {SHARE_NETWORKS.map((n) => {
                const active = shareNetworks.includes(n.id)
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => toggleShareNetwork(n.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/40'
                    }`}
                  >
                    {n.label}
                  </button>
                )
              })}
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Legenda gerada
              </p>
              <p className="text-xs text-foreground whitespace-pre-wrap line-clamp-4">
                {deriveCaption(sharePost)}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSharePost(null)
                  setShareNetworks([])
                }}
                className="text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={sharing}
                onClick={handleShare}
                className="rounded-xl text-xs font-black gap-1.5"
              >
                {sharing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
                {sharing ? 'Compartilhando…' : `Compartilhar (${shareNetworks.length})`}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Painel: quem pode publicar (admins) */}
      <Card className="p-5 rounded-3xl border border-border/80 bg-card space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Quem pode publicar
          </h4>
        </div>
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Somente administradores publicam artigos no Blog. Não-admins criam e editam rascunhos; a
            publicação fica a cargo dos admins da organização listados abaixo.
          </p>
        </div>
        {adminsLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando admins...
          </div>
        ) : admins.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhum administrador listado (ou sem permissão de leitura da listagem).
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {admins.map((name, i) => (
              <Badge key={`${name}-${i}`} variant="outline" className="text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3 mr-1" /> {name}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Gerar capa com IA (conector OpenAI do usuário) */}
      <LabsCoverAiDialog
        open={coverAiOpen}
        onOpenChange={setCoverAiOpen}
        seedPrompt={draft.title}
        onGenerated={handleCoverSaved}
      />

      {/* Edição Avançada da capa */}
      {coverDialogOpen && coverCreation.preview_url && (
        <StudioAdvancedEditorDialog
          open={coverDialogOpen}
          onOpenChange={setCoverDialogOpen}
          creation={coverCreation}
          network="blog"
          onSave={handleCoverSaved}
        />
      )}

      {/* Geração por IA (studio-agent) */}
      <LabsAiGeneratorDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        title="Gerar artigo com IA"
        description="Descreva o tema do artigo — a IA cria título e corpo que entram no editor para você revisar e editar."
        placeholder="Ex.: 5 tendências de marketing digital para pequenas empresas em 2026"
        generatingLabel="Gerando artigo…"
        kind="blog"
        onGenerate={handleAiGenerate}
      />
    </div>
  )
}

export default LabsBlogTab
