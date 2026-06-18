import { useContext } from 'react'
import { MultiplayerContext } from '../app/MultiplayerContext'

export function useMultiplayer() {
  const context = useContext(MultiplayerContext)

  if (!context) {
    throw new Error('useMultiplayer deve ser usado dentro de MultiplayerProvider.')
  }

  return context
}
