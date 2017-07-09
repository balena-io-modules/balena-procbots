import { VariableContext } from '../Antlr/RASPParser';
import { BotDetails, Expression, ExpressionOp, VariableExpression } from '../parser-types';
import { ExtRASPListener } from '../parser';
export declare class VariableExpressionGenerator implements VariableExpression {
    type: ExpressionOp.Variable;
    name: string;
    value: Expression;
    parent: Expression | undefined;
    static enterVariable(ctx: VariableContext, botStructure: BotDetails): void;
    static exitVariable(ctx: VariableContext, botStructure: BotDetails): void;
    assignChild(expr: Expression): void;
}
export declare function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void;
