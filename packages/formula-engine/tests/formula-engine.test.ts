import { describe, it, expect } from 'vitest'
import { parseFormula, evaluateCells, getFormulaDepIds } from '../src/index.js'
import type { CellMap } from '@autolaskin/domain'

describe('parseFormula', () => {
  it('parses a simple number', () => {
    const r = parseFormula('=42')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.ast).toMatchObject({ kind: 'number', value: 42 })
  })

  it('requires = prefix', () => {
    const r = parseFormula('42')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe('SYNTAX_ERROR')
  })

  it('parses addition', () => {
    const r = parseFormula('=1+2')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.ast).toMatchObject({ kind: 'binop', op: '+' })
  })

  it('parses cell reference', () => {
    const r = parseFormula('=A1')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.ast).toMatchObject({ kind: 'cellRef', id: 'A1' })
      expect(r.deps).toContain('A1')
    }
  })

  it('parses multi-char cell references', () => {
    const r = parseFormula('=N13*C10')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.deps).toContain('N13')
      expect(r.deps).toContain('C10')
    }
  })

  it('returns SYNTAX_ERROR for empty formula', () => {
    const r = parseFormula('=')
    expect(r.ok).toBe(false)
  })

  it('returns SYNTAX_ERROR for invalid chars', () => {
    const r = parseFormula('=A1&B2')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe('SYNTAX_ERROR')
  })

  it('parses parenthesized expression', () => {
    const r = parseFormula('=(A1+B2)*3')
    expect(r.ok).toBe(true)
  })
})

describe('getFormulaDepIds', () => {
  it('returns deps for valid formula', () => {
    expect(getFormulaDepIds('=A1+B2')).toEqual(['A1', 'B2'])
  })

  it('returns empty for invalid formula', () => {
    expect(getFormulaDepIds('invalid')).toEqual([])
  })
})

describe('evaluateCells - arithmetic', () => {
  it('evaluates literal cells', () => {
    const cells: CellMap = {
      A1: { id: 'A1', label: 'A', defaultValue: 10 },
      A2: { id: 'A2', label: 'B', defaultValue: 5 },
    }
    const result = evaluateCells(cells)
    expect(result['A1'].result).toBe(10)
    expect(result['A2'].result).toBe(5)
  })

  it('evaluates addition formula', () => {
    const cells: CellMap = {
      A1: { id: 'A1', label: 'A', defaultValue: 3 },
      A2: { id: 'A2', label: 'B', defaultValue: 4 },
      A3: { id: 'A3', label: 'Sum', formula: '=A1+A2' },
    }
    const result = evaluateCells(cells)
    expect(result['A3'].result).toBe(7)
  })

  it('evaluates subtraction', () => {
    const cells: CellMap = {
      A1: { id: 'A1', label: 'A', defaultValue: 10 },
      A2: { id: 'A2', label: 'B', defaultValue: 3 },
      A3: { id: 'A3', label: 'Diff', formula: '=A1-A2' },
    }
    const result = evaluateCells(cells)
    expect(result['A3'].result).toBe(7)
  })

  it('evaluates multiplication', () => {
    const cells: CellMap = {
      A1: { id: 'A1', label: 'A', defaultValue: 6 },
      A2: { id: 'A2', label: 'B', defaultValue: 7 },
      A3: { id: 'A3', label: 'Prod', formula: '=A1*A2' },
    }
    const result = evaluateCells(cells)
    expect(result['A3'].result).toBe(42)
  })

  it('evaluates division', () => {
    const cells: CellMap = {
      A1: { id: 'A1', label: 'A', defaultValue: 10 },
      A2: { id: 'A2', label: 'B', defaultValue: 4 },
      A3: { id: 'A3', label: 'Div', formula: '=A1/A2' },
    }
    const result = evaluateCells(cells)
    expect(result['A3'].result).toBe(2.5)
  })

  it('respects operator precedence (* before +)', () => {
    const cells: CellMap = {
      A1: { id: 'A1', label: 'A', formula: '=2+3*4' },
    }
    const result = evaluateCells(cells)
    expect(result['A1'].result).toBe(14)
  })

  it('respects parentheses', () => {
    const cells: CellMap = {
      A1: { id: 'A1', label: 'A', formula: '=(2+3)*4' },
    }
    const result = evaluateCells(cells)
    expect(result['A1'].result).toBe(20)
  })

  it('evaluates chained formulas', () => {
    const cells: CellMap = {
      A1: { id: 'A1', label: 'A', defaultValue: 15000 },
      A2: { id: 'A2', label: 'B', defaultValue: 7 },
      A3: { id: 'A3', label: 'C', formula: '=A1*A2/100' },
    }
    const result = evaluateCells(cells)
    expect(result['A3'].result).toBeCloseTo(1050)
  })

  it('uses userValue over defaultValue', () => {
    const cells: CellMap = {
      A1: { id: 'A1', label: 'A', defaultValue: 10, userValue: 20 },
    }
    const result = evaluateCells(cells)
    expect(result['A1'].result).toBe(20)
  })
})

describe('evaluateCells - errors', () => {
  it('reports CIRCULAR_REF', () => {
    const cells: CellMap = {
      A1: { id: 'A1', label: 'A', formula: '=A2' },
      A2: { id: 'A2', label: 'B', formula: '=A1' },
    }
    const result = evaluateCells(cells)
    expect(result['A1'].error).toBe('CIRCULAR_REF')
    expect(result['A2'].error).toBe('CIRCULAR_REF')
  })

  it('reports UNKNOWN_REF for missing cell', () => {
    const cells: CellMap = {
      A1: { id: 'A1', label: 'A', formula: '=Z99' },
    }
    const result = evaluateCells(cells)
    expect(result['A1'].error).toBe('UNKNOWN_REF')
  })

  it('reports DIV_ZERO', () => {
    const cells: CellMap = {
      A1: { id: 'A1', label: 'A', defaultValue: 0 },
      A2: { id: 'A2', label: 'B', formula: '=10/A1' },
    }
    const result = evaluateCells(cells)
    expect(result['A2'].error).toBe('DIV_ZERO')
  })

  it('reports DIV_ZERO for literal zero', () => {
    const cells: CellMap = {
      A1: { id: 'A1', label: 'A', formula: '=5/0' },
    }
    const result = evaluateCells(cells)
    expect(result['A1'].error).toBe('DIV_ZERO')
  })

  it('reports SYNTAX_ERROR for bad formula', () => {
    const cells: CellMap = {
      A1: { id: 'A1', label: 'A', formula: '=1++2' },
    }
    const result = evaluateCells(cells)
    expect(result['A1'].error).toBe('SYNTAX_ERROR')
  })

  it('propagates error from dependency', () => {
    const cells: CellMap = {
      A1: { id: 'A1', label: 'A', formula: '=5/0' },
      A2: { id: 'A2', label: 'B', formula: '=A1+1' },
    }
    const result = evaluateCells(cells)
    expect(result['A1'].error).toBe('DIV_ZERO')
    expect(result['A2'].error).toBe('DIV_ZERO')
  })
})
