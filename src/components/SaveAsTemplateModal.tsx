import { useState } from 'react'
import { Bookmark, Sparkles, Loader2, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTemplate, type PostTemplate } from '@/services/post-templates'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface SaveAsTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentContent: string
  currentCaption: string
  currentPlatform: string
  onSaved?: (template: PostTemplate) => void
}

export function SaveAsTemplateModal({
  open,
  onOpenChange,
  currentContent,
  currentCaption,
  currentPlatform,
  onSaved,
}: SaveAsTemplateModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('valor')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Dê um nome ao seu modelo para encontrá-lo depois.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const templateData = {
        name: name.trim(),
        category,
        network: (currentPlatform || 'instagram').toLowerCase(),
        description: description.trim() || `Modelo personalizado para ${currentPlatform}`,
        content_structure: currentContent.trim() || currentCaption.trim(),
        prompt_base: currentCaption.trim() || currentContent.trim(),
        aspect_ratio: '4:5',
        dimensions: '1080x1350',
        is_favorite: true,
        style_settings: {
          accentColor: '#9333EA',
          ctaColor: '#BF2A95',
          bgColor: '#0F0B1E',
          textColor: '#FFFFFF',
        },
        layout_data: {
          headline: name.trim(),
          subheadline: description.trim() || 'Modelo salvo pelo criador',
          ctaText: 'SALVE E APLIQUE AGORA',
        },
      }

      const created = await createTemplate(templateData)
      toast({
        title: 'Template salvo no banco!',
        description: `O modelo "${name}" foi salvo e já pode ser reutilizado com 1 clique.`,
      })
      if (onSaved) {
        onSaved(created as unknown as PostTemplate)
      }
      onOpenChange(false)
      setName('')
      setDescription('')
    } catch (err) {
      toast({
        title: 'Erro ao salvar template',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-purple-500/20 bg-card p-4 sm:p-6 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/10 text-purple-600 flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight text-foreground">
                Salvar como Meu Template
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Guarde a estrutura e copy deste post para aplicar em publicações futuras.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name" className="text-xs font-bold text-foreground">
              Nome do Modelo *
            </Label>
            <Input
              id="tpl-name"
              placeholder="Ex.: Meu Carrossel de Lançamento"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs rounded-xl h-10"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-cat" className="text-xs font-bold text-foreground">
              Categoria
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="tpl-cat" className="text-xs rounded-xl h-10">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="carrossel">Carrossel / Passo a Passo</SelectItem>
                <SelectItem value="valor">Post de Alto Valor</SelectItem>
                <SelectItem value="prova_social">Antes & Depois / Prova Social</SelectItem>
                <SelectItem value="case">Case de Sucesso</SelectItem>
                <SelectItem value="anuncio">Anúncio / Oferta Direta</SelectItem>
                <SelectItem value="autoridade">Autoridade / Posicionamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-desc" className="text-xs font-bold text-foreground">
              Descrição ou Objetivo (opcional)
            </Label>
            <Textarea
              id="tpl-desc"
              placeholder="Explique o objetivo ou público ideal para este modelo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs rounded-xl min-h-[70px] resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-700 dark:text-purple-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-purple-600" />
            <span>
              A estrutura do texto atual ({currentContent.length + currentCaption.length}{' '}
              caracteres) e rede selecionada (<strong>{currentPlatform}</strong>) serão salvas na
              coleção{' '}
              <code className="font-mono text-[10px] bg-purple-500/15 px-1 py-0.5 rounded">
                post_templates
              </code>
              .
            </span>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 rounded-xl"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 px-4 rounded-xl gap-2 shadow-sm"
              disabled={saving || !name.trim()}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {saving ? 'Salvando...' : 'Salvar Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
