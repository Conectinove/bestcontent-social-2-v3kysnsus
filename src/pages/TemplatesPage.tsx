import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Layout,
  Star,
  Search,
  Plus,
  ArrowRight,
  SlidersHorizontal,
  Bookmark,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { TemplateSelector, NETWORKS_CONFIG, CATEGORIES_CONFIG } from '@/components/TemplateSelector'
import { TemplateVariationsModal } from '@/components/templates/TemplateVariationsModal'
import { WhatToPostTodayModal } from '@/components/analytics/WhatToPostTodayModal'
import { CreateCampaignModal } from '@/components/campaigns/CreateCampaignModal'
import { CampaignReportModal } from '@/components/campaigns/CampaignReportModal'
import { suggestTemplates, type PostTemplate, type TodayPostIdea } from '@/services/post-templates'
import { getCampaigns, type CampaignRecord } from '@/services/campaigns'
import { BarChart3, Wand2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { useEffect } from 'react'

export default function TemplatesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { activeBrand } = useSocial()
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [whatToPostOpen, setWhatToPostOpen] = useState(false)
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)
  const [campaignsList, setCampaignsList] = useState<CampaignRecord[]>([])
  const [campaignReportOpen, setCampaignReportOpen] = useState(false)
  const [selectedReportCampaign, setSelectedReportCampaign] = useState<CampaignRecord | null>(null)
  const [campaignsCount, setCampaignsCount] = useState<number>(0)
  const { posts } = useSocial()
  const [activeNetwork, setActiveNetwork] = useState('all')
  const [featuredAiTemplates, setFeaturedAiTemplates] = useState<PostTemplate[]>([])
  const [loadingAi, setLoadingAi] = useState(false)
  const [variationsOpen, setVariationsOpen] = useState(false)
  const [variationsTemplate, setVariationsTemplate] = useState<PostTemplate | null>(null)

  useEffect(() => {
    getCampaigns(user?.id)
      .then((camps) => {
        setCampaignsList(camps)
        setCampaignsCount(camps.length)
      })
      .catch(() => {
        setCampaignsList([])
        setCampaignsCount(0)
      })
  }, [user?.id])

  useEffect(() => {
    let isMounted = true
    const loadAiFeatured = async () => {
      setLoadingAi(true)
      try {
        const res = await suggestTemplates({
          brandName: activeBrand?.name,
          brandVoice: activeBrand?.brandVoice,
          objective: 'engajar',
          network: 'instagram',
        })
        if (isMounted) setFeaturedAiTemplates(res.slice(0, 3))
      } catch {
        if (isMounted) setFeaturedAiTemplates([])
      } finally {
        if (isMounted) setLoadingAi(false)
      }
    }
    loadAiFeatured()
    return () => {
      isMounted = false
    }
  }, [activeBrand?.name, activeBrand?.brandVoice])

  const handleSelectTemplate = (template: PostTemplate) => {
    navigate('/app/content/new', { state: { template } })
  }

  const openVariations = (template: PostTemplate) => {
    setVariationsTemplate(template)
    setVariationsOpen(true)
  }

  const handleUseVariation = (template: PostTemplate, caption: string) => {
    setVariationsOpen(false)
    navigate('/app/content/new', { state: { template, caption, skipAutoCaption: true } })
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
            <Layout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Hub de Templates por Rede
              </h1>
              <Badge
                variant="secondary"
                className="bg-purple-600/10 text-purple-700 dark:text-purple-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full"
              >
                Prontos para Conversão
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Explore centenas de modelos calibrados para Instagram, TikTok, Facebook, LinkedIn,
              YouTube e WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Button
            onClick={() => setCampaignModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs h-10 px-3 sm:px-4 gap-1.5 sm:gap-2 shadow-md hover:shadow-purple-500/20 transition-all flex-1 sm:flex-initial justify-center"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="truncate">Criar Campanha Multi-formato</span>
            {campaignsCount > 0 && (
              <Badge className="bg-white/20 text-white hover:bg-white/30 text-[10px] px-1.5 py-0 shrink-0">
                {campaignsCount}
              </Badge>
            )}
          </Button>

          {campaignsList.length > 0 && (
            <Button
              onClick={() => {
                setSelectedReportCampaign(campaignsList[0])
                setCampaignReportOpen(true)
              }}
              className="rounded-xl bg-purple-600/15 border border-purple-500/40 text-purple-800 dark:text-purple-200 hover:bg-purple-600/25 font-bold text-xs h-10 px-3 sm:px-3.5 gap-1.5 sm:gap-2 transition-all shadow-2xs flex-1 sm:flex-initial justify-center"
              title="Abrir relatório analítico de campanha com IA"
            >
              <BarChart3 className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="truncate">Relatório</span>
            </Button>
          )}

          <Button
            onClick={() => {
              if (featuredAiTemplates.length > 0) {
                openVariations(featuredAiTemplates[0])
              } else {
                setSelectorOpen(true)
              }
            }}
            className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white font-bold text-xs h-10 px-3 sm:px-4 gap-1.5 sm:gap-2 shadow-md transition-all flex-1 sm:flex-initial justify-center"
            title="Gerar variações de copy e visual com IA a partir de um modelo"
          >
            <Wand2 className="w-4 h-4 shrink-0" />
            <span className="truncate">Gerar variações com IA</span>
          </Button>

          <Button
            onClick={() => setWhatToPostOpen(true)}
            className="rounded-xl bg-purple-600/10 border border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-600/20 font-bold text-xs h-10 px-3 sm:px-3.5 gap-1.5 sm:gap-2 transition-all shadow-2xs flex-1 sm:flex-initial justify-center"
          >
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="truncate">O que postar hoje?</span>
          </Button>

          <Button
            onClick={() => setSelectorOpen(true)}
            className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-10 px-3 sm:px-4 gap-1.5 sm:gap-2 shadow-sm transition-all hover:shadow-purple-500/20 flex-1 sm:flex-initial justify-center"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="truncate">Catálogo Completo</span>
          </Button>
        </div>
      </div>

      {/* Banner Destaque: Criar Campanha Multi-formato 5-em-1 */}
      <div
        onClick={() => setCampaignModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            setCampaignModalOpen(true)
          }
        }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 p-6 sm:p-7 text-white cursor-pointer group hover:shadow-xl hover:shadow-purple-500/20 transition-all border border-purple-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                NOVO • Multi-Formato 5-em-1
              </Badge>
              {campaignsCount > 0 && (
                <span className="text-xs text-purple-200 font-medium">
                  • {campaignsCount} {campaignsCount === 1 ? 'campanha ativa' : 'campanhas ativas'}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white group-hover:translate-x-0.5 transition-transform">
              Criar Campanha Integrada
            </h2>
            <p className="text-xs sm:text-sm text-purple-100 leading-relaxed">
              Gere reels, story, feed, carrossel e flyer de uma vez só a partir do mesmo briefing
              com IA. Todos os formatos salvos diretamente como rascunhos na sua biblioteca.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              type="button"
              className="bg-white text-purple-900 hover:bg-purple-50 font-bold text-xs sm:text-sm h-11 px-6 rounded-2xl shadow-lg gap-2 group-hover:scale-105 transition-transform"
            >
              <span>Configurar Briefing</span>
              <ArrowRight className="w-4 h-4 text-purple-700" />
            </Button>
          </div>
        </div>

        {/* Efeitos Decorativos */}
        <div className="absolute right-[-30px] bottom-[-30px] w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-white/10 group-hover:text-white/20 transition-colors pointer-events-none hidden md:block">
          <Sparkles className="w-36 h-36" />
        </div>
      </div>

      {/* Banner de Sugestões de IA para a Marca */}
      {featuredAiTemplates.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-900/30 via-purple-950/20 to-background border border-purple-500/30 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  ✨ Sugeridos pela IA para {activeBrand?.name ? `"${activeBrand.name}"` : 'você'}
                  <Badge className="bg-purple-600 text-white text-[9px] px-2 py-0">
                    Recomendação Inteligente
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Modelos com maior potencial de retorno analisados com base na sua marca.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectorOpen(true)}
              className="text-xs rounded-xl border-purple-500/30 text-purple-400 hover:bg-purple-950/40"
            >
              Ver todos no catálogo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {featuredAiTemplates.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectTemplate(item)}
                className="cursor-pointer group p-3.5 rounded-2xl bg-card border border-border/80 hover:border-purple-500/60 transition-all hover:shadow-md flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      {item.network || 'Instagram'} &middot; {item.aspect_ratio || '1:1'}
                    </span>
                    <Badge className="bg-purple-600/10 text-purple-600 dark:text-purple-300 text-[9px] py-0 px-1.5 border-0">
                      IA Recomenda
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-purple-600 transition-colors">
                    {item.name}
                  </h4>
                  {item.ai_reason && (
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      💡 {item.ai_reason}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openVariations(item)
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-fuchsia-600 dark:text-fuchsia-400 hover:underline"
                    title="Gerar variações com IA deste modelo"
                  >
                    <Wand2 className="w-3 h-3" />
                    Variações IA
                  </button>
                  <span className="inline-flex items-center gap-1 shrink-0">
                    Criar
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards de Destaque por Rede */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(NETWORKS_CONFIG)
          .filter(([k]) => k !== 'all')
          .map(([key, config]) => (
            <Card
              key={key}
              className="group hover:border-purple-500/40 transition-all rounded-2xl overflow-hidden hover:shadow-md cursor-pointer bg-card"
              onClick={() => {
                setActiveNetwork(key)
                setSelectorOpen(true)
              }}
            >
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.badgeClass}`}
                    >
                      {config.label}
                    </span>
                    <h3 className="font-bold text-base mt-2 group-hover:text-purple-600 transition-colors">
                      Templates para {config.label}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Carrosséis, posts estáticos, stories verticais 9:16 e formatos 4:5 calibrados
                      com IA.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border/60 text-xs font-semibold text-purple-600 dark:text-purple-400">
                  <span>Ver coleção</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Modal de variações com IA */}
      <TemplateVariationsModal
        open={variationsOpen}
        onOpenChange={setVariationsOpen}
        template={variationsTemplate}
        brandName={activeBrand?.name}
        brandVoice={activeBrand?.brandVoice}
        onUse={handleUseVariation}
      />

      {/* Selector modal */}
      <TemplateSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        onSelect={handleSelectTemplate}
        onVariations={openVariations}
        initialNetwork={activeNetwork}
      />

      {/* Modal 'O que postar hoje?' */}
      <WhatToPostTodayModal
        open={whatToPostOpen}
        onOpenChange={setWhatToPostOpen}
        brandName={activeBrand?.name || 'Sua Marca'}
        brandNiche={(activeBrand as any)?.niche || (activeBrand as any)?.segment || 'Geral'}
        brandTone={
          (activeBrand as any)?.tone ||
          (activeBrand as any)?.voice_tone ||
          'Profissional e dinâmico'
        }
        preferredFormats={
          (activeBrand as any)?._raw?.visual_style?.includes('Formatos preferidos:')
            ? (activeBrand as any)._raw.visual_style
                .split('Formatos preferidos:')[1]
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : undefined
        }
        visualStyle={(activeBrand as any)?._raw?.visual_style}
        network="Instagram"
        onApplyIdea={(idea: TodayPostIdea) => {
          navigate('/app/content/new', {
            state: {
              caption: `${idea.title}\n\n${idea.caption}\n\n${idea.hashtags.join(' ')}`,
            },
          })
        }}
      />

      {/* Modal Criar Campanha Multi-formato */}
      <CreateCampaignModal
        open={campaignModalOpen}
        onOpenChange={setCampaignModalOpen}
        onSuccess={() => {
          getCampaigns(user?.id)
            .then((camps) => {
              setCampaignsList(camps)
              setCampaignsCount(camps.length)
            })
            .catch(() => {})
        }}
      />

      {/* Modal Relatório de Campanha */}
      <CampaignReportModal
        open={campaignReportOpen}
        onOpenChange={setCampaignReportOpen}
        campaign={selectedReportCampaign}
        posts={posts}
        brandName={activeBrand?.name || 'Sua Marca'}
      />
    </div>
  )
}
