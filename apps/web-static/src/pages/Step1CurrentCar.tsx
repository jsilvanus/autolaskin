import React from 'react'
import CellTable from '../components/CellTable.js'
import { useCalculator } from '../store/calculatorStore.js'

export default function Step1CurrentCar() {
  const { state, dispatch } = useCalculator()

  function handleChange(id: string, value: number | undefined) {
    dispatch({ type: 'SET_CELL_VALUE', section: 'currentCar', id, value })
  }

  return (
    <div>
      <h2>Vaihe 1: Nykyinen auto</h2>
      <p>Syötä nykyisen autosi tiedot. Laskennalliset solut lasketaan automaattisesti.</p>
      <CellTable
        cells={state.currentCar}
        computed={state.computed}
        onValueChange={handleChange}
      />
    </div>
  )
}
