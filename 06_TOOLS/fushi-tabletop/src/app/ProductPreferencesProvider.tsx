import { type PropsWithChildren, useEffect, useState } from 'react'
import {
  ProductPreferencesContext,
} from './ProductPreferencesContext'
import {
  readProductPreferences,
  writeProductPreferences,
  type ThemeMode,
  type VisualQualityMode,
} from '../lib/productPreferences'

export function ProductPreferencesProvider({
  children,
}: PropsWithChildren) {
  const [preferences, setPreferences] = useState(() => readProductPreferences())

  useEffect(() => {
    writeProductPreferences(preferences)
  }, [preferences])

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme
  }, [preferences.theme])

  useEffect(() => {
    document.documentElement.dataset.visualQuality = preferences.visualQuality
  }, [preferences.visualQuality])

  function setTheme(theme: ThemeMode) {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      theme,
    }))
  }

  function setVisualQuality(visualQuality: VisualQualityMode) {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      visualQuality,
    }))
  }

  function setShowModuleDescriptions(value: boolean) {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      showModuleDescriptions: value,
    }))
  }

  function setShowPerformanceOverlay(value: boolean) {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      showPerformanceOverlay: value,
    }))
  }

  return (
    <ProductPreferencesContext.Provider
      value={{
        theme: preferences.theme,
        visualQuality: preferences.visualQuality,
        showModuleDescriptions: preferences.showModuleDescriptions,
        showPerformanceOverlay: preferences.showPerformanceOverlay,
        setTheme,
        setVisualQuality,
        setShowModuleDescriptions,
        setShowPerformanceOverlay,
      }}
    >
      {children}
    </ProductPreferencesContext.Provider>
  )
}
