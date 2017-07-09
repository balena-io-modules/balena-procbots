import { PropertyContext } from '../Antlr/RASPParser';
import { BotDetails, Expression, ExpressionOp, PropertyExpression } from '../parser-types';
import { ExtRASPListener } from '../parser';
export declare class PropertyExpressionGenerator implements PropertyExpression {
    type: ExpressionOp.Property;
    name: string;
    value: Expression;
    parent: Expression | undefined;
    static enterProperty(ctx: PropertyContext, botStructure: BotDetails): void;
    static exitProperty(ctx: PropertyContext, botStructure: BotDetails): void;
    assignChild(expr: Expression): void;
}
export declare function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void;
