import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Maximize2,
  Moon,
  MousePointer2,
  Plus,
  Power,
  Sun,
  Trash2,
} from 'lucide-react'
import type { TabletopSceneLight, TabletopSceneLighting } from '../../data/types'

interface TabletopLightingControlsProps {
  isGm: boolean
  isNight: boolean
  lighting: TabletopSceneLighting
  isEditing: boolean
  selectedLightId: string
  onToggleDayNight: () => void
  onToggleEnabled: () => void
  onToggleCursor: () => void
  onAddLight: () => void
  onToggleEditing: () => void
  onSelectLight: (lightId: string) => void
  onUpdateLight: (lightId: string, patch: Partial<TabletopSceneLight>) => void
  onRemoveLight: (lightId: string) => void
}

export function TabletopLightingControls({
  isGm,
  isNight,
  lighting,
  isEditing,
  selectedLightId,
  onToggleDayNight,
  onToggleEnabled,
  onToggleCursor,
  onAddLight,
  onToggleEditing,
  onSelectLight,
  onUpdateLight,
  onRemoveLight,
}: TabletopLightingControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const selectedLight =
    lighting.lights.find((light) => light.id === selectedLightId) ?? null

  function collapseControls() {
    if (isEditing) {
      onToggleEditing()
    }
    setIsExpanded(false)
  }

  return (
    <div
      className={`tabletop-lighting-controls${
        isNight ? ' tabletop-lighting-controls--night' : ''
      }`}
      data-gm-controls={isGm ? 'true' : 'false'}
      data-expanded={isExpanded ? 'true' : 'false'}
      data-light-count={lighting.lights.length}
      data-lighting-controls
    >
      {isGm ? (
        <button
          aria-label="Recolher controles de iluminacao"
          className="tabletop-lighting-controls__chevron"
          disabled={!isExpanded}
          onClick={collapseControls}
          title="Recolher iluminacao"
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={15} />
        </button>
      ) : null}

      {isGm ? (
        <button
          aria-label={isNight ? 'Alternar para Dia' : 'Alternar para Noite'}
          aria-pressed={isNight}
          className="tabletop-lighting-controls__mode"
          onClick={onToggleDayNight}
          title={isNight ? 'Noite: clique para amanhecer' : 'Dia: clique para anoitecer'}
          type="button"
        >
          {isNight ? <Moon aria-hidden="true" size={15} /> : <Sun aria-hidden="true" size={15} />}
          <span>{isNight ? 'Noite' : 'Dia'}</span>
        </button>
      ) : (
        <span
          className="tabletop-lighting-controls__mode"
          title={isNight ? 'Noite: iluminacao da cena' : 'Dia: iluminacao natural'}
        >
          {isNight ? <Moon aria-hidden="true" size={15} /> : <Sun aria-hidden="true" size={15} />}
          <span>{isNight ? 'Noite' : 'Dia'}</span>
        </span>
      )}

      {isGm ? (
        <button
          aria-label="Expandir controles de iluminacao"
          className="tabletop-lighting-controls__chevron"
          disabled={isExpanded}
          onClick={() => setIsExpanded(true)}
          title="Abrir iluminacao"
          type="button"
        >
          <ChevronRight aria-hidden="true" size={15} />
        </button>
      ) : null}

      {!isGm || !isExpanded ? null : (
        <div className="tabletop-lighting-controls__tools">
          <button
            aria-label={lighting.enabled ? 'Desligar iluminacao' : 'Ligar iluminacao'}
            className={`tabletop-lighting-controls__button${
              lighting.enabled ? ' is-active' : ''
            }`}
            onClick={onToggleEnabled}
            title={lighting.enabled ? 'Iluminacao ligada' : 'Iluminacao desligada'}
            type="button"
          >
            <Power aria-hidden="true" size={15} />
          </button>
          <button
            aria-label={
              lighting.cursorLight.enabled
                ? 'Desligar lanterna do Mestre'
                : 'Ligar lanterna do Mestre'
            }
            className={`tabletop-lighting-controls__button${
              lighting.cursorLight.enabled ? ' is-active' : ''
            }`}
            onClick={onToggleCursor}
            title="Lanterna do Mestre segue o mouse"
            type="button"
          >
            <MousePointer2 aria-hidden="true" size={15} />
          </button>
          <button
            aria-label="Adicionar ponto de luz"
            className="tabletop-lighting-controls__button"
            disabled={lighting.lights.length >= 24}
            onClick={onAddLight}
            title="Adicionar ponto de luz"
            type="button"
          >
            <Plus aria-hidden="true" size={15} />
          </button>
          <button
            aria-label={isEditing ? 'Sair do modo de editar luzes' : 'Editar luzes'}
            className={`tabletop-lighting-controls__button${
              isEditing ? ' is-active' : ''
            }`}
            onClick={onToggleEditing}
            title="Editar e redimensionar luzes (Ctrl+T)"
            type="button"
          >
            <Maximize2 aria-hidden="true" size={15} />
          </button>
          <span className="tabletop-lighting-controls__count">
            <Lightbulb aria-hidden="true" size={14} />
            {lighting.lights.length}/24
          </span>
        </div>
      )}

      {isGm && isExpanded && isEditing && selectedLight ? (
        <div className="tabletop-lighting-controls__inspector">
          <button
            aria-label={`Selecionar ${selectedLight.label}`}
            className="tabletop-lighting-controls__selected"
            onClick={() => onSelectLight(selectedLight.id)}
            title="Ponto de luz selecionado"
            type="button"
          >
            <Lightbulb aria-hidden="true" size={14} />
            <span>{selectedLight.label}</span>
          </button>
          <label title="Raio da luz">
            <span>Raio</span>
            <input
              aria-label="Raio da luz"
              max="0.5"
              min="0.04"
              onChange={(event) =>
                onUpdateLight(selectedLight.id, {
                  radius: Number(event.target.value),
                })
              }
              step="0.01"
              type="range"
              value={selectedLight.radius}
            />
          </label>
          <label title="Intensidade da luz">
            <span>Forca</span>
            <input
              aria-label="Intensidade da luz"
              max="1"
              min="0.2"
              onChange={(event) =>
                onUpdateLight(selectedLight.id, {
                  intensity: Number(event.target.value),
                })
              }
              step="0.01"
              type="range"
              value={selectedLight.intensity}
            />
          </label>
          <input
            aria-label="Cor da luz"
            onChange={(event) =>
              onUpdateLight(selectedLight.id, { color: event.target.value })
            }
            title="Cor da luz"
            type="color"
            value={selectedLight.color}
          />
          <button
            aria-label={`Remover ${selectedLight.label}`}
            className="tabletop-lighting-controls__button tabletop-lighting-controls__button--danger"
            onClick={() => onRemoveLight(selectedLight.id)}
            title="Remover ponto de luz"
            type="button"
          >
            <Trash2 aria-hidden="true" size={15} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
