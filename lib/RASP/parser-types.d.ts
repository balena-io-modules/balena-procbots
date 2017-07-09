import { GithubConstructor, GithubListenerConstructor } from '../services/github-types';

// Class types

export const enum ClassType {
    ServiceListener,
    ServiceEmitter,
    ListenerMethod,
    UserDefined,
}

export interface ClassVariable {
    name: string;
    type: ClassType;
}

// Services

export const enum ServiceType {
    Listener = 0,
    Emitter = 1,
}

export interface ServiceDefinition {
    type: ServiceType;
    name: string;
    serviceName?: string;
    constructDetails?: any;
}

// Events and EventListeners

export interface EventRegistration {
    serviceName?: string;    // Service events come from
    events?: string[];       // Events themselves
    methodName: string;     // Method the events are going to
}

// Statements

export const enum StatementOp {
    Assign = 0,
}

export interface Statement {
    type: StatementOp;
}

export interface AssignmentStatement extends Statement {
    type: StatementOp.Assign;
    name: string;
    value: Expression;
}

// Expressions

// expressions have a type, which denotes what they are
// the will have a text section if they pertain to a name
// (variable, property, ID, NUMBER, STRING, etc.)
// There are some special terminators, for example variables have
// to know that their ID is potentially an object set, so that
// the entire hierarchy is checked (ID.ID.ID) 
// Examples:
/*
set flibble as { thing1: 'thing1, thing2: { subThing21: 'yes!', subThing22: 1234 } }

statement: {
    type: StatementOp.ASSIGN;
    assignee: 'flibble';
    value: {
        type: ExpressionOp.OBJECT;
        properties: [
            {
                type: ExpressionOp.PROPERTY;
                name: 'thing1';
                value: {
                    type: ExpressionOp.STRING;
                    value: 'thing1';
                }
            },
            {
                type: ExpressionOp.PROPERTY;
                name: 'thing2';
                value: {
                    type: ExpressionOp.OBJECT;
                    properties: [
                        {
                            type: ExpressionOp.PROPERTY;
                            name: 'subThing21';
                            value: {
                                type: ExpressionOp.STRING;
                                value: 'yes!';
                            }
                        },
                        {
                            type: ExpressionOp.PROPERTY;
                            name: 'subThing21';
                            value: {
                                type: ExpressionOp.NUMBER;
                                value: 1234;
                            }
                        }
                    ]
                }
            }
        ]
    }
}

When referencing variable names, these must be checked at parse time and should they not
have been previously initialised then they will be rejected (eg assigning of an object,
other variable, etc).

When an expression is entered, a new instance of that expression type is created and
its instance of parentExpression is set to the current expression (if any, or null if 
from a statement). The BotDefinition.currentExpression is set to the new instance. ie.

enterSomeExpression() {
    const expr = new Expression<SomeExpression>
    expr.parentExpression = BotDef.currentExpr;
    BotDef.currentExpression = expr;
}

When an expression is exited, the current expression is added to the parent by
assigning it, and then the current expression becomes the parent. ie:

exitSomeExpression() {
    expr.parentExpression.assignChild(this); // ie. assign 'this'
    BotDef.currentExpression = expr.parentExpression; // Go up the chain
}

Every subtype of expression knows what its properties are (and keeps instances of what's
filled in), and can therefore assign the sub-expressions appropriate.

in the case of Object, for example, it'd be something like:

ObjectExpression.assignChild(Expression expr) {
    // Just push the property onto the object.
    this.properties.push(expr);
}

Others will need to ensure they assign the right values based on those already filled in
by precedence.

*/

export const enum ExpressionOp {
    Variable = 0,
    Property = 1,
    Object = 2,
    Array = 3,

    ID = 30,
    NUMBER = 31,
    STRING = 32,
    BOOLEAN = 33
}

export interface Expression {
    type: ExpressionOp;
    parent: Expression | undefined;
    value?: any;

    assignChild(expr: Expression): void;
}

export interface ObjectExpression extends Expression {
    type: ExpressionOp.Object;
    properties: Expression[];
}

export interface PropertyExpression extends Expression {
    type: ExpressionOp.Property;
    name: string;
    value: Expression;
}

export interface VariableExpression extends Expression {
    type: ExpressionOp.Variable;
    name: string;
    value: Expression;
}

export interface ArrayExpression extends Expression {
    type: ExpressionOp.Array;
    name?: string; // If it has a name, then we're using it as an index type
    values: Expression[];
}

// Bot details

export interface BotDetails {
    // Overall details.
    botName?: string;
    classVariables?: any[]; // The private variables that need setting. Such as assigned service variables
    listeners?: ServiceDefinition[];
    emitters?: ServiceDefinition[];
    registrations?: EventRegistration[];
    assignments?: Statement[];
    listenerMethods?: any[];

    // Current details
    currentService?: ServiceDefinition;
    currentEventRegistration?: EventRegistration;
    currentExpression?: Expression;
    currentStatement?: Statement;
    currentListenerMethod?: any;
}
