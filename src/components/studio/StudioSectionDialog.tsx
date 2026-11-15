import React from 'react'
import { FolderKanban, HelpCircle, Layers, Palette } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { StudioCreationRecord } from '@/services/ai-studio'

export type StudioSectionId = 'inicio' | 'projetos' | 'habilidades' | 'estilos' | 'ajuda'

interface StudioSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: StudioSectionId | null
  creations: StudioCreationRecord[]
  onSelectCreation: (creation: StudioCreationRecord) => void
  /** Ação pedida pelo usuário: trocar de aba/console, aplicar prompt ou estilo. */
  onAction: (action: {
    tab?: 'geral' | 'video' | 'image' | 'audio' | '3d'
    prompt?: string
  }) => void
}

const SKILLS = [
  {
    id: 'geral',
    title: 'Console Multimodal',
    description: 'Gere vídeo, imagem, áudio e 3D com os modelos mais recentes, em um só lugar.',
  },
  {
    id: 'image',
    title: 'Artes de Alto Impacto',
    description: 'Imagens fotorrealistas e editoriais com presets de estilo e edição avançada.',
  },
  {
    id: 'video',
    title: 'Vídeos Cinematográficos',
    description: 'Cenas com movimento de câmera, iluminação e enquadramento profissional.',
  },
  {
    id: 'audio',
    title: 'Locuções & Trilhas',
    description: 'Narração comercial e trilhas para Reels, Shorts e TikTok.',
  },
]

const STYLES = [
  { name: 'Cinematográfico Pro', hint: 'Luz dramática e profundidade de cinema.' },
  { name: 'Fotorrealista 4K', hint: 'Nitidez extrema, ideal para produto.' },
  { name: 'Comercial Editorial', hint: 'Estilo de revista, limpo e persuasivo.' },
  { name: 'Estética Cyberpunk', hint: 'Neons, contrastes e futurismo.' },
]

const HELP_LINKS = [
  {
    title: 'Como escrever prompts que convertem',
    description: 'Estrutura sujeito + ação + estilo + proporção. Exemplo pronto no console.',
    prompt: 'Promoção de verão para loja de moda praia, luz dourada, estilo editorial, 9:16',
  },
  {
    title: 'Editar a mídia depois de gerar',
    description: 'Use "Editar" no detalhe da criação para abrir a Edição Avançada da Arte.',
    prompt: '',
  },
  {
    title: 'Levar a mídia para o criador de posts',
    description: 'No detalhe da criação, clique em "Criar Post com Esta Mídia".',
    prompt: '',
  },
]

export const StudioSectionDialog: React.FC<StudioSectionDialogProps> = ({
  open,
  onOpenChange,
  section,
  creations,
  onSelectCreation,
  onAction,
}) => {
  if (!section) return null

  const titles: Record<StudioSectionId, { title: string; description: string }> = {
    inicio: { title: 'Início', description: 'Console do Estúdio de mídia.' },
    projetos: {
      title: 'Projetos do Studio',
      description: 'Todas as mídias já geradas na sua conta, prontas para reabrir ou editar.',
    },
    habilidades: {
      title: 'Habilidades do Studio',
      description: 'O que o console de IA consegue produzir para o seu conteúdo.',
    },
    estilos: {
      title: 'Estilos Visuais',
      description: 'Aplique um estilo ao prompt antes de gerar — combina com as Configurações.',
    },
    ajuda: {
      title: 'Central de Ajuda',
      description: 'Atalhos rápidos para dominar o Estúdio de mídia.',
    },
  }

  const meta = titles[section]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-black text-xl font-heading">{meta.title}</DialogTitle>
          <DialogDescription className="text-xs">{meta.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {section === 'projetos' && (
            <>
              {creations.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum projeto ainda. Gere sua primeira mídia no console!
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {creations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelectCreation(c)
                      onOpenChange(false)
                    }}
                    className="group text-left rounded-xl border border-border/80 overflow-hidden hover:border-primary/50 transition-colors bg-background"
                  >
                    <div className="aspect-video bg-muted overflow-hidden">
                      {c.preview_url ? (
                        c.type === 'video' ? (
                          <video
                            src={c.preview_url}
                            className="w-full h-full object-cover"
                            muted
                            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                            onMouseLeave={(e) => e.currentTarget.pause()}
                          />
                        ) : (
                          <img
                            src={c.preview_url}
                            alt={c.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FolderKanban className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-2 space-y-0.5">
                      <p className="text-[11px] font-bold line-clamp-1">{c.title}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{c.prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {section === 'habilidades' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SKILLS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onAction({ tab: s.id as 'geral' | 'video' | 'image' | 'audio' | '3d' })
                    onOpenChange(false)
                  }}
                  className="text-left p-3 rounded-xl border border-border/80 hover:border-primary/50 hover:bg-muted/40 transition-colors"
                >
                  <Badge variant="secondary" className="text-[9px] uppercase mb-1.5">
                    {s.id}
                  </Badge>
                  <p className="text-xs font-bold">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.description}</p>
                </button>
              ))}
            </div>
          )}

          {section === 'estilos' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => {
                    onAction({ prompt: s.name })
                    onOpenChange(false)
                  }}
                  className="text-left p-3 rounded-xl border border-border/80 hover:border-primary/50 hover:bg-muted/40 transition-colors"
                >
                  <Palette className="w-4 h-4 text-purple-600 mb-1.5" />
                  <p className="text-xs font-bold">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.hint}</p>
                </button>
              ))}
            </div>
          )}

          {section === 'ajuda' && (
            <div className="space-y-2">
              {HELP_LINKS.map((h) => (
                <div
                  key={h.title}
                  className="p-3 rounded-xl border border-border/80 flex items-start gap-3"
                >
                  <HelpCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold">{h.title}</p>
                    <p className="text-[11px] text-muted-foreground">{h.description}</p>
                    {h.prompt && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1.5 h-7 text-[11px] rounded-full"
                        onClick={() => {
                          onAction({ prompt: h.prompt })
                          onOpenChange(false)
                        }}
                      >
                        <Layers className="w-3 h-3 mr-1" />
                        Usar no console
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default StudioSectionDialog
