"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class SendQueryStatementGenerator {
    constructor() {
        this.type = 1;
    }
    static enterSendQuery(ctx, bot) {
        bot.currentStatement = {
            type: 1,
            parent: bot.currentStatement
        };
    }
    static exitSendQuery(ctx, bot) {
        const idFrom = ctx.setIdFrom();
        let queryVariable;
        if (idFrom && idFrom.ID()) {
            queryVariable = idFrom.ID().text;
        }
        console.log(bot.currentStatement);
        console.log(bot.currentExpression);
        if (bot.currentStatement && bot.currentExpression && bot.currentListenerMethod) {
            const sendQuery = bot.currentStatement;
            sendQuery.variableName = queryVariable;
            sendQuery.value = bot.currentExpression;
            const parent = bot.currentStatement.parent;
            if (parent && parent.assignChild) {
                parent.assignChild(bot.currentStatement);
                bot.currentStatement = parent;
            }
            else {
                if (!bot.currentListenerMethod.statements) {
                    bot.currentListenerMethod.statements = [];
                }
                if (bot.currentStatement) {
                    console.log(bot.currentStatement);
                    bot.currentListenerMethod.statements.push(sendQuery);
                }
                bot.currentStatement = undefined;
            }
        }
        bot.currentExpression = undefined;
    }
}
exports.SendQueryStatementGenerator = SendQueryStatementGenerator;
function addListenerMethods(listener, definition) {
    listener['enterSendQuery'] = _.partial(SendQueryStatementGenerator.enterSendQuery, _, definition);
    listener['exitSendQuery'] = _.partial(SendQueryStatementGenerator.exitSendQuery, _, definition);
}
exports.addListenerMethods = addListenerMethods;

//# sourceMappingURL=sendquery.js.map
