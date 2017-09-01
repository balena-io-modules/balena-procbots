import { R_ifContext } from '../Antlr/RASPParser';
import { BotDetails, Expression, IfClause, IfStatement, Statement, StatementOp } from '../parser-types';
import { ExtRASPListener } from '../parser';
export declare enum IfType {
    If = 0,
    Else = 1,
}
export declare class IfStatementGenerator implements IfStatement {
    type: StatementOp.If;
    parent: Statement;
    ifs: IfClause[];
    else: Statement;
    currentClause: IfType;
    static enterR_if(ctx: R_ifContext, bot: BotDetails): void;
    static exitR_if(ctx: R_ifContext, bot: BotDetails): void;
    enterR_if_elseif(ctx: any): void;
    exitR_if_elseif(): void;
    enterR_if_else(ctx: any): void;
    exitR_if_else(): void;
    assignChild(statement: Statement, expr: Expression): void;
}
export declare function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void;
