import { SendQueryContext } from '../Antlr/RASPParser';
import { BotDetails, ObjectExpression, SendQueryStatement, Statement, StatementOp } from '../parser-types';
import { ExtRASPListener } from '../parser';
export declare class SendQueryStatementGenerator implements SendQueryStatement {
    type: StatementOp.Query;
    parent: Statement;
    variableName: undefined;
    value: ObjectExpression;
    static enterSendQuery(ctx: SendQueryContext, bot: BotDetails): void;
    static exitSendQuery(ctx: SendQueryContext, bot: BotDetails): void;
}
export declare function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void;
