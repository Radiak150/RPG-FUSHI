import { createContext } from 'react'
import type {
  ProductPreferences,
  ThemeMode,
  VisualQualityMode,
} from '../lib/productPreferences'

export interface ProductPreferencesContextValue extends ProductPreferences {
  setTheme: (theme: ThemeMode) => void
  setVisualQuality: (visualQuality: VisualQualityMode) => void
  setShowModuleDescriptions: (value: boolean) => void
  setShowPerformanceOverlay: (value: boolean) => void
}

export const ProductPreferencesContext =
  createContext<ProductPreferencesContextValue | null>(null)
