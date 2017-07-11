import { ExprContext } from '../Antlr/RASPParser';
import { BotDetails, Expression, ExpressionOp } from '../parser-types';
import { ExtRASPListener } from '../parser';
export declare class ExpressionGenerator implements Expression {
    type: ExpressionOp;
    value: any;
    parent: Expression | undefined;
    static enterExpr(ctx: ExprContext, botStructure: BotDetails): void;
    static exitExpr(ctx: ExprContext, botStructure: BotDetails): void;
    assignChild(expr: Expression): void;
}
export declare function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void;
