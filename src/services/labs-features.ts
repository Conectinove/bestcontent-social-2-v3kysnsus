export type FeatureStatus = 'estavel' | 'beta' | 'experimental'

export interface LabFeature {
  id: string
  title: string
  subtitle: string
  description: string
  detailedNotes: string
  status: FeatureStatus
  version: string
  category: 'Editor & Canvas' | 'Identidade Visual' | 'Otimização & IA' | 'Métricas & Relatórios'
  targetRoute: string
  targetLabel: string
  defaultEnabled: boolean
  updatedAt: string
  author: string
  readTime: string
  metricsEffect?: string
}

export const LAB_FEATURES: LabFeature[] = [
  {
    id: 'canvas-advanced-customization',
    title: 'Editor Avançado do Canvas',
    subtitle: 'Presets de estilo, gradientes dinâmicos, filtros de brilho/contraste e tipografia',
    description:
      'Desbloqueia os controles finos de renderização de imagem: modos de degradê (linear/radial), saturação, nitidez, sobreposição de cor com opacidade ajustável e checklist de melhores práticas em tempo real.',
    detailedNotes:
      'Habilita o AdvancedCustomizationPanel no editor de posts (/app/editor/:id) com suporte a 4 presets autorais e cálculo de proporções de contraste visual.',
    status: 'estavel',
    version: 'v2.4',
    category: 'Editor & Canvas',
    targetRoute: '/app/editor/new',
    targetLabel: 'Abrir no Editor',
    defaultEnabled: true,
    updatedAt: '18 de Fevereiro, 2026',
    author: 'Time de Core Canvas',
    readTime: '3 min de leitura',
    metricsEffect: '+38% de retenção visual nas artes com filtros calibrados',
  },
  {
    id: 'brand-kit-logo-editor',
    title: 'Brand Kit — Edição Avançada de Logo',
    subtitle: "Color pickers hexadecimais, escala percentual, área de proteção e marca d'água",
    description:
      'Permite personalizar parâmetros vetoriais ao vivo no Logo Kit oficial da MudarCurso: troca de cores primária e neon, alinhamento horizontal, guias de margem segura (X) e carimbo de rascunho interno.',
    detailedNotes:
      'Controla o modal AdvancedLogoEditorModal integrado ao MudarCursoLogoKit em /app/brand-kit, persistindo modificações na conta do usuário.',
    status: 'estavel',
    version: 'v2.1',
    category: 'Identidade Visual',
    targetRoute: '/app/brand-kit',
    targetLabel: 'Abrir no Brand Kit',
    defaultEnabled: true,
    updatedAt: '15 de Fevereiro, 2026',
    author: 'Design Systems MidiaViva',
    readTime: '4 min de leitura',
    metricsEffect: '100% de conformidade com diretrizes da marca em exports',
  },
  {
    id: 'seo-social-widget',
    title: 'Widget SEO Social no Editor',
    subtitle:
      'Score de encontrabilidade, análise de ganchos, keywords multicamada e checklist por rede',
    description:
      'Avalia o potencial orgânico da legenda em Instagram, TikTok, LinkedIn, Twitter e YouTube com nota de 0 a 100, sugestões de primeira linha antes do "...mais" e distribuição de tags por intenção.',
    detailedNotes:
      'Integra o componente PostSeoWidget nas telas de criação (/app/content/new) e edição (/app/editor/:id), oferecendo reescrita assistida com 1 clique.',
    status: 'beta',
    version: 'v1.8',
    category: 'Otimização & IA',
    targetRoute: '/app/seo',
    targetLabel: 'Explorar Ferramentas SEO',
    defaultEnabled: true,
    updatedAt: '12 de Fevereiro, 2026',
    author: 'Laboratório de Descoberta Orgânica',
    readTime: '5 min de leitura',
    metricsEffect: 'Até +42% de alcance em termos não-seguidores',
  },
  {
    id: 'ai-voice-tone-engine',
    title: 'Sugestões de IA com Tom de Voz',
    subtitle: 'Geração adaptativa de legendas calibrada pelo tom do perfil ou marca ativa',
    description:
      'Alinha o motor BestContent AI ao tom selecionado (Profissional, Espirituoso, Inspirador, Urgente ou Didático), injetando o contexto do nicho diretamente nas instruções de prompt.',
    detailedNotes:
      'Persiste a preferência de tom no navegador e orienta os disparos do assistente tanto no editor guiado quanto no hub de criação rápida.',
    status: 'beta',
    version: 'v2.0',
    category: 'Otimização & IA',
    targetRoute: '/app/criar',
    targetLabel: 'Testar no Criador',
    defaultEnabled: true,
    updatedAt: '09 de Fevereiro, 2026',
    author: 'Equipe BestContent AI',
    readTime: '2 min de leitura',
    metricsEffect: 'Redução de 65% no tempo de revisão de copys',
  },
  {
    id: 'network-hashtag-generator',
    title: 'Gerador de Hashtags por Rede',
    subtitle: 'Calibração algorítmica de tags para Instagram, TikTok, LinkedIn, YouTube e X',
    description:
      'Sugere conjuntos precisos de hashtags respeitando a janela recomendada de cada algoritmo (ex.: 3-5 tags no LinkedIn vs 8-12 no Instagram), evitando penalizações de alcance.',
    detailedNotes:
      'Componente NetworkHashtagGenerator plugado na tela de criação de post com botão de inserção em 1 clique no rodapé do texto.',
    status: 'estavel',
    version: 'v1.5',
    category: 'Otimização & IA',
    targetRoute: '/app/content/new',
    targetLabel: 'Novo Conteúdo',
    defaultEnabled: true,
    updatedAt: '04 de Fevereiro, 2026',
    author: 'Laboratório de Redes Sociais',
    readTime: '3 min de leitura',
    metricsEffect: 'Zero alertas de shadowban ou excesso de tags',
  },
  {
    id: 'campaign-review-mode',
    title: 'Modo Revisão de Campanhas',
    subtitle:
      'Checklist de conferência de peças multi-formato, status de aprovação e contadores de pendências',
    description:
      'Ativa a esteira de controle de qualidade na Biblioteca (/app/library), permitindo marcar peças como revisadas individualmente e agrupar por formato de campanha.',
    detailedNotes:
      'Facilita a validação de grandes volumes de peças geradas pelo gerador multi-formato antes do disparo para agendamento.',
    status: 'experimental',
    version: 'v0.9',
    category: 'Editor & Canvas',
    targetRoute: '/app/library',
    targetLabel: 'Abrir Biblioteca',
    defaultEnabled: true,
    updatedAt: '28 de Janeiro, 2026',
    author: 'Time de Fluxo de Trabalho',
    readTime: '4 min de leitura',
    metricsEffect: '99.4% de precisão antes da publicação final',
  },
  {
    id: 'custom-reports-modular',
    title: 'Personalização Modular de Relatórios',
    subtitle:
      'Filtro granular de módulos executivos, demografia, concorrentes e exportação seletiva',
    description:
      'Dá controle total sobre quais seções compõem os relatórios de performance (PDF e CSV): KPIs executivos, benchmarking de mercado, testes A/B e evolução temporal.',
    detailedNotes:
      'Integrado ao CustomizeReportModal na central de Analytics (/app/analytics), salvando presets para a geração de dossiês a clientes.',
    status: 'beta',
    version: 'v1.2',
    category: 'Métricas & Relatórios',
    targetRoute: '/app/analytics',
    targetLabel: 'Abrir Analytics',
    defaultEnabled: true,
    updatedAt: '22 de Janeiro, 2026',
    author: 'Métricas & BI',
    readTime: '3 min de leitura',
    metricsEffect: 'Economia de 3h semanais na montagem de relatórios',
  },
]

export const LABS_STORAGE_KEY = 'midiaviva_labs_features_state'

export function getLabsFeatureState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LABS_STORAGE_KEY)
    if (!raw) {
      const defaults: Record<string, boolean> = {}
      LAB_FEATURES.forEach((f) => {
        defaults[f.id] = f.defaultEnabled
      })
      return defaults
    }
    const parsed = JSON.parse(raw)
    // Garantir que todas as features tenham valor booleano
    const merged: Record<string, boolean> = {}
    LAB_FEATURES.forEach((f) => {
      merged[f.id] = typeof parsed[f.id] === 'boolean' ? parsed[f.id] : f.defaultEnabled
    })
    return merged
  } catch {
    const fallback: Record<string, boolean> = {}
    LAB_FEATURES.forEach((f) => {
      fallback[f.id] = f.defaultEnabled
    })
    return fallback
  }
}

export function setLabFeatureEnabled(featureId: string, enabled: boolean): Record<string, boolean> {
  const current = getLabsFeatureState()
  const next = { ...current, [featureId]: enabled }
  try {
    localStorage.setItem(LABS_STORAGE_KEY, JSON.stringify(next))
    // Dispara evento customizado para sincronização na mesma aba
    window.dispatchEvent(
      new CustomEvent('midiaviva_labs_state_changed', {
        detail: { featureId, enabled, state: next },
      }),
    )
  } catch (err) {
    console.error('Falha ao salvar estado dos Labs no localStorage', err)
  }
  return next
}

export function setAllLabFeaturesEnabled(enabled: boolean): Record<string, boolean> {
  const next: Record<string, boolean> = {}
  LAB_FEATURES.forEach((f) => {
    next[f.id] = enabled
  })
  try {
    localStorage.setItem(LABS_STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(
      new CustomEvent('midiaviva_labs_state_changed', {
        detail: { all: true, enabled, state: next },
      }),
    )
  } catch (err) {
    console.error('Falha ao salvar estado em lote dos Labs no localStorage', err)
  }
  return next
}

export function isLabFeatureEnabled(featureId: string, defaultFallback = true): boolean {
  if (typeof window === 'undefined') return defaultFallback
  const state = getLabsFeatureState()
  return typeof state[featureId] === 'boolean' ? state[featureId] : defaultFallback
}
