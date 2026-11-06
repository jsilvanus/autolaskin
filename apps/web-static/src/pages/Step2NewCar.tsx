import React from 'react'
import CellTable from '../components/CellTable.js'
import { useCalculator } from '../store/calculatorStore.js'

export default function Step2NewCar() {
  const { state, dispatch } = useCalculator()

  function handleChange(id: string, value: number | undefined) {
    dispatch({ type: 'SET_CELL_VALUE', section: 'newCar', id, value })
  }

  return (
    <div>
      <h2>Vaihe 2: Uusi auto</h2>
      <p>Syötä suunnitellun uuden sähköauton tiedot.</p>
      <CellTable
        cells={state.newCar}
        computed={state.computed}
        onValueChange={handleChange}
      />
    </div>
  )
}
