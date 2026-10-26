import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { SlidersHorizontal, CheckSquare, Square, Eye } from 'lucide-react'
import type { Brand } from '@/types'

export interface ReportSectionsConfig {
  kpis: boolean
  tagsFormats: boolean
  brands: boolean
  timeline: boolean
  networks: boolean
  audience: boolean
  competitors: boolean
  topPosts: boolean
  abTests: boolean
}

export const DEFAULT_REPORT_SECTIONS: ReportSectionsConfig = {
  kpis: true,
  tagsFormats: true,
  brands: true,
  timeline: true,
  networks: true,
  audience: true,
  competitors: true,
  topPosts: true,
  abTests: true,
}

interface CustomizeReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sections: ReportSectionsConfig
  onChangeSections: (sections: ReportSectionsConfig) => void
  selectedBrandIds: string[] // 'all' or list of brand ids
  onChangeBrandIds: (brandIds: string[]) => void
  brands: Brand[]
  selectedPeriod: string
  onChangePeriod: (period: string) => void
  onApplyAndExportPDF?: () => void
  onApplyAndExportCSV?: () => void
}

const SECTION_DEFINITIONS: {
  key: keyof ReportSectionsConfig
  label: string
  description: string
  category: string
}[] = [
  {
    key: 'kpis',
    label: 'Resumo Executivo (KPIs Principais)',
    description: 'Total de criações, publicados, agendados e taxa média de aprovação.',
    category: 'Geral',
  },
  {
    key: 'networks',
    label: 'Performance & Distribuição por Rede Social',
    description: 'Instagram, Facebook, LinkedIn, TikTok, WhatsApp, YouTube e Twitter/X.',
    category: 'Canais',
  },
  {
    key: 'audience',
    label: 'Métricas de Audiência & Demografia',
    description: 'Faixa etária, distribuição por gênero, top cidades e horários nobres por rede.',
    category: 'Audiência',
  },
  {
    key: 'competitors',
    label: 'Análise de Concorrentes & Mercado',
    description: 'Benchmarking vs concorrentes diretos, taxas de engajamento e liderança.',
    category: 'Mercado',
  },
  {
    key: 'topPosts',
    label: 'Top Posts & Ranking por Engajamento',
    description: 'Melhores posts ranqueados por interações, salvos e alcance consolidado.',
    category: 'Conteúdo',
  },
  {
    key: 'abTests',
    label: 'Testes A/B & Experimentos',
    description: 'Resultados comparativos de variações de criativos e copys com taxa de vitória.',
    category: 'Otimização',
  },
  {
    key: 'tagsFormats',
    label: 'Top Tags & Formatos Mais Usados',
    description: 'Tags mais frequentes e formatos (vídeo, flyer, carrossel, feed).',
    category: 'Conteúdo',
  },
  {
    key: 'brands',
    label: 'Desempenho por Marca',
    description: 'Comparativo de volume, publicação e aprovação entre as marcas selecionadas.',
    category: 'Operação',
  },
  {
    key: 'timeline',
    label: 'Evolução Temporal no Período',
    description: 'Ritmo semanal de publicações e agendamentos ao longo das últimas semanas.',
    category: 'Operação',
  },
]

export function CustomizeReportModal({
  open,
  onOpenChange,
  sections,
  onChangeSections,
  selectedBrandIds,
  onChangeBrandIds,
  brands,
  selectedPeriod,
  onChangePeriod,
  onApplyAndExportPDF,
  onApplyAndExportCSV,
}: CustomizeReportModalProps) {
  const toggleSection = (key: keyof ReportSectionsConfig) => {
    onChangeSections({
      ...sections,
      [key]: !sections[key],
    })
  }

  const selectAllSections = () => {
    onChangeSections({
      kpis: true,
      tagsFormats: true,
      brands: true,
      timeline: true,
      networks: true,
      audience: true,
      competitors: true,
      topPosts: true,
      abTests: true,
    })
  }

  const deselectAllSections = () => {
    onChangeSections({
      kpis: false,
      tagsFormats: false,
      brands: false,
      timeline: false,
      networks: false,
      audience: false,
      competitors: false,
      topPosts: false,
      abTests: false,
    })
  }

  const isAllBrands = selectedBrandIds.includes('all') || selectedBrandIds.length === 0

  const toggleBrand = (brandId: string) => {
    if (brandId === 'all') {
      onChangeBrandIds(['all'])
      return
    }

    let updated: string[] = []
    if (isAllBrands) {
      // Começa desmarcando todas menos a clicada
      updated = [brandId]
    } else {
      if (selectedBrandIds.includes(brandId)) {
        updated = selectedBrandIds.filter((id) => id !== brandId)
        if (updated.length === 0) updated = ['all']
      } else {
        updated = [...selectedBrandIds, brandId]
        if (updated.length === brands.length) updated = ['all']
      }
    }
    onChangeBrandIds(updated)
  }

  const activeCount = Object.values(sections).filter(Boolean).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-border bg-card p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Personalizar Relatório de Performance
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Escolha exatamente quais módulos e métricas deseja incluir na visualização e nas
            exportações (PDF e CSV).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Seletor de Período & Filtro de Marcas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/40 border border-border/70">
            {/* Período */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Período do Relatório</span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {selectedPeriod}
                </Badge>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { key: '7d', label: '7 dias' },
                  { key: '30d', label: '30 dias' },
                  { key: '90d', label: '90 dias' },
                  { key: 'all', label: 'Histórico' },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => onChangePeriod(p.key)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all border ${
                      selectedPeriod === p.key
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-card text-muted-foreground hover:text-foreground border-border'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Marcas (Uma, várias ou todas) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Marcas no Escopo</span>
                <span className="text-[10px] text-muted-foreground">
                  {isAllBrands ? 'Todas selecionadas' : `${selectedBrandIds.length} selecionada(s)`}
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => toggleBrand('all')}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                    isAllBrands
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-card text-muted-foreground hover:text-foreground border-border'
                  }`}
                >
                  Todas ({brands.length})
                </button>
                {brands.map((b) => {
                  const isChecked = !isAllBrands && selectedBrandIds.includes(b.id)
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBrand(b.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        isChecked
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-card text-muted-foreground hover:text-foreground border-border'
                      }`}
                    >
                      {b.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Seleção de Módulos / Seções */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground">Seções do Relatório</h4>
                <p className="text-[11px] text-muted-foreground">
                  {activeCount} de {SECTION_DEFINITIONS.length} seções ativas
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllSections}
                  className="h-7 text-xs px-2 text-purple-600 hover:text-purple-700"
                >
                  <CheckSquare className="w-3.5 h-3.5 mr-1" /> Marcar todas
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllSections}
                  className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                >
                  <Square className="w-3.5 h-3.5 mr-1" /> Desmarcar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {SECTION_DEFINITIONS.map((item) => {
                const checked = sections[item.key]
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleSection(item.key)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      checked
                        ? 'bg-purple-500/5 border-purple-500/30'
                        : 'bg-card border-border/60 hover:border-border opacity-70'
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleSection(item.key)}
                      className="mt-0.5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    <div className="space-y-0.5 select-none">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{item.label}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground self-start sm:self-auto">
            Configuração salva para a sessão do relatório.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-xl flex-1 sm:flex-initial"
            >
              Concluir & Visualizar
            </Button>
            {onApplyAndExportPDF && (
              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false)
                  onApplyAndExportPDF()
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-xl flex-1 sm:flex-initial"
              >
                Salvar & Gerar PDF
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
