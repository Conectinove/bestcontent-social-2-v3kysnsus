import { useState, useEffect } from 'react'
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom'
import {
  Loader2,
  LayoutDashboard,
  Home,
  Users,
  Wand2,
  Palette,
  PenTool,
  BookOpen,
  Calendar,
  Compass,
  CreditCard,
  Settings,
  Gift,
  LayoutGrid,
  Globe,
  FlaskConical,
  BarChart3,
  Share2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCustomization } from '@/context/CustomizationContext'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { OfflineBanner } from './OfflineBanner'
import { QuickOnboardingModal } from './QuickOnboardingModal'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export default function Layout() {
  const { user, isAuthenticated, loading } = useAuth()
  const { menuLayout } = useCustomization()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [quickOnboardingOpen, setQuickOnboardingOpen] = useState(false)

  // Trigger quick onboarding modal automatically on first access if not seen
  useEffect(() => {
    if (loading || !isAuthenticated || !user) return

    const seenLocal = localStorage.getItem('quick_onboarding_seen') === 'true'
    const seenDb = user.onboarding_completed === true

    // Show on first access if not yet seen
    if (!seenLocal && !seenDb) {
      const timer = setTimeout(() => {
        setQuickOnboardingOpen(true)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [loading, isAuthenticated, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <OfflineBanner />

      {/* Top menu layout (if menuLayout === 'topbar' on desktop) */}
      {menuLayout === 'topbar' && (
        <div className="hidden md:block border-b border-border bg-card/60 backdrop-blur-md px-4 py-2 sticky top-16 z-10 overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-1 max-w-7xl mx-auto">
            {[
              { label: 'Feed', href: '/app/feed', icon: Home, highlight: true },
              { label: 'Visão Geral', href: '/app/visao-geral', icon: LayoutDashboard },
              { label: 'Funil Vendas', href: '/app/funnel', icon: LayoutGrid },
              { label: 'Hub Social', href: '/app/social-hub', icon: Share2 },
              { label: 'Performance', href: '/app/performance', icon: BarChart3 },
              { label: 'Portal Cliente', href: '/app/portal-cliente', icon: Users },
              { label: 'Criar', href: '/app/criar', icon: Wand2 },
              { label: 'Anúncios', href: '/app/ads', icon: LayoutGrid },
              { label: 'SEO Social', href: '/app/seo', icon: Globe },
              { label: 'Brand Kit', href: '/app/brand-kit', icon: Palette },
              { label: 'Banco de Dados', href: '/app/data', icon: Settings },
              { label: 'Labs', href: '/app/labs', icon: FlaskConical },
              { label: 'Biblioteca', href: '/app/library', icon: BookOpen },
              { label: 'Calendário', href: '/app/calendar', icon: Calendar },
              { label: 'Assinatura', href: '/app/subscription', icon: CreditCard },
              { label: 'Configurações', href: '/app/settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon
              const active =
                item.href === '/app/feed'
                  ? location.pathname === '/app/feed' ||
                    location.pathname === '/app/feed-comunidade'
                  : item.href === '/app/visao-geral'
                    ? location.pathname === '/app/visao-geral'
                    : location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                    item.highlight && !active && 'bg-primary/10 text-primary hover:bg-primary/20',
                    active
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar only rendered on desktop if layout is sidebar */}
        {menuLayout !== 'topbar' && (
          <div className="hidden md:block shrink-0">
            <Sidebar
              collapsed={collapsed}
              onToggleCollapse={() => setCollapsed(!collapsed)}
              onOpenQuickOnboarding={() => setQuickOnboardingOpen(true)}
            />
          </div>
        )}

        {/* Mobile drawer always uses vertical sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="p-0 w-72 max-w-[85vw] border-r border-border bg-sidebar overflow-y-auto"
          >
            <Sidebar
              collapsed={false}
              onToggleCollapse={() => {}}
              onMobileClose={() => setMobileOpen(false)}
              onOpenQuickOnboarding={() => {
                setMobileOpen(false)
                setQuickOnboardingOpen(true)
              }}
            />
          </SheetContent>
        </Sheet>

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
          <Header onOpenMobileMenu={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-16">
            <Outlet />
          </main>
          <footer className="border-t border-border py-4 px-6 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-center sm:text-left font-medium">
              MidiaViva — Powered by BestContent AI · v0.0.79
            </span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setQuickOnboardingOpen(true)}
                className="footer-link hover:text-purple-600 transition-colors"
              >
                Novidades
              </button>
              <Link
                to="/app/settings"
                className="footer-link hover:text-purple-600 transition-colors"
              >
                Termos
              </Link>
              <Link
                to="/app/settings"
                className="footer-link hover:text-purple-600 transition-colors"
              >
                Privacidade
              </Link>
            </div>
          </footer>
        </div>
      </div>

      {/* Quick Onboarding "Vamos agilizar!" Modal */}
      <QuickOnboardingModal open={quickOnboardingOpen} onOpenChange={setQuickOnboardingOpen} />
    </div>
  )
}
