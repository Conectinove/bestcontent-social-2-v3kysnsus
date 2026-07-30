import { useState } from 'react'
import { useLocation, useNavigate } from 'react'
import {
  Sparkles,
  Calendar as CalendarIcon,
  Upload,
  Send,
  Save,
  Instagram,
  Globe,
  Twitter,
  Linkedin,
  Clock,
} from 'lucide-react'
import { useSocial } from '@/context/SocialContext'
import { SocialPlatform } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AIAssistantModal } from '@/components/AIAssistantModal'
import { toast } from '@/hooks/use-toast'

export default function CreatePost() {
  const { brands, addPost } = useSocial()
  const navigate = useNavigate()
  const location = useLocation()

  const initialCaption = location.state?.caption || ''
  const initialBrandId = location.state?.brandId || brands[0]?.id || ''

  const [selectedBrandId, setSelectedBrandId] = useState<string>(initialBrandId)
  const [platform, setPlatform] = useState<SocialPlatform>('instagram')
  const [contentType, setContentType] = useState<'post' | 'reel' | 'story' | 'tweet'>('post')
  const [caption, setCaption] = useState<string>(initialCaption)
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  )
  const [hashtags, setHashtags] = useState<string[]>(['#BestContent', '#SocialMedia'])
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>(
    'https://img.usecurling.com/p/500/500?q=social%20media%20post',
  )

  const selectedBrand = brands.find((b) => b.id === selectedBrandId) || brands[0]

  const handleApplyAIText = (text: string, newHashtags?: string[]) => {
    setCaption(text)
    if (newHashtags && newHashtags.length > 0) {
      setHashtags(newHashtags)
    }
  }

  const handleScheduleOrPublish = (status: 'scheduled' | 'published' | 'draft') => {
    if (!caption.trim()) {
      toast({ title: 'Atenção', description: 'Por favor, escreva uma legenda para o post.' })
      return
    }

    addPost({
      brandId: selectedBrandId,
      platform,
      contentType,
      caption,
      mediaUrls: [imageUrl],
      status,
      scheduledDate: status === 'scheduled' ? new Date(scheduledDate).toISOString() : undefined,
      publishedDate: status === 'published' ? new Date().toISOString() : undefined,
      hashtags,
    })

    toast({
      title: status === 'published' ? 'Post Publicado!' : 'Post Agendado!',
      description: 'Você pode visualizá-lo no Calendário de Conteúdo.',
    })

    navigate('/app/calendar')
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Criar Novo Post
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Agende ou publique conteúdos de alta conversão para suas redes sociais.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Form inputs */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-4 space-y-4">
            {/* Brand & Platform selector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Selecione a Marca</label>
                <select
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                  className="w-full text-xs bg-muted border border-border rounded-md px-2.5 py-2"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Rede Social</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
                  className="w-full text-xs bg-muted border border-border rounded-md px-2.5 py-2 capitalize"
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>
            </div>

            {/* Caption Text area */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold">Legenda do Post</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAiModalOpen(true)}
                  className="text-xs text-primary hover:text-pink-600 gap-1 h-6"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Gerar com IA
                </Button>
              </div>

              <Textarea
                placeholder="Escreva a legenda incrível para sua audiência..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="h-32 text-xs leading-relaxed"
              />
              <span className="text-[10px] text-muted-foreground float-right mt-1">
                {caption.length} caracteres
              </span>
            </div>

            {/* Media Upload Mock */}
            <div>
              <label className="text-xs font-semibold block mb-1">Mídia (Imagem/Vídeo)</label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center space-y-2 bg-muted/20">
                <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Arraste seus arquivos ou clique para selecionar
                </p>
                <div className="flex justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setImageUrl(
                        `https://img.usecurling.com/p/500/500?q=product%20marketing&seed=${Date.now()}`,
                      )
                    }
                    className="text-[11px] h-7"
                  >
                    Trocar Imagem Exemplo
                  </Button>
                </div>
              </div>
            </div>

            {/* Date Picker */}
            <div>
              <label className="text-xs font-semibold block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" /> Data e Hora do Agendamento
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full text-xs bg-muted border border-border rounded-md px-3 py-2"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleScheduleOrPublish('draft')}
                className="text-xs gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                Rascunho
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleScheduleOrPublish('scheduled')}
                  className="bg-primary hover:bg-primary/90 text-white text-xs gap-1"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Agendar Post
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: Social Preview Mockup */}
        <div className="lg:col-span-5 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground block text-center">
            Pré-visualização ao Vivo ({platform})
          </label>

          <Card className="max-w-sm mx-auto overflow-hidden border-border bg-card shadow-lg">
            {/* Header of mock post */}
            <div className="p-3 border-b border-border flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                <img src={selectedBrand?.logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="leading-tight">
                <span className="font-semibold text-xs text-foreground block">
                  {selectedBrand?.name}
                </span>
                <span className="text-[10px] text-muted-foreground">{platform}</span>
              </div>
            </div>

            {/* Image Preview */}
            <div className="h-64 bg-muted overflow-hidden">
              <img src={imageUrl} alt="Post preview" className="w-full h-full object-cover" />
            </div>

            {/* Mock Caption Preview */}
            <CardContent className="p-3 space-y-2">
              <p className="text-xs text-foreground line-clamp-4 leading-relaxed whitespace-pre-line">
                <span className="font-semibold mr-1">{selectedBrand?.name}</span>
                {caption || 'Sua legenda aparecerá aqui...'}
              </p>
              <div className="flex flex-wrap gap-1">
                {hashtags.map((h) => (
                  <span key={h} className="text-[10px] text-primary">
                    {h}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AIAssistantModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        onApplyText={handleApplyAIText}
      />
    </div>
  )
}
