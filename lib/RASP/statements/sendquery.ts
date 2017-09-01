import * as _ from 'lodash';
import { SendQueryContext } from '../Antlr/RASPParser';
import { BotDetails, Expression, ObjectExpression, SendQueryStatement, Statement,
	StatementOp } from '../parser-types';
import { DebugExpression } from '../helpers';
import { ExtRASPListener } from '../parser';

export class SendQueryStatementGenerator implements SendQueryStatement {
	public type: StatementOp.Query = StatementOp.Query;
	public parent: Statement;
	public variableName: undefined;
	public value: ObjectExpression;
	
	public static enterSendQuery(ctx: SendQueryContext, bot: BotDetails): void {
		// New SendQuery
		bot.currentStatement = {
			type: StatementOp.Query,
			parent: bot.currentStatement
		};
	}

	public static exitSendQuery(ctx: SendQueryContext, bot: BotDetails): void {
		// Are we assigning a variable to it?
		const idFrom = ctx.setIdFrom();
		let queryVariable;
		if (idFrom && idFrom.ID()) {
			queryVariable = idFrom.ID().text;
		}

		// Ensure we have the name from the current expression and the values.
		console.log(bot.currentStatement);
		console.log(bot.currentExpression);
		if (bot.currentStatement && bot.currentExpression && bot.currentListenerMethod) {
			const sendQuery = <SendQueryStatement>bot.currentStatement;
			sendQuery.variableName = queryVariable;
			sendQuery.value = <ObjectExpression>bot.currentExpression;

			const parent = bot.currentStatement.parent;
			if (parent && parent.assignChild) {
				parent.assignChild(bot.currentStatement);
				bot.currentStatement = parent;
			} else {
				if (!bot.currentListenerMethod.statements) {
					bot.currentListenerMethod.statements = [];
				}

				// Add to the statements.
				if (bot.currentStatement) {
					console.log(bot.currentStatement);
					bot.currentListenerMethod.statements.push(sendQuery);
				}
				bot.currentStatement = undefined;		
			}
			//DebugExpression(bot.currentStatement);
		}
		bot.currentExpression = undefined;
	}
}

export function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void {
	listener['enterSendQuery'] = _.partial(SendQueryStatementGenerator.enterSendQuery, _, definition);
	listener['exitSendQuery'] = _.partial(SendQueryStatementGenerator.exitSendQuery, _, definition);
}