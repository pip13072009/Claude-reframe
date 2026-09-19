import { weekDays } from './date'
import type { DateKey, DrinkLog, WeekPlan } from '../types'

export interface WeekStats {
  weekStart: DateKey
  plannedTotal: number
  actualTotal: number
  cap: number
  diff: number
  daysWithinPlan: number
  daysOverPlan: number
  alcoholFreeDays: number
}

export function computeWeekStats(
  plan: WeekPlan,
  logs: DrinkLog[],
  onlyDays?: DateKey[],
): WeekStats {
  const days = onlyDays ?? weekDays(plan.weekStart)
  let plannedTotal = 0
  let actualTotal = 0
  let daysWithinPlan = 0
  let daysOverPlan = 0
  let alcoholFreeDays = 0

  for (const day of days) {
    const target = plan.targets[day] ?? 0
    const actual = logs
      .filter((l) => l.date === day)
      .reduce((sum, l) => sum + l.count, 0)
    plannedTotal += target
    actualTotal += actual
    if (actual === 0) alcoholFreeDays += 1
    if (actual <= target) daysWithinPlan += 1
    else daysOverPlan += 1
  }

  const cap = plan.weeklyCap ?? plannedTotal

  return {
    weekStart: plan.weekStart,
    plannedTotal,
    actualTotal,
    cap,
    diff: actualTotal - cap,
    daysWithinPlan,
    daysOverPlan,
    alcoholFreeDays,
  }
}
