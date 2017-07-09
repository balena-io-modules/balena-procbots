import { ATN } from 'antlr4ts/atn/ATN';
import { Parser } from 'antlr4ts/Parser';
import { ParserRuleContext } from 'antlr4ts/ParserRuleContext';
import { RuleContext } from 'antlr4ts/RuleContext';
import { TerminalNode } from 'antlr4ts/tree/TerminalNode';
import { TokenStream } from 'antlr4ts/TokenStream';
import { Vocabulary } from 'antlr4ts/Vocabulary';
import { RASPListener } from './RASPListener';
import { RASPVisitor } from './RASPVisitor';
export declare class RASPParser extends Parser {
    static readonly T__0: number;
    static readonly T__1: number;
    static readonly T__2: number;
    static readonly T__3: number;
    static readonly T__4: number;
    static readonly T__5: number;
    static readonly T__6: number;
    static readonly T__7: number;
    static readonly T__8: number;
    static readonly T__9: number;
    static readonly T__10: number;
    static readonly T__11: number;
    static readonly T__12: number;
    static readonly T__13: number;
    static readonly T__14: number;
    static readonly T__15: number;
    static readonly T__16: number;
    static readonly T__17: number;
    static readonly T__18: number;
    static readonly T__19: number;
    static readonly T__20: number;
    static readonly T__21: number;
    static readonly T__22: number;
    static readonly BOT: number;
    static readonly EVENT: number;
    static readonly EVENTS: number;
    static readonly RECEIVER: number;
    static readonly RECEIVES: number;
    static readonly FROM: number;
    static readonly SEND: number;
    static readonly QUERIES: number;
    static readonly TO: number;
    static readonly SET: number;
    static readonly AS: number;
    static readonly IS: number;
    static readonly NOT: number;
    static readonly QUERY: number;
    static readonly METHOD: number;
    static readonly ERRORMETHOD: number;
    static readonly STRING: number;
    static readonly ESC: number;
    static readonly ID: number;
    static readonly BOOLEAN: number;
    static readonly NUMBER: number;
    static readonly FLOAT: number;
    static readonly INT: number;
    static readonly HEXNUMBER: number;
    static readonly COMMENT: number;
    static readonly LINE_COMMENT: number;
    static readonly WS: number;
    static readonly RULE_init: number;
    static readonly RULE_botDefinition: number;
    static readonly RULE_botBody: number;
    static readonly RULE_addListener: number;
    static readonly RULE_addEmitter: number;
    static readonly RULE_requestServiceEvents: number;
    static readonly RULE_events: number;
    static readonly RULE_setServiceAs: number;
    static readonly RULE_setIdFrom: number;
    static readonly RULE_listenerMethod: number;
    static readonly RULE_listenerEventReceiver: number;
    static readonly RULE_listenerError: number;
    static readonly RULE_statement: number;
    static readonly RULE_expr: number;
    static readonly RULE_serviceName: number;
    static readonly RULE_variable: number;
    static readonly RULE_object: number;
    static readonly RULE_array: number;
    static readonly RULE_property: number;
    static readonly RULE_assignment: number;
    static readonly RULE_r_if: number;
    static readonly RULE_r_while: number;
    static readonly RULE_loop: number;
    static readonly RULE_print: number;
    static readonly RULE_end: number;
    static readonly RULE_sendQuery: number;
    static readonly RULE_method: number;
    static readonly RULE_methodList: number;
    static readonly RULE_stringMethod: number;
    static readonly RULE_envvar: number;
    static readonly ruleNames: string[];
    private static readonly _LITERAL_NAMES;
    private static readonly _SYMBOLIC_NAMES;
    static readonly VOCABULARY: Vocabulary;
    readonly vocabulary: Vocabulary;
    readonly grammarFileName: string;
    readonly ruleNames: string[];
    readonly serializedATN: string;
    constructor(input: TokenStream);
    init(): InitContext;
    botDefinition(): BotDefinitionContext;
    botBody(): BotBodyContext;
    addListener(): AddListenerContext;
    addEmitter(): AddEmitterContext;
    requestServiceEvents(): RequestServiceEventsContext;
    events(): EventsContext;
    setServiceAs(): SetServiceAsContext;
    setIdFrom(): SetIdFromContext;
    listenerMethod(): ListenerMethodContext;
    listenerEventReceiver(): ListenerEventReceiverContext;
    listenerError(): ListenerErrorContext;
    statement(): StatementContext;
    expr(): ExprContext;
    expr(_p: number): ExprContext;
    serviceName(): ServiceNameContext;
    variable(): VariableContext;
    object(): ObjectContext;
    array(): ArrayContext;
    property(): PropertyContext;
    assignment(): AssignmentContext;
    r_if(): R_ifContext;
    r_while(): R_whileContext;
    loop(): LoopContext;
    print(): PrintContext;
    end(): EndContext;
    sendQuery(): SendQueryContext;
    method(): MethodContext;
    methodList(): MethodListContext;
    stringMethod(): StringMethodContext;
    envvar(): EnvvarContext;
    sempred(_localctx: RuleContext, ruleIndex: number, predIndex: number): boolean;
    private expr_sempred(_localctx, predIndex);
    static readonly _serializedATN: string;
    static __ATN: ATN;
    static readonly _ATN: ATN;
}
export declare class InitContext extends ParserRuleContext {
    botDefinition(): BotDefinitionContext | undefined;
    EOF(): TerminalNode | undefined;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class BotDefinitionContext extends ParserRuleContext {
    BOT(): TerminalNode;
    ID(): TerminalNode;
    botBody(): BotBodyContext[];
    botBody(i: number): BotBodyContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class BotBodyContext extends ParserRuleContext {
    addListener(): AddListenerContext | undefined;
    addEmitter(): AddEmitterContext | undefined;
    requestServiceEvents(): RequestServiceEventsContext | undefined;
    listenerMethod(): ListenerMethodContext | undefined;
    listenerError(): ListenerErrorContext | undefined;
    method(): MethodContext | undefined;
    assignment(): AssignmentContext | undefined;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class AddListenerContext extends ParserRuleContext {
    EVENT(): TerminalNode;
    RECEIVER(): TerminalNode;
    FROM(): TerminalNode;
    serviceName(): ServiceNameContext;
    setServiceAs(): SetServiceAsContext | undefined;
    object(): ObjectContext | undefined;
    variable(): VariableContext | undefined;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class AddEmitterContext extends ParserRuleContext {
    SEND(): TerminalNode;
    QUERIES(): TerminalNode;
    TO(): TerminalNode;
    serviceName(): ServiceNameContext;
    setServiceAs(): SetServiceAsContext | undefined;
    object(): ObjectContext | undefined;
    variable(): VariableContext | undefined;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class RequestServiceEventsContext extends ParserRuleContext {
    SEND(): TerminalNode;
    events(): EventsContext;
    EVENTS(): TerminalNode;
    FROM(): TerminalNode;
    serviceName(): ServiceNameContext;
    TO(): TerminalNode;
    ID(): TerminalNode;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class EventsContext extends ParserRuleContext {
    ID(): TerminalNode[];
    ID(i: number): TerminalNode;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class SetServiceAsContext extends ParserRuleContext {
    SET(): TerminalNode;
    ID(): TerminalNode;
    AS(): TerminalNode;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class SetIdFromContext extends ParserRuleContext {
    SET(): TerminalNode;
    ID(): TerminalNode;
    FROM(): TerminalNode;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class ListenerMethodContext extends ParserRuleContext {
    METHOD(): TerminalNode;
    ID(): TerminalNode;
    RECEIVES(): TerminalNode | undefined;
    listenerEventReceiver(): ListenerEventReceiverContext[];
    listenerEventReceiver(i: number): ListenerEventReceiverContext;
    statement(): StatementContext[];
    statement(i: number): StatementContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class ListenerEventReceiverContext extends ParserRuleContext {
    events(): EventsContext;
    EVENTS(): TerminalNode;
    FROM(): TerminalNode;
    serviceName(): ServiceNameContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class ListenerErrorContext extends ParserRuleContext {
    ERRORMETHOD(): TerminalNode;
    ID(): TerminalNode;
    statement(): StatementContext[];
    statement(i: number): StatementContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class StatementContext extends ParserRuleContext {
    method(): MethodContext | undefined;
    assignment(): AssignmentContext | undefined;
    r_if(): R_ifContext | undefined;
    r_while(): R_whileContext | undefined;
    loop(): LoopContext | undefined;
    print(): PrintContext | undefined;
    sendQuery(): SendQueryContext | undefined;
    end(): EndContext | undefined;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class ExprContext extends ParserRuleContext {
    expr(): ExprContext[];
    expr(i: number): ExprContext;
    IS(): TerminalNode | undefined;
    NOT(): TerminalNode | undefined;
    array(): ArrayContext | undefined;
    method(): MethodContext | undefined;
    stringMethod(): StringMethodContext | undefined;
    variable(): VariableContext | undefined;
    object(): ObjectContext | undefined;
    NUMBER(): TerminalNode | undefined;
    STRING(): TerminalNode | undefined;
    BOOLEAN(): TerminalNode | undefined;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class ServiceNameContext extends ParserRuleContext {
    ID(): TerminalNode;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class VariableContext extends ParserRuleContext {
    ID(): TerminalNode[];
    ID(i: number): TerminalNode;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class ObjectContext extends ParserRuleContext {
    property(): PropertyContext[];
    property(i: number): PropertyContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class ArrayContext extends ParserRuleContext {
    expr(): ExprContext[];
    expr(i: number): ExprContext;
    ID(): TerminalNode | undefined;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class PropertyContext extends ParserRuleContext {
    ID(): TerminalNode;
    expr(): ExprContext[];
    expr(i: number): ExprContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class AssignmentContext extends ParserRuleContext {
    variable(): VariableContext;
    expr(): ExprContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class R_ifContext extends ParserRuleContext {
    expr(): ExprContext;
    statement(): StatementContext[];
    statement(i: number): StatementContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class R_whileContext extends ParserRuleContext {
    expr(): ExprContext;
    statement(): StatementContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class LoopContext extends ParserRuleContext {
    expr(): ExprContext[];
    expr(i: number): ExprContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class PrintContext extends ParserRuleContext {
    expr(): ExprContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class EndContext extends ParserRuleContext {
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class SendQueryContext extends ParserRuleContext {
    QUERY(): TerminalNode;
    object(): ObjectContext;
    setIdFrom(): SetIdFromContext | undefined;
    ID(): TerminalNode[];
    ID(i: number): TerminalNode;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class MethodContext extends ParserRuleContext {
    variable(): VariableContext;
    methodList(): MethodListContext[];
    methodList(i: number): MethodListContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class MethodListContext extends ParserRuleContext {
    expr(): ExprContext[];
    expr(i: number): ExprContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class StringMethodContext extends ParserRuleContext {
    STRING(): TerminalNode;
    method(): MethodContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class EnvvarContext extends ParserRuleContext {
    ID(): TerminalNode;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
