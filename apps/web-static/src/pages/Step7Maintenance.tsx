import React, { useEffect, useState } from 'react'
import type { MaintenanceForecast, ForecastEvent, MaintenanceNature, VehicleVersion } from '@autolaskin/domain'
import { useCalculator } from '../store/calculatorStore.js'
import LifetimeCostChart from '../components/LifetimeCostChart.js'
import { vehicles, maintenanceItems, computeMaintenanceForecast } from '@autolaskin/vehicle-catalog'

const NATURE_LABELS: Record<MaintenanceNature, string> = {
  scheduled: 'Määräaikaishuollot',
  wear_part: 'Kuluvat osat',
  known_fault: 'Tunnettuja riskejä / vikoja',
}

function formatEur(amount?: number): string {
  if (amount == null) return '–'
  return `${amount.toLocaleString('fi-FI')} €`
}

function EventRow({ event }: { event: ForecastEvent }) {
  const costRange = event.estimatedCostMinEur != null && event.estimatedCostMaxEur != null
    ? `${formatEur(event.estimatedCostMinEur)} – ${formatEur(event.estimatedCostMaxEur)}`
    : formatEur(event.estimatedCostEur)

  return (
    <tr style={{ background: event.isUncertain ? '#fffbe6' : 'white' }}>
      <td style={{ padding: '6px 10px' }}>
        {event.label}
        {event.isUncertain && <span style={{ color: '#856404', fontSize: '0.8rem', marginLeft: '6px' }}>⚠ epävarma</span>}
      </td>
      <td style={{ padding: '6px 10px' }}>{event.estimatedAtKm ? `${event.estimatedAtKm.toLocaleString('fi-FI')} km` : '–'}</td>
      <td style={{ padding: '6px 10px' }}>{event.estimatedAtDate ?? '–'}</td>
      <td style={{ padding: '6px 10px' }}>{costRange}</td>
      {event.evidenceLevel && (
        <td style={{ padding: '6px 10px', color: '#888', fontSize: '0.85rem' }}>{event.evidenceLevel}</td>
      )}
    </tr>
  )
}

function Section({ nature, events }: { nature: MaintenanceNature; events: ForecastEvent[] }) {
  if (events.length === 0) return null
  const hasEvidenceLevel = events.some(e => e.evidenceLevel)
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3>{NATURE_LABELS[nature]}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #ccc' }}>Toimenpide</th>
            <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #ccc' }}>Arvioitu km</th>
            <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #ccc' }}>Arvioitu pvm</th>
            <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #ccc' }}>Kustannus (arvio)</th>
            {hasEvidenceLevel && <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #ccc' }}>Näyttö</th>}
          </tr>
        </thead>
        <tbody>
          {events.map((e, i) => <EventRow key={`${e.maintenanceItemId}-${i}`} event={e} />)}
        </tbody>
      </table>
    </div>
  )
}

export default function Step7Maintenance() {
  const { state, dispatch } = useCalculator()
  const vehicleId = state.selectedVehicleVersionId
  const forecast = state.maintenanceForecast
  const [vehicle, setVehicle] = useState<VehicleVersion | null>(null)

  const p = state.drivingProfile

  useEffect(() => {
    if (!vehicleId) return
    const found = vehicles.find(v => v.id === vehicleId)
    if (!found) return
    const computed = computeMaintenanceForecast(found, p, maintenanceItems)
    dispatch({ type: 'SET_MAINTENANCE_FORECAST', forecast: computed })
    setVehicle(found)
  }, [vehicleId, p])

  if (!vehicleId) {
    return (
      <div>
        <h2>Huoltokustannusennuste</h2>
        <p style={{ color: '#c00', background: '#fff3cd', padding: '10px', borderRadius: '4px' }}>
          ⚠ Valitse ensin ajoneuvo vaiheessa 5.
        </p>
      </div>
    )
  }

  if (!forecast) {
    return (
      <div>
        <h2>Huoltokustannusennuste</h2>
        <p>Ladataan ennustetta...</p>
      </div>
    )
  }

  const scheduled = forecast.events.filter(e => e.nature === 'scheduled')
  const wear = forecast.events.filter(e => e.nature === 'wear_part')
  const faults = forecast.events.filter(e => e.nature === 'known_fault')

  return (
    <div>
      <h2>Huoltokustannusennuste</h2>
      <p style={{ color: '#555', marginBottom: '12px' }}>
        Ajoneuvo: <strong>{forecast.vehicleVersionId}</strong> |
        Omistusaika: <strong>{p.ownershipYears} v</strong> |
        Vuosikilometrit: <strong>{p.annualKm.toLocaleString('fi-FI')} km</strong> |
        Ennuste päättyy: <strong>{forecast.forecastEndDate}</strong> ({forecast.forecastEndKm.toLocaleString('fi-FI')} km)
      </p>

      {vehicle && (
        <div style={{ marginBottom: '28px' }}>
          <LifetimeCostChart
            vehicle={vehicle}
            forecast={forecast}
            annualKm={p.annualKm}
            ownershipYears={p.ownershipYears}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ padding: '12px 20px', background: '#e8f4fd', borderRadius: '6px', minWidth: '150px' }}>
          <div style={{ fontSize: '0.85rem', color: '#555' }}>Huollot yhteensä</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0066cc' }}>{formatEur(forecast.totalScheduledEur)}</div>
        </div>
        <div style={{ padding: '12px 20px', background: '#fff3e0', borderRadius: '6px', minWidth: '150px' }}>
          <div style={{ fontSize: '0.85rem', color: '#555' }}>Kuluvat osat yhteensä</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#e65100' }}>{formatEur(forecast.totalWearEur)}</div>
        </div>
        <div style={{ padding: '12px 20px', background: '#f3e5f5', borderRadius: '6px', minWidth: '180px' }}>
          <div style={{ fontSize: '0.85rem', color: '#555' }}>Riskit (varovainen arvio)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#7b1fa2' }}>{formatEur(forecast.totalKnownFaultCautiousEur)}</div>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>Perusarvio: 0 €</div>
        </div>
      </div>

      <Section nature="scheduled" events={scheduled} />
      <Section nature="wear_part" events={wear} />

      {faults.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3>{NATURE_LABELS['known_fault']}</h3>
          <p style={{ color: '#856404', background: '#fff3cd', padding: '10px', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '10px' }}>
            ⚠ Alla listatut riskit ovat dokumentoituja vikoja, joita on raportoitu osalla ajoneuvoyksilöistä.
            Ne eivät koske kaikkia autoja. Kustannusarviot ovat epävarmoja. Perusarviossa näitä ei lasketa mukaan;
            varovaisessa arviossa min-kustannus lasketaan mukaan.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #ccc' }}>Riski / vika</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #ccc' }}>Kustannus (min–max)</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #ccc' }}>Näyttötaso</th>
              </tr>
            </thead>
            <tbody>
              {faults.map((e, i) => (
                <tr key={`${e.maintenanceItemId}-${i}`} style={{ background: '#fffbe6' }}>
                  <td style={{ padding: '6px 10px' }}>
                    {e.label}
                    <span style={{ color: '#856404', fontSize: '0.8rem', marginLeft: '6px' }}>⚠ epävarma</span>
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    {e.estimatedCostMinEur != null && e.estimatedCostMaxEur != null
                      ? `${formatEur(e.estimatedCostMinEur)} – ${formatEur(e.estimatedCostMaxEur)}`
                      : formatEur(e.estimatedCostEur)}
                  </td>
                  <td style={{ padding: '6px 10px', color: '#888', fontSize: '0.85rem' }}>{e.evidenceLevel ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
