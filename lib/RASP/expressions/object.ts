import * as _ from 'lodash';
import { ObjectContext } from '../Antlr/RASPParser';
import { BotDetails, Expression, ExpressionOp, ObjectExpression } from '../parser-types';
import { ExtRASPListener } from '../parser';

export class ObjectExpressionGenerator implements ObjectExpression {
	public type: ExpressionOp.Object = ExpressionOp.Object;
	public properties: Expression[] = [];
	public parent: Expression | undefined;

	public static enterObject(ctx: ObjectContext, botStructure: BotDetails): void {
		// Create a new Object Expression, set its parent, and then ensure the current
		// parsed expression is this.
		const objectExpr = new ObjectExpressionGenerator();
		objectExpr.parent = botStructure.currentExpression;
		botStructure.currentExpression = objectExpr;
	}

	public static exitObject(ctx: ObjectContext, botStructure: BotDetails): void {
		if (botStructure.currentExpression) {
			const parent = botStructure.currentExpression.parent;
			// Assign current parent to expression.
			// If there is no expression, we leave it, as it will be handled
			// by the statement or service above which will know how to
			// add and remove it.
			if (parent) {
				parent.assignChild(botStructure.currentExpression);
				botStructure.currentExpression = parent;
			}
		}
	}	

	public assignChild(expr: Expression): void {
		// Called from the child.
		this.properties.push(expr);
	}
}

export function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void {
	listener['enterObject'] = _.partial(ObjectExpressionGenerator.enterObject, _, definition);
	listener['exitObject'] = _.partial(ObjectExpressionGenerator.exitObject, _, definition);
}