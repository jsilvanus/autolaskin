import React, { useState } from 'react'
import type { SelectionCriterion, CriterionImportance } from '@autolaskin/domain'
import { useCalculator } from '../store/calculatorStore.js'

const IMPORTANCE_LABELS: Record<CriterionImportance, string> = {
  mandatory: 'Pakollinen',
  important: 'Tärkeä',
  desired: 'Toivottava',
}

const STATUS_COLORS: Record<string, string> = {
  met: '#28a745',
  not_met: '#dc3545',
  unknown: '#888',
}

const STATUS_LABELS: Record<string, string> = {
  met: '✓ Täyttyy',
  not_met: '✗ Ei täyty',
  unknown: '? Tuntematon',
}

let nextId = 1

export default function Step6Suitability() {
  const { state, dispatch } = useCalculator()
  const [newLabel, setNewLabel] = useState('')
  const [newImportance, setNewImportance] = useState<CriterionImportance>('important')
  const [newRequired, setNewRequired] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const criteria = state.selectionCriteria
  const result = state.suitabilityResult
  const vehicleId = state.selectedVehicleVersionId

  function addCriterion() {
    if (!newLabel.trim()) return
    const criterion: SelectionCriterion = {
      id: `user-${nextId++}`,
      label: newLabel,
      importance: newImportance,
      requiredValue: newRequired || undefined,
      status: 'unknown',
    }
    dispatch({ type: 'SET_SELECTION_CRITERIA', criteria: [...criteria, criterion] })
    setNewLabel('')
    setNewRequired('')
  }

  function removeCriterion(id: string) {
    dispatch({ type: 'SET_SELECTION_CRITERIA', criteria: criteria.filter(c => c.id !== id) })
  }

  async function checkSuitability() {
    if (!vehicleId) return
    setLoading(true)
    setError(null)
    try {
      const p = state.drivingProfile
      // Fetch vehicle data and compute suitability client-side
      const vehicleRes = await fetch(`/api/v1/vehicles/${vehicleId}`)
      if (!vehicleRes.ok) throw new Error('Ajoneuvon tietojen lataus epäonnistui')
      const vehicle = await vehicleRes.json()

      // Inline suitability check in the browser using domain logic
      // (vehicle-catalog package not bundled in web for now — use API directly)
      // For now we call a simplified check
      const results = criteria.map(c => {
        let status: 'met' | 'not_met' | 'unknown' = 'unknown'
        let vehicleValue: string | number | undefined

        if (c.id === 'towing_capacity' && c.requiredValue != null) {
          const val = vehicle.towing?.maxKg
          if (val == null) { status = 'unknown' } else {
            vehicleValue = val
            status = val >= Number(c.requiredValue) ? 'met' : 'not_met'
          }
        } else if (c.id === 'min_range_km' && c.requiredValue != null) {
          const val = vehicle.range?.wltpKm
          if (val == null) { status = 'unknown' } else {
            vehicleValue = val
            status = val >= Number(c.requiredValue) ? 'met' : 'not_met'
          }
        } else if (c.id === 'min_seats' && c.requiredValue != null) {
          const val = vehicle.seatsMax
          if (val == null) { status = 'unknown' } else {
            vehicleValue = val
            status = val >= Number(c.requiredValue) ? 'met' : 'not_met'
          }
        } else if (c.id === 'min_dc_charging_kw' && c.requiredValue != null) {
          const val = vehicle.charging?.dcMaxKw
          if (val == null) { status = 'unknown' } else {
            vehicleValue = val
            status = val >= Number(c.requiredValue) ? 'met' : 'not_met'
          }
        } else if (c.id === 'tow_hook') {
          const val = vehicle.towing?.hasTowHook
          if (val == null) { status = 'unknown' } else {
            vehicleValue = String(val)
            status = val ? 'met' : 'not_met'
          }
        } else {
          status = 'unknown'
        }

        return { criterionId: c.id, status, vehicleValue }
      })

      const mandatoryFailed = results.filter((r, i) => r.status === 'not_met' && criteria[i].importance === 'mandatory').length
      const importantFailed = results.filter((r, i) => r.status === 'not_met' && criteria[i].importance === 'important').length

      // Range adequacy
      let rangeAdequate: boolean | undefined
      if (p.typicalDailyKm) {
        const required = p.typicalDailyKm * 1.2
        if (p.winterDriving && vehicle.range?.estimatedWinterKm != null) {
          rangeAdequate = vehicle.range.estimatedWinterKm >= required
        } else if (vehicle.range?.estimatedSummerKm != null) {
          rangeAdequate = vehicle.range.estimatedSummerKm >= required
        }
      }

      dispatch({
        type: 'SET_SUITABILITY_RESULT',
        result: { vehicleVersionId: vehicleId, criteria: results, mandatoryFailed, importantFailed, rangeAdequate },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Virhe')
    } finally {
      setLoading(false)
    }
  }

  const grouped = {
    mandatory: criteria.filter(c => c.importance === 'mandatory'),
    important: criteria.filter(c => c.importance === 'important'),
    desired: criteria.filter(c => c.importance === 'desired'),
  }

  function getResultForCriterion(id: string) {
    return result?.criteria.find(r => r.criterionId === id)
  }

  return (
    <div>
      <h2>Soveltuvuusarvio</h2>

      {!vehicleId && (
        <p style={{ color: '#c00', background: '#fff3cd', padding: '10px', borderRadius: '4px' }}>
          ⚠ Valitse ensin ajoneuvo edellisessä vaiheessa.
        </p>
      )}

      <h3>Valintakriteerit</h3>
      <p style={{ color: '#555', fontSize: '0.9rem' }}>
        Lisää kriteerit ja tarkista, täyttääkö valittu ajoneuvo ne. Tunnettujen kriteerien tunnisteet:
        <code> towing_capacity</code>, <code>min_range_km</code>, <code>min_seats</code>,
        <code>min_dc_charging_kw</code>, <code>tow_hook</code>.
      </p>

      {(['mandatory', 'important', 'desired'] as CriterionImportance[]).map(importance => (
        <div key={importance} style={{ marginBottom: '16px' }}>
          <h4 style={{ marginBottom: '8px', color: importance === 'mandatory' ? '#c00' : importance === 'important' ? '#c60' : '#555' }}>
            {IMPORTANCE_LABELS[importance]}
          </h4>
          {grouped[importance].length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Ei kriteereitä</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #ccc' }}>Kriteeri</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #ccc' }}>Vaatimus</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #ccc' }}>Ajoneuvon arvo</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #ccc' }}>Tila</th>
                  <th style={{ padding: '4px 8px', borderBottom: '1px solid #ccc' }}></th>
                </tr>
              </thead>
              <tbody>
                {grouped[importance].map(c => {
                  const r = getResultForCriterion(c.id)
                  return (
                    <tr key={c.id}>
                      <td style={{ padding: '4px 8px' }}>{c.label} <small style={{ color: '#888' }}>({c.id})</small></td>
                      <td style={{ padding: '4px 8px' }}>{c.requiredValue ?? '–'}</td>
                      <td style={{ padding: '4px 8px' }}>{r?.vehicleValue ?? '–'}</td>
                      <td style={{ padding: '4px 8px', color: r ? STATUS_COLORS[r.status] : '#888', fontWeight: 'bold' }}>
                        {r ? STATUS_LABELS[r.status] : '–'}
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <button
                          onClick={() => removeCriterion(c.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c00' }}
                        >✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px', padding: '12px', background: '#f9f9f9', borderRadius: '4px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Kriteeri (tunniste)</label>
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="esim. towing_capacity"
            style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Tärkeys</label>
          <select
            value={newImportance}
            onChange={e => setNewImportance(e.target.value as CriterionImportance)}
            style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            <option value="mandatory">Pakollinen</option>
            <option value="important">Tärkeä</option>
            <option value="desired">Toivottava</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Vaadittu arvo</label>
          <input
            value={newRequired}
            onChange={e => setNewRequired(e.target.value)}
            placeholder="esim. 1500"
            style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px', width: '100px' }}
          />
        </div>
        <button
          onClick={addCriterion}
          style={{ padding: '6px 16px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          + Lisää kriteeri
        </button>
      </div>

      {vehicleId && (
        <button
          onClick={checkSuitability}
          disabled={loading}
          style={{ padding: '8px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '16px' }}
        >
          {loading ? 'Tarkistetaan...' : 'Tarkista soveltuvuus'}
        </button>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {result && (
        <div style={{ marginTop: '16px', padding: '14px', background: '#f0f8ff', borderRadius: '6px', border: '1px solid #cce5ff' }}>
          <h3>Arviotulos – {result.vehicleVersionId}</h3>

          {result.rangeAdequate !== undefined && (
            <p style={{
              padding: '8px 12px',
              borderRadius: '4px',
              background: result.rangeAdequate ? '#d4edda' : '#f8d7da',
              color: result.rangeAdequate ? '#155724' : '#721c24',
              marginBottom: '10px',
            }}>
              {result.rangeAdequate
                ? '✓ Toimintamatka riittää päivittäiseen ajoon (1,2× päivämatka).'
                : '⚠ Toimintamatka saattaa olla riittämätön päivittäiseen ajoon talvella. Tarkista latausmahdollisuudet.'}
            </p>
          )}

          {result.mandatoryFailed > 0 && (
            <p style={{ color: '#dc3545', fontWeight: 'bold' }}>
              ✗ {result.mandatoryFailed} pakollinen kriteeri ei täyty – ajoneuvo ei sovellu.
            </p>
          )}
          {result.importantFailed > 0 && (
            <p style={{ color: '#856404' }}>
              ⚠ {result.importantFailed} tärkeä kriteeri ei täyty.
            </p>
          )}
          {result.mandatoryFailed === 0 && result.importantFailed === 0 && (
            <p style={{ color: '#155724' }}>
              ✓ Kaikki pakolliset ja tärkeät kriteerit täyttyvät.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
