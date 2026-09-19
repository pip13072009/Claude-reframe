import { DEFAULT_SETTINGS, type StoreData } from '../types'

const STORAGE_KEY = 'drinks-tracker-v1'

function emptyStore(): StoreData {
  return {
    version: 1,
    weeks: {},
    logs: [],
    settings: { ...DEFAULT_SETTINGS },
  }
}

export function loadStore(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as Partial<StoreData>
    return {
      version: 1,
      weeks: parsed.weeks ?? {},
      logs: parsed.logs ?? [],
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    }
  } catch {
    return emptyStore()
  }
}

export function saveStore(data: StoreData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function clearStore(): void {
  localStorage.removeItem(STORAGE_KEY)
}
