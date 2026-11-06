import React from 'react'
import {
  Plus,
  Home,
  FolderKanban,
  Sparkles,
  Palette,
  HelpCircle,
  Settings,
  ChevronRight,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StudioCreationRecord } from '@/services/ai-studio'

export interface StudioSidebarProps {
  activeSection: string
  onSelectSection: (section: string) => void
  onNewCanvas: () => void
  recentCreations?: StudioCreationRecord[]
  onSelectRecent?: (item: StudioCreationRecord) => void
  userName?: string
  userEmail?: string
  onOpenSettings?: () => void
  onViewAllRecents?: () => void
  onOpenHistoryModal?: () => void
  onOpenCollaborationModal?: () => void
  onOpenVersionHistoryModal?: () => void
  onOpenSecondBrain?: () => void
  className?: string
}

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
  activeSection,
  onSelectSection,
  onNewCanvas,
  recentCreations = [],
  onSelectRecent,
  userName = 'Ronaldo Barreto',
  userEmail,
  onOpenSettings,
  onViewAllRecents,
  onOpenHistoryModal,
  onOpenCollaborationModal,
  onOpenVersionHistoryModal,
  onOpenSecondBrain,
  className = '',
}) => {
  // Itens padrão de recentes para espelhar exatamente os prints se a lista estiver vazia
  const defaultRecents = [
    {
      id: 'rec-1',
      title: 'Solicitação de vídeo para atualização do produto...',
      tag: 'R',
      type: 'video',
    },
    {
      id: 'rec-2',
      title: 'Solicitação de vídeo para lançamento de feature...',
      tag: 'R',
      type: 'video',
    },
    {
      id: 'rec-3',
      title: 'Matcha Rengō EP.1',
      tag: '🍵',
      type: 'video',
    },
    {
      id: 'rec-4',
      title: 'Criação do quadro inicial Start → End',
      tag: '🎬',
      type: 'video',
    },
    {
      id: 'rec-5',
      title: 'Pedido de plano de aula imersivo...',
      tag: '📚',
      type: 'video',
    },
  ]

  const displayRecents =
    recentCreations.length > 0
      ? recentCreations.slice(0, 5).map((c) => ({
          id: c.id,
          title: c.title || c.prompt,
          tag: c.type === 'video' ? 'R' : c.type === 'image' ? 'I' : 'A',
          type: c.type,
          raw: c,
        }))
      : defaultRecents

  return (
    <aside
      className={`w-64 shrink-0 flex flex-col bg-card/95 border-r border-border/80 h-full select-none ${className}`}
    >
      {/* Topo: Título / Logo */}
      <div className="p-4 pb-3 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-black text-xs shadow-xs">
            MV
          </div>
          <span className="font-extrabold text-sm tracking-tight text-foreground font-heading">
            Estúdio de mídia de IA
          </span>
        </div>
      </div>

      {/* Botão de Destaque: + Novo canvas */}
      <div className="p-3">
        <Button
          onClick={onNewCanvas}
          className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 text-xs h-9"
        >
          <Plus className="w-4 h-4" />
          Novo canvas
        </Button>

        <div className="space-y-1.5 mt-2">
          {onOpenSecondBrain && (
            <Button
              variant="default"
              onClick={onOpenSecondBrain}
              className="w-full justify-start gap-2 text-xs h-8 font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Segundo Cérebro
            </Button>
          )}

          {onOpenCollaborationModal && (
            <Button
              variant="outline"
              onClick={onOpenCollaborationModal}
              className="w-full justify-start gap-2 text-xs h-8 font-medium border-primary/20 text-foreground hover:bg-primary/10 hover:text-primary"
            >
              <FolderKanban className="w-3.5 h-3.5 text-primary" />
              Colaboração em Projeto
            </Button>
          )}

          {onOpenVersionHistoryModal && (
            <Button
              variant="outline"
              onClick={onOpenVersionHistoryModal}
              className="w-full justify-start gap-2 text-xs h-8 font-medium border-primary/20 text-foreground hover:bg-primary/10 hover:text-primary"
            >
              <Video className="w-3.5 h-3.5 text-purple-600" />
              Histórico de Versões
            </Button>
          )}
        </div>
      </div>
      {/* Menu Principal */}
      <nav className="px-3 py-1 space-y-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => onSelectSection('inicio')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
            activeSection === 'inicio'
              ? 'bg-muted text-foreground font-semibold shadow-2xs'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          }`}
        >
          <Home className="w-4 h-4 text-foreground/80" />
          <span>Início</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection('projetos')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
            activeSection === 'projetos'
              ? 'bg-muted text-foreground font-semibold shadow-2xs'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          }`}
        >
          <FolderKanban className="w-4 h-4 text-muted-foreground" />
          <span>Projetos</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection('habilidades')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
            activeSection === 'habilidades'
              ? 'bg-muted text-foreground font-semibold shadow-2xs'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          }`}
        >
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <span>Habilidades</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection('estilos')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
            activeSection === 'estilos'
              ? 'bg-muted text-foreground font-semibold shadow-2xs'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          }`}
        >
          <Palette className="w-4 h-4 text-muted-foreground" />
          <span>Estilos</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection('ajuda')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
            activeSection === 'ajuda'
              ? 'bg-muted text-foreground font-semibold shadow-2xs'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
          <span>Central de Ajuda</span>
        </button>
      </nav>

      {/* Divisor */}
      <div className="my-2 border-t border-border/50 mx-3" />

      {/* Seção Recentes & Histórico */}
      <div className="flex-1 px-3 overflow-y-auto space-y-2">
        {onOpenHistoryModal && (
          <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Histórico de Prompts
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Reutilize prompts anteriores com 1 clique no Studio.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenHistoryModal}
              className="w-full h-7 text-[11px] font-semibold gap-1 text-primary hover:text-primary"
            >
              Abrir Histórico
            </Button>
          </div>
        )}
        <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Recentes
        </div>

        <div className="space-y-0.5">
          {displayRecents.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if ('raw' in item && item.raw && onSelectRecent) {
                  onSelectRecent(item.raw as StudioCreationRecord)
                }
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors group"
            >
              <span className="w-5 h-5 rounded flex items-center justify-center bg-muted text-[11px] font-bold text-foreground/80 shrink-0">
                {item.tag}
              </span>
              <span className="truncate flex-1 font-normal group-hover:font-medium">
                {item.title}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onViewAllRecents}
          className="w-full flex items-center gap-1 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group pt-2"
        >
          <span>Ver tudo</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Rodapé: Usuário & Configurações */}
      <div className="p-3 border-t border-border/60 bg-muted/20">
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-muted/60 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="w-8 h-8 rounded-full border border-border">
              <AvatarImage src="https://img.usecurling.com/ppl/medium?gender=male&seed=42" />
              <AvatarFallback className="bg-neutral-800 text-white font-bold text-xs">
                RB
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">{userName}</p>
              {userEmail && (
                <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            title="Configurações e Assinatura"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
export default StudioSidebar
