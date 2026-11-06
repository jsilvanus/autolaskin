import React, { createContext, useContext, useReducer, useEffect, type Dispatch } from 'react'
import type { CellMap, DrivingProfile, SelectionCriterion, SuitabilityResult, MaintenanceForecast } from '@autolaskin/domain'
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
  drivingProfile: DrivingProfile
  selectionCriteria: SelectionCriterion[]
  selectedVehicleVersionId: string | null
  suitabilityResult: SuitabilityResult | null
  maintenanceForecast: MaintenanceForecast | null
}

type Action =
  | { type: 'SET_CELL_VALUE'; section: keyof Pick<CalculatorState, 'currentCar' | 'newCar' | 'savings' | 'financing'>; id: string; value: number | undefined }
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_STEP'; step: number }
  | { type: 'LOAD_STATE'; state: Omit<CalculatorState, 'computed' | 'step'> }
  | { type: 'SET_DRIVING_PROFILE'; profile: DrivingProfile }
  | { type: 'SET_SELECTION_CRITERIA'; criteria: SelectionCriterion[] }
  | { type: 'SET_SELECTED_VEHICLE'; vehicleVersionId: string | null }
  | { type: 'SET_SUITABILITY_RESULT'; result: SuitabilityResult | null }
  | { type: 'SET_MAINTENANCE_FORECAST'; forecast: MaintenanceForecast | null }

const STORAGE_KEY = 'autolaskin_state'

function buildAllCells(state: Pick<CalculatorState, 'currentCar' | 'newCar' | 'savings' | 'financing'>): CellMap {
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

export function defaultDrivingProfile(): DrivingProfile {
  return {
    annualKm: 15000,
    typicalDailyKm: 40,
    drivingStyle: 'mixed',
    winterDriving: true,
    homeCharging: true,
    workCharging: false,
    publicCharging: false,
    ownershipYears: 5,
    currentOdometerKm: 0,
  }
}

function buildDefaultBase() {
  const currentCar = createCurrentCarCells()
  const newCar = createNewCarCells('ev')
  const savings = createSavingsCells()
  const financing = createFinancingCells()
  return { name: 'Uusi laskelma', currentCar, newCar, savings, financing }
}

function buildDefaultState(): CalculatorState {
  const base = buildDefaultBase()
  const computed = computeAllCells(buildAllCells(base))
  return {
    ...base,
    computed,
    step: 1,
    drivingProfile: defaultDrivingProfile(),
    selectionCriteria: [],
    selectedVehicleVersionId: null,
    suitabilityResult: null,
    maintenanceForecast: null,
  }
}

function initialState(): CalculatorState {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      const base = buildDefaultBase()
      const merged: CalculatorState = {
        ...buildDefaultState(),
        ...base,
        ...parsed,
        step: parsed.step ?? 1,
        suitabilityResult: null,
        maintenanceForecast: null,
      }
      return recompute(merged)
    } catch {
      // ignore corrupt state
    }
  }
  return buildDefaultState()
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
    case 'SET_DRIVING_PROFILE':
      return { ...state, drivingProfile: action.profile }
    case 'SET_SELECTION_CRITERIA':
      return { ...state, selectionCriteria: action.criteria }
    case 'SET_SELECTED_VEHICLE':
      return { ...state, selectedVehicleVersionId: action.vehicleVersionId, suitabilityResult: null, maintenanceForecast: null }
    case 'SET_SUITABILITY_RESULT':
      return { ...state, suitabilityResult: action.result }
    case 'SET_MAINTENANCE_FORECAST':
      return { ...state, maintenanceForecast: action.forecast }
  }
}

interface ContextValue {
  state: CalculatorState
  dispatch: Dispatch<Action>
}

const CalculatorContext = createContext<ContextValue | null>(null)

export function CalculatorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)

  useEffect(() => {
    const toSave = {
      name: state.name,
      currentCar: state.currentCar,
      newCar: state.newCar,
      savings: state.savings,
      financing: state.financing,
      drivingProfile: state.drivingProfile,
      selectionCriteria: state.selectionCriteria,
      selectedVehicleVersionId: state.selectedVehicleVersionId,
      step: state.step,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  }, [state])

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
