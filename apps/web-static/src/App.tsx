import React, { useState } from 'react'
import { CalculatorProvider, useCalculator } from './store/calculatorStore.js'
import StepNav from './components/StepNav.js'
import SaveDialog from './components/SaveDialog.js'
import Step0DrivingProfile from './pages/Step0DrivingProfile.js'
import Step1CurrentCar from './pages/Step1CurrentCar.js'
import Step2NewCar from './pages/Step2NewCar.js'
import Step3Savings from './pages/Step3Savings.js'
import Step4Financing from './pages/Step4Financing.js'
import Step5VehicleSelect from './pages/Step5VehicleSelect.js'
import Step6Suitability from './pages/Step6Suitability.js'
import Step7Maintenance from './pages/Step7Maintenance.js'
import Summary from './pages/Summary.js'

function AppContent() {
  const { state, dispatch } = useCalculator()
  const [showSave, setShowSave] = useState(false)

  function renderStep() {
    switch (state.step) {
      case 0: return <Step0DrivingProfile />
      case 1: return <Step1CurrentCar />
      case 2: return <Step2NewCar />
      case 3: return <Step3Savings />
      case 4: return <Step4Financing />
      case 5: return <Step5VehicleSelect />
      case 6: return <Step6Suitability />
      case 7: return <Step7Maintenance />
      case 8: return <Summary />
      default: return <Step1CurrentCar />
    }
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🚗 Autolaskin</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            value={state.name}
            onChange={e => dispatch({ type: 'SET_NAME', name: e.target.value })}
            style={{ padding: '4px 8px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <button
            onClick={() => setShowSave(true)}
            style={{ padding: '6px 14px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Tallenna / Lataa
          </button>
        </div>
      </header>
      <StepNav />
      <main>{renderStep()}</main>
      {showSave && <SaveDialog onClose={() => setShowSave(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <CalculatorProvider>
      <AppContent />
    </CalculatorProvider>
  )
}
