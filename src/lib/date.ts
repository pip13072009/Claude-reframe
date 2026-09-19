import {
  addDays,
  addWeeks,
  format,
  isAfter,
  isToday,
  parseISO,
  startOfWeek,
} from 'date-fns'
import type { DateKey } from '../types'

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function toKey(date: Date): DateKey {
  return format(date, 'yyyy-MM-dd')
}

export function fromKey(key: DateKey): Date {
  return parseISO(key)
}

export function todayKey(): DateKey {
  return toKey(new Date())
}

export function weekStartFor(date: Date): DateKey {
  return toKey(startOfWeek(date, { weekStartsOn: 1 }))
}

export function currentWeekStart(): DateKey {
  return weekStartFor(new Date())
}

export function weekDays(weekStart: DateKey): DateKey[] {
  const start = fromKey(weekStart)
  return Array.from({ length: 7 }, (_, i) => toKey(addDays(start, i)))
}

export function shiftWeek(weekStart: DateKey, delta: number): DateKey {
  return toKey(addWeeks(fromKey(weekStart), delta))
}

export function isDateToday(key: DateKey): boolean {
  return isToday(fromKey(key))
}

export function isFutureDate(key: DateKey): boolean {
  const d = fromKey(key)
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return isAfter(d, t)
}

export function formatDayLabel(key: DateKey): string {
  return DAY_LABELS[(fromKey(key).getDay() + 6) % 7]
}

export function formatWeekRange(weekStart: DateKey): string {
  const start = fromKey(weekStart)
  const end = addDays(start, 6)
  const sameMonth = start.getMonth() === end.getMonth()
  const startFmt = format(start, sameMonth ? 'd' : 'd MMM')
  const endFmt = format(end, 'd MMM yyyy')
  return `${startFmt} – ${endFmt}`
}

export function weekLabel(weekStart: DateKey): string {
  const current = currentWeekStart()
  if (weekStart === current) return 'This week'
  if (weekStart === shiftWeek(current, 1)) return 'Next week'
  if (weekStart === shiftWeek(current, -1)) return 'Last week'
  return formatWeekRange(weekStart)
}
