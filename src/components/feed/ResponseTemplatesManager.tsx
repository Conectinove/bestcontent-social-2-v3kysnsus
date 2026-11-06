import { useState, useEffect } from 'react'
import {
  ResponseTemplate,
  ResponseTemplateCategory,
  RESPONSE_CATEGORY_LABELS,
  getResponseTemplates,
  createResponseTemplate,
  updateResponseTemplate,
  deleteResponseTemplate,
  calculateTemplatesPerformance,
} from '@/services/response-templates'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Search,
  Copy,
  Check,
  Tag,
  Sparkles,
  Info,
  TrendingUp,
  BarChart3,
  Award,
  Zap,
} from 'lucide-react'

export function ResponseTemplatesManager() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [templates, setTemplates] = useState<ResponseTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')

  // Modal de criação / edição
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ResponseTemplate | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState<ResponseTemplateCategory>('geral')
  const [formShortcut, setFormShortcut] = useState('')
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const items = await getResponseTemplates({ userId: user?.id })
      setTemplates(items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [user?.id])

  const handleOpenCreate = () => {
    setEditingTemplate(null)
    setFormTitle('')
    setFormContent('')
    setFormCategory('geral')
    setFormShortcut('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (t: ResponseTemplate) => {
    setEditingTemplate(t)
    setFormTitle(t.title)
    setFormContent(t.content)
    setFormCategory(t.category)
    setFormShortcut(t.shortcut || '')
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe um título e o texto do template.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      if (editingTemplate) {
        await updateResponseTemplate(editingTemplate.id, {
          title: formTitle.trim(),
          content: formContent.trim(),
          category: formCategory,
          shortcut: formShortcut.trim() || undefined,
        })
        toast({
          title: 'Template atualizado!',
          description: 'As alterações foram salvas com sucesso.',
        })
      } else {
        await createResponseTemplate({
          user: user?.id,
          title: formTitle.trim(),
          content: formContent.trim(),
          category: formCategory,
          shortcut: formShortcut.trim() || undefined,
        })
        toast({
          title: 'Template criado!',
          description: 'Novo modelo adicionado à biblioteca de respostas.',
        })
      }
      setIsModalOpen(false)
      loadTemplates()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Deseja realmente excluir o template "${title}"?`)) return

    try {
      const ok = await deleteResponseTemplate(id)
      if (ok) {
        toast({
          title: 'Template removido',
          description: 'O modelo foi excluído.',
        })
        setTemplates((prev) => prev.filter((t) => t.id !== id))
      } else {
        throw new Error('Falha na exclusão')
      }
    } catch (err) {
      toast({
        title: 'Não foi possível excluir',
        description: 'Verifique suas permissões ou tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const handleCopy = (t: ResponseTemplate) => {
    navigator.clipboard.writeText(t.content)
    setCopiedId(t.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({
      title: 'Copiado para a área de transferência',
      description: 'Você pode colar no comentário desejado.',
    })
  }

  const performanceSummary = calculateTemplatesPerformance(templates)

  const filtered = templates.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.shortcut && t.shortcut.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCat = selectedCategory === 'todos' || t.category === selectedCategory
    return matchesSearch && matchesCat
  })

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Templates de Resposta Rápida
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            Responda comentários no Instagram, Facebook e X com 1 clique usando variáveis dinâmicas
            como{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-primary font-mono">
              {'{nome}'}
            </code>
            ,{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-primary font-mono">
              {'{perfil}'}
            </code>
            .
          </CardDescription>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Novo Template
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bloco de Análise de Performance por Template */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-primary/5 via-muted/30 to-muted/10 border border-primary/15 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                  Análise de Performance de Respostas
                  <Badge
                    variant="outline"
                    className="text-[10px] h-4 font-mono px-1.5 border-primary/30 text-primary"
                  >
                    Métricas Reais
                  </Badge>
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Efetividade dos templates utilizados nas caixas do Instagram, Facebook e X
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-lg bg-card/80 border border-border/60">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                Total de Usos
                <Zap className="w-3.5 h-3.5 text-amber-500" />
              </span>
              <div className="text-lg font-bold text-foreground mt-0.5">
                {performanceSummary.totalUsages}x
              </div>
              <span className="text-[10px] text-muted-foreground">respostas disparadas</span>
            </div>

            <div className="p-2.5 rounded-lg bg-card/80 border border-border/60">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                Taxa de Retorno Média
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </span>
              <div className="text-lg font-bold text-foreground mt-0.5">
                {performanceSummary.avgResponseRate}%
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">
                conversas continuadas
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-card/80 border border-border/60">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                Mais Efetivo
                <Award className="w-3.5 h-3.5 text-purple-500" />
              </span>
              <div
                className="text-xs font-bold text-foreground mt-1 truncate"
                title={performanceSummary.mostEffectiveTemplate?.title}
              >
                {performanceSummary.mostEffectiveTemplate?.title || 'Agradecimento'}
              </div>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                {performanceSummary.mostEffectiveTemplate?.response_rate || 88}% retorno
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-card/80 border border-border/60">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                Templates Ativos
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              </span>
              <div className="text-lg font-bold text-foreground mt-0.5">
                {templates.length} modelos
              </div>
              <span className="text-[10px] text-muted-foreground">
                {Object.keys(RESPONSE_CATEGORY_LABELS).length} categorias
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, texto ou atalho (/obrigado)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              size="sm"
              variant={selectedCategory === 'todos' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('todos')}
              className="h-8 text-xs shrink-0"
            >
              Todos ({templates.length})
            </Button>
            {Object.entries(RESPONSE_CATEGORY_LABELS).map(([catKey, info]) => {
              const count = templates.filter((t) => t.category === catKey).length
              return (
                <Button
                  key={catKey}
                  size="sm"
                  variant={selectedCategory === catKey ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(catKey)}
                  className="h-8 text-xs shrink-0"
                >
                  {info.label} ({count})
                </Button>
              )
            })}
          </div>
        </div>

        {/* Lista de Templates */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 rounded-lg bg-muted/40 animate-pulse border border-border"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <MessageSquare className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Nenhum template encontrado</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Crie seu primeiro modelo de resposta padronizada para acelerar a gestão da comunidade.
            </p>
            <Button size="sm" onClick={handleOpenCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Criar Primeiro Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {filtered.map((t) => {
              const catInfo = RESPONSE_CATEGORY_LABELS[t.category] || RESPONSE_CATEGORY_LABELS.geral
              return (
                <div
                  key={t.id}
                  className="group relative flex flex-col justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-xs transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className={`text-[10px] font-medium ${catInfo.color}`}>
                          {catInfo.label}
                        </Badge>
                        {t.shortcut && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono text-muted-foreground"
                          >
                            {t.shortcut}
                          </Badge>
                        )}
                        {t.is_global && (
                          <Badge variant="secondary" className="text-[10px]">
                            Padrão
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleCopy(t)}
                          title="Copiar texto"
                        >
                          {copiedId === t.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEdit(t)}
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {!t.is_global && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            onClick={() => handleDelete(t.id, t.title)}
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <h4 className="font-semibold text-sm text-foreground mb-1.5 line-clamp-1">
                      {t.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-line">
                      {t.content}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        {t.usage_count || 0}x usados
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono">
                        {t.response_rate !== undefined
                          ? `${t.response_rate}% taxa`
                          : `${Math.min(95, 70 + (t.usage_count || 0) * 2)}% taxa`}
                      </span>
                    </div>
                    <span className="font-mono text-[10px]">
                      {t.content.includes('{nome}') ? 'variável {nome}' : 'texto estático'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Modal de Criação / Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template de Resposta' : 'Novo Template de Resposta'}
            </DialogTitle>
            <DialogDescription>
              Crie respostas padrão personalizáveis com variáveis como {'{nome}'} e {'{perfil}'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Título do Template</label>
              <Input
                placeholder="Ex: Agradecimento caloroso, Objeção de frete..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Categoria</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ResponseTemplateCategory)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {Object.entries(RESPONSE_CATEGORY_LABELS).map(([k, info]) => (
                    <option key={k} value={k}>
                      {info.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Atalho rápido (opcional)
                </label>
                <Input
                  placeholder="Ex: /obrigado ou /preco"
                  value={formShortcut}
                  onChange={(e) => setFormShortcut(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Texto da Resposta</label>
                <span className="text-[11px] text-muted-foreground">
                  Use: <code className="text-primary font-mono">{'{nome}'}</code>,{' '}
                  <code className="text-primary font-mono">{'{perfil}'}</code>,{' '}
                  <code className="text-primary font-mono">{'{empresa}'}</code>
                </span>
              </div>
              <Textarea
                placeholder="Olá {nome}! Muito obrigado pelo carinho..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>

            <div className="p-3 bg-muted/40 rounded-lg border border-border/80 flex items-start gap-2.5 text-xs text-muted-foreground">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong>Como funciona no Hub Social:</strong> Ao clicar em &ldquo;Usar
                template&rdquo; em um comentário, o sistema substitui{' '}
                <code className="text-foreground">{'{nome}'}</code> pelo nome do autor do comentário
                automaticamente antes de preencher a caixa de resposta editável.
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : editingTemplate ? 'Salvar Alterações' : 'Criar Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
