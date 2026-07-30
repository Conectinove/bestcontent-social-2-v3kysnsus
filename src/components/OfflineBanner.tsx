import { useSocial } from '@/context/SocialContext'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const { isOffline } = useSocial()

  if (!isOffline) return null

  return (
    <div className="bg-amber-500 text-black px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 shadow-sm animate-fade-in">
      <WifiOff className="w-4 h-4" />
      <span>
        Você está em modo offline. As alterações serão sincronizadas quando houver conexão.
      </span>
    </div>
  )
}
