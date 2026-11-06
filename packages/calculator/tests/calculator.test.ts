import { describe, it, expect } from 'vitest'
import {
  createCurrentCarCells,
  createNewCarCells,
  createSavingsCells,
  createFinancingCells,
  computeAllCells,
} from '../src/index.js'
import type { CellMap } from '@autolaskin/domain'

function mergeAll(current: CellMap, newCar: CellMap, savings: CellMap, financing: CellMap): CellMap {
  return { ...current, ...newCar, ...savings, ...financing }
}

describe('createCurrentCarCells', () => {
  it('has all expected cell IDs', () => {
    const cells = createCurrentCarCells()
    const ids = ['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10','C11','C12','C13','C14','C15']
    for (const id of ids) expect(cells[id]).toBeDefined()
  })

  it('has correct default values', () => {
    const cells = createCurrentCarCells()
    expect(cells['C1'].defaultValue).toBe(15000)
    expect(cells['C2'].defaultValue).toBe(7.0)
    expect(cells['C3'].defaultValue).toBe(1.80)
  })

  it('computes C10 = C1*C2/100', () => {
    const result = computeAllCells(createCurrentCarCells())
    // 15000 * 7 / 100 = 1050
    expect(result['C10'].result).toBeCloseTo(1050)
  })

  it('computes C11 = C10*C3', () => {
    const result = computeAllCells(createCurrentCarCells())
    // 1050 * 1.80 = 1890
    expect(result['C11'].result).toBeCloseTo(1890)
  })

  it('computes C12 = C4+C5+C6+C7', () => {
    const result = computeAllCells(createCurrentCarCells())
    // 300+900+600+200 = 2000
    expect(result['C12'].result).toBeCloseTo(2000)
  })

  it('computes C13 = C11+C12+C8', () => {
    const result = computeAllCells(createCurrentCarCells())
    // 1890+2000+1500 = 5390
    expect(result['C13'].result).toBeCloseTo(5390)
  })

  it('computes C14 = C13/12', () => {
    const result = computeAllCells(createCurrentCarCells())
    expect(result['C14'].result).toBeCloseTo(5390 / 12)
  })

  it('computes C15 = C13/C1*100', () => {
    const result = computeAllCells(createCurrentCarCells())
    expect(result['C15'].result).toBeCloseTo(5390 / 15000 * 100)
  })
})

describe('createNewCarCells', () => {
  it('has all expected cell IDs', () => {
    const cells = createNewCarCells('ev')
    const ids = ['N1','N2','N3','N4','N5','N6','N7','N8','N9','N10','N11','N12',
                 'N13','N14','N15','N16','N17','N18','N19','N20']
    for (const id of ids) expect(cells[id]).toBeDefined()
  })

  it('computes N13 = N1*N2/100*(1+N7/100)', () => {
    const result = computeAllCells(createNewCarCells('ev'))
    // 15000 * 18 / 100 * (1 + 15/100) = 2700 * 1.15 = 3105
    expect(result['N13'].result).toBeCloseTo(3105)
  })

  it('computes N14 = N13*N3/100*N5', () => {
    const result = computeAllCells(createNewCarCells('ev'))
    // 3105 * 0.80 * 0.12 = 298.08
    expect(result['N14'].result).toBeCloseTo(298.08)
  })

  it('computes N15 = N13*N4/100*N6', () => {
    const result = computeAllCells(createNewCarCells('ev'))
    // 3105 * 0.20 * 0.45 = 279.45
    expect(result['N15'].result).toBeCloseTo(279.45)
  })

  it('computes N16 = N14+N15', () => {
    const result = computeAllCells(createNewCarCells('ev'))
    // 298.08 + 279.45 = 577.53
    expect(result['N16'].result).toBeCloseTo(577.53)
  })

  it('computes N17 = N8+N9+N10+N11', () => {
    const result = computeAllCells(createNewCarCells('ev'))
    // 100+1000+200+200 = 1500
    expect(result['N17'].result).toBeCloseTo(1500)
  })

  it('computes N18 = N16+N17+N12', () => {
    const result = computeAllCells(createNewCarCells('ev'))
    // 577.53 + 1500 + 2000 = 4077.53
    expect(result['N18'].result).toBeCloseTo(4077.53)
  })

  it('computes N19 = N18/12', () => {
    const r = computeAllCells(createNewCarCells('ev'))
    expect(r['N19'].result).toBeCloseTo(r['N18'].result! / 12)
  })

  it('computes N20 = N18/N1*100', () => {
    const r = computeAllCells(createNewCarCells('ev'))
    expect(r['N20'].result).toBeCloseTo(r['N18'].result! / 15000 * 100)
  })
})

describe('createSavingsCells', () => {
  it('computes S1, S2, S3, S4', () => {
    const allCells = mergeAll(
      createCurrentCarCells(),
      createNewCarCells('ev'),
      createSavingsCells(),
      createFinancingCells(),
    )
    const result = computeAllCells(allCells)

    const c11 = result['C11'].result!
    const n16 = result['N16'].result!
    const c13 = result['C13'].result!
    const n18 = result['N18'].result!

    expect(result['S1'].result).toBeCloseTo(c11 - n16)
    expect(result['S2'].result).toBeCloseTo(c13 - n18)
    expect(result['S3'].result).toBeCloseTo((c11 - n16) / 12)
    expect(result['S4'].result).toBeCloseTo((c13 - n18) / 12)
  })
})

describe('createFinancingCells', () => {
  it('computes F6 = C9 (trade-in value)', () => {
    const allCells = mergeAll(
      createCurrentCarCells(),
      createNewCarCells('ev'),
      createSavingsCells(),
      createFinancingCells(),
    )
    const result = computeAllCells(allCells)
    expect(result['F6'].result).toBeCloseTo(5000) // C9 default
  })

  it('computes F11 = F1*12', () => {
    const allCells = mergeAll(
      createCurrentCarCells(),
      createNewCarCells('ev'),
      createSavingsCells(),
      createFinancingCells(),
    )
    const result = computeAllCells(allCells)
    expect(result['F11'].result).toBeCloseTo(60) // 5*12
  })

  it('computes F12 = F2/100/12', () => {
    const allCells = mergeAll(
      createCurrentCarCells(),
      createNewCarCells('ev'),
      createSavingsCells(),
      createFinancingCells(),
    )
    const result = computeAllCells(allCells)
    expect(result['F12'].result).toBeCloseTo(5 / 100 / 12)
  })

  it('computes F13 annuity formula', () => {
    const allCells = mergeAll(
      createCurrentCarCells(),
      createNewCarCells('ev'),
      createSavingsCells(),
      createFinancingCells(),
    )
    const result = computeAllCells(allCells)

    const M = result['F10'].result!
    const r = result['F12'].result!
    const n = result['F11'].result!
    const expected = M * (1 - Math.pow(1 + r, -n)) / r

    expect(result['F13'].result).toBeCloseTo(expected)
  })

  it('computes F13 with zero interest', () => {
    const allCells = mergeAll(
      createCurrentCarCells(),
      createNewCarCells('ev'),
      createSavingsCells(),
      createFinancingCells(),
    )
    allCells['F2'] = { ...allCells['F2'], userValue: 0 }
    const result = computeAllCells(allCells)

    const M = result['F10'].result!
    const n = result['F11'].result!
    expect(result['F13'].result).toBeCloseTo(M * n)
  })

  it('computes F14 = F13+F6+F7-F8', () => {
    const allCells = mergeAll(
      createCurrentCarCells(),
      createNewCarCells('ev'),
      createSavingsCells(),
      createFinancingCells(),
    )
    const result = computeAllCells(allCells)
    const expected = result['F13'].result! + result['F6'].result! + 0 - 500
    expect(result['F14'].result).toBeCloseTo(expected)
  })
})

describe('computeAllCells - custom user values', () => {
  it('respects userValue override', () => {
    const cells = createCurrentCarCells()
    cells['C1'] = { ...cells['C1'], userValue: 20000 }
    const result = computeAllCells(cells)
    // C10 = 20000 * 7 / 100 = 1400
    expect(result['C10'].result).toBeCloseTo(1400)
  })
})
