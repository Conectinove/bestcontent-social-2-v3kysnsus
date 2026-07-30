import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ArrowRight, CheckCircle2, Tag, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'

const FLYER_TYPES = [
  { id: 'promocao', title: 'Promocao', desc: 'Descontos e ofertas especiais' },
  { id: 'evento', title: 'Evento', desc: 'Divulgacao de eventos e encontros' },
  { id: 'cardapio', title: 'Cardapio', desc: 'Lista de produtos e precos' },
  { id: 'outro', title: 'Outro', desc: 'Formato personalizado' },
]

const FORMATS = [
  { id: 'a4', title: 'A4', desc: '210 x 297mm', ratio: 'aspect-[2/3]' },
  { id: 'a5', title: 'A5', desc: '148 x 210mm', ratio: 'aspect-[2/3]' },
  { id: 'square', title: 'Quadrado', desc: '1080 x 1080px', ratio: 'aspect-square' },
  { id: 'story', title: 'Story', desc: '1080 x 1920px', ratio: 'aspect-[9/16]' },
]

const TAG_OPTIONS = ['Preco', 'Data', 'Contato', 'Endereco', 'WhatsApp', 'Site']

export default function FlyerCreator() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [flyerType, setFlyerType] = useState('promocao')
  const [format, setFormat] = useState('a4')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagValues, setTagValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: 'Atencao', description: 'Digite um titulo.' })
      return
    }
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast({ title: 'Flyer salvo!', description: 'Seu flyer foi salvo como rascunho.' })
      navigate('/app/feed')
    }, 800)
  }

  const selectedFormat = FORMATS.find((f) => f.id === format)
  const selectedType = FLYER_TYPES.find((t) => t.id === flyerType)

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
          <FileText className="w-5 h-5 text-primary" /> Criar Flyer
        </h1>
        <span className="text-xs text-muted-foreground ml-auto">Passo {step} de 4</span>
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-base font-bold">Tipo de Flyer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FLYER_TYPES.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setFlyerType(t.id)
                  setStep(2)
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${flyerType === t.id ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <h3 className="font-bold text-sm">{t.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-base font-bold">Formato</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FORMATS.map((f) => (
              <div
                key={f.id}
                onClick={() => {
                  setFormat(f.id)
                  setStep(3)
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all text-center ${format === f.id ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <div className={`${f.ratio} bg-muted rounded-lg mx-auto mb-2 max-w-[60px]`} />
                <h3 className="font-bold text-xs">{f.title}</h3>
                <p className="text-[10px] text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-base font-bold">Briefing</h2>
          <Card className="p-4 space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1">
                Titulo <span className="text-red-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 60))}
                placeholder="Ex: Promocao de Inverno"
                className="text-xs h-9"
              />
              <span className="text-[10px] text-muted-foreground">{title.length}/60</span>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Descricao</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                placeholder="Descreva o conteudo do flyer..."
                className="text-xs h-24"
              />
              <span className="text-[10px] text-muted-foreground">{description.length}/300</span>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-2">Tags opcionais</label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedTags.includes(tag) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            {selectedTags.map((tag) => (
              <div key={tag}>
                <label className="text-xs font-semibold block mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {tag}
                </label>
                <Input
                  value={tagValues[tag] || ''}
                  onChange={(e) => setTagValues((prev) => ({ ...prev, [tag]: e.target.value }))}
                  placeholder={`Valor para ${tag}...`}
                  className="text-xs h-9"
                />
              </div>
            ))}
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => setStep(4)} className="text-xs gap-1">
              Revisar <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-base font-bold">Revisao</h2>
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {selectedType?.title}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {selectedFormat?.title}
              </Badge>
            </div>
            <div
              className={`${selectedFormat?.ratio} bg-gradient-to-br from-primary/20 to-pink-500/20 rounded-xl flex items-center justify-center max-w-xs mx-auto`}
            >
              <div className="text-center p-4">
                <h3 className="font-bold text-sm">{title || 'Titulo do Flyer'}</h3>
                <p className="text-xs text-muted-foreground mt-2">
                  {description || 'Descricao aparecera aqui...'}
                </p>
                <div className="flex flex-wrap gap-1 justify-center mt-3">
                  {selectedTags.map(
                    (tag) =>
                      tagValues[tag] && (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}: {tagValues[tag]}
                        </Badge>
                      ),
                  )}
                </div>
              </div>
            </div>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)} className="text-xs">
              Voltar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="text-xs gap-1">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}{' '}
              Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
