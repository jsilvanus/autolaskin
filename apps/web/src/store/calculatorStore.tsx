import React, { createContext, useContext, useReducer, type Dispatch } from 'react'
import type { CellMap } from '@autolaskin/domain'
import {
  createCurrentCarCells,
  createNewCarCells,
  createSavingsCells,
  createFinancingCells,
  computeAllCells,
} from '@autolaskin/calculator'

export interface CalculatorState {
  name: string
  currentCar: CellMap
  newCar: CellMap
  savings: CellMap
  financing: CellMap
  computed: CellMap
  step: number
}

type Action =
  | { type: 'SET_CELL_VALUE'; section: keyof Pick<CalculatorState, 'currentCar' | 'newCar' | 'savings' | 'financing'>; id: string; value: number | undefined }
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_STEP'; step: number }
  | { type: 'LOAD_STATE'; state: Omit<CalculatorState, 'computed' | 'step'> }

function buildAllCells(state: Omit<CalculatorState, 'computed' | 'step'>): CellMap {
  return {
    ...state.currentCar,
    ...state.newCar,
    ...state.savings,
    ...state.financing,
  }
}

function recompute(state: CalculatorState): CalculatorState {
  const computed = computeAllCells(buildAllCells(state))
  return { ...state, computed }
}

function initialState(): CalculatorState {
  const currentCar = createCurrentCarCells()
  const newCar = createNewCarCells('ev')
  const savings = createSavingsCells()
  const financing = createFinancingCells()
  const base = { name: 'Uusi laskelma', currentCar, newCar, savings, financing }
  const computed = computeAllCells(buildAllCells(base))
  return { ...base, computed, step: 1 }
}

function reducer(state: CalculatorState, action: Action): CalculatorState {
  switch (action.type) {
    case 'SET_CELL_VALUE': {
      const section = state[action.section] as CellMap
      const updated = {
        ...state,
        [action.section]: {
          ...section,
          [action.id]: {
            ...section[action.id],
            userValue: action.value,
          },
        },
      }
      return recompute(updated)
    }
    case 'SET_NAME':
      return { ...state, name: action.name }
    case 'SET_STEP':
      return { ...state, step: action.step }
    case 'LOAD_STATE': {
      const loaded = { ...state, ...action.state }
      return recompute(loaded)
    }
  }
}

interface ContextValue {
  state: CalculatorState
  dispatch: Dispatch<Action>
}

const CalculatorContext = createContext<ContextValue | null>(null)

export function CalculatorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  return (
    <CalculatorContext.Provider value={{ state, dispatch }}>
      {children}
    </CalculatorContext.Provider>
  )
}

export function useCalculator(): ContextValue {
  const ctx = useContext(CalculatorContext)
  if (!ctx) throw new Error('useCalculator must be used within CalculatorProvider')
  return ctx
}
