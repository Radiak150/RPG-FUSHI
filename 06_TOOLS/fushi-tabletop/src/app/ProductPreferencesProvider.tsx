import { type PropsWithChildren, useEffect, useState } from 'react'
import {
  ProductPreferencesContext,
} from './ProductPreferencesContext'
import {
  readProductPreferences,
  writeProductPreferences,
  type ThemeMode,
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

  function setTheme(theme: ThemeMode) {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      theme,
    }))
  }

  function setShowModuleDescriptions(value: boolean) {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      showModuleDescriptions: value,
    }))
  }

  return (
    <ProductPreferencesContext.Provider
      value={{
        theme: preferences.theme,
        showModuleDescriptions: preferences.showModuleDescriptions,
        setTheme,
        setShowModuleDescriptions,
      }}
    >
      {children}
    </ProductPreferencesContext.Provider>
  )
}
