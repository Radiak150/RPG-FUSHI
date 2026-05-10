import { useContext } from 'react'
import { ProductPreferencesContext } from '../app/ProductPreferencesContext'

export function useProductPreferences() {
  const context = useContext(ProductPreferencesContext)

  if (!context) {
    throw new Error(
      'useProductPreferences precisa estar dentro de ProductPreferencesProvider.',
    )
  }

  return context
}
