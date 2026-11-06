// ---- Lexer ----
function tokenize(input) {
    const tokens = [];
    let i = 0;
    while (i < input.length) {
        const ch = input[i];
        if (ch === ' ' || ch === '\t') {
            i++;
            continue;
        }
        if (ch === '+') {
            tokens.push({ type: 'PLUS', value: '+', pos: i });
            i++;
            continue;
        }
        if (ch === '-') {
            tokens.push({ type: 'MINUS', value: '-', pos: i });
            i++;
            continue;
        }
        if (ch === '*') {
            tokens.push({ type: 'STAR', value: '*', pos: i });
            i++;
            continue;
        }
        if (ch === '/') {
            tokens.push({ type: 'SLASH', value: '/', pos: i });
            i++;
            continue;
        }
        if (ch === '(') {
            tokens.push({ type: 'LPAREN', value: '(', pos: i });
            i++;
            continue;
        }
        if (ch === ')') {
            tokens.push({ type: 'RPAREN', value: ')', pos: i });
            i++;
            continue;
        }
        // Number literal
        if (ch >= '0' && ch <= '9' || ch === '.') {
            let num = '';
            const start = i;
            while (i < input.length && (input[i] >= '0' && input[i] <= '9' || input[i] === '.')) {
                num += input[i];
                i++;
            }
            if (num.split('.').length > 2)
                return null; // multiple dots
            tokens.push({ type: 'NUMBER', value: num, pos: start });
            continue;
        }
        // Cell reference: letter(s) + digit(s), e.g. A1, N13, C10
        if (ch >= 'A' && ch <= 'Z' || ch >= 'a' && ch <= 'z') {
            let ref = '';
            const start = i;
            while (i < input.length && (input[i] >= 'A' && input[i] <= 'Z' || input[i] >= 'a' && input[i] <= 'z')) {
                ref += input[i].toUpperCase();
                i++;
            }
            if (i < input.length && input[i] >= '0' && input[i] <= '9') {
                while (i < input.length && input[i] >= '0' && input[i] <= '9') {
                    ref += input[i];
                    i++;
                }
                tokens.push({ type: 'CELL_REF', value: ref, pos: start });
            }
            else {
                return null; // bare letters without digits = unknown token
            }
            continue;
        }
        return null; // unknown character
    }
    tokens.push({ type: 'EOF', value: '', pos: i });
    return tokens;
}
// ---- Recursive-descent parser (no eval) ----
// Grammar:
//   expr   := term (('+' | '-') term)*
//   term   := unary (('*' | '/') unary)*
//   unary  := '-' unary | primary
//   primary := NUMBER | CELL_REF | '(' expr ')'
class Parser {
    tokens;
    pos = 0;
    constructor(tokens) {
        this.tokens = tokens;
    }
    peek() { return this.tokens[this.pos]; }
    consume() { return this.tokens[this.pos++]; }
    parseExpr() {
        let left = this.parseTerm();
        while (this.peek().type === 'PLUS' || this.peek().type === 'MINUS') {
            const op = this.consume().value;
            const right = this.parseTerm();
            left = { kind: 'binop', op, left, right };
        }
        return left;
    }
    parseTerm() {
        let left = this.parseUnary();
        while (this.peek().type === 'STAR' || this.peek().type === 'SLASH') {
            const op = this.consume().value;
            const right = this.parseUnary();
            left = { kind: 'binop', op, left, right };
        }
        return left;
    }
    parseUnary() {
        if (this.peek().type === 'MINUS') {
            this.consume();
            const operand = this.parseUnary();
            return { kind: 'unary', op: '-', operand };
        }
        return this.parsePrimary();
    }
    parsePrimary() {
        const tok = this.peek();
        if (tok.type === 'NUMBER') {
            this.consume();
            return { kind: 'number', value: parseFloat(tok.value) };
        }
        if (tok.type === 'CELL_REF') {
            this.consume();
            return { kind: 'cellRef', id: tok.value };
        }
        if (tok.type === 'LPAREN') {
            this.consume();
            const inner = this.parseExpr();
            if (this.peek().type !== 'RPAREN') {
                throw new SyntaxError('Expected )');
            }
            this.consume();
            return inner;
        }
        throw new SyntaxError(`Unexpected token ${tok.type} at pos ${tok.pos}`);
    }
}
function collectDeps(node) {
    switch (node.kind) {
        case 'number': return [];
        case 'cellRef': return [node.id];
        case 'unary': return collectDeps(node.operand);
        case 'binop': return [...collectDeps(node.left), ...collectDeps(node.right)];
    }
}
export function parseFormula(formula) {
    if (!formula.startsWith('=')) {
        return { ok: false, error: 'SYNTAX_ERROR', message: 'Formula must start with =' };
    }
    const expr = formula.slice(1).trim();
    if (expr === '') {
        return { ok: false, error: 'SYNTAX_ERROR', message: 'Empty formula' };
    }
    const tokens = tokenize(expr);
    if (!tokens) {
        return { ok: false, error: 'SYNTAX_ERROR', message: 'Invalid characters in formula' };
    }
    try {
        const parser = new Parser(tokens);
        const ast = parser.parseExpr();
        if (parser['peek']().type !== 'EOF') {
            return { ok: false, error: 'SYNTAX_ERROR', message: 'Unexpected tokens after expression' };
        }
        const deps = [...new Set(collectDeps(ast))];
        return { ok: true, ast, deps };
    }
    catch (e) {
        return { ok: false, error: 'SYNTAX_ERROR', message: e.message };
    }
}
export function getFormulaDepIds(formula) {
    const result = parseFormula(formula);
    return result.ok ? result.deps : [];
}
//# sourceMappingURL=parser.js.map