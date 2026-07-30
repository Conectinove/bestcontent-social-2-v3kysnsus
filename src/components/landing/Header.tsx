import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function LandingHeader() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-100/50 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Mídia<span className="text-purple-600">Viva</span>
          </span>
        </Link>

        <Link
          to={user ? '/app/feed' : '/login'}
          className="text-sm font-semibold text-slate-800 hover:text-purple-600 transition-colors"
        >
          Entrar na plataforma
        </Link>
      </div>
    </header>
  )
}
