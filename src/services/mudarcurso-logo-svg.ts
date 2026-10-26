import type { LogoKitVariationConfig } from './logo-kit'

/**
 * Gera a string SVG oficial da MudarCurso com seta neon, círculo com pessoas e wordmark MUDARCURSO
 * 100% vetorial, renderizado por código, parametrizado pelas variáveis de edição.
 */
export function generateMudarCursoSvg(
  config: LogoKitVariationConfig,
  options?: {
    width?: number
    height?: number
    background?: 'transparent' | 'light' | 'dark' | 'violet'
    forceWatermark?: boolean
    overrideScale?: number
  },
): string {
  const {
    kind,
    primaryColor = '#5B21B6',
    secondaryColor = '#FF2E93',
    monoColor = '#5B21B6',
    symbolSize = 100,
    logoPosition = 'center',
    showSafeArea = false,
    draftWatermark = false,
    transparentBg = true,
  } = config

  const isMarkOnly = kind === 'mark'
  const isMono = kind === 'mono-dark'
  const isDarkVariation = kind === 'light'

  // Dimensões do viewBox
  const vbWidth = isMarkOnly ? 512 : 1200
  const vbHeight = isMarkOnly ? 512 : 360

  const width = options?.width || vbWidth
  const height = options?.height || vbHeight
  const bgMode = options?.background || (transparentBg ? 'transparent' : 'light')

  let bgColor = 'none'
  if (bgMode === 'light') bgColor = '#FFFFFF'
  else if (bgMode === 'dark') bgColor = '#0F0B1F'
  else if (bgMode === 'violet') bgColor = '#5B21B6'

  // Cores efetivas
  const effectivePrimary = isMono ? monoColor : primaryColor
  const effectiveSecondary = isMono ? monoColor : secondaryColor
  const effectiveWordmarkColor = isMono
    ? monoColor
    : isDarkVariation
      ? '#FFFFFF'
      : bgMode === 'dark' || bgMode === 'violet'
        ? '#FFFFFF'
        : '#1E1B4B'

  const effectiveSubtitleColor = isMono
    ? monoColor
    : isDarkVariation
      ? '#FF7BC1'
      : bgMode === 'dark' || bgMode === 'violet'
        ? '#FF7BC1'
        : '#FF2E93'

  const scale = (symbolSize / 100) * (options?.overrideScale || 1)
  const shouldWatermark = draftWatermark || options?.forceWatermark

  // Posição horizontal do grupo
  let groupTransform = ''
  if (isMarkOnly) {
    const cx = vbWidth / 2
    const cy = vbHeight / 2
    groupTransform = `transform="translate(${cx}, ${cy}) scale(${scale}) translate(-${cx}, -${cy})"`
  } else {
    let offsetX = 0
    if (logoPosition === 'left') offsetX = -60
    if (logoPosition === 'right') offsetX = 60
    const cx = vbWidth / 2 + offsetX
    const cy = vbHeight / 2
    groupTransform = `transform="translate(${offsetX}, 0) translate(${cx}, ${cy}) scale(${scale}) translate(-${cx}, -${cy})"`
  }

  // Definições de gradiente e filtros
  const defs = `
    <defs>
      <linearGradient id="mc-neon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${effectiveSecondary}" />
        <stop offset="50%" stop-color="${effectivePrimary}" />
        <stop offset="100%" stop-color="${effectiveSecondary}" />
      </linearGradient>
      <linearGradient id="mc-symbol-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${effectiveSecondary}" />
        <stop offset="100%" stop-color="${effectivePrimary}" />
      </linearGradient>
      <filter id="mc-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  `

  // Background rect
  const bgRect =
    bgColor !== 'none'
      ? `<rect width="${vbWidth}" height="${vbHeight}" fill="${bgColor}" rx="0" />`
      : ''

  // Área de proteção (Margem mínima = altura do símbolo X)
  const safeArea = showSafeArea
    ? `
    <g id="safe-area" opacity="0.65">
      <rect x="24" y="24" width="${vbWidth - 48}" height="${vbHeight - 48}" fill="none" stroke="#FF2E93" stroke-width="2" stroke-dasharray="6 6" />
      <text x="32" y="44" fill="#FF2E93" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="bold">ÁREA DE PROTEÇÃO (X = Margem Segura)</text>
      <line x1="24" y1="24" x2="48" y2="48" stroke="#FF2E93" stroke-width="1.5" />
      <line x1="${vbWidth - 24}" y1="24" x2="${vbWidth - 48}" y2="48" stroke="#FF2E93" stroke-width="1.5" />
      <line x1="24" y1="${vbHeight - 24}" x2="48" y2="${vbHeight - 48}" stroke="#FF2E93" stroke-width="1.5" />
      <line x1="${vbWidth - 24}" y1="${vbHeight - 24}" x2="${vbWidth - 48}" y2="${vbHeight - 48}" stroke="#FF2E93" stroke-width="1.5" />
    </g>
  `
    : ''

  // Marca d'água de rascunho
  const watermark = shouldWatermark
    ? `
    <g id="draft-watermark" pointer-events="none">
      <line x1="0" y1="${vbHeight}" x2="${vbWidth}" y2="0" stroke="#FF2E93" stroke-width="4" stroke-opacity="0.35" stroke-dasharray="12 12" />
      <text x="${vbWidth / 2}" y="${vbHeight / 2}" fill="#FF2E93" fill-opacity="0.22" font-family="Archivo Black, sans-serif" font-size="64" font-weight="900" text-anchor="middle" dominant-baseline="central" transform="rotate(-18, ${vbWidth / 2}, ${vbHeight / 2})">RASCUNHO · NÃO OFICIAL</text>
    </g>
  `
    : ''

  // CONTEÚDO DO SÍMBOLO:
  // Círculo com pessoas conectadas + seta/chevron neon dinâmica apontando para frente/alto
  const symbolMarkup = isMarkOnly
    ? `
    <!-- SÍMBOLO ISOLADO (MARK) -->
    <g transform="translate(256, 256)" ${groupTransform}>
      <!-- Círculo externo neon de expansão -->
      <circle cx="0" cy="0" r="180" fill="none" stroke="${effectivePrimary}" stroke-width="12" stroke-opacity="0.4" />
      <circle cx="0" cy="0" r="150" fill="url(#mc-symbol-grad)" fill-opacity="0.12" stroke="${effectiveSecondary}" stroke-width="8" />

      <!-- Seta Neon / Chevron dinâmico de MUDANÇA DE CURSO -->
      <path d="M -70 40 L 0 -45 L 70 40" fill="none" stroke="${effectiveSecondary}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" filter="url(#mc-glow)" />
      <path d="M -70 40 L 0 -45 L 70 40" fill="none" stroke="${isMono ? monoColor : '#FFFFFF'}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />

      <!-- 3 Pessoas / Comunidade conectada em arco -->
      <!-- Pessoa Central -->
      <circle cx="0" cy="40" r="16" fill="${effectivePrimary}" />
      <path d="M -26 86 C -26 62, 26 62, 26 86 Z" fill="${effectivePrimary}" />

      <!-- Pessoa Esquerda -->
      <circle cx="-54" cy="52" r="13" fill="${effectiveSecondary}" />
      <path d="M -74 92 C -74 72, -34 72, -34 92 Z" fill="${effectiveSecondary}" opacity="0.85" />

      <!-- Pessoa Direita -->
      <circle cx="54" cy="52" r="13" fill="${effectiveSecondary}" />
      <path d="M 34 92 C 34 72, 74 72, 74 92 Z" fill="${effectiveSecondary}" opacity="0.85" />

      <!-- Ponto de luz na ponta da seta -->
      <circle cx="0" cy="-45" r="9" fill="${isMono ? monoColor : '#FFFFFF'}" filter="url(#mc-glow)" />
    </g>
  `
    : `
    <!-- LOGO COMPLETA: SÍMBOLO + WORDMARK HORIZONTAL -->
    <g transform="translate(140, 180)" ${groupTransform}>
      <!-- Símbolo compacto à esquerda -->
      <g transform="translate(0, 0)">
        <circle cx="0" cy="0" r="80" fill="none" stroke="${effectivePrimary}" stroke-width="7" stroke-opacity="0.35" />
        <circle cx="0" cy="0" r="68" fill="url(#mc-symbol-grad)" fill-opacity="0.12" stroke="${effectiveSecondary}" stroke-width="5" />

        <!-- Seta / Chevron Neon -->
        <path d="M -34 18 L 0 -22 L 34 18" fill="none" stroke="${effectiveSecondary}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" filter="url(#mc-glow)" />
        <path d="M -34 18 L 0 -22 L 34 18" fill="none" stroke="${isMono ? monoColor : '#FFFFFF'}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Pessoas conectadas -->
        <!-- Central -->
        <circle cx="0" cy="18" r="9" fill="${effectivePrimary}" />
        <path d="M -16 44 C -16 30, 16 30, 16 44 Z" fill="${effectivePrimary}" />
        <!-- Esquerda -->
        <circle cx="-28" cy="24" r="7" fill="${effectiveSecondary}" />
        <path d="M -40 48 C -40 36, -16 36, -16 48 Z" fill="${effectiveSecondary}" opacity="0.85" />
        <!-- Direita -->
        <circle cx="28" cy="24" r="7" fill="${effectiveSecondary}" />
        <path d="M 16 48 C 16 36, 40 36, 40 48 Z" fill="${effectiveSecondary}" opacity="0.85" />

        <!-- Brilho no topo -->
        <circle cx="0" cy="-22" r="5" fill="${isMono ? monoColor : '#FFFFFF'}" />
      </g>

      <!-- Wordmark MUDARCURSO em tipografia Archivo Black / Plus Jakarta Sans -->
      <g transform="translate(130, 0)">
        <!-- MUDAR em tom principal -->
        <text x="0" y="8" fill="${effectiveWordmarkColor}" font-family="'Archivo Black', 'Plus Jakarta Sans', system-ui, sans-serif" font-size="74" font-weight="900" letter-spacing="1">MUDAR</text>
        <!-- CURSO em gradiente / rosa de destaque -->
        <text x="320" y="8" fill="${effectiveSubtitleColor}" font-family="'Archivo Black', 'Plus Jakarta Sans', system-ui, sans-serif" font-size="74" font-weight="900" letter-spacing="1">CURSO</text>

        <!-- Subtítulo / Tagline Oficial -->
        <text x="4" y="46" fill="${effectiveWordmarkColor}" fill-opacity="0.75" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="16" font-weight="800" letter-spacing="6">PLATAFORMA DE FORMAÇÃO PROFISSIONAL</text>
      </g>
    </g>
  `

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbWidth} ${vbHeight}" width="${width}" height="${height}" role="img" aria-label="${config.altText}">
    ${defs}
    ${bgRect}
    ${safeArea}
    ${symbolMarkup}
    ${watermark}
  </svg>`.trim()
}

/**
 * Converte a string SVG para Data URL segura
 */
export function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
}

/**
 * Renderiza o SVG em um canvas HTML5 e exporta como Blob/DataURL
 */
export async function renderSvgToCanvas(
  svgString: string,
  targetWidth: number,
  targetHeight: number,
  backgroundColor?: string,
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Canvas 2D context não suportado'))
      return
    }

    if (backgroundColor && backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, targetWidth, targetHeight)
    }

    const img = new Image()
    const url = svgToDataUrl(svgString)

    img.onload = () => {
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
      resolve(canvas)
    }
    img.onerror = (e) => reject(e)
    img.src = url
  })
}

/**
 * Dispara o download de um arquivo gerado
 */
export function triggerFileDownload(blobOrUrl: Blob | string, fileName: string) {
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  if (typeof blobOrUrl !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }
}
