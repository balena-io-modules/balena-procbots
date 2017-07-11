import * as _ from 'lodash';
import { VariableContext } from '../Antlr/RASPParser';
import { BotDetails, Expression, ExpressionOp, VariableExpression } from '../parser-types';
import { ExtRASPListener } from '../parser';

export class VariableExpressionGenerator implements VariableExpression {
    public type: ExpressionOp.Variable = ExpressionOp.Variable;
    public name: string;
    public value: Expression;
    public parent: Expression | undefined;

    public static enterVariable(ctx: VariableContext, botStructure: BotDetails): void {
        // Create a new Object Expression, set its parent, and then ensure the current
        // parsed expression is this.
        const variableExpr = new VariableExpressionGenerator();
        variableExpr.parent = botStructure.currentExpression;

        // Get the full variable name.
        // If this were an object, we'd check that it were in context here.
        // TBD.
        variableExpr.name = '';
        let firstPart = true;
        for (let part of ctx.ID()) {
            if (!firstPart) {
                variableExpr.name += '.';
            }
            firstPart = false;
            variableExpr.name += part.text;
        }

        botStructure.currentExpression = variableExpr;
    }

    public static exitVariable(ctx: VariableContext, botStructure: BotDetails): void {
        if (botStructure.currentExpression) {
            const parent = botStructure.currentExpression.parent;
            // Assign to parent, or leave it as we're at the top of the stack.
            if (parent) {
                parent.assignChild(botStructure.currentExpression);
                botStructure.currentExpression = parent;
            }
        }
    }

    public assignChild(expr: Expression): void {
        this.value = expr;
    }
}

export function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void {
    listener['enterVariable'] = _.partial(VariableExpressionGenerator.enterVariable, _, definition);
    listener['exitVariable'] = _.partial(VariableExpressionGenerator.exitVariable, _, definition);
}