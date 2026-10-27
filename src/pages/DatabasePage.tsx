import { useState, useEffect } from 'react'
import {
  Database,
  Plus,
  Download,
  RefreshCw,
  Table,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  HardDrive,
  Users,
  Briefcase,
  FileText,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import {
  getCollectionsOverview,
  exportCollectionToCSV,
  type CollectionSummary,
} from '@/services/data-management'
import { createStudent } from '@/services/students'
import { createFunnelDeal, FUNNEL_STAGES, SOURCES_OPTIONS } from '@/services/funnel'
import { createPost } from '@/services/posts'
import { useSocial } from '@/context/SocialContext'

export default function DatabasePage() {
  const { brands, selectedBrandId } = useSocial()
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [isExporting, setIsExporting] = useState<string | null>(null)

  // Modais de Inserção Manual
  const [insertModalCollection, setInsertModalCollection] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estados dos formulários de inserção manual
  // 1. Aluno
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    phone: '',
    course: 'MudarCurso: Formação Copywriter & Social Media Pro',
    cohort: 'Turma Alpha 2026',
    status: 'ativo' as const,
    progress: 0,
    notes: '',
  })

  // 2. Deal
  const [dealForm, setDealForm] = useState({
    title: '',
    company: '',
    value: 0,
    stage: 'lead_captado' as const,
    source: 'Instagram' as const,
    responsible: 'Ronaldo Barreto',
    notes: '',
  })

  // 3. Post
  const [postForm, setPostForm] = useState({
    content: '',
    caption: '',
    platform: 'instagram',
    status: 'draft' as const,
  })

  const loadCollections = async () => {
    setLoading(true)
    try {
      const data = await getCollectionsOverview()
      setCollections(data)
    } catch (err) {
      console.warn('Erro ao listar coleções:', err)
      toast({
        title: 'Erro ao carregar banco de dados',
        description: 'Não foi possível buscar as estatísticas das coleções.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCollections()
  }, [])

  // Exportação CSV
  const handleExportCSV = async (collectionName: string, label: string) => {
    setIsExporting(collectionName)
    try {
      const csvContent = await exportCollectionToCSV(collectionName)
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `midiaviva_${collectionName}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Exportação Concluída!',
        description: `Os registros de ${label} foram baixados em CSV com sucesso.`,
      })
    } catch (err) {
      console.error('Erro na exportação:', err)
      toast({
        title: 'Falha na exportação',
        description: 'Não foi possível gerar o arquivo CSV desta coleção.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(null)
    }
  }

  // Submissão da Inserção Manual
  const handleInsertManual = async () => {
    setIsSubmitting(true)
    try {
      if (insertModalCollection === 'students') {
        if (!studentForm.name.trim()) {
          toast({
            title: 'Nome obrigatório',
            description: 'Por favor, informe o nome do aluno.',
            variant: 'destructive',
          })
          setIsSubmitting(false)
          return
        }
        await createStudent(studentForm)
        toast({
          title: 'Aluno Cadastrado!',
          description: `Aluno "${studentForm.name}" adicionado com sucesso ao banco.`,
        })
        setStudentForm({
          name: '',
          email: '',
          phone: '',
          course: 'MudarCurso: Formação Copywriter & Social Media Pro',
          cohort: 'Turma Alpha 2026',
          status: 'ativo',
          progress: 0,
          notes: '',
        })
      } else if (insertModalCollection === 'funnel_deals') {
        if (!dealForm.title.trim()) {
          toast({
            title: 'Título obrigatório',
            description: 'Por favor, informe a oportunidade ou nome do negócio.',
            variant: 'destructive',
          })
          setIsSubmitting(false)
          return
        }
        await createFunnelDeal({
          ...dealForm,
          value: Number(dealForm.value) || 0,
        })
        toast({
          title: 'Oportunidade Criada!',
          description: `Negócio "${dealForm.title}" adicionado ao Funil de Vendas.`,
        })
        setDealForm({
          title: '',
          company: '',
          value: 0,
          stage: 'lead_captado',
          source: 'Instagram',
          responsible: 'Ronaldo Barreto',
          notes: '',
        })
      } else if (insertModalCollection === 'posts') {
        if (!postForm.content.trim() && !postForm.caption.trim()) {
          toast({
            title: 'Conteúdo obrigatório',
            description: 'Por favor, escreva a legenda ou ideia do post.',
            variant: 'destructive',
          })
          setIsSubmitting(false)
          return
        }
        const activeBrand = brands.find((b) => b.id === selectedBrandId) || brands[0]
        await createPost({
          content: postForm.content || postForm.caption,
          caption: postForm.caption || postForm.content,
          platform: (postForm.platform as any) || 'instagram',
          status: postForm.status,
          brandId: activeBrand?.id,
        })
        toast({
          title: 'Publicação Criada!',
          description: 'Novo post adicionado à Biblioteca com sucesso.',
        })
        setPostForm({
          content: '',
          caption: '',
          platform: 'instagram',
          status: 'draft',
        })
      }

      setInsertModalCollection(null)
      loadCollections()
    } catch (err) {
      console.error('Erro ao adicionar registro manual:', err)
      toast({
        title: 'Erro ao persistir',
        description: 'Não foi possível criar o registro na coleção selecionada.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Contagem total de registros somando todas as coleções
  const totalRecordsCount = collections.reduce((acc, c) => acc + c.count, 0)

  return (
    <div className="space-y-6 pb-16 animate-fade-in text-foreground">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              Infraestrutura & Persistência
            </span>
            <Badge className="bg-emerald-600 text-white font-black text-[9px] uppercase px-2 py-0.5 shadow-xs">
              Conectado
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <span>Banco de Dados & Coleções</span>
            <Database className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Visão consolidada das tabelas do MidiaViva no PocketBase: monitore volumes, adicione
            registros manuais com segurança e exporte relatórios em CSV.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCollections}
            disabled={loading}
            className="rounded-xl text-xs h-10 px-3.5 gap-1.5 border-border hover:border-purple-500/40 min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            <span>Atualizar Status</span>
          </Button>
        </div>
      </div>

      {/* Grid de Métricas do Banco (1 col < 400px, 3 col sm) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="p-4 rounded-2xl border-border/80 bg-gradient-to-br from-purple-500/10 via-card to-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Coleções Ativas
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-600 flex items-center justify-center">
              <Table className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{collections.length}</p>
          <p className="text-[11px] text-muted-foreground">Tabelas mapeadas e indexadas</p>
        </Card>

        <Card className="p-4 rounded-2xl border-border/80 bg-gradient-to-br from-blue-500/10 via-card to-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Registros Totais
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">
            {totalRecordsCount.toLocaleString('pt-BR')}
          </p>
          <p className="text-[11px] text-muted-foreground">Volume de dados no Skip Cloud</p>
        </Card>

        <Card className="p-4 rounded-2xl border-border/80 bg-gradient-to-br from-emerald-500/10 via-card to-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Segurança & RLS
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            100% Protegido
          </p>
          <p className="text-[11px] text-muted-foreground">Autenticação obrigatória e isolamento</p>
        </Card>
      </div>

      {/* Lista de Coleções */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-foreground">Coleções Monitoradas</h3>
            <p className="text-xs text-muted-foreground">
              Selecione uma coleção para adicionar dados ou baixar o arquivo CSV completo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <Card
              key={col.name}
              className="rounded-2xl border-border bg-card shadow-xs hover:border-purple-500/40 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {col.name === 'funnel_deals' ? (
                        <Briefcase className="w-4 h-4" />
                      ) : col.name === 'students' ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground leading-tight">
                        {col.label}
                      </h4>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        collection: {col.name}
                      </span>
                    </div>
                  </div>

                  <Badge variant="outline" className="font-mono text-xs font-bold px-2 py-0.5">
                    {col.count} itens
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                  {col.description}
                </p>

                <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Último registro:</span>
                    <span className="font-mono font-medium text-foreground">
                      {col.lastCreated
                        ? new Date(col.lastCreated).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Nenhum registro'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 overflow-hidden text-[10px]">
                    <span className="shrink-0 text-muted-foreground/70">Campos:</span>
                    <span className="truncate font-mono">{col.fieldsOverview.join(', ')}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                  {col.canInsertManual && (
                    <Button
                      size="sm"
                      onClick={() => setInsertModalCollection(col.name)}
                      className="rounded-xl text-xs h-9 flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1 min-h-[36px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Inserir</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportCSV(col.name, col.label)}
                    disabled={isExporting === col.name}
                    className="rounded-xl text-xs h-9 px-3 gap-1.5 border-border hover:border-purple-500 font-semibold min-h-[36px]"
                    title="Exportar para arquivo CSV"
                  >
                    {isExporting === col.name ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-purple-600" />
                    )}
                    <span>CSV</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal de Inserção Manual por Coleção */}
      <Dialog
        open={Boolean(insertModalCollection)}
        onOpenChange={(open) => !open && setInsertModalCollection(null)}
      >
        <DialogContent className="max-w-lg p-6 rounded-3xl bg-card border border-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-border/80">
            <DialogTitle className="text-xl font-black text-foreground">
              {insertModalCollection === 'students'
                ? 'Novo Aluno (students)'
                : insertModalCollection === 'funnel_deals'
                  ? 'Nova Oportunidade (funnel_deals)'
                  : 'Nova Publicação (posts)'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Inserção direta na coleção do banco de dados via SDK autenticado.
            </DialogDescription>
          </DialogHeader>

          {/* Form Alunos */}
          {insertModalCollection === 'students' && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">E-mail</label>
                  <Input
                    type="email"
                    placeholder="carlos@email.com"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="text-xs h-9 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">WhatsApp / Telefone</label>
                  <Input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    className="text-xs h-9 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Curso</label>
                <Input
                  type="text"
                  value={studentForm.course}
                  onChange={(e) => setStudentForm({ ...studentForm, course: e.target.value })}
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Turma</label>
                  <Input
                    type="text"
                    value={studentForm.cohort}
                    onChange={(e) => setStudentForm({ ...studentForm, cohort: e.target.value })}
                    className="text-xs h-9 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Status</label>
                  <select
                    value={studentForm.status}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, status: e.target.value as any })
                    }
                    className="w-full h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="concluido">Concluído</option>
                    <option value="em_risco">Em Risco</option>
                    <option value="pausado">Pausado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Progresso (%)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={studentForm.progress}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        progress: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="text-xs h-9 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Funnel Deals */}
          {insertModalCollection === 'funnel_deals' && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground">
                  Título da Oportunidade <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Gestão de Mídias Sociais Trimestral"
                  value={dealForm.title}
                  onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Empresa / Cliente</label>
                  <Input
                    type="text"
                    placeholder="Ex: Clínica Alpha"
                    value={dealForm.company}
                    onChange={(e) => setDealForm({ ...dealForm, company: e.target.value })}
                    className="text-xs h-9 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Valor (R$)</label>
                  <Input
                    type="number"
                    placeholder="3500"
                    value={dealForm.value || ''}
                    onChange={(e) =>
                      setDealForm({ ...dealForm, value: parseFloat(e.target.value) || 0 })
                    }
                    className="text-xs h-9 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Estágio</label>
                  <select
                    value={dealForm.stage}
                    onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value as any })}
                    className="w-full h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    {FUNNEL_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Origem</label>
                  <select
                    value={dealForm.source}
                    onChange={(e) => setDealForm({ ...dealForm, source: e.target.value as any })}
                    className="w-full h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    {SOURCES_OPTIONS.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Form Posts */}
          {insertModalCollection === 'posts' && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground">
                  Legenda / Conteúdo do Post <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  rows={4}
                  placeholder="Escreva a legenda ou roteiro deste post..."
                  value={postForm.content}
                  onChange={(e) =>
                    setPostForm({
                      ...postForm,
                      content: e.target.value,
                      caption: e.target.value,
                    })
                  }
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Rede Principal</label>
                  <select
                    value={postForm.platform}
                    onChange={(e) => setPostForm({ ...postForm, platform: e.target.value })}
                    className="w-full h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="youtube">YouTube</option>
                    <option value="substack">Substack</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Status</label>
                  <select
                    value={postForm.status}
                    onChange={(e) => setPostForm({ ...postForm, status: e.target.value as any })}
                    className="w-full h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicado</option>
                    <option value="scheduled">Agendado</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-border/80 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInsertModalCollection(null)}
              className="text-xs rounded-xl h-9"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleInsertManual}
              disabled={isSubmitting}
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 px-4 gap-1.5 min-h-[40px]"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Salvar no Banco</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
