import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { OfflineBanner } from './OfflineBanner'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export default function Layout() {
  const { isAuthenticated, loading } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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

      <div className="flex flex-1 relative overflow-hidden">
        <div className="hidden md:block shrink-0">
          <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-64 border-r border-border">
            <Sidebar
              collapsed={false}
              onToggleCollapse={() => {}}
              onMobileClose={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
          <Header onOpenMobileMenu={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto pb-16">
            <Outlet />
          </main>
          <footer className="border-t border-border py-4 px-6 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              BestContent Social 2 © {new Date().getFullYear()} — Plataforma de Criação &
              Gerenciamento
            </span>
            <div className="flex gap-4">
              <a href="#" className="hover:underline">
                Privacidade
              </a>
              <a href="#" className="hover:underline">
                Termos de Uso
              </a>
              <a href="#" className="hover:underline font-medium text-primary">
                Suporte VIP
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
