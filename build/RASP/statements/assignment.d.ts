import { AssignmentContext } from '../Antlr/RASPParser';
import { AssignmentStatement, BotDetails, Expression, Statement, StatementOp } from '../parser-types';
import { ExtRASPListener } from '../parser';
export declare class AssignmentStatementGenerator implements AssignmentStatement {
    type: StatementOp.Assign;
    parent: Statement | undefined;
    name: string;
    value: Expression;
    static enterAssignment(ctx: AssignmentContext, bot: BotDetails): void;
    static exitAssignment(_ctx: AssignmentContext, bot: BotDetails): void;
}
export declare function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void;
