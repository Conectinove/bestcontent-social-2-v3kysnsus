import React, { useEffect, useState } from 'react'
import { Bookmark, BookmarkPlus, Loader2, Trash2, WandSparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import type { AdvancedCustomizationState } from '@/components/workspace/AdvancedCustomizationPanel'
import {
  listEditPresets,
  saveEditPreset,
  deleteEditPreset,
  type StudioEditPreset,
} from '@/services/studio-edit-presets'

interface EditPresetsPanelProps {
  /** Estado atual da customização — é o que será salvo no preset. */
  current: AdvancedCustomizationState
  /** Aplica o settings do preset escolhido (substitui o estado atual). */
  onApply: (next: AdvancedCustomizationState) => void
}

/**
 * Presets de edição avançada nomeados e salvos por usuário
 * (coleção studio_edit_presets — migration 0101).
 * Fallback gracioso: se a coleção falhar, o painel avisa e continua funcionando.
 */
export const EditPresetsPanel: React.FC<EditPresetsPanelProps> = ({ current, onApply }) => {
  const { toast } = useToast()
  const [presets, setPresets] = useState<StudioEditPreset[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [name, setName] = useState('')

  const refresh = async () => {
    setLoading(true)
    try {
      const list = await listEditPresets()
      setPresets(list)
    } catch {
      // Coleção indisponível (offline/regra): painel fica vazio sem quebrar.
      setPresets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    const clean = name.trim()
    if (!clean) {
      toast({ title: 'Dê um nome ao preset', description: 'Ex.: “Dark Vendas”, “Clean Story”…' })
      return
    }
    setSaving(true)
    try {
      const created = await saveEditPreset(clean, current)
      setPresets((prev) => [created, ...prev])
      setName('')
      toast({
        title: `Preset “${created.name}” salvo!`,
        description: 'Aplique em qualquer arte depois.',
      })
    } catch {
      toast({
        title: 'Não foi possível salvar o preset',
        description: 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleApply = (preset: StudioEditPreset) => {
    const settings = preset.settings
    if (!settings || typeof settings !== 'object' || !settings.primaryColor) {
      toast({
        title: 'Preset vazio ou corrompido',
        description: 'Não foi possível aplicar este preset.',
        variant: 'destructive',
      })
      return
    }
    onApply(settings)
    toast({ title: `Preset “${preset.name}” aplicado` })
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteEditPreset(id)
      setPresets((prev) => prev.filter((p) => p.id !== id))
    } catch {
      toast({ title: 'Não foi possível excluir o preset', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-tight flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-purple-600" />
          Meus Presets de Edição
        </span>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
      </div>

      {/* Salvar preset atual */}
      <div className="flex gap-1.5">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
          }}
          placeholder="Nome do preset (ex.: Dark Vendas)"
          className="h-8 text-xs"
          maxLength={120}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={saving}
          className="h-8 px-2.5 text-xs gap-1 shrink-0 border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <BookmarkPlus className="w-3.5 h-3.5" />
          )}
          Salvar
        </Button>
      </div>

      {/* Lista de presets salvos */}
      {presets.length === 0 && !loading && (
        <p className="text-[11px] text-muted-foreground">
          Nenhum preset salvo ainda. Ajuste a arte e salve a combinação com um nome.
        </p>
      )}

      {presets.map((preset) => (
        <div
          key={preset.id}
          className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/20 px-2 py-1.5"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{preset.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {preset.updated ? new Date(preset.updated).toLocaleDateString('pt-BR') : ''}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleApply(preset)}
            className="h-7 px-2 text-[11px] font-bold gap-1 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
          >
            <WandSparkles className="w-3 h-3" /> Aplicar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(preset.id)}
            disabled={deletingId === preset.id}
            className="h-7 px-1.5 text-destructive hover:text-destructive"
            title="Excluir preset"
          >
            {deletingId === preset.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      ))}
    </div>
  )
}
export default EditPresetsPanel
