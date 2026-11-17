import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  Bookmark,
  BookmarkPlus,
  Loader2,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import {
  createBriefingTemplate,
  deleteBriefingTemplate,
  listBriefingTemplates,
  type LabsBriefingTemplate,
} from '@/services/labs-briefings'

// =========================================================================
// Diálogo único de geração por IA do Labs (Blog, Web, Email, Post).
// Usa o agente nativo studio-agent via src/services/labs-ai.ts — a chamada
// acontece fora do diálogo (o pai passa onGenerate), aqui só mora o briefing,
// o carregando e o erro com toast em português.
// Novidade: o briefing pode ser SALVO como template reutilizável por usuário
// (coleção labs_ai_briefing_templates, migration 0131) e aplicado com 1 clique.
// =========================================================================

interface LabsAiGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  placeholder: string
  generatingLabel?: string
  /** Identifica o tipo do material — filtra os briefings salvos (ex.: 'post'). */
  kind?: string
  /** Executa a geração; deve lançar em caso de falha. */
  onGenerate: (briefing: string) => Promise<void>
}

export function LabsAiGeneratorDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  generatingLabel = 'Gerando…',
  kind,
  onGenerate,
}: LabsAiGeneratorDialogProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [briefing, setBriefing] = useState('')
  const [generating, setGenerating] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)

  // Templates salvos
  const [templates, setTemplates] = useState<LabsBriefingTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSaveRow, setShowSaveRow] = useState(false)

  const loadTemplates = useCallback(async () => {
    if (!user) return
    setLoadingTemplates(true)
    try {
      setTemplates(await listBriefingTemplates(user.id, kind))
    } finally {
      setLoadingTemplates(false)
    }
  }, [user, kind])

  useEffect(() => {
    if (open) {
      setInlineError(null)
      setShowSaveRow(false)
      setSaveName('')
      void loadTemplates()
    }
  }, [open, loadTemplates])

  const handleSaveTemplate = async () => {
    if (!user) return
    setSaving(true)
    try {
      const created = await createBriefingTemplate(user.id, saveName, briefing, kind)
      setTemplates((prev) => [created, ...prev.filter((t) => t.id !== created.id)])
      setSaveName('')
      setShowSaveRow(false)
      toast({
        title: 'Briefing salvo como template',
        description: `“${created.name}” fica disponível aqui nas próximas gerações.`,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível salvar o briefing agora.'
      toast({ title: 'Falha ao salvar briefing', description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async (tpl: LabsBriefingTemplate) => {
    try {
      await deleteBriefingTemplate(tpl.id)
      setTemplates((prev) => prev.filter((t) => t.id !== tpl.id))
    } catch (err) {
      toast({
        title: 'Falha ao excluir briefing',
        description: err instanceof Error ? err.message : 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    }
  }

  const handleGenerate = async () => {
    if (!briefing.trim()) {
      toast({
        title: 'Descreva o que você quer',
        description: 'Escreva um briefing curto antes de gerar.',
        variant: 'destructive',
      })
      return
    }
    setGenerating(true)
    setInlineError(null)
    try {
      await onGenerate(briefing.trim())
      setBriefing('')
      onOpenChange(false)
    } catch (err) {
      // Erro acionável dentro do diálogo — o toast some rápido, o texto fica
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível gerar o conteúdo agora. Tente novamente.'
      setInlineError(message)
      toast({
        title: 'Falha na geração com IA',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!generating) onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-primary" /> {title}
          </DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>
        {inlineError && (
          <div className="flex items-start gap-2 p-3 rounded-xl border border-destructive/30 bg-destructive/5">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-foreground leading-relaxed">{inlineError}</p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="labs-ai-briefing" className="text-xs font-semibold">
            Briefing
          </Label>
          <Textarea
            id="labs-ai-briefing"
            value={briefing}
            onChange={(e) => setBriefing(e.target.value)}
            rows={5}
            placeholder={placeholder}
            className="text-xs rounded-xl resize-y"
            disabled={generating}
          />
          {briefing.trim() && (
            <div>
              {showSaveRow ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Nome do template (ex.: Lançamento de curso)"
                    maxLength={120}
                    className="h-8 text-xs rounded-xl"
                    disabled={saving}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleSaveTemplate()
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveTemplate}
                    disabled={saving || !saveName.trim()}
                    className="rounded-xl text-xs font-bold gap-1 shrink-0"
                  >
                    {saving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    )}
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowSaveRow(false)}
                    disabled={saving}
                    className="rounded-xl text-xs shrink-0 px-2"
                    aria-label="Cancelar salvamento"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSaveRow(true)}
                  className="text-[11px] gap-1 text-muted-foreground hover:text-foreground rounded-xl"
                >
                  <Bookmark className="w-3 h-3" /> Salvar briefing como template
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Briefings salvos — aplicar com 1 clique */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Briefings salvos
          </p>
          {loadingTemplates ? (
            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando briefings…
            </div>
          ) : templates.length === 0 ? (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Nenhum briefing salvo ainda. Escreva um briefing e clique em “Salvar briefing como
              template” para reutilizá-lo com um clique.
            </p>
          ) : (
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-muted/30 px-2 py-1.5"
                >
                  <button
                    type="button"
                    onClick={() => setBriefing(tpl.briefing)}
                    disabled={generating}
                    className="flex-1 min-w-0 text-left group"
                    title="Aplicar este briefing"
                  >
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      <Bookmark className="w-3 h-3 inline mr-1 -mt-0.5" />
                      {tpl.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{tpl.briefing}</p>
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => void handleDeleteTemplate(tpl)}
                    disabled={generating}
                    className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Excluir template ${tpl.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={generating}
            className="rounded-xl text-xs font-bold"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            {generating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {generating ? generatingLabel : 'Gerar com IA'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LabsAiGeneratorDialog
