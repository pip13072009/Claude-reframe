/** ISO date string, "yyyy-MM-dd" */
export type DateKey = string

export interface DrinkLog {
  id: string
  date: DateKey
  count: number
  note?: string
  loggedAt: string
}

export interface WeekPlan {
  /** Monday of the week, "yyyy-MM-dd" */
  weekStart: DateKey
  /** Planned drink count per day, keyed by date */
  targets: Record<DateKey, number>
  /** Optional overall cap for the week; if unset, sum of targets is used */
  weeklyCap?: number
}

export interface Settings {
  unitLabel: string
  defaultDailyTarget: number
  alcoholFreeGoalDays: number
}

export interface StoreData {
  version: 1
  weeks: Record<DateKey, WeekPlan>
  logs: DrinkLog[]
  settings: Settings
}

export const DEFAULT_SETTINGS: Settings = {
  unitLabel: 'drinks',
  defaultDailyTarget: 0,
  alcoholFreeGoalDays: 2,
}
