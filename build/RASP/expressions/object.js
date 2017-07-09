"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class ObjectExpressionGenerator {
    constructor() {
        this.type = 2;
        this.properties = [];
    }
    static enterObject(ctx, botStructure) {
        const objectExpr = new ObjectExpressionGenerator();
        objectExpr.parent = botStructure.currentExpression;
        botStructure.currentExpression = objectExpr;
    }
    static exitObject(ctx, botStructure) {
        if (botStructure.currentExpression) {
            const parent = botStructure.currentExpression.parent;
            if (parent) {
                parent.assignChild(botStructure.currentExpression);
                botStructure.currentExpression = parent;
            }
        }
    }
    assignChild(expr) {
        this.properties.push(expr);
    }
}
exports.ObjectExpressionGenerator = ObjectExpressionGenerator;
function addListenerMethods(listener, definition) {
    listener['enterObject'] = _.partial(ObjectExpressionGenerator.enterObject, _, definition);
    listener['exitObject'] = _.partial(ObjectExpressionGenerator.exitObject, _, definition);
}
exports.addListenerMethods = addListenerMethods;

//# sourceMappingURL=object.js.map
