import { pb } from '@/lib/pocketbase/client'
import { getOrganizationSettings, saveOrganizationSettings } from './organization-settings'

export interface MasterFeatureToggles {
  ai_media_studio: boolean
  second_brain: boolean
  analytics_performance: boolean
  crm_pipeline: boolean
  calendar_scheduler: boolean
  client_portal: boolean
  community: boolean
  academy: boolean
  journey_gamification: boolean
  notifications_center: boolean
  // Módulos adicionais úteis
  ads_manager: boolean
  seo_tools: boolean
}

export const DEFAULT_MASTER_FEATURES: MasterFeatureToggles = {
  ai_media_studio: true,
  second_brain: true,
  analytics_performance: true,
  crm_pipeline: true,
  calendar_scheduler: true,
  client_portal: true,
  community: true,
  academy: true,
  journey_gamification: true,
  notifications_center: true,
  ads_manager: true,
  seo_tools: true,
}

export interface MasterFeatureMeta {
  key: keyof MasterFeatureToggles
  title: string
  description: string
  category: 'criacao' | 'negocio' | 'engajamento' | 'sistema'
  badge?: string
  path?: string
}

export const MASTER_FEATURES_LIST: MasterFeatureMeta[] = [
  {
    key: 'ai_media_studio',
    title: 'AI Media Studio & Criação de Mídia',
    description: 'Gerador inteligente de imagens, vídeos, áudios e templates de IA.',
    category: 'criacao',
    badge: 'Core IA',
    path: '/app/ai-studio',
  },
  {
    key: 'second_brain',
    title: 'Segundo Cérebro & Documentação',
    description: 'Gestor de conhecimento, notas estruturadas, bases de conteúdo e conectores.',
    category: 'criacao',
    badge: 'IA & Docs',
    path: '/app/second-brain',
  },
  {
    key: 'analytics_performance',
    title: 'Analytics & Performance Avançada',
    description:
      'Painel com métricas consolidadas, relatórios customizados, taxa de engajamento e exportação CSV.',
    category: 'negocio',
    badge: 'Métricas',
    path: '/app/performance',
  },
  {
    key: 'crm_pipeline',
    title: 'CRM, Funil de Vendas & Contatos',
    description:
      'Gestão de leads, etapas de funil configuráveis, automações e histórico de interações.',
    category: 'negocio',
    badge: 'Vendas',
    path: '/app/crm',
  },
  {
    key: 'calendar_scheduler',
    title: 'Calendário & Agendamento em Massa',
    description: 'Planejamento editorial, agendamento de posts com recorrência e fila inteligente.',
    category: 'negocio',
    badge: 'Automação',
    path: '/app/calendar',
  },
  {
    key: 'client_portal',
    title: 'Portal do Cliente & Aprovações',
    description:
      'Área externa para clientes revisarem e aprovarem publicações com histórico auditado.',
    category: 'negocio',
    badge: 'Agência',
    path: '/app/portal-cliente',
  },
  {
    key: 'community',
    title: 'Comunidade de Criadores',
    description: 'Fórum de criadores, tópicos compartilhados, curtidas e trocas de experiências.',
    category: 'engajamento',
    badge: 'Social',
    path: '/app/comunidade',
  },
  {
    key: 'academy',
    title: 'Academy & Módulos de Aprendizado',
    description: 'Aulas, treinamentos, trilhas de crescimento e materiais educativos.',
    category: 'engajamento',
    badge: 'Educação',
    path: '/app/students',
  },
  {
    key: 'journey_gamification',
    title: 'Jornada, Níveis & Conquistas',
    description: 'Gamificação, badges, pontos de experiência (XP), missões diárias e ranking.',
    category: 'engajamento',
    badge: 'XP & Badges',
    path: '/app/jornada',
  },
  {
    key: 'notifications_center',
    title: 'Central de Notificações Inteligente',
    description:
      'Avisos em tempo real de aprovações, conquistas, comentários e alertas do sistema.',
    category: 'sistema',
    badge: 'Realtime',
  },
  {
    key: 'ads_manager',
    title: 'Gestor de Anúncios Multirede (Ads)',
    description:
      'Metas, campanhas de tráfego, orçamentos e conversões de Meta, Google, TikTok e LinkedIn Ads.',
    category: 'negocio',
    badge: 'Tráfego',
    path: '/app/ads',
  },
  {
    key: 'seo_tools',
    title: 'Ferramentas de SEO e Auditoria de Posts',
    description: 'Análise de gancho, densidade de hashtags, legibilidade e score de busca.',
    category: 'criacao',
    badge: 'SEO',
    path: '/app/seo',
  },
]

const LOCAL_STORAGE_MASTER_KEY = 'midiaviva_master_features_toggles'

export async function getMasterFeatures(brandId?: string): Promise<MasterFeatureToggles> {
  // 1. Tenta carregar do localStorage primeiro para resposta instantânea
  let cached: Partial<MasterFeatureToggles> = {}
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MASTER_KEY)
    if (raw) {
      cached = JSON.parse(raw)
    }
  } catch {
    /* ignore */
  }

  try {
    const org = await getOrganizationSettings(brandId)
    const remoteToggles = org?.extra_settings?.master_features || {}
    const merged: MasterFeatureToggles = {
      ...DEFAULT_MASTER_FEATURES,
      ...cached,
      ...remoteToggles,
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_MASTER_KEY, JSON.stringify(merged))
    } catch {
      /* ignore */
    }

    return merged
  } catch (err) {
    console.warn('[master-features] Falha ao carregar do PocketBase, usando cache local:', err)
    return {
      ...DEFAULT_MASTER_FEATURES,
      ...cached,
    }
  }
}

export async function saveMasterFeatures(
  toggles: MasterFeatureToggles,
  brandId?: string,
): Promise<MasterFeatureToggles> {
  // Salva no localStorage imediatamente
  try {
    localStorage.setItem(LOCAL_STORAGE_MASTER_KEY, JSON.stringify(toggles))
    window.dispatchEvent(new CustomEvent('midiaviva:master-features-updated', { detail: toggles }))
  } catch {
    /* ignore */
  }

  try {
    const org = await getOrganizationSettings(brandId)
    const updatedExtra = {
      ...(org.extra_settings || {}),
      master_features: toggles,
      master_features_updated_at: new Date().toISOString(),
      master_user_id: pb.authStore.record?.id || '',
    }

    await saveOrganizationSettings({
      id: org.id,
      brand: brandId || org.brand,
      extra_settings: updatedExtra,
    })

    return toggles
  } catch (err) {
    console.warn('[master-features] Falha ao persistir no PocketBase, mantido localmente:', err)
    return toggles
  }
}
