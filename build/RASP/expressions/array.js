"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class ArrayExpressionGenerator {
    constructor() {
        this.type = 3;
        this.values = [];
    }
    static enterArray(ctx, botStructure) {
        const arrayExpr = new ArrayExpressionGenerator();
        arrayExpr.parent = botStructure.currentExpression;
        const arrayName = ctx.ID();
        if (arrayName) {
            arrayExpr.name = arrayName.text;
        }
        botStructure.currentExpression = arrayExpr;
    }
    static exitArray(ctx, botStructure) {
        if (botStructure.currentExpression) {
            const parent = botStructure.currentExpression.parent;
            if (parent) {
                parent.assignChild(botStructure.currentExpression);
                botStructure.currentExpression = parent;
            }
        }
    }
    assignChild(expr) {
        this.values.push(expr);
    }
}
exports.ArrayExpressionGenerator = ArrayExpressionGenerator;
function addListenerMethods(listener, definition) {
    listener['enterArray'] = _.partial(ArrayExpressionGenerator.enterArray, _, definition);
    listener['exitArray'] = _.partial(ArrayExpressionGenerator.exitArray, _, definition);
}
exports.addListenerMethods = addListenerMethods;

//# sourceMappingURL=array.js.map
