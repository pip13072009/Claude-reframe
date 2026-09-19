import { useState } from 'react'
import { HistoryView } from './components/HistoryView'
import { SettingsView } from './components/SettingsView'
import { WeekView } from './components/WeekView'
import { StoreProvider } from './store'

type Tab = 'plan' | 'history' | 'settings'

const TABS: { id: Tab; label: string }[] = [
  { id: 'plan', label: 'This Week' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]

function App() {
  const [tab, setTab] = useState<Tab>('plan')

  return (
    <StoreProvider>
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Tally</h1>
              <p className="text-xs text-slate-400">Plan your week. Track how it goes.</p>
            </div>
          </div>
          <nav className="mx-auto flex w-full max-w-2xl gap-1 px-4">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`relative px-3 pb-3 text-sm font-medium transition ${
                  tab === t.id ? 'text-violet-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t.label}
                {tab === t.id && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-violet-600" />
                )}
              </button>
            ))}
          </nav>
        </header>

        <main>
          {tab === 'plan' && <WeekView />}
          {tab === 'history' && <HistoryView />}
          {tab === 'settings' && <SettingsView />}
        </main>
      </div>
    </StoreProvider>
  )
}

export default App
