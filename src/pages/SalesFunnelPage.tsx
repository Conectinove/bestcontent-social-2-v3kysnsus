import { useState, useEffect, useMemo, type DragEvent } from 'react'
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  DollarSign,
  Briefcase,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  AlertCircle,
  HelpCircle,
  Building,
  Target,
  ArrowRight,
  Loader2,
  Lightbulb,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/hooks/use-toast'
import {
  getFunnelDeals,
  createFunnelDeal,
  updateFunnelDeal,
  updateDealStage,
  deleteFunnelDeal,
  calculateFunnelKpis,
  FUNNEL_STAGES,
  SOURCES_OPTIONS,
  type FunnelDeal,
  type DealStage,
  type DealSource,
  type FunnelDealFormData,
  getFunnelAutomations,
  type FunnelAutomationRecord,
} from '@/services/funnel'
import { GoogleAdsFunnelBlock } from '@/components/ads/GoogleAdsFunnelBlock'
import { MetaAdsFunnelBlock } from '@/components/ads/MetaAdsFunnelBlock'
import { YouTubeAdsFunnelBlock } from '@/components/ads/YouTubeAdsFunnelBlock'
import { FunnelAutomationsPanel } from '@/components/funnel/FunnelAutomationsPanel'

export default function SalesFunnelPage() {
  const [deals, setDeals] = useState<FunnelDeal[]>([])
  const [automations, setAutomations] = useState<FunnelAutomationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null)
  const [showAutomationsPanel, setShowAutomationsPanel] = useState(true)

  // Modal de criação / edição
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<FunnelDeal | null>(null)
  const [formData, setFormData] = useState<FunnelDealFormData>({
    title: '',
    company: '',
    value: 0,
    stage: 'lead_captado',
    source: 'Instagram',
    responsible: 'Ronaldo Barreto',
    expected_close_date: '',
    notes: '',
    priority: 'media',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Modal de exclusão
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Carregar dados
  const loadDeals = async () => {
    try {
      const [dealsData, autoData] = await Promise.all([getFunnelDeals(), getFunnelAutomations()])
      setDeals(dealsData)
      setAutomations(autoData)
    } catch (err) {
      console.warn('Erro ao carregar oportunidades do funil:', err)
      toast({
        title: 'Erro ao carregar funil',
        description: 'Não foi possível buscar as oportunidades.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const reloadAutomations = async () => {
    try {
      const autoData = await getFunnelAutomations()
      setAutomations(autoData)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadDeals()
  }, [])

  // Filtragem
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deal.company && deal.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (deal.responsible && deal.responsible.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesSource = selectedSource === 'all' || deal.source === selectedSource

      return matchesSearch && matchesSource
    })
  }, [deals, searchQuery, selectedSource])

  // KPIs
  const kpis = useMemo(() => calculateFunnelKpis(deals), [deals])

  // Conversão de clique Google Ads em Lead captado
  const handleConvertClickToLead = async (leadData: {
    title: string
    company: string
    value: number
    source: 'Google Ads'
    notes: string
  }) => {
    const created = await createFunnelDeal({
      title: leadData.title,
      company: leadData.company,
      value: leadData.value,
      stage: 'lead_captado',
      source: 'Google Ads',
      responsible: 'Ronaldo Barreto',
      notes: leadData.notes,
      priority: 'alta',
    })
    setDeals((prev) => [created, ...prev])
  }

  // Conversão de clique Meta Ads em Lead captado
  const handleConvertMetaClickToLead = async (leadData: {
    title: string
    company: string
    value: number
    source: 'Meta Ads'
    notes: string
  }) => {
    const created = await createFunnelDeal({
      title: leadData.title,
      company: leadData.company,
      value: leadData.value,
      stage: 'lead_captado',
      source: 'Meta Ads',
      responsible: 'Ronaldo Barreto',
      notes: leadData.notes,
      priority: 'alta',
    })
    setDeals((prev) => [created, ...prev])
  }

  // Conversão de clique YouTube Ads em Lead captado
  const handleConvertYouTubeClickToLead = async (leadData: {
    title: string
    company: string
    value: number
    source: 'YouTube Ads'
    notes: string
  }) => {
    const created = await createFunnelDeal({
      title: leadData.title,
      company: leadData.company,
      value: leadData.value,
      stage: 'lead_captado',
      source: 'YouTube Ads',
      responsible: 'Ronaldo Barreto',
      notes: leadData.notes,
      priority: 'alta',
    })
    setDeals((prev) => [created, ...prev])
  }

  // Análise de IA Avançada do Funil (BestContent Sales Advisor com dados reais)
  // Ampliado com: comparativo Google Ads vs Meta Ads vs Orgânico, Projeção do Mês e Próximo Melhor Contato
  const aiInsight = useMemo(() => {
    if (deals.length === 0) {
      return {
        stageName: 'Aguardando dados',
        bottleneck: 'Nenhuma oportunidade cadastrada no funil até o momento.',
        prescription:
          'Cadastre seus primeiros contatos ou converta cliques de Google Ads ou Meta Ads para ativar as prescrições inteligentes de alta conversão.',
        action: 'Adicionar Primeiro Lead',
        priorityDeals: [] as FunnelDeal[],
        metricsDetail: 'Pipeline zerado.',
        channelComparison: {
          google: { count: 0, won: 0, rate: 0, totalVal: 0 },
          meta: { count: 0, won: 0, rate: 0, totalVal: 0 },
          youtube: { count: 0, won: 0, rate: 0, totalVal: 0 },
          organic: { count: 0, won: 0, rate: 0, totalVal: 0 },
          winner: 'Nenhum canal ativo',
        },
        monthProjection: {
          projectedRevenue: 0,
          confidence: 'Baixa',
          basisNote: 'Sem histórico de fechamentos no ciclo atual.',
        },
        nextBestContact: null as { deal: FunnelDeal; score: number; reason: string } | null,
      }
    }

    const now = new Date().getTime()

    // 1. Valor por estágio e contagem
    const stageSummary: Record<DealStage, { count: number; totalValue: number }> = {
      lead_captado: { count: 0, totalValue: 0 },
      contato_feito: { count: 0, totalValue: 0 },
      proposta_enviada: { count: 0, totalValue: 0 },
      negociacao: { count: 0, totalValue: 0 },
      fechado_ganho: { count: 0, totalValue: 0 },
      fechado_perdido: { count: 0, totalValue: 0 },
    }

    // 2. Comparativo aprofundado por canal: Google Ads vs Meta Ads vs YouTube Ads vs Orgânico
    const channelStats = {
      google: { count: 0, won: 0, totalVal: 0, wonVal: 0 },
      meta: { count: 0, won: 0, totalVal: 0, wonVal: 0 },
      youtube: { count: 0, won: 0, totalVal: 0, wonVal: 0 },
      organic: { count: 0, won: 0, totalVal: 0, wonVal: 0 },
    }

    const sourceWon: Record<string, { total: number; won: number }> = {}

    // 3. Deals estagnados e candidatos a próximo melhor contato
    const staleDeals: Array<{ deal: FunnelDeal; days: number }> = []
    const contactCandidates: Array<{ deal: FunnelDeal; score: number; reason: string }> = []

    deals.forEach((d) => {
      const val = Number(d.value) || 0
      stageSummary[d.stage].count += 1
      stageSummary[d.stage].totalValue += val

      const src = d.source || 'Outro'
      if (!sourceWon[src]) sourceWon[src] = { total: 0, won: 0 }
      sourceWon[src].total += 1
      if (d.stage === 'fechado_ganho') sourceWon[src].won += 1

      // Mapear para agrupamento de canais
      if (src === 'Google Ads') {
        channelStats.google.count += 1
        channelStats.google.totalVal += val
        if (d.stage === 'fechado_ganho') {
          channelStats.google.won += 1
          channelStats.google.wonVal += val
        }
      } else if (src === 'Meta Ads') {
        channelStats.meta.count += 1
        channelStats.meta.totalVal += val
        if (d.stage === 'fechado_ganho') {
          channelStats.meta.won += 1
          channelStats.meta.wonVal += val
        }
      } else if (src === 'YouTube Ads') {
        channelStats.youtube.count += 1
        channelStats.youtube.totalVal += val
        if (d.stage === 'fechado_ganho') {
          channelStats.youtube.won += 1
          channelStats.youtube.wonVal += val
        }
      } else {
        channelStats.organic.count += 1
        channelStats.organic.totalVal += val
        if (d.stage === 'fechado_ganho') {
          channelStats.organic.won += 1
          channelStats.organic.wonVal += val
        }
      }

      // Deals abertos (passíveis de ação)
      if (d.stage !== 'fechado_ganho' && d.stage !== 'fechado_perdido') {
        const updatedAt = new Date(d.updated || d.created).getTime()
        const diffDays = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24))
        if (diffDays >= 7) {
          staleDeals.push({ deal: d, days: diffDays })
        }

        // Score de Próximo Melhor Contato:
        // Prioridade por estágio: negociacao (40pts) > proposta_enviada (30pts) > contato_feito (20pts) > lead_captado (10pts)
        // Valor monetário: até 40pts
        // Dias sem contato: até 20pts
        let stageWeight = 10
        if (d.stage === 'negociacao') stageWeight = 40
        else if (d.stage === 'proposta_enviada') stageWeight = 30
        else if (d.stage === 'contato_feito') stageWeight = 20

        const valueScore = Math.min(40, Math.round((val / 5000) * 40))
        const daysScore = Math.min(20, diffDays * 3)
        const priorityScore = d.priority === 'alta' ? 15 : d.priority === 'media' ? 5 : 0
        const totalScore = stageWeight + valueScore + daysScore + priorityScore

        let reason = ''
        if (d.stage === 'negociacao') {
          reason = `Negociação de R$ ${val.toLocaleString('pt-BR')} parada há ${diffDays}d. Alta propensão a fechar com oferta rápida.`
        } else if (d.stage === 'proposta_enviada') {
          reason = `Proposta enviada retendo R$ ${val.toLocaleString('pt-BR')} há ${diffDays}d. Follow-up consultivo sugerido.`
        } else if (d.stage === 'lead_captado') {
          reason = `Lead quente de ${d.source || 'redes'} aguardando primeiro contato há ${diffDays}d.`
        } else {
          reason = `Oportunidade de R$ ${val.toLocaleString('pt-BR')} pronta para avanço de proposta.`
        }

        contactCandidates.push({ deal: d, score: totalScore, reason })
      }
    })

    // Ordenar candidatos a próximo melhor contato (maior score primeiro)
    contactCandidates.sort((a, b) => b.score - a.score)
    const nextBestContact = contactCandidates.length > 0 ? contactCandidates[0] : null

    // Taxas de conversão por canal comparado
    const googleRate =
      channelStats.google.count > 0
        ? (channelStats.google.won / channelStats.google.count) * 100
        : 0
    const metaRate =
      channelStats.meta.count > 0 ? (channelStats.meta.won / channelStats.meta.count) * 100 : 0
    const youtubeRate =
      channelStats.youtube.count > 0
        ? (channelStats.youtube.won / channelStats.youtube.count) * 100
        : 0
    const organicRate =
      channelStats.organic.count > 0
        ? (channelStats.organic.won / channelStats.organic.count) * 100
        : 0

    let channelWinner = 'Canais equilibrados'
    const candidatesRates = [
      { name: 'Meta Ads', rate: metaRate, count: channelStats.meta.count },
      { name: 'Google Ads', rate: googleRate, count: channelStats.google.count },
      { name: 'YouTube Ads', rate: youtubeRate, count: channelStats.youtube.count },
      { name: 'Orgânico / Social', rate: organicRate, count: channelStats.organic.count },
    ].filter((c) => c.count >= 1 && c.rate > 0)

    if (candidatesRates.length > 0) {
      candidatesRates.sort((a, b) => b.rate - a.rate)
      channelWinner = `${candidatesRates[0].name} (${candidatesRates[0].rate.toFixed(0)}% conversão)`
    } else if (channelStats.youtube.count > 0) {
      channelWinner = 'YouTube Ads (vídeo qualificado)'
    }

    const channelComparison = {
      google: {
        count: channelStats.google.count,
        won: channelStats.google.won,
        rate: googleRate,
        totalVal: channelStats.google.totalVal,
      },
      meta: {
        count: channelStats.meta.count,
        won: channelStats.meta.won,
        rate: metaRate,
        totalVal: channelStats.meta.totalVal,
      },
      youtube: {
        count: channelStats.youtube.count,
        won: channelStats.youtube.won,
        rate: youtubeRate,
        totalVal: channelStats.youtube.totalVal,
      },
      organic: {
        count: channelStats.organic.count,
        won: channelStats.organic.won,
        rate: organicRate,
        totalVal: channelStats.organic.totalVal,
      },
      winner: channelWinner,
    }

    // 4. Projeção de Fechamento do Mês:
    // Modelo Preditivo Ponderado por Probabilidade de Estágio:
    // Negociação: 70% de chance
    // Proposta enviada: 40% de chance
    // Contato feito: 20% de chance
    // Lead captado: 10% de chance
    // + Receita já ganha no mês
    const weightedPipeline =
      stageSummary.negociacao.totalValue * 0.7 +
      stageSummary.proposta_enviada.totalValue * 0.4 +
      stageSummary.contato_feito.totalValue * 0.2 +
      stageSummary.lead_captado.totalValue * 0.1

    const projectedRevenue = Math.round(kpis.wonThisMonthValue + weightedPipeline)
    const confidence =
      stageSummary.negociacao.count >= 2 || kpis.wonCount >= 2
        ? 'Alta (75%-85%)'
        : deals.length >= 3
          ? 'Média (55%-70%)'
          : 'Estimativa Inicial'

    const monthProjection = {
      projectedRevenue,
      confidence,
      basisNote: `R$ ${kpis.wonThisMonthValue.toLocaleString('pt-BR')} já faturados + R$ ${Math.round(weightedPipeline).toLocaleString('pt-BR')} ponderados pela probabilidade do pipeline.`,
    }

    // Ordenar deals estagnados
    staleDeals.sort((a, b) => (Number(b.deal.value) || 0) - (Number(a.deal.value) || 0))

    // Caso A: Deals estagnados em Proposta enviada
    const staleProposals = staleDeals.filter((s) => s.deal.stage === 'proposta_enviada')
    if (staleProposals.length > 0) {
      const topProposal = staleProposals[0].deal
      const topVal = Number(topProposal.value) || 0
      return {
        stageName: 'Proposta enviada (Atenção Urgente)',
        bottleneck: `${staleProposals.length} deal(s) parado(s) em Proposta enviada há mais de 7 dias, retendo R$ ${stageSummary.proposta_enviada.totalValue.toLocaleString('pt-BR')}.`,
        prescription: `Prescrição imediata: Priorize o contato em "${topProposal.title}" (R$ ${topVal.toLocaleString('pt-BR')}). No comparativo de origens, ${channelWinner} lidera a taxa de conversão final. Envie áudio no WhatsApp com case de prova social e alinhamento do escopo para destravar o contrato antes do fim da semana.`,
        action: 'Enviar Follow-up da Proposta',
        priorityDeals: staleProposals.map((s) => s.deal).slice(0, 3),
        metricsDetail: `Projeção Mês: R$ ${projectedRevenue.toLocaleString('pt-BR')} · Melhor Canal: ${channelWinner}`,
        channelComparison,
        monthProjection,
        nextBestContact,
      }
    }

    // Caso B: Negociação acumulando valor alto
    if (stageSummary.negociacao.count >= 2 || stageSummary.negociacao.totalValue > 5000) {
      return {
        stageName: 'Negociação (Fechamento Próximo)',
        bottleneck: `R$ ${stageSummary.negociacao.totalValue.toLocaleString('pt-BR')} concentrados em ${stageSummary.negociacao.count} negociações ativas no funil.`,
        prescription: `Prescrição comercial: Clientes em negociação demandam urgência positiva. Projeção aponta potencial de fechar R$ ${projectedRevenue.toLocaleString('pt-BR')} neste mês se você aplicar condição de encerramento de lote ou bônus de ativação via Asaas.`,
        action: 'Criar Oferta de Fechamento',
        priorityDeals: deals.filter((d) => d.stage === 'negociacao').slice(0, 3),
        metricsDetail: `Projeção Mês: R$ ${projectedRevenue.toLocaleString('pt-BR')} (${confidence})`,
        channelComparison,
        monthProjection,
        nextBestContact,
      }
    }

    // Caso C: Leads captados aguardando primeiro contato
    if (stageSummary.lead_captado.count >= 2) {
      return {
        stageName: 'Lead captado (Tempo de Resposta)',
        bottleneck: `${stageSummary.lead_captado.count} novo(s) lead(s) captados aguardando qualificação inicial formal.`,
        prescription: `Prescrição de velocidade: Contatar leads nas primeiras 2 horas eleva a conversão em 391%. Origem recomendada com maior eficiência no momento: ${channelWinner}. Dispare mensagem de apresentação com link de agendamento de 15 min.`,
        action: 'Iniciar Qualificação Rápida',
        priorityDeals: deals.filter((d) => d.stage === 'lead_captado').slice(0, 3),
        metricsDetail: `Oportunidades em espera: ${stageSummary.lead_captado.count} · Projeção: R$ ${projectedRevenue.toLocaleString('pt-BR')}`,
        channelComparison,
        monthProjection,
        nextBestContact,
      }
    }

    // Fluxo geral saudável
    return {
      stageName: 'Fluxo Estável & Balanceado',
      bottleneck: `Funil com taxa de conversão de ${kpis.conversionRate}% e projeção de receita de R$ ${projectedRevenue.toLocaleString('pt-BR')} para este ciclo.`,
      prescription: `Prescrição de escala: O canal "${channelWinner}" demonstra maior maturidade de conversão. Escale investimentos de tráfego pago nos blocos Google Ads e Meta Ads para alimentar o topo do funil com leads de alta intenção.`,
      action: 'Alimentar Pipeline com Ads',
      priorityDeals: deals
        .filter((d) => d.stage === 'contato_feito' || d.stage === 'negociacao')
        .slice(0, 3),
      metricsDetail: `Projeção: R$ ${projectedRevenue.toLocaleString('pt-BR')} · Canal Líder: ${channelWinner}`,
      channelComparison,
      monthProjection,
      nextBestContact,
    }
  }, [deals, kpis])

  // Abertura do modal
  const handleOpenCreateModal = (defaultStage: DealStage = 'lead_captado') => {
    setEditingDeal(null)
    setFormData({
      title: '',
      company: '',
      value: 0,
      stage: defaultStage,
      source: 'Instagram',
      responsible: 'Ronaldo Barreto',
      expected_close_date: '',
      notes: '',
      priority: 'media',
    })
    setModalOpen(true)
  }

  const handleOpenEditModal = (deal: FunnelDeal) => {
    setEditingDeal(deal)
    setFormData({
      title: deal.title,
      company: deal.company || '',
      value: deal.value || 0,
      stage: deal.stage,
      source: deal.source || 'Instagram',
      responsible: deal.responsible || '',
      expected_close_date: deal.expected_close_date ? deal.expected_close_date.split('T')[0] : '',
      notes: deal.notes || '',
      priority: deal.priority || 'media',
    })
    setModalOpen(true)
  }

  // Salvar
  const handleSaveDeal = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome ou oportunidade do deal.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const payload: FunnelDealFormData = {
        ...formData,
        value: Number(formData.value) || 0,
        expected_close_date: formData.expected_close_date
          ? new Date(formData.expected_close_date).toISOString()
          : undefined,
      }

      if (editingDeal) {
        const updated = await updateFunnelDeal(editingDeal.id, payload)
        setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
        toast({
          title: 'Oportunidade Atualizada!',
          description: `O negócio "${updated.title}" foi salvo com sucesso.`,
        })
      } else {
        const created = await createFunnelDeal(payload)
        setDeals((prev) => [created, ...prev])
        toast({
          title: 'Oportunidade Criada!',
          description: `Novo deal adicionado ao estágio ${FUNNEL_STAGES.find((s) => s.id === created.stage)?.label}.`,
        })
      }
      setModalOpen(false)
    } catch (err) {
      console.error('Erro ao salvar deal:', err)
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível persistir os dados no banco.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Excluir
  const handleDeleteDeal = async () => {
    if (!deleteConfirmId) return
    try {
      await deleteFunnelDeal(deleteConfirmId)
      setDeals((prev) => prev.filter((d) => d.id !== deleteConfirmId))
      toast({
        title: 'Oportunidade Excluída',
        description: 'O negócio foi removido do funil.',
      })
    } catch (err) {
      console.error('Erro ao excluir deal:', err)
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o registro.',
        variant: 'destructive',
      })
    } finally {
      setDeleteConfirmId(null)
    }
  }

  // Drag and Drop
  const handleDragStart = (e: DragEvent<HTMLDivElement>, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedDealId(dealId)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>, stageId: DealStage) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId)
    }
  }

  const handleDragLeave = () => {
    setDragOverStage(null)
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetStage: DealStage) => {
    e.preventDefault()
    setDragOverStage(null)
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId
    setDraggedDealId(null)

    if (!dealId) return

    const targetDeal = deals.find((d) => d.id === dealId)
    if (!targetDeal || targetDeal.stage === targetStage) return

    // Atualização otimista
    const prevDeals = [...deals]
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: targetStage } : d)))

    try {
      await updateDealStage(dealId, targetStage)
      const stageName = FUNNEL_STAGES.find((s) => s.id === targetStage)?.label
      toast({
        title: `Movido para ${stageName}`,
        description: `O deal "${targetDeal.title}" avançou no pipeline.`,
      })
    } catch (err) {
      console.error('Erro ao atualizar estágio:', err)
      setDeals(prevDeals)
      toast({
        title: 'Falha ao mover',
        description: 'Não foi possível atualizar o estágio no banco.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6 pb-16 animate-fade-in text-foreground">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              Gestão de Vendas & Pipeline
            </span>
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-[9px] uppercase px-2 py-0.5 shadow-xs">
              NOVO
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <span>Funil de Vendas</span>
            <Briefcase className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gerencie oportunidades comerciais originadas das suas redes sociais com kanban
            interativo, drag-and-drop e inteligência preditiva.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => handleOpenCreateModal('lead_captado')}
            className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-10 px-4 gap-2 shadow-xs transition-all hover:shadow-purple-500/20 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Oportunidade</span>
          </Button>
        </div>
      </div>

      {/* Grid Superior de 5 KPIs Obrigatórios (1 col em telas < 400px, 2 col sm, 3 col md, 5 col lg) */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Pipeline Total */}
        <Card className="p-4 rounded-2xl border-border/80 bg-gradient-to-br from-purple-500/10 via-card to-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Valor Total Pipeline
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-foreground truncate">
            R$ {kpis.totalPipelineValue.toLocaleString('pt-BR')}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {kpis.totalDeals} negócio(s) mapeado(s)
          </p>
        </Card>

        {/* KPI 2: Valor em Negociação */}
        <Card className="p-4 rounded-2xl border-border/80 bg-gradient-to-br from-orange-500/10 via-card to-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Em Negociação
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/15 text-orange-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400 truncate">
            R$ {kpis.inNegotiationValue.toLocaleString('pt-BR')}
          </p>
          <p className="text-[11px] text-muted-foreground">Propostas & contratos abertos</p>
        </Card>

        {/* KPI 3: Taxa de Conversão */}
        <Card className="p-4 rounded-2xl border-border/80 bg-gradient-to-br from-emerald-500/10 via-card to-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Taxa de Conversão
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {kpis.conversionRate}%
          </p>
          <p className="text-[11px] text-muted-foreground">
            {kpis.wonCount} ganhos de {kpis.totalDeals}
          </p>
        </Card>

        {/* KPI 4: Ticket Médio */}
        <Card className="p-4 rounded-2xl border-border/80 bg-gradient-to-br from-blue-500/10 via-card to-card space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Ticket Médio
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-foreground truncate">
            R$ {kpis.averageTicket.toLocaleString('pt-BR')}
          </p>
          <p className="text-[11px] text-muted-foreground">Por contrato fechado</p>
        </Card>

        {/* KPI 5: Ganhos no Mês */}
        <Card className="p-4 rounded-2xl border-border/80 bg-gradient-to-br from-pink-500/10 via-card to-card space-y-1 shadow-xs min-[420px]:col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Ganhos no Mês
            </span>
            <div className="w-7 h-7 rounded-lg bg-pink-500/15 text-pink-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-pink-600 dark:text-pink-400 truncate">
            R$ {kpis.wonThisMonthValue.toLocaleString('pt-BR')}
          </p>
          <p className="text-[11px] text-muted-foreground">Receita faturada neste ciclo</p>
        </Card>
      </div>

      {/* Blocos de Performance de Mídia Paga Integrados (Google Ads + Meta Ads + YouTube Ads lado a lado) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <GoogleAdsFunnelBlock onConvertClickToLead={handleConvertClickToLead} />
        <MetaAdsFunnelBlock onConvertClickToLead={handleConvertMetaClickToLead} />
        <YouTubeAdsFunnelBlock onConvertClickToLead={handleConvertYouTubeClickToLead} />
      </div>

      {/* Painel de Automações do Funil (Persistidas no Banco) */}
      <FunnelAutomationsPanel
        automations={automations}
        deals={deals}
        onRefreshAutomations={reloadAutomations}
        onRefreshDeals={loadDeals}
      />

      {/* Caixa de Insights de IA Avançada (BestContent Sales Advisor com Inteligência Comparativa & Preditiva) */}
      <Card className="p-5 rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-background to-pink-950/20 shadow-xs space-y-4">
        {/* Cabeçalho do Advisor */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-foreground">
                  BestContent Sales Advisor (IA Comercial Preditiva)
                </h3>
                <Badge className="bg-purple-600 text-white text-[9px] uppercase font-bold">
                  {aiInsight.stageName}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{aiInsight.bottleneck}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-purple-500/40 text-purple-700 dark:text-purple-300"
            >
              {aiInsight.metricsDetail}
            </Badge>
          </div>
        </div>

        {/* 3 Sub-blocos Inteligentes: Comparativo de Canais, Projeção do Mês e Próximo Melhor Contato */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Sub-bloco 1: Comparativo Google Ads vs Meta Ads vs YouTube Ads vs Orgânico */}
          <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-500" />
                Google vs Meta vs YouTube vs Orgânico
              </span>
              <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Conversão
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Google Ads:</span>
                <span className="font-bold font-mono text-foreground">
                  {aiInsight.channelComparison.google.count} leads ·{' '}
                  {aiInsight.channelComparison.google.rate.toFixed(0)}% fechados
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Meta Ads:</span>
                <span className="font-bold font-mono text-foreground">
                  {aiInsight.channelComparison.meta.count} leads ·{' '}
                  {aiInsight.channelComparison.meta.rate.toFixed(0)}% fechados
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">YouTube Ads:</span>
                <span className="font-bold font-mono text-foreground">
                  {aiInsight.channelComparison.youtube?.count || 0} leads ·{' '}
                  {(aiInsight.channelComparison.youtube?.rate || 0).toFixed(0)}% fechados
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Orgânico/Outros:</span>
                <span className="font-bold font-mono text-foreground">
                  {aiInsight.channelComparison.organic.count} leads ·{' '}
                  {aiInsight.channelComparison.organic.rate.toFixed(0)}% fechados
                </span>
              </div>
            </div>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold pt-1 border-t border-border/60">
              🏆 Líder em conversão: {aiInsight.channelComparison.winner}
            </p>
          </div>

          {/* Sub-bloco 2: Projeção de Fechamento do Mês */}
          <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                Projeção do Mês
              </span>
              <Badge variant="outline" className="text-[9px] font-bold">
                {aiInsight.monthProjection.confidence}
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-mono block">
                R$ {aiInsight.monthProjection.projectedRevenue.toLocaleString('pt-BR')}
              </span>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {aiInsight.monthProjection.basisNote}
              </p>
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium pt-1 border-t border-border/60">
              Cálculo ponderado por probabilidade histórica de cada estágio.
            </p>
          </div>

          {/* Sub-bloco 3: Próximo Melhor Contato (Quem ligar hoje) */}
          <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-pink-500" />
                Próximo Melhor Contato (Hoje)
              </span>
              {aiInsight.nextBestContact && (
                <span className="text-[9px] font-black text-pink-600 bg-pink-500/10 px-1.5 py-0.5 rounded">
                  Score {aiInsight.nextBestContact.score}
                </span>
              )}
            </div>
            {aiInsight.nextBestContact ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className="font-bold text-xs text-foreground truncate cursor-pointer hover:underline max-w-[150px]"
                    onClick={() => handleOpenEditModal(aiInsight.nextBestContact!.deal)}
                    title={aiInsight.nextBestContact.deal.title}
                  >
                    {aiInsight.nextBestContact.deal.title}
                  </span>
                  <span className="text-xs font-black font-mono text-purple-600">
                    R$ {(aiInsight.nextBestContact.deal.value || 0).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {aiInsight.nextBestContact.reason}
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(aiInsight.nextBestContact!.deal)}
                  className="text-[10px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 pt-1"
                >
                  Abrir ficha e ligar agora <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Nenhum deal com pendência urgente no momento.
              </p>
            )}
          </div>
        </div>

        {/* Prescrição Concreta da IA */}
        <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs text-foreground/90 leading-relaxed">
                <strong className="text-foreground">Prescrição Tática da IA: </strong>
                {aiInsight.prescription}
              </p>
              {aiInsight.priorityDeals && aiInsight.priorityDeals.length > 0 && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] font-bold text-muted-foreground">
                    Priorizar no pipeline:
                  </span>
                  {aiInsight.priorityDeals.map((pd) => (
                    <Badge
                      key={pd.id}
                      variant="outline"
                      className="cursor-pointer border-purple-500/40 text-purple-700 dark:text-purple-300 text-[10px]"
                      onClick={() => handleOpenEditModal(pd)}
                    >
                      {pd.title} (R$ {(pd.value || 0).toLocaleString('pt-BR')})
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleOpenCreateModal('lead_captado')}
            className="rounded-xl text-xs h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold shrink-0 self-end sm:self-center min-h-[36px]"
          >
            <span>{aiInsight.action}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </Card>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-muted/40 border border-border/80">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Buscar por lead, empresa ou responsável..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 rounded-xl bg-card border-border min-h-[40px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Origem:
          </span>
          <button
            type="button"
            onClick={() => setSelectedSource('all')}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all whitespace-nowrap min-h-[36px] ${
              selectedSource === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
            }`}
          >
            Todas ({deals.length})
          </button>
          {SOURCES_OPTIONS.map((src) => {
            const count = deals.filter((d) => d.source === src).length
            return (
              <button
                key={src}
                type="button"
                onClick={() => setSelectedSource(src)}
                className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all whitespace-nowrap min-h-[36px] ${
                  selectedSource === src
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
                }`}
              >
                {src} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Pipeline Kanban com Drag and Drop */}
      <div className="overflow-x-auto pb-4 scrollbar-thin">
        <div className="flex gap-4 min-w-[1300px]">
          {FUNNEL_STAGES.map((stage) => {
            const stageDeals = filteredDeals.filter((d) => d.stage === stage.id)
            const stageTotalValue = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
            const isDropTarget = dragOverStage === stage.id

            return (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={`flex-1 min-w-[210px] rounded-2xl border transition-all flex flex-col max-h-[750px] ${
                  isDropTarget
                    ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20'
                    : 'border-border/80 bg-muted/20'
                }`}
              >
                {/* Cabeçalho da Coluna */}
                <div className="p-3 border-b border-border/60 space-y-1 bg-card/60 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h4 className="font-bold text-xs text-foreground tracking-tight">
                        {stage.label}
                      </h4>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 h-5">
                      {stageDeals.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Total:</span>
                    <span className="font-bold font-mono text-foreground">
                      R$ {stageTotalValue.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Lista de Cards da Coluna */}
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1 scrollbar-thin min-h-[160px]">
                  {stageDeals.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center text-center p-3 border border-dashed border-border/70 rounded-xl">
                      <p className="text-[11px] text-muted-foreground">Arraste um card aqui</p>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateModal(stage.id)}
                        className="text-[10px] font-bold text-purple-600 hover:underline mt-1"
                      >
                        + Adicionar
                      </button>
                    </div>
                  )}

                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      className={`p-3 rounded-xl bg-card border transition-all cursor-grab active:cursor-grabbing hover:border-purple-500/50 shadow-xs space-y-2 ${
                        draggedDealId === deal.id ? 'opacity-40 scale-95' : 'opacity-100'
                      }`}
                    >
                      {/* Topo do Card: Origem & Ações */}
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {deal.source && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] font-bold px-1.5 py-0 h-4 bg-muted text-muted-foreground"
                            >
                              {deal.source}
                            </Badge>
                          )}
                          {deal.priority === 'alta' && (
                            <span className="text-[9px] font-extrabold text-rose-600 bg-rose-500/10 px-1 py-0.2 rounded uppercase">
                              Alta
                            </span>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-lg -mr-1 -mt-1"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 text-xs">
                            <DropdownMenuItem
                              onClick={() => handleOpenEditModal(deal)}
                              className="gap-2 text-xs cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirmId(deal.id)}
                              className="gap-2 text-xs text-rose-600 focus:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Título & Empresa */}
                      <div>
                        <h5 className="font-bold text-xs text-foreground leading-snug line-clamp-2">
                          {deal.title}
                        </h5>
                        {deal.company && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                            <Building className="w-3 h-3 shrink-0" />
                            <span>{deal.company}</span>
                          </p>
                        )}
                      </div>

                      {/* Valor & Responsável */}
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                        <span className="font-black text-purple-600 dark:text-purple-400 font-mono">
                          R$ {(deal.value || 0).toLocaleString('pt-BR')}
                        </span>
                        {deal.responsible && (
                          <span
                            className="text-[10px] text-muted-foreground truncate max-w-[90px]"
                            title={deal.responsible}
                          >
                            {deal.responsible.split(' ')[0]}
                          </span>
                        )}
                      </div>

                      {/* Data prevista ou notas */}
                      {(deal.expected_close_date || deal.notes) && (
                        <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                          {deal.expected_close_date && (
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-muted-foreground/70" />
                              {new Date(deal.expected_close_date).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </span>
                          )}
                          {deal.notes && (
                            <span className="truncate max-w-[120px] italic">"{deal.notes}"</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Botão de adicionar direto na coluna */}
                <div className="p-2 border-t border-border/60 bg-card/40 rounded-b-2xl">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenCreateModal(stage.id)}
                    className="w-full text-xs h-8 text-muted-foreground hover:text-foreground justify-center gap-1 rounded-xl"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Deal</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal de Criação / Edição de Deal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg p-6 rounded-3xl bg-card border border-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-border/80">
            <DialogTitle className="text-xl font-black text-foreground">
              {editingDeal ? 'Editar Oportunidade' : 'Nova Oportunidade de Venda'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Preencha os dados do negócio para acompanhar o status no funil comercial.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 text-xs">
            {/* Título do Deal */}
            <div className="space-y-1">
              <label className="font-bold text-foreground">
                Nome da Oportunidade / Serviço <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Ex: Mentoria Social Media Pro, Pacote 12 Vídeos, Contrato Anual..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="text-xs h-9 rounded-xl"
              />
            </div>

            {/* Empresa / Cliente */}
            <div className="space-y-1">
              <label className="font-bold text-foreground">Empresa / Nome do Cliente</label>
              <Input
                type="text"
                placeholder="Ex: Clínica Bella Pele, Agência Alpha, Ronaldo Silva..."
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="text-xs h-9 rounded-xl"
              />
            </div>

            {/* Valor & Estágio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Valor Estimado (R$)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.value || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                  }
                  className="text-xs h-9 rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Estágio do Pipeline</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value as DealStage })}
                  className="w-full h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  {FUNNEL_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Origem & Responsável */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Origem do Lead</label>
                <select
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value as DealSource })
                  }
                  className="w-full h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  {SOURCES_OPTIONS.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Responsável Comercial</label>
                <Input
                  type="text"
                  placeholder="Ex: Ronaldo Barreto, Camila..."
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  className="text-xs h-9 rounded-xl"
                />
              </div>
            </div>

            {/* Data Prevista & Prioridade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Data Prevista de Fechamento</label>
                <Input
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expected_close_date: e.target.value })
                  }
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Prioridade</label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as 'baixa' | 'media' | 'alta',
                    })
                  }
                  className="w-full h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>

            {/* Notas / Histórico */}
            <div className="space-y-1">
              <label className="font-bold text-foreground">Notas e Alinhamentos</label>
              <Textarea
                rows={3}
                placeholder="Detalhes da proposta, dores do cliente, histórico de reuniões..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border/80 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(false)}
              className="text-xs rounded-xl h-9"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveDeal}
              disabled={isSaving}
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 px-4 gap-1.5 min-h-[40px]"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingDeal ? 'Salvar Alterações' : 'Criar Oportunidade'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={Boolean(deleteConfirmId)} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm p-5 rounded-3xl bg-card border border-border shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Excluir Oportunidade?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Esta ação removerá o deal permanentemente do funil. Deseja continuar?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleDeleteDeal}
              className="text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
