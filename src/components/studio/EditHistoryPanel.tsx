import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bot,
  GitCompareArrows,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  WandSparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { AdvancedCustomizationState } from '@/components/workspace/AdvancedCustomizationPanel'
import {
  listEditVersions,
  type StudioEditVersionRecord,
  type TextLayer,
} from '@/services/studio-edit-versions'
import type { CompareVersionEntry } from './CompareVersionsDialog'
import { askEditAssistant } from '@/services/edit-assistant'
import { CompareVersionsDialog } from './CompareVersionsDialog'

interface EditHistoryPanelProps {
  targetKey: string
  title: string
  current: AdvancedCustomizationState
  /** Aplica o snapshot da versão escolhida (restaurar). */
  onRestore: (next: AdvancedCustomizationState) => void
  network?: string
  /** Muda quando o dialog salva uma versão nova — força reload da lista. */
  refreshKey?: number
  /** Imagem base do estado atual (rasteriza o lado "atual" do comparador). */
  currentImageUrl?: string | null
  /** Camadas de texto do estado atual (rasterização do lado "atual"). */
  currentTextLayers?: TextLayer[] | null
  /** Proporção atual do editor. */
  currentAspectRatio?: string
}

/**
 * Histórico de edições (coleção studio_edit_versions — migration 0103):
 * lista as versões salvas da mídia/post aberto e permite restaurar.
 * Embutido no StudioAdvancedEditorDialog, ao lado dos presets.
 */
export const EditHistoryPanel: React.FC<EditHistoryPanelProps> = ({
  targetKey,
  title,
  current,
  onRestore,
  network,
  refreshKey = 0,
  currentImageUrl,
  currentTextLayers,
  currentAspectRatio,
}) => {
  const { toast } = useToast()
  const [versions, setVersions] = useState<StudioEditVersionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)

  const refresh = useCallback(async () => {
    if (!targetKey) return
    setLoading(true)
    try {
      const list = await listEditVersions(targetKey)
      setVersions(list)
    } catch {
      setVersions([]) // coleção indisponível: histórico fica vazio sem quebrar
    } finally {
      setLoading(false)
    }
  }, [targetKey])

  useEffect(() => {
    refresh()
  }, [refresh, refreshKey])

  /** Registros do histórico convertidos para o formato que o dialog espera. */
  const compareEntries: CompareVersionEntry[] = useMemo(
    () =>
      versions.map((v) => ({
        id: v.id,
        version_label: v.title || `Versão de ${new Date(v.created).toLocaleString('pt-BR')}`,
        editor_name: v.user_name || undefined,
        settings: (v.settings ?? null) as unknown as Record<string, unknown> | null,
        // Prévia rasterizada de cada versão (fio solto: sem isso só placeholder)
        image_url: v.preview_url || v.result_url || null,
        text_layers: v.text_layers,
        aspect_ratio: v.aspect_ratio || undefined,
        created: v.created,
      })),
    [versions],
  )

  const handleRestore = async (version: StudioEditVersionRecord) => {
    if (!version.settings) {
      toast({
        title: 'Versão sem ajustes salvos',
        description: 'Este snapshot não traz um estado aplicável.',
        variant: 'destructive',
      })
      return
    }
    setRestoringId(version.id)
    try {
      onRestore(version.settings)
      toast({
        title: 'Versão restaurada',
        description: `Estado de ${version.user_name || 'você'} em ${new Date(version.created).toLocaleString('pt-BR')} aplicado à arte.`,
      })
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-tight flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-primary" />
          Histórico de Edições
        </span>
        <div className="flex items-center gap-1">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          {versions.length >= 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCompareOpen(true)}
              className="h-7 px-1.5 text-muted-foreground hover:text-primary"
              title="Comparar versões lado a lado"
            >
              <GitCompareArrows className="w-3 h-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={refresh}
            className="h-7 px-1.5 text-muted-foreground hover:text-primary"
            title="Atualizar histórico"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {versions.length === 0 && !loading && (
        <p className="text-[11px] text-muted-foreground">
          Nenhuma versão ainda. Cada salvamento da Edição Avançada desta mídia cria uma versão
          restaurável aqui.
        </p>
      )}

      {versions.map((version) => (
        <div
          key={version.id}
          className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/20 px-2 py-1.5"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">
              {version.user_name || 'Você'}
              <span className="ml-1 font-normal text-muted-foreground">
                {new Date(version.created).toLocaleString('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </span>
            </p>
            {version.title && (
              <p className="text-[10px] text-muted-foreground truncate">{version.title}</p>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleRestore(version)}
            disabled={restoringId === version.id}
            className="h-7 px-2 text-[11px] font-bold gap-1 text-primary hover:bg-primary/10"
            title="Restaurar esta versão"
          >
            {restoringId === version.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RotateCcw className="w-3 h-3" />
            )}
            Restaurar
          </Button>
        </div>
      ))}

      <EditAssistantBlock current={current} title={title} network={network} onApply={onRestore} />

      <CompareVersionsDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        versions={compareEntries}
        currentSettings={current as unknown as Record<string, unknown>}
        currentImageUrl={currentImageUrl || null}
        currentTextLayers={currentTextLayers || null}
        currentAspectRatio={currentAspectRatio}
      />
    </div>
  )
}

/**
 * Bloco do agente nativo "edit-assistant-agent" (migration 0104): analisa o
 * estado atual da edição e sugere melhorias concretas, com aplicação em 1
 * clique. Fallback determinístico vem do hook (sempre há resposta).
 */
const EditAssistantBlock: React.FC<{
  current: AdvancedCustomizationState
  title: string
  network?: string
  onApply: (next: AdvancedCustomizationState) => void
}> = ({ current, title, network, onApply }) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [advice, setAdvice] = useState<string[]>([])
  const [suggested, setSuggested] = useState<Record<string, number> | null>(null)
  const [source, setSource] = useState<'agent' | 'fallback'>('agent')

  const ask = async () => {
    setLoading(true)
    setAdvice([])
    setSuggested(null)
    try {
      const res = await askEditAssistant({
        mediaTitle: title,
        network,
        settings: current,
      })
      setSummary(res.summary)
      setAdvice(res.advice)
      setSuggested(res.suggestedSettings)
      setSource(res.source)
      if (!res.advice.length) {
        toast({
          title: 'Sem sugestões agora',
          description: res.summary || 'Tente novamente em instantes.',
        })
      }
    } catch {
      toast({ title: 'Assistente indisponível', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const applySuggestion = () => {
    if (!suggested) return
    const merged: AdvancedCustomizationState = { ...current }
    for (const [key, value] of Object.entries(suggested)) {
      if (key in (merged as unknown as Record<string, unknown>)) {
        ;(merged as unknown as Record<string, number>)[key] = value
      }
    }
    onApply(merged)
    toast({ title: 'Sugestões do assistente aplicadas', description: summary })
  }

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-tight flex items-center gap-1.5 text-primary">
          <Bot className="w-3.5 h-3.5" />
          Assistente de Edição (IA)
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={ask}
          disabled={loading}
          className="h-7 px-2 text-[11px] font-bold gap-1 text-primary hover:bg-primary/10"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
          {loading ? 'Analisando…' : 'Sugerir melhorias'}
        </Button>
      </div>

      {advice.length > 0 && (
        <div className="space-y-1">
          {summary && (
            <p
              className={cn('text-[10px] text-muted-foreground', source === 'fallback' && 'italic')}
            >
              {summary}
            </p>
          )}
          <ul className="space-y-0.5">
            {advice.map((line, i) => (
              <li key={i} className="text-[11px] text-foreground/90 flex gap-1">
                <span className="text-primary">•</span>
                {line}
              </li>
            ))}
          </ul>
          {suggested && Object.keys(suggested).length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={applySuggestion}
              className="h-7 w-full text-[11px] font-bold gap-1 border-primary/40 text-primary hover:bg-primary/10"
            >
              <WandSparkles className="w-3 h-3" /> Aplicar sugestões
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default EditHistoryPanel
