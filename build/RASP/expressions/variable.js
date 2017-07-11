"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class VariableExpressionGenerator {
    constructor() {
        this.type = 0;
    }
    static enterVariable(ctx, botStructure) {
        const variableExpr = new VariableExpressionGenerator();
        variableExpr.parent = botStructure.currentExpression;
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
    static exitVariable(ctx, botStructure) {
        if (botStructure.currentExpression) {
            const parent = botStructure.currentExpression.parent;
            if (parent) {
                parent.assignChild(botStructure.currentExpression);
                botStructure.currentExpression = parent;
            }
        }
    }
    assignChild(expr) {
        this.value = expr;
    }
}
exports.VariableExpressionGenerator = VariableExpressionGenerator;
function addListenerMethods(listener, definition) {
    listener['enterVariable'] = _.partial(VariableExpressionGenerator.enterVariable, _, definition);
    listener['exitVariable'] = _.partial(VariableExpressionGenerator.exitVariable, _, definition);
}
exports.addListenerMethods = addListenerMethods;

//# sourceMappingURL=variable.js.map
