import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { weekDays } from './lib/date'
import { loadStore, saveStore } from './lib/storage'
import type { DateKey, DrinkLog, Settings, StoreData, WeekPlan } from './types'

interface StoreApi {
  data: StoreData
  getWeekPlan: (weekStart: DateKey) => WeekPlan
  setDayTarget: (weekStart: DateKey, day: DateKey, target: number) => void
  applyTargetToWeek: (weekStart: DateKey, target: number) => void
  setWeeklyCap: (weekStart: DateKey, cap: number | undefined) => void
  logsForDay: (day: DateKey) => DrinkLog[]
  totalForDay: (day: DateKey) => number
  addDrink: (day: DateKey, count: number, note?: string) => void
  removeLastDrink: (day: DateKey) => void
  clearDay: (day: DateKey) => void
  updateSettings: (patch: Partial<Settings>) => void
  resetAll: () => void
}

const StoreContext = createContext<StoreApi | null>(null)

function emptyPlan(weekStart: DateKey, defaultDailyTarget = 0): WeekPlan {
  const targets: Record<DateKey, number> = {}
  if (defaultDailyTarget > 0) {
    for (const day of weekDays(weekStart)) targets[day] = defaultDailyTarget
  }
  return { weekStart, targets }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoreData>(() => loadStore())

  useEffect(() => {
    saveStore(data)
  }, [data])

  const getWeekPlan = useCallback(
    (weekStart: DateKey) =>
      data.weeks[weekStart] ?? emptyPlan(weekStart, data.settings.defaultDailyTarget),
    [data.weeks, data.settings.defaultDailyTarget],
  )

  const setDayTarget = useCallback(
    (weekStart: DateKey, day: DateKey, target: number) => {
      setData((prev) => {
        const plan = prev.weeks[weekStart] ?? emptyPlan(weekStart)
        return {
          ...prev,
          weeks: {
            ...prev.weeks,
            [weekStart]: {
              ...plan,
              targets: { ...plan.targets, [day]: Math.max(0, target) },
            },
          },
        }
      })
    },
    [],
  )

  const applyTargetToWeek = useCallback((weekStart: DateKey, target: number) => {
    setData((prev) => {
      const plan = prev.weeks[weekStart] ?? emptyPlan(weekStart)
      const targets: Record<DateKey, number> = { ...plan.targets }
      for (const day of weekDays(weekStart)) targets[day] = Math.max(0, target)
      return {
        ...prev,
        weeks: { ...prev.weeks, [weekStart]: { ...plan, targets } },
      }
    })
  }, [])

  const setWeeklyCap = useCallback((weekStart: DateKey, cap: number | undefined) => {
    setData((prev) => {
      const plan = prev.weeks[weekStart] ?? emptyPlan(weekStart)
      return {
        ...prev,
        weeks: { ...prev.weeks, [weekStart]: { ...plan, weeklyCap: cap } },
      }
    })
  }, [])

  const logsForDay = useCallback(
    (day: DateKey) => data.logs.filter((l) => l.date === day),
    [data.logs],
  )

  const totalForDay = useCallback(
    (day: DateKey) => data.logs.filter((l) => l.date === day).reduce((s, l) => s + l.count, 0),
    [data.logs],
  )

  const addDrink = useCallback((day: DateKey, count: number, note?: string) => {
    setData((prev) => {
      const entry: DrinkLog = {
        id: `${day}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: day,
        count,
        note,
        loggedAt: new Date().toISOString(),
      }
      return { ...prev, logs: [...prev.logs, entry] }
    })
  }, [])

  const removeLastDrink = useCallback((day: DateKey) => {
    setData((prev) => {
      const dayLogs = prev.logs.filter((l) => l.date === day)
      if (dayLogs.length === 0) return prev
      const last = dayLogs[dayLogs.length - 1]
      return { ...prev, logs: prev.logs.filter((l) => l.id !== last.id) }
    })
  }, [])

  const clearDay = useCallback((day: DateKey) => {
    setData((prev) => ({ ...prev, logs: prev.logs.filter((l) => l.date !== day) }))
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  }, [])

  const resetAll = useCallback(() => {
    setData({ version: 1, weeks: {}, logs: [], settings: data.settings })
  }, [data.settings])

  const value = useMemo<StoreApi>(
    () => ({
      data,
      getWeekPlan,
      setDayTarget,
      applyTargetToWeek,
      setWeeklyCap,
      logsForDay,
      totalForDay,
      addDrink,
      removeLastDrink,
      clearDay,
      updateSettings,
      resetAll,
    }),
    [
      data,
      getWeekPlan,
      setDayTarget,
      applyTargetToWeek,
      setWeeklyCap,
      logsForDay,
      totalForDay,
      addDrink,
      removeLastDrink,
      clearDay,
      updateSettings,
      resetAll,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
