import { Link } from 'react-router-dom'
import { Image as ImageIcon, FileText, Video, ArrowRight, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'

const CONTENT_CARDS = [
  {
    title: 'Posts de Imagens',
    description: 'Crie posts estáticos para Instagram, Facebook e LinkedIn com templates e IA.',
    icon: ImageIcon,
    href: '/app/criar/imagens',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Panfletos / Flyers',
    description: 'Flyers promocionais, cardápios e eventos com layout profissional.',
    icon: FileText,
    href: '/app/criar/flyers',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    title: 'Vídeos',
    description: 'Vídeos curtos para TikTok, Reels e YouTube Shorts com roteiro gerado por IA.',
    icon: Video,
    href: '/app/criar/videos',
    gradient: 'from-purple-500 to-pink-500',
  },
]

export default function CreateHub() {
  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          Criar Conteúdo <Sparkles className="w-6 h-6 text-primary animate-pulse" />
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Escolha o tipo de conteúdo que deseja criar hoje.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CONTENT_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} to={card.href}>
              <Card className="p-6 h-full hover:shadow-lg transition-all duration-300 border-border hover:border-primary/40 cursor-pointer group">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md mb-4`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {card.description}
                </p>
                <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-4 group-hover:gap-2 transition-all">
                  Começar <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
