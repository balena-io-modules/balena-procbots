"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const arithmetic_1 = require("./arithmetic");
class ExpressionGenerator {
    static enterExpr(ctx, botStructure) {
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
            atomExpr.type = 41;
            atomExpr.value = atomNumber.text;
            botStructure.currentExpression = atomExpr;
        }
        else if (atomString) {
            const atomExpr = new ExpressionGenerator();
            atomExpr.parent = botStructure.currentExpression;
            atomExpr.type = 42;
            atomExpr.value = atomString.text;
            botStructure.currentExpression = atomExpr;
        }
        else if (atomBoolean) {
            const atomExpr = new ExpressionGenerator();
            atomExpr.parent = botStructure.currentExpression;
            atomExpr.type = 43;
            atomExpr.value = atomBoolean.text;
            botStructure.currentExpression = atomExpr;
        }
        else if (addition || subtraction || multiplication || division) {
            const arithmeticExpr = new arithmetic_1.ArithmeticExpressionGenerator();
            arithmeticExpr.parent = botStructure.currentExpression;
            if (addition) {
                arithmeticExpr.type = 10;
            }
            else if (subtraction) {
                arithmeticExpr.type = 11;
            }
            else if (multiplication) {
                arithmeticExpr.type = 12;
            }
            else if (division) {
                arithmeticExpr.type = 13;
            }
            botStructure.currentExpression = arithmeticExpr;
        }
    }
    static exitExpr(ctx, botStructure) {
        const atomNumber = ctx.NUMBER();
        const atomString = ctx.STRING();
        const atomBoolean = ctx.BOOLEAN();
        const addition = ctx.ADDED() && ctx.TO();
        const subtraction = ctx.SUBTRACTED() && ctx.BY();
        const multiplication = ctx.MULTIPLIED() && ctx.BY();
        const division = ctx.DIVIDED() && ctx.BY();
        console.log('exit');
        if (atomNumber || atomString || atomBoolean || addition || subtraction || multiplication || division) {
            if (botStructure.currentExpression) {
                const parent = botStructure.currentExpression.parent;
                if (parent) {
                    parent.assignChild(botStructure.currentExpression);
                    botStructure.currentExpression = parent;
                }
                else {
                    botStructure.currentExpression = undefined;
                }
            }
        }
    }
    assignChild(expr) {
        this.value = expr;
    }
}
exports.ExpressionGenerator = ExpressionGenerator;
function addListenerMethods(listener, definition) {
    listener['enterExpr'] = _.partial(ExpressionGenerator.enterExpr, _, definition);
    listener['exitExpr'] = _.partial(ExpressionGenerator.exitExpr, _, definition);
}
exports.addListenerMethods = addListenerMethods;

//# sourceMappingURL=expr.js.map
