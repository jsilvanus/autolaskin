import React, { useEffect, useState } from 'react'
import { useCalculator } from '../store/calculatorStore.js'

interface VehicleSummary {
  id: string
  make: string
  model: string
  generation?: string
  years: number[]
  powertrain: string
  bodyStyle: string
  wltpKm?: number
  estimatedWinterKm?: number
  netKwh?: number
}

export default function Step5VehicleSelect() {
  const { state, dispatch } = useCalculator()
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/vehicles')
      .then(r => r.json())
      .then((data: VehicleSummary[]) => {
        setVehicles(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Ajoneuvojen lataus epäonnistui.')
        setLoading(false)
      })
  }, [])

  function selectVehicle(id: string) {
    dispatch({ type: 'SET_SELECTED_VEHICLE', vehicleVersionId: id })
  }

  const thStyle: React.CSSProperties = {
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: '2px solid #ccc',
    background: '#f5f5f5',
  }
  const tdStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px solid #eee',
  }

  if (loading) return <p>Ladataan ajoneuvoja...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <h2>Ajoneuvon valinta</h2>
      <p style={{ color: '#555', marginBottom: '16px' }}>
        Valitse vertailtava sähköauto listasta. Talviajomatka-arvio on sovelluksen laskelma (65 % WLTP-arvosta), ei virallinen arvo.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
          <thead>
            <tr>
              <th style={thStyle}>Merkki / Malli</th>
              <th style={thStyle}>Versio</th>
              <th style={thStyle}>Vuodet</th>
              <th style={thStyle}>Akku (netto kWh)</th>
              <th style={thStyle}>WLTP-matka (km)</th>
              <th style={thStyle}>Talvimatka-arvio* (km)</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(v => {
              const selected = state.selectedVehicleVersionId === v.id
              return (
                <tr
                  key={v.id}
                  style={{ background: selected ? '#e8f0fe' : 'white', cursor: 'pointer' }}
                  onClick={() => selectVehicle(v.id)}
                >
                  <td style={tdStyle}>{v.make} {v.model}</td>
                  <td style={tdStyle}>{v.generation ?? '–'}</td>
                  <td style={tdStyle}>{v.years[0]}–{v.years[v.years.length - 1]}</td>
                  <td style={tdStyle}>{v.netKwh ?? '–'}</td>
                  <td style={tdStyle}>{v.wltpKm ?? '–'}</td>
                  <td style={tdStyle}>{v.estimatedWinterKm ?? '–'}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={e => { e.stopPropagation(); selectVehicle(v.id) }}
                      style={{
                        padding: '4px 12px',
                        background: selected ? '#0066cc' : '#eee',
                        color: selected ? '#fff' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {selected ? '✓ Valittu' : 'Valitse'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '12px' }}>
        * Talvimatka-arvio = 65 % WLTP-arvosta. Sovelluksen laskelma, ei valmistajan ilmoittama arvo.
      </p>
      {state.selectedVehicleVersionId && (
        <p style={{ color: '#0066cc', marginTop: '12px' }}>
          ✓ Valittu: <strong>{state.selectedVehicleVersionId}</strong>. Siirry seuraavaan vaiheeseen tarkempaa analyysiä varten.
        </p>
      )}
    </div>
  )
}
