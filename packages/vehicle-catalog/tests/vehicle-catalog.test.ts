import { describe, it, expect } from 'vitest'
import type { VehicleVersion, DrivingProfile, SelectionCriterion, MaintenanceItem } from '@autolaskin/domain'
import { checkSuitability } from '../src/suitability.js'
import { computeMaintenanceForecast } from '../src/forecast.js'
import { vehicles } from '../src/data/vehicles.js'

// Helper: build a minimal vehicle for testing
function makeVehicle(overrides: Partial<VehicleVersion> = {}): VehicleVersion {
  return {
    id: 'test-vehicle',
    make: 'Test',
    model: 'Car',
    years: [2023],
    bodyStyle: 'suv',
    powertrain: 'ev',
    sourcesIds: [],
    ...overrides,
  }
}

function makeProfile(overrides: Partial<DrivingProfile> = {}): DrivingProfile {
  return {
    annualKm: 15000,
    typicalDailyKm: 50,
    drivingStyle: 'mixed',
    winterDriving: true,
    homeCharging: true,
    workCharging: false,
    publicCharging: false,
    ownershipYears: 5,
    currentOdometerKm: 0,
    ...overrides,
  }
}

// ---- Suitability tests ----

describe('checkSuitability', () => {
  it('mandatory criterion not met → mandatoryFailed > 0', () => {
    const vehicle = makeVehicle({ towing: { maxKg: 500, hasTowHook: true } })
    const criteria: SelectionCriterion[] = [
      {
        id: 'towing_capacity',
        label: 'Vetokyky (kg)',
        importance: 'mandatory',
        requiredValue: 1500,
        status: 'unknown',
      },
    ]
    const result = checkSuitability(vehicle, makeProfile(), criteria)
    expect(result.mandatoryFailed).toBeGreaterThan(0)
    expect(result.criteria[0].status).toBe('not_met')
  })

  it('important criterion not met → importantFailed > 0, mandatoryFailed unchanged', () => {
    const vehicle = makeVehicle({ towing: { maxKg: 500, hasTowHook: true } })
    const criteria: SelectionCriterion[] = [
      {
        id: 'towing_capacity',
        label: 'Vetokyky (kg)',
        importance: 'important',
        requiredValue: 1500,
        status: 'unknown',
      },
    ]
    const result = checkSuitability(vehicle, makeProfile(), criteria)
    expect(result.importantFailed).toBeGreaterThan(0)
    expect(result.mandatoryFailed).toBe(0)
  })

  it('unknown data → status unknown', () => {
    const vehicle = makeVehicle() // no towing data
    const criteria: SelectionCriterion[] = [
      {
        id: 'towing_capacity',
        label: 'Vetokyky (kg)',
        importance: 'mandatory',
        requiredValue: 1000,
        status: 'unknown',
      },
    ]
    const result = checkSuitability(vehicle, makeProfile(), criteria)
    expect(result.criteria[0].status).toBe('unknown')
    // Unknown must not be counted as met (mandatoryFailed should not count unknown as not_met either)
    expect(result.mandatoryFailed).toBe(0)
  })

  it('unknown status is never converted to met', () => {
    const vehicle = makeVehicle() // missing range data
    const criteria: SelectionCriterion[] = [
      {
        id: 'min_range_km',
        label: 'Vähimmäistoimintamatka',
        importance: 'desired',
        requiredValue: 400,
        status: 'unknown',
      },
    ]
    const result = checkSuitability(vehicle, makeProfile(), criteria)
    expect(result.criteria[0].status).toBe('unknown')
  })

  it('range adequacy: winter range below daily km * 1.2 → rangeAdequate false', () => {
    const vehicle = makeVehicle({
      range: {
        wltpKm: 400,
        estimatedSummerKm: 340,
        estimatedWinterKm: 100, // very low winter range
      },
    })
    const profile = makeProfile({ typicalDailyKm: 100, winterDriving: true })
    const result = checkSuitability(vehicle, profile, [])
    // required = 100 * 1.2 = 120, winter range = 100 → not adequate
    expect(result.rangeAdequate).toBe(false)
  })

  it('range adequacy: winter range above daily km * 1.2 → rangeAdequate true', () => {
    const vehicle = makeVehicle({
      range: {
        wltpKm: 491,
        estimatedSummerKm: 420,
        estimatedWinterKm: 319, // 65% of 491
      },
    })
    const profile = makeProfile({ typicalDailyKm: 50, winterDriving: true })
    const result = checkSuitability(vehicle, profile, [])
    // required = 50 * 1.2 = 60, winter range = 319 → adequate
    expect(result.rangeAdequate).toBe(true)
  })

  it('no typicalDailyKm → rangeAdequate undefined', () => {
    const vehicle = makeVehicle({ range: { wltpKm: 491, estimatedWinterKm: 319 } })
    const profile = makeProfile({ typicalDailyKm: undefined })
    const result = checkSuitability(vehicle, profile, [])
    expect(result.rangeAdequate).toBeUndefined()
  })
})

// ---- WLTP vs winter range sanity check ----

describe('vehicle data sanity', () => {
  it('winter range estimate is less than WLTP for all vehicles', () => {
    for (const v of vehicles) {
      if (v.range?.wltpKm != null && v.range?.estimatedWinterKm != null) {
        expect(v.range.estimatedWinterKm).toBeLessThan(v.range.wltpKm)
      }
    }
  })

  it('winter range is approximately 65% of WLTP (within 1km rounding)', () => {
    for (const v of vehicles) {
      if (v.range?.wltpKm != null && v.range?.estimatedWinterKm != null) {
        const expected = v.range.wltpKm * 0.65
        expect(Math.abs(v.range.estimatedWinterKm - expected)).toBeLessThanOrEqual(1)
      }
    }
  })
})

// ---- Forecast tests ----

function makeScheduledItem(overrides: Partial<MaintenanceItem> = {}): MaintenanceItem {
  return {
    id: 'annual-service',
    vehicleVersionIds: ['test-vehicle'],
    nature: 'scheduled',
    label: 'Vuosihuolto',
    intervalKm: 20000,
    intervalMonths: 12,
    firstAtKm: 20000,
    firstAtMonths: 12,
    estimatedCostEur: 150,
    estimatedCostMinEur: 100,
    estimatedCostMaxEur: 250,
    sourcesIds: [],
    ...overrides,
  }
}

describe('computeMaintenanceForecast', () => {
  it('scheduled items appear within the forecast window', () => {
    const vehicle = makeVehicle()
    const profile = makeProfile({ annualKm: 20000, ownershipYears: 3, currentOdometerKm: 0 })
    const items: MaintenanceItem[] = [makeScheduledItem()]
    const forecast = computeMaintenanceForecast(vehicle, profile, items, 0)

    const scheduledEvents = forecast.events.filter(e => e.nature === 'scheduled')
    expect(scheduledEvents.length).toBeGreaterThan(0)

    for (const ev of scheduledEvents) {
      if (ev.estimatedAtKm != null) {
        expect(ev.estimatedAtKm).toBeLessThanOrEqual(forecast.forecastEndKm)
      }
    }
  })

  it('km-based item: first occurrence at intervalKm from lastServiceKm', () => {
    const vehicle = makeVehicle()
    const profile = makeProfile({ annualKm: 20000, ownershipYears: 3, currentOdometerKm: 0 })
    const items: MaintenanceItem[] = [
      makeScheduledItem({ intervalKm: 20000, intervalMonths: undefined, firstAtMonths: undefined }),
    ]
    const forecast = computeMaintenanceForecast(vehicle, profile, items, 0)
    const events = forecast.events.filter(e => e.maintenanceItemId === 'annual-service')
    // First at 20000 km (lastServiceKm=0, interval=20000)
    expect(events[0].estimatedAtKm).toBe(20000)
  })

  it('app_estimate faults are excluded from totalKnownFaultBaseEur and totalKnownFaultCautiousEur', () => {
    const vehicle = makeVehicle()
    const profile = makeProfile()
    const items: MaintenanceItem[] = [
      {
        id: 'uncertain-fault',
        vehicleVersionIds: ['test-vehicle'],
        nature: 'known_fault',
        label: 'Epävarma vika',
        estimatedCostEur: 500,
        estimatedCostMinEur: 300,
        estimatedCostMaxEur: 800,
        evidenceLevel: 'app_estimate',
        sourcesIds: [],
      },
    ]
    const forecast = computeMaintenanceForecast(vehicle, profile, items, 0)
    expect(forecast.totalKnownFaultBaseEur).toBe(0)
    expect(forecast.totalKnownFaultCautiousEur).toBe(0)
  })

  it('single_report faults are excluded from totals', () => {
    const vehicle = makeVehicle()
    const profile = makeProfile()
    const items: MaintenanceItem[] = [
      {
        id: 'single-report-fault',
        vehicleVersionIds: ['test-vehicle'],
        nature: 'known_fault',
        label: 'Yksittäinen raportti',
        estimatedCostEur: 1000,
        estimatedCostMinEur: 700,
        estimatedCostMaxEur: 1500,
        evidenceLevel: 'single_report',
        sourcesIds: [],
      },
    ]
    const forecast = computeMaintenanceForecast(vehicle, profile, items, 0)
    expect(forecast.totalKnownFaultBaseEur).toBe(0)
    expect(forecast.totalKnownFaultCautiousEur).toBe(0)
  })

  it('repeated_observation fault appears in cautious total only (not base)', () => {
    const vehicle = makeVehicle()
    const profile = makeProfile()
    const minCost = 1500
    const items: MaintenanceItem[] = [
      {
        id: 'heat-pump',
        vehicleVersionIds: ['test-vehicle'],
        nature: 'known_fault',
        label: 'Lämpöpumpun vika',
        estimatedCostEur: 2000,
        estimatedCostMinEur: minCost,
        estimatedCostMaxEur: 3000,
        evidenceLevel: 'repeated_observation',
        sourcesIds: [],
      },
    ]
    const forecast = computeMaintenanceForecast(vehicle, profile, items, 0)
    expect(forecast.totalKnownFaultBaseEur).toBe(0)
    expect(forecast.totalKnownFaultCautiousEur).toBe(minCost)
  })

  it('recall fault appears in cautious total', () => {
    const vehicle = makeVehicle()
    const profile = makeProfile()
    const minCost = 0 // recall = covered by manufacturer
    const items: MaintenanceItem[] = [
      {
        id: 'recall-fault',
        vehicleVersionIds: ['test-vehicle'],
        nature: 'known_fault',
        label: 'Takaisinkutsu',
        estimatedCostEur: 0,
        estimatedCostMinEur: minCost,
        estimatedCostMaxEur: 0,
        evidenceLevel: 'recall',
        sourcesIds: [],
      },
    ]
    const forecast = computeMaintenanceForecast(vehicle, profile, items, 0)
    expect(forecast.totalKnownFaultCautiousEur).toBe(minCost)
    expect(forecast.totalKnownFaultBaseEur).toBe(0)
  })

  it('forecast end km = startKm + annualKm * ownershipYears', () => {
    const vehicle = makeVehicle()
    const profile = makeProfile({ annualKm: 15000, ownershipYears: 5, currentOdometerKm: 50000 })
    const forecast = computeMaintenanceForecast(vehicle, profile, [], 0)
    expect(forecast.forecastEndKm).toBe(50000 + 15000 * 5)
  })
})
