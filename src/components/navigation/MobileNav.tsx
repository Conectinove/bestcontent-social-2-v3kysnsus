import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Compass,
  Home,
  Briefcase,
  BarChart3,
  Menu,
  Plus,
  X,
  Sparkles,
  Video,
  PenSquare,
  Calendar as CalendarIcon,
  Search,
  ChevronRight,
  Share2,
  Megaphone,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface MobileNavProps {
  onOpenMobileMenu: () => void
}

export function MobileNav({ onOpenMobileMenu }: MobileNavProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)

  const isExplorarActive =
    location.pathname === '/app/explorar' ||
    location.pathname === '/app/discover' ||
    location.pathname === '/app/inspiracao'

  const isFeedActive =
    location.pathname === '/app/feed' || location.pathname === '/app/feed-comunidade'

  const isFunnelActive = location.pathname === '/app/funnel' || location.pathname === '/app/funil'

  const isPerformanceActive =
    location.pathname === '/app/performance' || location.pathname === '/app/dashboard-performance'

  const navItems = [
    {
      id: 'explorar',
      label: 'Explorar',
      path: '/app/explorar',
      icon: Compass,
      active: isExplorarActive,
    },
    {
      id: 'feed',
      label: 'Feed',
      path: '/app/feed',
      icon: Home,
      active: isFeedActive,
    },
    {
      id: 'funnel',
      label: 'Funil',
      path: '/app/funnel',
      icon: Briefcase,
      active: isFunnelActive,
    },
    {
      id: 'performance',
      label: 'Performance',
      path: '/app/performance',
      icon: BarChart3,
      active: isPerformanceActive,
    },
  ]

  const quickActions = [
    {
      title: 'AI Media Studio (Vídeo/Img/Áudio)',
      desc: 'Gere mídia multimodal com IA e seletor de custo',
      icon: Sparkles,
      iconBg: 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-xs',
      action: () => {
        setSheetOpen(false)
        navigate('/app/studio')
      },
    },
    {
      title: 'Criar Post ou Carrossel',
      desc: 'Editor com IA, modelos prontos e formatos',
      icon: PenSquare,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      action: () => {
        setSheetOpen(false)
        navigate('/app/content/new')
      },
    },
    {
      title: 'Rascunhos Salvos',
      desc: 'Retome posts em progresso com 1 clique',
      icon: BookOpen,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      action: () => {
        setSheetOpen(false)
        navigate('/app/library?tab=drafts')
      },
    },
    {
      title: 'Criar Vídeo com IA',
      desc: 'Roteiros magnéticos, TikTok e Reels virais',
      icon: Video,
      iconBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
      action: () => {
        setSheetOpen(false)
        navigate('/app/criar/videos')
      },
    },
    {
      title: 'Nova Ideia & Tendências',
      desc: 'Explorar banco com IA e insights de funil',
      icon: Sparkles,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      action: () => {
        setSheetOpen(false)
        navigate('/app/explorar')
      },
    },
    {
      title: 'Ver Calendário & Agendamentos',
      desc: 'Cronograma visual das postagens aprovadas',
      icon: CalendarIcon,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      action: () => {
        setSheetOpen(false)
        navigate('/app/calendar')
      },
    },
    {
      title: 'Performance de Campanhas',
      desc: 'Alcance, impressões e aprovação por campanha',
      icon: Megaphone,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      action: () => {
        setSheetOpen(false)
        navigate('/app/campaigns')
      },
    },
    {
      title: 'Hub de Redes & Canais',
      desc: 'Painel unificado das 23 redes sociais e anúncios',
      icon: Share2,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      action: () => {
        setSheetOpen(false)
        navigate('/app/social-hub')
      },
    },
    // Última ação destacada com fundo suave violeta (fiel à referência DonnaVende)
    {
      title: 'Abrir Funil & Pipeline de Vendas',
      desc: 'Acompanhar negócios, leads pagos e conversão',
      icon: Briefcase,
      iconBg: 'bg-purple-600 text-white shadow-xs',
      highlighted: true,
      action: () => {
        setSheetOpen(false)
        navigate('/app/funnel')
      },
    },
  ]

  return (
    <>
      {/* Floating Action Button (FAB) circular - canto inferior direito */}
      <div className="md:hidden fixed right-4 bottom-20 z-40">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Abrir Ações Rápidas"
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-700 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/20 ring-4 ring-purple-500/20"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Bottom Navigation Bar fixa - 5 itens estilo app nativo */}
      <nav
        aria-label="Navegação mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/80 px-2 py-1.5 shadow-2xl safe-area-pb"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.id}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl min-w-[56px] transition-all',
                  item.active
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-500/15 font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground active:scale-95',
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 mb-0.5 transition-transform',
                    item.active && 'scale-110 stroke-[2.5]',
                  )}
                />
                <span className="text-[10px] leading-tight tracking-tight">{item.label}</span>
              </Link>
            )
          })}

          {/* Botão "Mais" que abre o menu lateral completo */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl min-w-[56px] text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            aria-label="Mais opções e menu completo"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight tracking-tight">Mais</span>
          </button>
        </div>
      </nav>

      {/* Bottom Sheet de Ações Rápidas (Inspirado no padrão de UX mobile DonnaVende) */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Container */}
          <div className="relative z-10 w-full max-w-lg mx-auto bg-card rounded-t-3xl border-t border-border shadow-2xl p-5 pb-8 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
            {/* Header do Bottom Sheet */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-muted-foreground">
                  Ações Rápidas
                </span>
                <Badge
                  variant="outline"
                  className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] font-bold px-2 py-0.5"
                >
                  MidiaViva AI
                </Badge>
              </div>

              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Fechar ações rápidas"
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lista de Ações Rápidas */}
            <div className="mt-4 space-y-2.5">
              {quickActions.map((action, idx) => {
                const Icon = action.icon
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={action.action}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all border group',
                      action.highlighted
                        ? 'bg-purple-500/15 hover:bg-purple-500/20 border-purple-500/30 shadow-xs'
                        : 'bg-muted/40 hover:bg-muted/80 border-border/60',
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs',
                          action.iconBg,
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground leading-snug">
                          {action.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                          {action.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
export default MobileNav
