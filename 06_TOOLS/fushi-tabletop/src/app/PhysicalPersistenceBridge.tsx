import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import {
  createPhysicalPersistenceSignature,
  hydratePhysicalPersistence,
  savePhysicalPersistence,
} from '../lib/physicalPersistence'
import { migratePersistedDataUrlsToPhysicalAssets } from '../lib/physicalAssetMigration'

export function PhysicalPersistenceGate({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Carregando autosave local...')
  const [retryCount, setRetryCount] = useState(0)
  const [canRetry, setCanRetry] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      if (cancelled) {
        return
      }

      setStatusMessage('Autosave demorou para responder; seguindo com storage local.')
      setCanRetry(true)
      setIsReady(true)
    }, 5000)

    async function hydrate() {
      const result = await hydratePhysicalPersistence()

      if (cancelled) {
        return
      }

      window.clearTimeout(timeoutId)

      if (result.applied) {
        setStatusMessage('Autosave recuperado do disco.')
      } else if (result.error) {
        setStatusMessage('Autosave fisico indisponivel; usando dados do navegador.')
        setCanRetry(true)
      } else {
        setStatusMessage('Autosave local pronto.')
        setCanRetry(false)
      }

      window.setTimeout(() => {
        if (!cancelled) {
          setIsReady(true)
        }
      }, result.applied ? 120 : 0)
    }

    void hydrate()

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [retryCount])

  if (!isReady) {
    return (
      <div className="app-persistence-gate">
        <p className="eyebrow">FUSHI Tabletop</p>
        <h1>{statusMessage}</h1>
        {canRetry ? (
          <button
            className="button"
            onClick={() => {
              setCanRetry(false)
              setIsReady(false)
              setStatusMessage('Carregando autosave local...')
              setRetryCount((current) => current + 1)
            }}
            type="button"
          >
            Tentar novamente
          </button>
        ) : null}
      </div>
    )
  }

  return <>{children}</>
}

export function PhysicalPersistenceBridge() {
  const lastSignatureRef = useRef(createPhysicalPersistenceSignature())
  const isSavingRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function flush(force = false) {
      if (isSavingRef.current) {
        return
      }

      isSavingRef.current = true
      const result = await savePhysicalPersistence(lastSignatureRef.current, force)

      if (!cancelled && result.ok) {
        lastSignatureRef.current = result.signature
      }

      isSavingRef.current = false
    }

    const intervalId = window.setInterval(() => {
      void flush(false)
    }, 1800)
    const hydrateIntervalId = window.setInterval(async () => {
      if (isSavingRef.current || document.visibilityState === 'hidden') {
        return
      }

      const result = await hydratePhysicalPersistence()

      if (!cancelled && result.applied) {
        window.location.reload()
      }
    }, 3200)

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        void flush(true)
      }
    }

    function handleBeforeUnload() {
      void flush(true)
    }

    async function migrateThenFlush() {
      const migration = await migratePersistedDataUrlsToPhysicalAssets()

      await flush(true)

      if (!cancelled && migration.changed) {
        window.location.reload()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    void migrateThenFlush()

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.clearInterval(hydrateIntervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return null
}
