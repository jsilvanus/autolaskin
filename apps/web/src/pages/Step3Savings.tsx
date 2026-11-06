import React from 'react'
import CellTable from '../components/CellTable.js'
import { useCalculator } from '../store/calculatorStore.js'

export default function Step3Savings() {
  const { state } = useCalculator()

  return (
    <div>
      <h2>Vaihe 3: Säästöt</h2>
      <p>Vertailu nykyisen ja uuden auton kustannusten välillä.</p>
      <CellTable
        cells={state.savings}
        computed={state.computed}
      />
    </div>
  )
}
