import * as _ from 'lodash';
import { R_ifContext, R_if_elseifContext, R_if_elseContext } from '../Antlr/RASPParser';
import { BotDetails, Expression, ObjectExpression, IfClause, IfStatement, Statement,
	StatementOp } from '../parser-types';
import { DebugExpression } from '../helpers';
import { ExtRASPListener } from '../parser';

export enum IfType {
	If,
	Else
};

export class IfStatementGenerator implements IfStatement {
	public type: StatementOp.If = StatementOp.If;
	public parent: Statement;
	public ifs: IfClause[];
	public else: Statement;
	public currentClause: IfType;
	
	public static enterR_if(ctx: R_ifContext, bot: BotDetails): void {
		// New R_if
		console.log('send if in');
		console.log(ctx.text);
		bot.currentStatement = {
			type: StatementOp.If,
			parent: bot.currentStatement
		};
	}

	public static exitR_if(ctx: R_ifContext, bot: BotDetails): void {
		// Is this a
		console.log('send if out');

		// Ensure we have the name from the current expression and the values.
		console.log(bot.currentStatement);
		console.log(bot.currentExpression);
		if (bot.currentStatement && bot.currentExpression && bot.currentListenerMethod) {
			console.log('got everything required');
			const R_if = <IfStatement>bot.currentStatement;

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
					console.log('pushing statment');
					console.log(bot.currentStatement);
					bot.currentListenerMethod.statements.push(R_if);
				}
				bot.currentStatement = undefined;		
			}
			//DebugExpression(bot.currentStatement);
		}
		bot.currentExpression = undefined;
	}

	public enterR_if_elseif(ctx.) {
		Set the parent's internal state to the IfElse clause, so when assignChild is called it can be set
	}

	public exitR_if_elseif() {
		On exit, set the expression for the current clause (last of the IfClause statements)
	}

	public enterR_if_else(ctx.) {
		Set the parent's internal state to the ELSE clause, so when assignChild is called it sets the right thing
	}

	public exitR_if_else() {
		On exit, we set the expression for it (the else statement)
	}

	public assignChild(statement: Statement, expr: Expression) {
		// We set the statement based on the current entrance vector
		if (this.currentClause === IfType.If) {
			this.ifs.push({ statement })
		} else {
			this.else = statement;
		}
	}
}

export function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void {
	listener['enterR_if'] = _.partial(IfStatementGenerator.enterR_if, _, definition);
	listener['exitR_if'] = _.partial(IfStatementGenerator.exitR_if, _, definition);
}