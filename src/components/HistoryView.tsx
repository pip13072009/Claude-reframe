import { useMemo } from 'react'
import { currentWeekStart, formatWeekRange, fromKey, weekLabel, weekStartFor } from '../lib/date'
import { computeWeekStats } from '../lib/weekStats'
import { useStore } from '../store'

export function HistoryView() {
  const { data } = useStore()

  const weeks = useMemo(() => {
    const current = currentWeekStart()
    const weekStarts = new Set<string>(Object.keys(data.weeks))
    for (const log of data.logs) {
      const w = weekStartFor(fromKey(log.date))
      weekStarts.add(w)
    }
    weekStarts.delete(current)

    return Array.from(weekStarts)
      .filter((w) => w < current)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((weekStart) => {
        const plan = data.weeks[weekStart] ?? { weekStart, targets: {} }
        return computeWeekStats(plan, data.logs)
      })
  }, [data])

  if (weeks.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-2 px-4 py-20 text-center text-slate-400">
        <p className="text-sm">No past weeks yet.</p>
        <p className="text-xs">Once a week ends, it'll show up here so you can see how you did.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pb-16 pt-6">
      {weeks.map((w) => {
        const over = w.cap > 0 && w.actualTotal > w.cap
        return (
          <div
            key={w.weekStart}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <div>
              <div className="text-sm font-semibold text-slate-800">{weekLabel(w.weekStart)}</div>
              <div className="text-xs text-slate-400">{formatWeekRange(w.weekStart)}</div>
              <div className="mt-1 text-xs text-slate-400">
                {w.alcoholFreeDays} alcohol-free · {w.daysWithinPlan}/7 within plan
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold tabular-nums text-slate-900">
                {w.actualTotal}
                <span className="text-sm font-normal text-slate-400"> / {w.cap || '–'}</span>
              </div>
              <div
                className={`text-xs font-medium ${
                  w.cap === 0 ? 'text-slate-400' : over ? 'text-rose-500' : 'text-emerald-500'
                }`}
              >
                {w.cap === 0 ? 'no plan' : over ? `+${w.actualTotal - w.cap} over` : 'on plan'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
