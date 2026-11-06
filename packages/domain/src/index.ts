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

// Reliability level of a data source
export type SourceReliability = 'manufacturer' | 'official' | 'independent' | 'publication' | 'user_report' | 'app_estimate'

export interface SourceRef {
  id: string
  description: string
  url?: string
  retrievedAt: string
  reliability: SourceReliability
  appliesTo?: string[]  // model version ids
}

// Driving profile
export interface DrivingProfile {
  annualKm: number               // default 15000
  typicalDailyKm?: number
  drivingStyle: 'short_trips' | 'highway' | 'mixed'  // default 'mixed'
  winterDriving: boolean         // default true (Finland)
  homeCharging: boolean          // default true
  workCharging: boolean
  publicCharging: boolean
  ownershipYears: number         // default 5
  currentOdometerKm?: number
}

// Selection criterion
export type CriterionImportance = 'mandatory' | 'important' | 'desired'
export type CriterionStatus = 'met' | 'not_met' | 'unknown'

export interface SelectionCriterion {
  id: string
  label: string                  // Finnish label
  importance: CriterionImportance
  requiredValue?: string | number
  unit?: string
  status: CriterionStatus
  source?: string
  note?: string
}

// Vehicle catalog
export interface ChargingSpec {
  acMaxKw?: number
  dcMaxKw?: number
  connectorType?: string
}

export interface BatterySpec {
  grossKwh?: number
  netKwh?: number
  warrantyKm?: number
  warrantyYears?: number
}

export interface RangeSpec {
  wltpKm?: number               // official WLTP range
  estimatedSummerKm?: number    // app estimate
  estimatedWinterKm?: number    // app estimate (not same as WLTP!)
  consumptionWltpKwhPer100km?: number
}

export interface VehicleVersion {
  id: string                    // e.g. "tesla-model3-sr-2023"
  make: string
  model: string
  generation?: string
  years: number[]               // model years covered
  bodyStyle: string
  powertrain: PowertrainType
  battery?: BatterySpec
  range?: RangeSpec
  charging?: ChargingSpec
  motorConfig?: string          // e.g. "RWD", "AWD"
  towing?: { maxKg?: number; hasTowHook?: boolean }
  dimensions?: {
    lengthMm?: number; widthMm?: number; heightMm?: number
    wheelbaseMm?: number; cargoLitres?: number; clearanceMm?: number
  }
  seatsMax?: number
  sourcesIds: string[]
  notes?: string
}

// Suitability
export interface SuitabilityResult {
  vehicleVersionId: string
  criteria: Array<{
    criterionId: string
    status: CriterionStatus
    vehicleValue?: string | number
    note?: string
  }>
  mandatoryFailed: number
  importantFailed: number
  rangeAdequate?: boolean       // based on driving profile
}

// Maintenance data
export type MaintenanceNature = 'scheduled' | 'wear_part' | 'known_fault'
export type FaultEvidenceLevel = 'recall' | 'repeated_observation' | 'single_report' | 'app_estimate'

export interface MaintenanceItem {
  id: string
  vehicleVersionIds: string[]  // which versions this applies to
  nature: MaintenanceNature
  label: string                // Finnish
  intervalKm?: number
  intervalMonths?: number
  firstAtKm?: number           // first occurrence km
  firstAtMonths?: number
  estimatedCostEur?: number    // mid estimate
  estimatedCostMinEur?: number
  estimatedCostMaxEur?: number
  evidenceLevel?: FaultEvidenceLevel  // only for known_fault
  sourcesIds: string[]
  notes?: string
}

// Forecast
export interface ForecastEvent {
  maintenanceItemId: string
  label: string
  nature: MaintenanceNature
  estimatedAtKm?: number
  estimatedAtDate?: string     // ISO date
  estimatedCostEur?: number
  estimatedCostMinEur?: number
  estimatedCostMaxEur?: number
  evidenceLevel?: FaultEvidenceLevel
  isUncertain: boolean
}

export interface MaintenanceForecast {
  vehicleVersionId: string
  profile: DrivingProfile
  forecastEndKm: number
  forecastEndDate: string
  events: ForecastEvent[]
  totalScheduledEur: number    // sum of scheduled maintenance
  totalWearEur: number         // sum of wear parts (mid estimates)
  totalKnownFaultBaseEur: number    // base scenario (0 for unknown-prob faults)
  totalKnownFaultCautiousEur: number // cautious: min estimates for documented faults
}

export interface Calculation {
  name: string
  currentCar: CellMap
  newCar: CellMap
  savings: CellMap
  financing: CellMap
  drivingProfile?: DrivingProfile
  selectionCriteria?: SelectionCriterion[]
  selectedVehicleVersionId?: string
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
