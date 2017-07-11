import * as _ from 'lodash';
import { AssignmentContext } from '../Antlr/RASPParser';
import { AssignmentStatement, BotDetails, Expression, Statement, StatementOp,
    VariableExpression  } from '../parser-types';
import { DebugExpression } from '../helpers';
import { ExtRASPListener } from '../parser';

export class AssignmentStatementGenerator implements AssignmentStatement {
    public type: StatementOp.Assign = StatementOp.Assign;
    public name: string;
    public value: Expression;
    
    public static enterAssignment(ctx: AssignmentContext, bot: BotDetails): void {
        // New Assignment
        if (bot.currentEventRegistration) {
            throw new Error('There is already a event registration being constructed, error');
        }
        bot.currentStatement = {
            type: StatementOp.Assign
        };
    }

    public static exitAssignment(_ctx: AssignmentContext, bot: BotDetails): void {
        // We have to test if this is a listener method or in the global context.
        let assignmentContext: Statement[];

        // Ensure we have the name from the current expression and the values.
        console.log(bot.currentExpression);
        if (bot.currentStatement && bot.currentExpression) {
            const variable = <VariableExpression>bot.currentExpression;
            const assignment = <AssignmentStatement>bot.currentStatement;
            assignment.name = variable.name;
            assignment.value = variable.value;
            DebugExpression(bot.currentExpression);
        }
        if (bot.currentListenerMethod) {
            // We'd set context to the listener method.
            if (!bot.currentListenerMethod.statements) {
                bot.currentListenerMethod.statements = [];
            }
            assignmentContext = bot.currentListenerMethod.statements;
        } else {
            if (!bot.assignments) {
                bot.assignments = [];
            }
            assignmentContext = bot.assignments;
        }
        // Do assignment here
        if (bot.currentStatement) {
            assignmentContext.push(bot.currentStatement);
        }
        bot.currentStatement = undefined;
        bot.currentExpression = undefined;
    }
}

export function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void {
    listener['enterAssignment'] = _.partial(AssignmentStatementGenerator.enterAssignment, _, definition);
    listener['exitAssignment'] = _.partial(AssignmentStatementGenerator.exitAssignment, _, definition);
}