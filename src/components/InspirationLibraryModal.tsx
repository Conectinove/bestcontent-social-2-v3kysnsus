import { useState } from 'react'
import {
  Sparkles,
  X,
  Bookmark,
  TrendingUp,
  Newspaper,
  Calendar,
  Compass,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface InspirationItem {
  id: string
  title: string
  description: string
  category: string
  tag: string
  format: string
  objective: string
  platform: string
  imageUrl: string
  tips: string
  isFeatured?: boolean
}

const INSPIRATIONS: InspirationItem[] = [
  {
    id: 'plano-de-bordo',
    title: 'Plano de Bordo Realizador: Sua Jornada Para a Vida Boa',
    description:
      "Aprofunde-se no 'Plano de Bordo Realizador' e descubra como ele pode transformar sua vida. Um mapa prático para a sua vocação.",
    category: 'Oportunidades',
    tag: 'Oportunidade',
    format: 'Stories (9:16)',
    objective: 'Vendas',
    platform: 'Instagram',
    imageUrl: 'https://img.usecurling.com/p/600/900?q=wanderer%20mountain%20compass&color=purple',
    tips: 'Use caixas de perguntas e enquetes para engajar nos Stories e direcione para a oferta.',
    isFeatured: true,
  },
  {
    id: 'emails-cliques',
    title: 'E-mails que Geram Cliques: Estratégias de Sucesso',
    description:
      'Domine a arte de escrever e-mails que não só são abertos, mas que convertem leitores em clientes apaixonados.',
    category: 'Trends',
    tag: 'Trends',
    format: 'Carrossel',
    objective: 'Engajamento',
    platform: 'LinkedIn',
    imageUrl: 'https://img.usecurling.com/p/600/900?q=dark%20workspace%20laptop',
    tips: 'Apresente exemplos práticos de linhas de assunto e chamadas persuasivas.',
  },
  {
    id: 'liberdade-profissional',
    title: 'Liberdade Profissional: Como Sair da Rotina e Viver Seu Propósito',
    description:
      'Muitos buscam liberdade e propósito. Este post desvenda como transformar a rotina e viver da sua própria vocação.',
    category: 'Trends',
    tag: 'Trends',
    format: 'Carrossel',
    objective: 'Engajamento',
    platform: 'Instagram',
    imageUrl: 'https://img.usecurling.com/p/600/900?q=beach%20sunset%20freedom',
    tips: 'Crie um carrossel com passos práticos e visuais limpos.',
  },
  {
    id: 'tendencias-ia-2026',
    title: 'Tendências de Inteligência Artificial para Criadores de Conteúdo',
    description:
      'Descubra como as ferramentas generativas e os agentes de IA estão otimizando o fluxo de produção de mídia.',
    category: 'Notícias',
    tag: 'Notícias',
    format: 'Post Único',
    objective: 'Autoridade',
    platform: 'LinkedIn',
    imageUrl: 'https://img.usecurling.com/p/600/900?q=futuristic%20ai%20technology',
    tips: 'Destaque 3 pontos-chave com dados estatísticos recentes.',
  },
  {
    id: 'calendario-editorial',
    title: 'Data Comemorativa: Dia da Inovação e Empreendedorismo',
    description:
      'Aproveite a data para conectar os valores da sua marca à busca por evolução e liberdade financeira.',
    category: 'Datas',
    tag: 'Datas',
    format: 'Stories (9:16)',
    objective: 'Conexão',
    platform: 'Instagram',
    imageUrl: 'https://img.usecurling.com/p/600/900?q=lightbulb%20idea%20glowing',
    tips: 'Grave um vídeo curto abrindo com uma pergunta marcante.',
  },
]

interface InspirationLibraryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectInspiration: (inspiration: InspirationItem) => void
}

export function InspirationLibraryModal({
  open,
  onOpenChange,
  onSelectInspiration,
}: InspirationLibraryModalProps) {
  const [activeTab, setActiveTab] = useState('Todas')
  const [page, setPage] = useState(1)

  const tabs = ['Todas', 'Trends', 'Notícias', 'Datas', 'Oportunidades']

  const filtered = INSPIRATIONS.filter((item) => {
    if (activeTab === 'Todas') return true
    return item.category.toLowerCase() === activeTab.toLowerCase()
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background border-none rounded-2xl shadow-2xl">
        {/* Header Orange Banner */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 text-white relative">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
            <div className="p-2 bg-white/20 rounded-lg">
              <Compass className="w-5 h-5 text-white" />
            </div>
            Biblioteca de Inspirações
          </DialogTitle>
          <DialogDescription className="text-white/90 text-xs mt-1">
            Escolha um tema pronto e validado estrategicamente para criar seu post em segundos
          </DialogDescription>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setPage(1)
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-white text-orange-600 shadow-md scale-105'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="p-6 max-h-[65vh] overflow-y-auto bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:border-orange-500/50 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 overflow-hidden bg-muted">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge className="bg-black/70 hover:bg-black/80 text-white text-[10px] border-none backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-1 animate-pulse" />
                        {item.tag}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-black/60 text-white border-none backdrop-blur-sm"
                      >
                        {item.format}
                      </Badge>
                    </div>
                    <button className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm">
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>MudarCurso.com.br</span>
                      <span>Hoje</span>
                    </div>

                    <h3 className="font-bold text-xs line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap gap-1 pt-1">
                      <Badge variant="outline" className="text-[10px] font-normal py-0">
                        💲 {item.objective}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-normal py-0">
                        📱 {item.platform}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed pt-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 space-y-3">
                  <div className="p-2 bg-orange-500/5 border border-orange-500/10 rounded-lg text-[10px] text-muted-foreground flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                    <span>{item.tips}</span>
                  </div>

                  <Button
                    onClick={() => {
                      onSelectInspiration(item)
                      onOpenChange(false)
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold gap-1 py-1.5"
                  >
                    Usar esta inspiração <Sparkles className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 bg-background border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>{filtered.length} inspirações disponíveis</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span>Página {page} de 1</span>
            <Button size="sm" variant="outline" disabled={true} className="h-8 w-8 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
