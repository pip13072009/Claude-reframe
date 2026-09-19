import { useState } from 'react'
import { currentWeekStart, formatWeekRange, shiftWeek, weekDays, weekLabel } from '../lib/date'
import { computeWeekStats } from '../lib/weekStats'
import { useStore } from '../store'
import type { DateKey } from '../types'
import { DayRow } from './DayRow'
import { ProgressBar } from './ProgressBar'

export function WeekView() {
  const [weekStart, setWeekStart] = useState<DateKey>(currentWeekStart)
  const { getWeekPlan, setDayTarget, applyTargetToWeek, setWeeklyCap, totalForDay, addDrink, data } =
    useStore()

  const plan = getWeekPlan(weekStart)
  const days = weekDays(weekStart)
  const stats = computeWeekStats(plan, data.logs)
  const unit = data.settings.unitLabel
  const isCurrent = weekStart === currentWeekStart()
  const overCap = stats.actualTotal > stats.cap && stats.cap > 0

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-16 pt-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setWeekStart((w) => shiftWeek(w, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
          aria-label="Previous week"
        >
          ‹
        </button>
        <div className="text-center">
          <div className="text-base font-semibold text-slate-800">{weekLabel(weekStart)}</div>
          <div className="text-xs text-slate-400">{formatWeekRange(weekStart)}</div>
        </div>
        <button
          type="button"
          onClick={() => setWeekStart((w) => shiftWeek(w, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
          aria-label="Next week"
        >
          ›
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <div className="text-2xl font-semibold tabular-nums text-slate-900">
              {stats.actualTotal}
              <span className="ml-1 text-sm font-normal text-slate-400">/ {stats.cap || '–'} {unit}</span>
            </div>
            <div className="text-xs text-slate-400">
              {isCurrent ? "so far this week" : 'logged'}
            </div>
          </div>
          <div
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              overCap
                ? 'bg-rose-100 text-rose-600'
                : stats.cap > 0
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-slate-100 text-slate-500'
            }`}
          >
            {stats.cap > 0
              ? overCap
                ? `+${stats.actualTotal - stats.cap} over`
                : `${stats.cap - stats.actualTotal} to spare`
              : 'no plan set'}
          </div>
        </div>
        <ProgressBar value={stats.actualTotal} max={stats.cap} overBudget={overCap} />

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 py-2">
            <div className="text-sm font-semibold text-slate-800">{stats.alcoholFreeDays}</div>
            <div className="text-[11px] text-slate-400">alcohol-free</div>
          </div>
          <div className="rounded-lg bg-slate-50 py-2">
            <div className="text-sm font-semibold text-slate-800">{stats.daysWithinPlan}</div>
            <div className="text-[11px] text-slate-400">within plan</div>
          </div>
          <div className="rounded-lg bg-slate-50 py-2">
            <div className="text-sm font-semibold text-slate-800">{stats.plannedTotal}</div>
            <div className="text-[11px] text-slate-400">planned</div>
          </div>
        </div>
      </div>

      <WeeklyCapEditor
        cap={plan.weeklyCap}
        plannedTotal={stats.plannedTotal}
        onChange={(cap) => setWeeklyCap(weekStart, cap)}
        onApplyToAllDays={(target) => applyTargetToWeek(weekStart, target)}
      />

      <div className="flex flex-col gap-2">
        {days.map((day) => (
          <DayRow
            key={day}
            day={day}
            target={plan.targets[day] ?? 0}
            actual={totalForDay(day)}
            onTargetChange={(value) => setDayTarget(weekStart, day, value)}
            onActualChange={(value) => {
              const current = totalForDay(day)
              const delta = value - current
              if (delta !== 0) addDrink(day, delta)
            }}
          />
        ))}
      </div>
    </div>
  )
}

function WeeklyCapEditor({
  cap,
  plannedTotal,
  onChange,
  onApplyToAllDays,
}: {
  cap: number | undefined
  plannedTotal: number
  onChange: (cap: number | undefined) => void
  onApplyToAllDays: (target: number) => void
}) {
  const [dailyTarget, setDailyTarget] = useState(0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="text-sm text-slate-600" htmlFor="weekly-cap">
          Weekly limit
        </label>
        <input
          id="weekly-cap"
          type="number"
          min={0}
          value={cap ?? ''}
          placeholder={String(plannedTotal)}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm font-medium focus:border-violet-400 focus:outline-none"
        />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <label className="text-sm text-slate-600" htmlFor="daily-target">
          Set every day to
        </label>
        <div className="flex items-center gap-2">
          <input
            id="daily-target"
            type="number"
            min={0}
            value={dailyTarget}
            onChange={(e) => setDailyTarget(Number(e.target.value))}
            className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm font-medium focus:border-violet-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => onApplyToAllDays(dailyTarget)}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
