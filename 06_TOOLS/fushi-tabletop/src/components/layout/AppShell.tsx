import { Outlet, useLocation } from 'react-router-dom'
import { useMasterData } from '../../hooks/useMasterData'
import { useProductPreferences } from '../../hooks/useProductPreferences'
import { useViewMode } from '../../hooks/useViewMode'
import { getRouteMeta, isRouteAllowed } from '../../lib/navigation'
import { DataState } from '../ui/DataState'
import { AppHeader } from './AppHeader'
import { SidebarNav } from './SidebarNav'

export function AppShell() {
  const location = useLocation()
  const meta = getRouteMeta(location.pathname)
  const { status, data, error, refresh } = useMasterData()
  const { viewMode } = useViewMode()
  const { showModuleDescriptions } = useProductPreferences()
  const routeAllowed = isRouteAllowed(location.pathname, viewMode)
  const isTableRoute =
    location.pathname === '/jogar/mesa' ||
    location.pathname.startsWith('/jogar/mesa/')
  const hideHeaderRoutes = ['/', '/jogar', '/campanhas', '/personagens']
  const shouldHideHeader = hideHeaderRoutes.includes(location.pathname)

  if (isTableRoute) {
    return (
      <div className="app-shell app-shell--immersive">
        {status === 'error' ? (
          <main className="page-shell page-shell--immersive">
            <DataState
              title="Falha ao carregar a mesa"
              message={error ?? 'Os dados locais nao puderam ser carregados.'}
              actionLabel="Tentar novamente"
              onAction={() => {
                void refresh()
              }}
            />
          </main>
        ) : null}

        {status === 'loading' && !data ? (
          <main className="page-shell page-shell--immersive">
            <DataState
              title="Carregando mesa"
              message="Preparando dados locais para o modulo Jogar."
            />
          </main>
        ) : null}

        {data ? (
          <main className="page-shell page-shell--immersive">
            {routeAllowed ? (
              <Outlet />
            ) : (
              <DataState
                title="Tela restrita"
                message="Esta area fica disponivel apenas na view correta nesta etapa do FUSHI Tabletop."
              />
            )}
          </main>
        ) : null}
      </div>
    )
  }

  return (
    <div className="app-shell">
      <SidebarNav />

      <div className="app-shell__main">
        {!shouldHideHeader ? (
          <AppHeader
            eyebrow={meta.eyebrow}
            title={meta.title}
            description={showModuleDescriptions ? meta.description : ''}
            currentSession={
              viewMode === 'gm' && location.pathname === '/livro'
                ? data?.dashboard.currentSession
                : undefined
            }
            campaignStatus={
              viewMode === 'gm' && location.pathname === '/livro'
                ? data?.dashboard.campaignStatus
                : undefined
            }
          />
        ) : null}

        {status === 'error' ? (
          <DataState
            title="Falha ao carregar o painel"
            message={error ?? 'Os dados locais nao puderam ser carregados.'}
            actionLabel="Tentar novamente"
            onAction={() => {
              void refresh()
            }}
          />
        ) : null}

        {status === 'loading' && !data ? (
          <DataState
            title="Carregando painel"
            message="Preparando dados mockados locais para a V1 do mestre."
          />
        ) : null}

        {data ? (
          <main className="page-shell">
            {routeAllowed ? (
              <Outlet />
            ) : (
              <DataState
                title="Tela restrita"
                message="Esta area fica disponivel apenas na GM View nesta etapa do FUSHI Tabletop."
              />
            )}
          </main>
        ) : null}
      </div>
    </div>
  )
}
