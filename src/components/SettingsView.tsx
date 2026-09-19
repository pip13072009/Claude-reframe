import { useState } from 'react'
import { useStore } from '../store'

export function SettingsView() {
  const { data, updateSettings, resetAll } = useStore()
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-16 pt-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Preferences</h2>

        <div className="flex items-center justify-between gap-3 py-2">
          <label htmlFor="unit-label" className="text-sm text-slate-600">
            Unit label
          </label>
          <input
            id="unit-label"
            type="text"
            value={data.settings.unitLabel}
            onChange={(e) => updateSettings({ unitLabel: e.target.value })}
            className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm focus:border-violet-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 py-2">
          <label htmlFor="default-target" className="text-sm text-slate-600">
            Default daily target for new weeks
          </label>
          <input
            id="default-target"
            type="number"
            min={0}
            value={data.settings.defaultDailyTarget}
            onChange={(e) => updateSettings({ defaultDailyTarget: Number(e.target.value) })}
            className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm focus:border-violet-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 py-2">
          <label htmlFor="af-goal" className="text-sm text-slate-600">
            Alcohol-free day goal (per week)
          </label>
          <input
            id="af-goal"
            type="number"
            min={0}
            max={7}
            value={data.settings.alcoholFreeGoalDays}
            onChange={(e) => updateSettings({ alcoholFreeGoalDays: Number(e.target.value) })}
            className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm focus:border-violet-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5">
        <h2 className="mb-2 text-sm font-semibold text-rose-700">Danger zone</h2>
        <p className="mb-3 text-xs text-rose-500">
          Permanently deletes every plan and logged drink stored on this device.
        </p>
        {confirmReset ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                resetAll()
                setConfirmReset(false)
              }}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-500"
            >
              Confirm delete all data
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-100"
          >
            Reset all data
          </button>
        )}
      </div>

      <p className="px-1 text-center text-xs text-slate-300">
        Everything is stored locally in your browser. Nothing is sent anywhere.
      </p>
    </div>
  )
}
