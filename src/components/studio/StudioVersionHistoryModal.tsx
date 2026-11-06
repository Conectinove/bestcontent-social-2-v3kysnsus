import React, { useState, useEffect } from 'react'
import {
  History,
  RotateCcw,
  Clock,
  User,
  Plus,
  GitCompare,
  FileCode,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ShieldCheck,
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
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import {
  listProjectVersions,
  createProjectVersion,
  restoreProjectVersion,
  type StudioProjectVersionRecord,
} from '@/services/studio-versions'
import { toast } from '@/hooks/use-toast'

interface StudioVersionHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: string
  projectTitle?: string
  currentSnapshot?: {
    prompt?: string
    activeTab?: string
    uploadedAssets?: any[]
    canvasSettings?: Record<string, any>
  }
  onRestoreSnapshot?: (snapshot: Record<string, any>, versionTitle: string) => void
}

export const StudioVersionHistoryModal: React.FC<StudioVersionHistoryModalProps> = ({
  open,
  onOpenChange,
  projectId = 'studio-current-project',
  projectTitle = 'Projeto Criativo do Studio',
  currentSnapshot,
  onRestoreSnapshot,
}) => {
  const { user } = useAuth()
  const [versions, setVersions] = useState<StudioProjectVersionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<StudioProjectVersionRecord | null>(null)
  const [compareVersion, setCompareVersion] = useState<StudioProjectVersionRecord | null>(null)
  const [isComparing, setIsComparing] = useState(false)

  // Criar nova versão
  const [isCreatingVersion, setIsCreatingVersion] = useState(false)
  const [newVersionTitle, setNewVersionTitle] = useState('')
  const [newVersionNotes, setNewVersionNotes] = useState('')
  const [savingVersion, setSavingVersion] = useState(false)

  // Carregar lista de versões
  const loadVersions = async () => {
    setLoading(true)
    try {
      const list = await listProjectVersions(projectId)
      setVersions(list)
      if (list.length > 0 && !selectedVersion) {
        setSelectedVersion(list[0])
      }
    } catch (err) {
      console.warn('Falha ao carregar versões do projeto:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadVersions()
    }
  }, [open, projectId])

  // Salvar snapshot atual como versão
  const handleCreateVersion = async () => {
    if (!newVersionTitle.trim()) {
      toast({
        title: 'Nome da versão obrigatório',
        description: 'Dê um nome para identificar este ponto na história (ex: Variação de gancho).',
        variant: 'destructive',
      })
      return
    }

    setSavingVersion(true)
    try {
      const created = await createProjectVersion({
        projectId,
        title: newVersionTitle.trim(),
        change_summary: newVersionNotes.trim(),
        changeNotes: newVersionNotes.trim(),
        snapshot: {
          title: projectTitle,
          description: newVersionNotes.trim(),
          current_type: (currentSnapshot?.activeTab as any) || 'video',
          prompt: currentSnapshot?.prompt || '',
          attached_assets: (currentSnapshot?.uploadedAssets || []).map((u, i) => ({
            id: `att-${i}`,
            name: `Asset ${i + 1}`,
            url: typeof u === 'string' ? u : u.url,
            type: typeof u === 'string' ? 'media' : u.type,
          })),
        },
        snapshotData: {
          prompt: currentSnapshot?.prompt || '',
          activeTab: currentSnapshot?.activeTab || 'video',
          uploadedAssets: currentSnapshot?.uploadedAssets || [],
          canvasSettings: currentSnapshot?.canvasSettings || {},
          savedAt: new Date().toISOString(),
        },
        author_id: user?.id,
        author_name: user?.name || user?.email || 'Criador',
        authorId: user?.id,
        authorName: user?.name || user?.email || 'Criador',
      })

      toast({
        title: 'Nova versão salva!',
        description: `Versão #${created.version_number} registrada no histórico com sucesso.`,
      })

      setNewVersionTitle('')
      setNewVersionNotes('')
      setIsCreatingVersion(false)
      await loadVersions()
      setSelectedVersion(created)
    } catch (err) {
      console.error('Falha ao salvar versão:', err)
      toast({
        title: 'Erro ao salvar versão',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingVersion(false)
    }
  }

  // Restaurar versão selecionada
  const handleRestore = async (version: StudioProjectVersionRecord) => {
    if (!onRestoreSnapshot) {
      toast({
        title: 'Ação não disponível',
        description: 'O manipulador de restauração não está ativo neste contexto.',
      })
      return
    }

    try {
      await restoreProjectVersion(version)
      // snapshot na interface StudioProjectVersion carrega { prompt, current_type, attached_assets, ... }
      const snapshotPayload: Record<string, any> = {
        prompt: version.snapshot?.prompt || '',
        activeTab:
          version.snapshot?.current_type || (version.snapshot as any)?.activeTab || 'video',
        uploadedAssets:
          version.snapshot?.attached_assets?.map((a) =>
            typeof a === 'string' ? a : a.url || a.name,
          ) ||
          (version.snapshot as any)?.uploadedAssets ||
          [],
        modelId: version.snapshot?.model_id,
        qualityTier: version.snapshot?.quality_tier,
        ...version.snapshot,
      }
      onRestoreSnapshot(snapshotPayload, version.title)
      toast({
        title: 'Versão restaurada!',
        description: `Projeto revertido com sucesso para a versão #${version.version_number} (${version.title}).`,
      })
      onOpenChange(false)
    } catch (err) {
      console.error('Falha ao restaurar:', err)
      toast({
        title: 'Erro ao restaurar',
        description: 'Não foi possível aplicar a versão anterior.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl border border-border bg-card shadow-2xl">
        {/* Cabeçalho */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600/10 text-purple-600 flex items-center justify-center shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black font-heading flex items-center gap-2">
                  <span>Histórico de Versões</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-purple-500/30 text-purple-600"
                  >
                    Versionamento
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground truncate max-w-sm sm:max-w-md">
                  {projectTitle} &middot; Registre marcos ou reverta alterações anteriores
                </DialogDescription>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setIsCreatingVersion((prev) => !prev)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 px-3 rounded-xl gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreatingVersion ? 'Cancelar Marco' : 'Salvar Versão Atual'}</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Formulário retrátil para criar nova versão */}
        {isCreatingVersion && (
          <div className="p-4 bg-purple-500/5 border-b border-purple-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-foreground">
                Salvar Marco / Snapshot do Canvas Atual
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Título da versão (ex: Prompt v2 com estilo Noir)"
                value={newVersionTitle}
                onChange={(e) => setNewVersionTitle(e.target.value)}
                className="text-xs h-9"
              />
              <Input
                placeholder="Notas da alteração (opcional, ex: removi assets antigos)"
                value={newVersionNotes}
                onChange={(e) => setNewVersionNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingVersion(false)}
                className="text-xs h-8"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleCreateVersion}
                disabled={savingVersion}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 px-3 gap-1.5"
              >
                {savingVersion ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Registrar Snapshot</span>
              </Button>
            </div>
          </div>
        )}

        {/* Corpo principal em grid: Lista à esquerda, Detalhes e Comparação à direita */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Coluna da esquerda: Lista cronológica de versões */}
          <div className="md:col-span-5 border-r border-border p-3 overflow-y-auto space-y-2 bg-muted/10 max-h-[420px] md:max-h-full">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground px-1 pb-1">
              <span>Linha do Tempo ({versions.length})</span>
              <span className="text-[10px] text-purple-600 font-semibold">
                Mais recente primeiro
              </span>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                <span>Carregando histórico...</span>
              </div>
            ) : versions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                <Clock className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p>Nenhuma versão registrada ainda.</p>
                <p className="text-[11px]">
                  Clique em "Salvar Versão Atual" para criar o primeiro marco.
                </p>
              </div>
            ) : (
              versions.map((v) => {
                const isSelected = selectedVersion?.id === v.id
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVersion(v)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-500/10 border-purple-500/50 shadow-xs'
                        : 'bg-card border-border/70 hover:border-border hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-black text-foreground flex items-center gap-1.5 truncate">
                        <span className="px-1.5 py-0.5 rounded-md bg-purple-600 text-white text-[10px]">
                          v{v.version_number}
                        </span>
                        <span className="truncate">{v.title}</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        {new Date(v.created).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {v.change_summary && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 italic mb-1.5">
                        "{v.change_summary}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                      <span className="flex items-center gap-1 truncate">
                        <User className="w-3 h-3" />
                        <span className="truncate">{v.author_name || 'Autor'}</span>
                      </span>
                      <span className="capitalize text-purple-600 font-semibold">
                        Aba: {v.snapshot?.current_type || (v.snapshot as any)?.activeTab || 'Geral'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Coluna da direita: Detalhes da versão selecionada & Comparação */}
          <div className="md:col-span-7 p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[460px] md:max-h-full">
            {selectedVersion ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-foreground">
                        v{selectedVersion.version_number} &middot; {selectedVersion.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-emerald-500/30 text-emerald-600"
                      >
                        Snapshot Válido
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Criado por {selectedVersion.author_name || 'Autor'} em{' '}
                      {new Date(selectedVersion.created).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <Button
                    onClick={() => handleRestore(selectedVersion)}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 px-3 rounded-xl gap-1.5 shadow-xs shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar Esta Versão</span>
                  </Button>
                </div>

                {selectedVersion.change_summary && (
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-xs">
                    <span className="font-bold text-foreground block mb-0.5">
                      Notas da Mudança:
                    </span>
                    <p className="text-muted-foreground">{selectedVersion.change_summary}</p>
                  </div>
                )}

                {/* Conteúdo do snapshot */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-purple-600" />
                    <span>Prompt no Snapshot:</span>
                  </span>
                  <div className="p-3 rounded-xl bg-card border border-border font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                    {selectedVersion.snapshot?.prompt || (
                      <span className="text-muted-foreground italic">
                        Nenhum texto de prompt registrado nesta versão.
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadados e Assets do Snapshot */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl border border-border bg-card">
                    <span className="text-muted-foreground text-[10px] block">
                      Aba / Tipo de Criação
                    </span>
                    <span className="font-bold text-foreground capitalize">
                      {selectedVersion.snapshot?.current_type ||
                        (selectedVersion.snapshot as any)?.activeTab ||
                        'Geral'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-border bg-card">
                    <span className="text-muted-foreground text-[10px] block">
                      Assets Vinculados
                    </span>
                    <span className="font-bold text-foreground">
                      {selectedVersion.snapshot?.attached_assets?.length ||
                        (selectedVersion.snapshot as any)?.uploadedAssets?.length ||
                        0}{' '}
                      anexo(s)
                    </span>
                  </div>
                </div>

                {/* Seletor de Comparação Rápida */}
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1">
                      <GitCompare className="w-3.5 h-3.5 text-purple-600" />
                      <span>Comparar com outra versão:</span>
                    </span>
                    {compareVersion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCompareVersion(null)}
                        className="text-[10px] h-6 px-2 text-muted-foreground"
                      >
                        Limpar Comparação
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    {versions
                      .filter((v) => v.id !== selectedVersion.id)
                      .map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setCompareVersion(v)}
                          className={`text-[10px] px-2 py-1 rounded-lg border font-semibold transition-all ${
                            compareVersion?.id === v.id
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-card text-muted-foreground border-border hover:bg-muted'
                          }`}
                        >
                          v{v.version_number} ({v.title.slice(0, 15)}...)
                        </button>
                      ))}
                  </div>

                  {compareVersion && (
                    <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/25 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-purple-700 dark:text-purple-300">
                        <span>
                          Comparando v{selectedVersion.version_number} vs v
                          {compareVersion.version_number}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-card border border-border">
                          <span className="font-bold block text-foreground">
                            v{selectedVersion.version_number}:
                          </span>
                          <p className="line-clamp-3 font-mono text-muted-foreground">
                            {selectedVersion.snapshot?.prompt || '(Vazio)'}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-card border border-border">
                          <span className="font-bold block text-foreground">
                            v{compareVersion.version_number}:
                          </span>
                          <p className="line-clamp-3 font-mono text-muted-foreground">
                            {compareVersion.snapshot?.prompt || '(Vazio)'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-muted-foreground">
                Selecione uma versão ao lado para inspecionar os detalhes e restaurar.
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com Dica e Selo de Confiabilidade */}
        <div className="p-3 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Snapshots salvos no PocketBase com redundância local segura.</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
export default StudioVersionHistoryModal
