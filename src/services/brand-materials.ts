import { pb } from '@/lib/pocketbase/client'
import {
  generateMudarCursoSvg,
  renderSvgToCanvas,
  triggerFileDownload,
  svgToDataUrl,
} from '@/services/mudarcurso-logo-svg'
import type { LogoKitVariationConfig } from '@/services/logo-kit'

export type BrandMaterialCategory =
  | 'variation'
  | 'social_cover'
  | 'badge'
  | 'watermark'
  | 'stamp'
  | 'custom'

export interface BrandKitMaterialItem {
  id: string
  title: string
  subtitle: string
  category: BrandMaterialCategory
  kindSlug: string
  fileNameCustom: string
  primaryColor: string
  secondaryColor: string
  monoColor: string
  symbolSize: number
  logoPosition: 'left' | 'center' | 'right'
  altText: string
  customText: string
  tagline: string
  layoutType: 'horizontal' | 'stacked' | 'symbol-only' | 'badge-round' | 'banner'
  showSafeArea: boolean
  draftWatermark: boolean
  transparentBg: boolean
  svgRaw?: string
  uploadedFileUrl?: string
  configJson?: Record<string, any>
  created?: string
  updated?: string
}

const LOCAL_STORAGE_MATERIALS_KEY = 'midiaviva_custom_brand_materials_v1'

/**
 * Lê materiais customizados salvos no PocketBase com fallback gracioso para localStorage
 */
export async function getBrandKitMaterials(userId?: string): Promise<BrandKitMaterialItem[]> {
  try {
    const filter = userId ? `user = "${userId}"` : ''
    const records = await pb.collection('brand_kit_materials').getFullList({
      filter: filter || undefined,
      sort: '-created',
    })

    if (records && records.length > 0) {
      return records.map((r: any) => ({
        id: r.id,
        title: r.title || 'Novo Material',
        subtitle: r.subtitle || 'Material customizado da marca',
        category: (r.category as BrandMaterialCategory) || 'custom',
        kindSlug: r.kind_slug || 'custom',
        fileNameCustom: r.file_name_custom || 'mudarcurso-material',
        primaryColor: r.primary_color || '#5B21B6',
        secondaryColor: r.secondary_color || '#FF2E93',
        monoColor: r.mono_color || '#0F0B1F',
        symbolSize: Number(r.symbol_size) || 100,
        logoPosition: (r.logo_position as any) || 'left',
        altText: r.alt_text || '',
        customText: r.custom_text || 'MudarCurso',
        tagline: r.tagline || 'TRANSFORMAÇÃO CONTÍNUA',
        layoutType: (r.layout_type as any) || 'horizontal',
        showSafeArea: Boolean(r.show_safe_area),
        draftWatermark: Boolean(r.draft_watermark),
        transparentBg: r.transparent_bg !== false,
        svgRaw: r.svg_raw || '',
        uploadedFileUrl: r.uploaded_file ? pb.files.getURL(r, r.uploaded_file) : undefined,
        configJson: r.config_json || {},
        created: r.created,
        updated: r.updated,
      }))
    }
  } catch (err) {
    console.warn(
      '[BrandKitMaterials] PocketBase inacessível ou não autenticado, lendo localStorage:',
      err,
    )
  }

  // Fallback seguro em localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MATERIALS_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // ignore
  }

  return []
}

/**
 * Cria ou atualiza um material customizado
 */
export async function saveBrandKitMaterial(
  material: Omit<BrandKitMaterialItem, 'id'> & { id?: string },
  userId?: string,
  uploadedFile?: File,
): Promise<BrandKitMaterialItem> {
  const payload: Record<string, any> = {
    title: material.title.trim(),
    subtitle: material.subtitle.trim(),
    category: material.category,
    kind_slug: material.kindSlug || 'custom',
    file_name_custom: material.fileNameCustom.trim() || 'mudarcurso-material',
    primary_color: material.primaryColor || '#5B21B6',
    secondary_color: material.secondaryColor || '#FF2E93',
    mono_color: material.monoColor || '#0F0B1F',
    symbol_size: material.symbolSize || 100,
    logo_position: material.logoPosition || 'left',
    alt_text: material.altText || '',
    custom_text: material.customText || 'MudarCurso',
    tagline: material.tagline || 'TRANSFORMAÇÃO CONTÍNUA',
    layout_type: material.layoutType || 'horizontal',
    show_safe_area: Boolean(material.showSafeArea),
    draft_watermark: Boolean(material.draftWatermark),
    transparent_bg: material.transparentBg !== false,
    svg_raw: material.svgRaw || '',
    config_json: material.configJson || {},
  }

  if (userId) {
    payload.user = userId
  }

  try {
    let savedRecord: any = null
    if (material.id && !material.id.startsWith('local_')) {
      if (uploadedFile) {
        const formData = new FormData()
        Object.entries(payload).forEach(([k, v]) => {
          if (typeof v === 'object' && v !== null) {
            formData.append(k, JSON.stringify(v))
          } else {
            formData.append(k, String(v))
          }
        })
        formData.append('uploaded_file', uploadedFile)
        savedRecord = await pb.collection('brand_kit_materials').update(material.id, formData)
      } else {
        savedRecord = await pb.collection('brand_kit_materials').update(material.id, payload)
      }
    } else {
      if (uploadedFile) {
        const formData = new FormData()
        Object.entries(payload).forEach(([k, v]) => {
          if (typeof v === 'object' && v !== null) {
            formData.append(k, JSON.stringify(v))
          } else {
            formData.append(k, String(v))
          }
        })
        formData.append('uploaded_file', uploadedFile)
        savedRecord = await pb.collection('brand_kit_materials').create(formData)
      } else {
        savedRecord = await pb.collection('brand_kit_materials').create(payload)
      }
    }

    const resultItem: BrandKitMaterialItem = {
      id: savedRecord.id,
      title: savedRecord.title,
      subtitle: savedRecord.subtitle,
      category: savedRecord.category as BrandMaterialCategory,
      kindSlug: savedRecord.kind_slug,
      fileNameCustom: savedRecord.file_name_custom,
      primaryColor: savedRecord.primary_color,
      secondaryColor: savedRecord.secondary_color,
      monoColor: savedRecord.mono_color,
      symbolSize: Number(savedRecord.symbol_size) || 100,
      logoPosition: (savedRecord.logo_position as any) || 'left',
      altText: savedRecord.alt_text,
      customText: savedRecord.custom_text,
      tagline: savedRecord.tagline,
      layoutType: (savedRecord.layout_type as any) || 'horizontal',
      showSafeArea: Boolean(savedRecord.show_safe_area),
      draftWatermark: Boolean(savedRecord.draft_watermark),
      transparentBg: Boolean(savedRecord.transparent_bg),
      svgRaw: savedRecord.svg_raw,
      uploadedFileUrl: savedRecord.uploaded_file
        ? pb.files.getURL(savedRecord, savedRecord.uploaded_file)
        : undefined,
      configJson: savedRecord.config_json,
      created: savedRecord.created,
      updated: savedRecord.updated,
    }

    // Atualiza também o cache local
    syncItemToLocalStorage(resultItem)
    return resultItem
  } catch (err) {
    console.warn('[BrandKitMaterials] Falha no PocketBase, salvando em localStorage:', err)
    const localId = material.id || `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const localItem: BrandKitMaterialItem = {
      id: localId,
      title: material.title,
      subtitle: material.subtitle,
      category: material.category,
      kindSlug: material.kindSlug || 'custom',
      fileNameCustom: material.fileNameCustom,
      primaryColor: material.primaryColor,
      secondaryColor: material.secondaryColor,
      monoColor: material.monoColor,
      symbolSize: material.symbolSize,
      logoPosition: material.logoPosition,
      altText: material.altText,
      customText: material.customText,
      tagline: material.tagline,
      layoutType: material.layoutType,
      showSafeArea: material.showSafeArea,
      draftWatermark: material.draftWatermark,
      transparentBg: material.transparentBg,
      svgRaw: material.svgRaw,
      uploadedFileUrl: material.uploadedFileUrl,
      configJson: material.configJson,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
    syncItemToLocalStorage(localItem)
    return localItem
  }
}

/**
 * Remove um material customizado
 */
export async function deleteBrandKitMaterial(id: string): Promise<boolean> {
  let pbSuccess = false
  if (!id.startsWith('local_')) {
    try {
      await pb.collection('brand_kit_materials').delete(id)
      pbSuccess = true
    } catch (err) {
      console.warn('[BrandKitMaterials] Erro ao deletar no PocketBase:', err)
    }
  }

  // Deleta do localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MATERIALS_KEY)
    if (raw) {
      const items: BrandKitMaterialItem[] = JSON.parse(raw)
      const next = items.filter((x) => x.id !== id)
      localStorage.setItem(LOCAL_STORAGE_MATERIALS_KEY, JSON.stringify(next))
    }
  } catch {
    // ignore
  }

  return pbSuccess || true
}

function syncItemToLocalStorage(item: BrandKitMaterialItem) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MATERIALS_KEY)
    let list: BrandKitMaterialItem[] = raw ? JSON.parse(raw) : []
    const idx = list.findIndex((x) => x.id === item.id)
    if (idx >= 0) {
      list[idx] = item
    } else {
      list = [item, ...list]
    }
    localStorage.setItem(LOCAL_STORAGE_MATERIALS_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

/**
 * Gera o SVG de um material customizado com suporte a variações de layout:
 * - horizontal: símbolo à esquerda + wordmark MudarCurso + tagline
 * - stacked: símbolo no centro acima + wordmark + tagline
 * - symbol-only: símbolo com destaque e proporções livres
 * - badge-round: selo circular oficial com borda, gradiente e textos
 * - banner: proporção 1200x400 para cabeçalhos / redes sociais
 */
export function generateMaterialSvg(
  item: BrandKitMaterialItem,
  opts?: {
    background?: 'light' | 'dark' | 'violet' | 'transparent'
    width?: number
    height?: number
  },
): string {
  // Se for um SVG customizado colado pelo usuário diretamente
  if (item.svgRaw && item.svgRaw.includes('<svg')) {
    return item.svgRaw
  }

  const bg = opts?.background ?? 'dark'
  const isLight = bg === 'light'
  const isViolet = bg === 'violet'

  let bgColor = 'transparent'
  let textColor = isLight ? '#0F0B1F' : '#FFFFFF'
  let secondaryTextColor = isLight ? '#4B5563' : '#D1D5DB'
  let borderStroke = isLight ? '#E5E7EB' : 'rgba(255, 255, 255, 0.15)'

  if (bg === 'light') {
    bgColor = item.transparentBg ? 'transparent' : '#FFFFFF'
  } else if (bg === 'dark') {
    bgColor = item.transparentBg ? 'transparent' : '#0F0B1F'
  } else if (bg === 'violet') {
    bgColor = item.transparentBg ? 'transparent' : item.primaryColor || '#5B21B6'
    textColor = '#FFFFFF'
    secondaryTextColor = '#E9D5FF'
  }

  const primaryCol = item.primaryColor || '#5B21B6'
  const secondaryCol = item.secondaryColor || '#FF2E93'
  const symbolScale = (item.symbolSize || 100) / 100
  const titleText = item.customText || item.title || 'MudarCurso'
  const taglineText = item.tagline || item.subtitle || 'TRANSFORMAÇÃO CONTÍNUA'

  // LAYOUT 1: BADGE CIRCULAR (Selo Oficial)
  if (item.layoutType === 'badge-round') {
    const size = 600
    const cx = 300
    const cy = 300
    const r = 260
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">
  <defs>
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryCol}" />
      <stop offset="100%" stop-color="${secondaryCol}" />
    </linearGradient>
    <path id="textCircleTop" d="M 80,300 A 220,220 0 1,1 520,300" fill="none" />
    <path id="textCircleBottom" d="M 520,300 A 220,220 0 0,1 80,300" fill="none" />
  </defs>
  ${bgColor !== 'transparent' ? `<rect width="${size}" height="${size}" fill="${bgColor}" />` : ''}
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${bgColor === 'transparent' ? '#0F0B1F' : bgColor}" stroke="url(#badgeGrad)" stroke-width="12" />
  <circle cx="${cx}" cy="${cy}" r="${r - 28}" fill="none" stroke="${borderStroke}" stroke-width="2" stroke-dasharray="6,6" />
  
  <!-- Símbolo MudarCurso central -->
  <g transform="translate(${cx}, ${cy - 20}) scale(${symbolScale * 0.95})">
    <path d="M-60,-50 L20,-50 C50,-50 60,-20 40,0 C65,15 65,50 20,50 L-60,50 Z" fill="url(#badgeGrad)" opacity="0.15" />
    <polygon points="-50,-40 -10,-40 20,0 -10,40 -50,40" fill="${primaryCol}" />
    <polygon points="-10,-40 30,-40 60,0 30,40 -10,40" fill="${secondaryCol}" />
  </g>

  <!-- Tipografia ao redor ou no centro -->
  <text font-family="'Archivo Black', 'Montserrat', sans-serif" font-size="28" font-weight="900" fill="${textColor}" text-anchor="middle" letter-spacing="2">
    <textPath href="#textCircleTop" startOffset="50%" text-anchor="middle">${titleText.toUpperCase()}</textPath>
  </text>
  <text font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="800" fill="${secondaryTextColor}" text-anchor="middle" letter-spacing="4">
    <textPath href="#textCircleBottom" startOffset="50%" text-anchor="middle">★ ${taglineText.toUpperCase()} ★</textPath>
  </text>
  
  ${item.draftWatermark ? `<text x="300" y="320" font-family="'Archivo Black', sans-serif" font-size="44" font-weight="900" fill="#EF4444" opacity="0.35" text-anchor="middle" transform="rotate(-30 300 300)">RASCUNHO</text>` : ''}
</svg>`
  }

  // LAYOUT 2: BANNER (1200 x 400)
  if (item.layoutType === 'banner') {
    const w = 1200
    const h = 400
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%">
  <defs>
    <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${primaryCol}" />
      <stop offset="100%" stop-color="${secondaryCol}" />
    </linearGradient>
  </defs>
  ${bgColor !== 'transparent' ? `<rect width="${w}" height="${h}" fill="${bgColor}" />` : ''}
  <rect x="0" y="${h - 8}" width="${w}" height="8" fill="url(#bannerGrad)" />
  
  <!-- Símbolo MudarCurso -->
  <g transform="translate(180, 200) scale(${symbolScale * 1.3})">
    <polygon points="-50,-40 -10,-40 20,0 -10,40 -50,40" fill="${primaryCol}" />
    <polygon points="-10,-40 30,-40 60,0 30,40 -10,40" fill="${secondaryCol}" />
  </g>

  <!-- Textos do banner -->
  <g transform="translate(320, 185)">
    <text font-family="'Archivo Black', 'Montserrat', sans-serif" font-size="64" font-weight="900" fill="${textColor}" letter-spacing="-1">
      ${titleText}
    </text>
    <text y="52" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" font-weight="800" fill="${secondaryTextColor}" letter-spacing="6">
      ${taglineText.toUpperCase()}
    </text>
  </g>

  ${item.draftWatermark ? `<text x="600" y="240" font-family="'Archivo Black', sans-serif" font-size="70" font-weight="900" fill="#EF4444" opacity="0.25" text-anchor="middle" transform="rotate(-15 600 200)">RASCUNHO OFICIAL</text>` : ''}
</svg>`
  }

  // LAYOUT 3: STACKED (Vertical / Quadrado)
  if (item.layoutType === 'stacked') {
    const w = 800
    const h = 600
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%">
  <defs>
    <linearGradient id="stackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryCol}" />
      <stop offset="100%" stop-color="${secondaryCol}" />
    </linearGradient>
  </defs>
  ${bgColor !== 'transparent' ? `<rect width="${w}" height="${h}" fill="${bgColor}" />` : ''}

  <!-- Símbolo acima -->
  <g transform="translate(400, 220) scale(${symbolScale * 1.5})">
    <polygon points="-50,-40 -10,-40 20,0 -10,40 -50,40" fill="${primaryCol}" />
    <polygon points="-10,-40 30,-40 60,0 30,40 -10,40" fill="${secondaryCol}" />
  </g>

  <!-- Wordmark + Tagline centralizado -->
  <g transform="translate(400, 410)">
    <text font-family="'Archivo Black', 'Montserrat', sans-serif" font-size="58" font-weight="900" fill="${textColor}" text-anchor="middle" letter-spacing="-1">
      ${titleText}
    </text>
    <text y="48" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" font-weight="800" fill="${secondaryTextColor}" text-anchor="middle" letter-spacing="5">
      ${taglineText.toUpperCase()}
    </text>
  </g>

  ${item.draftWatermark ? `<text x="400" y="320" font-family="'Archivo Black', sans-serif" font-size="64" font-weight="900" fill="#EF4444" opacity="0.25" text-anchor="middle" transform="rotate(-25 400 300)">RASCUNHO</text>` : ''}
</svg>`
  }

  // LAYOUT 4: SÍMBOLO ISOLADO (Proporção 1:1)
  if (item.layoutType === 'symbol-only') {
    const size = 600
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">
  <defs>
    <linearGradient id="symGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryCol}" />
      <stop offset="100%" stop-color="${secondaryCol}" />
    </linearGradient>
  </defs>
  ${bgColor !== 'transparent' ? `<rect width="${size}" height="${size}" fill="${bgColor}" />` : ''}
  
  <g transform="translate(300, 300) scale(${symbolScale * 2.2})">
    <polygon points="-50,-40 -10,-40 20,0 -10,40 -50,40" fill="${primaryCol}" />
    <polygon points="-10,-40 30,-40 60,0 30,40 -10,40" fill="${secondaryCol}" />
  </g>

  ${item.draftWatermark ? `<text x="300" y="320" font-family="'Archivo Black', sans-serif" font-size="60" font-weight="900" fill="#EF4444" opacity="0.25" text-anchor="middle" transform="rotate(-30 300 300)">RASCUNHO</text>` : ''}
</svg>`
  }

  // LAYOUT PADRÃO: HORIZONTAL (1200 x 360)
  const w = 1200
  const h = 360
  const posX = item.logoPosition === 'center' ? 380 : item.logoPosition === 'right' ? 620 : 160

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%">
  <defs>
    <linearGradient id="matGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryCol}" />
      <stop offset="100%" stop-color="${secondaryCol}" />
    </linearGradient>
  </defs>
  ${bgColor !== 'transparent' ? `<rect width="${w}" height="${h}" fill="${bgColor}" />` : ''}

  <!-- Linha guia da área de segurança se ativada -->
  ${
    item.showSafeArea
      ? `<rect x="40" y="40" width="${w - 80}" height="${h - 80}" fill="none" stroke="#FF2E93" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6" />
         <text x="50" y="32" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="bold" fill="#FF2E93">MARGEM DE SEGURANÇA (X)</text>`
      : ''
  }

  <!-- Símbolo MudarCurso -->
  <g transform="translate(${posX}, 180) scale(${symbolScale * 1.25})">
    <polygon points="-50,-40 -10,-40 20,0 -10,40 -50,40" fill="${primaryCol}" />
    <polygon points="-10,-40 30,-40 60,0 30,40 -10,40" fill="${secondaryCol}" />
  </g>

  <!-- Wordmark + Tagline -->
  <g transform="translate(${posX + 130}, 165)">
    <text font-family="'Archivo Black', 'Montserrat', sans-serif" font-size="60" font-weight="900" fill="${textColor}" letter-spacing="-1">
      ${titleText}
    </text>
    <text y="46" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="800" fill="${secondaryTextColor}" letter-spacing="5">
      ${taglineText.toUpperCase()}
    </text>
  </g>

  ${item.draftWatermark ? `<text x="600" y="210" font-family="'Archivo Black', sans-serif" font-size="70" font-weight="900" fill="#EF4444" opacity="0.25" text-anchor="middle" transform="rotate(-15 600 180)">RASCUNHO</text>` : ''}
</svg>`
}

/**
 * Converte um material customizado para o formato compatível com LogoKitVariationConfig
 */
export function materialToLogoKitConfig(item: BrandKitMaterialItem): LogoKitVariationConfig {
  return {
    kind: 'primary',
    title: item.title,
    subtitle: item.subtitle,
    description: `Material customizado "${item.title}" (${item.layoutType})`,
    fileNameCustom: item.fileNameCustom,
    primaryColor: item.primaryColor,
    secondaryColor: item.secondaryColor,
    monoColor: item.monoColor,
    symbolSize: item.symbolSize,
    logoPosition: item.logoPosition,
    bgChoice: 'transparent',
    altText: item.altText,
    showSafeArea: item.showSafeArea,
    draftWatermark: item.draftWatermark,
    transparentBg: item.transparentBg,
  }
}
