import { useContext } from 'react'
import { ViewModeContext } from '../app/ViewModeContext'

export function useViewMode() {
  const context = useContext(ViewModeContext)

  if (!context) {
    throw new Error('useViewMode precisa estar dentro de ViewModeProvider.')
  }

  return context
}
