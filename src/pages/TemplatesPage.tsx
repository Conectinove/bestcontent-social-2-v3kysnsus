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
import type { PostTemplate } from '@/services/post-templates'

export default function TemplatesPage() {
  const navigate = useNavigate()
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [activeNetwork, setActiveNetwork] = useState('all')

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
