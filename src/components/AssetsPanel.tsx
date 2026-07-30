import { useState, useEffect, type DragEvent } from 'react'
import { Search, Shapes, ImageIcon, Triangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getPremiumElements, type PremiumElement } from '@/services/premium-elements'

const TYPE_TABS = [
  { key: 'all', label: 'Todos', icon: Shapes },
  { key: 'icon', label: 'Ícones', icon: ImageIcon },
  { key: 'texture', label: 'Texturas', icon: Shapes },
  { key: 'shape', label: 'Formas', icon: Triangle },
]

interface AssetsPanelProps {
  onDragStart: (element: PremiumElement) => void
}

export function AssetsPanel({ onDragStart }: AssetsPanelProps) {
  const [elements, setElements] = useState<PremiumElement[]>([])
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPremiumElements()
      .then(setElements)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDragStart = (e: DragEvent, el: PremiumElement) => {
    e.dataTransfer.setData('application/json', JSON.stringify(el))
    onDragStart(el)
  }

  const filtered = elements.filter((el) => {
    if (activeType !== 'all' && el.type !== activeType) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return el.name.toLowerCase().includes(q) || (el.category || '').toLowerCase().includes(q)
    }
    return true
  })

  const renderPreview = (el: PremiumElement) => {
    if (el.type === 'texture') {
      return <div className="w-full h-full rounded" style={{ background: el.data }} />
    }
    return (
      <div
        className="w-full h-full flex items-center justify-center text-primary"
        dangerouslySetInnerHTML={{ __html: el.data }}
      />
    )
  }

  return (
    <div className="flex flex-col h-full border border-border rounded-xl bg-card overflow-hidden">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Shapes className="w-4 h-4 text-primary" /> Ativos
        </h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">Arraste elementos para a arte</p>
      </div>
      <div className="p-2 space-y-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {TYPE_TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={activeType === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveType(tab.key)}
              className="text-[10px] h-7 px-2 shrink-0"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1 p-2">
        {loading ? (
          <div className="text-center text-xs text-muted-foreground py-8">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-8">
            Nenhum elemento encontrado
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((el) => (
              <div
                key={el.id}
                draggable
                onDragStart={(e) => handleDragStart(e, el)}
                className="cursor-grab active:cursor-grabbing group rounded-lg border border-border p-2 hover:border-primary hover:shadow-sm transition-all"
              >
                <div className="w-full aspect-square rounded-md bg-muted/40 overflow-hidden mb-1">
                  {renderPreview(el)}
                </div>
                <p className="text-[9px] font-medium text-center truncate">{el.name}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
