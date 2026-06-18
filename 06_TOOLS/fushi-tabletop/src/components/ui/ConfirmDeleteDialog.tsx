import { useState } from 'react'

interface ConfirmDeleteDialogProps {
  title: string
  message: string
  entityLabel: string
  onClose: () => void
  onConfirm: () => void
}

function isValidKeyword(value: string) {
  const normalizedValue = value.trim().toUpperCase()

  return normalizedValue === 'DETELAR' || normalizedValue === 'DELETAR'
}

export function ConfirmDeleteDialog({
  title,
  message,
  entityLabel,
  onClose,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [confirmationValue, setConfirmationValue] = useState('')

  return (
    <div className="editor-overlay" role="presentation">
      <section className="confirm-dialog" aria-label={title}>
        <div className="confirm-dialog__header">
          <div>
            <p className="eyebrow">Exclusao</p>
            <h2>{title}</h2>
          </div>

          <button className="tabletop-icon-button" onClick={onClose} type="button">
            x
          </button>
        </div>

        <p className="support-copy">{message}</p>
        <div className="access-card">
          <strong>{entityLabel}</strong>
          <span>Digite DELETAR para confirmar a exclusao local.</span>
        </div>

        <label className="field">
          <span>Confirmacao</span>
          <input
            className="field__input"
            onChange={(event) => setConfirmationValue(event.target.value)}
            placeholder="DELETAR"
            type="text"
            value={confirmationValue}
          />
        </label>

        <div className="confirm-dialog__footer">
          <button className="button" onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="button button--primary"
            disabled={!isValidKeyword(confirmationValue)}
            onClick={onConfirm}
            type="button"
          >
            Excluir
          </button>
        </div>
      </section>
    </div>
  )
}
