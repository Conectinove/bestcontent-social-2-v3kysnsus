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
import { suggestTemplates, type PostTemplate } from '@/services/post-templates'
import { useSocial } from '@/context/SocialContext'
import { useEffect } from 'react'

export default function TemplatesPage() {
  const navigate = useNavigate()
  const { activeBrand } = useSocial()
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [activeNetwork, setActiveNetwork] = useState('all')
  const [featuredAiTemplates, setFeaturedAiTemplates] = useState<PostTemplate[]>([])
  const [loadingAi, setLoadingAi] = useState(false)

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

        <Button
          onClick={() => setSelectorOpen(true)}
          className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-10 px-4 gap-2 shadow-sm transition-all hover:shadow-purple-500/20"
        >
          <Sparkles className="w-4 h-4" />
          <span>Abrir Catálogo Completo</span>
        </Button>
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

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                  <span>Criar com este modelo</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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

      {/* Selector modal */}
      <TemplateSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        onSelect={handleSelectTemplate}
        initialNetwork={activeNetwork}
      />
    </div>
  )
}
