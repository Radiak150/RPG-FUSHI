import type { PropsWithChildren, ReactNode } from 'react'

interface PanelProps extends PropsWithChildren {
  title: string
  subtitle?: string
  eyebrow?: string
  aside?: ReactNode
  className?: string
}

export function Panel({
  title,
  subtitle,
  eyebrow,
  aside,
  className,
  children,
}: PanelProps) {
  return (
    <section className={`panel${className ? ` ${className}` : ''}`}>
      <div className="panel__header">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 className="panel__title">{title}</h2>
          {subtitle ? <p className="panel__subtitle">{subtitle}</p> : null}
        </div>

        {aside ? <div>{aside}</div> : null}
      </div>

      {children}
    </section>
  )
}
