import * as _ from 'lodash';
import { ArrayContext } from '../Antlr/RASPParser';
import { BotDetails, Expression, ExpressionOp, ArrayExpression } from '../parser-types';
import { ExtRASPListener } from '../parser';

export class ArrayExpressionGenerator implements ArrayExpression {
	public type: ExpressionOp.Array = ExpressionOp.Array;
	public name: string;
	public values: Expression[] = [];
	public parent: Expression | undefined;

	public static enterArray(ctx: ArrayContext, botStructure: BotDetails): void {
		// Create a new Array Expression, set its parent, and then ensure the current
		// parsed expression is this.
		const arrayExpr = new ArrayExpressionGenerator();
		arrayExpr.parent = botStructure.currentExpression;

		// Get the Array name if there is one.
		const arrayName = ctx.ID();
		if (arrayName) {
			arrayExpr.name = arrayName.text;
		}

		botStructure.currentExpression = arrayExpr;
	}

	public static exitArray(ctx: ArrayContext, botStructure: BotDetails): void {
		if (botStructure.currentExpression) {
			const parent = botStructure.currentExpression.parent;
			// Either assign current to parent.
			if (parent) {
				parent.assignChild(botStructure.currentExpression);
				botStructure.currentExpression = parent;
			}
		}
	}

	public assignChild(expr: Expression): void {
		this.values.push(expr);
	}
}

export function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void {
	listener['enterArray'] = _.partial(ArrayExpressionGenerator.enterArray, _, definition);
	listener['exitArray'] = _.partial(ArrayExpressionGenerator.exitArray, _, definition);
}