"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class ExpressionGenerator {
    static enterProperty(ctx, botStructure) {
        const atomNumber = ctx.NUMBER();
        const atomString = ctx.STRING();
        const atomBoolean = ctx.BOOLEAN();
        if (atomNumber) {
            const atomExpr = new ExpressionGenerator();
            atomExpr.parent = botStructure.currentExpression;
            atomExpr.type = 31;
            atomExpr.value = atomNumber.text;
            botStructure.currentExpression = atomExpr;
        }
        else if (atomString) {
            const atomExpr = new ExpressionGenerator();
            atomExpr.parent = botStructure.currentExpression;
            atomExpr.type = 32;
            atomExpr.value = atomString.text;
            botStructure.currentExpression = atomExpr;
        }
        else if (atomBoolean) {
            const atomExpr = new ExpressionGenerator();
            atomExpr.parent = botStructure.currentExpression;
            atomExpr.type = 33;
            atomExpr.value = atomBoolean.text;
            botStructure.currentExpression = atomExpr;
        }
    }
    static exitProperty(ctx, botStructure) {
        const atomNumber = ctx.NUMBER();
        const atomString = ctx.STRING();
        const atomBoolean = ctx.BOOLEAN();
        if (atomNumber || atomString || atomBoolean) {
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
    listener['enterExpr'] = _.partial(ExpressionGenerator.enterProperty, _, definition);
    listener['exitExpr'] = _.partial(ExpressionGenerator.exitProperty, _, definition);
}
exports.addListenerMethods = addListenerMethods;

//# sourceMappingURL=expr.js.map
