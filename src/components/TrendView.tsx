import { addDays, format } from 'date-fns'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { fromKey, todayKey } from '../lib/date'
import { buildTrend, ROLLING_DAYS, type Granularity, type TrendPoint } from '../lib/trend'
import { useStore } from '../store'

const RANGES = [
  { weeks: 4, label: '4W' },
  { weeks: 12, label: '12W' },
  { weeks: 26, label: '6M' },
  { weeks: 52, label: '1Y' },
]

const GRANULARITIES: { id: Granularity; label: string }[] = [
  { id: 'day', label: 'Daily' },
  { id: 'week', label: 'Weekly' },
]

// Chart colours: actual uses the app's violet, the rolling average a contrasting orange,
// and the plan a neutral ink so it reads as a reference line rather than a data series.
const COLOR_ACTUAL = '#6250d6'
const COLOR_ROLLING = '#eb6834'
const COLOR_PLAN = '#334155'

const HEIGHT = 260
const MARGIN = { top: 16, right: 40, bottom: 28, left: 36 }

/** Round up to a tidy axis maximum that splits into 4 ticks */
function niceMax(value: number): number {
  if (value <= 0) return 4
  const rough = value / 4
  const mag = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].find((m) => m * mag >= rough)! * mag
  return step * 4
}

function formatTick(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

/** Bar path with rounded top corners, anchored square to the baseline */
function barPath(x: number, y: number, w: number, h: number): string {
  if (h <= 0) return ''
  const r = Math.min(4, w / 2, h)
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}

function periodLabel(p: TrendPoint, granularity: Granularity): string {
  const d = fromKey(p.key)
  if (granularity === 'day') return format(d, 'EEE d MMM')
  return `${format(d, 'd MMM')} – ${format(addDays(d, 6), 'd MMM')}`
}

export function TrendView() {
  const { data, getWeekPlan } = useStore()
  const [granularity, setGranularity] = useState<Granularity>('day')
  const [weeks, setWeeks] = useState(4)
  const [hover, setHover] = useState<number | null>(null)
  const [containerRef, width] = useWidth<HTMLDivElement>()

  const unit = data.settings.unitLabel
  const points = useMemo(
    () => buildTrend({ logs: data.logs, getWeekPlan, weeks, granularity, today: todayKey() }),
    [data.logs, getWeekPlan, weeks, granularity],
  )

  const perLabel = granularity === 'day' ? 'day' : 'week'
  const rollingLabel = granularity === 'day' ? `${ROLLING_DAYS.day}-day avg` : '4-week avg'
  const totalActual = points.reduce((s, p) => s + p.actual, 0)
  const totalPlan = points.reduce((s, p) => s + p.plan, 0)
  const latestRolling = [...points].reverse().find((p) => p.rolling !== null)?.rolling ?? null

  const innerW = Math.max(0, width - MARGIN.left - MARGIN.right)
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom
  const leftMax = niceMax(Math.max(0, ...points.map((p) => Math.max(p.actual, p.plan))))
  const rightMax = niceMax(Math.max(0, ...points.map((p) => p.rolling ?? 0)))
  const band = points.length > 0 ? innerW / points.length : 0
  const barW = Math.max(1, Math.min(28, band * 0.7 - 2))
  const yLeft = (v: number) => MARGIN.top + innerH - (v / leftMax) * innerH
  const yRight = (v: number) => MARGIN.top + innerH - (v / rightMax) * innerH
  const xCenter = (i: number) => MARGIN.left + band * (i + 0.5)
  const ticks = [0, 1, 2, 3, 4]

  // Plan as a step line: a flat segment across each period's band
  const planPath = points
    .map((p, i) => {
      const x0 = MARGIN.left + band * i
      const y = yLeft(p.plan).toFixed(1)
      return `${i === 0 ? `M${x0},${y}` : `V${y}`}H${(x0 + band).toFixed(1)}`
    })
    .join('')

  // Rolling average line, broken wherever there's no data yet
  let rollingPath = ''
  let penDown = false
  points.forEach((p, i) => {
    if (p.rolling === null) {
      penDown = false
      return
    }
    rollingPath += `${penDown ? 'L' : 'M'}${xCenter(i).toFixed(1)},${yRight(p.rolling).toFixed(1)}`
    penDown = true
  })

  // Thin x labels so they sit at least ~56px apart
  const labelEvery = Math.max(1, Math.ceil(56 / Math.max(band, 1)))
  const labelStep = granularity === 'day' ? Math.ceil(labelEvery / 7) * 7 : labelEvery
  const firstLabel = granularity === 'day' ? points.findIndex((p) => fromKey(p.key).getDay() === 1) : 0

  const hovered = hover !== null ? points[hover] : null
  const tooltipLeft = hover !== null ? Math.min(Math.max(xCenter(hover), 80), width - 80) : 0

  const segment = 'rounded-md px-2.5 py-1 text-xs font-medium transition'
  const segOn = 'bg-white text-violet-700 shadow-sm'
  const segOff = 'text-slate-500 hover:text-slate-700'

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-16 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-lg bg-slate-100 p-0.5">
          {GRANULARITIES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGranularity(g.id)}
              className={`${segment} ${granularity === g.id ? segOn : segOff}`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg bg-slate-100 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.weeks}
              type="button"
              onClick={() => setWeeks(r.weeks)}
              className={`${segment} ${weeks === r.weeks ? segOn : segOff}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-slate-200 bg-white py-3 shadow-sm">
          <div className="text-lg font-semibold tabular-nums text-slate-900">{totalActual}</div>
          <div className="text-[11px] text-slate-400">{unit} logged</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white py-3 shadow-sm">
          <div className="text-lg font-semibold tabular-nums text-slate-900">{totalPlan}</div>
          <div className="text-[11px] text-slate-400">{unit} planned</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white py-3 shadow-sm">
          <div className="text-lg font-semibold tabular-nums text-slate-900">
            {latestRolling === null ? '–' : latestRolling.toFixed(1)}
          </div>
          <div className="text-[11px] text-slate-400">
            {rollingLabel} / {perLabel}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-2.5 rounded-sm" style={{ background: COLOR_ACTUAL }} />
            Actual
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4" style={{ background: COLOR_PLAN }} />
            Plan
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded" style={{ background: COLOR_ROLLING }} />
            {rollingLabel} (right axis)
          </span>
          {granularity === 'week' && points.some((p) => p.partial) && (
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-2.5 rounded-sm"
                style={{ background: COLOR_ACTUAL, opacity: 0.4 }}
              />
              Week so far
            </span>
          )}
        </div>

        <div ref={containerRef} className="relative" onMouseLeave={() => setHover(null)}>
          {data.logs.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-center text-sm text-slate-400">
              Log some drinks and your trend will show up here.
            </div>
          ) : (
            width > 0 && (
              <svg
                width={width}
                height={HEIGHT}
                role="img"
                aria-label={`Actual ${unit} per ${perLabel} against plan, with ${rollingLabel}`}
                className="block"
              >
                {/* Grid + left axis */}
                {ticks.map((t) => {
                  const v = (leftMax / 4) * t
                  const y = yLeft(v)
                  return (
                    <g key={t}>
                      <line
                        x1={MARGIN.left}
                        x2={MARGIN.left + innerW}
                        y1={y}
                        y2={y}
                        stroke={t === 0 ? '#cbd5e1' : '#f1f5f9'}
                      />
                      <text x={MARGIN.left - 6} y={y} dy="0.32em" textAnchor="end" className="fill-slate-400 text-[10px] tabular-nums">
                        {formatTick(v)}
                      </text>
                      <text
                        x={MARGIN.left + innerW + 6}
                        y={yRight((rightMax / 4) * t)}
                        dy="0.32em"
                        className="fill-slate-400 text-[10px] tabular-nums"
                      >
                        {formatTick((rightMax / 4) * t)}
                      </text>
                    </g>
                  )
                })}
                {/* Right-axis colour key, so it's clear which line it belongs to */}
                <line
                  x1={MARGIN.left + innerW + 1}
                  x2={MARGIN.left + innerW + 1}
                  y1={MARGIN.top}
                  y2={MARGIN.top + innerH}
                  stroke={COLOR_ROLLING}
                  strokeOpacity={0.5}
                  strokeWidth={2}
                />
                <text x={0} y={MARGIN.top - 6} className="fill-slate-400 text-[10px]">
                  {unit}/{perLabel}
                </text>
                <text x={width} y={MARGIN.top - 6} textAnchor="end" className="fill-slate-400 text-[10px]">
                  avg
                </text>

                {/* Hover highlight */}
                {hover !== null && (
                  <rect
                    x={MARGIN.left + band * hover}
                    y={MARGIN.top}
                    width={band}
                    height={innerH}
                    className="fill-slate-100"
                  />
                )}

                {/* Actual bars */}
                {points.map((p, i) => {
                  const y = yLeft(p.actual)
                  return (
                    <path
                      key={p.key}
                      d={barPath(xCenter(i) - barW / 2, y, barW, MARGIN.top + innerH - y)}
                      fill={COLOR_ACTUAL}
                      opacity={p.partial ? 0.4 : 1}
                    />
                  )
                })}

                {/* Plan step line */}
                <path d={planPath} fill="none" stroke={COLOR_PLAN} strokeWidth={2} strokeDasharray="4 3" />

                {/* Rolling average */}
                <path
                  d={rollingPath}
                  fill="none"
                  stroke={COLOR_ROLLING}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {hovered && hovered.rolling !== null && (
                  <circle
                    cx={xCenter(hover!)}
                    cy={yRight(hovered.rolling)}
                    r={4}
                    fill={COLOR_ROLLING}
                    stroke="white"
                    strokeWidth={2}
                  />
                )}

                {/* X labels */}
                {points.map((p, i) =>
                  i >= Math.max(0, firstLabel) && (i - Math.max(0, firstLabel)) % labelStep === 0 ? (
                    <text
                      key={p.key}
                      x={xCenter(i)}
                      y={HEIGHT - 8}
                      textAnchor="middle"
                      className="fill-slate-400 text-[10px]"
                    >
                      {format(fromKey(p.key), 'd MMM')}
                    </text>
                  ) : null,
                )}

                {/* Hit targets: a full-height column per period */}
                {points.map((p, i) => (
                  <rect
                    key={p.key}
                    x={MARGIN.left + band * i}
                    y={MARGIN.top}
                    width={band}
                    height={innerH}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    onTouchStart={() => setHover(i)}
                  />
                ))}
              </svg>
            )
          )}

          {hovered && (
            <div
              className="pointer-events-none absolute top-0 z-10 w-40 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
              style={{ left: tooltipLeft }}
            >
              <div className="mb-1 font-semibold text-slate-800">
                {periodLabel(hovered, granularity)}
                {hovered.partial && <span className="font-normal text-slate-400"> (so far)</span>}
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-sm" style={{ background: COLOR_ACTUAL }} />
                  Actual
                </span>
                <span className="font-medium tabular-nums text-slate-900">{hovered.actual}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-2" style={{ background: COLOR_PLAN }} />
                  Plan
                </span>
                <span className="font-medium tabular-nums text-slate-900">{hovered.plan}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-2" style={{ background: COLOR_ROLLING }} />
                  {rollingLabel}
                </span>
                <span className="font-medium tabular-nums text-slate-900">
                  {hovered.rolling === null ? '–' : hovered.rolling.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        {granularity === 'day'
          ? `The ${rollingLabel} is your average ${unit} per day over the previous 7 days.`
          : `The ${rollingLabel} is your average ${unit} per week over the previous 28 days.`}
      </p>
    </div>
  )
}
