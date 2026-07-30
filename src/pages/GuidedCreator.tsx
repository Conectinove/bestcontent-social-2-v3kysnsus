import { useState, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  MessageSquare,
  Paperclip,
  Wand2,
  Lock,
  Play,
  Film,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Clock,
  Layers,
  Video,
  FileText,
} from 'lucide-react'
import { useSocial } from '@/context/SocialContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { generateVideoScript } from '@/services/ai'
import { createPost } from '@/services/posts'

const DURATIONS = [7, 15, 30, 60, 90]

interface VideoTake {
  take_number: number
  duration_sec: number
  visual_description: string
  voiceover: string
  text_overlay: string
}

interface VideoScriptResult {
  title: string
  caption: string
  hashtags: string[]
  takes: VideoTake[]
}

const TEMPLATES = [
  {
    id: 'ai_images',
    title: 'Imagens IA',
    badge: 'Imagens IA',
    subtext: 'SEUS DIAS',
    authorLogo: 'outstone',
    image: 'https://img.usecurling.com/p/400/700?q=cinematic%20man%20jacket%20portrait&color=blue',
    locked: false,
  },
  {
    id: 'creator_speaking',
    title: 'Criador Falando',
    badge: 'Alta Conversão',
    subtext: 'ADAPTADO PARA ESSE',
    authorLogo: 'cbf',
    image: 'https://img.usecurling.com/p/400/700?q=man%20yellow%20jersey%20talking&color=yellow',
    locked: false,
  },
  {
    id: 'product_broll',
    title: 'Bastidores Produto',
    badge: 'Em breve',
    subtext: 'FLUXO LIMPO',
    authorLogo: '',
    image: 'https://img.usecurling.com/p/400/700?q=thermos%20bottle%20water%20glass&color=gray',
    locked: true,
  },
  {
    id: 'lifestyle_room',
    title: 'Estilo de Vida',
    badge: 'Em breve',
    subtext: 'VLOG PESSOAL',
    authorLogo: '',
    image: 'https://img.usecurling.com/p/400/700?q=guy%20room%20bookshelf%20bw&color=black',
    locked: true,
  },
]

export default function GuidedCreator() {
  const { brands, addPost } = useSocial()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Creation Steps: 1 (Prompt/Template), 2 (Script & Takes), 3 (Success)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const [promptText, setPromptText] = useState('')
  const [selectedDuration, setSelectedDuration] = useState<number>(15)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [attachedMedia, setAttachedMedia] = useState<File | null>(null)

  const [generating, setGenerating] = useState(false)
  const [scriptResult, setScriptResult] = useState<VideoScriptResult | null>(null)
  const [savingPost, setSavingPost] = useState(false)

  const handleGenerateScript = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || promptText
    if (!finalPrompt.trim()) {
      toast({
        title: 'Atenção',
        description: 'Digite uma descrição para o vídeo ou selecione um template.',
      })
      return
    }

    setGenerating(true)
    try {
      const activeBrand = brands[0]?.name || 'MudarCurso'
      const res = await generateVideoScript({
        prompt: finalPrompt,
        duration: selectedDuration,
        brandName: activeBrand,
      })
      setScriptResult(res as VideoScriptResult)
      setStep(2)
      toast({
        title: 'Roteiro Gerado com Sucesso! 🚀',
        description: 'Edite os takes e finalize seu post.',
      })
    } catch (err) {
      toast({
        title: 'Erro ao gerar roteiro',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveVideoDraft = async () => {
    if (!scriptResult || !brands[0]?.id || !user?.id) {
      toast({ title: 'Erro', description: 'Selecione uma marca primeiro.' })
      return
    }

    setSavingPost(true)
    try {
      const fullCaption = `${scriptResult.title}\n\n${scriptResult.caption}\n\n${scriptResult.hashtags.join(' ')}`
      await addPost({
        brandId: brands[0].id,
        platform: 'Instagram',
        content: promptText || scriptResult.title,
        caption: fullCaption,
        status: 'draft',
      })
      toast({
        title: 'Vídeo Salvo como Rascunho!',
        description: 'Você pode visualizá-lo no seu feed.',
      })
      setStep(3)
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSavingPost(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 animate-fade-in flex flex-col">
      {/* Top Header Stepper */}
      <div className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-20 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (step > 1 ? setStep((s) => (s - 1) as any) : navigate('/app/feed'))}
              className="text-xs text-muted-foreground gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </Button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <h1 className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Criador Guiado de Vídeo IA
            </h1>
          </div>

          {/* Stepper Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className={step === 1 ? 'text-primary' : ''}>• Formato</span>
            <span>—</span>
            <span className={step === 1 ? 'text-primary' : ''}>• Template</span>
            <span>—</span>
            <span>• Mídia</span>
            <span>—</span>
            <span>• Prompts</span>
            <span>—</span>
            <span className={step === 2 ? 'text-primary' : ''}>• Roteiro</span>
            <span>—</span>
            <span className={step === 2 ? 'text-primary' : ''}>• Takes</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-8 w-full flex-1 space-y-10">
        {/* STEP 1: PROMPT INPUT & TEMPLATES */}
        {step === 1 && (
          <div className="space-y-10 animate-fade-in">
            {/* Header Text */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight flex items-center justify-center gap-2">
                Como você quer criar? <MessageSquare className="w-6 h-6 text-primary" />
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Descreva o vídeo com suas palavras — a IA gera título, legendas e sugestões de
                mídia. Prefere começar de um jeito pronto? Escolha um template logo abaixo.
              </p>
            </div>

            {/* AI Prompt Card Input */}
            <Card className="p-5 border-border shadow-lg rounded-3xl bg-card relative space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary mt-1">
                  <Sparkles className="w-5 h-5" />
                </div>
                <Textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Ex: um vídeo mostrando os bastidores da produção do meu produto, com um tom leve e próximo..."
                  className="border-none shadow-none focus-visible:ring-0 text-sm sm:text-base resize-none min-h-[100px] bg-transparent p-0"
                />
              </div>

              {/* Bottom Toolbar inside Card */}
              <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Attach Media */}
                  <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full bg-muted/60">
                    <Paperclip className="w-3.5 h-3.5" />
                    {attachedMedia ? attachedMedia.name : 'Anexar mídia'}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => setAttachedMedia(e.target.files?.[0] || null)}
                    />
                  </label>

                  {/* Duration Selector */}
                  <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-full text-xs">
                    <span className="text-muted-foreground px-2 text-[11px] font-semibold">
                      Duração
                    </span>
                    {DURATIONS.map((dur) => (
                      <button
                        key={dur}
                        onClick={() => setSelectedDuration(dur)}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                          selectedDuration === dur
                            ? 'bg-background text-primary shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {dur}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Action Button */}
                <Button
                  onClick={() => handleGenerateScript()}
                  disabled={generating}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold px-6 py-2.5 rounded-full text-xs sm:text-sm gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Gerando Roteiro...
                    </>
                  ) : (
                    <>
                      Gerar roteiro com IA <Wand2 className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Divider */}
            <div className="relative text-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <span className="relative bg-slate-50 dark:bg-slate-950 px-4 text-xs font-bold text-muted-foreground tracking-wider uppercase">
                OU COMECE COM UM TEMPLATE
              </span>
            </div>

            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <span>ⓘ</span> Clique em um template para ver os detalhes antes de escolher.
            </p>

            {/* Template Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => {
                    if (tpl.locked) {
                      toast({
                        title: 'Recurso em breve!',
                        description: 'Este template estará disponível em breve.',
                      })
                      return
                    }
                    setSelectedTemplate(tpl.id)
                    handleGenerateScript(`Vídeo no estilo ${tpl.title}: ${tpl.subtext}`)
                  }}
                  className={`group relative rounded-2xl overflow-hidden border border-border aspect-[9/16] cursor-pointer transition-all duration-300 ${
                    tpl.locked
                      ? 'opacity-60 grayscale hover:opacity-80'
                      : 'hover:scale-[1.03] hover:shadow-xl ring-2 ring-transparent hover:ring-primary'
                  }`}
                >
                  <img src={tpl.image} alt={tpl.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <Badge className="bg-black/60 backdrop-blur text-white text-[10px] font-semibold border-none">
                      {tpl.badge}
                    </Badge>
                    {tpl.authorLogo && (
                      <span className="w-6 h-6 rounded-full bg-white/80 text-black text-[9px] font-black flex items-center justify-center shadow">
                        {tpl.authorLogo}
                      </span>
                    )}
                  </div>

                  {/* Locked Icon */}
                  {tpl.locked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center shadow-lg">
                        <Lock className="w-5 h-5" />
                      </div>
                    </div>
                  )}

                  {/* Bottom Captions Overlay */}
                  <div className="absolute bottom-4 left-3 right-3">
                    <span className="inline-block bg-primary text-white font-extrabold text-[10px] px-2 py-0.5 rounded tracking-wide uppercase shadow">
                      {tpl.subtext}
                    </span>
                    <p className="text-white font-bold text-xs mt-1.5 drop-shadow">{tpl.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: SCRIPT & TAKES REVIEW */}
        {step === 2 && scriptResult && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-card border border-border p-6 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/30 text-xs"
                >
                  ✨ Roteiro Gerado com IA
                </Badge>
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Duração total: {selectedDuration}s
                </span>
              </div>

              <h2 className="text-xl font-extrabold">{scriptResult.title}</h2>
              <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                {scriptResult.caption}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {scriptResult.hashtags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[11px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Takes Breakdown List */}
            <div className="space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" /> Estrutura de Takes do Vídeo
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {scriptResult.takes.map((take) => (
                  <Card key={take.take_number} className="p-4 border-border space-y-3 bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center">
                          {take.take_number}
                        </span>
                        <span className="font-bold text-sm">Take {take.take_number}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {take.duration_sec}s
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                        <span className="font-bold text-muted-foreground block uppercase text-[10px]">
                          Visual / Câmera
                        </span>
                        <p>{take.visual_description}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                        <span className="font-bold text-muted-foreground block uppercase text-[10px]">
                          Voz em Off
                        </span>
                        <p className="italic">"{take.voiceover}"</p>
                      </div>

                      <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                        <span className="font-bold text-muted-foreground block uppercase text-[10px]">
                          Texto na Tela
                        </span>
                        <p className="font-semibold text-primary">{take.text_overlay}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-full text-xs">
                Refazer Roteiro
              </Button>
              <Button
                onClick={handleSaveVideoDraft}
                disabled={savingPost}
                className="bg-primary hover:bg-primary/90 text-white font-bold px-8 rounded-full text-sm gap-2"
              >
                {savingPost ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Salvar como Rascunho
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
          <div className="text-center space-y-6 animate-fade-in py-12">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold">Vídeo Salvo com Sucesso!</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Seu roteiro e estrutura de takes foram armazenados. Acesse seu Feed de Conteúdo para
                agendar a publicação.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button onClick={() => setStep(1)} variant="outline" className="rounded-full text-xs">
                Criar Outro Vídeo
              </Button>
              <Button
                onClick={() => navigate('/app/feed')}
                className="bg-primary text-white rounded-full text-xs px-6"
              >
                Ir para o Feed
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
