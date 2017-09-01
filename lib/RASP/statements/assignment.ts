import * as _ from 'lodash';
import { AssignmentContext } from '../Antlr/RASPParser';
import { AssignmentStatement, BotDetails, Expression, Statement, StatementOp,
	VariableExpression  } from '../parser-types';
import { DebugExpression } from '../helpers';
import { ExtRASPListener } from '../parser';

export class AssignmentStatementGenerator implements AssignmentStatement {
	public type: StatementOp.Assign = StatementOp.Assign;
	public parent: Statement | undefined;
	public name: string;
	public value: Expression;
	
	public static enterAssignment(ctx: AssignmentContext, bot: BotDetails): void {
		// New Assignment
		bot.currentStatement = {
			type: StatementOp.Assign,
			parent: bot.currentStatement
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
			//DebugExpression(bot.currentExpression);
			if (bot.currentListenerMethod) {
				const parent = bot.currentStatement.parent;
				if (parent && parent.assignChild) {
					parent.assignChild(bot.currentStatement);
					bot.currentStatement = parent;
				} else {
					// We'd set context to the listener method.
					if (!bot.currentListenerMethod.statements) {
						bot.currentListenerMethod.statements = [];
					}
					bot.currentListenerMethod.statements.push(bot.currentStatement);
					bot.currentStatement = undefined;
				}
			} else {
				if (!bot.assignments) {
					bot.assignments = [];
				}
				bot.assignments.push(bot.currentStatement);
			}
			bot.currentExpression = undefined;
		}
	}
}

export function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void {
	listener['enterAssignment'] = _.partial(AssignmentStatementGenerator.enterAssignment, _, definition);
	listener['exitAssignment'] = _.partial(AssignmentStatementGenerator.exitAssignment, _, definition);
}