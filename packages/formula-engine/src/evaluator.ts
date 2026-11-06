import type { CellMap } from '@autolaskin/domain'
import { parseFormula } from './parser.js'
import type { ASTNode } from './parser.js'

type EvalError = 'DIV_ZERO' | 'UNKNOWN_REF' | 'CIRCULAR_REF' | 'SYNTAX_ERROR'

interface EvalOk { ok: true; value: number }
interface EvalErr { ok: false; error: EvalError; message?: string }
type EvalResult = EvalOk | EvalErr

function evalAST(node: ASTNode, cells: CellMap, resolving: Set<string>): EvalResult {
  switch (node.kind) {
    case 'number':
      return { ok: true, value: node.value }
    case 'cellRef': {
      const cell = cells[node.id]
      if (!cell) return { ok: false, error: 'UNKNOWN_REF', message: `Unknown cell ${node.id}` }
      if (cell.error) return { ok: false, error: cell.error as EvalError }
      if (cell.result !== undefined) return { ok: true, value: cell.result }
      // need to compute it
      if (resolving.has(node.id)) return { ok: false, error: 'CIRCULAR_REF' }
      if (cell.formula) {
        resolving.add(node.id)
        const r = evalFormula(cell.formula, cells, resolving)
        resolving.delete(node.id)
        if (!r.ok) return r
        return { ok: true, value: r.value }
      }
      const val = cell.userValue ?? cell.defaultValue
      if (val === undefined) return { ok: false, error: 'UNKNOWN_REF', message: `Cell ${node.id} has no value` }
      return { ok: true, value: val }
    }
    case 'unary': {
      const r = evalAST(node.operand, cells, resolving)
      if (!r.ok) return r
      return { ok: true, value: -r.value }
    }
    case 'binop': {
      const l = evalAST(node.left, cells, resolving)
      if (!l.ok) return l
      const r = evalAST(node.right, cells, resolving)
      if (!r.ok) return r
      switch (node.op) {
        case '+': return { ok: true, value: l.value + r.value }
        case '-': return { ok: true, value: l.value - r.value }
        case '*': return { ok: true, value: l.value * r.value }
        case '/':
          if (r.value === 0) return { ok: false, error: 'DIV_ZERO' }
          return { ok: true, value: l.value / r.value }
      }
    }
  }
}

function evalFormula(formula: string, cells: CellMap, resolving: Set<string>): EvalResult {
  const parsed = parseFormula(formula)
  if (!parsed.ok) return { ok: false, error: 'SYNTAX_ERROR', message: parsed.message }
  return evalAST(parsed.ast, cells, resolving)
}

export function evaluateCells(cells: CellMap): CellMap {
  // Build dependency graph for topological sort
  const ids = Object.keys(cells)
  const deps: Map<string, string[]> = new Map()

  for (const id of ids) {
    const cell = cells[id]
    if (cell.formula) {
      const parsed = parseFormula(cell.formula)
      deps.set(id, parsed.ok ? parsed.deps : [])
    } else {
      deps.set(id, [])
    }
  }

  // Topological sort (Kahn's algorithm)
  const inDegree: Map<string, number> = new Map()
  const dependents: Map<string, string[]> = new Map()

  for (const id of ids) {
    if (!inDegree.has(id)) inDegree.set(id, 0)
    if (!dependents.has(id)) dependents.set(id, [])
    for (const dep of deps.get(id) ?? []) {
      if (ids.includes(dep)) {
        dependents.set(dep, [...(dependents.get(dep) ?? []), id])
        inDegree.set(id, (inDegree.get(id) ?? 0) + 1)
      }
    }
  }

  const queue: string[] = ids.filter(id => (inDegree.get(id) ?? 0) === 0)
  const order: string[] = []

  while (queue.length > 0) {
    const id = queue.shift()!
    order.push(id)
    for (const dep of dependents.get(id) ?? []) {
      const newDeg = (inDegree.get(dep) ?? 0) - 1
      inDegree.set(dep, newDeg)
      if (newDeg === 0) queue.push(dep)
    }
  }

  // Any remaining cells with inDegree > 0 are in a cycle
  const cycleIds = new Set(ids.filter(id => (inDegree.get(id) ?? 0) > 0))

  // Evaluate in topological order
  const result: CellMap = {}
  for (const id of ids) {
    result[id] = { ...cells[id], result: undefined, error: undefined }
  }

  // First set non-formula cells
  for (const id of order) {
    const cell = result[id]
    if (!cell.formula) {
      cell.result = cell.userValue ?? cell.defaultValue
    }
  }

  // Evaluate formula cells in order
  for (const id of order) {
    const cell = result[id]
    if (!cell.formula) continue

    const resolving = new Set<string>()
    resolving.add(id)

    const parsed = parseFormula(cell.formula)
    if (!parsed.ok) {
      cell.error = 'SYNTAX_ERROR'
      cell.result = undefined
      continue
    }

    // Check if any dep is in a cycle
    const evalResult = evalAST(parsed.ast, result, resolving)
    if (evalResult.ok) {
      cell.result = evalResult.value
    } else {
      cell.error = evalResult.error
      cell.result = undefined
    }
  }

  // Mark cycle cells
  for (const id of cycleIds) {
    result[id].error = 'CIRCULAR_REF'
    result[id].result = undefined
  }

  return result
}
