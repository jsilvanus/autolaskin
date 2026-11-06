import React, { useState } from 'react'
import type { MaintenanceForecast, ForecastEvent } from '@autolaskin/domain'
import type { VehicleVersion } from '@autolaskin/domain'

// ─── helpers ─────────────────────────────────────────────────────────────────

function eur(n: number): string {
  return n.toLocaleString('fi-FI', { maximumFractionDigits: 0 }) + ' €'
}

/** Compute residual value at end of each year (index 0 = purchase, index N = after N years). */
function computeResidualValues(purchasePrice: number, rates: number[], years: number): number[] {
  const values: number[] = [purchasePrice]
  for (let y = 1; y <= years; y++) {
    const rate = (rates[Math.min(y - 1, rates.length - 1)] ?? 6) / 100
    const residual = Math.max(0, values[y - 1]! - purchasePrice * rate)
    values.push(Math.round(residual))
  }
  return values
}

/** Sum maintenance costs per year from forecast events (by km → year). */
function maintenancePerYear(
  events: ForecastEvent[],
  annualKm: number,
  years: number,
): { scheduled: number[]; wear: number[] } {
  const scheduled = Array<number>(years).fill(0)
  const wear = Array<number>(years).fill(0)

  for (const ev of events) {
    if (ev.nature === 'known_fault') continue
    const km = ev.estimatedAtKm
    const cost = ev.estimatedCostEur ?? 0
    // determine which year bucket (1-based, clamped)
    let yearIdx: number
    if (km != null && annualKm > 0) {
      yearIdx = Math.min(Math.ceil(km / annualKm), years) - 1
    } else if (ev.estimatedAtDate) {
      const msPerYear = 365.25 * 24 * 3600 * 1000
      const diff = new Date(ev.estimatedAtDate).getTime() - Date.now()
      yearIdx = Math.min(Math.max(Math.floor(diff / msPerYear), 0), years - 1)
    } else {
      continue
    }
    if (ev.nature === 'scheduled') {
      scheduled[yearIdx] = (scheduled[yearIdx] ?? 0) + cost
    } else {
      wear[yearIdx] = (wear[yearIdx] ?? 0) + cost
    }
  }
  return { scheduled, wear }
}

// ─── SVG primitives ──────────────────────────────────────────────────────────

const PAD = { l: 68, r: 16, t: 20, b: 36 }
const W = 580
const H = 240
const plotW = W - PAD.l - PAD.r
const plotH = H - PAD.t - PAD.b

function xOf(year: number, totalYears: number) {
  return PAD.l + (year / totalYears) * plotW
}
function yOf(value: number, maxValue: number) {
  return PAD.t + plotH - (value / maxValue) * plotH
}

function GridLines({ maxValue, years }: { maxValue: number; years: number }) {
  const ticks = 4
  return (
    <>
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const v = (maxValue * i) / ticks
        const y = yOf(v, maxValue)
        return (
          <g key={i}>
            <line x1={PAD.l} y1={y} x2={PAD.l + plotW} y2={y} stroke="#e5e7eb" strokeWidth="1" />
            <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize="11" fill="#6b7280">
              {v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}
            </text>
          </g>
        )
      })}
      {Array.from({ length: years + 1 }, (_, i) => {
        const x = xOf(i, years)
        return (
          <g key={i}>
            <line x1={x} y1={PAD.t} x2={x} y2={PAD.t + plotH} stroke="#f3f4f6" strokeWidth="1" />
            <text x={x} y={PAD.t + plotH + 16} textAnchor="middle" fontSize="11" fill="#6b7280">
              {i === 0 ? 'Hankinta' : `v${i}`}
            </text>
          </g>
        )
      })}
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + plotH} stroke="#d1d5db" strokeWidth="1" />
      <line x1={PAD.l} y1={PAD.t + plotH} x2={PAD.l + plotW} y2={PAD.t + plotH} stroke="#d1d5db" strokeWidth="1" />
    </>
  )
}

// ─── Depreciation line chart ──────────────────────────────────────────────────

function DepreciationChart({
  residuals,
  purchasePrice,
  years,
}: {
  residuals: number[]
  purchasePrice: number
  years: number
}) {
  const pts = residuals.map((v, i) => `${xOf(i, years)},${yOf(v, purchasePrice)}`).join(' ')
  const area = [
    `${xOf(0, years)},${yOf(0, purchasePrice)}`,
    ...residuals.map((v, i) => `${xOf(i, years)},${yOf(v, purchasePrice)}`),
    `${xOf(years, years)},${yOf(0, purchasePrice)}`,
  ].join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} aria-label="Arvonalenemakaavio">
      <GridLines maxValue={purchasePrice} years={years} />
      <polygon points={area} fill="#dbeafe" opacity="0.5" />
      <polyline points={pts} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
      {residuals.map((v, i) => (
        <circle key={i} cx={xOf(i, years)} cy={yOf(v, purchasePrice)} r="4" fill="#2563eb">
          <title>{i === 0 ? `Hankintahinta: ${eur(v)}` : `Vuosi ${i}: ${eur(v)}`}</title>
        </circle>
      ))}
      {/* Y axis label */}
      <text
        x={10} y={PAD.t + plotH / 2}
        textAnchor="middle" fontSize="11" fill="#6b7280"
        transform={`rotate(-90, 10, ${PAD.t + plotH / 2})`}
      >
        Arvo (€)
      </text>
    </svg>
  )
}

// ─── Maintenance stacked bar chart ───────────────────────────────────────────

function MaintenanceChart({
  scheduled,
  wear,
  years,
}: {
  scheduled: number[]
  wear: number[]
  years: number
}) {
  const totals = scheduled.map((s, i) => s + (wear[i] ?? 0))
  const maxVal = Math.max(...totals, 500) // at least 500 € axis

  const barWidth = Math.max(8, (plotW / years) * 0.55)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} aria-label="Huoltokustannuskaavio">
      <GridLines maxValue={maxVal} years={years} />
      {Array.from({ length: years }, (_, i) => {
        const cx = xOf(i + 0.5, years) // centre of each year gap
        const s = scheduled[i] ?? 0
        const w = wear[i] ?? 0

        const yWearBottom = yOf(0, maxVal)
        const yWearTop = yOf(w, maxVal)
        const ySchBottom = yOf(w, maxVal)
        const ySchTop = yOf(s + w, maxVal)

        return (
          <g key={i}>
            {w > 0 && (
              <rect
                x={cx - barWidth / 2} y={yWearTop}
                width={barWidth} height={yWearBottom - yWearTop}
                fill="#fb923c"
              >
                <title>{`Vuosi ${i + 1} – kuluvat osat: ${eur(w)}`}</title>
              </rect>
            )}
            {s > 0 && (
              <rect
                x={cx - barWidth / 2} y={ySchTop}
                width={barWidth} height={ySchBottom - ySchTop}
                fill="#60a5fa"
              >
                <title>{`Vuosi ${i + 1} – huollot: ${eur(s)}`}</title>
              </rect>
            )}
          </g>
        )
      })}
      {/* Y axis label */}
      <text
        x={10} y={PAD.t + plotH / 2}
        textAnchor="middle" fontSize="11" fill="#6b7280"
        transform={`rotate(-90, 10, ${PAD.t + plotH / 2})`}
      >
        Kustannus (€)
      </text>
    </svg>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.82rem', color: '#374151', marginTop: '4px' }}>
      {items.map(({ color, label }) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '2px', background: color }} />
          {label}
        </span>
      ))}
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface Props {
  vehicle: VehicleVersion
  forecast: MaintenanceForecast
  annualKm: number
  ownershipYears: number
}

export default function LifetimeCostChart({ vehicle, forecast, annualKm, ownershipYears }: Props) {
  const [purchasePrice, setPurchasePrice] = useState<number>(35000)

  const rates = vehicle.depreciationRatesPercent ?? [25, 15, 12, 10, 8, 7, 6]
  const residuals = computeResidualValues(purchasePrice, rates, ownershipYears)
  const totalDepreciation = purchasePrice - residuals[ownershipYears]!
  const { scheduled, wear } = maintenancePerYear(forecast.events, annualKm, ownershipYears)
  const totalMaintenance = forecast.totalScheduledEur + forecast.totalWearEur

  const chartBox: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    flex: '1 1 480px',
    minWidth: 0,
  }

  return (
    <div>
      <h3 style={{ marginBottom: '8px' }}>Elinkaarikaaviot</h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '0.9rem', color: '#374151' }}>
          Hankintahinta (€):
          <input
            type="number"
            min={1000}
            step={500}
            value={purchasePrice}
            onChange={e => setPurchasePrice(Math.max(1000, Number(e.target.value)))}
            style={{ marginLeft: '8px', width: '110px', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.9rem' }}
          />
        </label>
        <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
          Arvonalenema {ownershipYears} v: <strong>{eur(totalDepreciation)}</strong>
          {' · '}
          Huollot yhteensä: <strong>{eur(totalMaintenance)}</strong>
          {' · '}
          Yht. {eur(totalDepreciation + totalMaintenance)}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={chartBox}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px', color: '#1e3a5f' }}>
            a) Arvioitu jälleenmyyntiarvo
          </div>
          <Legend items={[{ color: '#2563eb', label: 'Jälleenmyyntiarvo (arvio)' }]} />
          <DepreciationChart residuals={residuals} purchasePrice={purchasePrice} years={ownershipYears} />
          <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '4px 0 0' }}>
            Arvio perustuu mallikohtaisiin vuosittaisiin arvonalenemaprosentteihin (sovelluksen arvio, ei tae).
          </p>
        </div>

        <div style={chartBox}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px', color: '#1e3a5f' }}>
            b) Arvioidut huoltokustannukset vuosittain
          </div>
          <Legend items={[
            { color: '#60a5fa', label: 'Määräaikaishuollot' },
            { color: '#fb923c', label: 'Kuluvat osat' },
          ]} />
          <MaintenanceChart scheduled={scheduled} wear={wear} years={ownershipYears} />
          <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '4px 0 0' }}>
            Tunnetut riskiviat eivät sisälly palkkeihin (katso taulukot alla).
          </p>
        </div>
      </div>
    </div>
  )
}
