import * as _ from 'lodash';
import { ExprContext } from '../Antlr/RASPParser';
import { ArithmeticExpression, BotDetails, Expression, ExpressionOp } from '../parser-types';
import { ExtRASPListener } from '../parser';

export class ArithmeticExpressionGenerator implements ArithmeticExpression {
	public type: ExpressionOp.Add | ExpressionOp.Subtract | ExpressionOp.Multiply | ExpressionOp.Divide;
	public parent: Expression | undefined;
	public operandOne: Expression;
	public operandTwo: Expression;

	public assignChild(expr: Expression): void {
		// Shove it onto one of the operands.
		console.log('this is an operand expression');
		console.log(expr);
		if (!this.operandOne) {
			this.operandOne = expr;
		} else {
			this.operandTwo = expr;
		}
	}
}
