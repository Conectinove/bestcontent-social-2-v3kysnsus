import { useEffect, useMemo, useState } from 'react'
import { Wand2, Loader2, ImagePlus, Save, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { createPost, type PostRecord } from '@/services/labs-posts'
import { StudioAdvancedEditorDialog } from '@/components/studio/StudioAdvancedEditorDialog'
import type { StudioCreationRecord } from '@/services/ai-studio'

const NETWORKS = [
  { id: 'feed', label: 'Instagram Feed', icon: '📸' },
  { id: 'story', label: 'Instagram Story', icon: '⚡' },
  { id: 'reels', label: 'Reels', icon: '🎬' },
  { id: 'shorts', label: 'Shorts', icon: '📺' },
  { id: 'x', label: 'X (Twitter)', icon: '🐦' },
] as const

type NetworkId = (typeof NETWORKS)[number]['id']

const ASPECT_BY_NETWORK: Record<NetworkId, string> = {
  feed: '1:1',
  story: '9:16',
  reels: '9:16',
  shorts: '9:16',
  x: '16:9',
}

/** Mapa rede do Labs → platform (select obrigatório da coleção posts). */
const PLATFORM_BY_NETWORK: Record<NetworkId, string> = {
  feed: 'Instagram',
  story: 'Instagram',
  reels: 'Instagram',
  shorts: 'YouTube',
  x: 'Twitter/X',
}

/** Aba POST do Labs: cria post social com mídia via Edição Avançada, template (feed|story) e rede. */
export function LabsPostTab() {
  const { user } = useAuth()
  const { brands } = useSocial()
  const [brandId, setBrandId] = useState('')
  const [network, setNetwork] = useState<NetworkId>('feed')
  const [templateType, setTemplateType] = useState<'feed' | 'story'>('feed')
  const [caption, setCaption] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<PostRecord | null>(null)

  useEffect(() => {
    if (!brandId && brands.length > 0) setBrandId(brands[0].id)
  }, [brands, brandId])

  // A rede define o template quando ela própria é feed|story (enum válido de post_templates).
  useEffect(() => {
    if (network === 'feed' || network === 'story') setTemplateType(network)
  }, [network])

  const aspect = useMemo(() => ASPECT_BY_NETWORK[network] || '1:1', [network])

  const creation: StudioCreationRecord = useMemo(
    () => ({
      id: '',
      user: user?.id || '',
      type: 'image' as const,
      title: caption.slice(0, 60) || 'Post do Labs',
      prompt: '',
      model_id: '',
      model_name: '',
      relative_cost: 0,
      credits_used: 0,
      aspect_ratio: aspect,
      preview_url: mediaUrl,
    }),
    [user?.id, caption, aspect, mediaUrl],
  )

  const handleMediaSaved = (url: string) => {
    setMediaUrl(url)
    setMediaDialogOpen(false)
    toast({ title: 'Mídia aplicada ao post' })
  }

  const handleSave = async () => {
    if (!user?.id) return
    if (!caption.trim()) {
      toast({ title: 'Escreva a legenda do post', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const saved = await createPost({
        user: user.id,
        brand: brandId || brands[0]?.id || user.id,
        content: caption.trim(),
        caption: caption.trim(),
        platform: PLATFORM_BY_NETWORK[network],
        template_type: templateType,
        media_url: mediaUrl,
      })
      setLastSaved(saved)
      setCaption('')
      setMediaUrl('')
      toast({
        title: 'Post salvo!',
        description: `Post ${PLATFORM_BY_NETWORK[network]} (${templateType}) criado — disponível na sua biblioteca.`,
      })
    } catch (err) {
      console.error('Erro ao salvar post:', err)
      toast({
        title: 'Erro ao salvar post',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const previewFrame =
    aspect === '9:16'
      ? 'w-[180px] h-[320px]'
      : aspect === '16:9'
        ? 'w-full max-w-[320px] aspect-video'
        : 'w-full max-w-[320px] aspect-square'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" /> Post
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Crie um post social com mídia pela Edição Avançada, escolha template e rede — salvo na
            sua conta.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <Card className="p-5 rounded-3xl border border-border/80 bg-card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Rede / plataforma</Label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value as NetworkId)}
                className="w-full h-10 rounded-xl border border-border bg-background text-xs px-3 font-semibold focus:outline-none"
              >
                {NETWORKS.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.icon} {n.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Template (feed | story)</Label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as 'feed' | 'story')}
                className="w-full h-10 rounded-xl border border-border bg-background text-xs px-3 font-semibold focus:outline-none"
              >
                <option value="feed">Feed (1:1)</option>
                <option value="story">Story (9:16)</option>
              </select>
            </div>
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

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Legenda</Label>
            <Textarea
              rows={5}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escreva a legenda do post..."
              className="text-sm rounded-2xl resize-y bg-muted/30"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Mídia (Edição Avançada)</Label>
            <div className="flex items-center gap-2">
              {mediaUrl ? (
                <img
                  src={mediaUrl}
                  alt="Mídia do post"
                  className="w-20 h-20 object-cover rounded-xl border border-border"
                />
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMediaDialogOpen(true)}
                className="rounded-xl text-xs font-bold gap-1.5"
              >
                <ImagePlus className="w-3.5 h-3.5" /> {mediaUrl ? 'Editar mídia' : 'Criar mídia'}
              </Button>
              {mediaUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMediaUrl('')}
                  className="text-xs text-muted-foreground"
                >
                  Remover
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            {lastSaved && (
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mr-auto min-w-0">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Último salvo: “{lastSaved.content?.slice(0, 40)}”</span>
              </span>
            )}
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl text-xs font-black gap-1.5"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saving ? 'Salvando...' : 'Salvar post'}
            </Button>
          </div>
        </Card>

        {/* Prévia por rede */}
        <Card className="p-5 rounded-3xl border border-border/80 bg-card">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
            Prévia — {NETWORKS.find((n) => n.id === network)?.label}
          </span>
          <div className="flex justify-center mt-3">
            <div
              className={`${previewFrame} rounded-2xl overflow-hidden border border-border bg-muted/40`}
            >
              {mediaUrl ? (
                <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2 p-4 text-center">
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-[11px] font-semibold">
                    Sem mídia — use a Edição Avançada
                  </span>
                </div>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-foreground/90 whitespace-pre-wrap line-clamp-6">
            {caption || (
              <span className="text-muted-foreground italic">A legenda aparece aqui...</span>
            )}
          </p>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Template: <strong>{templateType}</strong> · Plataforma:{' '}
            <strong>{PLATFORM_BY_NETWORK[network]}</strong> · Formato: <strong>{aspect}</strong>
          </p>
        </Card>
      </div>

      {mediaDialogOpen && (
        <StudioAdvancedEditorDialog
          open={mediaDialogOpen}
          onOpenChange={setMediaDialogOpen}
          creation={creation}
          network={network}
          onSave={handleMediaSaved}
        />
      )}
    </div>
  )
}

export default LabsPostTab
