import { Link } from 'react-router-dom'
import {
  getRulebookForAudience,
  type RulebookAudience,
  type RulebookBlock,
  type RulebookSection,
  type RulebookStatus,
} from '../../data/rulebook'

type RulebookKeywordTone = 'attack' | 'check' | 'danger' | 'resource' | 'timing'

function wholeKeyword(value: string) {
  return `(?<![\\p{L}\\p{N}_])${value}(?![\\p{L}\\p{N}_])`
}

const RULEBOOK_KEYWORD_PATTERN = new RegExp(
  [
    '0\\s+Vida',
    '0\\s+FUSHI',
    '0\\s+Determina(?:ção|cao)',
    wholeKeyword('Ataque de oportunidade'),
    wholeKeyword('Contra-ataque'),
    wholeKeyword('Ação Principal'),
    wholeKeyword('Ação Curta'),
    wholeKeyword('Desengajar'),
    wholeKeyword('Reação'),
    wholeKeyword('Movimento'),
    wholeKeyword('Bloqueio'),
    wholeKeyword('Esquiva'),
    wholeKeyword('Fortitude'),
    wholeKeyword('Coreografia'),
    'Cr[i\\u00ed]tico',
    wholeKeyword('Pontaria'),
    wholeKeyword('Luta'),
    wholeKeyword('Tank'),
    wholeKeyword('Assassino'),
    wholeKeyword('Suporte'),
    wholeKeyword('Lutador'),
    wholeKeyword('Atirador'),
    wholeKeyword('Ocultista'),
    wholeKeyword('CATACLISMA'),
    wholeKeyword('Determinação'),
    wholeKeyword('FUSHI'),
    wholeKeyword('Vida'),
    'DT\\s*\\d+',
    'CA\\s*\\d+',
    '[+-]\\d+d20',
    '[+-]\\d+d\\d+',
    '\\d+d\\d+',
    '[+-]\\d+',
  ].join('|'),
  'giu',
)

function normalizeKeyword(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function keywordTone(value: string): RulebookKeywordTone {
  const normalized = normalizeKeyword(value)

  if (normalized.startsWith('0 ') || /critico|cataclisma/.test(normalized)) return 'danger'
  if (/luta|pontaria|contra-ataque|ataque de oportunidade|coreografia/.test(normalized)) {
    return 'attack'
  }
  if (/vida|fushi|determinacao/.test(normalized)) return 'resource'
  if (/acao|reacao|movimento|desengajar|bloqueio|esquiva|fortitude/.test(normalized)) {
    return 'timing'
  }
  return 'check'
}

export function RulebookRichText({ text }: { text: string }) {
  const fragments: Array<{ text: string; tone?: RulebookKeywordTone }> = []
  let cursor = 0

  for (const match of text.matchAll(RULEBOOK_KEYWORD_PATTERN)) {
    const index = match.index ?? 0

    if (index > cursor) fragments.push({ text: text.slice(cursor, index) })
    fragments.push({ text: match[0], tone: keywordTone(match[0]) })
    cursor = index + match[0].length
  }

  if (cursor < text.length) fragments.push({ text: text.slice(cursor) })

  return (
    <>
      {fragments.map((fragment, index) =>
        fragment.tone ? (
          <mark
            className={'rulebook-keyword rulebook-keyword--' + fragment.tone}
            key={index + '-' + fragment.text}
          >
            {fragment.text}
          </mark>
        ) : (
          fragment.text
        ),
      )}
    </>
  )
}

type ExampleVisualKind = 'aid' | 'precision' | 'ranged' | 'terrain' | 'threat'

function exampleVisualKind(block: RulebookBlock): ExampleVisualKind {
  const source = normalizeKeyword((block.title ?? '') + ' ' + (block.text ?? ''))

  if (/0 vida|medicina|aliado caido/.test(source)) return 'aid'
  if (/manada|oportunidade|desengajar|defesa/.test(source)) return 'threat'
  if (/pontaria|atirador|linha de visao|distancia/.test(source)) return 'ranged'
  if (/d20|dt |coreografia|acerto|ca /.test(source)) return 'precision'
  return 'terrain'
}

function RulebookExampleVisual({ block }: { block: RulebookBlock }) {
  const kind = exampleVisualKind(block)
  const label: Record<ExampleVisualKind, string> = {
    aid: 'COBERTURA E SOCORRO',
    precision: 'RISCO E PRECISÃO',
    ranged: 'LINHA DE VISÃO',
    terrain: 'TERRENO E VANTAGEM',
    threat: 'ZONA DE AMEAÇA',
  }

  return (
    <div aria-hidden="true" className={'rulebook-example-visual rulebook-example-visual--' + kind}>
      <span className="rulebook-example-visual__orbit" />
      <span className="rulebook-example-visual__line" />
      <span className="rulebook-example-visual__node rulebook-example-visual__node--a" />
      <span className="rulebook-example-visual__node rulebook-example-visual__node--b" />
      <span className="rulebook-example-visual__node rulebook-example-visual__node--c" />
      <span className="rulebook-example-visual__caption">{label[kind]}</span>
    </div>
  )
}

const STATUS_LABELS: Record<RulebookStatus, string> = {
  canon: 'Cânone',
  development: 'Em construção',
  playtest: 'Em teste',
}

export function RulebookStatusBadge({ status }: { status: RulebookStatus }) {
  return (
    <span className={'rulebook-status rulebook-status--' + status}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function RulebookTable({ block }: { block: RulebookBlock }) {
  if (!block.table) {
    return null
  }

  return (
    <div className="rulebook-table-wrap">
      <table className="rulebook-table">
        <thead>
          <tr>
            {block.table.columns.map((column) => (
              <th key={column}><RulebookRichText text={column} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.table.rows.map((row, rowIndex) => (
            <tr key={rowIndex + '-' + row.join('-')}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex + '-' + cell}><RulebookRichText text={cell} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function RulebookBlockView({ block }: { block: RulebookBlock }) {
  const className =
    'rulebook-block rulebook-block--' +
    block.kind +
    (block.tone ? ' rulebook-block--' + block.tone : '')

  return (
    <section className={className}>
      {block.title ? <h3>{block.title}</h3> : null}
      {block.kind === 'example' ? <RulebookExampleVisual block={block} /> : null}
      {block.formula ? <code className="rulebook-formula">{block.formula}</code> : null}
      {block.text ? <p><RulebookRichText text={block.text} /></p> : null}
      {block.items ? (
        block.kind === 'steps' ? (
          <ol>
            {block.items.map((item) => (
              <li key={item}><RulebookRichText text={item} /></li>
            ))}
          </ol>
        ) : (
          <ul>
            {block.items.map((item) => (
              <li key={item}><RulebookRichText text={item} /></li>
            ))}
          </ul>
        )
      ) : null}
      <RulebookTable block={block} />
    </section>
  )
}

export function RulebookSectionMenu({
  activeSectionId,
  onSelect,
  sections,
}: {
  activeSectionId: string
  onSelect: (sectionId: string) => void
  sections: RulebookSection[]
}) {
  return (
    <nav aria-label="Capítulos do livro" className="rulebook-chapter-list">
      {sections.map((section) => (
        <button
          aria-current={section.id === activeSectionId ? 'page' : undefined}
          className={
            'rulebook-chapter-button' +
            (section.id === activeSectionId ? ' rulebook-chapter-button--active' : '')
          }
          key={section.id}
          onClick={() => onSelect(section.id)}
          type="button"
        >
          <span className="rulebook-chapter-number">{section.number}</span>
          <span className="rulebook-chapter-copy">
            <strong>{section.label}</strong>
            <small>{section.summary}</small>
          </span>
          <span
            aria-label={STATUS_LABELS[section.status]}
            className={'rulebook-chapter-dot rulebook-chapter-dot--' + section.status}
            title={STATUS_LABELS[section.status]}
          />
        </button>
      ))}
    </nav>
  )
}

export function RulebookQuickReference({
  audience,
  onSelectSection,
  showFullBookLink = true,
}: {
  audience: RulebookAudience
  onSelectSection?: (sectionId: string) => void
  showFullBookLink?: boolean
}) {
  const volume = getRulebookForAudience(audience)

  return (
    <div className={'rulebook-quick rulebook-quick--' + audience}>
      <div className="rulebook-quick__header">
        <div>
          <p className="eyebrow">{audience === 'master' ? 'Escudo' : 'Referência'}</p>
          <h3>{audience === 'master' ? 'Mestre' : 'Jogador'}</h3>
        </div>
        <span className="rulebook-quick__edition">{volume.edition}</span>
      </div>

      <div className="rulebook-quick__grid">
        {volume.quickReference.map((entry) => {
          const content = (
            <>
              <strong>{entry.label}</strong>
              <span><RulebookRichText text={entry.detail} /></span>
            </>
          )

          return onSelectSection ? (
            <button
              className="rulebook-quick__entry"
              key={entry.sectionId + '-' + entry.label}
              onClick={() => onSelectSection(entry.sectionId)}
              type="button"
            >
              {content}
            </button>
          ) : (
            <div
              className="rulebook-quick__entry"
              key={entry.sectionId + '-' + entry.label}
            >
              {content}
            </div>
          )
        })}
      </div>

      {showFullBookLink ? (
        <Link className="button button--primary rulebook-quick__open" to="/livro">
          Abrir livro completo
        </Link>
      ) : null}
    </div>
  )
}
