import React, { useState, useEffect } from 'react'
import { Video, Sparkles, Zap, ArrowRight, Search, Check, Star, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import {
  getStudioPromptTemplates,
  type StudioPromptTemplate,
} from '@/services/studio-prompt-templates'

interface VideoTemplatesBarProps {
  onApplyTemplate: (templateText: string, modelId?: string) => void
}

// Catálogo nativo de fallback garantindo templates realistas em PT-BR mesmo se offline
const FALLBACK_VIDEO_TEMPLATES = [
  {
    id: 'vid-ugc-hook',
    name: 'Anúncio UGC com Gancho em 3s',
    description: 'Abertura em primeira pessoa com corte rápido e chamada de alta conversão.',
    template_text:
      'Vídeo vertical 9:16 de alta energia para {nicho}. Criador segura {produto} em primeiro plano com iluminação natural. Gancho magnético nos primeiros 3s: "{gancho}". Edição dinâmica com cortes a cada 1.5s, legendas cinéticas e encerramento com CTA: "{cta}".',
    default_model_id: 'kling-4-0',
    tag: 'UGC Viral',
  },
  {
    id: 'vid-produto-cinematic',
    name: 'Demonstração de Produto Cinematográfica',
    description: 'Câmera lenta orbital 360°, iluminação comercial de luxo e close em textura.',
    template_text:
      'Comercial cinematográfico de 15 segundos para {produto}. Câmera com lente anamórfica em movimento slow-motion circular suave revelando textura, reflexos sofisticados e atmosfera {estilo}. Iluminação volumétrica em tons {paleta}, partículas no ar e transição final para logo.',
    default_model_id: 'sora-2-pro',
    tag: 'Cinematográfico',
  },
  {
    id: 'vid-antes-depois',
    name: 'Antes e Depois de Transformação',
    description: 'Efeito tela dividida mostrando contraste da dor vs resultado espetacular.',
    template_text:
      'Cena dividida de Antes e Depois em {nicho}: lado esquerdo em tons frios mostrando a frustração com {problema}, lado direito com transição luminosa dinâmica revelando a transformação espetacular com {produto}. Tom {tom} e gancho final com CTA direto.',
    default_model_id: 'runway-gen3-alpha-turbo',
    tag: 'Conversão',
  },
  {
    id: 'vid-depoimento-social',
    name: 'Depoimento de Cliente (Prova Social)',
    description: 'Entrevista espontânea com B-roll realista de uso e legendas.',
    template_text:
      'Depoimento espontâneo em plano médio de cliente falando sobre {produto}: "No começo eu duvidava de {tema}, mas em poucas semanas vi resultados reais". Cortes com B-roll demonstrando o uso em {ambiente}, iluminação aconchegante e CTA convidando para conhecer.',
    default_model_id: 'semente-2-5',
    tag: 'Autoridade',
  },
  {
    id: 'vid-unboxing-textura',
    name: 'Unboxing Estético & Texturas',
    description: 'Abertura de embalagem com som imersivo e acabamento minimalista.',
    template_text:
      'Unboxing cinematográfico de {produto} em superfície minimalista de mármore. Câmera macro 60fps focando na retirada do lacre, textura do material e revelação do design. Iluminação suave de estúdio em tom {tom} e logotipo animado ao final.',
    default_model_id: 'video-flux-3',
    tag: 'Produto',
  },
  {
    id: 'vid-tutorial-rapido',
    name: 'Tutorial Rápido em 3 Atos',
    description: 'Estrutura didática Dor → Solução Rápida → Resultado Prático.',
    template_text:
      'Vídeo explicativo e didático sobre {tema}. Ato 1: demonstrar o erro comum que causa {dor}. Ato 2: tela dividida mostrando o método correto com {ferramenta} em 3 passos simples. Ato 3: tela com o resultado final e convite para salvar o conteúdo.',
    default_model_id: 'luma-dream-machine',
    tag: 'Didático',
  },
  {
    id: 'vid-storytelling-marca',
    name: 'Storytelling de Marca & Manifesto',
    description: 'Roteiro institucional inspirador conectando propósito e resultado.',
    template_text:
      'Vídeo institucional estilo manifesto sobre a missão de {marca}. Sequência de cenas urbanas e de equipe em ritmo acelerado demonstrando a superação em {mercado}. Narração forte em tom {tom} com trilha épica crescente e assinatura final: "{slogan}".',
    default_model_id: 'kling-4-0',
    tag: 'Branding',
  },
]

export const VideoTemplatesBar: React.FC<VideoTemplatesBarProps> = ({ onApplyTemplate }) => {
  const [templates, setTemplates] = useState<any[]>(FALLBACK_VIDEO_TEMPLATES)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadTemplates() {
      try {
        const dbList = await getStudioPromptTemplates('video')
        if (dbList && dbList.length > 0) {
          const mapped = dbList.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description || 'Template profissional de vídeo',
            template_text: t.template_text,
            default_model_id: t.default_model_id,
            tag: t.is_favorite ? 'Destaque' : 'Vídeo',
          }))
          // Combina sem duplicar nomes
          const combined = [...mapped]
          FALLBACK_VIDEO_TEMPLATES.forEach((fb) => {
            if (!combined.some((c) => c.name.toLowerCase() === fb.name.toLowerCase())) {
              combined.push(fb)
            }
          })
          setTemplates(combined)
        }
      } catch {
        /* usa fallback */
      }
    }
    loadTemplates()
  }, [])

  const handleApply = (tmpl: any) => {
    setSelectedId(tmpl.id)
    onApplyTemplate(tmpl.template_text, tmpl.default_model_id)
    toast({
      title: 'Template de vídeo aplicado!',
      description: `"${tmpl.name}" preencheu o prompt com placeholders {substituíveis}.`,
    })
  }

  const filtered = templates.filter((t) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
  })

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center text-primary">
            <Video className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-foreground tracking-tight flex items-center gap-1.5">
            Templates de Vídeo Pré-definidos
            <Badge
              variant="outline"
              className="text-[9px] uppercase px-1.5 py-0 font-mono text-primary border-primary/30"
            >
              1 clique
            </Badge>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] text-muted-foreground hover:text-foreground font-medium"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Recolher' : `Ver todos (${templates.length})`}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar templates de vídeo (UGC, comercial, antes/depois)..."
            className="h-7 pl-8 text-xs bg-background/80"
          />
        </div>
      )}

      {/* Carrossel / Grade de chips */}
      <div
        className={
          expanded
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1'
            : 'flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none'
        }
      >
        {filtered.map((tmpl) => {
          const isSelected = selectedId === tmpl.id
          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleApply(tmpl)}
              className={`text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1 flex-shrink-0 ${
                expanded ? 'w-full' : 'w-[230px]'
              } ${
                isSelected
                  ? 'border-primary bg-primary/15 shadow-sm ring-1 ring-primary/40'
                  : 'border-border/60 bg-background/60 hover:bg-background/90 hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-xs font-semibold text-foreground truncate" title={tmpl.name}>
                  {tmpl.name}
                </span>
                <Badge className="text-[8px] uppercase px-1 py-0 bg-muted text-muted-foreground border-border/40 font-mono">
                  {tmpl.tag || 'Vídeo'}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-1 leading-snug">
                {tmpl.description}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-border/20 text-[9px] text-primary font-semibold">
                <span className="flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> Aplicar prompt
                </span>
                {isSelected && <Check className="w-2.5 h-2.5 text-primary" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
