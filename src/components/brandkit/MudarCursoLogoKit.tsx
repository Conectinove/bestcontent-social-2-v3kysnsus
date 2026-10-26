import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Plus,
  Download,
  FileText,
  Sliders,
  CheckSquare,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Trash2,
  FileArchive,
  Image as ImageIcon,
  Palette,
  Eye,
  Settings2,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import {
  type LogoVariationKind,
  type LogoKitVariationConfig,
  DEFAULT_LOGO_CONFIGS,
  getSavedLogoKitEdits,
  saveLogoKitEdit,
} from '@/services/logo-kit'
import {
  generateMudarCursoSvg,
  renderSvgToCanvas,
  triggerFileDownload,
} from '@/services/mudarcurso-logo-svg'
import { buildMudarCursoContrastMatrix, type ContrastMatrixRow } from '@/services/contrast-checker'
import { createSimpleZip, type ZipFileEntry } from '@/services/simple-zip'
import { AdvancedLogoEditorModal } from '@/components/brandkit/AdvancedLogoEditorModal'
import { RevisedPromptsModal } from '@/components/brandkit/RevisedPromptsModal'
import { CreateOrEditMaterialModal } from '@/components/brandkit/CreateOrEditMaterialModal'
import {
  type BrandKitMaterialItem,
  getBrandKitMaterials,
  saveBrandKitMaterial,
  deleteBrandKitMaterial,
  generateMaterialSvg,
} from '@/services/brand-materials'
import { isLabFeatureEnabled } from '@/services/labs-features'

interface LogEntry {
  id: string
  time: string
  type: 'Carrossel' | 'Miniaturas' | 'Página' | 'Sistema'
  message: string
  status: 'ok' | 'pending' | 'failed'
}

export const CHECKLIST_ITEMS = [
  {
    id: 'c1',
    title: 'Variação correta para o fundo',
    desc: 'Primária em fundos claros · Clara em fundos escuros/violeta · Mono para impressão técnica.',
  },
  {
    id: 'c2',
    title: 'Área de proteção respeitada',
    desc: 'Margem mínima = altura do símbolo (X) em todos os lados.',
  },
  {
    id: 'c3',
    title: 'Tamanho mínimo aplicado',
    desc: 'Logo completa: 24px digital / 12mm impresso · Mark: 16px digital / 8mm impresso.',
  },
  {
    id: 'c4',
    title: 'Sem distorção, recoloração ou efeitos',
    desc: 'Não escale desproporcionalmente, não mude cores, não aplique sombra/contorno.',
  },
  {
    id: 'c5',
    title: 'Formato adequado ao canal',
    desc: 'SVG/PNG (transparente) em fundos coloridos · JPG só com fundo branco.',
  },
  {
    id: 'c6',
    title: 'Contraste suficiente com o fundo',
    desc: 'Garanta legibilidade — evite imagens ruidosas atrás da logo.',
  },
]

export function MudarCursoLogoKit() {
  const { toast } = useToast()
  const { user } = useAuth()

  // 1. Estado das 4 Variações de Logo
  const [logoConfigs, setLogoConfigs] =
    useState<Record<LogoVariationKind, LogoKitVariationConfig>>(DEFAULT_LOGO_CONFIGS)
  const [editingKind, setEditingKind] = useState<LogoVariationKind | null>(null)
  const [promptsModalOpen, setPromptsModalOpen] = useState(false)

  // Materiais Customizados (Persistidos no PocketBase brand_kit_materials / localStorage)
  const [customMaterials, setCustomMaterials] = useState<BrandKitMaterialItem[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [materialModalOpen, setMaterialModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<BrandKitMaterialItem | null>(null)
  const [materialToDelete, setMaterialToDelete] = useState<BrandKitMaterialItem | null>(null)

  // Previews por fundo ativos em cada card oficial
  const [previewBgs, setPreviewBgs] = useState<
    Record<LogoVariationKind, 'light' | 'dark' | 'violet'>
  >({
    primary: 'light',
    light: 'dark',
    'mono-dark': 'light',
    mark: 'violet',
  })

  // Previews por fundo ativos em cada material customizado
  const [customMaterialBgs, setCustomMaterialBgs] = useState<
    Record<string, 'light' | 'dark' | 'violet'>
  >({})

  // 2. Nomenclatura dos arquivos
  const [projectName, setProjectName] = useState('mudarcurso')
  const [namingPattern, setNamingPattern] = useState('{project}-{kind}-{detail}-{date}')

  // 3. Checklist de Conformidade
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('mudarcurso_checklist_state')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })

  // 4. Carrossel de Guia Rápido
  const [carouselSlideCount, setCarouselSlideCount] = useState<3 | 5 | 7>(5)
  const [autoLoadThumbnails, setAutoLoadThumbnails] = useState(true)

  // 5. Matriz de Contraste
  const [contrastFilter, setContrastFilter] = useState<'all' | 'failed'>('all')

  // 6. Painel de Logs de Geração
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [dryRun, setDryRun] = useState(false)
  const [autoRetry, setAutoRetry] = useState(false)
  const [selectedLogTypeFilter, setSelectedLogTypeFilter] = useState<
    'all' | 'Carrossel' | 'Miniaturas' | 'Página'
  >('all')

  // Carregar edições salvas e materiais customizados na montagem
  const fetchMaterials = async () => {
    setLoadingMaterials(true)
    try {
      const mats = await getBrandKitMaterials(user?.id)
      setCustomMaterials(mats)
    } catch (err) {
      console.warn('[BrandKit] Erro ao carregar materiais:', err)
    } finally {
      setLoadingMaterials(false)
    }
  }

  useEffect(() => {
    async function loadEditsAndMaterials() {
      const saved = await getSavedLogoKitEdits(user?.id)
      setLogoConfigs((prev) => {
        const next = { ...prev }
        ;(Object.keys(DEFAULT_LOGO_CONFIGS) as LogoVariationKind[]).forEach((k) => {
          if (saved[k]) {
            next[k] = { ...DEFAULT_LOGO_CONFIGS[k], ...saved[k] }
          }
        })
        return next
      })

      fetchMaterials()
    }
    loadEditsAndMaterials()
  }, [user?.id])

  // Persistir checklist
  const toggleChecklist = (id: string) => {
    setCheckedMap((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      try {
        localStorage.setItem('mudarcurso_checklist_state', JSON.stringify(next))
      } catch {
        /* intentionally ignored */
      }
      return next
    })
  }

  const validatedCount = useMemo(() => {
    return CHECKLIST_ITEMS.filter((item) => checkedMap[item.id]).length
  }, [checkedMap])

  // Helper para registrar log de execução
  const addLog = (
    type: 'Carrossel' | 'Miniaturas' | 'Página' | 'Sistema',
    message: string,
    status: 'ok' | 'pending' | 'failed' = 'ok',
  ) => {
    const time = new Date().toLocaleTimeString('pt-BR')
    const newEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time,
      type,
      message,
      status,
    }
    setLogs((prev) => [newEntry, ...prev.slice(0, 199)])
  }

  // Gera o nome de arquivo interpolando os tokens
  const formatFileName = (
    kind: string,
    format: string,
    detail = 'oficial',
    page?: number,
  ): string => {
    const today = new Date().toISOString().split('T')[0]
    let name = namingPattern
      .replace('{project}', projectName.trim() || 'mudarcurso')
      .replace('{kind}', kind)
      .replace('{detail}', detail)
      .replace('{format}', format)
      .replace('{date}', today)

    if (page !== undefined) {
      name = name.replace('{page}', `slide-${page}`)
    } else {
      name = name.replace('-{page}', '')
    }
    return `${name}.${format}`
  }

  // DOWNLOAD DE VARIAÇÃO EM FORMATOS DIFERENTES
  const downloadSingleLogo = async (
    kind: LogoVariationKind,
    format: 'svg' | 'png' | 'jpg' | 'pdf' | 'draft' | 'favicons',
    size = 2048,
  ) => {
    const cfg = logoConfigs[kind]
    const isDraft = format === 'draft'

    if (dryRun) {
      addLog(
        'Página',
        `[DRY-RUN] Planejado download: ${cfg.title} em .${format.toUpperCase()} (${size}px). Nenhuma escrita em disco.`,
        'ok',
      )
      toast({
        title: 'Modo Dry-Run Ativo',
        description: `Download planejado: ${cfg.title} (${format.toUpperCase()}) sem gerar arquivos.`,
      })
      return
    }

    addLog(
      'Página',
      `Iniciando renderização de "${cfg.title}" em formato .${format.toUpperCase()} (${size}px)...`,
      'pending',
    )

    try {
      const svgCode = generateMudarCursoSvg(cfg, {
        background: format === 'jpg' ? 'light' : 'transparent',
        forceWatermark: isDraft,
      })

      if (format === 'svg') {
        const fileName = formatFileName(kind, 'svg', isDraft ? 'rascunho' : 'vetor')
        const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' })
        triggerFileDownload(blob, fileName)
        addLog('Página', `Download SVG concluído: ${fileName}`, 'ok')
      } else if (format === 'png' || format === 'draft') {
        const isMark = kind === 'mark'
        const h = isMark ? size : Math.round(size * (360 / 1200))
        const canvas = await renderSvgToCanvas(svgCode, size, h, 'transparent')
        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = formatFileName(
              kind,
              'png',
              isDraft ? `rascunho-${size}px` : `${size}px`,
            )
            triggerFileDownload(blob, fileName)
            addLog('Página', `Download PNG concluído: ${fileName}`, 'ok')
          }
        }, 'image/png')
      } else if (format === 'jpg') {
        const isMark = kind === 'mark'
        const h = isMark ? size : Math.round(size * (360 / 1200))
        const canvas = await renderSvgToCanvas(svgCode, size, h, '#FFFFFF')
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const fileName = formatFileName(kind, 'jpg', `fundo-branco-${size}px`)
              triggerFileDownload(blob, fileName)
              addLog('Página', `Download JPG concluído: ${fileName}`, 'ok')
            }
          },
          'image/jpeg',
          0.92,
        )
      } else if (format === 'favicons') {
        // Gera ZIP com favicons em tamanhos essenciais (16, 32, 48, 64, 180, 512 + SVG mini)
        const markCfg = logoConfigs.mark
        const markSvg = generateMudarCursoSvg(markCfg, { background: 'transparent' })
        const entries: ZipFileEntry[] = [
          { name: 'favicon.svg', data: markSvg },
          {
            name: 'README-FAVICONS.txt',
            data: 'Favicons oficiais MudarCurso gerados para Web, PWA e iOS touch icons.',
          },
        ]

        const faviconSizes = [16, 32, 48, 64, 180, 512]
        for (const fSize of faviconSizes) {
          const cvs = await renderSvgToCanvas(markSvg, fSize, fSize, 'transparent')
          const dataUrl = cvs.toDataURL('image/png')
          const base64 = dataUrl.split(',')[1]
          const binaryStr = window.atob(base64)
          const bytes = new Uint8Array(binaryStr.length)
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i)
          }
          entries.push({
            name: `favicon-${fSize}x${fSize}.png`,
            data: bytes,
          })
        }

        const zipBlob = createSimpleZip(entries)
        const zipName = `${projectName}-favicons-pack.zip`
        triggerFileDownload(zipBlob, zipName)
        addLog(
          'Miniaturas',
          `Pacote de favicons gerado: ${zipName} (${entries.length} arquivos)`,
          'ok',
        )
      } else if (format === 'pdf') {
        // Janela de impressão estruturada para PDF nativo de alta fidelidade
        openPdfPrintGuide(kind, svgCode, cfg)
        addLog('Página', `Guia de impressão PDF aberto para "${cfg.title}"`, 'ok')
      }

      toast({
        title: 'Download gerado com sucesso!',
        description: `Arquivo da "${cfg.title}" processado em .${format.toUpperCase()}.`,
      })
    } catch (err: any) {
      addLog('Página', `Falha ao gerar ${cfg.title}: ${err?.message}`, 'failed')
      toast({
        title: 'Erro ao gerar download',
        description: err?.message || 'Ocorreu um erro no processamento client-side.',
        variant: 'destructive',
      })
    }
  }

  // BAIXAR TUDO EM UM ÚNICO PACOTE ZIP
  const handleDownloadAllZip = async () => {
    if (dryRun) {
      addLog(
        'Sistema',
        '[DRY-RUN] Planejada compilação de todas as 4 variações em ZIP (SVG + PNG 2048 + JPG).',
        'ok',
      )
      toast({
        title: 'Dry-Run Ativo',
        description: 'Simulação de geração do ZIP completo realizada.',
      })
      return
    }

    addLog('Sistema', 'Compilando pacote ZIP completo da MudarCurso...', 'pending')
    toast({
      title: 'Gerando Pacote ZIP Completo...',
      description: 'Renderizando as 4 variações em SVG, PNG transparente e JPG de alta resolução.',
    })

    try {
      const entries: ZipFileEntry[] = []

      // Adiciona README técnico
      entries.push({
        name: 'LEIAME-IDENTIDADE-MUDARCURSO.txt',
        data: `SYS · LOGO KIT — v1.0 · 2026 · MUDARCURSO\n\nIdentidade MudarCurso 2026:\nVioleta elétrico (#5B21B6) como cor principal, rosa de destaque (#FF2E93), fundo escuro (#0F0B1F).\nTipografia Archivo Black (títulos) e Plus Jakarta Sans (texto).\n\nConteúdo do Pacote:\n1. Logo Primária (SVG + PNG 2048 + JPG)\n2. Logo Neon Fundo Escuro (SVG + PNG 2048 + JPG)\n3. Logo Monocromática (SVG + PNG 2048 + JPG)\n4. Símbolo Mark (SVG + PNG 2048 + JPG + Favicon)\n\nÁrea de Proteção: Margem mínima = altura do símbolo (X) em todos os lados.`,
      })

      for (const kind of ['primary', 'light', 'mono-dark', 'mark'] as LogoVariationKind[]) {
        const cfg = logoConfigs[kind]
        const isMark = kind === 'mark'
        const h = isMark ? 2048 : Math.round(2048 * (360 / 1200))

        // 1. SVG
        const svgStr = generateMudarCursoSvg(cfg, { background: 'transparent' })
        entries.push({
          name: `${cfg.fileNameCustom}.svg`,
          data: svgStr,
        })

        // 2. PNG transparente
        const pngCanvas = await renderSvgToCanvas(svgStr, 2048, h, 'transparent')
        const pngBase64 = pngCanvas.toDataURL('image/png').split(',')[1]
        const pngBytes = Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0))
        entries.push({
          name: `${cfg.fileNameCustom}-2048px.png`,
          data: pngBytes,
        })

        // 3. JPG fundo branco
        const jpgSvg = generateMudarCursoSvg(cfg, { background: 'light' })
        const jpgCanvas = await renderSvgToCanvas(jpgSvg, 2048, h, '#FFFFFF')
        const jpgBase64 = jpgCanvas.toDataURL('image/jpeg', 0.92).split(',')[1]
        const jpgBytes = Uint8Array.from(atob(jpgBase64), (c) => c.charCodeAt(0))
        entries.push({
          name: `${cfg.fileNameCustom}-fundo-branco.jpg`,
          data: jpgBytes,
        })
      }

      const zipBlob = createSimpleZip(entries)
      const zipFileName = `${projectName}-logo-kit-completo-2026.zip`
      triggerFileDownload(zipBlob, zipFileName)
      addLog(
        'Sistema',
        `ZIP completo gerado com sucesso: ${zipFileName} (${entries.length} arquivos)`,
        'ok',
      )

      toast({
        title: 'Pacote ZIP Baixado!',
        description: `Todas as 4 logos foram empacotadas no arquivo ${zipFileName}.`,
      })
    } catch (err: any) {
      addLog('Sistema', `Erro na geração do ZIP: ${err?.message}`, 'failed')
      toast({
        title: 'Falha ao empacotar ZIP',
        description: err?.message || 'Erro no empacotamento client-side.',
        variant: 'destructive',
      })
    }
  }

  // BAIXAR CARROSSEL EM 1080×1350 (PNG + JPG WHATSAPP)
  const handleDownloadCarousel = async () => {
    if (dryRun) {
      addLog(
        'Carrossel',
        `[DRY-RUN] Planejado carrossel de ${carouselSlideCount} slides em 1080×1350 (PNG + JPG).`,
        'ok',
      )
      toast({
        title: 'Dry-Run Ativo',
        description: `Simulação de ${carouselSlideCount} slides realizada.`,
      })
      return
    }

    addLog(
      'Carrossel',
      `Iniciando geração de carrossel com ${carouselSlideCount} slides em 1080×1350...`,
      'pending',
    )
    toast({
      title: 'Gerando Carrossel...',
      description: `Renderizando ${carouselSlideCount} slides em alta resolução 1080×1350.`,
    })

    try {
      const entries: ZipFileEntry[] = []

      // Páginas do guia da MudarCurso (6 páginas base que se repetem na ordem caso slides > 6)
      const guidePages = [
        {
          num: 1,
          title: 'SISTEMA DE IDENTIDADE OFICIAL',
          subtitle: 'MUDARCURSO · GUIA DE MARCA 2026',
          bg: '#0F0B1F',
          kind: 'primary' as const,
        },
        {
          num: 2,
          title: 'ÁREA DE PROTEÇÃO & MARGEM X',
          subtitle: 'A margem mínima ao redor da logo deve equivaler à altura do símbolo',
          bg: '#1B0A4D',
          kind: 'primary' as const,
        },
        {
          num: 3,
          title: 'VARIAÇÃO NEON PARA FUNDO ESCURO',
          subtitle: 'Cores preservadas em alto contraste com luminosidade violeta e rosa',
          bg: '#0F0B1F',
          kind: 'light' as const,
        },
        {
          num: 4,
          title: 'MONOCROMÁTICA & IMPRESSÃO TÉCNICA',
          subtitle: 'Uso restritivo em uma única cor sem sombras ou degradês',
          bg: '#FFFFFF',
          kind: 'mono-dark' as const,
        },
        {
          num: 5,
          title: 'SÍMBOLO MARK: FAVICONS E AVATARES',
          subtitle: 'Apenas a seta neon com pessoas para visualização compacta',
          bg: '#5B21B6',
          kind: 'mark' as const,
        },
        {
          num: 6,
          title: 'CHECKLIST & CONFORMIDADE WCAG 2.1',
          subtitle: 'Razão de contraste AAA garantida em todos os pontos de contato',
          bg: '#0F0B1F',
          kind: 'primary' as const,
        },
      ]

      for (let i = 0; i < carouselSlideCount; i++) {
        const pageIdx = i % guidePages.length
        const pageData = guidePages[pageIdx]
        const slideNum = i + 1

        const slideCanvas = document.createElement('canvas')
        slideCanvas.width = 1080
        slideCanvas.height = 1350
        const ctx = slideCanvas.getContext('2d')
        if (ctx) {
          // Fundo
          ctx.fillStyle = pageData.bg
          ctx.fillRect(0, 0, 1080, 1350)

          // Decoração de grid e bordas sutis
          ctx.strokeStyle = 'rgba(255, 46, 147, 0.25)'
          ctx.lineWidth = 4
          ctx.strokeRect(40, 40, 1000, 1270)

          // Top Header
          ctx.fillStyle = '#FF2E93'
          ctx.font = 'bold 22px Plus Jakarta Sans, sans-serif'
          ctx.fillText(`MUDARCURSO · SYS LOGO KIT 2026`, 60, 90)

          ctx.fillStyle = pageData.bg === '#FFFFFF' ? '#5B21B6' : '#FFFFFF'
          ctx.font = 'bold 18px Plus Jakarta Sans, sans-serif'
          ctx.fillText(`SLIDE ${slideNum} DE ${carouselSlideCount}`, 860, 90)

          // Título do Slide
          ctx.fillStyle = pageData.bg === '#FFFFFF' ? '#0F0B1F' : '#FFFFFF'
          ctx.font = '900 48px Archivo Black, sans-serif'
          ctx.fillText(pageData.title, 60, 180)

          // Subtítulo
          ctx.fillStyle =
            pageData.bg === '#FFFFFF' ? 'rgba(15,11,31,0.7)' : 'rgba(255,255,255,0.75)'
          ctx.font = '24px Plus Jakarta Sans, sans-serif'
          ctx.fillText(pageData.subtitle, 60, 230)

          // Logo no Centro
          const cfg = logoConfigs[pageData.kind]
          const svgCode = generateMudarCursoSvg(cfg, {
            background: 'transparent',
            overrideScale: 1.15,
          })
          const logoCanvas = await renderSvgToCanvas(svgCode, 900, 380, 'transparent')
          ctx.drawImage(logoCanvas, 90, 480)

          // Rodapé do slide
          ctx.fillStyle = '#FF2E93'
          ctx.fillRect(60, 1240, 60, 4)
          ctx.fillStyle = pageData.bg === '#FFFFFF' ? '#0F0B1F' : '#FFFFFF'
          ctx.font = '16px Plus Jakarta Sans, sans-serif'
          ctx.fillText('Consistência visual radical · Guia oficial de aplicação', 140, 1245)

          // 1. Exportar PNG 1080×1350
          const pngBase64 = slideCanvas.toDataURL('image/png').split(',')[1]
          const pngBytes = Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0))
          entries.push({
            name: `${projectName}-carrossel-slide-${slideNum}-1080x1350.png`,
            data: pngBytes,
          })

          // 2. Exportar JPG comprimido para WhatsApp
          const jpgBase64 = slideCanvas.toDataURL('image/jpeg', 0.8).split(',')[1]
          const jpgBytes = Uint8Array.from(atob(jpgBase64), (c) => c.charCodeAt(0))
          entries.push({
            name: `${projectName}-carrossel-slide-${slideNum}-whatsapp.jpg`,
            data: jpgBytes,
          })
        }
      }

      const zipBlob = createSimpleZip(entries)
      const zipName = `${projectName}-carrossel-${carouselSlideCount}-slides-1080x1350-${new Date().toISOString().split('T')[0]}.zip`
      triggerFileDownload(zipBlob, zipName)

      addLog(
        'Carrossel',
        `Carrossel gerado com sucesso: ${zipName} (${entries.length} arquivos PNG+JPG)`,
        'ok',
      )
      toast({
        title: 'Carrossel Gerado com Sucesso!',
        description: `${carouselSlideCount} slides exportados em 1080×1350 (PNG + JPG WhatsApp).`,
      })
    } catch (err: any) {
      addLog('Carrossel', `Falha ao gerar carrossel: ${err?.message}`, 'failed')
      toast({
        title: 'Erro ao gerar carrossel',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  // BAIXAR PACOTE REDES SOCIAIS (1080×1080, 1080×1350, 1200×628)
  const handleDownloadSocialPack = async (asJpg = false) => {
    if (dryRun) {
      addLog(
        'Página',
        `[DRY-RUN] Planejado pacote redes sociais (1080x1080, 1080x1350, 1200x628).`,
        'ok',
      )
      toast({ title: 'Dry-Run Ativo', description: 'Simulação de pacote de redes sociais.' })
      return
    }

    addLog(
      'Página',
      `Gerando pacote de redes sociais em ${asJpg ? 'JPG (WhatsApp)' : 'PNG'}...`,
      'pending',
    )
    toast({
      title: 'Gerando Pacote de Redes Sociais...',
      description: 'Formatos 1080×1080 (Feed), 1080×1350 (Retrato) e 1200×628 (Cover).',
    })

    try {
      const entries: ZipFileEntry[] = []
      const dims = [
        { label: '1080x1080-feed', w: 1080, h: 1080 },
        { label: '1080x1350-retrato', w: 1080, h: 1350 },
        { label: '1200x628-cover', w: 1200, h: 628 },
      ]

      for (const kind of ['primary', 'light'] as LogoVariationKind[]) {
        const cfg = logoConfigs[kind]
        for (const dim of dims) {
          const canvas = document.createElement('canvas')
          canvas.width = dim.w
          canvas.height = dim.h
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.fillStyle = kind === 'light' ? '#0F0B1F' : '#FFFFFF'
            ctx.fillRect(0, 0, dim.w, dim.h)

            const svg = generateMudarCursoSvg(cfg, { background: 'transparent' })
            const logoW = Math.round(dim.w * 0.75)
            const logoH = Math.round(logoW * (360 / 1200))
            const logoCvs = await renderSvgToCanvas(svg, logoW, logoH, 'transparent')

            ctx.drawImage(logoCvs, (dim.w - logoW) / 2, (dim.h - logoH) / 2)

            const mime = asJpg ? 'image/jpeg' : 'image/png'
            const ext = asJpg ? 'jpg' : 'png'
            const base64 = canvas.toDataURL(mime, 0.85).split(',')[1]
            const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

            entries.push({
              name: `${projectName}-${kind}-${dim.label}.${ext}`,
              data: bytes,
            })
          }
        }
      }

      const zipBlob = createSimpleZip(entries)
      const zipName = `${projectName}-redes-sociais-${asJpg ? 'whatsapp-jpg' : 'png'}.zip`
      triggerFileDownload(zipBlob, zipName)

      addLog('Página', `Pacote de redes sociais gerado: ${zipName}`, 'ok')
      toast({
        title: 'Pacote de Redes Sociais Concluído!',
        description: `Arquivo ${zipName} baixado com sucesso.`,
      })
    } catch (err: any) {
      addLog('Página', `Falha ao gerar redes sociais: ${err?.message}`, 'failed')
    }
  }

  // EXPORTAÇÕES DO CHECKLIST (PDF, JSON, MARKDOWN)
  const exportChecklist = (format: 'pdf' | 'json' | 'md') => {
    const listData = CHECKLIST_ITEMS.map((item) => ({
      item: item.title,
      descricao: item.desc,
      status: checkedMap[item.id] ? 'OK (Validado)' : 'Pendente',
      validado: Boolean(checkedMap[item.id]),
    }))

    if (format === 'json') {
      const blob = new Blob(
        [
          JSON.stringify(
            {
              projeto: projectName,
              data: new Date().toISOString(),
              total_itens: CHECKLIST_ITEMS.length,
              validados: validatedCount,
              checklist: listData,
            },
            null,
            2,
          ),
        ],
        { type: 'application/json' },
      )
      triggerFileDownload(blob, `${projectName}-checklist-conformidade.json`)
      addLog('Sistema', 'Checklist exportado em JSON', 'ok')
    } else if (format === 'md') {
      const mdLines = [
        `# Checklist de Conformidade · MudarCurso SYS LOGO KIT`,
        `**Projeto:** ${projectName} | **Data:** ${new Date().toLocaleDateString('pt-BR')}`,
        `**Progresso:** ${validatedCount} / ${CHECKLIST_ITEMS.length} validados\n`,
        `| Status | Item | Descrição |`,
        `| :--- | :--- | :--- |`,
        ...listData.map(
          (d) => `| ${d.validado ? '✅ OK' : '⏳ Pendente'} | **${d.item}** | ${d.descricao} |`,
        ),
        `\n> O export inclui o estado atual dos itens marcados ('ok') para você registrar ou compartilhar internamente.`,
      ]
      const blob = new Blob([mdLines.join('\n')], { type: 'text/markdown;charset=utf-8' })
      triggerFileDownload(blob, `${projectName}-checklist-conformidade.md`)
      addLog('Sistema', 'Checklist exportado em Markdown', 'ok')
    } else if (format === 'pdf') {
      openChecklistPrintWindow()
      addLog('Sistema', 'Checklist aberto para impressão PDF', 'ok')
    }
  }

  // EXPORTAÇÃO DA MATRIZ DE CONTRASTE (PDF / JSON)
  const exportContrastMatrix = (format: 'pdf' | 'json') => {
    const rows = buildMudarCursoContrastMatrix().filter((r) =>
      contrastFilter === 'failed' ? !r.passed : true,
    )

    if (format === 'json') {
      const blob = new Blob(
        [
          JSON.stringify(
            {
              norma: 'WCAG 2.1 (Luminância Relativa)',
              projeto: projectName,
              data: new Date().toISOString(),
              criterio: 'Razão ≥ 4.5 = AA · ≥ 7 = AAA',
              resultados: rows,
            },
            null,
            2,
          ),
        ],
        { type: 'application/json' },
      )
      triggerFileDownload(blob, `${projectName}-matriz-contraste-wcag.json`)
      addLog('Sistema', 'Matriz de contraste exportada em JSON', 'ok')
    } else {
      openContrastPrintWindow(rows)
      addLog('Sistema', 'Matriz de contraste aberta para impressão PDF', 'ok')
    }
  }

  // EXPORTAR LOGS (JSON / TXT)
  const handleExportLogs = (format: 'json' | 'txt') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(logs, null, 2)], {
        type: 'application/json',
      })
      triggerFileDownload(blob, `${projectName}-logs-${Date.now()}.json`)
    } else {
      const txt = logs
        .map(
          (l) => `[${l.time}] [${l.type.toUpperCase()}] [${l.status.toUpperCase()}] ${l.message}`,
        )
        .join('\n')
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
      triggerFileDownload(blob, `${projectName}-logs-${Date.now()}.txt`)
    }
    toast({
      title: 'Logs Exportados',
      description: `Arquivo de logs em .${format.toUpperCase()} baixado.`,
    })
  }

  // Salvar alterações vindas do editor avançado
  const handleSaveEditorChanges = async (updated: LogoKitVariationConfig) => {
    setLogoConfigs((prev) => ({ ...prev, [updated.kind]: updated }))
    await saveLogoKitEdit(updated.kind, updated, user?.id)
    addLog('Página', `Configuração da "${updated.title}" salva com sucesso.`, 'ok')
  }

  // DOWNLOAD DE MATERIAL CUSTOMIZADO
  const downloadCustomMaterial = async (
    material: BrandKitMaterialItem,
    format: 'svg' | 'png' | 'jpg' | 'pdf' | 'draft' | 'favicons',
    size = 2048,
  ) => {
    const isDraft = format === 'draft'

    if (dryRun) {
      addLog(
        'Página',
        `[DRY-RUN] Planejado download: ${material.title} em .${format.toUpperCase()} (${size}px). Nenhuma escrita em disco.`,
        'ok',
      )
      toast({
        title: 'Modo Dry-Run Ativo',
        description: `Download planejado: ${material.title} (${format.toUpperCase()}) sem gerar arquivos.`,
      })
      return
    }

    addLog(
      'Página',
      `Iniciando renderização de "${material.title}" em formato .${format.toUpperCase()} (${size}px)...`,
      'pending',
    )

    try {
      const svgCode = generateMaterialSvg(material, {
        background: format === 'jpg' ? 'light' : 'transparent',
        forceWatermark: isDraft,
      })

      const safeSlug =
        material.fileNameCustom || material.title.toLowerCase().replace(/[^a-z0-9_-]/g, '-')

      if (format === 'svg') {
        const fileName = `${safeSlug}-${isDraft ? 'rascunho' : 'vetor'}.svg`
        const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' })
        triggerFileDownload(blob, fileName)
        addLog('Página', `Download SVG concluído: ${fileName}`, 'ok')
      } else if (format === 'png' || format === 'draft') {
        const isIconOrMark =
          material.layoutType === 'symbol-only' ||
          material.layoutType === 'badge-round' ||
          (material.category as string) === 'simbolo' ||
          (material.category as string) === 'icone'
        const h = isIconOrMark ? size : Math.round(size * (360 / 1200))
        const canvas = await renderSvgToCanvas(svgCode, size, h, 'transparent')
        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `${safeSlug}-${isDraft ? `rascunho-${size}px` : `${size}px`}.png`
            triggerFileDownload(blob, fileName)
            addLog('Página', `Download PNG concluído: ${fileName}`, 'ok')
          }
        }, 'image/png')
      } else if (format === 'jpg') {
        const isIconOrMark =
          material.layoutType === 'symbol-only' ||
          material.layoutType === 'badge-round' ||
          (material.category as string) === 'simbolo' ||
          (material.category as string) === 'icone'
        const h = isIconOrMark ? size : Math.round(size * (360 / 1200))
        const canvas = await renderSvgToCanvas(svgCode, size, h, '#FFFFFF')
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const fileName = `${safeSlug}-fundo-branco-${size}px.jpg`
              triggerFileDownload(blob, fileName)
              addLog('Página', `Download JPG concluído: ${fileName}`, 'ok')
            }
          },
          'image/jpeg',
          0.92,
        )
      } else if (format === 'favicons') {
        const markSvg = generateMaterialSvg(material, { background: 'transparent' })
        const entries: ZipFileEntry[] = [
          { name: 'favicon.svg', data: markSvg },
          {
            name: 'README-FAVICONS.txt',
            data: `Favicons gerados para o material ${material.title} (MidiaViva / MudarCurso).`,
          },
        ]
        const faviconSizes = [16, 32, 48, 64, 180, 512]
        for (const fSize of faviconSizes) {
          const cvs = await renderSvgToCanvas(markSvg, fSize, fSize, 'transparent')
          const dataUrl = cvs.toDataURL('image/png')
          const base64 = dataUrl.split(',')[1]
          const binaryStr = window.atob(base64)
          const bytes = new Uint8Array(binaryStr.length)
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i)
          }
          entries.push({
            name: `favicon-${fSize}x${fSize}.png`,
            data: bytes,
          })
        }
        const zipBlob = createSimpleZip(entries)
        const zipName = `${safeSlug}-favicons-pack.zip`
        triggerFileDownload(zipBlob, zipName)
        addLog(
          'Miniaturas',
          `Pacote de favicons gerado para ${material.title}: ${zipName} (${entries.length} arquivos)`,
          'ok',
        )
      } else if (format === 'pdf') {
        const printWindow = window.open('', '_blank', 'width=900,height=750')
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="utf-8" />
              <title>${material.title} · Guia de Impressão</title>
              <style>
                @page { size: A4 landscape; margin: 15mm; }
                body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #fff; color: #0F0B1F; margin: 0; padding: 20px; }
                .header { border-bottom: 3px solid #5B21B6; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
                .title { font-size: 24px; font-weight: 900; color: #5B21B6; }
                .meta { font-size: 11px; color: #6b7280; }
                .preview-box { border: 2px dashed #e5e7eb; border-radius: 12px; padding: 32px; display: flex; justify-content: center; align-items: center; background: #fafafa; }
                .specs { margin-top: 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 12px; }
                .spec-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
                .spec-label { font-weight: bold; color: #5B21B6; font-size: 10px; text-transform: uppercase; }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <div class="title">${material.title}</div>
                  <div class="meta">${material.subtitle || 'Material do Brand Kit'} · Categoria: ${material.category}</div>
                </div>
                <div class="meta">MidiaViva Brand Kit · ${new Date().toLocaleDateString('pt-BR')}</div>
              </div>
              <div class="preview-box">
                <div style="max-width: 600px; width: 100%;">${svgCode}</div>
              </div>
              <div class="specs">
                <div class="spec-card">
                  <div class="spec-label">Cor Primária</div>
                  <div style="font-family: monospace; font-weight: bold;">${material.primaryColor}</div>
                </div>
                <div class="spec-card">
                  <div class="spec-label">Cor Secundária</div>
                  <div style="font-family: monospace; font-weight: bold;">${material.secondaryColor || 'N/A'}</div>
                </div>
                <div class="spec-card">
                  <div class="spec-label">Destaque Rosa</div>
                  <div style="font-family: monospace; font-weight: bold;">${material.accentColor || '#FF2E93'}</div>
                </div>
              </div>
            </body>
            </html>
          `)
          printWindow.document.close()
          printWindow.focus()
          setTimeout(() => {
            printWindow.print()
          }, 350)
        }
        addLog('Página', `Guia de impressão PDF aberto para "${material.title}"`, 'ok')
      }

      toast({
        title: 'Download gerado com sucesso!',
        description: `Material "${material.title}" exportado em .${format.toUpperCase()}.`,
      })
    } catch (err: any) {
      addLog('Página', `Falha ao gerar ${material.title}: ${err?.message}`, 'failed')
      toast({
        title: 'Erro ao gerar download',
        description: err?.message || 'Falha no processamento.',
        variant: 'destructive',
      })
    }
  }

  // EXCLUSÃO DE MATERIAL CUSTOMIZADO
  const handleConfirmDeleteMaterial = async () => {
    if (!materialToDelete) return
    try {
      await deleteBrandKitMaterial(materialToDelete.id)
      setCustomMaterials((prev) => prev.filter((m) => m.id !== materialToDelete.id))
      toast({
        title: 'Material excluído',
        description: `"${materialToDelete.title}" foi removido do seu kit de marca.`,
      })
      addLog('Sistema', `Material customizado excluído: ${materialToDelete.title}`, 'ok')
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err?.message || 'Não foi possível excluir o material.',
        variant: 'destructive',
      })
    } finally {
      setMaterialToDelete(null)
    }
  }

  // SALVAR MATERIAL (CRIADO OU EDITADO)
  const handleSaveMaterial = async (
    data: Omit<BrandKitMaterialItem, 'id'> & { id?: string },
    file?: File,
  ) => {
    try {
      const saved = await saveBrandKitMaterial(
        {
          ...data,
          userId: user?.id,
        },
        user?.id,
        file,
      )
      setCustomMaterials((prev) => {
        const idx = prev.findIndex((m) => m.id === saved.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = saved
          return next
        }
        return [saved, ...prev]
      })
      toast({
        title: 'Material salvo com sucesso!',
        description: `"${saved.title}" está disponível no seu Brand Kit.`,
      })
      addLog('Sistema', `Material customizado salvo: ${saved.title}`, 'ok')
      setMaterialModalOpen(false)
      setEditingMaterial(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar material',
        description: err?.message || 'Falha ao salvar no banco de dados.',
        variant: 'destructive',
      })
    }
  }

  // Janela de impressão estruturada para PDF do guia
  const openPdfPrintGuide = (
    kind: LogoVariationKind,
    svgContent: string,
    cfg: LogoKitVariationConfig,
  ) => {
    const printWin = window.open('', '_blank', 'width=1000,height=800')
    if (!printWin) return

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SYS · LOGO KIT 2026 — ${cfg.title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #1e1b4b; background: #fff; }
            .header { border-bottom: 3px solid #5b21b6; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: 900; margin: 0; color: #5b21b6; }
            .subtitle { font-size: 14px; color: #666; margin-top: 6px; }
            .preview-box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; text-align: center; margin: 24px 0; background: #faf5ff; }
            .specs { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 30px; font-size: 13px; }
            .spec-card { border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; }
            .spec-card strong { color: #5b21b6; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">SYS · LOGO KIT — v1.0 · 2026</h1>
            <div class="subtitle">MUDARCURSO · GUIA RÁPIDO OFICIAL · ${cfg.title.toUpperCase()}</div>
          </div>
          <div class="preview-box">
            ${svgContent}
          </div>
          <div class="specs">
            <div class="spec-card">
              <strong>ÁREA DE PROTEÇÃO:</strong><br />
              Margem mínima obrigatória equivalente à altura do símbolo (X) em todos os quatro cantos.
            </div>
            <div class="spec-card">
              <strong>ESPECIFICAÇÕES DE COR:</strong><br />
              Primária: ${cfg.primaryColor} · Secundária: ${cfg.secondaryColor} · Mono: ${cfg.monoColor}
            </div>
            <div class="spec-card">
              <strong>TAMANHO MÍNIMO:</strong><br />
              Logo completa: 24px digital / 12mm impresso · Mark isolado: 16px digital / 8mm impresso.
            </div>
            <div class="spec-card">
              <strong>CONFORMIDADE WCAG:</strong><br />
              Atende critérios AA e AAA de luminância para legibilidade em ambientes digitais e físicos.
            </div>
          </div>
        </body>
      </html>
    `)
    printWin.document.close()
    printWin.focus()
    setTimeout(() => {
      printWin.print()
    }, 400)
  }

  // Janela de impressão de Checklist
  const openChecklistPrintWindow = () => {
    const printWin = window.open('', '_blank', 'width=900,height=700')
    if (!printWin) return

    const rows = CHECKLIST_ITEMS.map((item) => {
      const ok = checkedMap[item.id]
      return `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${ok ? '#059669' : '#dc2626'};">${ok ? '✓ OK' : '○ Pendente'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>${item.title}</strong><br/><span style="color:#666; font-size:12px;">${item.desc}</span></td>
      </tr>`
    }).join('')

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Checklist de Conformidade · MudarCurso</title>
          <style>body { font-family: sans-serif; padding: 40px; } table { width: 100%; border-collapse: collapse; }</style>
        </head>
        <body>
          <h2 style="color: #5b21b6;">Checklist de Conformidade de Marca</h2>
          <p>Projeto: <strong>${projectName}</strong> | Validados: <strong>${validatedCount} / ${CHECKLIST_ITEMS.length}</strong></p>
          <table><tbody>${rows}</tbody></table>
        </body>
      </html>
    `)
    printWin.document.close()
    printWin.focus()
    setTimeout(() => printWin.print(), 300)
  }

  // Janela de impressão de Matriz de Contraste
  const openContrastPrintWindow = (rows: ContrastMatrixRow[]) => {
    const printWin = window.open('', '_blank', 'width=900,height=700')
    if (!printWin) return

    const tableRows = rows
      .map(
        (r) => `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.variationTitle}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.bgName} (${r.bgColor})</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace;">${r.ratio}:1</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: ${r.passed ? '#059669' : '#dc2626'};">${r.level}</td>
    </tr>`,
      )
      .join('')

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Matriz de Contraste WCAG 2.1 · MudarCurso</title><style>body{font-family:sans-serif;padding:30px;}table{width:100%;border-collapse:collapse;font-size:13px;}</style></head>
        <body>
          <h2 style="color:#5b21b6;">Verificação de Contraste (WCAG 2.1)</h2>
          <p>Razão ≥ 4.5 = AA · ≥ 7 = AAA</p>
          <table><thead><tr style="background:#faf5ff;text-align:left;"><th style="padding:8px;">Variação</th><th style="padding:8px;">Fundo</th><th style="padding:8px;">Razão</th><th style="padding:8px;">Classificação</th></tr></thead><tbody>${tableRows}</tbody></table>
        </body>
      </html>
    `)
    printWin.document.close()
    printWin.focus()
    setTimeout(() => printWin.print(), 300)
  }

  const contrastRows = useMemo(() => {
    return buildMudarCursoContrastMatrix().filter((r) =>
      contrastFilter === 'failed' ? !r.passed : true,
    )
  }, [contrastFilter])

  const filteredLogs = useMemo(() => {
    if (selectedLogTypeFilter === 'all') return logs
    return logs.filter((l) => l.type === selectedLogTypeFilter)
  }, [logs, selectedLogTypeFilter])

  return (
    <div className="space-y-10">
      {/* ============================================================ */}
      {/* 1. CABEÇALHO HERO OFICIAL DO LOGO KIT                          */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B081A] via-[#1B0A4D] to-[#2B0A8A] text-white p-6 sm:p-10 border border-purple-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF2E93]/15 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#5B21B6]/30 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-[#5B21B6] via-[#7C3AED] to-[#FF2E93] text-white font-extrabold tracking-wider uppercase px-3.5 py-1 border-0 shadow-md">
                  SYS · LOGO KIT — v1.0 · 2026
                </Badge>
                <Badge variant="outline" className="border-pink-500/40 text-pink-300 text-xs">
                  MudarCurso Oficial
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Logo Oficial · <span className="italic text-[#FF7BC1]">MudarCurso</span>
              </h1>

              <p className="text-purple-100/90 text-sm sm:text-base leading-relaxed">
                Apenas a logo oficial da MudarCurso — quatro variações, quatro formatos. Baixe
                individualmente ou todas de uma vez em um único pacote ZIP.
              </p>
            </div>

            {/* Ação Primária: Baixar Tudo (ZIP) */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button
                onClick={handleDownloadAllZip}
                className="h-12 px-6 rounded-2xl bg-gradient-to-r from-[#5B21B6] via-[#FF2E93] to-[#FF7BC1] hover:brightness-110 text-white font-extrabold text-sm shadow-xl shadow-purple-950/50 gap-2 uppercase tracking-wider"
              >
                <FileArchive className="w-4 h-4" />
                <span>Baixar tudo (ZIP)</span>
              </Button>
            </div>
          </div>

          {/* Barra de Ações Rápidas do Cabeçalho */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadSingleLogo('primary', 'pdf')}
              className="rounded-xl border-white/20 text-white hover:bg-white/10 text-xs gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-pink-300" />
              <span>Guia rápido (PDF)</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadSingleLogo('mark', 'favicons')}
              className="rounded-xl border-white/20 text-white hover:bg-white/10 text-xs gap-1.5"
            >
              <FileArchive className="w-3.5 h-3.5 text-purple-300" />
              <span>Favicons (ZIP)</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadSingleLogo('primary', 'png', 2048)}
              className="rounded-xl border-white/20 text-white hover:bg-white/10 text-xs gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-300" />
              <span>Guia em PNG</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadSingleLogo('primary', 'jpg', 1200)}
              className="rounded-xl border-white/20 text-white hover:bg-white/10 text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Guia comprimido (WhatsApp)</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadSocialPack(false)}
              className="rounded-xl border-white/20 text-white hover:bg-white/10 text-xs gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
              <span>Redes sociais (PNG)</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadSocialPack(true)}
              className="rounded-xl border-white/20 text-white hover:bg-white/10 text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Redes sociais (WhatsApp JPG)</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setPromptsModalOpen(true)}
              className="rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 text-xs font-bold gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-300" />
              <span>Prompts revisados dos materiais oficiais</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. OS 4 CARDS DE VARIAÇÃO DA LOGO                             */}
      {/* ============================================================ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              Variações da Identidade & Materiais
            </h2>
            <p className="text-xs text-muted-foreground">
              As 4 variações oficiais da MudarCurso mais seus materiais customizados com preview em
              tempo real, download em 6 formatos e edição.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs font-mono border-purple-500/30 text-purple-600"
            >
              4 Oficiais + {customMaterials.length} Customizados
            </Badge>
            <Button
              onClick={() => {
                setEditingMaterial(null)
                setMaterialModalOpen(true)
              }}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#5B21B6] to-[#FF2E93] hover:brightness-110 text-white font-bold text-xs shadow-md gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Novo material</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(['primary', 'light', 'mono-dark', 'mark'] as LogoVariationKind[]).map((kind) => {
            const cfg = logoConfigs[kind]
            const activeBg = previewBgs[kind]
            const svgPreview = generateMudarCursoSvg(cfg, { background: activeBg })

            return (
              <Card
                key={kind}
                className="overflow-hidden rounded-3xl border border-border/80 bg-card hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-900/10 transition-all flex flex-col justify-between"
              >
                {/* Cabeçalho do Card */}
                <div className="p-5 pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#5B21B6] text-white text-[10px] font-mono uppercase">
                          {cfg.kind}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {cfg.fileNameCustom}.svg
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-foreground">{cfg.title}</h3>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                        {cfg.subtitle}
                      </p>
                    </div>

                    {/* Botão de Edição Avançada (Controlado pelos Labs) */}
                    {isLabFeatureEnabled('brand-kit-logo-editor', true) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingKind(kind)}
                        className="rounded-xl border-purple-500/40 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10 text-xs font-bold gap-1.5 shrink-0"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </Button>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-muted-foreground border-border/80"
                        title="Habilite a Edição Avançada na aba Labs"
                      >
                        Padrão MudarCurso
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cfg.description}</p>
                </div>

                {/* Área de Preview por fundo com 3 Abas */}
                <div className="px-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Eye className="w-3 h-3 text-purple-600" /> Preview por fundo:
                    </span>
                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPreviewBgs({ ...previewBgs, [kind]: 'light' })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          activeBg === 'light'
                            ? 'bg-white text-black shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Fundo claro
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewBgs({ ...previewBgs, [kind]: 'dark' })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          activeBg === 'dark'
                            ? 'bg-[#0F0B1F] text-white shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Fundo escuro
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewBgs({ ...previewBgs, [kind]: 'violet' })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          activeBg === 'violet'
                            ? 'bg-[#5B21B6] text-white shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Fundo violeta
                      </button>
                    </div>
                  </div>

                  {/* Canvas do Preview */}
                  <div
                    className={`relative rounded-2xl p-6 min-h-[190px] flex items-center justify-center border transition-all ${
                      activeBg === 'light'
                        ? 'bg-white border-slate-200 text-slate-900'
                        : activeBg === 'dark'
                          ? 'bg-[#0F0B1F] border-purple-500/20 text-white'
                          : 'bg-[#5B21B6] border-purple-400/30 text-white'
                    }`}
                  >
                    <div
                      className="w-full max-h-[150px] flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: svgPreview }}
                    />
                  </div>
                </div>

                {/* Rodapé com Botões de Download */}
                <div className="p-5 pt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => downloadSingleLogo(kind, 'svg')}
                      className="rounded-xl text-xs font-bold bg-[#5B21B6] hover:bg-[#6D28D9] text-white gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>SVG</span>
                    </Button>

                    {/* Dropdown de tamanhos PNG */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-xs font-bold border-border/80 gap-1"
                        >
                          <Download className="w-3.5 h-3.5 text-purple-600" />
                          <span>PNG (2048px) ▼</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="rounded-2xl border-border bg-card">
                        {[128, 256, 512, 768, 1024, 2048, 4096].map((s) => (
                          <DropdownMenuItem
                            key={s}
                            onClick={() => downloadSingleLogo(kind, 'png', s)}
                            className="text-xs font-medium cursor-pointer"
                          >
                            PNG {s}×{kind === 'mark' ? s : Math.round(s * (360 / 1200))}px
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadSingleLogo(kind, 'jpg')}
                      className="rounded-xl text-xs font-bold border-border/80 gap-1"
                    >
                      <Download className="w-3.5 h-3.5 text-pink-600" />
                      <span>JPG</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadSingleLogo(kind, 'pdf')}
                      className="rounded-xl text-xs font-bold border-border/80 gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>PDF</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadSingleLogo(kind, 'favicons')}
                      className="rounded-xl text-xs font-bold border-border/80 gap-1"
                      title="Miniaturas e Favicons em SVG e PNG"
                    >
                      <span>Favicons</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadSingleLogo(kind, 'draft')}
                      className="rounded-xl text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-1"
                    >
                      <span>"Rascunho"</span>
                    </Button>
                  </div>

                  {/* Nota técnica obrigatória */}
                  <p className="text-[11px] text-muted-foreground leading-tight pt-1 border-t border-border/60">
                    SVG e PNG são exportados com fundo transparente · JPG com fundo branco ·
                    "Rascunho" inclui marca d'água diagonal.
                  </p>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Grade de Materiais Customizados criados pelo usuário */}
        {customMaterials.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-foreground">
                  Materiais Adicionais da Marca ({customMaterials.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Materiais criados sob medida com controle de cor, ícone, subtítulo e exportação
                  multiformato.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {customMaterials.map((material) => {
                const activeBg = customMaterialBgs[material.id] || 'light'
                const svgPreview = generateMaterialSvg(material, { background: activeBg })

                return (
                  <Card
                    key={material.id}
                    className="overflow-hidden rounded-3xl border border-purple-500/30 bg-card hover:border-purple-500/60 hover:shadow-2xl hover:shadow-purple-900/10 transition-all flex flex-col justify-between"
                  >
                    {/* Cabeçalho do Card */}
                    <div className="p-5 pb-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-mono uppercase">
                              {material.category}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {material.fileNameCustom || material.title}.svg
                            </span>
                          </div>
                          <h4 className="text-lg font-black text-foreground">{material.title}</h4>
                          {material.subtitle && (
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                              {material.subtitle}
                            </p>
                          )}
                        </div>

                        {/* Ações: Editar e Excluir */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingMaterial(material)
                              setMaterialModalOpen(true)
                            }}
                            className="rounded-xl border-purple-500/40 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10 text-xs font-bold gap-1 h-8 px-2.5"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setMaterialToDelete(material)}
                            className="rounded-xl text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 text-xs font-bold h-8 px-2"
                            title="Excluir material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      {material.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {material.description}
                        </p>
                      )}
                    </div>

                    {/* Área de Preview por fundo com 3 Abas */}
                    <div className="px-5 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <Eye className="w-3 h-3 text-purple-600" /> Preview por fundo:
                        </span>
                        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() =>
                              setCustomMaterialBgs((prev) => ({ ...prev, [material.id]: 'light' }))
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              activeBg === 'light'
                                ? 'bg-white text-black shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Fundo claro
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomMaterialBgs((prev) => ({ ...prev, [material.id]: 'dark' }))
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              activeBg === 'dark'
                                ? 'bg-[#0F0B1F] text-white shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Fundo escuro
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomMaterialBgs((prev) => ({ ...prev, [material.id]: 'violet' }))
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              activeBg === 'violet'
                                ? 'bg-[#5B21B6] text-white shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Fundo violeta
                          </button>
                        </div>
                      </div>

                      {/* Canvas do Preview */}
                      <div
                        className={`relative rounded-2xl p-6 min-h-[190px] flex items-center justify-center border transition-all ${
                          activeBg === 'light'
                            ? 'bg-white border-slate-200 text-slate-900'
                            : activeBg === 'dark'
                              ? 'bg-[#0F0B1F] border-purple-500/20 text-white'
                              : 'bg-[#5B21B6] border-purple-400/30 text-white'
                        }`}
                      >
                        <div
                          className="w-full max-h-[150px] flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: svgPreview }}
                        />
                      </div>
                    </div>

                    {/* Rodapé com Botões de Download */}
                    <div className="p-5 pt-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => downloadCustomMaterial(material, 'svg')}
                          className="rounded-xl text-xs font-bold bg-[#5B21B6] hover:bg-[#6D28D9] text-white gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>SVG</span>
                        </Button>

                        {/* Dropdown de tamanhos PNG */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl text-xs font-bold border-border/80 gap-1"
                            >
                              <Download className="w-3.5 h-3.5 text-purple-600" />
                              <span>PNG (2048px) ▼</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="rounded-2xl border-border bg-card">
                            {[128, 256, 512, 768, 1024, 2048, 4096].map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => downloadCustomMaterial(material, 'png', s)}
                                className="text-xs font-medium cursor-pointer"
                              >
                                PNG {s}px
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadCustomMaterial(material, 'jpg')}
                          className="rounded-xl text-xs font-bold border-border/80 gap-1"
                        >
                          <Download className="w-3.5 h-3.5 text-pink-600" />
                          <span>JPG</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadCustomMaterial(material, 'pdf')}
                          className="rounded-xl text-xs font-bold border-border/80 gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>PDF</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadCustomMaterial(material, 'favicons')}
                          className="rounded-xl text-xs font-bold border-border/80 gap-1"
                          title="Miniaturas e Favicons em SVG e PNG"
                        >
                          <span>Favicons</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadCustomMaterial(material, 'draft')}
                          className="rounded-xl text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-1"
                        >
                          <span>"Rascunho"</span>
                        </Button>
                      </div>

                      {/* Nota técnica */}
                      <p className="text-[11px] text-muted-foreground leading-tight pt-1 border-t border-border/60">
                        SVG e PNG com transparência · JPG com fundo branco · Rascunho com marca
                        d'água técnica.
                      </p>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 3. GUIA RÁPIDO DE USO & PACOTE SOCIAL (CARD)                 */}
      {/* ============================================================ */}
      <Card className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-card via-card to-purple-950/20 border border-purple-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Badge className="bg-[#5B21B6] text-white text-[10px] font-bold uppercase">
              Guia Rápido de Uso
            </Badge>
            <h3 className="text-xl font-black text-foreground">
              Área de proteção, variações e exemplos em fundos.
            </h3>
            <p className="text-xs text-muted-foreground">
              Pacote de redes sociais inclui 1080×1080 · 1080×1350 · 1200×628 para cada página do
              guia.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => downloadSingleLogo('primary', 'pdf')}
              className="rounded-xl text-xs font-bold bg-[#5B21B6] hover:bg-[#6D28D9] text-white gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Exportar PDF</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadSingleLogo('primary', 'png', 2048)}
              className="rounded-xl text-xs font-bold border-border/80 gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
              <span>Exportar PNG</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* 4. CHECKLIST DE CONFORMIDADE                                  */}
      {/* ============================================================ */}
      <Card className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="text-xl font-black text-foreground">Checklist de Conformidade</h3>
              <Badge
                className={`font-mono text-xs font-bold ${
                  validatedCount === CHECKLIST_ITEMS.length
                    ? 'bg-emerald-600 text-white'
                    : 'bg-purple-600 text-white'
                }`}
              >
                {validatedCount} / {CHECKLIST_ITEMS.length} validados
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              O export inclui o estado atual dos itens marcados ('ok') para você registrar ou
              compartilhar internamente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportChecklist('pdf')}
              className="rounded-xl text-xs font-bold border-border/80 gap-1"
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Exportar PDF</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportChecklist('json')}
              className="rounded-xl text-xs font-bold border-border/80 gap-1"
            >
              <span>Exportar JSON</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportChecklist('md')}
              className="rounded-xl text-xs font-bold border-border/80 gap-1"
            >
              <span>Exportar Markdown</span>
            </Button>
          </div>
        </div>

        {/* Grid dos 6 Itens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHECKLIST_ITEMS.map((item) => {
            const isChecked = Boolean(checkedMap[item.id])
            return (
              <div
                key={item.id}
                onClick={() => toggleChecklist(item.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  isChecked
                    ? 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/20'
                    : 'border-border/80 bg-muted/30 hover:border-purple-500/30'
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleChecklist(item.id)}
                  className="mt-0.5 rounded-md data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <div className="space-y-1">
                  <h4
                    className={`text-xs font-bold ${
                      isChecked ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ============================================================ */}
      {/* 5. VERIFICAÇÃO DE CONTRASTE (WCAG 2.1)                         */}
      {/* ============================================================ */}
      <Card className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              <h3 className="text-xl font-black text-foreground">
                Verificação de contraste (WCAG 2.1)
              </h3>
              <Badge variant="outline" className="text-xs font-mono border-purple-500/30">
                Razão ≥ 4.5 = AA · ≥ 7 = AAA
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Cálculo real de luminância relativa entre as 4 variações e as superfícies oficiais
              (Claro #FFFFFF, Escuro #0F0B1F e Violeta #5B21B6).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setContrastFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  contrastFilter === 'all'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-muted-foreground'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setContrastFilter('failed')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  contrastFilter === 'failed'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-muted-foreground'
                }`}
              >
                Apenas reprovados
              </button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => exportContrastMatrix('pdf')}
              className="rounded-xl text-xs font-bold border-border/80"
            >
              Exportar PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportContrastMatrix('json')}
              className="rounded-xl text-xs font-bold border-border/80"
            >
              Exportar JSON
            </Button>
          </div>
        </div>

        {/* Tabela de Contraste */}
        <div className="overflow-x-auto rounded-2xl border border-border/80">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/60 text-muted-foreground uppercase font-mono text-[10px] border-b border-border/80">
              <tr>
                <th className="p-3 pl-4">Variação de Logo</th>
                <th className="p-3">Fundo de Aplicação</th>
                <th className="p-3">Cor da Marca</th>
                <th className="p-3">Razão de Contraste</th>
                <th className="p-3 pr-4">Classificação WCAG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {contrastRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 pl-4 font-bold text-foreground">{row.variationTitle}</td>
                  <td className="p-3">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-border shrink-0"
                        style={{ backgroundColor: row.bgColor }}
                      />
                      <span>
                        {row.bgName} ({row.bgColor})
                      </span>
                    </span>
                  </td>
                  <td className="p-3 font-mono">{row.fgColor}</td>
                  <td className="p-3 font-mono font-bold text-foreground">{row.ratio}:1</td>
                  <td className="p-3 pr-4">
                    <Badge
                      className={`text-[10px] font-bold ${
                        row.level === 'AAA'
                          ? 'bg-emerald-600 text-white'
                          : row.level === 'AA'
                            ? 'bg-purple-600 text-white'
                            : 'bg-rose-600 text-white'
                      }`}
                    >
                      {row.level}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* 6. NOMENCLATURA DOS ARQUIVOS                                  */}
      {/* ============================================================ */}
      <Card className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-4">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-foreground">Nomenclatura dos arquivos</h3>
          <p className="text-xs text-muted-foreground">
            Tokens disponíveis: <code className="text-purple-600 font-mono">{'{project}'}</code>,{' '}
            <code className="text-purple-600 font-mono">{'{kind}'}</code>,{' '}
            <code className="text-purple-600 font-mono">{'{page}'}</code>,{' '}
            <code className="text-purple-600 font-mono">{'{format}'}</code>,{' '}
            <code className="text-purple-600 font-mono">{'{detail}'}</code>,{' '}
            <code className="text-purple-600 font-mono">{'{date}'}</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Nome do projeto</label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="mudarcurso"
              className="h-10 text-xs rounded-xl bg-muted/40 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Padrão de nome</label>
            <Input
              value={namingPattern}
              onChange={(e) => setNamingPattern(e.target.value)}
              placeholder="{project}-{kind}-{detail}-{date}"
              className="h-10 text-xs rounded-xl bg-muted/40 font-mono"
            />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-muted/50 border border-border/70 text-xs font-mono text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>
            Exemplo:{' '}
            <strong className="text-foreground">
              {projectName}-carrossel-5-slides-1080x1350-2026-10-26.zip
            </strong>
          </span>
          <span className="text-[11px] text-purple-600 font-sans font-semibold">
            Padrão aplicado nos downloads
          </span>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* 7. DOWNLOAD POR PÁGINA · CARROSSEL                           */}
      {/* ============================================================ */}
      <Card className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Badge className="bg-[#5B21B6] text-white text-[10px] font-bold uppercase">
              Carrossel Multi-Slides
            </Badge>
            <h3 className="text-xl font-black text-foreground">Download por página · carrossel</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Se o número de slides for maior que o número de páginas do guia (6), as páginas se
              repetem na ordem.
            </p>
          </div>

          {/* Seletor de slides (3/5/7) */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-foreground">Slides:</span>
            <div className="flex items-center bg-muted/60 p-1 rounded-xl text-xs">
              {([3, 5, 7] as const).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCarouselSlideCount(num)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    carouselSlideCount === num
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {num} slides
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-muted/30 border border-border/70">
          <div className="flex items-center gap-3">
            <Switch
              checked={autoLoadThumbnails}
              onCheckedChange={setAutoLoadThumbnails}
              id="autoload-thumbs"
            />
            <label
              htmlFor="autoload-thumbs"
              className="text-xs font-semibold text-foreground cursor-pointer"
            >
              Carregar automaticamente / Carregar miniaturas
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadSingleLogo('mark', 'favicons')}
              className="rounded-xl text-xs font-bold border-border/80 gap-1.5"
            >
              <FileArchive className="w-3.5 h-3.5 text-purple-600" />
              <span>Miniaturas (ZIP)</span>
            </Button>

            <Button
              size="sm"
              onClick={handleDownloadCarousel}
              className="rounded-xl text-xs font-bold bg-gradient-to-r from-[#5B21B6] to-[#FF2E93] hover:brightness-110 text-white shadow-md gap-1.5 px-4"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar carrossel · {carouselSlideCount}×1080×1350 (PNG + JPG)</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* 8. LOGS DE GERAÇÃO                                            */}
      {/* ============================================================ */}
      <Card className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-foreground">Logs de geração</h3>
            <p className="text-xs text-muted-foreground">
              Preferências salvas: padrão de nome, projeto, página, formato, slides, miniaturas
              (auto-load), filtro de contraste, dry-run, etapa selecionada para re-execução,
              'reexecutar pendentes' e o último job falho.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExportLogs('json')}
              className="rounded-xl text-xs font-bold border-border/80"
            >
              Exportar logs (JSON)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExportLogs('txt')}
              className="rounded-xl text-xs font-bold border-border/80"
            >
              Exportar logs (TXT)
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLogs([])}
              className="rounded-xl text-xs text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Limpar
            </Button>
          </div>
        </div>

        {/* Barra de Controles dos Logs */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-muted/40 border border-border/70 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle Dry-Run */}
            <div className="flex items-center gap-1.5">
              <Switch checked={dryRun} onCheckedChange={setDryRun} id="dry-run-switch" />
              <label
                htmlFor="dry-run-switch"
                className="font-semibold text-foreground cursor-pointer"
              >
                Dry-run (só planeja, não executa)
              </label>
            </div>

            {/* Toggle Auto-Retry */}
            <div className="flex items-center gap-1.5">
              <Switch checked={autoRetry} onCheckedChange={setAutoRetry} id="auto-retry-switch" />
              <label
                htmlFor="auto-retry-switch"
                className="font-semibold text-muted-foreground cursor-pointer"
              >
                {autoRetry ? 'Auto-retry on' : 'Auto-retry off'}
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro por tipo */}
            <select
              value={selectedLogTypeFilter}
              onChange={(e) => setSelectedLogTypeFilter(e.target.value as any)}
              className="h-8 rounded-xl bg-card border border-border/80 px-2 text-xs font-semibold"
            >
              <option value="all">Todos os tipos</option>
              <option value="Carrossel">Carrossel</option>
              <option value="Miniaturas">Miniaturas</option>
              <option value="Página">Página</option>
            </select>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                addLog('Sistema', 'Re-executando última etapa registrada...', 'pending')
              }
              className="rounded-xl text-xs font-bold border-border/80"
            >
              <RotateCcw className="w-3 h-3 mr-1" /> Re-executar etapa
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => addLog('Sistema', 'Reexecutando tarefas pendentes...', 'ok')}
              className="rounded-xl text-xs font-bold border-border/80"
            >
              Reexecutar pendentes
            </Button>

            <Button
              size="sm"
              onClick={handleDownloadCarousel}
              className="rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1"
            >
              <Play className="w-3 h-3" /> Rodar agora · Carrossel
            </Button>
          </div>
        </div>

        {/* Painel do console de logs */}
        <div className="rounded-2xl bg-black/60 border border-purple-500/20 p-4 font-mono text-xs max-h-56 overflow-y-auto space-y-1.5 text-purple-200">
          {filteredLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              Sem eventos ainda. Os logs aparecerão aqui durante a geração dos ZIPs.
            </p>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-muted-foreground">[{log.time}]</span>
                <span
                  className={`px-1 rounded text-[10px] font-bold ${
                    log.type === 'Carrossel'
                      ? 'bg-purple-900/50 text-purple-300'
                      : log.type === 'Miniaturas'
                        ? 'bg-pink-900/50 text-pink-300'
                        : 'bg-indigo-900/50 text-indigo-300'
                  }`}
                >
                  {log.type}
                </span>
                <span
                  className={
                    log.status === 'ok'
                      ? 'text-emerald-400'
                      : log.status === 'failed'
                        ? 'text-rose-400 font-bold'
                        : 'text-amber-400'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* ============================================================ */}
      {/* 9. SEÇÃO "BOAS PRÁTICAS"                                      */}
      {/* ============================================================ */}
      <Card className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-4">
        <h3 className="text-xl font-black text-foreground">Boas práticas</h3>

        <ul className="space-y-2.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E93] mt-1.5 shrink-0" />
            <span>Use SVG sempre que possível — escalável e nítida em qualquer tamanho.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E93] mt-1.5 shrink-0" />
            <span>
              PNG para web e apresentações; JPG apenas quando o canal exigir (e nunca em fundo
              transparente).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E93] mt-1.5 shrink-0" />
            <span>PDF para impressão, papelaria e envio para gráficas.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E93] mt-1.5 shrink-0" />
            <span>
              Respeite a área de proteção mínima ao redor da logo (equivalente à altura do símbolo).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E93] mt-1.5 shrink-0" />
            <span>Não distorça, não recolora e não aplique efeitos sobre a logo.</span>
          </li>
        </ul>
      </Card>

      {/* ============================================================ */}
      {/* MODAL DE EDIÇÃO AVANÇADA                                     */}
      {/* ============================================================ */}
      {editingKind && (
        <AdvancedLogoEditorModal
          open={Boolean(editingKind)}
          onOpenChange={(v) => {
            if (!v) setEditingKind(null)
          }}
          initialConfig={logoConfigs[editingKind]}
          onSave={handleSaveEditorChanges}
          onResetToDefault={() => {
            setLogoConfigs((prev) => ({
              ...prev,
              [editingKind]: DEFAULT_LOGO_CONFIGS[editingKind],
            }))
          }}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL DE PROMPTS REVISADOS                                   */}
      {/* ============================================================ */}
      <RevisedPromptsModal open={promptsModalOpen} onOpenChange={setPromptsModalOpen} />

      {/* ============================================================ */}
      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE MATERIAL                        */}
      {/* ============================================================ */}
      <CreateOrEditMaterialModal
        open={materialModalOpen}
        onOpenChange={(v) => {
          setMaterialModalOpen(v)
          if (!v) setEditingMaterial(null)
        }}
        initialMaterial={editingMaterial}
        onSave={handleSaveMaterial}
      />

      {/* ============================================================ */}
      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO DE MATERIAL                */}
      {/* ============================================================ */}
      {materialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full p-6 space-y-4 rounded-3xl bg-card border-border shadow-2xl">
            <div className="space-y-1">
              <h4 className="text-lg font-black text-foreground">Excluir material da marca?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tem certeza de que deseja remover{' '}
                <strong className="text-foreground font-bold">"{materialToDelete.title}"</strong>?
                Esta ação não pode ser desfeita e o arquivo deixará de estar disponível no kit.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMaterialToDelete(null)}
                className="rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDeleteMaterial}
                className="rounded-xl text-xs font-bold gap-1 bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir definitivamente</span>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
