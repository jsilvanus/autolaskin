import type {
  VehicleVersion,
  DrivingProfile,
  SelectionCriterion,
  SuitabilityResult,
  CriterionStatus,
} from '@autolaskin/domain'

function checkRangeAdequacy(vehicle: VehicleVersion, profile: DrivingProfile): boolean | undefined {
  if (!profile.typicalDailyKm) return undefined

  const required = profile.typicalDailyKm * 1.2

  if (profile.winterDriving && vehicle.range?.estimatedWinterKm != null) {
    return vehicle.range.estimatedWinterKm >= required
  }
  if (vehicle.range?.estimatedSummerKm != null) {
    return vehicle.range.estimatedSummerKm >= required
  }
  if (vehicle.range?.wltpKm != null) {
    // WLTP is not winter range; use with caution
    return vehicle.range.wltpKm >= required
  }
  return undefined
}

function evaluateCriterion(
  criterion: SelectionCriterion,
  vehicle: VehicleVersion,
): { status: CriterionStatus; vehicleValue?: string | number; note?: string } {
  // If there's a required value, try to check it against vehicle data
  if (criterion.requiredValue === undefined) {
    // No required value to check against; if caller set status, preserve it
    return { status: criterion.status }
  }

  // Map known criterion ids to vehicle fields
  const id = criterion.id
  const req = criterion.requiredValue

  if (id === 'towing_capacity' || id === 'hinauskapasiteetti') {
    const val = vehicle.towing?.maxKg
    if (val == null) return { status: 'unknown', note: 'Tieto puuttuu' }
    const numReq = typeof req === 'string' ? parseFloat(req) : req
    return { status: val >= numReq ? 'met' : 'not_met', vehicleValue: val }
  }

  if (id === 'min_range_km' || id === 'vähimmäistoimintamatka') {
    const val = vehicle.range?.wltpKm
    if (val == null) return { status: 'unknown', note: 'Tieto puuttuu' }
    const numReq = typeof req === 'string' ? parseFloat(req) : req
    return { status: val >= numReq ? 'met' : 'not_met', vehicleValue: val }
  }

  if (id === 'min_dc_charging_kw' || id === 'dc_latausteho') {
    const val = vehicle.charging?.dcMaxKw
    if (val == null) return { status: 'unknown', note: 'Tieto puuttuu' }
    const numReq = typeof req === 'string' ? parseFloat(req) : req
    return { status: val >= numReq ? 'met' : 'not_met', vehicleValue: val }
  }

  if (id === 'min_seats' || id === 'istuimet') {
    const val = vehicle.seatsMax
    if (val == null) return { status: 'unknown', note: 'Tieto puuttuu' }
    const numReq = typeof req === 'string' ? parseFloat(req) : req
    return { status: val >= numReq ? 'met' : 'not_met', vehicleValue: val }
  }

  if (id === 'tow_hook' || id === 'vetokoukku') {
    const val = vehicle.towing?.hasTowHook
    if (val == null) return { status: 'unknown', note: 'Tieto puuttuu' }
    const reqBool = req === 1 || req === 'true'
    return { status: (val === reqBool) ? 'met' : 'not_met', vehicleValue: String(val) }
  }

  if (id === 'min_cargo_litres' || id === 'tavaratila') {
    const val = vehicle.dimensions?.cargoLitres
    if (val == null) return { status: 'unknown', note: 'Tieto puuttuu' }
    const numReq = typeof req === 'string' ? parseFloat(req) : req
    return { status: val >= numReq ? 'met' : 'not_met', vehicleValue: val }
  }

  // Unknown criterion id — cannot evaluate
  return { status: 'unknown', note: 'Kriteeriä ei tunnistettu automaattiseen tarkistukseen' }
}

export function checkSuitability(
  vehicle: VehicleVersion,
  profile: DrivingProfile,
  criteria: SelectionCriterion[],
): SuitabilityResult {
  const results: SuitabilityResult['criteria'] = []
  let mandatoryFailed = 0
  let importantFailed = 0

  for (const criterion of criteria) {
    const evaluation = evaluateCriterion(criterion, vehicle)
    results.push({
      criterionId: criterion.id,
      status: evaluation.status,
      vehicleValue: evaluation.vehicleValue,
      note: evaluation.note,
    })

    if (evaluation.status === 'not_met') {
      if (criterion.importance === 'mandatory') mandatoryFailed++
      else if (criterion.importance === 'important') importantFailed++
    }
  }

  const rangeAdequate = checkRangeAdequacy(vehicle, profile)

  return {
    vehicleVersionId: vehicle.id,
    criteria: results,
    mandatoryFailed,
    importantFailed,
    rangeAdequate,
  }
}
