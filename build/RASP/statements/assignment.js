"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class AssignmentStatementGenerator {
    constructor() {
        this.type = 0;
    }
    static enterAssignment(ctx, bot) {
        bot.currentStatement = {
            type: 0,
            parent: bot.currentStatement
        };
    }
    static exitAssignment(_ctx, bot) {
        let assignmentContext;
        console.log(bot.currentExpression);
        if (bot.currentStatement && bot.currentExpression) {
            const variable = bot.currentExpression;
            const assignment = bot.currentStatement;
            assignment.name = variable.name;
            assignment.value = variable.value;
            if (bot.currentListenerMethod) {
                const parent = bot.currentStatement.parent;
                if (parent && parent.assignChild) {
                    parent.assignChild(bot.currentStatement);
                    bot.currentStatement = parent;
                }
                else {
                    if (!bot.currentListenerMethod.statements) {
                        bot.currentListenerMethod.statements = [];
                    }
                    bot.currentListenerMethod.statements.push(bot.currentStatement);
                    bot.currentStatement = undefined;
                }
            }
            else {
                if (!bot.assignments) {
                    bot.assignments = [];
                }
                bot.assignments.push(bot.currentStatement);
            }
            bot.currentExpression = undefined;
        }
    }
}
exports.AssignmentStatementGenerator = AssignmentStatementGenerator;
function addListenerMethods(listener, definition) {
    listener['enterAssignment'] = _.partial(AssignmentStatementGenerator.enterAssignment, _, definition);
    listener['exitAssignment'] = _.partial(AssignmentStatementGenerator.exitAssignment, _, definition);
}
exports.addListenerMethods = addListenerMethods;

//# sourceMappingURL=assignment.js.map
