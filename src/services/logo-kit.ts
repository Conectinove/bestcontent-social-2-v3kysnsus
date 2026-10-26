import pb from '@/lib/pocketbase/client'

export type LogoVariationKind = 'primary' | 'light' | 'mono-dark' | 'mark'

export interface LogoKitVariationConfig {
  kind: LogoVariationKind
  title: string
  subtitle: string
  description: string
  primaryColor: string
  secondaryColor: string
  monoColor: string
  symbolSize: number // escala % (ex: 100)
  logoPosition: 'center' | 'left' | 'right'
  altText: string
  fileNameCustom: string
  showSafeArea: boolean
  draftWatermark: boolean
  transparentBg: boolean
  bgChoice: 'transparent' | 'light' | 'dark' | 'violet'
}

export interface LogoKitEditRecord {
  id?: string
  user?: string
  brand?: string
  variation_kind: LogoVariationKind
  primary_color?: string
  secondary_color?: string
  mono_color?: string
  symbol_size?: number
  logo_position?: string
  alt_text?: string
  file_name_custom?: string
  show_safe_area?: boolean
  draft_watermark?: boolean
  transparent_bg?: boolean
  config_json?: any
}

export const DEFAULT_LOGO_CONFIGS: Record<LogoVariationKind, LogoKitVariationConfig> = {
  primary: {
    kind: 'primary',
    title: 'Logo MudarCurso · Primária',
    subtitle: 'Seta neon com pessoas e nome MUDARCURSO em violeta e rosa.',
    description: 'Logo oficial colorida sobre fundo claro.',
    primaryColor: '#5B21B6', // violeta oficial
    secondaryColor: '#FF2E93', // rosa neon de destaque
    monoColor: '#5B21B6',
    symbolSize: 100,
    logoPosition: 'center',
    altText: 'Logo oficial MudarCurso Primária colorida',
    fileNameCustom: 'mudarcurso-logo-primaria',
    showSafeArea: false,
    draftWatermark: false,
    transparentBg: true,
    bgChoice: 'transparent',
  },
  light: {
    kind: 'light',
    title: 'Logo MudarCurso · Neon · fundo escuro',
    subtitle: 'Cores originais da logo enviada, preservadas sobre fundo escuro.',
    description: 'Logo oficial com elementos em neon e wordmark claro para fundos escuros/violeta.',
    primaryColor: '#C44BFF',
    secondaryColor: '#FF7BC1',
    monoColor: '#FFFFFF',
    symbolSize: 100,
    logoPosition: 'center',
    altText: 'Logo oficial MudarCurso Neon sobre fundo escuro',
    fileNameCustom: 'mudarcurso-logo-neon-escuro',
    showSafeArea: false,
    draftWatermark: false,
    transparentBg: true,
    bgChoice: 'transparent',
  },
  'mono-dark': {
    kind: 'mono-dark',
    title: 'Logo MudarCurso · Monocromática',
    subtitle: 'Uma única cor para aplicações restritivas, carimbo ou impressão técnica.',
    description: 'Versão em cor única sem degradês para gravação, corte laser ou impressão 1x0.',
    primaryColor: '#0F0B1F',
    secondaryColor: '#0F0B1F',
    monoColor: '#0F0B1F',
    symbolSize: 100,
    logoPosition: 'center',
    altText: 'Logo oficial MudarCurso Monocromática',
    fileNameCustom: 'mudarcurso-logo-monocromatica',
    showSafeArea: false,
    draftWatermark: false,
    transparentBg: true,
    bgChoice: 'transparent',
  },
  mark: {
    kind: 'mark',
    title: 'Logo MudarCurso · Símbolo (Mark)',
    subtitle: 'Apenas o símbolo, para avatares, favicons e usos compactos.',
    description: 'Ícone isolado da seta neon com pessoas para ícones de app, favicon e perfil.',
    primaryColor: '#5B21B6',
    secondaryColor: '#FF2E93',
    monoColor: '#5B21B6',
    symbolSize: 110,
    logoPosition: 'center',
    altText: 'Símbolo oficial MudarCurso Mark',
    fileNameCustom: 'mudarcurso-simbolo-mark',
    showSafeArea: false,
    draftWatermark: false,
    transparentBg: true,
    bgChoice: 'transparent',
  },
}

export async function getSavedLogoKitEdits(
  userId?: string,
): Promise<Record<LogoVariationKind, Partial<LogoKitVariationConfig>>> {
  const result: Record<LogoVariationKind, Partial<LogoKitVariationConfig>> = {
    primary: {},
    light: {},
    'mono-dark': {},
    mark: {},
  }

  // Tenta carregar do localStorage primeiro como fallback rápido
  try {
    const rawLocal = localStorage.getItem('mudarcurso_logo_kit_edits')
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal)
      Object.assign(result, parsed)
    }
  } catch {
    /* intentionally ignored */
  }

  // Tenta sincronizar do PocketBase se houver usuário
  if (userId) {
    try {
      const records = await pb.collection('logo_kit_edits').getFullList<LogoKitEditRecord>({
        filter: `user = "${userId}"`,
      })
      records.forEach((rec) => {
        if (rec.variation_kind && result[rec.variation_kind]) {
          result[rec.variation_kind] = {
            ...result[rec.variation_kind],
            primaryColor: rec.primary_color,
            secondaryColor: rec.secondary_color,
            monoColor: rec.mono_color,
            symbolSize: rec.symbol_size,
            logoPosition: (rec.logo_position as any) || 'center',
            altText: rec.alt_text,
            fileNameCustom: rec.file_name_custom,
            showSafeArea: rec.show_safe_area,
            draftWatermark: rec.draft_watermark,
            transparentBg: rec.transparent_bg,
            ...(rec.config_json || {}),
          }
        }
      })
    } catch {
      /* intentionally ignored */
    }
  }

  return result
}

export async function saveLogoKitEdit(
  variationKind: LogoVariationKind,
  config: LogoKitVariationConfig,
  userId?: string,
  brandId?: string,
): Promise<void> {
  // 1. Salvar no localStorage
  try {
    const rawLocal = localStorage.getItem('mudarcurso_logo_kit_edits')
    const current = rawLocal ? JSON.parse(rawLocal) : {}
    current[variationKind] = config
    localStorage.setItem('mudarcurso_logo_kit_edits', JSON.stringify(current))
  } catch {
    /* intentionally ignored */
  }

  // 2. Persistir no PocketBase se autenticado
  if (userId) {
    try {
      const existing = await pb
        .collection('logo_kit_edits')
        .getFirstListItem(`user = "${userId}" && variation_kind = "${variationKind}"`)

      await pb.collection('logo_kit_edits').update(existing.id, {
        primary_color: config.primaryColor,
        secondary_color: config.secondaryColor,
        mono_color: config.monoColor,
        symbol_size: config.symbolSize,
        logo_position: config.logoPosition,
        alt_text: config.altText,
        file_name_custom: config.fileNameCustom,
        show_safe_area: config.showSafeArea,
        draft_watermark: config.draftWatermark,
        transparent_bg: config.transparentBg,
        config_json: config,
      })
    } catch {
      // Cria novo
      try {
        await pb.collection('logo_kit_edits').create({
          user: userId,
          brand: brandId || null,
          variation_kind: variationKind,
          primary_color: config.primaryColor,
          secondary_color: config.secondaryColor,
          mono_color: config.monoColor,
          symbol_size: config.symbolSize,
          logo_position: config.logoPosition,
          alt_text: config.altText,
          file_name_custom: config.fileNameCustom,
          show_safe_area: config.showSafeArea,
          draft_watermark: config.draftWatermark,
          transparent_bg: config.transparentBg,
          config_json: config,
        })
      } catch (err) {
        console.warn('Não foi possível salvar edição no PocketBase:', err)
      }
    }
  }
}
