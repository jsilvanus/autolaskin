import React from 'react'
import { useCalculator } from '../store/calculatorStore.js'

const STEPS = [
  { n: 0, label: 'Ajoprofiili' },
  { n: 1, label: 'Nykyinen auto' },
  { n: 2, label: 'Uusi auto' },
  { n: 3, label: 'Säästöt' },
  { n: 4, label: 'Rahoitus' },
  { n: 5, label: 'Autovalinta' },
  { n: 6, label: 'Soveltuvuus' },
  { n: 7, label: 'Huolto' },
  { n: 8, label: 'Yhteenveto' },
]

export default function StepNav() {
  const { state, dispatch } = useCalculator()

  return (
    <nav style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '2px solid #ccc', flexWrap: 'wrap' }}>
      {STEPS.map(s => (
        <button
          key={s.n}
          onClick={() => dispatch({ type: 'SET_STEP', step: s.n })}
          style={{
            padding: '8px 14px',
            border: 'none',
            borderBottom: state.step === s.n ? '3px solid #0066cc' : '3px solid transparent',
            background: 'none',
            cursor: 'pointer',
            fontWeight: state.step === s.n ? 'bold' : 'normal',
            color: state.step === s.n ? '#0066cc' : '#333',
            fontSize: '0.9rem',
          }}
        >
          {s.n}. {s.label}
        </button>
      ))}
    </nav>
  )
}
