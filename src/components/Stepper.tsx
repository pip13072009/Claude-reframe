interface StepperProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  min?: number
  max?: number
  size?: 'sm' | 'md'
  tone?: 'neutral' | 'accent'
}

export function Stepper({
  value,
  onChange,
  disabled,
  min = 0,
  max = 99,
  size = 'md',
  tone = 'neutral',
}: StepperProps) {
  const dims = size === 'sm' ? 'h-7 w-7 text-sm' : 'h-8 w-8 text-base'
  const btnBase = `${dims} flex items-center justify-center rounded-full border font-medium transition disabled:opacity-30 disabled:cursor-not-allowed`
  const btnTone =
    tone === 'accent'
      ? 'border-violet-200 text-violet-700 hover:bg-violet-50 active:bg-violet-100'
      : 'border-slate-200 text-slate-500 hover:bg-slate-50 active:bg-slate-100'

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Decrease"
        className={`${btnBase} ${btnTone}`}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <span className="w-5 text-center text-sm font-semibold tabular-nums text-slate-800">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase"
        className={`${btnBase} ${btnTone}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  )
}
