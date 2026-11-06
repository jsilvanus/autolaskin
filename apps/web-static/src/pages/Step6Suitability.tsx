import React, { useState, useEffect } from 'react'
import type { SelectionCriterion, CriterionImportance } from '@autolaskin/domain'
import { useCalculator } from '../store/calculatorStore.js'
import { vehicles, checkSuitability } from '@autolaskin/vehicle-catalog'

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

  const criteria = state.selectionCriteria
  const result = state.suitabilityResult
  const vehicleId = state.selectedVehicleVersionId

  const vehicle = vehicleId ? vehicles.find(v => v.id === vehicleId) : undefined

  useEffect(() => {
    if (!vehicle) return
    const computed = checkSuitability(vehicle, state.drivingProfile, criteria)
    dispatch({ type: 'SET_SUITABILITY_RESULT', result: computed })
  }, [vehicleId, criteria, state.drivingProfile])

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
