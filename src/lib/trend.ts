import { addDays, differenceInCalendarDays } from 'date-fns'
import { fromKey, shiftWeek, toKey, weekDays, weekStartFor } from './date'
import type { DateKey, DrinkLog, WeekPlan } from '../types'

export type Granularity = 'day' | 'week'

export interface TrendPoint {
  /** First day of the period (the day itself, or the week's Monday) */
  key: DateKey
  actual: number
  plan: number
  /** Rolling average of actual drinks, in drinks per period; null if no data yet */
  rolling: number | null
  /** True for the current, still-in-progress week */
  partial: boolean
}

/** Rolling window, in days, for each granularity */
export const ROLLING_DAYS: Record<Granularity, number> = { day: 7, week: 28 }

interface TrendInput {
  logs: DrinkLog[]
  getWeekPlan: (weekStart: DateKey) => WeekPlan
  /** Number of weeks to show, ending with the current week */
  weeks: number
  granularity: Granularity
  today: DateKey
}

export function buildTrend({ logs, getWeekPlan, weeks, granularity, today }: TrendInput): TrendPoint[] {
  const totals = new Map<DateKey, number>()
  let firstTracked: DateKey | null = null
  for (const log of logs) {
    totals.set(log.date, (totals.get(log.date) ?? 0) + log.count)
    if (!firstTracked || log.date < firstTracked) firstTracked = log.date
  }
  const actualOn = (day: DateKey) => totals.get(day) ?? 0

  // Trailing mean of daily totals ending on `end`, over days since tracking began.
  // Days before the first log aren't counted, so a new user's average isn't dragged to zero.
  const rollingPerDay = (end: DateKey): number | null => {
    if (!firstTracked || end < firstTracked) return null
    const endDate = fromKey(end)
    const window = Math.min(
      ROLLING_DAYS[granularity],
      differenceInCalendarDays(endDate, fromKey(firstTracked)) + 1,
    )
    let sum = 0
    for (let i = 0; i < window; i++) sum += actualOn(toKey(addDays(endDate, -i)))
    return sum / window
  }

  const lastWeek = weekStartFor(fromKey(today))
  const firstWeek = shiftWeek(lastWeek, -(weeks - 1))
  const points: TrendPoint[] = []

  for (let w = 0; w < weeks; w++) {
    const weekStart = shiftWeek(firstWeek, w)
    const plan = getWeekPlan(weekStart)
    const days = weekDays(weekStart)

    if (granularity === 'day') {
      for (const day of days) {
        if (day > today) break
        const rolling = rollingPerDay(day)
        points.push({
          key: day,
          actual: actualOn(day),
          plan: plan.targets[day] ?? 0,
          rolling,
          partial: false,
        })
      }
    } else {
      const elapsed = days.filter((d) => d <= today)
      const end = elapsed[elapsed.length - 1]
      const rolling = rollingPerDay(end)
      points.push({
        key: weekStart,
        actual: elapsed.reduce((s, d) => s + actualOn(d), 0),
        plan: plan.weeklyCap ?? days.reduce((s, d) => s + (plan.targets[d] ?? 0), 0),
        // Express as drinks per week so it's comparable with the bars
        rolling: rolling === null ? null : rolling * 7,
        partial: elapsed.length < 7,
      })
    }
  }

  return points
}
