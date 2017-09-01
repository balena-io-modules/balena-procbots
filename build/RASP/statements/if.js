"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
var IfType;
(function (IfType) {
    IfType[IfType["If"] = 0] = "If";
    IfType[IfType["Else"] = 1] = "Else";
})(IfType = exports.IfType || (exports.IfType = {}));
;
class IfStatementGenerator {
    constructor() {
        this.type = 2;
    }
    static enterR_if(ctx, bot) {
        console.log('send if in');
        console.log(ctx.text);
        bot.currentStatement = {
            type: 2,
            parent: bot.currentStatement
        };
    }
    static exitR_if(ctx, bot) {
        console.log('send if out');
        console.log(bot.currentStatement);
        console.log(bot.currentExpression);
        if (bot.currentStatement && bot.currentExpression && bot.currentListenerMethod) {
            console.log('got everything required');
            const R_if = bot.currentStatement;
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
                    console.log('pushing statment');
                    console.log(bot.currentStatement);
                    bot.currentListenerMethod.statements.push(R_if);
                }
                bot.currentStatement = undefined;
            }
        }
        bot.currentExpression = undefined;
    }
    enterR_if_elseif(ctx) {
        Set;
        the;
        parent;
        's internal state to the IfElse clause, so when assignChild is called it can be set;
    }
    exitR_if_elseif() {
        On;
        exit, set;
        the;
        expression;
        for (the; current; clause(last, of, the, IfClause, statements))
            ;
    }
    enterR_if_else(ctx) {
        Set;
        the;
        parent;
        's internal state to the ELSE clause, so when assignChild is called it sets the right thing;
    }
    exitR_if_else() {
        On;
        exit, we;
        set;
        the;
        expression;
        for (it(the, statement); ; )
            ;
    }
    assignChild(statement, expr) {
        if (this.currentClause === IfType.If) {
            this.ifs.push({ statement });
        }
        else {
            this.else = statement;
        }
    }
}
exports.IfStatementGenerator = IfStatementGenerator;
function addListenerMethods(listener, definition) {
    listener['enterR_if'] = _.partial(IfStatementGenerator.enterR_if, _, definition);
    listener['exitR_if'] = _.partial(IfStatementGenerator.exitR_if, _, definition);
}
exports.addListenerMethods = addListenerMethods;

//# sourceMappingURL=if.js.map
