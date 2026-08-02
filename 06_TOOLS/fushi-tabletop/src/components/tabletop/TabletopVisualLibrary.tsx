import type { ReactNode } from 'react'
import { Search, X, type LucideIcon } from 'lucide-react'

interface TabletopVisualLibraryProps {
  actions?: ReactNode
  children: ReactNode
  className?: string
  code: string
  contentHeader?: ReactNode
  icon: LucideIcon
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  searchValue?: string
  sidebar: ReactNode
  testId?: string
  title: string
}
export function TabletopVisualLibrary({
  actions,
  children,
  className = '',
  code,
  contentHeader,
  icon: Icon,
  onSearchChange,
  searchPlaceholder = 'Buscar',
  searchValue = '',
  sidebar,
  testId,
  title,
}: TabletopVisualLibraryProps) {
  const canSearch = Boolean(onSearchChange)

  return (
    <section
      className={`tabletop-visual-library${className ? ` ${className}` : ''}`}
      data-testid={testId}
    >
      <header className="tabletop-visual-library__topbar">
        <div className="tabletop-visual-library__brand">
          <Icon aria-hidden="true" size={23} strokeWidth={1.7} />
          <div>
            <p className="eyebrow">{code}</p>
            <h3>{title}</h3>
          </div>
        </div>

        {canSearch ? (
          <label className="tabletop-visual-library__search">
            <Search aria-hidden="true" size={16} />
            <input
              aria-label={searchPlaceholder}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={searchPlaceholder}
              value={searchValue}
            />
            {searchValue ? (
              <button
                aria-label="Limpar busca"
                onClick={() => onSearchChange?.('')}
                title="Limpar busca"
                type="button"
              >
                <X size={15} />
              </button>
            ) : null}
          </label>
        ) : (
          <div />
        )}

        <div className="tabletop-visual-library__actions">{actions}</div>
      </header>

      <div className="tabletop-visual-library__workspace">
        <aside className="tabletop-visual-library__sidebar">{sidebar}</aside>
        <main className="tabletop-visual-library__content">
          {contentHeader ? (
            <header className="tabletop-visual-library__content-header">
              {contentHeader}
            </header>
          ) : null}
          {children}
        </main>
      </div>
    </section>
  )
}
