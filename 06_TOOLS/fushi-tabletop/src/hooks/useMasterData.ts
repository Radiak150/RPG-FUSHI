import { useContext } from 'react'
import { MasterDataContext } from '../app/MasterDataContext'

export function useMasterData() {
  const context = useContext(MasterDataContext)

  if (!context) {
    throw new Error('useMasterData precisa estar dentro de MasterDataProvider.')
  }

  return context
}
