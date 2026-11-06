export type PowertrainType = 'ice' | 'hybrid' | 'phev' | 'ev'

export interface Cell {
  id: string
  label: string
  unit?: string
  defaultValue?: number
  userValue?: number
  formula?: string
  result?: number
  error?: string
}

export type CellMap = Record<string, Cell>

export interface Calculation {
  name: string
  currentCar: CellMap
  newCar: CellMap
  savings: CellMap
  financing: CellMap
  createdAt: string
  updatedAt: string
}

export interface StorageEntry {
  name: string
  data: Calculation | null
  createdAt: string
  updatedAt: string
}

export interface StorageFile {
  version: 1
  calculations: Record<string, StorageEntry>
}
