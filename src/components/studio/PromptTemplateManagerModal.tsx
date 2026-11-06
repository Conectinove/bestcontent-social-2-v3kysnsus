import React, { useState } from 'react'
import {
  FileCode,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  Star,
  Play,
  HelpCircle,
} from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  StudioPromptTemplate,
  extractPlaceholders,
  fillPromptTemplate,
  createStudioPromptTemplate,
  updateStudioPromptTemplate,
  deleteStudioPromptTemplate,
  incrementTemplateUsage,
} from '@/services/studio-prompt-templates'
import { StudioMediaType } from '@/services/ai-studio'

interface PromptTemplateManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentType: StudioMediaType
  userId: string
  templates: StudioPromptTemplate[]
  onSelectAndApply: (filledPrompt: string, defaultModelId?: string) => void
  onRefreshTemplates: () => void
}

export const PromptTemplateManagerModal: React.FC<PromptTemplateManagerModalProps> = ({
  open,
  onOpenChange,
  currentType,
  userId,
  templates,
  onSelectAndApply,
  onRefreshTemplates,
}) => {
  const { toast } = useToast()

  // Estado da aba interna: 'list' | 'create' | 'fill'
  const [view, setView] = useState<'list' | 'create' | 'fill'>('list')
  const [editingTemplate, setEditingTemplate] = useState<StudioPromptTemplate | null>(null)
  const [selectedTemplateForFill, setSelectedTemplateForFill] =
    useState<StudioPromptTemplate | null>(null)

  // Formulário de Criação/Edição
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formCategory, setFormCategory] = useState<'video' | 'image' | 'audio' | 'geral'>(
    currentType === '3d' ? 'geral' : currentType,
  )
  const [formText, setFormText] = useState('')
  const [formIsFavorite, setFormIsFavorite] = useState(false)
  const [saving, setSaving] = useState(false)

  // Valores dos placeholders para preenchimento rápido
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({})

  const detectedPlaceholders = extractPlaceholders(formText)

  const handleOpenCreate = () => {
    setEditingTemplate(null)
    setFormName('')
    setFormDesc('')
    setFormCategory(currentType === '3d' ? 'geral' : currentType)
    setFormText(
      currentType === 'video'
        ? 'Câmera dinâmica revelando {produto} com iluminação volumétrica e gancho visual em {tema}. Tom {tom}.'
        : currentType === 'image'
          ? 'Arte de alto contraste destacando {produto}, atmosfera moderna com paleta {tom} sobre {tema}.'
          : 'Locução comercial em tom {tom} para {produto}: "Você sabia que dominar {tema} pode alavancar seus resultados hoje mesmo?"',
    )
    setFormIsFavorite(false)
    setView('create')
  }

  const handleOpenEdit = (tmpl: StudioPromptTemplate) => {
    setEditingTemplate(tmpl)
    setFormName(tmpl.name)
    setFormDesc(tmpl.description || '')
    setFormCategory(tmpl.category)
    setFormText(tmpl.template_text)
    setFormIsFavorite(Boolean(tmpl.is_favorite))
    setView('create')
  }

  const handleSaveTemplate = async () => {
    if (!formName.trim() || !formText.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe pelo menos o nome e o texto do modelo de prompt.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      if (editingTemplate && !editingTemplate.id.startsWith('default-')) {
        await updateStudioPromptTemplate(editingTemplate.id, {
          name: formName,
          description: formDesc,
          category: formCategory,
          template_text: formText,
          is_favorite: formIsFavorite,
        })
        toast({ title: 'Modelo atualizado com sucesso!' })
      } else {
        await createStudioPromptTemplate({
          userId,
          name: formName,
          description: formDesc,
          category: formCategory,
          template_text: formText,
          is_favorite: formIsFavorite,
        })
        toast({ title: 'Novo modelo salvo com sucesso!' })
      }
      onRefreshTemplates()
      setView('list')
    } catch {
      toast({
        title: 'Erro ao salvar modelo',
        description: 'Verifique a conexão e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (tmpl: StudioPromptTemplate) => {
    if (tmpl.id.startsWith('default-')) {
      toast({
        title: 'Modelo padrão protegido',
        description: 'Você pode criar seus próprios modelos personalizados.',
      })
      return
    }
    if (!window.confirm(`Deseja excluir o modelo "${tmpl.name}"?`)) return

    try {
      await deleteStudioPromptTemplate(tmpl.id)
      toast({ title: 'Modelo excluído.' })
      onRefreshTemplates()
    } catch {
      toast({
        title: 'Erro ao excluir',
        variant: 'destructive',
      })
    }
  }

  const handleStartFill = (tmpl: StudioPromptTemplate) => {
    setSelectedTemplateForFill(tmpl)
    const phs = tmpl.placeholders || extractPlaceholders(tmpl.template_text)
    const initial: Record<string, string> = {}
    phs.forEach((p) => {
      initial[p] = ''
    })
    setPlaceholderValues(initial)

    // Se não tiver nenhum placeholder, aplica direto
    if (phs.length === 0) {
      handleConfirmApply(tmpl, {})
      return
    }

    setView('fill')
  }

  const handleConfirmApply = (tmpl: StudioPromptTemplate, values: Record<string, string>) => {
    const filled = fillPromptTemplate(tmpl.template_text, values)
    incrementTemplateUsage(tmpl.id, tmpl.usage_count)
    onSelectAndApply(filled, tmpl.default_model_id)
    toast({
      title: 'Prompt aplicado no estúdio!',
      description: `Modelo "${tmpl.name}" carregado com sucesso.`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black font-archivo tracking-tight">
                  Modelos de Prompt Personalizáveis
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Crie, edite e reutilize roteiros padronizados com variáveis como {'{produto}'},{' '}
                  {'{tema}'} e {'{tom}'}.
                </DialogDescription>
              </div>
            </div>

            {view === 'list' && (
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Modelo
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* ================= VISTA 1: LISTAGEM ================= */}
        {view === 'list' && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
              <span>
                Exibindo modelos para:{' '}
                <strong className="text-foreground capitalize">{currentType}</strong> e Gerais
              </span>
              <span className="text-[11px]">{templates.length} modelos disponíveis</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {templates.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed border-border p-6 space-y-3">
                  <FileCode className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm font-semibold text-foreground">
                    Nenhum modelo cadastrado ainda
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Crie o seu primeiro template para agilizar seus prompts do estúdio.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleOpenCreate}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                  >
                    Criar Meu Primeiro Modelo
                  </Button>
                </div>
              ) : (
                templates.map((tmpl) => {
                  const phs = tmpl.placeholders || extractPlaceholders(tmpl.template_text)
                  const isCurrentTab = tmpl.category === currentType || tmpl.category === 'geral'

                  return (
                    <div
                      key={tmpl.id}
                      className={`rounded-xl border p-3 transition-all text-xs space-y-2.5 ${
                        isCurrentTab
                          ? 'border-border/80 bg-card hover:border-purple-500/40 hover:shadow-md'
                          : 'border-border/40 bg-muted/20 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-foreground text-sm">{tmpl.name}</span>
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase font-mono py-0"
                            >
                              {tmpl.category}
                            </Badge>
                            {tmpl.is_favorite && (
                              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] py-0 gap-1">
                                <Star className="w-2.5 h-2.5 fill-amber-400" />
                                Favorito
                              </Badge>
                            )}
                          </div>
                          {tmpl.description && (
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              {tmpl.description}
                            </p>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(tmpl)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Editar template"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          {!tmpl.id.startsWith('default-') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(tmpl)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleStartFill(tmpl)}
                            className="h-7 px-2.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white gap-1 ml-1"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            Usar
                          </Button>
                        </div>
                      </div>

                      {/* Preview do texto */}
                      <div className="p-2 rounded-lg bg-muted/40 font-mono text-[11px] text-foreground/90 border border-border/50 line-clamp-2">
                        {tmpl.template_text}
                      </div>

                      {/* Tags de Placeholders */}
                      {phs.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            Variáveis dinâmicas:
                          </span>
                          {phs.map((p, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-mono"
                            >
                              {`{${p}}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ================= VISTA 2: FORMULÁRIO DE CRIAÇÃO / EDIÇÃO ================= */}
        {view === 'create' && (
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nome do Modelo</Label>
              <Input
                placeholder="Ex: Anúncio de Alta Conversão B2B"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Categoria / Aba</Label>
                <select
                  value={formCategory}
                  onChange={(e: any) => setFormCategory(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background"
                >
                  <option value="video">Vídeo</option>
                  <option value="image">Imagem</option>
                  <option value="audio">Áudio</option>
                  <option value="geral">Geral (Todas as abas)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Descrição Rápida (Opcional)</Label>
                <Input
                  placeholder="Ex: Focado em gancho nos primeiros 3s"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Estrutura do Prompt (com variáveis entre chaves)
                </Label>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-purple-400" />
                  Use {'{produto}'}, {'{tema}'}, {'{tom}'}
                </span>
              </div>

              <Textarea
                rows={5}
                placeholder="Ex: Close-up cinematográfico de {produto} com fundo {tom}, ressaltando benefícios de {tema}."
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                className="text-xs font-mono"
              />

              {detectedPlaceholders.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {detectedPlaceholders.length} variáveis identificadas:
                  </span>
                  {detectedPlaceholders.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono font-bold"
                    >
                      {`{${p}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isFav"
                checked={formIsFavorite}
                onChange={(e) => setFormIsFavorite(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="isFav" className="text-xs text-foreground cursor-pointer font-medium">
                Fixar este modelo como Favorito no topo da lista
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setView('list')}
                className="text-xs"
              >
                Voltar à Lista
              </Button>
              <Button
                size="sm"
                onClick={handleSaveTemplate}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {saving ? 'Salvando...' : editingTemplate ? 'Atualizar Modelo' : 'Salvar Modelo'}
              </Button>
            </div>
          </div>
        )}

        {/* ================= VISTA 3: PREENCHIMENTO RÁPIDO DOS PLACEHOLDERS ================= */}
        {view === 'fill' && selectedTemplateForFill && (
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1">
              <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Preencher: {selectedTemplateForFill.name}
              </span>
              <p className="text-xs text-muted-foreground">
                Informe os valores rápidos abaixo para substituir as variáveis no prompt original.
              </p>
            </div>

            <div className="space-y-3">
              {(
                selectedTemplateForFill.placeholders ||
                extractPlaceholders(selectedTemplateForFill.template_text)
              ).map((ph) => (
                <div key={ph} className="space-y-1">
                  <Label className="text-xs font-semibold capitalize text-foreground">
                    Valor para <span className="font-mono text-purple-400">{`{${ph}}`}</span>:
                  </Label>
                  <Input
                    placeholder={
                      ph === 'produto'
                        ? 'Ex: Mentoria Digital Pro'
                        : ph === 'tema'
                          ? 'Ex: escala de vendas'
                          : ph === 'tom'
                            ? 'Ex: entusiasmado e confiante'
                            : ph === 'ritmo'
                              ? 'Ex: dinâmico e acelerado'
                              : ph === 'problema'
                                ? 'Ex: falta de clientes'
                                : `Ex: valor para ${ph}`
                    }
                    value={placeholderValues[ph] || ''}
                    onChange={(e) =>
                      setPlaceholderValues((prev) => ({ ...prev, [ph]: e.target.value }))
                    }
                    className="text-xs"
                  />
                </div>
              ))}
            </div>

            {/* Prévia dinâmica do prompt resultante */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground">
                Prévia do Prompt Gerado:
              </Label>
              <div className="p-2.5 rounded-lg bg-muted/60 text-xs font-mono text-foreground leading-relaxed border border-border">
                {fillPromptTemplate(selectedTemplateForFill.template_text, placeholderValues)}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setView('list')}
                className="text-xs"
              >
                Voltar à Lista
              </Button>
              <Button
                size="sm"
                onClick={() => handleConfirmApply(selectedTemplateForFill, placeholderValues)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Aplicar no Estúdio
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
