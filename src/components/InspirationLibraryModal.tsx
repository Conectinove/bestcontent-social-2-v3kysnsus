import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Compass, ArrowRight } from 'lucide-react'

export interface InspirationItem {
  id: string
  title: string
  description: string
  format: string
  platform: string
  category: string
  imageUrl?: string
  tags: string[]
}

const DEFAULT_INSPIRATIONS: InspirationItem[] = [
  {
    id: 'plano-de-bordo',
    title: 'Plano de Bordo Realizador',
    description:
      'Sua Jornada Para a Vida Boa - Estratégia de Storytelling de Alta Conversão para MudarCurso.com.br.',
    format: 'Stories Único (9:16)',
    platform: 'Instagram',
    category: 'MudarCurso',
    imageUrl: 'https://img.usecurling.com/p/600/900?q=wanderer%20mountain%20compass&color=purple',
    tags: ['Recomendado', 'Alta Conversão', 'Storytelling', 'Vendas'],
  },
  {
    id: 'lideranca-tech',
    title: 'Liderança Tecnológica em 2026',
    description: 'Como dominar as novas ferramentas de IA sem perder a liderança humana.',
    format: 'Post / Flyer (1:1)',
    platform: 'LinkedIn',
    category: 'Tecnologia',
    imageUrl: 'https://img.usecurling.com/p/600/600?q=tech%20leadership&color=blue',
    tags: ['Carreira', 'Futuro'],
  },
  {
    id: 'produtividade-mudarcurso',
    title: '5 Hábitos para Mudar de Curso na Vida',
    description: 'Dicas práticas de rotina para sair da estagnação e alcançar objetivos.',
    format: 'Carrossel (4:5)',
    platform: 'Instagram',
    category: 'MudarCurso',
    imageUrl: 'https://img.usecurling.com/p/600/750?q=productivity%20journal&color=orange',
    tags: ['Produtividade', 'Hábitos'],
  },
]

interface InspirationLibraryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectInspiration: (item: InspirationItem) => void
}

export function InspirationLibraryModal({
  open,
  onOpenChange,
  onSelectInspiration,
}: InspirationLibraryModalProps) {
  const [selectedId, setSelectedId] = useState<string>('plano-de-bordo')

  const handleConfirm = () => {
    const item = DEFAULT_INSPIRATIONS.find((i) => i.id === selectedId) || DEFAULT_INSPIRATIONS[0]
    onSelectInspiration(item)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" /> Biblioteca de Inspirações e Templates
          </DialogTitle>
          <DialogDescription className="text-xs">
            Escolha uma ideia de conteúdo com alta conversão comprovada para pré-preencher o gerador
            IA.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          {DEFAULT_INSPIRATIONS.map((item) => {
            const isSelected = item.id === selectedId
            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`rounded-xl border p-3.5 cursor-pointer transition-all space-y-3 flex flex-col justify-between relative ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                {item.id === 'plano-de-bordo' && (
                  <Badge className="bg-amber-500 text-white text-[10px] absolute top-2 right-2">
                    MudarCurso ⭐
                  </Badge>
                )}
                <div>
                  <div className="h-32 rounded-lg overflow-hidden bg-muted mb-2.5 relative">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge
                      variant="secondary"
                      className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white border-0"
                    >
                      {item.format}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-sm leading-tight text-foreground">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 pt-2 border-t border-border/50">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-muted font-medium text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} size="sm" className="bg-primary text-white gap-1.5">
            Usar Inspiração Selecionada <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
