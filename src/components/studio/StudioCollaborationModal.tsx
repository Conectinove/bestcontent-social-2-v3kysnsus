import React, { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Share2,
  Trash2,
  Layers,
  Copy,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import { pb } from '@/lib/pocketbase/client'
import {
  getStudioProjects,
  saveStudioProject,
  addCollaboratorToStudioProject,
  addCommentToStudioProject,
  type StudioProject,
} from '@/services/studio-collaboration'
import type { StudioMediaType } from '@/services/ai-studio'

interface StudioCollaborationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPrompt: string
  currentType: StudioMediaType
  currentModelId: string
  attachedAssets: any[]
  onLoadProjectToCanvas?: (project: StudioProject) => void
}

export const StudioCollaborationModal: React.FC<StudioCollaborationModalProps> = ({
  open,
  onOpenChange,
  currentPrompt,
  currentType,
  currentModelId,
  attachedAssets,
  onLoadProjectToCanvas,
}) => {
  const [projects, setProjects] = useState<StudioProject[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [collaboratorEmailOrName, setCollaboratorEmailOrName] = useState('')
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(false)

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0]

  const loadProjectsList = async () => {
    try {
      setLoading(true)
      const list = await getStudioProjects()
      setProjects(list)
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadProjectsList()
    }
  }, [open])

  const handleCreateProjectFromCurrentCanvas = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectTitle.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Dê um nome ao projeto para compartilhar com a equipe.',
        variant: 'destructive',
      })
      return
    }

    try {
      const created = await saveStudioProject({
        title: newProjectTitle.trim(),
        current_type: currentType,
        prompt: currentPrompt,
        model_id: currentModelId,
        attached_assets: attachedAssets,
        collaborator_names: ['Você (Criador)'],
        status: 'em_andamento',
      })

      setProjects((prev) => [created, ...prev])
      setSelectedProjectId(created.id)
      setNewProjectTitle('')
      toast({
        title: 'Projeto criado!',
        description: `"${created.title}" foi salvo e já pode receber colaboradores.`,
      })
    } catch {
      toast({
        title: 'Erro ao criar projeto',
        variant: 'destructive',
      })
    }
  }

  const handleInviteCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProject) return
    const name = collaboratorEmailOrName.trim()
    if (!name) return

    try {
      const pseudoId = `collab-${Date.now()}`
      await addCollaboratorToStudioProject(activeProject.id, pseudoId, name)
      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProject.id
            ? {
                ...p,
                collaborators: [...(p.collaborators || []), pseudoId],
                collaborator_names: [...(p.collaborator_names || []), name],
              }
            : p,
        ),
      )
      setCollaboratorEmailOrName('')
      toast({
        title: 'Colaborador adicionado!',
        description: `${name} agora tem acesso ao projeto "${activeProject.title}".`,
      })
    } catch {
      toast({
        title: 'Falha ao convidar',
        variant: 'destructive',
      })
    }
  }

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProject || !commentText.trim()) return

    const author = pb.authStore.record?.name || pb.authStore.record?.email || 'Membro da Equipe'

    try {
      const newComment = await addCommentToStudioProject(activeProject.id, {
        userName: author,
        text: commentText.trim(),
      })

      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProject.id ? { ...p, comments: [...(p.comments || []), newComment] } : p,
        ),
      )
      setCommentText('')
      toast({
        title: 'Comentário publicado!',
      })
    } catch {
      toast({
        title: 'Erro ao comentar',
        variant: 'destructive',
      })
    }
  }

  const handleLoadCanvas = () => {
    if (!activeProject) return
    if (onLoadProjectToCanvas) {
      onLoadProjectToCanvas(activeProject)
      toast({
        title: 'Canvas atualizado!',
        description: `Carregado o projeto "${activeProject.title}".`,
      })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card border-border/80 shadow-2xl p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Users className="w-4 h-4" />
              </div>
              <DialogTitle className="font-heading text-lg font-bold tracking-tight">
                Colaboração em Projetos do Studio
              </DialogTitle>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
              Equipe & Revisão
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Convide colegas para revisar e trabalhar juntos neste canvas. Colaboradores visualizam o
            projeto, dão feedback e acompanham a timeline de comentários.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Coluna Esquerda: Lista de Projetos e Criar Novo */}
          <div className="space-y-3 md:border-r md:pr-4 border-border/50">
            <div className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Projetos do Studio</span>
              <span className="text-[10px] text-muted-foreground font-mono">{projects.length}</span>
            </div>

            {/* Form criar projeto a partir do canvas atual */}
            <form
              onSubmit={handleCreateProjectFromCurrentCanvas}
              className="space-y-1.5 bg-muted/30 p-2.5 rounded-lg border border-border/50"
            >
              <span className="text-[11px] font-semibold text-foreground block">
                Salvar Canvas Atual como Projeto
              </span>
              <Input
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                placeholder="Nome do projeto..."
                className="h-7 text-xs"
              />
              <Button type="submit" size="sm" className="w-full h-7 text-[11px] font-bold">
                + Salvar e Compartilhar
              </Button>
            </form>

            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              {projects.map((proj) => {
                const isSelected = activeProject?.id === proj.id
                return (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => setSelectedProjectId(proj.id)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border/50 bg-background/50 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {proj.title}
                      </span>
                      <Badge className="text-[8px] uppercase px-1 py-0 bg-muted text-muted-foreground font-mono">
                        {proj.current_type}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {proj.collaborator_names?.length || 1} colaborador(es) •{' '}
                      {proj.comments?.length || 0} comentários
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Coluna Direita (2 cols): Detalhes do Projeto Ativo, Colaboradores e Comentários */}
          <div className="md:col-span-2 space-y-4">
            {activeProject ? (
              <>
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <h4 className="font-heading text-sm font-bold text-foreground">
                        {activeProject.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Tipo de mídia:{' '}
                        <span className="font-semibold text-foreground uppercase">
                          {activeProject.current_type}
                        </span>{' '}
                        • Modelo:{' '}
                        <span className="font-mono">{activeProject.model_id || 'Padrão'}</span>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs font-semibold gap-1 text-primary hover:text-primary"
                      onClick={handleLoadCanvas}
                    >
                      <Sparkles className="w-3 h-3" />
                      Abrir no Canvas
                    </Button>
                  </div>

                  {activeProject.prompt && (
                    <div className="text-[11px] bg-background/70 p-2 rounded-lg border border-border/40 text-muted-foreground italic line-clamp-2">
                      &ldquo;{activeProject.prompt}&rdquo;
                    </div>
                  )}

                  {/* Colaboradores Atuais */}
                  <div className="pt-2 border-t border-border/40 space-y-1.5">
                    <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                      <Users className="w-3 h-3 text-primary" /> Colaboradores com Acesso
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(activeProject.collaborator_names || ['Você (Criador)']).map(
                        (cName, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] gap-1 py-0.5">
                            <Avatar className="w-3.5 h-3.5">
                              <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                                {cName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {cName}
                          </Badge>
                        ),
                      )}
                    </div>

                    {/* Convidar novo colaborador */}
                    <form onSubmit={handleInviteCollaborator} className="flex gap-2 pt-1">
                      <Input
                        value={collaboratorEmailOrName}
                        onChange={(e) => setCollaboratorEmailOrName(e.target.value)}
                        placeholder="Nome ou e-mail do colaborador..."
                        className="h-7 text-xs flex-1"
                      />
                      <Button type="submit" size="sm" className="h-7 text-xs font-bold gap-1">
                        <UserPlus className="w-3 h-3" /> Convidar
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Timeline de Comentários */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    Timeline de Feedback e Comentários ({activeProject.comments?.length || 0})
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 bg-muted/10 p-2.5 rounded-lg border border-border/40">
                    {activeProject.comments && activeProject.comments.length > 0 ? (
                      activeProject.comments.map((comm) => (
                        <div
                          key={comm.id}
                          className="text-xs p-2 rounded bg-card border border-border/50 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="font-bold text-foreground">{comm.userName}</span>
                            <span>
                              {new Date(comm.created).toLocaleDateString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-foreground/90">{comm.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-[11px] text-muted-foreground">
                        Nenhum comentário ainda. Deixe a primeira mensagem para alinhar com a
                        equipe.
                      </div>
                    )}
                  </div>

                  {/* Input novo comentário */}
                  <form onSubmit={handleSendComment} className="flex gap-2">
                    <Input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Adicione um comentário ou feedback para a equipe..."
                      className="h-8 text-xs flex-1"
                    />
                    <Button type="submit" size="sm" className="h-8 text-xs font-bold gap-1">
                      <Send className="w-3 h-3" /> Enviar
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-xs text-muted-foreground border border-dashed rounded-xl p-6">
                Selecione ou crie um projeto para gerenciar colaboradores.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
