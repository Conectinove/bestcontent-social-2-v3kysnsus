import { Instagram, Facebook, Heart, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TopPost {
  id: string
  rank: number
  platform: 'Instagram' | 'Facebook'
  type: 'Video' | 'Imagem' | 'Carrossel'
  title: string
  likes: number
  comments: number
  date: string
  imageUrl: string
}

interface TopPostsGalleryProps {
  platform: 'all' | 'Instagram' | 'Facebook'
  posts?: TopPost[]
}

export function TopPostsGallery({ platform, posts }: TopPostsGalleryProps) {
  const defaultPosts: TopPost[] = [
    {
      id: '1',
      rank: 1,
      platform: 'Instagram',
      type: 'Video',
      title:
        'Vizinho( meu plano A) era viver da bola(miou)hehe... então, há 17 anos estou - brutalmente - focado no PLANO B!',
      likes: 81,
      comments: 0,
      date: '05/10',
      imageUrl: 'https://img.usecurling.com/p/400/500?q=fitness%20motivation&color=black',
    },
    {
      id: '2',
      rank: 2,
      platform: 'Instagram',
      type: 'Imagem',
      title: 'A vida só entende a coragem que você dá conta de enfrentar...',
      likes: 70,
      comments: 4,
      date: '12/10',
      imageUrl: 'https://img.usecurling.com/p/400/500?q=quote%20inspiration&color=orange',
    },
    {
      id: '3',
      rank: 3,
      platform: 'Instagram',
      type: 'Imagem',
      title: 'COMUNICADO - A Escola Conectinove Rolim de Moura comunica...',
      likes: 60,
      comments: 2,
      date: '18/10',
      imageUrl: 'https://img.usecurling.com/p/400/500?q=announcement%20banner&color=purple',
    },
    {
      id: '4',
      rank: 4,
      platform: 'Facebook',
      type: 'Imagem',
      title: 'Semeie Ação Play - A Live Conecta!',
      likes: 50,
      comments: 5,
      date: '22/10',
      imageUrl: 'https://img.usecurling.com/p/400/500?q=live%20event&color=blue',
    },
  ]

  const list = posts || defaultPosts
  const filtered = platform === 'all' ? list : list.filter((p) => p.platform === platform)

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold tracking-tight">
            {platform === 'all' ? 'Maiores posts no geral' : 'Top posts por engajamento'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {platform === 'all'
              ? 'Ordenados por taxa de engajamento, somando todas as redes'
              : 'Ordenados por curtidas + comentários'}
          </p>
        </div>
        <button className="text-xs font-semibold text-primary hover:underline">
          Ver todos (75)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-sm flex flex-col justify-end h-72 text-white"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold flex items-center justify-center ring-1 ring-white/30">
                {item.rank}
              </span>
              <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ring-1 ring-white/30">
                {item.platform === 'Instagram' ? (
                  <Instagram className="w-3.5 h-3.5 text-pink-400" />
                ) : (
                  <Facebook className="w-3.5 h-3.5 text-blue-400" />
                )}
              </div>
            </div>

            <div className="absolute top-3 right-3">
              <Badge className="bg-black/40 backdrop-blur-md text-white text-[10px] border-none font-medium px-2 py-0.5">
                {item.type}
              </Badge>
            </div>

            <div className="relative p-3.5 space-y-2">
              <p className="text-xs text-slate-100 font-medium line-clamp-2 leading-snug">
                {item.title}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold pt-1 border-t border-white/10">
                <span>{item.likes + item.comments} interações</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                    {item.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-slate-300" />
                    {item.comments}
                  </span>
                  <span className="text-slate-400 font-normal">· {item.date}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
