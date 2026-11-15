import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

/**
 * Guarda de rota admin: só deixa passar quem tem role 'admin' (com o fallback
 * de e-mail herdado do MVP enquanto a migração de roles é adotada).
 * Não-admin é redirecionado para o feed; a listagem de usuários também é
 * protegida no servidor pelas API rules da coleção users (migration 0110).
 */
export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  const isAdmin = user?.role === 'admin' || user?.email === 'midiaviva@bestcontent.ai'

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/app/feed" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
