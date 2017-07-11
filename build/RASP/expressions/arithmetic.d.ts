import { ArithmeticExpression, Expression, ExpressionOp } from '../parser-types';
export declare class ArithmeticExpressionGenerator implements ArithmeticExpression {
    type: ExpressionOp.Add | ExpressionOp.Subtract | ExpressionOp.Multiply | ExpressionOp.Divide;
    parent: Expression | undefined;
    operandOne: Expression;
    operandTwo: Expression;
    assignChild(expr: Expression): void;
}
