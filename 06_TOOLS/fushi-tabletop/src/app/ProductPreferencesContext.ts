import { createContext } from 'react'
import type {
  ProductPreferences,
  ThemeMode,
} from '../lib/productPreferences'

export interface ProductPreferencesContextValue extends ProductPreferences {
  setTheme: (theme: ThemeMode) => void
  setShowModuleDescriptions: (value: boolean) => void
}

export const ProductPreferencesContext =
  createContext<ProductPreferencesContextValue | null>(null)
