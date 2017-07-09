"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class PropertyExpressionGenerator {
    constructor() {
        this.type = 1;
    }
    static enterProperty(ctx, botStructure) {
        const propExpr = new PropertyExpressionGenerator();
        propExpr.parent = botStructure.currentExpression;
        propExpr.name = ctx.ID().text;
        botStructure.currentExpression = propExpr;
    }
    static exitProperty(ctx, botStructure) {
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
    assignChild(expr) {
        this.value = expr;
    }
}
exports.PropertyExpressionGenerator = PropertyExpressionGenerator;
function addListenerMethods(listener, definition) {
    listener['enterProperty'] = _.partial(PropertyExpressionGenerator.enterProperty, _, definition);
    listener['exitProperty'] = _.partial(PropertyExpressionGenerator.exitProperty, _, definition);
}
exports.addListenerMethods = addListenerMethods;

//# sourceMappingURL=property.js.map
