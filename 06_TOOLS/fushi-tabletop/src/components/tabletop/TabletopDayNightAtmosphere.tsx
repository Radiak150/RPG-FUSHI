export type TabletopDayNightTransitionDirection = 'to-day' | 'to-night'

export interface TabletopDayNightTransitionState {
  direction: TabletopDayNightTransitionDirection
  id: number
}

interface TabletopDayNightAtmosphereProps {
  isNight: boolean
  transition: TabletopDayNightTransitionState | null
}

export function TabletopDayNightAtmosphere({
  isNight,
  transition,
}: TabletopDayNightAtmosphereProps) {
  return (
    <div
      className="tabletop-day-night-atmosphere"
      data-day-night-atmosphere="true"
      data-day-night-mode={isNight ? 'night' : 'day'}
      data-day-night-sound={
        transition
          ? transition.direction === 'to-night'
            ? 'nightfall'
            : 'daybreak'
          : 'idle'
      }
      data-day-night-transition={transition?.direction ?? 'idle'}
    >
      {transition ? (
        <div
          aria-hidden="true"
          className={`tabletop-day-night-atmosphere__cinematic tabletop-day-night-atmosphere__cinematic--${transition.direction}`}
          key={transition.id}
        >
          <span className="tabletop-day-night-atmosphere__veil" />
          <span className="tabletop-day-night-atmosphere__horizon" />
          <span className="tabletop-day-night-atmosphere__sky" />
        </div>
      ) : null}
    </div>
  )
}
