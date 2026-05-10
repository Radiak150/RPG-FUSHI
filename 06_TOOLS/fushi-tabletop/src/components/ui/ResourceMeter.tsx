interface ResourceMeterProps {
  label: string
  atual: number
  maximo: number
}

export function ResourceMeter({
  label,
  atual,
  maximo,
}: ResourceMeterProps) {
  const percentual = maximo > 0 ? Math.max(0, Math.min(100, (atual / maximo) * 100)) : 0

  return (
    <div className="resource-meter">
      <div className="resource-meter__top">
        <span>{label}</span>
        <strong>
          {atual}/{maximo}
        </strong>
      </div>

      <div className="resource-meter__track">
        <div
          className="resource-meter__fill"
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  )
}
