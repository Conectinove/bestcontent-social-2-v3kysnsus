import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Video,
  Clock,
  Layout as LayoutIcon,
  FileText,
  Upload,
  Download,
  Sparkles,
  Save,
} from 'lucide-react'
import { useSocial } from '@/context/SocialContext'
import { useAuth } from '@/context/AuthContext'
import { createPost } from '@/services/posts'
import { generateVideoScript } from '@/services/ai'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const DURATIONS = [
  { id: 15, label: '15 segundos' },
  { id: 30, label: '30 segundos' },
  { id: 60, label: '60 segundos' },
  { id: 90, label: '90 segundos' },
]

const TEMPLATES = [
  { id: 'tutorial', title: 'Tutorial Passo a Passo', desc: 'Ensine algo de forma rápida' },
  { id: 'produto', title: 'Produto em Destaque', desc: 'Mostre seu produto em ação' },
  { id: 'storytelling', title: 'Storytelling', desc: 'Conte uma história envolvente' },
  { id: 'trend', title: 'Trend / Desafio', desc: 'Aproveite trends e desafios' },
  { id: 'bastidores', title: 'Bastidores', desc: 'Mostre os bastidores do negócio' },
  { id: 'depoimento', title: 'Depoimento', desc: 'Prova social e depoimentos' },
]

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube']

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function GuidedCreator() {
  const navigate = useNavigate()
  const { brands, refreshAll } = useSocial()
  const { user } = useAuth()

  const [step, setStep] = useState(1)
  const [prompt, setPrompt] = useState('')
  const [platform, setPlatform] = useState('TikTok')
  const [duration, setDuration] = useState(30)
  const [template, setTemplate] = useState('tutorial')
  const [script, setScript] = useState('')
  const [media, setMedia] = useState<File | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleGenerateScript = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Atenção', description: 'Escreva o tema do vídeo.' })
      return
    }
    setAiLoading(true)
    try {
      const result = await generateVideoScript({
        prompt,
        duration: Number(duration) || 30,
        objective: platform,
      })
      const scriptText =
        typeof result === 'string'
          ? result
          : (result as any)?.script || (result as any)?.content || ''
      setScript(scriptText || 'Não foi possível gerar o roteiro. Escreva manualmente.')
      toast({ title: 'Roteiro gerado!', description: 'Edite conforme necessário.' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setAiLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.id || !brands[0]?.id) {
      toast({ title: 'Atenção', description: 'Crie uma marca primeiro.' })
      navigate('/app/brands')
      return
    }
    setSaving(true)
    try {
      await createPost({
        user: user.id,
        brand: brands[0].id,
        content: prompt,
        caption: script,
        platform,
        status: 'draft',
        duration,
        script_json: JSON.stringify({ prompt, duration, template, script, platform }),
        template_id: `video_${template}`,
      })
      refreshAll()
      toast({ title: 'Vídeo salvo!', description: 'Rascunho salvo na biblioteca.' })
      navigate('/app/feed')
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadScript = () => {
    downloadFile(script || 'Roteiro vazio', `roteiro-${Date.now()}.txt`, 'text/plain;charset=utf-8')
  }

  const handleDownloadMetadata = () => {
    const metadata = {
      prompt,
      duration,
      template,
      platform,
      script,
      mediaName: media?.name || null,
      createdAt: new Date().toISOString(),
    }
    downloadFile(
      JSON.stringify(metadata, null, 2),
      `metadata-${Date.now()}.json`,
      'application/json',
    )
  }

  const handleDownloadMedia = () => {
    if (!media) return
    const url = URL.createObjectURL(media)
    const a = document.createElement('a')
    a.href = url
    a.download = media.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedTemplate = TEMPLATES.find((t) => t.id === template)

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (step > 1 ? setStep(step - 1) : navigate('/app/criar'))}
          className="text-xs gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" /> Criar Vídeo
        </h1>
        <span className="text-xs text-muted-foreground ml-auto">Etapa {step} de 6</span>
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-base font-bold">Sobre o que é o vídeo?</h2>
          <Card className="p-4 space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1">Tema / Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Como fazer um bolo de chocolate fofinho"
                className="text-sm h-24"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Plataforma</label>
              <div className="flex gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${platform === p ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!prompt.trim()} className="text-xs gap-1">
              Próximo <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Clock className="w-4 h-4" /> Duração do vídeo
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DURATIONS.map((d) => (
              <div
                key={d.id}
                onClick={() => {
                  setDuration(d.id)
                  setStep(3)
                }}
                className={`p-5 rounded-xl border cursor-pointer transition-all text-center ${duration === d.id ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <Clock className="w-5 h-5 mx-auto mb-2 text-primary" />
                <h3 className="font-bold text-sm">{d.label}</h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-base font-bold flex items-center gap-2">
            <LayoutIcon className="w-4 h-4" /> Escolha um template
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEMPLATES.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setTemplate(t.id)
                  setStep(4)
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${template === t.id ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <h3 className="font-bold text-sm">{t.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-base font-bold flex items-center gap-2">
            <FileText className="w-4 h-4" /> Roteiro
          </h2>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold">Roteiro do vídeo</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateScript}
                disabled={aiLoading}
                className="text-xs text-primary gap-1 h-7"
              >
                <Sparkles className="w-3.5 h-3.5" />{' '}
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Gerar com IA'}
              </Button>
            </div>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="O roteiro aparecerá aqui. Edite conforme necessário."
              className="text-sm h-48"
            />
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => setStep(5)} className="text-xs gap-1">
              Próximo <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Upload className="w-4 h-4" /> Mídia
          </h2>
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-muted/20">
            {media ? (
              <div className="space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                <p className="text-xs text-muted-foreground">{media.name}</p>
              </div>
            ) : (
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {media ? media.name : 'Clique para selecionar'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-xs"
              onClick={() => document.getElementById('video-media-input')?.click()}
            >
              Selecionar arquivo
            </Button>
            <input
              id="video-media-input"
              type="file"
              accept="video/*,image/*"
              className="hidden"
              onChange={(e) => setMedia(e.target.files?.[0] || null)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(6)} className="text-xs gap-1">
              Renderizar <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Renderização
          </h2>
          <Card className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {platform}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {duration}s
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {selectedTemplate?.title}
              </Badge>
              {media && (
                <Badge variant="secondary" className="text-xs">
                  {media.name}
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase">Roteiro</h3>
              <p className="text-xs text-foreground whitespace-pre-line bg-muted/30 rounded-lg p-3 max-h-40 overflow-y-auto">
                {script || 'Sem roteiro'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadScript}
                className="text-xs gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Script (.txt)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadMedia}
                disabled={!media}
                className="text-xs gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Mídia
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadMetadata}
                className="text-xs gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Metadata (.json)
              </Button>
            </div>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(5)} className="text-xs">
              Voltar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="text-xs gap-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{' '}
              Salvar na Biblioteca
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
