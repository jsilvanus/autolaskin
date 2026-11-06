import React from 'react'
import { useCalculator } from '../store/calculatorStore.js'

const STEPS = [
  { n: 1, label: 'Nykyinen auto' },
  { n: 2, label: 'Uusi auto' },
  { n: 3, label: 'Säästöt' },
  { n: 4, label: 'Rahoitus' },
  { n: 5, label: 'Yhteenveto' },
]

export default function StepNav() {
  const { state, dispatch } = useCalculator()

  return (
    <nav style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '2px solid #ccc' }}>
      {STEPS.map(s => (
        <button
          key={s.n}
          onClick={() => dispatch({ type: 'SET_STEP', step: s.n })}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderBottom: state.step === s.n ? '3px solid #0066cc' : '3px solid transparent',
            background: 'none',
            cursor: 'pointer',
            fontWeight: state.step === s.n ? 'bold' : 'normal',
            color: state.step === s.n ? '#0066cc' : '#333',
          }}
        >
          {s.n}. {s.label}
        </button>
      ))}
    </nav>
  )
}
