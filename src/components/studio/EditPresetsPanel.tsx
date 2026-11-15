import React, { useEffect, useRef, useState } from 'react'
import {
  Bookmark,
  BookmarkPlus,
  CheckSquare,
  Download,
  Loader2,
  Package,
  Square,
  Trash2,
  Upload,
  WandSparkles,
} from 'lucide-react'
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
import {
  downloadPresetFile,
  downloadPresetsBundleFile,
  parsePresetFile,
  parsePresetsBundleFile,
  pickPresetFile,
} from '@/lib/preset-file'
import { askExportAdvisor, type ExportAdvisorResult } from '@/services/export-advisor'

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
  const [importing, setImporting] = useState(false)
  const [name, setName] = useState('')
  const [adviceFor, setAdviceFor] = useState<string | null>(null)
  const [adviceLoading, setAdviceLoading] = useState(false)
  const [advice, setAdvice] = useState<ExportAdvisorResult | null>(null)
  // Seleção múltipla (pedido 3): checkbox por preset + exportar em lote.
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [savingBundle, setSavingBundle] = useState(false)

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
    if (
      !settings ||
      typeof settings !== 'object' ||
      !(settings as AdvancedCustomizationState).primaryColor
    ) {
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
      setSelectedIds((prev) => prev.filter((sid) => sid !== id))
    } catch {
      toast({ title: 'Não foi possível excluir o preset', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  // Seleção múltipla (pedido 3)
  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]))
  }
  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.length === presets.length ? [] : presets.map((p) => p.id)))
  }

  // Exportar selecionados: UM único arquivo "midiaviva-presets" com todos
  const handleExportSelected = () => {
    const chosen = presets.filter((p) => selectedIds.includes(p.id))
    const valid = chosen.filter((p) => p.settings && p.settings.primaryColor)
    if (!valid.length) {
      toast({
        title: 'Nada para exportar',
        description: 'Selecione ao menos um preset válido com o checkbox.',
        variant: 'destructive',
      })
      return
    }
    downloadPresetsBundleFile(valid.map((p) => ({ name: p.name, settings: p.settings })))
    toast({
      title: `${valid.length} preset${valid.length > 1 ? 's' : ''} exportado${valid.length > 1 ? 's' : ''}!`,
      description: 'Arquivo único baixado — importe em outra conta/equipe.',
    })
  }

  // Importar (aceita 1 preset antigo OU o novo pacote com vários)
  const handleImport = async () => {
    const raw = await pickPresetFile()
    if (!raw) return
    const parsed = parsePresetsBundleFile(raw)
    if (!parsed.ok || !parsed.inputs.length) {
      toast({
        title: 'Arquivo de preset inválido',
        description: parsed.error,
        variant: 'destructive',
      })
      return
    }
    setSavingBundle(true)
    try {
      const created: StudioEditPreset[] = []
      for (const input of parsed.inputs) {
        try {
          created.push(await saveEditPreset(input.name, input.settings))
        } catch {
          // Falha isolada: continua com os demais.
        }
      }
      if (created.length) {
        setPresets((prev) => [...created, ...prev])
        setSelectedIds([])
      }
      const rejectedNote = parsed.rejected
        ? ` · ${parsed.rejected} entrada${parsed.rejected > 1 ? 's' : ''} rejeitada${parsed.rejected > 1 ? 's' : ''} na validação`
        : ''
      toast({
        title: `${created.length} de ${parsed.total} preset${parsed.total > 1 ? 's' : ''} importado${created.length > 1 ? 's' : ''}!`,
        description: `Clique em Aplicar para usar na arte aberta${rejectedNote}.`,
      })
    } finally {
      setSavingBundle(false)
    }
  }

  // IA: dicas do consultor de exportação ANTES de baixar o arquivo
  const handleAskAi = async (preset: StudioEditPreset) => {
    if (adviceFor === preset.id) {
      setAdviceFor(null)
      setAdvice(null)
      return
    }
    setAdviceFor(preset.id)
    setAdviceLoading(true)
    setAdvice(null)
    try {
      const res = await askExportAdvisor({
        network: 'Instagram',
        contentType: `preset "${preset.name}"`,
        settings: preset.settings,
      })
      setAdvice(res)
      if (!res.tips.length) {
        toast({
          title: 'Sem dicas agora',
          description: res.summary || 'Este preset já parece pronto para exportar.',
        })
      }
    } catch {
      toast({ title: 'Consultor de exportação indisponível', variant: 'destructive' })
    } finally {
      setAdviceLoading(false)
    }
  }

  // Exportar: baixa o preset como arquivo JSON "midiaviva-preset"
  const handleExport = (preset: StudioEditPreset) => {
    if (!preset.settings || !preset.settings.primaryColor) {
      toast({
        title: 'Preset vazio ou corrompido',
        description: 'Não foi possível exportar este preset.',
        variant: 'destructive',
      })
      return
    }
    downloadPresetFile(preset.name, preset.settings)
    toast({
      title: `Preset “${preset.name}” exportado`,
      description: 'Arquivo JSON baixado — importe em outra conta/equipe.',
    })
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-tight flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-purple-600" />
          Meus Presets de Edição
        </span>
        <div className="flex items-center gap-1">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleImport}
            disabled={savingBundle}
            className="h-7 px-2 text-[11px] font-bold gap-1 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
            title="Importar preset(s) de arquivo .json (aceita pacote com vários)"
          >
            {savingBundle ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Upload className="w-3 h-3" />
            )}
            Importar
          </Button>
        </div>
      </div>

      {/* Barra de seleção múltipla: aparece quando há presets */}
      {presets.length > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-muted/40 px-2 py-1.5">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400"
          >
            {selectedIds.length === presets.length ? (
              <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            Selecionar todos
          </button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportSelected}
            disabled={!selectedIds.length}
            className="h-7 px-2 text-[11px] font-bold gap-1 border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
            title="Baixa um único arquivo com todos os presets selecionados"
          >
            <Package className="w-3 h-3" />
            Exportar selecionados ({selectedIds.length})
          </Button>
        </div>
      )}

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
          className={
            'flex items-center gap-1.5 rounded-xl border px-2 py-1.5 ' +
            (selectedIds.includes(preset.id)
              ? 'border-purple-500/50 bg-purple-500/5'
              : 'border-border/60 bg-muted/20')
          }
        >
          <button
            type="button"
            onClick={() => toggleSelected(preset.id)}
            className="shrink-0 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400"
            title="Selecionar para exportar em lote"
          >
            {selectedIds.includes(preset.id) ? (
              <CheckSquare className="w-4 h-4 text-purple-600" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{preset.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {preset.updated ? new Date(preset.updated).toLocaleDateString('pt-BR') : ''}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAskAi(preset)}
            disabled={adviceLoading}
            className="h-7 px-2 text-[11px] font-bold gap-1 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
            title="Sugerir com IA: dicas antes de exportar"
          >
            {adviceLoading && adviceFor === preset.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <WandSparkles className="w-3 h-3" />
            )}
            Sugerir com IA
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleExport(preset)}
            className="h-7 px-1.5 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400"
            title="Exportar preset como arquivo JSON"
          >
            <Download className="w-3 h-3" />
          </Button>
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

      {/* Dicas do consultor de exportação (IA) — renderizadas antes de baixar */}
      {adviceFor && advice && (
        <div className="rounded-xl border border-purple-500/25 bg-purple-500/5 p-2 space-y-1">
          <p className="text-[11px] font-black uppercase tracking-tight text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
            <WandSparkles className="w-3.5 h-3.5" /> Sugestões para exportar
          </p>
          {advice.summary && (
            <p className="text-[10px] text-muted-foreground">
              {advice.summary}
              {advice.source === 'fallback' ? ' (modo offline)' : ''}
            </p>
          )}
          <ul className="space-y-0.5">
            {advice.tips.map((tip, i) => (
              <li key={i} className="text-[11px] text-foreground/90 flex gap-1">
                <span className="text-purple-500">•</span>
                {tip}
              </li>
            ))}
          </ul>
          {(advice.recommendedFormat || advice.recommendedRatio) && (
            <p className="text-[10px] text-muted-foreground">
              Recomendado: {advice.recommendedFormat}
              {advice.recommendedRatio ? ` · proporção ${advice.recommendedRatio}` : ''}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
export default EditPresetsPanel
