import { ArrayContext } from '../Antlr/RASPParser';
import { BotDetails, Expression, ExpressionOp, ArrayExpression } from '../parser-types';
import { ExtRASPListener } from '../parser';
export declare class ArrayExpressionGenerator implements ArrayExpression {
    type: ExpressionOp.Array;
    name: string;
    values: Expression[];
    parent: Expression | undefined;
    static enterArray(ctx: ArrayContext, botStructure: BotDetails): void;
    static exitArray(ctx: ArrayContext, botStructure: BotDetails): void;
    assignChild(expr: Expression): void;
}
export declare function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void;
