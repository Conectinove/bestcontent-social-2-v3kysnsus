import React, { useState } from 'react'
import { Search, Film, Image as ImageIcon, Music, Box, Code, Sparkles, Play } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StudioCreationRecord } from '@/services/ai-studio'

export interface StudioInspirationGalleryProps {
  creations: StudioCreationRecord[]
  onSelectCreation: (creation: StudioCreationRecord) => void
  className?: string
}

export const StudioInspirationGallery: React.FC<StudioInspirationGalleryProps> = ({
  creations = [],
  onSelectCreation,
  className = '',
}) => {
  const [activeFilter, setActiveFilter] = useState<
    'para-voce' | 'video' | 'imagem' | 'audio' | '3d' | 'html'
  >('para-voce')
  const [searchQuery, setSearchQuery] = useState('')

  // Amostras padrão caso o usuário ainda não tenha criações salvas
  const defaultItems = [
    {
      id: 'insp-1',
      title: 'BRO — curta-metragem de guerra realista em trincheira com iluminação dramática',
      type: 'video',
      category: 'Vídeo',
      previewUrl:
        'https://img.usecurling.com/p/600/400?q=cinematic+war+film+soldiers+fog&color=gray',
      prompt:
        'Cinematografia 4K de soldados em trincheira com névoa volumétrica e iluminação fria dramática.',
    },
    {
      id: 'insp-2',
      title: 'Cyberpunk Tokyo Drift — comercial futurista com neon e reflexos na pista molhada',
      type: 'video',
      category: 'Vídeo',
      previewUrl:
        'https://img.usecurling.com/p/600/400?q=cyberpunk+supercar+tokyo+neon&color=purple',
      prompt:
        'Supercarro esportivo percorrendo Shibuya futurista à noite com reflexos cáusticos nas poças de água.',
    },
    {
      id: 'insp-3',
      title: 'Café Especial Minimalista — sessão de fotos de produto comercial premium',
      type: 'image',
      category: 'Imagem',
      previewUrl:
        'https://img.usecurling.com/p/600/400?q=minimalist+coffee+packaging+studio&color=orange',
      prompt:
        'Embalagem de café especial em estúdio minimalista com iluminação difusa de golden hour e texturas quentes.',
    },
    {
      id: 'insp-4',
      title: 'Trilha Sonora Lo-Fi Épica — vinheta de abertura para canal de tecnologia',
      type: 'audio',
      category: 'Áudio',
      previewUrl:
        'https://img.usecurling.com/p/600/400?q=audio+synthesizer+music+studio&color=blue',
      prompt:
        'Batidas lo-fi com sintetizador analógico e textura vinil suave para abertura de podcast.',
    },
    {
      id: 'insp-5',
      title: '3D Isométrico Sala Gamer — maquete modular detalhada para animação',
      type: '3d',
      category: '3D',
      previewUrl: 'https://img.usecurling.com/p/600/400?q=isometric+3d+gamer+room+neon&color=cyan',
      prompt: 'Diorama 3D isométrico de quarto gamer com iluminação neon ambiente e texturas PBR.',
    },
    {
      id: 'insp-6',
      title: 'Landing Page Interativa 3D — hero component com shader interativo',
      type: 'html',
      category: 'HTML',
      previewUrl:
        'https://img.usecurling.com/p/600/400?q=interactive+web+design+dashboard+ui&color=green',
      prompt:
        'Dashboard interativo com animações fluidas e componentes de design system de alto impacto.',
    },
  ]

  // Mapeia criações reais do banco e mescla com defaultItems
  const allItems = [
    ...creations.map((c) => ({
      id: c.id,
      title: c.title || c.prompt,
      type: c.type,
      category: c.type === 'video' ? 'Vídeo' : c.type === 'image' ? 'Imagem' : 'Áudio',
      previewUrl: c.preview_url,
      prompt: c.prompt,
      raw: c,
    })),
    ...defaultItems,
  ]

  // Filtros
  const filteredItems = allItems.filter((item) => {
    // Filtro por tipo
    if (activeFilter === 'video' && item.type !== 'video') return false
    if (activeFilter === 'imagem' && item.type !== 'image') return false
    if (activeFilter === 'audio' && item.type !== 'audio') return false
    if (activeFilter === '3d' && item.type !== '3d') return false
    if (activeFilter === 'html' && item.type !== 'html') return false

    // Busca textual
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return item.title.toLowerCase().includes(q) || item.prompt.toLowerCase().includes(q)
    }

    return true
  })

  const filterTabs = [
    { id: 'para-voce', label: 'Para você' },
    { id: 'video', label: 'Vídeo' },
    { id: 'imagem', label: 'Imagem' },
    { id: 'audio', label: 'Áudio' },
    { id: '3d', label: '3D' },
    { id: 'html', label: 'HTML' },
  ] as const

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Topo da Galeria: Título Inspire-se + Filtros + Busca de Trabalhos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-heading text-foreground">
            Inspire-se
          </h3>
          <p className="text-xs text-muted-foreground">
            Descubra criações da comunidade e reutilize ganchos visuais e sonoros
          </p>
        </div>

        {/* Campo de Busca "Pesquisar trabalhos" */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar trabalhos..."
            className="pl-9 h-9 rounded-full bg-muted/60 border-border text-xs"
          />
        </div>
      </div>

      {/* Pílulas de Filtros */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {filterTabs.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
              activeFilter === f.id
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              if ('raw' in item && item.raw) {
                onSelectCreation(item.raw as StudioCreationRecord)
              }
            }}
            className="rounded-2xl overflow-hidden bg-card border border-border/80 hover:border-purple-500/50 shadow-xs hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="relative aspect-video bg-neutral-900 overflow-hidden">
              <img
                src={item.previewUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />

              {/* Tag de Categoria Superior */}
              <div className="absolute top-2.5 right-2.5">
                <Badge className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 border border-white/20">
                  {item.category}
                </Badge>
              </div>

              {/* Botão de Play / Preview */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="w-10 h-10 rounded-full bg-white/90 text-neutral-900 flex items-center justify-center shadow-lg">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </span>
              </div>
            </div>

            <div className="p-3.5 space-y-1">
              <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug group-hover:text-purple-600 transition-colors">
                {item.title}
              </h4>
              <p className="text-[11px] text-muted-foreground line-clamp-1">{item.prompt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default StudioInspirationGallery
