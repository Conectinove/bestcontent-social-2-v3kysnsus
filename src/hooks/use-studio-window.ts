import { useCallback, useEffect, useState } from 'react'

export type StudioWindowMode = 'normal' | 'maximized' | 'compact'

const WINDOW_MODE_KEY = 'midiaviva_studio_window_mode'

function readStoredMode(): StudioWindowMode {
  try {
    const v = localStorage.getItem(WINDOW_MODE_KEY)
    if (v === 'maximized' || v === 'compact' || v === 'normal') return v
  } catch {
    /* intentionally ignored */
  }
  return 'normal'
}

/**
 * Modo de janela do Estúdio:
 * - normal: layout padrão (sidebar + conteúdo)
 * - maximized: canvas ocupa toda a área útil (sidebar oculta)
 * - compact: painéis colapsados e canvas centrado menor
 * Escolha persistida em localStorage.
 */
export function useStudioWindowMode() {
  const [mode, setModeState] = useState<StudioWindowMode>(readStoredMode)

  useEffect(() => {
    try {
      localStorage.setItem(WINDOW_MODE_KEY, mode)
    } catch {
      /* intentionally ignored */
    }
  }, [mode])

  const setMode = useCallback((next: StudioWindowMode) => setModeState(next), [])

  return {
    windowMode: mode,
    setMode,
    isMaximized: mode === 'maximized',
    isCompact: mode === 'compact',
  }
}
