import { useState, useMemo } from 'react'
import {
  Building2,
  AlertTriangle,
  GitMerge,
  Edit2,
  Check,
  Star,
  Trash2,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useSocial } from '@/context/SocialContext'
import { updateBrand, deleteBrand, mergeDuplicateBrands } from '@/services/brands'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export interface OrganizationBrandManagerProps {
  onAddNewBrand?: () => void
}

export function OrganizationBrandManager({ onAddNewBrand }: OrganizationBrandManagerProps) {
  const { brands, selectedBrandId, setSelectedBrandId, fetchBrands } = useSocial()

  // Edição inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Mesclagem de duplicadas
  const [mergeModalOpen, setMergeModalOpen] = useState(false)
  const [activeDuplicateGroup, setActiveDuplicateGroup] = useState<{
    name: string
    brands: any[]
  } | null>(null)
  const [selectedPrimaryId, setSelectedPrimaryId] = useState<string>('')
  const [isMerging, setIsMerging] = useState(false)

  // Confirmação de exclusão individual
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 1. Detectar grupos de duplicadas por nome (case insensitive, trim)
  const duplicateGroups = useMemo(() => {
    const groups: Record<string, any[]> = {}
    brands.forEach((b: any) => {
      const normalized = (b.name || '').trim().toLowerCase()
      if (!normalized) return
      if (!groups[normalized]) {
        groups[normalized] = []
      }
      groups[normalized].push(b)
    })

    return Object.entries(groups)
      .filter(([_, list]) => list.length > 1)
      .map(([_, list]) => ({
        name: list[0].name,
        brands: list,
      }))
  }, [brands])

  const totalDuplicatesCount = useMemo(() => {
    return duplicateGroups.reduce((acc, g) => acc + (g.brands.length - 1), 0)
  }, [duplicateGroups])

  // Iniciar edição inline
  const handleStartEdit = (brand: any) => {
    setEditingId(brand.id)
    setEditName(brand.name || '')
    setEditDesc(brand.description || '')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditDesc('')
  }

  const handleSaveEdit = async (brandId: string) => {
    if (!editName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'A marca precisa ter um nome válido.',
        variant: 'destructive',
      })
      return
    }

    setSavingEdit(true)
    try {
      await updateBrand(brandId, {
        name: editName.trim(),
        description: editDesc.trim(),
      })
      await fetchBrands?.()
      setEditingId(null)
      toast({
        title: 'Marca atualizada!',
        description: `Informações de "${editName}" foram salvas.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Não foi possível salvar alterações.',
        variant: 'destructive',
      })
    } finally {
      setSavingEdit(false)
    }
  }

  // Marcar como ativa / principal
  const handleSetActiveBrand = (brandId: string) => {
    setSelectedBrandId(brandId)
    const brand = brands.find((b: any) => b.id === brandId)
    toast({
      title: 'Marca Ativa Selecionada',
      description: `"${brand?.name || 'Marca'}" é agora a principal na sua área de trabalho.`,
    })
  }

  // Iniciar fluxo de mesclagem para um grupo
  const handleOpenMergeModal = (group: { name: string; brands: any[] }) => {
    setActiveDuplicateGroup(group)
    // Escolhe a que tem mais dados ou a primeira como sugestão
    const bestCandidate =
      group.brands.find((b) => b.id === selectedBrandId) ||
      group.brands.find((b) => b.description && b.description.length > 30) ||
      group.brands[0]
    setSelectedPrimaryId(bestCandidate?.id || group.brands[0].id)
    setMergeModalOpen(true)
  }

  // Ação rápida: abrir a primeira duplicação encontrada
  const handleQuickMergeFirst = () => {
    if (duplicateGroups.length > 0) {
      handleOpenMergeModal(duplicateGroups[0])
    }
  }

  // Executar mesclagem
  const handleExecuteMerge = async () => {
    if (!activeDuplicateGroup || !selectedPrimaryId) return
    setIsMerging(true)
    try {
      const duplicateIds = activeDuplicateGroup.brands
        .map((b) => b.id)
        .filter((id) => id !== selectedPrimaryId)

      const result = await mergeDuplicateBrands(selectedPrimaryId, duplicateIds)

      // Garantir que a marca ativa é a principal mantida
      setSelectedBrandId(selectedPrimaryId)
      await fetchBrands?.()

      setMergeModalOpen(false)
      setActiveDuplicateGroup(null)

      toast({
        title: 'Marcas mescladas com sucesso!',
        description: `${result.deletedBrandsCount} marca(s) duplicada(s) foram unificadas. ${result.reassignedPosts} post(s) e ${result.reassignedMaterials} material(is) foram reatribuídos para a marca principal.`,
      })
    } catch (err: any) {
      toast({
        title: 'Falha na mesclagem',
        description: err?.message || 'Não foi possível mesclar as marcas.',
        variant: 'destructive',
      })
    } finally {
      setIsMerging(false)
    }
  }

  // Exclusão individual
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteBrand(deleteTarget.id)
      await fetchBrands?.()
      toast({
        title: 'Marca removida',
        description: `"${deleteTarget.name}" foi excluída com sucesso.`,
      })
      setDeleteTarget(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao remover',
        description: err?.message || 'Não foi possível excluir a marca.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Banner de Duplicadas Detectadas */}
      {duplicateGroups.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 dark:text-amber-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm sm:text-base text-foreground">
                  Marcas Duplicadas Detectadas ({duplicateGroups.length} grupo(s),{' '}
                  {totalDuplicatesCount + duplicateGroups.length} marcas)
                </h4>
                <Badge className="bg-amber-600 text-white text-[10px] uppercase font-bold">
                  Ação Recomendada
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                Você tem{' '}
                {duplicateGroups
                  .map((g) => `${g.brands.length} marcas com o nome "${g.name}"`)
                  .join(', ')}
                . Recomendamos mesclar para unificar posts, identidades e materiais em uma única
                marca oficial, evitando confusão no workspace.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0 w-full md:w-auto">
            <Button
              type="button"
              onClick={handleQuickMergeFirst}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl h-10 px-4 gap-2 w-full md:w-auto shadow-xs min-h-[44px]"
            >
              <GitMerge className="w-4 h-4" />
              <span>Mesclar Duplicadas Agora</span>
            </Button>
          </div>
        </div>
      )}

      {/* Header com resumo e CTA de adicionar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-foreground">
              Minha Organização — Gestão de Marcas
            </h3>
            <p className="text-xs text-muted-foreground">
              {brands.length} marca(s) cadastrada(s) · Edite inline, defina a principal ou mescle
              repetições
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchBrands?.()}
            className="rounded-xl text-xs h-9 gap-1.5 min-h-[38px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </Button>

          {onAddNewBrand && (
            <Button
              type="button"
              onClick={onAddNewBrand}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl h-9 px-3.5 gap-1.5 shadow-xs min-h-[38px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Marca</span>
            </Button>
          )}
        </div>
      </div>

      {/* Lista de Marcas com edição inline e marca ativa */}
      <div className="grid grid-cols-1 gap-3.5">
        {brands.map((b: any) => {
          const isActive = selectedBrandId === b.id || (!selectedBrandId && brands[0]?.id === b.id)
          const isEditing = editingId === b.id
          const hasDuplicates = duplicateGroups.some(
            (g) =>
              g.name.toLowerCase() === (b.name || '').trim().toLowerCase() && g.brands.length > 1,
          )

          return (
            <Card
              key={b.id}
              className={cn(
                'rounded-2xl transition-all border overflow-hidden',
                isActive
                  ? 'border-purple-500/80 bg-purple-500/5 ring-1 ring-purple-500/20'
                  : 'border-border/80 bg-card hover:border-border',
              )}
            >
              <CardContent className="p-4 sm:p-5">
                {isEditing ? (
                  /* Modo Edição Inline */
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5" /> Editando Marca
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        ID: {b.id}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Nome da Marca</label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nome da marca"
                        className="text-xs h-9 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        Descrição & Posicionamento
                      </label>
                      <Textarea
                        rows={2}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Descrição, segmento ou diferenciais..."
                        className="text-xs rounded-xl"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={savingEdit}
                        className="text-xs rounded-xl h-8"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveEdit(b.id)}
                        disabled={savingEdit}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl h-8 px-3 gap-1.5"
                      >
                        {savingEdit ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Salvar</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Modo Visualização Normal */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Avatar / Ícone da marca */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-xs border border-white/20"
                        style={{ backgroundColor: b.color_theme || '#7C3AED' }}
                      >
                        {b.logo ? (
                          <img
                            src={b.logo}
                            alt={b.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <span>{(b.name || 'M').slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm sm:text-base text-foreground leading-snug">
                            {b.name}
                          </h4>

                          {isActive && (
                            <Badge className="bg-purple-600 text-white text-[10px] font-black uppercase px-2 py-0.5 gap-1">
                              <Star className="w-3 h-3 fill-white" /> Marca Ativa
                            </Badge>
                          )}

                          {hasDuplicates && (
                            <Badge
                              variant="outline"
                              className="border-amber-500/50 text-amber-700 dark:text-amber-300 bg-amber-500/10 text-[10px] font-bold"
                            >
                              Duplicada detectada
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {b.description || 'Sem descrição cadastrada.'}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
                          {b.website && (
                            <a
                              href={
                                b.website.startsWith('http') ? b.website : `https://${b.website}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
                            >
                              <span>{b.website.replace(/^https?:\/\//, '')}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <span className="font-mono text-[10px] text-muted-foreground/70">
                            ID: {b.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações da Marca */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                      {!isActive && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetActiveBrand(b.id)}
                          className="rounded-xl text-xs h-9 px-3 font-semibold gap-1.5 min-h-[44px]"
                          title="Tornar esta a marca principal no workspace"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500" />
                          <span>Tornar Ativa</span>
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(b)}
                        className="rounded-xl text-xs h-9 px-2.5 text-muted-foreground hover:text-foreground gap-1.5 min-h-[44px]"
                        title="Editar nome e descrição inline"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </Button>

                      {hasDuplicates && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const grp = duplicateGroups.find(
                              (g) => g.name.toLowerCase() === (b.name || '').trim().toLowerCase(),
                            )
                            if (grp) handleOpenMergeModal(grp)
                          }}
                          className="rounded-xl text-xs h-9 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 min-h-[44px]"
                          title="Mesclar duplicadas deste grupo"
                        >
                          <GitMerge className="w-3.5 h-3.5" />
                          <span>Mesclar</span>
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(b)}
                        className="rounded-xl h-9 w-9 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 min-h-[44px] min-w-[44px]"
                        title="Excluir marca"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {brands.length === 0 && (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card/50">
            <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-foreground">Nenhuma marca cadastrada ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              Adicione a primeira marca para gerenciar posts e identidades visuais.
            </p>
          </div>
        )}
      </div>

      {/* MODAL DE MESCLAR MARCAS (DEDUPLICAÇÃO) */}
      <Dialog open={mergeModalOpen} onOpenChange={setMergeModalOpen}>
        <DialogContent className="max-w-xl p-6 rounded-3xl bg-card border border-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-border/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                <GitMerge className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground">
                  Mesclar Marcas Duplicadas
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Grupo: <strong className="text-foreground">"{activeDuplicateGroup?.name}"</strong>{' '}
                  ({activeDuplicateGroup?.brands.length} marcas encontradas)
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-950 dark:text-purple-100 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-foreground">Como funciona a unificação segura:</p>
                <p className="text-muted-foreground leading-relaxed">
                  1. Você escolhe qual cópia manter como a <strong>Marca Oficial</strong>.<br />
                  2. Todos os posts, ideias, templates e assets das outras marcas serão{' '}
                  <strong>reatribuídos</strong> para ela.
                  <br />
                  3. As cópias redundantes serão removidas sem perda de conteúdo.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-foreground block">
                Escolha a marca principal que será mantida:
              </label>

              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {activeDuplicateGroup?.brands.map((b) => {
                  const isChosen = selectedPrimaryId === b.id
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedPrimaryId(b.id)}
                      className={cn(
                        'p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3',
                        isChosen
                          ? 'border-purple-600 bg-purple-500/10 ring-2 ring-purple-600/30'
                          : 'border-border/80 bg-card hover:border-purple-400/50',
                      )}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5"
                          style={{ backgroundColor: b.color_theme || '#7C3AED' }}
                        >
                          {(b.name || 'M').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{b.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              ID: {b.id}
                            </span>
                            {selectedBrandId === b.id && (
                              <Badge className="bg-purple-600 text-white text-[9px]">
                                Ativa atual
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                            {b.description || 'Sem descrição cadastrada'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full border border-border mt-1">
                        {isChosen && <div className="w-3 h-3 rounded-full bg-purple-600" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border/80 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMergeModalOpen(false)}
              disabled={isMerging}
              className="text-xs rounded-xl h-9"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExecuteMerge}
              disabled={isMerging || !selectedPrimaryId}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl h-9 px-4 gap-1.5 shadow-xs min-h-[44px]"
            >
              {isMerging ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Unificando conteúdos...</span>
                </>
              ) : (
                <>
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>Confirmar & Mesclar</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO INDIVIDUAL */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm p-5 rounded-3xl bg-card border border-border shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Excluir Marca?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Tem certeza que deseja excluir a marca{' '}
              <strong className="text-foreground">"{deleteTarget?.name}"</strong>? Se esta marca for
              duplicada, recomendamos usar a opção <strong>Mesclar</strong> para não perder posts ou
              materiais.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="text-xs rounded-xl h-9"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 px-3.5 min-h-[44px]"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'Excluir Definitivamente'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default OrganizationBrandManager
