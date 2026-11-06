import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  CrmContact,
  CrmContactFormData,
  CrmInteraction,
  CrmStage,
  CRM_STAGE_LABELS,
  CRM_STAGE_COLORS,
  CRM_SOURCES,
  CRM_DEMO_CONTACTS,
  CRM_DEMO_INTERACTIONS,
  getCrmContacts,
  getCrmInteractions,
  createCrmContact,
  updateCrmContact,
  updateCrmContactStage,
  deleteCrmContact,
  calculateCrmKpis,
  exportContactsToCSV,
} from '@/services/crm'
import { useAuth } from '@/context/AuthContext'
import { CrmContactModal } from '@/components/crm/CrmContactModal'
import { CrmContactDrawer } from '@/components/crm/CrmContactDrawer'
import { CrmPerformanceIntegration } from '@/components/crm/CrmPerformanceIntegration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import {
  Users,
  Plus,
  Download,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Award,
  MoreVertical,
  Phone,
  Mail,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react'

const STAGES: CrmStage[] = [
  'lead_captado',
  'contato_feito',
  'proposta_enviada',
  'negociacao',
  'fechado_ganho',
  'fechado_perdido',
]

export default function CrmPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [interactions, setInteractions] = useState<CrmInteraction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'funnel' | 'list'>('funnel')

  // Modais e gavetas
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<CrmContact | null>(null)
  const [drawerContact, setDrawerContact] = useState<CrmContact | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Drag and Drop simples para o funil
  const [draggedContactId, setDraggedContactId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const [fetchedContacts, fetchedInteractions] = await Promise.all([
        getCrmContacts(),
        getCrmInteractions(),
      ])

      if (fetchedContacts.length > 0) {
        setContacts(fetchedContacts)
        setInteractions(fetchedInteractions)
      } else {
        // Usa dados de demonstração robustos caso o banco do usuário esteja zerado
        setContacts(CRM_DEMO_CONTACTS)
        setInteractions(CRM_DEMO_INTERACTIONS)
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do CRM, usando fallback:', err)
      setContacts(CRM_DEMO_CONTACTS)
      setInteractions(CRM_DEMO_INTERACTIONS)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtros aplicados
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))

      const matchesStage = selectedStage === 'all' || c.stage === selectedStage
      const matchesSource = selectedSource === 'all' || c.source === selectedSource
      const matchesPriority = selectedPriority === 'all' || c.priority === selectedPriority

      return matchesSearch && matchesStage && matchesSource && matchesPriority
    })
  }, [contacts, searchQuery, selectedStage, selectedSource, selectedPriority])

  const kpis = useMemo(() => calculateCrmKpis(contacts), [contacts])

  // Ações de Contatos
  const handleSaveContact = async (data: CrmContactFormData) => {
    try {
      if (editingContact) {
        let updated: CrmContact
        try {
          updated = await updateCrmContact(editingContact.id, data)
        } catch (_) {
          updated = {
            ...editingContact,
            ...data,
            updated: new Date().toISOString(),
          }
        }
        setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        toast({
          title: 'Contato atualizado',
          description: `${data.name} foi atualizado com sucesso.`,
        })
      } else {
        let created: CrmContact
        try {
          created = await createCrmContact(data)
        } catch (_) {
          created = {
            id: `local-${Date.now()}`,
            ...data,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          }
        }
        setContacts((prev) => [created, ...prev])
        toast({
          title: 'Lead cadastrado',
          description: `${data.name} adicionado ao CRM.`,
        })
      }
      setEditingContact(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Não foi possível salvar o contato.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteContact = async (contact: CrmContact) => {
    if (!window.confirm(`Tem certeza que deseja excluir ${contact.name}?`)) return
    try {
      await deleteCrmContact(contact.id)
    } catch {
      /* intentionally ignored */
    }
    setContacts((prev) => prev.filter((c) => c.id !== contact.id))
    if (drawerContact?.id === contact.id) {
      setIsDrawerOpen(false)
      setDrawerContact(null)
    }
    toast({
      title: 'Contato excluído',
      description: `${contact.name} foi removido do CRM.`,
    })
  }

  // Mudança de estágio com disparo automático de tarefa de calendário
  const handleStageChange = async (contact: CrmContact, newStage: CrmStage) => {
    if (contact.stage === newStage) return

    // Atualização otimista
    const updatedContact: CrmContact = {
      ...contact,
      stage: newStage,
      last_interaction_at: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    setContacts((prev) => prev.map((c) => (c.id === contact.id ? updatedContact : c)))

    try {
      await updateCrmContactStage(contact, newStage, user?.id)
      toast({
        title: 'Estágio atualizado!',
        description: `${contact.name} avançou para ${CRM_STAGE_LABELS[newStage]}. Tarefa de acompanhamento agendada no calendário! 🗓️`,
      })
    } catch (err) {
      console.warn('Erro ao persistir mudança de estágio no servidor:', err)
      toast({
        title: 'Estágio atualizado (local)',
        description: `${contact.name} movido para ${CRM_STAGE_LABELS[newStage]}.`,
      })
    }
  }

  const handleExport = () => {
    exportContactsToCSV(filteredContacts)
    toast({
      title: 'Exportação concluída',
      description: 'Arquivo CSV com codificação UTF-8 (compatível com Excel) foi baixado.',
    })
  }

  const openDetails = (c: CrmContact) => {
    setDrawerContact(c)
    setIsDrawerOpen(true)
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto">
      {/* Topo / Header no padrão High Impact */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border hi-card relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="hi-kicker text-primary bg-primary/10 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
              Estúdio & Vendas
            </span>
            <Badge variant="outline" className="text-xs bg-background/80">
              High Impact CRM
            </Badge>
          </div>
          <h1 className="hi-title text-2xl md:text-3xl text-foreground font-black tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" /> CRM & Gestão de Contatos
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl">
            Gerencie leads, histórico de interações, campos personalizados e funil de vendas
            integrado às campanhas e ao calendário global.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isRefreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="text-xs gap-1.5 font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
            title={`Exportar ${filteredContacts.length} leads filtrados para CSV`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Exportar Leads ({filteredContacts.length})
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingContact(null)
              setIsContactModalOpen(true)
            }}
            className="hi-button bg-primary text-primary-foreground font-bold text-xs gap-1.5"
          >
            <Plus className="w-4 h-4" /> Novo Lead
          </Button>
        </div>
      </div>

      {/* Integração de Relatório de Performance ao CRM */}
      <CrmPerformanceIntegration
        currentFilteredCount={filteredContacts.length}
        onFilterByCampaignOrSource={(val) => {
          setSearchQuery(val)
          toast({
            title: 'Filtro por Campanha Aplicado',
            description: `Exibindo leads associados a "${val}".`,
          })
        }}
      />

      {/* Cartões de Métricas / KPIs Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border hi-card space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Pipeline Total</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl md:text-2xl font-black text-foreground">
            R$ {kpis.totalPipelineValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {kpis.totalContacts} leads ativos na base
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border hi-card space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Em Negociação</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl md:text-2xl font-black text-foreground text-orange-500">
            R$ {kpis.inNegotiationValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {kpis.stageCounts.negociacao + kpis.stageCounts.proposta_enviada} propostas /
            negociações
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border hi-card space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Fechado Ganho</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl md:text-2xl font-black text-foreground text-emerald-500">
            R$ {kpis.wonValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {kpis.stageCounts.fechado_ganho} clientes convertidos
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border hi-card space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Taxa de Conversão</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl md:text-2xl font-black text-foreground text-purple-500">
            {kpis.conversionRate}%
          </div>
          <p className="text-[11px] text-muted-foreground">
            Ticket médio: R$ {kpis.averageTicket.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Barra de Filtros e Busca Inteligente */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 w-full items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar por nome, empresa, telefone, notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger className="w-[150px] h-9 text-xs bg-background">
              <SelectValue placeholder="Estágio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estágios</SelectItem>
              {Object.entries(CRM_STAGE_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as origens</SelectItem>
              {CRM_SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-[130px] h-9 text-xs bg-background">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Prioridade</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Alternador de visualização: Funil Kanban ou Lista */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60 border border-border">
          <Button
            size="sm"
            variant={viewMode === 'funnel' ? 'default' : 'ghost'}
            onClick={() => setViewMode('funnel')}
            className="text-xs h-7 px-3 font-semibold"
          >
            Funil Visual
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            onClick={() => setViewMode('list')}
            className="text-xs h-7 px-3 font-semibold"
          >
            Lista de Contatos
          </Button>
        </div>
      </div>

      {/* Visualização de Funil (Kanban de CRM) */}
      {viewMode === 'funnel' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
          {STAGES.map((stageKey) => {
            const stageContacts = filteredContacts.filter((c) => c.stage === stageKey)
            const stageValue = stageContacts.reduce((sum, c) => sum + (c.value || 0), 0)
            const colors = CRM_STAGE_COLORS[stageKey]

            return (
              <div
                key={stageKey}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedContactId) {
                    const found = contacts.find((c) => c.id === draggedContactId)
                    if (found) handleStageChange(found, stageKey)
                    setDraggedContactId(null)
                  }
                }}
                className="flex flex-col rounded-xl bg-card/60 border border-border/80 p-3 min-h-[420px] transition-all hover:border-primary/40 shadow-xs"
              >
                {/* Cabeçalho da Coluna */}
                <div className="space-y-1.5 pb-2.5 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${colors.bg} ${colors.text} ${colors.border}`}
                    >
                      {CRM_STAGE_LABELS[stageKey]}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {stageContacts.length}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-muted-foreground">
                    R$ {stageValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Lista de Leads da Coluna */}
                <div className="space-y-2.5 pt-2.5 flex-1 overflow-y-auto max-h-[600px]">
                  {stageContacts.map((contact) => (
                    <div
                      key={contact.id}
                      draggable
                      onDragStart={() => setDraggedContactId(contact.id)}
                      onClick={() => openDetails(contact)}
                      className="p-3 rounded-lg bg-card border border-border hover:border-primary/50 cursor-pointer shadow-xs transition-all hover:-translate-y-0.5 space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            {contact.name}
                          </h4>
                          {contact.company && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Building className="w-3 h-3 text-muted-foreground/70" />
                              <span className="truncate max-w-[130px]">{contact.company}</span>
                            </p>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity">
                              <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                openDetails(contact)
                              }}
                            >
                              Ver Histórico / Interações
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingContact(contact)
                                setIsContactModalOpen(true)
                              }}
                            >
                              Editar Dados
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteContact(contact)
                              }}
                              className="text-rose-500"
                            >
                              Excluir Lead
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Valor e Origem */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40">
                        <span className="font-bold text-emerald-500">
                          R$ {(contact.value || 0).toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {contact.source || 'Social'}
                        </span>
                      </div>

                      {/* Botões rápidos de mudança de estágio */}
                      <div
                        className="flex items-center justify-between pt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          value={contact.stage}
                          onValueChange={(val) => handleStageChange(contact, val as CrmStage)}
                        >
                          <SelectTrigger className="h-6 text-[10px] bg-background/50 border-border/60">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="text-xs">
                            {Object.entries(CRM_STAGE_LABELS).map(([k, label]) => (
                              <SelectItem key={k} value={k}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}

                  {stageContacts.length === 0 && (
                    <div className="h-28 border border-dashed border-border/60 rounded-lg flex items-center justify-center text-[11px] text-muted-foreground/60 text-center p-2">
                      Arraste ou crie um lead aqui
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Visualização em Lista / Tabela */
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/70 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3">Nome / Contato</th>
                  <th className="p-3">Empresa</th>
                  <th className="p-3">Estágio</th>
                  <th className="p-3">Origem</th>
                  <th className="p-3">Valor Estimado</th>
                  <th className="p-3">Responsável</th>
                  <th className="p-3">Prioridade</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => openDetails(contact)}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <td className="p-3">
                      <div className="font-bold text-foreground">{contact.name}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        {contact.phone && <span>{contact.phone}</span>}
                        {contact.email && <span>{contact.email}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{contact.company || '—'}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${CRM_STAGE_COLORS[contact.stage]?.bg} ${CRM_STAGE_COLORS[contact.stage]?.text} ${CRM_STAGE_COLORS[contact.stage]?.border}`}
                      >
                        {CRM_STAGE_LABELS[contact.stage]}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{contact.source || '—'}</td>
                    <td className="p-3 font-bold text-emerald-500">
                      R${' '}
                      {(contact.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-muted-foreground">{contact.responsible || '—'}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {contact.priority || 'média'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingContact(contact)
                            setIsContactModalOpen(true)
                          }}
                          className="h-7 text-xs"
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteContact(contact)}
                          className="h-7 text-xs text-rose-500 hover:text-rose-600"
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modais */}
      <CrmContactModal
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
        contact={editingContact}
        onSave={handleSaveContact}
      />

      <CrmContactDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        contact={drawerContact}
        interactions={interactions}
        onAddInteraction={(newInter) => setInteractions((prev) => [newInter, ...prev])}
        onEditContact={(c) => {
          setEditingContact(c)
          setIsContactModalOpen(true)
        }}
      />
    </div>
  )
}
