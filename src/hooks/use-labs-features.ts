import { useState, useEffect, useCallback } from 'react'
import {
  LAB_FEATURES,
  getLabsFeatureState,
  setLabFeatureEnabled,
  setAllLabFeaturesEnabled,
  isLabFeatureEnabled,
  type LabFeature,
} from '@/services/labs-features'

export function useLabsFeatures() {
  const [featureStates, setFeatureStates] = useState<Record<string, boolean>>(getLabsFeatureState)

  useEffect(() => {
    const handleStateChange = (event: Event) => {
      const custom = event as CustomEvent
      if (custom.detail?.state) {
        setFeatureStates(custom.detail.state)
      } else {
        setFeatureStates(getLabsFeatureState())
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'midiaviva_labs_features_state') {
        setFeatureStates(getLabsFeatureState())
      }
    }

    window.addEventListener('midiaviva_labs_state_changed', handleStateChange)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('midiaviva_labs_state_changed', handleStateChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const toggleFeature = useCallback((featureId: string) => {
    setFeatureStates((prev) => {
      const current = prev[featureId] ?? true
      const next = !current
      return setLabFeatureEnabled(featureId, next)
    })
  }, [])

  const setFeature = useCallback((featureId: string, enabled: boolean) => {
    setFeatureStates(() => setLabFeatureEnabled(featureId, enabled))
  }, [])

  const enableAll = useCallback(() => {
    setFeatureStates(() => setAllLabFeaturesEnabled(true))
  }, [])

  const disableAll = useCallback(() => {
    setFeatureStates(() => setAllLabFeaturesEnabled(false))
  }, [])

  const activeCount = Object.values(featureStates).filter(Boolean).length
  const totalCount = LAB_FEATURES.length

  return {
    features: LAB_FEATURES,
    featureStates,
    isEnabled: (id: string) => featureStates[id] ?? true,
    toggleFeature,
    setFeature,
    enableAll,
    disableAll,
    activeCount,
    totalCount,
  }
}

export { isLabFeatureEnabled }
