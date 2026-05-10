import type { BookSectionEntry } from '../../data/mock/product'

interface BookSectionNavProps {
  items: BookSectionEntry[]
  activeSectionId: string
  onSelect: (sectionId: string) => void
  showDescriptions: boolean
}

export function BookSectionNav({
  items,
  activeSectionId,
  onSelect,
  showDescriptions,
}: BookSectionNavProps) {
  return (
    <div className="section-menu">
      {items.map((item) => (
        <button
          className={`section-menu__item${
            item.id === activeSectionId ? ' section-menu__item--active' : ''
          }`}
          key={item.id}
          onClick={() => onSelect(item.id)}
          type="button"
        >
          <span className="section-menu__label">{item.label}</span>
          {showDescriptions ? (
            <span className="section-menu__description">{item.description}</span>
          ) : null}
        </button>
      ))}
    </div>
  )
}
