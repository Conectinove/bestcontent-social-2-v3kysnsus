import { useState, useEffect, useMemo } from 'react'
import {
  GraduationCap,
  Users,
  UserCheck,
  UserPlus,
  Trophy,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  BookOpen,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Layers,
  X,
  CheckCircle2,
  Phone,
  Mail,
  Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  calculateStudentMetrics,
  getStudentAutomations,
  type StudentRecord,
  type StudentFormData,
  type StudentStatus,
  type StudentAutomationRecord,
} from '@/services/students'
import { StudentAutomationsPanel } from '@/components/students/StudentAutomationsPanel'

const STATUS_CONFIG: Record<
  StudentStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  ativo: {
    label: 'Ativo',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    dotClass: 'bg-emerald-500',
  },
  concluido: {
    label: 'Concluído',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20',
    dotClass: 'bg-purple-500',
  },
  em_risco: {
    label: 'Em Risco',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    dotClass: 'bg-rose-500',
  },
  pausado: {
    label: 'Pausado',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    dotClass: 'bg-amber-500',
  },
  cancelado: {
    label: 'Cancelado',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    dotClass: 'bg-muted-foreground',
  },
}

export default function StudentsPage() {
  const { toast } = useToast()
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [automations, setAutomations] = useState<StudentAutomationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedCourse, setSelectedCourse] = useState<string>('all')

  // Modal de Criar / Editar
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    email: '',
    phone: '',
    course: 'MudarCurso: Formação Copywriter & Social Media Pro',
    cohort: 'Turma Alpha 2026',
    status: 'ativo',
    progress: 0,
    notes: '',
  })

  // Modal de confirmação de exclusão
  const [studentToDelete, setStudentToDelete] = useState<StudentRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [studentsData, autoData] = await Promise.all([getStudents(), getStudentAutomations()])
      setStudents(studentsData)
      setAutomations(autoData)
    } catch (err) {
      console.warn('Erro ao carregar alunos e automações:', err)
    } finally {
      setLoading(false)
    }
  }

  const reloadAutomations = async () => {
    try {
      const autoData = await getStudentAutomations()
      setAutomations(autoData)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Métricas
  const metrics = useMemo(() => calculateStudentMetrics(students), [students])

  // Cursos únicos para filtro e distribuição
  const uniqueCourses = useMemo(() => {
    const map = new Map<string, number>()
    students.forEach((s) => {
      const c = s.course || 'Sem Curso'
      map.set(c, (map.get(c) || 0) + 1)
    })
    return Array.from(map.entries()).map(([course, count]) => ({
      course,
      count,
      pct: students.length > 0 ? Math.round((count / students.length) * 100) : 0,
    }))
  }, [students])

  // Filtro de lista
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedStatus !== 'all' && s.status !== selectedStatus) return false
      if (selectedCourse !== 'all' && s.course !== selectedCourse) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = s.name.toLowerCase().includes(q)
        const matchEmail = (s.email || '').toLowerCase().includes(q)
        const matchCourse = (s.course || '').toLowerCase().includes(q)
        const matchCohort = (s.cohort || '').toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchCourse && !matchCohort) return false
      }
      return true
    })
  }, [students, selectedStatus, selectedCourse, search])

  // Handlers do Modal
  const handleOpenCreate = () => {
    setEditingStudent(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      course: 'MudarCurso: Formação Copywriter & Social Media Pro',
      cohort: 'Turma Alpha 2026',
      status: 'ativo',
      progress: 10,
      notes: '',
      enrollment_date: new Date().toISOString().split('T')[0],
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (st: StudentRecord) => {
    setEditingStudent(st)
    setFormData({
      name: st.name,
      email: st.email || '',
      phone: st.phone || '',
      course: st.course,
      cohort: st.cohort || '',
      status: st.status,
      progress: st.progress || 0,
      notes: st.notes || '',
      enrollment_date: st.enrollment_date ? st.enrollment_date.split('T')[0] : '',
    })
    setModalOpen(true)
  }

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.course.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe o nome do aluno e o curso correspondente.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, formData)
        toast({
          title: 'Aluno atualizado!',
          description: `Os dados de ${formData.name} foram salvos com sucesso.`,
        })
      } else {
        await createStudent(formData)
        toast({
          title: 'Aluno matriculado!',
          description: `${formData.name} foi adicionado à turma com sucesso.`,
        })
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      toast({
        title: 'Erro ao salvar aluno',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return
    setDeleting(true)
    try {
      await deleteStudent(studentToDelete.id)
      toast({
        title: 'Matrícula removida',
        description: `O registro de ${studentToDelete.name} foi excluído.`,
      })
      setStudentToDelete(null)
      loadData()
    } catch {
      toast({
        title: 'Falha ao excluir aluno',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Banner de Cabeçalho do Dashboard de Alunos */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-purple-600/10 text-purple-700 dark:text-purple-300 border-purple-500/20 text-[10px] font-bold uppercase tracking-wider">
              ✦ Novo Módulo
            </Badge>
            <span className="text-[10px] text-muted-foreground font-mono">
              MudarCurso & Educadores · Gestão de Matrículas e Engajamento
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <span>Alunos Matriculados</span>
            <GraduationCap className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Acompanhe a retenção, conclusão, saúde das turmas e gerencie as matrículas ativas dos
            seus cursos e mentorias.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <Button
            onClick={handleOpenCreate}
            className="rounded-xl text-xs h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs gap-1.5 flex-1 sm:flex-initial justify-center"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Matricular Aluno</span>
          </Button>
        </div>
      </div>

      {/* Painel de Automações para Alunos (Regras Persistidas no Banco) */}
      <StudentAutomationsPanel
        automations={automations}
        students={students}
        completionRate={metrics.completionRate}
        onRefreshAutomations={reloadAutomations}
        onRefreshStudents={loadData}
      />

      {/* Grid de 4 KPIs Principais (1 coluna no mobile 360px, 2 colunas sm, 4 colunas lg) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 rounded-2xl border-border/80 bg-gradient-to-br from-purple-500/10 via-card to-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Total Matriculados
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{metrics.total}</p>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Base total ativa</span>
            <span className="text-purple-600 font-semibold">{uniqueCourses.length} cursos</span>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-border/80 bg-gradient-to-br from-emerald-500/10 via-card to-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Ativos nos Últimos 30d
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{metrics.active30d}</p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>
              {metrics.total > 0
                ? `${Math.round((metrics.active30d / metrics.total) * 100)}% de taxa de presença`
                : '0% de presença'}
            </span>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-border/80 bg-gradient-to-br from-blue-500/10 via-card to-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Novos no Período
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{metrics.newInPeriod}</p>
          <div className="text-[11px] text-muted-foreground truncate">
            <span>Novas entradas nos últimos 30 dias</span>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-border/80 bg-gradient-to-br from-amber-500/10 via-card to-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Taxa de Conclusão
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{metrics.completionRate}%</p>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{metrics.completedCount} graduados</span>
            <span className="text-rose-500 font-semibold">{metrics.atRiskCount} em risco</span>
          </div>
        </Card>
      </div>

      {/* Gráfico de Evolução e Distribuição por Curso */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Gráfico de barras de evolução temporal de matrículas */}
        <Card className="lg:col-span-7 p-5 sm:p-6 rounded-3xl border border-border/80 bg-card space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div>
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                Evolução Semanal de Matrículas (Últimos 2 Meses)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ritmo de novas inscrições e conclusões por semana letiva
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              Média +4.2 alunos/semana
            </Badge>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'Sem 1 (Dez)', novos: 2, concluidos: 1, max: 8 },
              { label: 'Sem 2 (Dez)', novos: 4, concluidos: 2, max: 8 },
              { label: 'Sem 3 (Jan)', novos: 7, concluidos: 3, max: 8 },
              { label: 'Sem 4 (Jan)', novos: 8, concluidos: 4, max: 8 },
              { label: 'Sem 5 (Fev)', novos: 6, concluidos: 3, max: 8 },
              { label: 'Sem 6 (Atual)', novos: 5, concluidos: 2, max: 8 },
            ].map((bar, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground">{bar.label}</span>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">
                      +{bar.novos} novos
                    </span>
                    <span className="text-muted-foreground">&middot;</span>
                    <span className="text-emerald-600 font-medium">
                      {bar.concluidos} concluídos
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden flex gap-1 p-0.5">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all"
                    style={{ width: `${(bar.novos / bar.max) * 70}%` }}
                  />
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${(bar.concluidos / bar.max) * 30}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/60">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Novos Matriculados
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Conclusões
              </span>
            </div>
            <span className="font-semibold text-purple-600">
              Progresso Geral Médio: {metrics.avgProgress}%
            </span>
          </div>
        </Card>

        {/* Distribuição por Turma / Curso */}
        <Card className="lg:col-span-5 p-5 sm:p-6 rounded-3xl border border-border/80 bg-card space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div>
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-pink-600" />
                Distribuição por Curso
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Proporção de matrículas em cada oferta
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {uniqueCourses.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-muted/30 border border-border/60 space-y-2 hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-foreground line-clamp-1">{item.course}</p>
                  <span className="text-xs font-mono font-bold text-purple-600 shrink-0">
                    {item.count} alunos ({item.pct}%)
                  </span>
                </div>
                <div className="w-full bg-border/60 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all bg-gradient-to-r from-purple-600 to-pink-500"
                    style={{ width: `${Math.max(10, item.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-xs text-muted-foreground space-y-1">
            <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Dica de Retenção MudarCurso:
            </span>
            <p className="text-[11px] leading-relaxed">
              Alunos com progresso inferior a 30% nos primeiros 14 dias possuem 3x mais risco de
              evasão. Dispare conteúdos de boas-vindas com o Assistente de IA.
            </p>
          </div>
        </Card>
      </div>

      {/* Tabela de Alunos com Busca e Filtros */}
      <Card className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Lista de Alunos Matriculados
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Filtre por status, pesquise por nome ou curso e atualize o progresso em tempo real
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {filteredStudents.length} de {students.length} listados
          </span>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail, curso ou turma..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl border-border bg-muted/40 focus:bg-card"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              aria-label="Filtrar por Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs font-semibold bg-muted/60 border border-border rounded-xl px-3 h-9 focus:border-purple-500"
            >
              <option value="all">Todos os Status</option>
              <option value="ativo">Ativos</option>
              <option value="concluido">Concluídos</option>
              <option value="em_risco">Em Risco</option>
              <option value="pausado">Pausados</option>
              <option value="cancelado">Cancelados</option>
            </select>

            <select
              aria-label="Filtrar por Curso"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="text-xs font-semibold bg-muted/60 border border-border rounded-xl px-3 h-9 focus:border-purple-500 max-w-[200px]"
            >
              <option value="all">Todos os Cursos</option>
              {uniqueCourses.map((c, i) => (
                <option key={i} value={c.course}>
                  {c.course}
                </option>
              ))}
            </select>

            {(search || selectedStatus !== 'all' || selectedCourse !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setSelectedStatus('all')
                  setSelectedCourse('all')
                }}
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Tabela de alunos */}
        <div className="overflow-x-auto rounded-2xl border border-border/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Aluno</th>
                <th className="py-3 px-4">Curso / Turma</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Progresso</th>
                <th className="py-3 px-4">Data Matrícula</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading &&
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-32 bg-muted rounded" />
                        <div className="h-2.5 w-44 bg-muted/60 rounded" />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-3.5 w-28 bg-muted rounded mb-1" />
                      <div className="h-2.5 w-16 bg-muted/60 rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-5 w-20 bg-muted rounded-full" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-2 w-full bg-muted rounded" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-3 w-16 bg-muted rounded" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-7 w-14 bg-muted rounded ml-auto" />
                    </td>
                  </tr>
                ))}
              {!loading && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="font-semibold text-foreground text-xs">
                        Nenhum aluno encontrado
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {search || selectedCourse !== 'all' || selectedStatus !== 'all'
                          ? 'Tente ajustar seus termos de busca ou filtros.'
                          : 'Você ainda não cadastrou alunos. Comece matriculando o primeiro agora mesmo.'}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (search || selectedCourse !== 'all' || selectedStatus !== 'all') {
                            setSearch('')
                            setSelectedCourse('all')
                            setSelectedStatus('all')
                          } else {
                            handleOpenCreate()
                          }
                        }}
                        className="rounded-xl text-xs h-8 mt-2 bg-purple-600 hover:bg-purple-700 text-white min-h-[36px]"
                      >
                        {search || selectedCourse !== 'all' || selectedStatus !== 'all'
                          ? 'Limpar Filtros'
                          : 'Matricular Novo Aluno'}
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
              {!loading &&
                filteredStudents.map((st) => {
                  const cfg = STATUS_CONFIG[st.status] || STATUS_CONFIG.ativo
                  return (
                    <tr
                      key={st.id}
                      className="hover:bg-muted/30 transition-colors group cursor-default"
                    >
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground text-xs">{st.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {st.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-muted-foreground" /> {st.email}
                              </span>
                            )}
                            {st.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-muted-foreground" /> {st.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[240px]">
                        <p className="font-semibold text-foreground truncate">{st.course}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {st.cohort || 'Turma Padrão'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit ${cfg.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
                          {cfg.label}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 min-w-[120px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-foreground">{st.progress}%</span>
                            <span className="text-muted-foreground">concluído</span>
                          </div>
                          <div className="w-full bg-border/60 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-purple-600 transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, st.progress))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                        {st.enrollment_date
                          ? new Date(st.enrollment_date).toLocaleDateString('pt-BR')
                          : new Date(st.created).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(st)}
                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-purple-600"
                            title="Editar Aluno"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setStudentToDelete(st)}
                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-rose-600"
                            title="Remover Matrícula"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Criar / Editar Aluno */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              <span>{editingStudent ? 'Editar Aluno' : 'Nova Matrícula de Aluno'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingStudent
                ? 'Atualize o progresso, dados cadastrais e status do aluno.'
                : 'Cadastre o novo aluno no curso e acompanhe suas métricas no painel.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveStudent} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Nome Completo do Aluno <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Ex: Beatriz Vasconcelos Ramos"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-xs h-9 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">E-mail</label>
                <Input
                  type="email"
                  placeholder="aluno@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  WhatsApp / Telefone
                </label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="text-xs h-9 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Curso / Programa <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Ex: MudarCurso: Formação Copywriter & Social Media Pro"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="text-xs h-9 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Turma / Cohort</label>
                <Input
                  placeholder="Ex: Turma Alpha 2026"
                  value={formData.cohort}
                  onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Status</label>
                <select
                  aria-label="Status do Aluno"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as StudentStatus })
                  }
                  className="w-full text-xs font-semibold bg-muted/60 border border-border rounded-xl px-3 h-9 focus:border-purple-500"
                >
                  <option value="ativo">Ativo</option>
                  <option value="concluido">Concluído</option>
                  <option value="em_risco">Em Risco</option>
                  <option value="pausado">Pausado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground block">
                    Progresso do Curso
                  </label>
                  <span className="text-xs font-mono font-bold text-purple-600">
                    {formData.progress}%
                  </span>
                </div>
                <input
                  aria-label="Progresso do Curso"
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) =>
                    setFormData({ ...formData, progress: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full accent-purple-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Data de Matrícula</label>
                <Input
                  type="date"
                  value={formData.enrollment_date}
                  onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                  className="text-xs h-9 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">Notas / Observações</label>
              <Input
                placeholder="Ex: Aluno focado em tráfego para infoprodutos..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="text-xs h-9 rounded-xl"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="text-xs rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                )}
                <span>{editingStudent ? 'Salvar Alterações' : 'Confirmar Matrícula'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog
        open={Boolean(studentToDelete)}
        onOpenChange={(open) => !open && setStudentToDelete(null)}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span>Remover Matrícula?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tem certeza que deseja excluir o cadastro do aluno{' '}
              <strong className="text-foreground">{studentToDelete?.name}</strong>? Essa ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStudentToDelete(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deleting}
              onClick={handleDeleteStudent}
              className="text-xs rounded-xl"
            >
              {deleting ? 'Excluindo...' : 'Sim, Remover Aluno'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
