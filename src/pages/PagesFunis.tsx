import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers,
  Sparkles,
  ExternalLink,
  Plus,
  ArrowRight,
  TrendingUp,
  Share2,
  CheckCircle2,
  SlidersHorizontal,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function PagesFunis() {
  const navigate = useNavigate()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const pages = [
    {
      id: 'funil-bio',
      title: 'Página de Bio Instagram / Link na Bio',
      slug: 'bio-oficial',
      visitors: '2.450',
      conversion: '14.2%',
      status: 'Ativo',
      updated: 'Hoje',
    },
    {
      id: 'funil-captura',
      title: 'Página de Captura VIP & Lista de Espera',
      slug: 'lista-vip',
      visitors: '1.180',
      conversion: '28.5%',
      status: 'Ativo',
      updated: 'Ontem',
    },
    {
      id: 'funil-agendamento',
      title: 'Funil de Agendamento Direto via WhatsApp',
      slug: 'agendamento-express',
      visitors: '890',
      conversion: '9.8%',
      status: 'Rascunho',
      updated: 'Há 3 dias',
    },
  ]

  const handleCopyLink = (slug: string, id: string) => {
    const url = `${window.location.origin}/p/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast({
      title: 'Link copiado!',
      description: 'URL do funil copiada para a área de transferência.',
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Páginas & Funis de Conversão
              </h1>
              <Badge
                variant="secondary"
                className="bg-purple-600/10 text-purple-700 dark:text-purple-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full"
              >
                Integração Direta
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Crie links de bio, páginas de captura e páginas de conversão sincronizadas aos seus
              posts.
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            toast({
              title: 'Novo Funil',
              description: 'Assistente de criação de página ativado.',
            })
          }}
          className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-10 px-4 gap-2 shadow-sm transition-all hover:shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Página / Funil</span>
        </Button>
      </div>

      {/* Grid de Páginas / Funis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pages.map((item) => (
          <Card
            key={item.id}
            className="rounded-2xl border-border bg-card shadow-xs hover:border-purple-500/30 transition-all"
          >
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <Badge
                  variant={item.status === 'Ativo' ? 'default' : 'secondary'}
                  className={
                    item.status === 'Ativo'
                      ? 'bg-emerald-500 text-white text-[10px]'
                      : 'text-[10px]'
                  }
                >
                  {item.status}
                </Badge>
                <span className="text-[11px] text-muted-foreground">{item.updated}</span>
              </div>

              <div>
                <h3 className="font-bold text-sm leading-tight text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">/{item.slug}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Visitas</span>
                  <span className="font-bold text-foreground">{item.visitors}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Taxa Conv.</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {item.conversion}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(item.slug, item.id)}
                  className="rounded-xl text-xs gap-1.5 h-8 flex-1"
                >
                  {copiedId === item.id ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copiar link</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/app/feed')}
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 px-3"
                >
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
