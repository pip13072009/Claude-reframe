import { formatDayLabel, fromKey, isDateToday, isFutureDate } from '../lib/date'
import { Stepper } from './Stepper'
import type { DateKey } from '../types'

interface DayRowProps {
  day: DateKey
  target: number
  actual: number
  onTargetChange: (value: number) => void
  onActualChange: (value: number) => void
}

export function DayRow({ day, target, actual, onTargetChange, onActualChange }: DayRowProps) {
  const today = isDateToday(day)
  const future = isFutureDate(day)
  const over = actual > target
  const dateNum = fromKey(day).getDate()

  return (
    <div
      className={`grid grid-cols-[3.5rem_1fr_1fr] items-center gap-3 rounded-xl border px-3 py-2.5 sm:grid-cols-[4rem_1fr_1fr] sm:px-4 ${
        today ? 'border-violet-300 bg-violet-50/60' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex flex-col leading-tight">
        <span className={`text-xs font-semibold uppercase tracking-wide ${today ? 'text-violet-600' : 'text-slate-400'}`}>
          {formatDayLabel(day)}
        </span>
        <span className="text-sm font-medium text-slate-700">{dateNum}</span>
      </div>

      <div className="flex flex-col items-start gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Plan</span>
        <Stepper value={target} onChange={onTargetChange} size="sm" />
      </div>

      <div className="flex flex-col items-start gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {future ? 'Upcoming' : 'Actual'}
        </span>
        {future ? (
          <span className="text-sm text-slate-300">—</span>
        ) : (
          <div className="flex items-center gap-2">
            <Stepper value={actual} onChange={onActualChange} size="sm" tone="accent" />
            {over && (
              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                +{actual - target}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
