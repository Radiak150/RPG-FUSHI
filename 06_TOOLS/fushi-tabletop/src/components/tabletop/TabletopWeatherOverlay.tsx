import { useMemo } from 'react'
import type { TabletopWeatherRuntime } from '../../lib/tabletopRuntime'

interface TabletopWeatherOverlayProps {
  runtime: TabletopWeatherRuntime
}

export function TabletopWeatherOverlay({
  runtime,
}: TabletopWeatherOverlayProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: runtime.density }, (_, index) => {
        const left = (index * 17.3) % 100
        const delay = -((index % 7) * 0.32 + index * 0.04)
        const duration =
          runtime.variant === 'rain'
            ? 0.9 + (index % 5) * 0.14
            : runtime.variant === 'snow'
              ? 3.2 + (index % 5) * 0.4
              : runtime.variant === 'wind'
                ? 2.8 + (index % 5) * 0.22
                : runtime.variant === 'leaves'
                  ? 5 + (index % 5) * 0.34
                  : runtime.variant === 'ash'
                    ? 3.8 + (index % 6) * 0.28
                    : runtime.variant === 'mist'
                      ? 6.4 + (index % 5) * 0.42
                      : 4.2 + (index % 6) * 0.5
        const size =
          runtime.variant === 'rain'
            ? 1 + (index % 2)
            : runtime.variant === 'snow'
              ? 3 + (index % 4)
              : runtime.variant === 'wind'
                ? 16 + (index % 5) * 4
                : runtime.variant === 'leaves'
                  ? 5 + (index % 5)
                  : runtime.variant === 'ash'
                    ? 2 + (index % 4)
                    : runtime.variant === 'mist'
                      ? 18 + (index % 6) * 3
                      : 5 + (index % 5)

        return {
          id: `${runtime.id}-${index}`,
          style: {
            left: `${left}%`,
            top: `${(index * 11) % 120 - 20}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            ['--weather-particle-size' as string]: `${size}px`,
          },
        }
      }),
    [runtime.density, runtime.id, runtime.variant],
  )

  if (runtime.variant === 'none' && runtime.veilOpacity <= 0) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className={`tabletop-weather tabletop-weather--${runtime.variant}`}
      data-weather-id={runtime.id}
    >
      <div
        className="tabletop-weather__veil"
        style={{ opacity: runtime.veilOpacity }}
      />
      {particles.map((particle) => (
        <span
          className="tabletop-weather__particle"
          key={particle.id}
          style={particle.style}
        />
      ))}
    </div>
  )
}
