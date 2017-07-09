import * as _ from 'lodash';
import { PropertyContext } from '../Antlr/RASPParser';
import { BotDetails, Expression, ExpressionOp, PropertyExpression } from '../parser-types';
import { ExtRASPListener } from '../parser';

export class PropertyExpressionGenerator implements PropertyExpression {
    public type: ExpressionOp.Property = ExpressionOp.Property;
    public name: string;
    public value: Expression;
    public parent: Expression | undefined;

    public static enterProperty(ctx: PropertyContext, botStructure: BotDetails): void {
        // Create a new Object Expression, set its parent, and then ensure the current
        // parsed expression is this.
        const propExpr = new PropertyExpressionGenerator();
        propExpr.parent = botStructure.currentExpression;

        // Get the property name.
        propExpr.name = ctx.ID().text;

        botStructure.currentExpression = propExpr;
    }

    public static exitProperty(ctx: PropertyContext, botStructure: BotDetails): void {
        if (botStructure.currentExpression) {
            const parent = botStructure.currentExpression.parent;
            // Either assign current to parent.
            if (parent) {
                parent.assignChild(botStructure.currentExpression);
                botStructure.currentExpression = parent;
            } else {
                // Or there's no more parent expressions.
                botStructure.currentExpression = undefined;
            }
        }
    }

    public assignChild(expr: Expression): void {
        this.value = expr;
    }
}

export function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void {
    listener['enterProperty'] = _.partial(PropertyExpressionGenerator.enterProperty, _, definition);
    listener['exitProperty'] = _.partial(PropertyExpressionGenerator.exitProperty, _, definition);
}