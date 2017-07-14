import * as _ from 'lodash';
import { ExprContext } from '../Antlr/RASPParser';
import { ArithmeticExpressionGenerator } from './arithmetic';
import { BotDetails, Expression, ExpressionOp } from '../parser-types';
import { ExtRASPListener } from '../parser';

export class ExpressionGenerator implements Expression {
    public type: ExpressionOp;
    public value: any;
    public parent: Expression | undefined;

    public static enterExpr(ctx: ExprContext, botStructure: BotDetails): void {
        // Only do something here if it's an actual expression or a final value atom.
        // For all other expressions that relate to other rules, we skip and let that
        // rule explicitly deal with it.

        // This needs to check all of the other types of expression and drive them appropriately.
        // To start with, we do the atoms, which are the final types.
        const atomNumber = ctx.NUMBER();
        const atomString = ctx.STRING();
        const atomBoolean = ctx.BOOLEAN();
        const addition = ctx.ADDED() && ctx.TO();
        const subtraction = ctx.SUBTRACTED() && ctx.BY();
        const multiplication = ctx.MULTIPLIED() && ctx.BY();
        const division = ctx.DIVIDED() && ctx.BY();

        console.log(ctx.text);
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
        } else if (addition || subtraction || multiplication || division) {
            // Create a new Arithmetic expression instance and give it the appropriate
            // type. The instance knows how to assigne the child, based on dual operands.
            const arithmeticExpr = new ArithmeticExpressionGenerator();
            arithmeticExpr.parent = botStructure.currentExpression;
            
            if (addition) {
                arithmeticExpr.type = ExpressionOp.Add;
            } else if (subtraction) {
                arithmeticExpr.type = ExpressionOp.Subtract;
            } else if (multiplication) {
                arithmeticExpr.type = ExpressionOp.Multiply;
            } else if (division) {
                arithmeticExpr.type = ExpressionOp.Divide;
            }                
            botStructure.currentExpression = arithmeticExpr;
        }
    }

    public static exitExpr(ctx: ExprContext, botStructure: BotDetails): void {
        const atomNumber = ctx.NUMBER();
        const atomString = ctx.STRING();
        const atomBoolean = ctx.BOOLEAN();
        const addition = ctx.ADDED() && ctx.TO();
        const subtraction = ctx.SUBTRACTED() && ctx.BY();
        const multiplication = ctx.MULTIPLIED() && ctx.BY();
        const division = ctx.DIVIDED() && ctx.BY();        
        console.log('exit');
        // If it's one of our atoms, we assign, else we skip as the actual parent
        // rule will deal with it.
        if (atomNumber || atomString || atomBoolean || addition || subtraction || multiplication || division) {
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
    listener['enterExpr'] = _.partial(ExpressionGenerator.enterExpr, _, definition);
    listener['exitExpr'] = _.partial(ExpressionGenerator.exitExpr, _, definition);
}