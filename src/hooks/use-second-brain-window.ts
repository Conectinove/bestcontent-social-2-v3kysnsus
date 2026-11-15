import { useCallback, useEffect, useState } from 'react'

export type SecondBrainWindowMode = 'normal' | 'maximized' | 'compact'

const WINDOW_MODE_KEY = 'midiaviva_second_brain_window_mode'

function readStoredMode(): SecondBrainWindowMode {
  try {
    const v = localStorage.getItem(WINDOW_MODE_KEY)
    if (v === 'maximized' || v === 'compact' || v === 'normal') return v
  } catch {
    /* localStorage indisponível — usa o padrão */
  }
  return 'normal'
}

/**
 * Modo de janela do painel do Segundo Cérebro (segue o padrão do Estúdio,
 * use-studio-window): normal / maximized / compact, persistido em localStorage.
 * Controla o tamanho do Dialog que hospeda o SecondBrainCanvas.
 */
export function useSecondBrainWindowMode() {
  const [mode, setModeState] = useState<SecondBrainWindowMode>(readStoredMode)

  useEffect(() => {
    try {
      localStorage.setItem(WINDOW_MODE_KEY, mode)
    } catch {
      /* localStorage indisponível — ignora */
    }
  }, [mode])

  const setMode = useCallback((next: SecondBrainWindowMode) => setModeState(next), [])

  return {
    windowMode: mode,
    setMode,
    isMaximized: mode === 'maximized',
    isCompact: mode === 'compact',
  }
}
