import { useState, useCallback } from 'react'
import { toast } from '@/hooks/use-toast'

export type WidgetType =
  | 'assets'
  | 'templates'
  | 'content-draft'
  | 'metrics'
  | 'caption'
  | 'media'
  | 'schedule'
  | 'preview'

export const WIDGET_TITLES: Record<WidgetType, string> = {
  assets: 'Ativos',
  templates: 'Templates',
  'content-draft': 'Conteúdo',
  metrics: 'Métricas',
  caption: 'Legenda',
  media: 'Mídia',
  schedule: 'Agendamento',
  preview: 'Prévia',
}

export interface Preset {
  id: string
  name: string
  description: string
  leftWidgets: WidgetType[]
  rightWidgets: WidgetType[]
}

export const PRESETS: Preset[] = [
  {
    id: 'edicao',
    name: 'Modo Edição',
    description: 'Foco em criação de conteúdo',
    leftWidgets: ['assets', 'templates'],
    rightWidgets: ['caption', 'media', 'schedule'],
  },
  {
    id: 'gestao',
    name: 'Modo Gestão',
    description: 'Planejamento e revisão',
    leftWidgets: ['content-draft', 'metrics'],
    rightWidgets: ['schedule', 'preview'],
  },
  {
    id: 'analytics',
    name: 'Modo Analytics',
    description: 'Análise de dados',
    leftWidgets: ['metrics', 'preview'],
    rightWidgets: ['preview', 'schedule'],
  },
]

const STORAGE_KEY = 'bc-workspace-layout'
const FOCUS_KEY = 'bc-workspace-focus'

interface WorkspaceState {
  leftWidgets: WidgetType[]
  rightWidgets: WidgetType[]
  focusMode: boolean
  activePreset: string
}

function loadState(): WorkspaceState {
  const base: WorkspaceState = {
    leftWidgets: [...PRESETS[0].leftWidgets],
    rightWidgets: [...PRESETS[0].rightWidgets],
    focusMode: sessionStorage.getItem(FOCUS_KEY) === 'true',
    activePreset: 'edicao',
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...base, ...parsed, focusMode: base.focusMode }
    }
  } catch {
    /* intentionally ignored */
  }
  return base
}

function saveLayout(state: WorkspaceState) {
  try {
    const { focusMode: _, ...toSave } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    toast({
      title: 'Aviso',
      description: 'Não foi possível salvar o layout.',
      variant: 'destructive',
    })
  }
}

export function useWorkspace() {
  const [state, setState] = useState<WorkspaceState>(loadState)

  const reorderWidgets = useCallback(
    (sidebar: 'left' | 'right', fromIdx: number, toIdx: number) => {
      setState((prev) => {
        const key = sidebar === 'left' ? 'leftWidgets' : 'rightWidgets'
        const widgets = [...prev[key]]
        const [moved] = widgets.splice(fromIdx, 1)
        widgets.splice(toIdx, 0, moved)
        const next = { ...prev, [key]: widgets, activePreset: 'custom' }
        saveLayout(next)
        return next
      })
    },
    [],
  )

  const toggleFocusMode = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, focusMode: !prev.focusMode }
      try {
        sessionStorage.setItem(FOCUS_KEY, String(next.focusMode))
      } catch {
        /* intentionally ignored */
      }
      return next
    })
  }, [])

  const applyPreset = useCallback((presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    setState((prev) => {
      const next = {
        ...prev,
        leftWidgets: [...preset.leftWidgets],
        rightWidgets: [...preset.rightWidgets],
        activePreset: presetId,
      }
      saveLayout(next)
      return next
    })
  }, [])

  return {
    leftWidgets: state.leftWidgets,
    rightWidgets: state.rightWidgets,
    focusMode: state.focusMode,
    activePreset: state.activePreset,
    reorderWidgets,
    toggleFocusMode,
    applyPreset,
  }
}
