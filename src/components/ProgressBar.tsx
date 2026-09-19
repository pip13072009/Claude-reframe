interface ProgressBarProps {
  value: number
  max: number
  overBudget?: boolean
}

export function ProgressBar({ value, max, overBudget }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : value > 0 ? 100 : 0
  const color = overBudget ? 'bg-rose-500' : 'bg-emerald-500'
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${color} transition-all duration-300`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
