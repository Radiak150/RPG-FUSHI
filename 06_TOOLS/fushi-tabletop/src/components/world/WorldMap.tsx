import type { PointOfInterest } from '../../data/types'

interface WorldMapProps {
  mapImage: string
  points: PointOfInterest[]
  selectedPointId: string
  onSelect: (pointId: string) => void
}

export function WorldMap({
  mapImage,
  points,
  selectedPointId,
  onSelect,
}: WorldMapProps) {
  return (
    <div className="world-map">
      <img
        alt="Mapa estatico local da ilha"
        className="world-map__image"
        src={mapImage}
      />

      {points.map((point, index) => (
        <button
          key={point.id}
          aria-label={`Abrir ${point.nome}`}
          className={`map-marker${
            selectedPointId === point.id ? ' map-marker--active' : ''
          }`}
          onClick={() => onSelect(point.id)}
          style={{
            left: `${point.posicao.x}%`,
            top: `${point.posicao.y}%`,
          }}
          type="button"
        >
          <span>{index + 1}</span>
        </button>
      ))}
    </div>
  )
}
