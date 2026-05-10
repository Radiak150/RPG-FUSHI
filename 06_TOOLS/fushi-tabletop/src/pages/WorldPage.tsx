import { useState } from 'react'
import { Panel } from '../components/ui/Panel'
import { PointDetails } from '../components/world/PointDetails'
import { WorldMap } from '../components/world/WorldMap'
import { useMasterData } from '../hooks/useMasterData'

export function WorldPage() {
  const { data } = useMasterData()
  const [manualSelectedPointId, setManualSelectedPointId] = useState('')

  if (!data) {
    return null
  }

  const selectedPointId = manualSelectedPointId || data.world.pontos[0]?.id || ''

  const selectedPoint =
    data.world.pontos.find((point) => point.id === selectedPointId) ??
    data.world.pontos[0]
  const selectedBiome = data.world.biomas.find(
    (biome) => biome.id === selectedPoint?.biomaId,
  )
  const selectedRegion = data.world.regioes.find(
    (region) => region.id === selectedPoint?.regiaoId,
  )

  return (
    <div className="page-stack">
      <div className="world-layout">
        <Panel
          className="panel--map"
          eyebrow="Mapa da ilha"
          title="Visao estatica"
          subtitle="Pontos clicaveis locais para demonstracao da V1."
        >
          <WorldMap
            mapImage={data.world.mapImage}
            onSelect={setManualSelectedPointId}
            points={data.world.pontos}
            selectedPointId={selectedPoint?.id ?? ''}
          />
        </Panel>

        {selectedPoint ? (
          <Panel
            eyebrow="Painel lateral"
            title="Detalhes do ponto"
            subtitle="Informacoes locais carregadas a partir do mock da V1."
          >
            <PointDetails
              biome={selectedBiome}
              point={selectedPoint}
              region={selectedRegion}
            />
          </Panel>
        ) : null}
      </div>

      <div className="split-grid">
        <Panel
          eyebrow="Biomas"
          title="Lista de biomas"
          subtitle="Estrutura local preparada para consumir dados futuros."
        >
          <div className="list-stack">
            {data.world.biomas.map((biome) => {
              const region = data.world.regioes.find(
                (regionItem) => regionItem.id === biome.regiaoId,
              )

              return (
                <article key={biome.id} className="list-card">
                  <div className="list-card__top">
                    <h3>{biome.nome}</h3>
                    <span className="tag">{biome.pressao}</span>
                  </div>
                  <p className="support-copy">
                    {region?.nome ?? 'Regiao nao definida'}
                  </p>
                  <p className="support-copy">{biome.resumo}</p>
                </article>
              )
            })}
          </div>
        </Panel>

        <Panel
          eyebrow="Regioes"
          title="Mapa logico"
          subtitle="Resumo espacial basico para orientar a leitura do mestre."
        >
          <div className="cards-grid">
            {data.world.regioes.map((region) => (
              <article key={region.id} className="list-card">
                <h3>{region.nome}</h3>
                <p className="support-copy">{region.resumo}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
