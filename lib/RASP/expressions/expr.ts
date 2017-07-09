import * as _ from 'lodash';
import { ExprContext } from '../Antlr/RASPParser';
import { BotDetails, Expression, ExpressionOp } from '../parser-types';
import { ExtRASPListener } from '../parser';

export class ExpressionGenerator implements Expression {
    public type: ExpressionOp;
    public value: any;
    public parent: Expression | undefined;

    public static enterProperty(ctx: ExprContext, botStructure: BotDetails): void {
        // Only do something here if it's an actual expression or a final value atom.
        // For all other expressions that relate to other rules, we skip and let that
        // rule explicitly deal with it.

        // This needs to check all of the other types of expression and drive them appropriately.
        // To start with, we do the atoms, which are the final types.
        const atomNumber = ctx.NUMBER();
        const atomString = ctx.STRING();
        const atomBoolean = ctx.BOOLEAN();
        if (atomNumber) {
            const atomExpr = new ExpressionGenerator();
            atomExpr.parent = botStructure.currentExpression;
            atomExpr.type = ExpressionOp.NUMBER;
            atomExpr.value = atomNumber.text;
            botStructure.currentExpression = atomExpr;
        } else if (atomString) {
            const atomExpr = new ExpressionGenerator();
            atomExpr.parent = botStructure.currentExpression;
            atomExpr.type = ExpressionOp.STRING;
            atomExpr.value = atomString.text;
            botStructure.currentExpression = atomExpr;
        } else if (atomBoolean) {
            const atomExpr = new ExpressionGenerator();
            atomExpr.parent = botStructure.currentExpression;
            atomExpr.type = ExpressionOp.BOOLEAN;
            atomExpr.value = atomBoolean.text;
            botStructure.currentExpression = atomExpr;
        }
    }

    public static exitProperty(ctx: ExprContext, botStructure: BotDetails): void {
        const atomNumber = ctx.NUMBER();
        const atomString = ctx.STRING();
        const atomBoolean = ctx.BOOLEAN();
        // If it's one of our atoms, we assign, else we skip as the actual parent
        // rule will deal with it.
        if (atomNumber || atomString || atomBoolean) {
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
    }

    public assignChild(expr: Expression): void {
        this.value = expr;
    }
}

export function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void {
    listener['enterExpr'] = _.partial(ExpressionGenerator.enterProperty, _, definition);
    listener['exitExpr'] = _.partial(ExpressionGenerator.exitProperty, _, definition);
}