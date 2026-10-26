/**
 * Utilitários de Contraste WCAG 2.1
 * Calcula a luminância relativa e a razão de contraste (Contrast Ratio) entre duas cores Hex
 */

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const num = parseInt(clean, 16)
  if (isNaN(num)) {
    return { r: 0, g: 0, b: 0 }
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

/**
 * Fórmula de luminância relativa conforme especificação WCAG 2.1:
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * Onde cada canal normalizado é transformado conforme curva sRGB.
 */
export function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Razão de contraste WCAG: (L1 + 0.05) / (L2 + 0.05) onde L1 é o mais claro.
 */
export function calculateContrastRatio(hexForeground: string, hexBackground: string): number {
  const rgbFg = hexToRgb(hexForeground)
  const rgbBg = hexToRgb(hexBackground)
  const l1 = getRelativeLuminance(rgbFg)
  const l2 = getRelativeLuminance(rgbBg)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  const ratio = (lighter + 0.05) / (darker + 0.05)
  return Number(ratio.toFixed(2))
}

export type WcagLevel = 'AAA' | 'AA' | 'Reprovado'

export function getWcagRating(ratio: number): {
  level: WcagLevel
  passed: boolean
  label: string
} {
  if (ratio >= 7.0) {
    return { level: 'AAA', passed: true, label: 'AAA (Excelente)' }
  }
  if (ratio >= 4.5) {
    return { level: 'AA', passed: true, label: 'AA (Aprovado)' }
  }
  return { level: 'Reprovado', passed: false, label: 'Reprovado (< 4.5)' }
}

export interface ContrastMatrixRow {
  variationKind: 'primary' | 'light' | 'mono-dark' | 'mark'
  variationTitle: string
  fgColor: string
  bgName: 'Claro' | 'Escuro' | 'Violeta'
  bgColor: string
  ratio: number
  level: WcagLevel
  passed: boolean
}

export function buildMudarCursoContrastMatrix(): ContrastMatrixRow[] {
  const backgrounds = [
    { name: 'Claro' as const, hex: '#FFFFFF' },
    { name: 'Escuro' as const, hex: '#0F0B1F' },
    { name: 'Violeta' as const, hex: '#5B21B6' },
  ]

  const variations = [
    {
      kind: 'primary' as const,
      title: 'Logo MudarCurso · Primária',
      fgColor: '#5B21B6',
    },
    {
      kind: 'light' as const,
      title: 'Logo MudarCurso · Neon · fundo escuro',
      fgColor: '#FFFFFF',
    },
    {
      kind: 'mono-dark' as const,
      title: 'Logo MudarCurso · Monocromática',
      fgColor: '#0F0B1F',
    },
    {
      kind: 'mark' as const,
      title: 'Logo MudarCurso · Símbolo (Mark)',
      fgColor: '#5B21B6',
    },
  ]

  const rows: ContrastMatrixRow[] = []

  variations.forEach((v) => {
    backgrounds.forEach((bg) => {
      // Ajuste contextual para o teste:
      // se a variação for light/neon sobre fundo escuro/violeta ela usa branco como texto e neon como símbolo
      let effectiveFg = v.fgColor
      if (v.kind === 'light') {
        effectiveFg = '#FFFFFF'
      }

      const ratio = calculateContrastRatio(effectiveFg, bg.hex)
      const rating = getWcagRating(ratio)
      rows.push({
        variationKind: v.kind,
        variationTitle: v.title,
        fgColor: effectiveFg,
        bgName: bg.name,
        bgColor: bg.hex,
        ratio,
        level: rating.level,
        passed: rating.passed,
      })
    })
  })

  return rows
}
