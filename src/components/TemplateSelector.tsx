import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Star,
  Layout,
  Square,
  Loader2,
  Sparkles,
  Search,
  Check,
  Smartphone,
  Monitor,
  Tag,
  ArrowRight,
} from 'lucide-react'
import { getTemplates, toggleFavorite, type PostTemplate } from '@/services/post-templates'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface TemplateSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (template: PostTemplate) => void
  onSkip?: () => void
  initialNetwork?: string
}

export const NETWORKS_CONFIG: Record<
  string,
  { label: string; iconColor: string; badgeClass: string }
> = {
  all: {
    label: 'Todas as Redes',
    iconColor: 'text-purple-600',
    badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  },
  instagram: {
    label: 'Instagram',
    iconColor: 'text-pink-500',
    badgeClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  },
  facebook: {
    label: 'Facebook',
    iconColor: 'text-blue-600',
    badgeClass: 'bg-blue-600/10 text-blue-600 dark:text-blue-400',
  },
  linkedin: {
    label: 'LinkedIn',
    iconColor: 'text-sky-600',
    badgeClass: 'bg-sky-600/10 text-sky-600 dark:text-sky-400',
  },
  whatsapp: {
    label: 'WhatsApp',
    iconColor: 'text-emerald-500',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  tiktok: {
    label: 'TikTok',
    iconColor: 'text-cyan-400',
    badgeClass: 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-300',
  },
  youtube: {
    label: 'YouTube',
    iconColor: 'text-red-500',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
  twitter: {
    label: 'Twitter / X',
    iconColor: 'text-slate-800 dark:text-slate-200',
    badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  },
}

export const CATEGORIES_CONFIG: Record<string, { label: string; color: string }> = {
  all: { label: 'Todas as Categorias', color: 'bg-muted' },
  promo: { label: 'Promoção', color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
  educativo: { label: 'Educativo', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  storytelling: {
    label: 'Storytelling',
    color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  autoridade: {
    label: 'Autoridade',
    color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  },
  engajamento: {
    label: 'Engajamento',
    color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
}

export function TemplateSelector({
  open,
  onOpenChange,
  onSelect,
  onSkip,
  initialNetwork,
}: TemplateSelectorProps) {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<PostTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [networkFilter, setNetworkFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'feed' | 'story'>('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Sincroniza com a rede passada externamente se ela existir
  useEffect(() => {
    if (initialNetwork) {
      const norm = initialNetwork.toLowerCase().replace(/[^a-z]/g, '')
      if (norm.includes('insta')) setNetworkFilter('instagram')
      else if (norm.includes('face')) setNetworkFilter('facebook')
      else if (norm.includes('link')) setNetworkFilter('linkedin')
      else if (norm.includes('whats')) setNetworkFilter('whatsapp')
      else if (norm.includes('tik')) setNetworkFilter('tiktok')
      else if (norm.includes('you')) setNetworkFilter('youtube')
      else if (norm.includes('twit') || norm === 'x') setNetworkFilter('twitter')
      else setNetworkFilter('all')
    }
  }, [initialNetwork, open])

  const loadTemplates = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const result = await getTemplates(user.id, {
        type: typeFilter === 'all' ? undefined : typeFilter,
        network: networkFilter === 'all' ? undefined : networkFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        favoritesOnly,
      })
      setTemplates(result as unknown as PostTemplate[])
    } catch {
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, typeFilter, networkFilter, categoryFilter, favoritesOnly])

  useEffect(() => {
    if (open) {
      loadTemplates()
    }
  }, [open, loadTemplates])

  const handleToggleFav = async (template: PostTemplate, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const newVal = await toggleFavorite(template.id, template.is_favorite)
      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? { ...t, is_favorite: newVal } : t)),
      )
      toast({
        title: newVal ? 'Adicionado aos Favoritos' : 'Removido dos Favoritos',
        description: `Modelo "${template.name}" atualizado.`,
      })
    } catch {
      toast({ title: 'Erro', description: 'Falha ao atualizar favorito.', variant: 'destructive' })
    }
  }

  const handleSelect = (template: PostTemplate) => {
    onSelect(template)
    onOpenChange(false)
  }

  // Filtragem local por texto
  const displayedTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates
    const q = searchQuery.toLowerCase()
    return templates.filter((tpl) => {
      const name = (tpl.name || '').toLowerCase()
      const net = (tpl.network || '').toLowerCase()
      const cat = (tpl.category || '').toLowerCase()
      const dim = (tpl.dimensions || '').toLowerCase()
      return name.includes(q) || net.includes(q) || cat.includes(q) || dim.includes(q)
    })
  }, [templates, searchQuery])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl border border-purple-500/20 bg-card shadow-2xl">
        {/* Cabeçalho estilo BestContent lilás */}
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border/80 bg-gradient-to-r from-purple-50/50 via-background to-background dark:from-purple-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  Modelos de Conteúdo por Rede
                  <Badge
                    variant="secondary"
                    className="bg-purple-600/10 text-purple-700 dark:text-purple-300 font-bold text-[10px] px-2 py-0.5 rounded-full"
                  >
                    Prontos para Aplicação
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Escolha um modelo calibrado com proporções, paletas e chamadas para ação de alta
                  conversão.
                </p>
              </div>
            </div>

            {onSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-xs text-muted-foreground hover:text-foreground self-start sm:self-center"
              >
                Criar sem template
              </Button>
            )}
          </div>

          {/* Abas de Redes Sociais */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-4 pb-1">
            {Object.entries(NETWORKS_CONFIG).map(([key, config]) => {
              const active = networkFilter === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNetworkFilter(key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap',
                    active
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  <span>{config.label}</span>
                </button>
              )
            })}
          </div>

          {/* Filtros secundários: Categorias, Formato, Favoritos e Busca */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-border/60">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Tipo: Todos / Feed / Story */}
              <div className="inline-flex rounded-xl p-0.5 bg-muted/80 border border-border/70 text-xs">
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-bold transition-all',
                    typeFilter === 'all'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('feed')}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all',
                    typeFilter === 'feed'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Layout className="w-3 h-3" /> Feed
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('story')}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all',
                    typeFilter === 'story'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Smartphone className="w-3 h-3" /> Stories/Shorts
                </button>
              </div>

              {/* Categorias */}
              <div className="hidden md:flex items-center gap-1">
                {Object.entries(CATEGORIES_CONFIG).map(([k, cfg]) => {
                  if (k === 'all') return null
                  const isSelected = categoryFilter === k
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setCategoryFilter(isSelected ? 'all' : k)}
                      className={cn(
                        'text-[10px] font-bold px-2 py-1 rounded-lg border transition-all',
                        isSelected
                          ? 'border-purple-600 bg-purple-600/10 text-purple-700 dark:text-purple-300'
                          : 'border-border/60 text-muted-foreground hover:text-foreground bg-card',
                      )}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar modelo..."
                  className="pl-8 h-8 text-xs rounded-xl bg-card border-border/80"
                />
              </div>

              <Button
                size="sm"
                variant={favoritesOnly ? 'default' : 'outline'}
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                className={cn(
                  'text-xs font-bold gap-1 rounded-xl h-8 px-2.5',
                  favoritesOnly && 'bg-amber-500 hover:bg-amber-600 text-white',
                )}
              >
                <Star className={cn('w-3.5 h-3.5', favoritesOnly && 'fill-current')} />
                <span className="hidden sm:inline">Favoritos</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Grade de Modelos */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 bg-muted/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-xs text-muted-foreground font-semibold">
                Carregando modelos calibrados...
              </p>
            </div>
          ) : displayedTemplates.length === 0 ? (
            <div className="text-center py-20 space-y-3 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 mx-auto flex items-center justify-center">
                <Layout className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Nenhum modelo nesta combinação</h4>
              <p className="text-xs text-muted-foreground">
                Tente trocar a rede social ou limpar os filtros de categoria e favoritos.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNetworkFilter('all')
                  setCategoryFilter('all')
                  setTypeFilter('all')
                  setFavoritesOnly(false)
                  setSearchQuery('')
                }}
                className="text-xs rounded-xl"
              >
                Resetar Filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {displayedTemplates.map((tpl) => {
                const styles = (tpl.style_settings as Record<string, any>) || {}
                const layout = (tpl.layout_data as Record<string, any>) || {}
                const bgColor = styles.bgColor || '#0F0B1E'
                const accentColor = styles.accentColor || '#9333EA'
                const ctaColor = styles.ctaColor || accentColor || '#BF2A95'
                const textColor = styles.textColor || '#FFFFFF'
                const gradient =
                  styles.gradient || `linear-gradient(135deg, ${bgColor} 0%, #1a103c 100%)`
                const ratio = tpl.aspect_ratio || (tpl.type === 'story' ? '9:16' : '1:1')
                const dimensions =
                  tpl.dimensions || (tpl.type === 'story' ? '1080x1920' : '1080x1080')
                const netKey = tpl.network || 'all'
                const netConfig = NETWORKS_CONFIG[netKey] || NETWORKS_CONFIG.all
                const catConfig = CATEGORIES_CONFIG[tpl.category || ''] || null

                // Aspect ratio class para preview do card
                const previewRatioClass =
                  ratio === '9:16'
                    ? 'aspect-[9/14]'
                    : ratio === '16:9'
                      ? 'aspect-[16/10]'
                      : ratio === '4:5'
                        ? 'aspect-[4/5]'
                        : 'aspect-square'

                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelect(tpl)}
                    className="group relative cursor-pointer rounded-2xl overflow-hidden border border-border/80 bg-card hover:border-purple-500 hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-0.5"
                  >
                    {/* Header do Card: Miniatura renderizada com cores e textos reais */}
                    <div
                      className={cn(
                        'relative w-full flex flex-col justify-between p-4 overflow-hidden select-none transition-all',
                        previewRatioClass,
                      )}
                      style={{ background: gradient }}
                    >
                      {/* Grid de fundo suave */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08)_0%,_transparent_70%)] pointer-events-none" />

                      {/* Topo do card: Badges de Proporção + Favorito */}
                      <div className="relative z-10 flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-md border border-white/10">
                          {dimensions} &middot; {ratio}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleToggleFav(tpl, e)}
                          className="p-1.5 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-md transition-colors"
                          title={tpl.is_favorite ? 'Remover dos favoritos' : 'Favoritar modelo'}
                        >
                          <Star
                            className={cn(
                              'w-3.5 h-3.5',
                              tpl.is_favorite
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-white/80 group-hover:text-yellow-400',
                            )}
                          />
                        </button>
                      </div>

                      {/* Centro do card: Conteúdo visual estilizado fiel ao modelo */}
                      <div className="relative z-10 space-y-2 text-center my-auto px-2">
                        {styles.badgeText && (
                          <span
                            className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full backdrop-blur-md border border-white/15"
                            style={{
                              backgroundColor: `${accentColor}33`,
                              color: textColor,
                            }}
                          >
                            {styles.badgeText}
                          </span>
                        )}

                        <h4
                          className="text-xs sm:text-sm font-black line-clamp-2 leading-tight drop-shadow-sm"
                          style={{ color: textColor }}
                        >
                          {layout.headline || tpl.name}
                        </h4>

                        {layout.subhead && (
                          <p
                            className="text-[10px] line-clamp-2 leading-relaxed opacity-85"
                            style={{ color: textColor }}
                          >
                            {layout.subhead}
                          </p>
                        )}
                      </div>

                      {/* Botão de CTA miniaturizado */}
                      <div className="relative z-10 flex items-center justify-center pt-2">
                        <div
                          className="w-full py-1.5 px-3 rounded-xl flex items-center justify-center gap-1 font-bold text-[10px] uppercase tracking-wide text-white shadow-sm transition-transform group-hover:scale-102"
                          style={{ backgroundColor: ctaColor }}
                        >
                          <span>{layout.ctaText || 'APLICAR MODELO'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>

                    {/* Rodapé informativo do card */}
                    <div className="p-3 bg-card border-t border-border/70 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider',
                              netConfig.badgeClass,
                            )}
                          >
                            {netConfig.label}
                          </span>
                          {catConfig && (
                            <span
                              className={cn(
                                'text-[9px] font-semibold px-1.5 py-0.5 rounded-md',
                                catConfig.color,
                              )}
                            >
                              {catConfig.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-foreground truncate">{tpl.name}</p>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl shrink-0"
                      >
                        Usar
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
