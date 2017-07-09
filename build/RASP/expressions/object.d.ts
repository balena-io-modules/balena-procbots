import { ObjectContext } from '../Antlr/RASPParser';
import { BotDetails, Expression, ExpressionOp, ObjectExpression } from '../parser-types';
import { ExtRASPListener } from '../parser';
export declare class ObjectExpressionGenerator implements ObjectExpression {
    type: ExpressionOp.Object;
    properties: Expression[];
    parent: Expression | undefined;
    static enterObject(ctx: ObjectContext, botStructure: BotDetails): void;
    static exitObject(ctx: ObjectContext, botStructure: BotDetails): void;
    assignChild(expr: Expression): void;
}
export declare function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void;
