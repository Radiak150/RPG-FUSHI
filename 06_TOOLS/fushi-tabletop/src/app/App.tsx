import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { BookPage } from '../pages/BookPage'
import { CampaignsPage } from '../pages/CampaignsPage'
import { CharactersPage } from '../pages/CharactersPage'
import { HomePage } from '../pages/HomePage'
import { PlayPage } from '../pages/PlayPage'
import { SettingsPage } from '../pages/SettingsPage'
import { TablePage } from '../pages/TablePage'
import { AccessGate } from './AccessGate'
import { MasterDataProvider } from './MasterDataProvider'
import {
  PhysicalPersistenceBridge,
  PhysicalPersistenceGate,
} from './PhysicalPersistenceBridge'
import { ProductPreferencesProvider } from './ProductPreferencesProvider'
import { ViewModeProvider } from './ViewModeProvider'

export default function App() {
  return (
    <PhysicalPersistenceGate>
      <BrowserRouter>
        <ProductPreferencesProvider>
          <ViewModeProvider>
            <MasterDataProvider>
              <PhysicalPersistenceBridge />
              <AccessGate>
                <Routes>
                  <Route element={<AppShell />} path="/">
                    <Route element={<HomePage />} index />
                    <Route element={<PlayPage />} path="jogar" />
                    <Route element={<TablePage />} path="jogar/mesa" />
                    <Route element={<CharactersPage />} path="personagens" />
                    <Route element={<CampaignsPage />} path="campanhas" />
                    <Route element={<BookPage />} path="livro" />
                    <Route element={<SettingsPage />} path="configuracoes" />

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
        </ProductPreferencesProvider>
      </BrowserRouter>
    </PhysicalPersistenceGate>
  )
}
