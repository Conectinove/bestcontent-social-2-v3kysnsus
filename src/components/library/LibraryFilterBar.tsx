import {
  SlidersHorizontal,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles,
  RotateCcw,
  BarChart2,
  Layers,
  FileText,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface LibraryAdvancedFiltersState {
  status: 'all' | 'draft' | 'scheduled' | 'published' | 'approved'
  format: string
  period: 'all' | 'today' | '7days' | '30days' | '90days' | 'this_year'
  engagementLevel: 'all' | 'has_engagement' | 'high_engagement' | 'no_engagement'
  tag: string
  sortOrder: 'newest' | 'oldest'
}

interface LibraryFilterBarProps {
  filters: LibraryAdvancedFiltersState
  onChange: (updates: Partial<LibraryAdvancedFiltersState>) => void
  onReset: () => void
  totalCount: number
  filteredCount: number
  allAvailableTags: string[]
}

export function LibraryFilterBar({
  filters,
  onChange,
  onReset,
  totalCount,
  filteredCount,
  allAvailableTags,
}: LibraryFilterBarProps) {
  const activeCount = [
    filters.status !== 'all',
    filters.format !== 'all',
    filters.period !== 'all',
    filters.engagementLevel !== 'all',
    filters.tag !== 'all',
    filters.sortOrder !== 'newest',
  ].filter(Boolean).length

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            aria-label="Abrir filtros combinados de posts"
            className="h-10 text-xs font-semibold gap-2 rounded-xl border-border/80 bg-card hover:bg-muted shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>Filtros Avançados</span>
            {activeCount > 0 ? (
              <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 font-bold ml-1">
                {activeCount}
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-88 p-4 space-y-3.5 rounded-2xl shadow-xl border border-border/80"
          align="end"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Filtros Combináveis
              </h4>
            </div>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Resetar ({activeCount})
              </button>
            )}
          </div>

          {/* 1. Status do Post */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              Status de Publicação
            </label>
            <Select value={filters.status} onValueChange={(val: any) => onChange({ status: val })}>
              <SelectTrigger aria-label="Status do Post" className="h-8 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="draft">Rascunhos</SelectItem>
                <SelectItem value="scheduled">Agendados</SelectItem>
                <SelectItem value="published">Publicados</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 2. Formato do Conteúdo */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Layers className="w-3 h-3 text-primary" />
              Formato de Conteúdo
            </label>
            <Select value={filters.format} onValueChange={(val) => onChange({ format: val })}>
              <SelectTrigger aria-label="Formato do Conteúdo" className="h-8 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os formatos</SelectItem>
                <SelectItem value="post">Posts de Feed (Quadrado / Retrato)</SelectItem>
                <SelectItem value="carousel">Carrosséis (Educativo / Antes & Depois)</SelectItem>
                <SelectItem value="video">Vídeos, Reels, Shorts & TikTok</SelectItem>
                <SelectItem value="flyer">Flyers e Banners</SelectItem>
                <SelectItem value="talking_head">Talking Head (Roteiro 9:16)</SelectItem>
                <SelectItem value="ugc">UGC & Prova Social</SelectItem>
                <SelectItem value="interactive">Interativo / Enquete / Collab</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 3. Período de Criação */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3 text-primary" />
              Período de Criação
            </label>
            <Select value={filters.period} onValueChange={(val: any) => onChange({ period: val })}>
              <SelectTrigger aria-label="Período de Criação" className="h-8 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="90days">Últimos 90 dias</SelectItem>
                <SelectItem value="this_year">Este ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Nível de Engajamento */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <BarChart2 className="w-3 h-3 text-primary" />
              Presença de Engajamento
            </label>
            <Select
              value={filters.engagementLevel}
              onValueChange={(val: any) => onChange({ engagementLevel: val })}
            >
              <SelectTrigger
                aria-label="Presença de Engajamento"
                className="h-8 text-xs rounded-lg"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer engajamento</SelectItem>
                <SelectItem value="has_engagement">Com interações registradas</SelectItem>
                <SelectItem value="high_engagement">
                  Alto engajamento (&gt; 50 interações)
                </SelectItem>
                <SelectItem value="no_engagement">Sem métricas / Sem interações</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 5. Tag / Etiqueta */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <FileText className="w-3 h-3 text-primary" />
              Etiqueta / Tag
            </label>
            <Select value={filters.tag} onValueChange={(val) => onChange({ tag: val })}>
              <SelectTrigger aria-label="Tag" className="h-8 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tags</SelectItem>
                {allAvailableTags.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    #{t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 6. Ordenação Temporal */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground">
              Ordenação Temporal
            </label>
            <Select
              value={filters.sortOrder}
              onValueChange={(val: any) => onChange({ sortOrder: val })}
            >
              <SelectTrigger aria-label="Ordenação" className="h-8 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recentes primeiro</SelectItem>
                <SelectItem value="oldest">Mais antigos primeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rodapé informativo com contagem em tempo real */}
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Resultado em tempo real:</span>
            <Badge variant="outline" className="font-mono font-bold text-foreground">
              {filteredCount} de {totalCount} posts
            </Badge>
          </div>
        </PopoverContent>
      </Popover>

      {/* Pill indicador rápido de contagem de filtros combinados */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/60 text-xs font-medium">
        <span className="text-muted-foreground">Resultados:</span>
        <span className="font-bold text-foreground font-mono">{filteredCount}</span>
        {filteredCount !== totalCount && (
          <span className="text-[10px] text-muted-foreground">(de {totalCount})</span>
        )}
      </div>
    </div>
  )
}
