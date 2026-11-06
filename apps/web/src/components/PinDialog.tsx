import React, { useState } from 'react'
import { useCalculator } from '../store/calculatorStore.js'
import type { Calculation } from '@autolaskin/domain'

interface Props {
  onClose: () => void
}

export default function PinDialog({ onClose }: Props) {
  const { state, dispatch } = useCalculator()
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isValidPin = /^\d{6,8}$/.test(pin)

  async function handleSave() {
    if (!isValidPin) return
    setLoading(true)
    setStatus(null)
    try {
      const body: Calculation = {
        name: state.name,
        currentCar: state.currentCar,
        newCar: state.newCar,
        savings: state.savings,
        financing: state.financing,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const res = await fetch(`/api/v1/calculations/${pin}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json() as { error: string }
        setStatus(`Virhe: ${err.error}`)
      } else {
        setStatus('Tallennettu!')
      }
    } catch {
      setStatus('Verkkovirhe')
    } finally {
      setLoading(false)
    }
  }

  async function handleLoad() {
    if (!isValidPin) return
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch(`/api/v1/calculations/${pin}`)
      if (res.status === 404) {
        setStatus('PIN-koodilla ei löydy laskelmaa.')
        return
      }
      if (!res.ok) {
        const err = await res.json() as { error: string }
        setStatus(`Virhe: ${err.error}`)
        return
      }
      const entry = await res.json() as { data: Calculation | null; name: string }
      if (!entry.data) {
        setStatus('Laskelma on tyhjennetty.')
        return
      }
      dispatch({
        type: 'LOAD_STATE',
        state: {
          name: entry.name,
          currentCar: entry.data.currentCar,
          newCar: entry.data.newCar,
          savings: entry.data.savings,
          financing: entry.data.financing,
        },
      })
      setStatus('Ladattu!')
      setTimeout(onClose, 800)
    } catch {
      setStatus('Verkkovirhe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', minWidth: '320px' }}>
        <h2 style={{ marginTop: 0 }}>Tallenna / Lataa PIN-koodilla</h2>
        <p style={{ fontSize: '0.85rem', color: '#666' }}>
          PIN-koodi on 6–8 numeroa. Se toimii laskelman tunnisteena, ei salasanana.
        </p>
        <input
          type="text"
          inputMode="numeric"
          placeholder="123456"
          value={pin}
          onChange={e => setPin(e.target.value)}
          maxLength={8}
          style={{ width: '100%', padding: '8px', fontSize: '1.2rem', marginBottom: '12px', boxSizing: 'border-box' }}
        />
        {status && <p style={{ color: status.startsWith('Virhe') ? 'red' : 'green' }}>{status}</p>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={loading} style={{ padding: '8px 16px' }}>Peruuta</button>
          <button onClick={handleLoad} disabled={!isValidPin || loading} style={{ padding: '8px 16px' }}>Lataa</button>
          <button onClick={handleSave} disabled={!isValidPin || loading}
            style={{ padding: '8px 16px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px' }}>
            Tallenna
          </button>
        </div>
      </div>
    </div>
  )
}
