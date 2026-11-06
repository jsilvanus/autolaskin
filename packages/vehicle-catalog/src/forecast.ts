import type {
  VehicleVersion,
  DrivingProfile,
  MaintenanceItem,
  MaintenanceForecast,
  ForecastEvent,
} from '@autolaskin/domain'

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Find the first km occurrence of a periodic item starting at or after startKm,
 * given the last known service km and interval.
 */
function firstOccurrenceKm(startKm: number, lastServiceKm: number, intervalKm: number): number {
  if (intervalKm <= 0) return Infinity
  // How many full intervals have passed since last service up to startKm?
  const intervalsPassed = Math.floor(Math.max(0, startKm - lastServiceKm) / intervalKm)
  const candidate = lastServiceKm + (intervalsPassed + 1) * intervalKm
  return candidate
}

export function computeMaintenanceForecast(
  vehicle: VehicleVersion,
  profile: DrivingProfile,
  maintenanceItems: MaintenanceItem[],
  lastServiceOdometerKm = 0,
): MaintenanceForecast {
  const startKm = profile.currentOdometerKm ?? 0
  const endKm = startKm + profile.annualKm * profile.ownershipYears
  const now = new Date()
  const forecastEndDate = addMonths(now, profile.ownershipYears * 12)
  const forecastEndMonths = profile.ownershipYears * 12
  const kmPerMonth = profile.annualKm / 12

  const events: ForecastEvent[] = []
  let totalScheduledEur = 0
  let totalWearEur = 0
  let totalKnownFaultCautiousEur = 0

  const applicable = maintenanceItems.filter(item =>
    item.vehicleVersionIds.includes(vehicle.id),
  )

  for (const item of applicable) {
    const isKnownFault = item.nature === 'known_fault'
    const isCautiousKnownFault =
      isKnownFault &&
      (item.evidenceLevel === 'recall' || item.evidenceLevel === 'repeated_observation')

    if (isKnownFault) {
      // Known faults appear once — never repeat
      const event: ForecastEvent = {
        maintenanceItemId: item.id,
        label: item.label,
        nature: item.nature,
        estimatedCostEur: item.estimatedCostEur,
        estimatedCostMinEur: item.estimatedCostMinEur,
        estimatedCostMaxEur: item.estimatedCostMaxEur,
        evidenceLevel: item.evidenceLevel,
        isUncertain: true,
      }
      events.push(event)

      if (isCautiousKnownFault) {
        // Include min cost in cautious total; never in base total
        totalKnownFaultCautiousEur += item.estimatedCostMinEur ?? item.estimatedCostEur ?? 0
      }
      continue
    }

    // Scheduled and wear items: compute all occurrences within the forecast window
    const hasKm = item.intervalKm != null
    const hasMonth = item.intervalMonths != null
    if (!hasKm && !hasMonth) continue

    // Generate candidate occurrences using km, months, or whichever triggers first
    let occurrence = 1
    while (true) {
      let nextKm: number | undefined
      let nextMonths: number | undefined

      if (hasKm && item.intervalKm != null) {
        // First occurrence from firstOccurrenceKm, then repeat each intervalKm
        const first = firstOccurrenceKm(startKm, lastServiceOdometerKm, item.intervalKm)
        nextKm = first + (occurrence - 1) * item.intervalKm
      }

      if (hasMonth && item.intervalMonths != null) {
        // First occurrence at firstAtMonths (if specified), else intervalMonths
        const firstM = item.firstAtMonths ?? item.intervalMonths
        nextMonths = firstM + (occurrence - 1) * item.intervalMonths
      }

      // Decide event km and months (whichever triggers first)
      let eventKm: number | undefined
      let eventMonths: number | undefined

      if (nextKm != null && nextMonths != null) {
        const kmAsMonths = (nextKm - startKm) / kmPerMonth
        if (kmAsMonths <= nextMonths) {
          eventKm = nextKm
          eventMonths = kmAsMonths
        } else {
          eventMonths = nextMonths
          eventKm = startKm + nextMonths * kmPerMonth
        }
      } else if (nextKm != null) {
        eventKm = nextKm
        eventMonths = (nextKm - startKm) / kmPerMonth
      } else if (nextMonths != null) {
        eventMonths = nextMonths
        eventKm = startKm + nextMonths * kmPerMonth
      } else {
        break
      }

      // Check if within forecast window
      const kmInRange = eventKm == null || eventKm <= endKm
      const monthsInRange = eventMonths == null || eventMonths <= forecastEndMonths

      if (!kmInRange || !monthsInRange) break

      const eventDate = eventMonths != null ? toISODate(addMonths(now, eventMonths)) : undefined

      const event: ForecastEvent = {
        maintenanceItemId: item.id,
        label: item.label,
        nature: item.nature,
        estimatedAtKm: eventKm != null ? Math.round(eventKm) : undefined,
        estimatedAtDate: eventDate,
        estimatedCostEur: item.estimatedCostEur,
        estimatedCostMinEur: item.estimatedCostMinEur,
        estimatedCostMaxEur: item.estimatedCostMaxEur,
        isUncertain: false,
      }
      events.push(event)

      if (item.nature === 'scheduled') {
        totalScheduledEur += item.estimatedCostEur ?? 0
      } else if (item.nature === 'wear_part') {
        totalWearEur += item.estimatedCostEur ?? 0
      }

      occurrence++
    }
  }

  return {
    vehicleVersionId: vehicle.id,
    profile,
    forecastEndKm: endKm,
    forecastEndDate: toISODate(forecastEndDate),
    events,
    totalScheduledEur,
    totalWearEur,
    totalKnownFaultBaseEur: 0,
    totalKnownFaultCautiousEur,
  }
}
