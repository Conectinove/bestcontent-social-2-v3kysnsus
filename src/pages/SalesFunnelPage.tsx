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
  exportDealsToCSV,
  exportDealsToJSON,
  generateFunnelExecutiveSummary,
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
import { TikTokAdsFunnelBlock } from '@/components/ads/TikTokAdsFunnelBlock'
import { LinkedInAdsFunnelBlock } from '@/components/ads/LinkedInAdsFunnelBlock'
import { PinterestAdsFunnelBlock } from '@/components/ads/PinterestAdsFunnelBlock'
import { XAdsFunnelBlock } from '@/components/ads/XAdsFunnelBlock'
import { FunnelAutomationsPanel } from '@/components/funnel/FunnelAutomationsPanel'
import { pb } from '@/lib/pocketbase/client'
import { getLinkedInOrganicMetrics, LinkedInOrganicData } from '@/services/linkedin-organic'
import { Download, FileSpreadsheet, Printer, BarChart3, Award, Crown, Share2 } from 'lucide-react'

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

  // Formatação amigável de moeda (R$ 12,4 mil quando grande)
  const formatCurrency = (val: number, compact = false) => {
    if (compact && val >= 1000000) {
      return `R$ ${(val / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
    }
    if (compact && val >= 10000) {
      return `R$ ${(val / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
    }
    return `R$ ${val.toLocaleString('pt-BR')}`
  }

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

  // Conversão de clique TikTok Ads em Lead captado
  const handleConvertTikTokClickToLead = async (leadData: {
    title: string
    company: string
    value: number
    source: 'TikTok Ads'
    notes: string
  }) => {
    const created = await createFunnelDeal({
      title: leadData.title,
      company: leadData.company,
      value: leadData.value,
      stage: 'lead_captado',
      source: 'TikTok Ads',
      responsible: 'Ronaldo Barreto',
      notes: leadData.notes,
      priority: 'alta',
    })
    setDeals((prev) => [created, ...prev])
  }

  // Conversão de clique LinkedIn Ads em Lead captado
  const handleConvertLinkedInClickToLead = async (leadData: {
    title: string
    company: string
    value: number
    source: 'LinkedIn Ads'
    notes: string
  }) => {
    const created = await createFunnelDeal({
      title: leadData.title,
      company: leadData.company,
      value: leadData.value,
      stage: 'lead_captado',
      source: 'LinkedIn Ads',
      responsible: 'Ronaldo Barreto',
      notes: leadData.notes,
      priority: 'alta',
    })
    setDeals((prev) => [created, ...prev])
  }

  // Conversão de clique Pinterest Ads em Lead captado
  const handleConvertPinterestClickToLead = async (leadData: {
    title: string
    company: string
    value: number
    source: 'Pinterest Ads'
    notes: string
  }) => {
    const created = await createFunnelDeal({
      title: leadData.title,
      company: leadData.company,
      value: leadData.value,
      stage: 'lead_captado',
      source: 'Pinterest Ads',
      responsible: 'Ronaldo Barreto',
      notes: leadData.notes,
      priority: 'media',
    })
    setDeals((prev) => [created, ...prev])
  }

  // Conversão de clique X Ads em Lead captado
  const handleConvertXClickToLead = async (leadData: {
    title: string
    company: string
    value: number
    source: 'X Ads'
    notes: string
  }) => {
    const created = await createFunnelDeal({
      title: leadData.title,
      company: leadData.company,
      value: leadData.value,
      stage: 'lead_captado',
      source: 'X Ads',
      responsible: 'Ronaldo Barreto',
      notes: leadData.notes,
      priority: 'media',
    })
    setDeals((prev) => [created, ...prev])
  }

  // Análise de IA Avançada do Funil (BestContent Sales Advisor com dados reais)
  // Ampliado com: comparativo Google Ads vs Meta Ads vs YouTube Ads vs TikTok Ads vs Orgânico
  const aiInsight = useMemo(() => {
    if (deals.length === 0) {
      return {
        stageName: 'Aguardando dados',
        bottleneck: 'Nenhuma oportunidade cadastrada no funil até o momento.',
        prescription:
          'Cadastre seus primeiros contatos ou converta cliques de Google Ads, Meta Ads, YouTube Ads ou TikTok Ads para ativar as prescrições inteligentes de alta conversão.',
        action: 'Adicionar Primeiro Lead',
        priorityDeals: [] as FunnelDeal[],
        metricsDetail: 'Pipeline zerado.',
        channelComparison: {
          google: { count: 0, won: 0, rate: 0, totalVal: 0 },
          meta: { count: 0, won: 0, rate: 0, totalVal: 0 },
          youtube: { count: 0, won: 0, rate: 0, totalVal: 0 },
          tiktok: { count: 0, won: 0, rate: 0, totalVal: 0 },
          linkedin: { count: 0, won: 0, rate: 0, totalVal: 0 },
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

    // 2. Comparativo aprofundado por canal: Google Ads vs Meta Ads vs YouTube Ads vs TikTok Ads vs LinkedIn Ads vs Orgânico
    const channelStats = {
      google: { count: 0, won: 0, totalVal: 0, wonVal: 0 },
      meta: { count: 0, won: 0, totalVal: 0, wonVal: 0 },
      youtube: { count: 0, won: 0, totalVal: 0, wonVal: 0 },
      tiktok: { count: 0, won: 0, totalVal: 0, wonVal: 0 },
      linkedin: { count: 0, won: 0, totalVal: 0, wonVal: 0 },
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
      } else if (src === 'TikTok Ads') {
        channelStats.tiktok.count += 1
        channelStats.tiktok.totalVal += val
        if (d.stage === 'fechado_ganho') {
          channelStats.tiktok.won += 1
          channelStats.tiktok.wonVal += val
        }
      } else if (src === 'LinkedIn Ads') {
        channelStats.linkedin.count += 1
        channelStats.linkedin.totalVal += val
        if (d.stage === 'fechado_ganho') {
          channelStats.linkedin.won += 1
          channelStats.linkedin.wonVal += val
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
    const tiktokRate =
      channelStats.tiktok.count > 0
        ? (channelStats.tiktok.won / channelStats.tiktok.count) * 100
        : 0
    const linkedinRate =
      channelStats.linkedin.count > 0
        ? (channelStats.linkedin.won / channelStats.linkedin.count) * 100
        : 0
    const organicRate =
      channelStats.organic.count > 0
        ? (channelStats.organic.won / channelStats.organic.count) * 100
        : 0

    let channelWinner = 'Canais equilibrados'
    const candidatesRates = [
      { name: 'LinkedIn Ads', rate: linkedinRate, count: channelStats.linkedin.count },
      { name: 'Meta Ads', rate: metaRate, count: channelStats.meta.count },
      { name: 'Google Ads', rate: googleRate, count: channelStats.google.count },
      { name: 'TikTok Ads', rate: tiktokRate, count: channelStats.tiktok.count },
      { name: 'YouTube Ads', rate: youtubeRate, count: channelStats.youtube.count },
      { name: 'Orgânico / Social', rate: organicRate, count: channelStats.organic.count },
    ].filter((c) => c.count >= 1 && c.rate > 0)

    if (candidatesRates.length > 0) {
      candidatesRates.sort((a, b) => b.rate - a.rate)
      channelWinner = `${candidatesRates[0].name} (${candidatesRates[0].rate.toFixed(0)}% conversão)`
    } else if (channelStats.linkedin.count > 0) {
      channelWinner = 'LinkedIn Ads (maior ticket e tom B2B)'
    } else if (channelStats.tiktok.count > 0) {
      channelWinner = 'TikTok Ads (alta tração em vídeo curto)'
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
      tiktok: {
        count: channelStats.tiktok.count,
        won: channelStats.tiktok.won,
        rate: tiktokRate,
        totalVal: channelStats.tiktok.totalVal,
      },
      linkedin: {
        count: channelStats.linkedin.count,
        won: channelStats.linkedin.won,
        rate: linkedinRate,
        totalVal: channelStats.linkedin.totalVal,
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
      prescription: `Prescrição de escala: O canal "${channelWinner}" demonstra maior maturidade de conversão. Escale investimentos de mídia paga nos blocos de Google Ads, Meta Ads, YouTube Ads, TikTok Ads e LinkedIn Ads para alimentar o topo do funil com leads qualificados.`,
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
          {/* Botões de Exportação Segura com Try/Catch e Toast */}
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-2xl border border-border/80">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                try {
                  exportDealsToCSV(
                    filteredDeals,
                    `funil_deals_${selectedSource !== 'all' ? selectedSource.toLowerCase().replace(/\s+/g, '_') : 'todos'}_${new Date().toISOString().slice(0, 10)}.csv`,
                  )
                  toast({
                    title: 'Exportação CSV Concluída!',
                    description: `${filteredDeals.length} oportunidades exportadas com sucesso.`,
                  })
                } catch (err) {
                  console.error('Erro na exportação CSV:', err)
                  toast({
                    title: 'Falha na exportação CSV',
                    description: 'Não foi possível gerar a planilha no momento.',
                    variant: 'destructive',
                  })
                }
              }}
              className="rounded-xl text-xs h-9 px-3 gap-1.5 text-foreground hover:bg-card min-h-[36px]"
              title="Exportar dados filtrados em formato CSV (Excel)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">Exportar CSV</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                try {
                  exportDealsToJSON(
                    filteredDeals,
                    `funil_deals_${selectedSource !== 'all' ? selectedSource.toLowerCase().replace(/\s+/g, '_') : 'todos'}_${new Date().toISOString().slice(0, 10)}.json`,
                  )
                  toast({
                    title: 'Exportação JSON Concluída!',
                    description: `${filteredDeals.length} registros exportados em JSON estruturado.`,
                  })
                } catch (err) {
                  console.error('Erro na exportação JSON:', err)
                  toast({
                    title: 'Falha na exportação JSON',
                    description: 'Não foi possível gerar o arquivo JSON.',
                    variant: 'destructive',
                  })
                }
              }}
              className="rounded-xl text-xs h-9 px-3 gap-1.5 text-foreground hover:bg-card min-h-[36px]"
              title="Exportar dados filtrados em formato JSON"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold">Exportar JSON</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                try {
                  const summaryText = generateFunnelExecutiveSummary(
                    filteredDeals,
                    {
                      totalPipelineValue: kpis.totalPipelineValue,
                      inNegotiationValue: kpis.inNegotiationValue,
                      conversionRate: kpis.conversionRate,
                      averageTicket: kpis.averageTicket,
                      wonThisMonthValue: kpis.wonThisMonthValue,
                      totalDeals: kpis.totalDeals,
                      wonCount: kpis.wonCount,
                      lostCount: kpis.lostCount,
                      openDealsCount: kpis.totalDeals - (kpis.wonCount + kpis.lostCount),
                    },
                    selectedSource !== 'all' ? `Canal: ${selectedSource}` : 'Todas as Origens',
                  )

                  const blob = new Blob([summaryText], { type: 'text/markdown;charset=utf-8;' })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.setAttribute(
                    'download',
                    `relatorio_executivo_funil_${new Date().toISOString().slice(0, 10)}.txt`,
                  )
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  URL.revokeObjectURL(url)

                  toast({
                    title: 'Relatório Executivo Gerado!',
                    description: 'Download do resumo do funil e canais de Ads iniciado.',
                  })
                } catch (err) {
                  console.error('Erro na geração do relatório:', err)
                  toast({
                    title: 'Falha ao gerar relatório',
                    description: 'Não foi possível compilar o resumo executivo.',
                    variant: 'destructive',
                  })
                }
              }}
              className="rounded-xl text-xs h-9 px-3 gap-1.5 text-purple-700 dark:text-purple-300 hover:bg-card min-h-[36px]"
              title="Exportar Resumo Executivo Completo do Funil"
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
              <span className="font-semibold">Exportar Relatório</span>
            </Button>
          </div>

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
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card
              key={i}
              className="p-4 rounded-2xl border-border/80 bg-card space-y-2 animate-pulse shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-20 bg-muted rounded" />
                <div className="w-7 h-7 rounded-lg bg-muted" />
              </div>
              <div className="h-7 w-28 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </Card>
          ))
        ) : (
          <>
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
              <p
                className="text-xl sm:text-2xl font-black text-foreground truncate"
                title={`R$ ${kpis.totalPipelineValue.toLocaleString('pt-BR')}`}
              >
                {formatCurrency(kpis.totalPipelineValue, true)}
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
              <p
                className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400 truncate"
                title={`R$ ${kpis.inNegotiationValue.toLocaleString('pt-BR')}`}
              >
                {formatCurrency(kpis.inNegotiationValue, true)}
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
              <p
                className="text-xl sm:text-2xl font-black text-foreground truncate"
                title={`R$ ${kpis.averageTicket.toLocaleString('pt-BR')}`}
              >
                {formatCurrency(kpis.averageTicket, true)}
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
              <p
                className="text-xl sm:text-2xl font-black text-pink-600 dark:text-pink-400 truncate"
                title={`R$ ${kpis.wonThisMonthValue.toLocaleString('pt-BR')}`}
              >
                {formatCurrency(kpis.wonThisMonthValue, true)}
              </p>
              <p className="text-[11px] text-muted-foreground">Receita faturada neste ciclo</p>
            </Card>
          </>
        )}
      </div>

      {/* Blocos de Performance de Mídia Paga Integrados (8 canais: Google, Meta, YouTube, TikTok, LinkedIn, Pinterest, X Ads) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <GoogleAdsFunnelBlock onConvertClickToLead={handleConvertClickToLead} />
        <MetaAdsFunnelBlock onConvertClickToLead={handleConvertMetaClickToLead} />
        <YouTubeAdsFunnelBlock onConvertClickToLead={handleConvertYouTubeClickToLead} />
        <TikTokAdsFunnelBlock onConvertClickToLead={handleConvertTikTokClickToLead} />
        <LinkedInAdsFunnelBlock onConvertClickToLead={handleConvertLinkedInClickToLead} />
        <PinterestAdsFunnelBlock onConvertClickToLead={handleConvertPinterestClickToLead} />
        <XAdsFunnelBlock onConvertClickToLead={handleConvertXClickToLead} />
      </div>

      {/* Painel de Automações do Funil (Persistidas no Banco) */}
      <FunnelAutomationsPanel
        automations={automations}
        deals={deals}
        onRefreshAutomations={reloadAutomations}
        onRefreshDeals={loadDeals}
      />

      {/* Seção Nova: Relatório Comparativo de Canais (Google Ads, Meta Ads, YouTube Ads, TikTok Ads, LinkedIn Ads, Pinterest Ads e X Ads consolidando 8 canais) */}
      <ChannelComparisonSection deals={deals} />

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
          {/* Sub-bloco 1: Comparativo Google Ads vs Meta Ads vs YouTube Ads vs TikTok Ads vs LinkedIn Ads vs Orgânico */}
          <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-500" />
                Top 5 Canais de Tráfego Pago & Social
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
                <span className="text-muted-foreground">TikTok Ads:</span>
                <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400">
                  {aiInsight.channelComparison.tiktok?.count || 0} leads ·{' '}
                  {(aiInsight.channelComparison.tiktok?.rate || 0).toFixed(0)}% fechados
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">LinkedIn Ads:</span>
                <span className="font-bold font-mono text-[#0A66C2] dark:text-blue-400">
                  {aiInsight.channelComparison.linkedin?.count || 0} leads ·{' '}
                  {(aiInsight.channelComparison.linkedin?.rate || 0).toFixed(0)}% fechados
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
      <div className="overflow-x-auto pb-4 scrollbar-thin max-w-full">
        {loading ? (
          <div className="flex gap-4 min-w-[1100px] sm:min-w-[1300px]">
            {FUNNEL_STAGES.map((s) => (
              <div
                key={s.id}
                className="flex-1 min-w-[210px] rounded-2xl border border-border/80 bg-muted/20 p-3 space-y-3 animate-pulse"
              >
                <div className="h-6 w-24 bg-muted rounded" />
                <div className="h-28 bg-card rounded-xl border border-border/60" />
                <div className="h-28 bg-card rounded-xl border border-border/60" />
              </div>
            ))}
          </div>
        ) : filteredDeals.length === 0 && searchQuery ? (
          <div className="p-8 text-center bg-card rounded-2xl border border-border/80 space-y-3 my-2">
            <Search className="w-10 h-10 text-muted-foreground mx-auto" />
            <h4 className="text-sm font-bold text-foreground">
              Nenhuma oportunidade encontrada para "{searchQuery}"
            </h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Tente pesquisar por outro termo ou limpe os filtros para visualizar todas as
              oportunidades do funil.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setSelectedSource('all')
              }}
              className="rounded-xl text-xs h-9 min-h-[40px]"
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="flex gap-4 min-w-[1100px] sm:min-w-[1300px]">
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
                  className={`flex-1 min-w-[210px] rounded-2xl border transition-all duration-200 flex flex-col max-h-[750px] ${
                    isDropTarget
                      ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30 scale-[1.01]'
                      : 'border-border/80 bg-muted/20'
                  }`}
                >
                  {/* Cabeçalho da Coluna: Contagem e Valor Somado */}
                  <div className="p-3 border-b border-border/60 space-y-1.5 bg-card/80 backdrop-blur-xs rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: stage.color }}
                        />
                        <h4 className="font-bold text-xs text-foreground tracking-tight">
                          {stage.label}
                        </h4>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold px-2 py-0.5 h-5 bg-background border-border/80"
                      >
                        {stageDeals.length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5 border-t border-border/40">
                      <span className="font-medium text-[10px] uppercase tracking-wider">
                        Subtotal:
                      </span>
                      <span
                        className="font-black font-mono text-foreground text-xs"
                        title={`R$ ${stageTotalValue.toLocaleString('pt-BR')}`}
                      >
                        R$ {stageTotalValue.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Cards da Coluna */}
                  <div className="p-2 space-y-2.5 overflow-y-auto flex-1 scrollbar-thin min-h-[160px]">
                    {stageDeals.length === 0 && (
                      <div className="h-32 flex flex-col items-center justify-center text-center p-3 border border-dashed border-border/70 rounded-xl bg-card/30">
                        <p className="text-[11px] text-muted-foreground font-medium">
                          Nenhum deal nesta etapa
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          Arraste um card ou adicione
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenCreateModal(stage.id)}
                          className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline mt-2 flex items-center gap-1 min-h-[32px] px-2 py-1 rounded-lg"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Adicionar</span>
                        </button>
                      </div>
                    )}

                    {stageDeals.map((deal) => {
                      const isDragging = draggedDealId === deal.id
                      const priorityColor =
                        deal.priority === 'alta'
                          ? 'text-rose-600 bg-rose-500/10 border-rose-500/20'
                          : deal.priority === 'media'
                            ? 'text-amber-600 bg-amber-500/10 border-amber-500/20'
                            : 'text-slate-600 bg-slate-500/10 border-slate-500/20'

                      return (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, deal.id)}
                          className={`p-3 rounded-xl bg-card border transition-all duration-150 cursor-grab active:cursor-grabbing hover:border-purple-500/60 hover:shadow-md space-y-2.5 select-none ${
                            isDragging
                              ? 'opacity-40 scale-95 shadow-inner border-dashed border-purple-400 ring-2 ring-purple-400/20'
                              : 'opacity-100 shadow-xs'
                          }`}
                        >
                          {/* Topo do Card: Origem & Prioridade & Menu */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {deal.source && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] font-bold px-1.5 py-0 h-4 bg-muted/80 text-muted-foreground border border-border/40"
                                >
                                  {deal.source}
                                </Badge>
                              )}
                              <span
                                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${priorityColor}`}
                              >
                                {deal.priority || 'média'}
                              </span>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg -mr-1 -mt-1 shrink-0"
                                  aria-label="Ações do negócio"
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
                            <h5 className="font-bold text-xs text-foreground leading-snug line-clamp-2 hover:text-purple-600 transition-colors">
                              {deal.title}
                            </h5>
                            {deal.company && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 truncate font-medium">
                                <Building className="w-3 h-3 shrink-0 text-muted-foreground/70" />
                                <span>{deal.company}</span>
                              </p>
                            )}
                          </div>

                          {/* Valor em R$ & Responsável */}
                          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                            <span className="font-black text-purple-600 dark:text-purple-400 font-mono text-sm">
                              R${' '}
                              {(Number(deal.value) || 0).toLocaleString('pt-BR', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            {deal.responsible && (
                              <span
                                className="text-[10px] text-muted-foreground truncate max-w-[95px] bg-muted/50 px-1.5 py-0.5 rounded font-medium"
                                title={deal.responsible}
                              >
                                {deal.responsible.split(' ')[0]}
                              </span>
                            )}
                          </div>

                          {/* Data prevista ou notas */}
                          {(deal.expected_close_date || deal.notes) && (
                            <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground gap-1">
                              {deal.expected_close_date && (
                                <span className="flex items-center gap-1 font-mono shrink-0">
                                  <Calendar className="w-3 h-3 text-muted-foreground/70" />
                                  {new Date(deal.expected_close_date).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                  })}
                                </span>
                              )}
                              {deal.notes && (
                                <span
                                  className="truncate italic text-muted-foreground/80 max-w-[120px]"
                                  title={deal.notes}
                                >
                                  "{deal.notes}"
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Botão de adicionar direto na coluna */}
                  <div className="p-2 border-t border-border/60 bg-card/40 rounded-b-2xl">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenCreateModal(stage.id)}
                      className="w-full text-xs h-9 text-muted-foreground hover:text-foreground justify-center gap-1 rounded-xl min-h-[36px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="font-semibold">Adicionar Deal</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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

/**
 * Seção de Relatório Comparativo de Canais (Google Ads, Meta Ads, YouTube Ads, TikTok Ads e LinkedIn Ads)
 */
function ChannelComparisonSection({ deals }: { deals: FunnelDeal[] }) {
  const [platformMetrics, setPlatformMetrics] = useState<Record<string, any>>({
    google: {
      impressions: 48500,
      clicks: 1420,
      spent: 852.4,
      ctr: 2.93,
      cpc: 0.6,
      conversions: 38,
    },
    meta: { impressions: 62400, clicks: 1890, spent: 945.0, ctr: 3.03, cpc: 0.5, conversions: 52 },
    youtube: {
      impressions: 74200,
      clicks: 2150,
      spent: 1240.5,
      ctr: 2.9,
      cpc: 0.58,
      conversions: 46,
    },
    tiktok: {
      impressions: 89400,
      clicks: 3420,
      spent: 1368.0,
      ctr: 3.83,
      cpc: 0.4,
      conversions: 68,
    },
    linkedin: {
      impressions: 52800,
      clicks: 2160,
      spent: 1944.0,
      ctr: 4.1,
      cpc: 0.9,
      conversions: 54,
    },
  })
  const [organicLinkedIn, setOrganicLinkedIn] = useState<LinkedInOrganicData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadAggregatedMetrics() {
      setIsLoading(true)
      try {
        const [res, orgRes] = await Promise.all([
          pb.send('/backend/v1/ads/platform-metrics', { method: 'GET' }).catch(() => null),
          getLinkedInOrganicMetrics().catch(() => null),
        ])
        if (res && res.platforms) {
          const map: Record<string, any> = {}
          Object.keys(res.platforms).forEach((key) => {
            map[key] = res.platforms[key].metrics
          })
          setPlatformMetrics((prev) => ({ ...prev, ...map }))
        }
        if (orgRes) {
          setOrganicLinkedIn(orgRes)
        }
      } catch (err) {
        console.warn('Fallback no endpoint agregado de métricas de ads:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadAggregatedMetrics()
  }, [])

  // Leads do funil por canal
  const dealsByChannel = {
    google: deals.filter((d) => d.source === 'Google Ads'),
    meta: deals.filter((d) => d.source === 'Meta Ads'),
    youtube: deals.filter((d) => d.source === 'YouTube Ads'),
    tiktok: deals.filter((d) => d.source === 'TikTok Ads'),
    linkedin: deals.filter((d) => d.source === 'LinkedIn Ads'),
    pinterest: deals.filter((d) => d.source === 'Pinterest Ads'),
    x: deals.filter((d) => d.source === 'X Ads'),
  }

  const channelsData = [
    {
      id: 'google',
      name: 'Google Ads',
      tag: 'Search & Intent',
      color: '#4285F4',
      badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      impressions: platformMetrics.google?.impressions || 48500,
      clicks: platformMetrics.google?.clicks || 1420,
      ctr: platformMetrics.google?.ctr || 2.93,
      cpc: platformMetrics.google?.cpc || 0.6,
      spent: platformMetrics.google?.spent || 852.4,
      leads:
        dealsByChannel.google.length > 0
          ? dealsByChannel.google.length
          : platformMetrics.google?.conversions || 38,
      cpl:
        (platformMetrics.google?.spent || 852.4) /
        Math.max(
          1,
          dealsByChannel.google.length > 0
            ? dealsByChannel.google.length
            : platformMetrics.google?.conversions || 38,
        ),
      pipelineValue: dealsByChannel.google.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    },
    {
      id: 'meta',
      name: 'Meta Ads',
      tag: 'Instagram & Facebook',
      color: '#0668E1',
      badgeClass: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
      impressions: platformMetrics.meta?.impressions || 62400,
      clicks: platformMetrics.meta?.clicks || 1890,
      ctr: platformMetrics.meta?.ctr || 3.03,
      cpc: platformMetrics.meta?.cpc || 0.5,
      spent: platformMetrics.meta?.spent || 945.0,
      leads:
        dealsByChannel.meta.length > 0
          ? dealsByChannel.meta.length
          : platformMetrics.meta?.conversions || 52,
      cpl:
        (platformMetrics.meta?.spent || 945.0) /
        Math.max(
          1,
          dealsByChannel.meta.length > 0
            ? dealsByChannel.meta.length
            : platformMetrics.meta?.conversions || 52,
        ),
      pipelineValue: dealsByChannel.meta.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    },
    {
      id: 'youtube',
      name: 'YouTube Ads',
      tag: 'Video & In-Stream',
      color: '#FF0000',
      badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
      impressions: platformMetrics.youtube?.impressions || 74200,
      clicks: platformMetrics.youtube?.clicks || 2150,
      ctr: platformMetrics.youtube?.ctr || 2.9,
      cpc: platformMetrics.youtube?.cpc || 0.58,
      spent: platformMetrics.youtube?.spent || 1240.5,
      leads:
        dealsByChannel.youtube.length > 0
          ? dealsByChannel.youtube.length
          : platformMetrics.youtube?.conversions || 46,
      cpl:
        (platformMetrics.youtube?.spent || 1240.5) /
        Math.max(
          1,
          dealsByChannel.youtube.length > 0
            ? dealsByChannel.youtube.length
            : platformMetrics.youtube?.conversions || 46,
        ),
      pipelineValue: dealsByChannel.youtube.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    },
    {
      id: 'tiktok',
      name: 'TikTok Ads',
      tag: 'Short Video Discovery',
      color: '#00F2FE',
      badgeClass: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
      impressions: platformMetrics.tiktok?.impressions || 89400,
      clicks: platformMetrics.tiktok?.clicks || 3420,
      ctr: platformMetrics.tiktok?.ctr || 3.83,
      cpc: platformMetrics.tiktok?.cpc || 0.4,
      spent: platformMetrics.tiktok?.spent || 1368.0,
      leads:
        dealsByChannel.tiktok.length > 0
          ? dealsByChannel.tiktok.length
          : platformMetrics.tiktok?.conversions || 68,
      cpl:
        (platformMetrics.tiktok?.spent || 1368.0) /
        Math.max(
          1,
          dealsByChannel.tiktok.length > 0
            ? dealsByChannel.tiktok.length
            : platformMetrics.tiktok?.conversions || 68,
        ),
      pipelineValue: dealsByChannel.tiktok.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Ads',
      tag: 'B2B & Decisores',
      color: '#0A66C2',
      badgeClass: 'bg-[#0A66C2]/15 text-[#0A66C2] dark:text-blue-400 border-[#0A66C2]/30',
      impressions: platformMetrics.linkedin?.impressions || 52800,
      clicks: platformMetrics.linkedin?.clicks || 2160,
      ctr: platformMetrics.linkedin?.ctr || 4.1,
      cpc: platformMetrics.linkedin?.cpc || 0.9,
      spent: platformMetrics.linkedin?.spent || 1944.0,
      leads:
        dealsByChannel.linkedin.length > 0
          ? dealsByChannel.linkedin.length
          : platformMetrics.linkedin?.conversions || 54,
      cpl:
        (platformMetrics.linkedin?.spent || 1944.0) /
        Math.max(
          1,
          dealsByChannel.linkedin.length > 0
            ? dealsByChannel.linkedin.length
            : platformMetrics.linkedin?.conversions || 54,
        ),
      pipelineValue: dealsByChannel.linkedin.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    },
    {
      id: 'pinterest',
      name: 'Pinterest Ads',
      tag: 'Visual Search & Shopping',
      color: '#E60023',
      badgeClass: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
      impressions: platformMetrics.pinterest?.impressions || 68400,
      clicks: platformMetrics.pinterest?.clicks || 2380,
      ctr: platformMetrics.pinterest?.ctr || 3.48,
      cpc: platformMetrics.pinterest?.cpc || 0.35,
      spent: platformMetrics.pinterest?.spent || 833.0,
      leads:
        dealsByChannel.pinterest.length > 0
          ? dealsByChannel.pinterest.length
          : platformMetrics.pinterest?.conversions || 42,
      cpl:
        (platformMetrics.pinterest?.spent || 833.0) /
        Math.max(
          1,
          dealsByChannel.pinterest.length > 0
            ? dealsByChannel.pinterest.length
            : platformMetrics.pinterest?.conversions || 42,
        ),
      pipelineValue: dealsByChannel.pinterest.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    },
    {
      id: 'x',
      name: 'X (Twitter) Ads',
      tag: 'Real-time & Trends',
      color: '#000000',
      badgeClass: 'bg-zinc-800/15 text-foreground border-zinc-700/40',
      impressions: platformMetrics.x?.impressions || 58200,
      clicks: platformMetrics.x?.clicks || 1740,
      ctr: platformMetrics.x?.ctr || 2.99,
      cpc: platformMetrics.x?.cpc || 0.55,
      spent: platformMetrics.x?.spent || 957.0,
      leads:
        dealsByChannel.x.length > 0
          ? dealsByChannel.x.length
          : platformMetrics.x?.conversions || 35,
      cpl:
        (platformMetrics.x?.spent || 957.0) /
        Math.max(
          1,
          dealsByChannel.x.length > 0
            ? dealsByChannel.x.length
            : platformMetrics.x?.conversions || 35,
        ),
      pipelineValue: dealsByChannel.x.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    },
  ]

  // Identificação dos canais campeões por métrica
  const bestCtr = [...channelsData].sort((a, b) => b.ctr - a.ctr)[0]
  const bestCpc = [...channelsData].sort((a, b) => a.cpc - b.cpc)[0]
  const lowestCpl = [...channelsData].sort((a, b) => a.cpl - b.cpl)[0]
  const highestLeads = [...channelsData].sort((a, b) => b.leads - a.leads)[0]

  // Exportação CSV do comparativo
  const handleExportCSV = () => {
    const headers = [
      'Canal',
      'Segmento / Tag',
      'Impressões',
      'Cliques',
      'CTR (%)',
      'CPC Médio (R$)',
      'Investimento Total (R$)',
      'Leads Gerados',
      'CPL Médio (R$)',
      'Pipeline Comercial Gerado (R$)',
    ]

    const rows = channelsData.map((c) => [
      `"${c.name}"`,
      `"${c.tag}"`,
      c.impressions,
      c.clicks,
      c.ctr.toFixed(2),
      c.cpc.toFixed(2),
      c.spent.toFixed(2),
      c.leads,
      c.cpl.toFixed(2),
      c.pipelineValue.toFixed(2),
    ])

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `relatorio-comparativo-7-canais-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Relatório CSV exportado!',
      description: 'Comparativo dos canais de tráfego baixado com sucesso.',
    })
  }

  // Impressão / Exportação PDF (Padrão nativo do navegador para PDF limpo e diagramado)
  const handleExportPDF = () => {
    window.print()
    toast({
      title: 'Relatório pronto para impressão/PDF',
      description: 'Selecione "Salvar como PDF" no diálogo de impressão.',
    })
  }

  return (
    <Card className="p-5 rounded-3xl border border-border/90 bg-card shadow-xs space-y-5">
      {/* Topo do Relatório */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-foreground">
              Relatório Comparativo de Canais de Tráfego Pago
            </h3>
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
              7 Redes
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Avaliação comparativa lado a lado de Google Ads, Meta Ads, YouTube Ads, TikTok Ads,
            LinkedIn Ads, Pinterest Ads e X Ads com destaque dos campeões de eficiência.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl text-xs h-9 px-3 gap-1.5 min-h-[36px]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar CSV</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="rounded-xl text-xs h-9 px-3 gap-1.5 min-h-[36px]"
          >
            <Printer className="w-3.5 h-3.5 text-purple-600" />
            <span>Imprimir / PDF</span>
          </Button>
        </div>
      </div>

      {/* Cards de Destaque dos Melhores Canais por Métrica */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-card to-card border border-emerald-500/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Menor CPL (Custo/Lead)
            </span>
            <Crown className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-sm sm:text-base font-black text-foreground">{lowestCpl.name}</p>
          <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            R$ {lowestCpl.cpl.toFixed(2)} / lead
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 via-card to-card border border-blue-500/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Melhor CTR (Cliques/Imp)
            </span>
            <Award className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-sm sm:text-base font-black text-foreground">{bestCtr.name}</p>
          <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
            {bestCtr.ctr.toFixed(2)}% CTR
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-card to-card border border-cyan-500/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Menor CPC (Custo/Clique)
            </span>
            <Award className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <p className="text-sm sm:text-base font-black text-foreground">{bestCpc.name}</p>
          <p className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
            R$ {bestCpc.cpc.toFixed(2)} / clique
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/10 via-card to-card border border-purple-500/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Mais Leads Gerados
            </span>
            <Crown className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <p className="text-sm sm:text-base font-black text-foreground">{highestLeads.name}</p>
          <p className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
            {highestLeads.leads} oportunidades
          </p>
        </div>
      </div>

      {/* Tabela Comparativa Completa dos Canais */}
      <div className="overflow-x-auto rounded-2xl border border-border/80">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted/50 text-[11px] font-bold text-muted-foreground uppercase border-b border-border/80">
            <tr>
              <th className="p-3">Canal</th>
              <th className="p-3 text-right">Impressões</th>
              <th className="p-3 text-right">Cliques</th>
              <th className="p-3 text-right">CTR</th>
              <th className="p-3 text-right">CPC Médio</th>
              <th className="p-3 text-right">Investimento</th>
              <th className="p-3 text-right">Leads</th>
              <th className="p-3 text-right">CPL Médio</th>
              <th className="p-3 text-right">Pipeline Criado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {channelsData.map((c) => {
              const isBestCpl = c.id === lowestCpl.id
              const isBestCtr = c.id === bestCtr.id
              const isBestCpc = c.id === bestCpc.id
              const isHighestLeads = c.id === highestLeads.id

              return (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-bold text-foreground">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{c.name}</span>
                          {c.id === 'linkedin' && (
                            <Badge className="bg-[#0A66C2] text-white text-[9px] px-1 py-0 h-4">
                              B2B
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-normal block">
                          {c.tag}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono text-muted-foreground">
                    {c.impressions.toLocaleString('pt-BR')}
                  </td>
                  <td className="p-3 text-right font-mono text-muted-foreground">
                    {c.clicks.toLocaleString('pt-BR')}
                  </td>
                  <td className="p-3 text-right font-mono">
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        isBestCtr ? 'bg-blue-500/15 text-blue-600' : 'text-foreground'
                      }`}
                    >
                      {c.ctr.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono">
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        isBestCpc ? 'bg-cyan-500/15 text-cyan-600' : 'text-foreground'
                      }`}
                    >
                      R$ {c.cpc.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-foreground">
                    R$ {c.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right font-mono">
                    <span
                      className={`px-1.5 py-0.5 rounded font-black ${
                        isHighestLeads ? 'bg-purple-500/15 text-purple-600' : 'text-foreground'
                      }`}
                    >
                      {c.leads}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono">
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        isBestCpl ? 'bg-emerald-500/15 text-emerald-600' : 'text-foreground'
                      }`}
                    >
                      R$ {c.cpl.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                    R$ {c.pipelineValue.toLocaleString('pt-BR')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Nota de Integração B2B & Comparativo com LinkedIn Orgânico */}
      {organicLinkedIn && (
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0A66C2]" />
              Sinergia B2B: LinkedIn Orgânico & Suporte ao Funil
            </span>
            <p className="text-[11px] text-muted-foreground">
              Além dos anúncios pagos (
              {platformMetrics.linkedin?.impressions?.toLocaleString('pt-BR')} imp.), seu
              perfil/company page gerou{' '}
              <strong>
                {organicLinkedIn.metrics.impressions.toLocaleString('pt-BR')} impressões orgânicas
              </strong>{' '}
              e{' '}
              <strong>
                {organicLinkedIn.metrics.clicks.toLocaleString('pt-BR')} cliques orgânicos
              </strong>{' '}
              gratuitos com taxa de engajamento de {organicLinkedIn.metrics.engagement_rate}%.
            </p>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 text-[10px] font-bold border-[#0A66C2]/40 text-[#0A66C2] bg-blue-500/5"
          >
            {organicLinkedIn.badge_label ||
              (organicLinkedIn.is_official ? 'Dados Oficiais' : 'Estimativa Calibrada')}
          </Badge>
        </div>
      )}
    </Card>
  )
}
