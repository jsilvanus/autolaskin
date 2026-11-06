import React from 'react'
import type { DrivingProfile } from '@autolaskin/domain'
import { useCalculator } from '../store/calculatorStore.js'

export default function Step0DrivingProfile() {
  const { state, dispatch } = useCalculator()
  const p = state.drivingProfile

  function update(patch: Partial<DrivingProfile>) {
    dispatch({ type: 'SET_DRIVING_PROFILE', profile: { ...p, ...patch } })
  }

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '120px',
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
  }

  const labelStyle: React.CSSProperties = {
    minWidth: '220px',
    fontWeight: 500,
  }

  return (
    <div>
      <h2>Ajoprofiili</h2>
      <p style={{ color: '#555', marginBottom: '20px' }}>
        Täytä ajotottumuksesi tarkempaa soveltuvuusarviota ja huoltokustannusennustetta varten.
      </p>

      <div style={rowStyle}>
        <label style={labelStyle}>Vuosikilometrit (km)</label>
        <input
          type="number"
          style={inputStyle}
          value={p.annualKm}
          min={1000}
          max={100000}
          onChange={e => update({ annualKm: parseInt(e.target.value) || 15000 })}
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Tyypillinen päivämatka (km)</label>
        <input
          type="number"
          style={inputStyle}
          value={p.typicalDailyKm ?? ''}
          placeholder="esim. 40"
          min={0}
          onChange={e => update({ typicalDailyKm: e.target.value ? parseInt(e.target.value) : undefined })}
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Ajotapa</label>
        <div style={{ display: 'flex', gap: '16px' }}>
          {(['short_trips', 'mixed', 'highway'] as const).map(style => (
            <label key={style} style={{ cursor: 'pointer' }}>
              <input
                type="radio"
                name="drivingStyle"
                value={style}
                checked={p.drivingStyle === style}
                onChange={() => update({ drivingStyle: style })}
              />{' '}
              {style === 'short_trips' ? 'Lyhyet matkat' : style === 'mixed' ? 'Sekalainen' : 'Maantieajo'}
            </label>
          ))}
        </div>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={p.winterDriving}
            onChange={e => update({ winterDriving: e.target.checked })}
          />{' '}
          Talviajo (Suomi)
        </label>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={p.homeCharging}
            onChange={e => update({ homeCharging: e.target.checked })}
          />{' '}
          Kotilatauspiste käytössä
        </label>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={p.workCharging}
            onChange={e => update({ workCharging: e.target.checked })}
          />{' '}
          Työpaikan lataus käytössä
        </label>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={p.publicCharging}
            onChange={e => update({ publicCharging: e.target.checked })}
          />{' '}
          Julkinen lataus käytössä
        </label>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Omistusaika (vuosia)</label>
        <input
          type="number"
          style={inputStyle}
          value={p.ownershipYears}
          min={1}
          max={20}
          onChange={e => update({ ownershipYears: parseInt(e.target.value) || 5 })}
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Nykyinen mittarilukema (km)</label>
        <input
          type="number"
          style={inputStyle}
          value={p.currentOdometerKm ?? ''}
          placeholder="0"
          min={0}
          onChange={e => update({ currentOdometerKm: e.target.value ? parseInt(e.target.value) : undefined })}
        />
      </div>
    </div>
  )
}
