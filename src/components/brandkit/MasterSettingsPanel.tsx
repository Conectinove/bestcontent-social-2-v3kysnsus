import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Sparkles,
  Check,
  Loader2,
  RefreshCw,
  Power,
  Layers,
  BarChart3,
  Calendar,
  Users2,
  GraduationCap,
  Trophy,
  Bell,
  Target,
  Brain,
  Search,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import {
  MasterFeatureToggles,
  DEFAULT_MASTER_FEATURES,
  MASTER_FEATURES_LIST,
  getMasterFeatures,
  saveMasterFeatures,
} from '@/services/master-features'
import { Link } from 'react-router-dom'

const CATEGORY_LABELS: Record<string, { label: string; icon: typeof Layers; color: string }> = {
  criacao: {
    label: 'Estúdio & Criação com IA',
    icon: Sparkles,
    color: 'text-purple-600 dark:text-purple-400',
  },
  negocio: {
    label: 'Gestão, Vendas & Clientes',
    icon: BarChart3,
    color: 'text-blue-600 dark:text-blue-400',
  },
  engajamento: {
    label: 'Comunidade & Aprendizado',
    icon: Users2,
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  sistema: {
    label: 'Sistema & Comunicação',
    icon: Bell,
    color: 'text-amber-600 dark:text-amber-400',
  },
}

const FEATURE_ICONS: Record<string, typeof Sparkles> = {
  ai_media_studio: Sparkles,
  second_brain: Brain,
  analytics_performance: BarChart3,
  crm_pipeline: Target,
  calendar_scheduler: Calendar,
  client_portal: Users2,
  community: Users2,
  academy: GraduationCap,
  journey_gamification: Trophy,
  notifications_center: Bell,
  ads_manager: Target,
  seo_tools: Search,
}

export function MasterSettingsPanel({ brandId }: { brandId?: string }) {
  const [toggles, setToggles] = useState<MasterFeatureToggles>(DEFAULT_MASTER_FEATURES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const loaded = await getMasterFeatures(brandId)
        if (mounted) {
          setToggles(loaded)
        }
      } catch (err) {
        console.error('Erro ao carregar master settings:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [brandId])

  const handleToggle = (key: keyof MasterFeatureToggles, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleToggleAll = (enable: boolean) => {
    const updated = { ...toggles }
    Object.keys(updated).forEach((k) => {
      ;(updated as any)[k] = enable
    })
    setToggles(updated)
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveMasterFeatures(toggles, brandId)
      setHasChanges(false)
      toast({
        title: 'Configurações Master Salvas!',
        description:
          'As principais funções da plataforma foram sincronizadas e persistidas no banco.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Falha ao persistir preferências master.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResetDefaults = () => {
    setToggles(DEFAULT_MASTER_FEATURES)
    setHasChanges(true)
    toast({
      title: 'Valores padrão restaurados',
      description: 'Clique em Salvar para persistir a restauração.',
    })
  }

  const activeCount = Object.values(toggles).filter(Boolean).length
  const totalCount = Object.keys(toggles).length

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        <span>Carregando preferências do Usuário Master...</span>
      </div>
    )
  }

  const categories = ['criacao', 'negocio', 'engajamento', 'sistema'] as const

  return (
    <div className="space-y-6">
      {/* Header do Painel Master */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-foreground">Configurações do Usuário Master</h3>
            <Badge
              variant="outline"
              className="text-[10px] border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold"
            >
              Controle Global
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Ative ou suspenda as principais funções e módulos da plataforma. O estado é persistido
            no banco e sincronizado para o ecossistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-mono py-1 px-2.5">
            {activeCount} de {totalCount} ativas
          </Badge>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1.5 shadow-sm text-xs h-8"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{hasChanges ? 'Salvar Alterações' : 'Salvar no Banco'}</span>
          </Button>
        </div>
      </div>

      {/* Ações em lote */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-muted/40 border border-border/70 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Power className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Controles rápidos em massa:</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleToggleAll(true)}
            className="text-xs h-7 px-2.5 hover:bg-purple-500/10 hover:text-purple-600"
          >
            Ativar Todas
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleToggleAll(false)}
            className="text-xs h-7 px-2.5 text-muted-foreground hover:text-destructive"
          >
            Desativar Todas
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetDefaults}
            className="text-xs h-7 px-2.5 text-muted-foreground"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Restaurar Padrão
          </Button>
        </div>
      </div>

      {/* Lista de Features Agrupadas por Categoria */}
      <div className="space-y-6">
        {categories.map((catKey) => {
          const catMeta = CATEGORY_LABELS[catKey]
          const CatIcon = catMeta.icon
          const items = MASTER_FEATURES_LIST.filter((f) => f.category === catKey)

          return (
            <div key={catKey} className="space-y-3">
              <div className="flex items-center gap-2">
                <CatIcon className={`w-4 h-4 ${catMeta.color}`} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {catMeta.label}
                </h4>
                <div className="flex-1 border-b border-border/60" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((feat) => {
                  const Icon = FEATURE_ICONS[feat.key] || Sparkles
                  const isEnabled = Boolean(toggles[feat.key])

                  return (
                    <Card
                      key={feat.key}
                      className={`border transition-all duration-200 rounded-xl overflow-hidden ${
                        isEnabled
                          ? 'border-purple-500/30 bg-card hover:border-purple-500/60 shadow-xs'
                          : 'border-border/60 bg-muted/20 opacity-75'
                      }`}
                    >
                      <CardContent className="p-4 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isEnabled
                                ? 'bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                : 'bg-muted text-muted-foreground border border-border/80'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-foreground">
                                {feat.title}
                              </span>
                              {feat.badge && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0 border-purple-500/30 text-purple-600 dark:text-purple-400"
                                >
                                  {feat.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                              {feat.description}
                            </p>

                            {feat.path && (
                              <div className="pt-1">
                                <Link
                                  to={feat.path}
                                  className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-600 dark:text-purple-400 hover:underline"
                                >
                                  <span>Abrir módulo</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 pt-0.5">
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => handleToggle(feat.key, checked)}
                            aria-label={`Ativar ${feat.title}`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer com Salvar Fixo */}
      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {hasChanges
            ? 'Você possui alterações pendentes. Clique em salvar para persistir no PocketBase.'
            : 'Todas as preferências estão sincronizadas com o banco.'}
        </p>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1.5 shadow-sm text-xs h-9 px-4 w-full sm:w-auto"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Salvar Configurações Master no Banco
        </Button>
      </div>
    </div>
  )
}
