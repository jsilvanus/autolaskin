import React, { useState } from 'react'
import { useCalculator, type CalculatorState, defaultDrivingProfile } from '../store/calculatorStore.js'

const STORAGE_SAVES_KEY = 'autolaskin_saves'

interface SaveEntry {
  name: string
  savedAt: string
  data: object
}

type SavesMap = Record<string, SaveEntry>

function loadSaves(): SavesMap {
  try {
    const raw = localStorage.getItem(STORAGE_SAVES_KEY)
    if (raw) return JSON.parse(raw) as SavesMap
  } catch {
    // ignore
  }
  return {}
}

function persistSaves(saves: SavesMap) {
  localStorage.setItem(STORAGE_SAVES_KEY, JSON.stringify(saves))
}

interface Props {
  onClose: () => void
}

export default function SaveDialog({ onClose }: Props) {
  const { state, dispatch } = useCalculator()
  const [saves, setSaves] = useState<SavesMap>(loadSaves)
  const [saveName, setSaveName] = useState(state.name)
  const [status, setStatus] = useState<string | null>(null)

  function handleSave() {
    if (!saveName.trim()) return
    const key = saveName.trim()
    const entry: SaveEntry = {
      name: key,
      savedAt: new Date().toISOString(),
      data: {
        name: state.name,
        currentCar: state.currentCar,
        newCar: state.newCar,
        savings: state.savings,
        financing: state.financing,
        drivingProfile: state.drivingProfile,
        selectionCriteria: state.selectionCriteria,
        selectedVehicleVersionId: state.selectedVehicleVersionId,
        step: state.step,
      },
    }
    const updated = { ...saves, [key]: entry }
    persistSaves(updated)
    setSaves(updated)
    setStatus(`Tallennettu: "${key}"`)
  }

  function handleLoad(key: string) {
    const entry = saves[key]
    if (!entry) return
    const d = entry.data as Partial<CalculatorState>
    dispatch({
      type: 'LOAD_STATE',
      state: {
        name: d.name ?? entry.name,
        currentCar: d.currentCar!,
        newCar: d.newCar!,
        savings: d.savings!,
        financing: d.financing!,
        drivingProfile: d.drivingProfile ?? defaultDrivingProfile(),
        selectionCriteria: d.selectionCriteria ?? [],
        selectedVehicleVersionId: d.selectedVehicleVersionId ?? null,
        suitabilityResult: null,
        maintenanceForecast: null,
      },
    })
    onClose()
  }

  function handleDelete(key: string) {
    const updated = { ...saves }
    delete updated[key]
    persistSaves(updated)
    setSaves(updated)
  }

  const entries = Object.entries(saves)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', minWidth: '380px', maxWidth: '560px', width: '90%' }}>
        <h2 style={{ marginTop: 0 }}>Tallenna / Lataa laskelma</h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500 }}>
            Tallenna nykyinen laskelma nimellä:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="Laskelman nimi"
              style={{ flex: 1, padding: '8px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              style={{ padding: '8px 16px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Tallenna
            </button>
          </div>
          {status && <p style={{ color: 'green', fontSize: '0.9rem', marginTop: '6px' }}>{status}</p>}
        </div>

        <h3 style={{ marginBottom: '10px', fontSize: '1rem' }}>Tallennetut laskelmat</h3>
        {entries.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Ei tallennettuja laskelmia.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Nimi</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Tallennettu</th>
                <th style={{ padding: '6px 8px' }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, entry]) => (
                <tr key={key} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px 8px' }}>{entry.name}</td>
                  <td style={{ padding: '6px 8px', color: '#666', fontSize: '0.8rem' }}>
                    {new Date(entry.savedAt).toLocaleString('fi-FI')}
                  </td>
                  <td style={{ padding: '6px 8px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleLoad(key)}
                      style={{ padding: '4px 10px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Lataa
                    </button>
                    <button
                      onClick={() => handleDelete(key)}
                      style={{ padding: '4px 10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Poista
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px' }}>Sulje</button>
        </div>
      </div>
    </div>
  )
}
