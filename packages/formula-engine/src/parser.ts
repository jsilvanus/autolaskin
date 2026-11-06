// Token types for the formula lexer/parser
export type TokenType =
  | 'NUMBER'
  | 'CELL_REF'
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'LPAREN'
  | 'RPAREN'
  | 'EOF'

export interface Token {
  type: TokenType
  value: string
  pos: number
}

// AST node types
export type ASTNode =
  | { kind: 'number'; value: number }
  | { kind: 'cellRef'; id: string }
  | { kind: 'binop'; op: '+' | '-' | '*' | '/'; left: ASTNode; right: ASTNode }
  | { kind: 'unary'; op: '-'; operand: ASTNode }

export interface ParseResult {
  ok: true
  ast: ASTNode
  deps: string[]
}

export interface ParseError {
  ok: false
  error: 'SYNTAX_ERROR'
  message: string
}

export type ParseOutcome = ParseResult | ParseError

// ---- Lexer ----

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = []
  let i = 0
  while (i < input.length) {
    const ch = input[i]
    if (ch === ' ' || ch === '\t') { i++; continue }
    if (ch === '+') { tokens.push({ type: 'PLUS', value: '+', pos: i }); i++; continue }
    if (ch === '-') { tokens.push({ type: 'MINUS', value: '-', pos: i }); i++; continue }
    if (ch === '*') { tokens.push({ type: 'STAR', value: '*', pos: i }); i++; continue }
    if (ch === '/') { tokens.push({ type: 'SLASH', value: '/', pos: i }); i++; continue }
    if (ch === '(') { tokens.push({ type: 'LPAREN', value: '(', pos: i }); i++; continue }
    if (ch === ')') { tokens.push({ type: 'RPAREN', value: ')', pos: i }); i++; continue }
    // Number literal
    if (ch >= '0' && ch <= '9' || ch === '.') {
      let num = ''
      const start = i
      while (i < input.length && (input[i] >= '0' && input[i] <= '9' || input[i] === '.')) {
        num += input[i]; i++
      }
      if (num.split('.').length > 2) return null // multiple dots
      tokens.push({ type: 'NUMBER', value: num, pos: start })
      continue
    }
    // Cell reference: letter(s) + digit(s), e.g. A1, N13, C10
    if (ch >= 'A' && ch <= 'Z' || ch >= 'a' && ch <= 'z') {
      let ref = ''
      const start = i
      while (i < input.length && (input[i] >= 'A' && input[i] <= 'Z' || input[i] >= 'a' && input[i] <= 'z')) {
        ref += input[i].toUpperCase(); i++
      }
      if (i < input.length && input[i] >= '0' && input[i] <= '9') {
        while (i < input.length && input[i] >= '0' && input[i] <= '9') {
          ref += input[i]; i++
        }
        tokens.push({ type: 'CELL_REF', value: ref, pos: start })
      } else {
        return null // bare letters without digits = unknown token
      }
      continue
    }
    return null // unknown character
  }
  tokens.push({ type: 'EOF', value: '', pos: i })
  return tokens
}

// ---- Recursive-descent parser (no eval) ----
// Grammar:
//   expr   := term (('+' | '-') term)*
//   term   := unary (('*' | '/') unary)*
//   unary  := '-' unary | primary
//   primary := NUMBER | CELL_REF | '(' expr ')'

class Parser {
  private tokens: Token[]
  private pos: number = 0

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  private peek(): Token { return this.tokens[this.pos] }
  private consume(): Token { return this.tokens[this.pos++] }

  parseExpr(): ASTNode {
    let left = this.parseTerm()
    while (this.peek().type === 'PLUS' || this.peek().type === 'MINUS') {
      const op = this.consume().value as '+' | '-'
      const right = this.parseTerm()
      left = { kind: 'binop', op, left, right }
    }
    return left
  }

  private parseTerm(): ASTNode {
    let left = this.parseUnary()
    while (this.peek().type === 'STAR' || this.peek().type === 'SLASH') {
      const op = this.consume().value as '*' | '/'
      const right = this.parseUnary()
      left = { kind: 'binop', op, left, right }
    }
    return left
  }

  private parseUnary(): ASTNode {
    if (this.peek().type === 'MINUS') {
      this.consume()
      const operand = this.parseUnary()
      return { kind: 'unary', op: '-', operand }
    }
    return this.parsePrimary()
  }

  private parsePrimary(): ASTNode {
    const tok = this.peek()
    if (tok.type === 'NUMBER') {
      this.consume()
      return { kind: 'number', value: parseFloat(tok.value) }
    }
    if (tok.type === 'CELL_REF') {
      this.consume()
      return { kind: 'cellRef', id: tok.value }
    }
    if (tok.type === 'LPAREN') {
      this.consume()
      const inner = this.parseExpr()
      if (this.peek().type !== 'RPAREN') {
        throw new SyntaxError('Expected )')
      }
      this.consume()
      return inner
    }
    throw new SyntaxError(`Unexpected token ${tok.type} at pos ${tok.pos}`)
  }
}

function collectDeps(node: ASTNode): string[] {
  switch (node.kind) {
    case 'number': return []
    case 'cellRef': return [node.id]
    case 'unary': return collectDeps(node.operand)
    case 'binop': return [...collectDeps(node.left), ...collectDeps(node.right)]
  }
}

export function parseFormula(formula: string): ParseOutcome {
  if (!formula.startsWith('=')) {
    return { ok: false, error: 'SYNTAX_ERROR', message: 'Formula must start with =' }
  }
  const expr = formula.slice(1).trim()
  if (expr === '') {
    return { ok: false, error: 'SYNTAX_ERROR', message: 'Empty formula' }
  }
  const tokens = tokenize(expr)
  if (!tokens) {
    return { ok: false, error: 'SYNTAX_ERROR', message: 'Invalid characters in formula' }
  }
  try {
    const parser = new Parser(tokens)
    const ast = parser.parseExpr()
    if (parser['peek']().type !== 'EOF') {
      return { ok: false, error: 'SYNTAX_ERROR', message: 'Unexpected tokens after expression' }
    }
    const deps = [...new Set(collectDeps(ast))]
    return { ok: true, ast, deps }
  } catch (e) {
    return { ok: false, error: 'SYNTAX_ERROR', message: (e as Error).message }
  }
}

export function getFormulaDepIds(formula: string): string[] {
  const result = parseFormula(formula)
  return result.ok ? result.deps : []
}
