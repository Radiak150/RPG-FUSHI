interface TabletopNotesPanelProps {
  ownerLabel: string
  value: string
  onChange: (value: string) => void
  onClear: () => void
}

export function TabletopNotesPanel({
  ownerLabel,
  value,
  onChange,
  onClear,
}: TabletopNotesPanelProps) {
  return (
    <div className="tabletop-notes-panel">
      <div className="list-card__top">
        <div>
          <p className="eyebrow">Bloco pessoal</p>
          <h3>{ownerLabel}</h3>
        </div>
        <span className="tag">{value.length} caracteres</span>
      </div>
      <textarea
        className="field__input field__input--textarea tabletop-notes-panel__textarea"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Anote nomes, pistas, promessas, lugares, suspeitas ou qualquer coisa que voce queira lembrar depois."
        value={value}
      />
      <div className="tabletop-library-card__actions">
        <button className="button" disabled={!value} onClick={onClear} type="button">
          Limpar notas
        </button>
      </div>
    </div>
  )
}
