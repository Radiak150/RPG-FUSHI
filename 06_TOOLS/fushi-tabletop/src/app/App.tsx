import { lazy, Suspense, type ComponentType } from 'react'
import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { AccessGate } from './AccessGate'
import { CampaignAutoBackupBridge } from './CampaignAutoBackupBridge'
import { MasterDataProvider } from './MasterDataProvider'
import { MultiplayerProvider } from './MultiplayerProvider'
import {
  PhysicalPersistenceBridge,
  PhysicalPersistenceGate,
} from './PhysicalPersistenceBridge'
import { ProductPreferencesProvider } from './ProductPreferencesProvider'
import { RouteErrorBoundary } from './RouteErrorBoundary'
import { ViewModeProvider } from './ViewModeProvider'

const HomePage = lazy(() =>
  import('../pages/HomePage').then(({ HomePage }) => ({ default: HomePage })),
)
const LauncherPage = lazy(() =>
  import('../pages/LauncherPage').then(({ LauncherPage }) => ({ default: LauncherPage })),
)
const PlayPage = lazy(() =>
  import('../pages/PlayPage').then(({ PlayPage }) => ({ default: PlayPage })),
)
const TablePage = lazy(() =>
  import('../pages/TablePage').then(({ TablePage }) => ({ default: TablePage })),
)
const CharactersPage = lazy(() =>
  import('../pages/CharactersPage').then(({ CharactersPage }) => ({
    default: CharactersPage,
  })),
)
const CampaignsPage = lazy(() =>
  import('../pages/CampaignsPage').then(({ CampaignsPage }) => ({
    default: CampaignsPage,
  })),
)
const MultiplayerPage = lazy(() =>
  import('../pages/MultiplayerPage').then(({ MultiplayerPage }) => ({
    default: MultiplayerPage,
  })),
)
const BookPage = lazy(() =>
  import('../pages/BookPage').then(({ BookPage }) => ({ default: BookPage })),
)
const SettingsPage = lazy(() =>
  import('../pages/SettingsPage').then(({ SettingsPage }) => ({
    default: SettingsPage,
  })),
)

function routeElement(Page: ComponentType) {
  return (
    <RouteErrorBoundary resetKey={`${window.location.pathname}${window.location.hash}`}>
      <Suspense
        fallback={<div aria-label="Carregando modulo" className="route-loading" />}
      >
        <Page />
      </Suspense>
    </RouteErrorBoundary>
  )
}

export default function App() {
  const Router = window.fushiDesktop ? HashRouter : BrowserRouter

  return (
    <PhysicalPersistenceGate>
      <Router>
        <ProductPreferencesProvider>
          <MultiplayerProvider>
            <ViewModeProvider>
              <MasterDataProvider>
                <PhysicalPersistenceBridge />
                <CampaignAutoBackupBridge />
                <AccessGate>
                  <Routes>
                    <Route element={routeElement(LauncherPage)} path="/launcher" />
                    <Route element={routeElement(SettingsPage)} path="/configuracoes" />
                    <Route element={<AppShell />} path="/">
                      <Route element={routeElement(HomePage)} index />
                      <Route element={routeElement(PlayPage)} path="jogar" />
                      <Route element={routeElement(TablePage)} path="jogar/mesa" />
                      <Route element={routeElement(CharactersPage)} path="personagens" />
                      <Route element={routeElement(CampaignsPage)} path="campanhas" />
                      <Route element={routeElement(MultiplayerPage)} path="multiplayer" />
                      <Route element={<Navigate replace to="/jogar/mesa" />} path="multiplayer/player" />
                      <Route element={routeElement(BookPage)} path="livro" />
                      <Route element={<Navigate replace to="/jogar/mesa" />} path="mesa" />
                      <Route element={<Navigate replace to="/campanhas" />} path="dashboard" />
                      <Route element={<Navigate replace to="/campanhas" />} path="mundo" />
                      <Route element={<Navigate replace to="/campanhas" />} path="faccoes" />
                      <Route element={<Navigate replace to="/personagens" />} path="fichas" />
                      <Route element={<Navigate replace to="/campanhas" />} path="campanha" />
                      <Route element={<Navigate replace to="/livro" />} path="sistema" />
                      <Route element={<Navigate replace to="/" />} path="*" />
                    </Route>
                  </Routes>
                </AccessGate>
              </MasterDataProvider>
            </ViewModeProvider>
          </MultiplayerProvider>
        </ProductPreferencesProvider>
      </Router>
    </PhysicalPersistenceGate>
  )
}
