"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const helpers_1 = require("../helpers");
class AssignmentStatementGenerator {
    constructor() {
        this.type = 0;
    }
    static enterAssignment(ctx, bot) {
        if (bot.currentEventRegistration) {
            throw new Error('There is already a event registration being constructed, error');
        }
        bot.currentStatement = {
            type: 0
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
            helpers_1.DebugExpression(bot.currentExpression);
        }
        if (bot.currentListenerMethod) {
        }
        else {
            if (!bot.assignments) {
                bot.assignments = [];
            }
            assignmentContext = bot.assignments;
            if (bot.currentStatement) {
                assignmentContext.push(bot.currentStatement);
            }
        }
        bot.currentStatement = undefined;
    }
}
exports.AssignmentStatementGenerator = AssignmentStatementGenerator;
function addListenerMethods(listener, definition) {
    listener['enterAssignment'] = _.partial(AssignmentStatementGenerator.enterAssignment, _, definition);
    listener['exitAssignment'] = _.partial(AssignmentStatementGenerator.exitAssignment, _, definition);
}
exports.addListenerMethods = addListenerMethods;

//# sourceMappingURL=assignment.js.map
