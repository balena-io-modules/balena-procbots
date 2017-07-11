"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ArithmeticExpressionGenerator {
    assignChild(expr) {
        console.log('this is an operand expression');
        console.log(expr);
        if (!this.operandOne) {
            this.operandOne = expr;
        }
        else {
            this.operandTwo = expr;
        }
    }
}
exports.ArithmeticExpressionGenerator = ArithmeticExpressionGenerator;

//# sourceMappingURL=arithmetic.js.map
