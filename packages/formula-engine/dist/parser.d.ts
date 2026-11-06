export type TokenType = 'NUMBER' | 'CELL_REF' | 'PLUS' | 'MINUS' | 'STAR' | 'SLASH' | 'LPAREN' | 'RPAREN' | 'EOF';
export interface Token {
    type: TokenType;
    value: string;
    pos: number;
}
export type ASTNode = {
    kind: 'number';
    value: number;
} | {
    kind: 'cellRef';
    id: string;
} | {
    kind: 'binop';
    op: '+' | '-' | '*' | '/';
    left: ASTNode;
    right: ASTNode;
} | {
    kind: 'unary';
    op: '-';
    operand: ASTNode;
};
export interface ParseResult {
    ok: true;
    ast: ASTNode;
    deps: string[];
}
export interface ParseError {
    ok: false;
    error: 'SYNTAX_ERROR';
    message: string;
}
export type ParseOutcome = ParseResult | ParseError;
export declare function parseFormula(formula: string): ParseOutcome;
export declare function getFormulaDepIds(formula: string): string[];
//# sourceMappingURL=parser.d.ts.map