import React from 'react'
import CellTable from '../components/CellTable.js'
import { useCalculator } from '../store/calculatorStore.js'

export default function Step4Financing() {
  const { state, dispatch } = useCalculator()

  function handleChange(id: string, value: number | undefined) {
    dispatch({ type: 'SET_CELL_VALUE', section: 'financing', id, value })
  }

  return (
    <div>
      <h2>Vaihe 4: Rahoitus</h2>
      <p>Laske enimmäishankintahinta säästöjen ja rahoituksen perusteella.</p>
      <CellTable
        cells={state.financing}
        computed={state.computed}
        onValueChange={handleChange}
      />
    </div>
  )
}
