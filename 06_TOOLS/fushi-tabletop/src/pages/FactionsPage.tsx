import { FactionCard } from '../components/factions/FactionCard'
import { MetricCard } from '../components/ui/MetricCard'
import { Panel } from '../components/ui/Panel'
import { useMasterData } from '../hooks/useMasterData'
import { getCharactersByIds } from '../lib/selectors'

export function FactionsPage() {
  const { data } = useMasterData()

  if (!data) {
    return null
  }

  const metrics = [
    {
      id: 'f-total',
      label: 'Faccoes',
      value: String(data.factions.items.length).padStart(2, '0'),
      note: 'Quantidade de faccoes mockadas na V1.',
      tone: 'steady' as const,
      toneLabel: 'Total',
    },
    {
      id: 'f-watch',
      label: 'Em atencao',
      value: String(
        data.factions.items.filter((faction) => faction.tone === 'watch').length,
      ).padStart(2, '0'),
      note: 'Estados intermediarios ou dispersos.',
      tone: 'watch' as const,
      toneLabel: 'Atencao',
    },
    {
      id: 'f-critical',
      label: 'Criticas',
      value: String(
        data.factions.items.filter((faction) => faction.tone === 'critical').length,
      ).padStart(2, '0'),
      note: 'Faccoes sob maior pressao visual.',
      tone: 'critical' as const,
      toneLabel: 'Risco',
    },
  ]

  return (
    <div className="page-stack">
      <Panel
        eyebrow="Resumo"
        title="Panorama de faccoes"
        subtitle="V1 somente leitura com cards modulares prontos para evolucao."
      >
        <div className="metric-grid metric-grid--compact">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </Panel>

      <section className="cards-grid cards-grid--large">
        {data.factions.items.map((faction) => (
          <FactionCard
            key={faction.id}
            faction={faction}
            members={getCharactersByIds(data, faction.membrosIds)}
          />
        ))}
      </section>
    </div>
  )
}
