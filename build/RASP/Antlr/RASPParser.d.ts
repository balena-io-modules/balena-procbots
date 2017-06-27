import { ATN } from 'antlr4ts/atn/ATN';
import { Parser } from 'antlr4ts/Parser';
import { ParserRuleContext } from 'antlr4ts/ParserRuleContext';
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
    static readonly INT: number;
    static readonly ALPHA: number;
    static readonly HEX: number;
    static readonly ALPHANUMERIC: number;
    static readonly COMMENT: number;
    static readonly LINE_COMMENT: number;
    static readonly WS: number;
    static readonly RULE_init: number;
    static readonly RULE_comment: number;
    static readonly RULE_botDefinition: number;
    static readonly RULE_botBody: number;
    static readonly RULE_addListener: number;
    static readonly RULE_addEmitter: number;
    static readonly RULE_serviceName: number;
    static readonly RULE_serviceConstructor: number;
    static readonly RULE_serviceConstructorPair: number;
    static readonly RULE_requestServiceEvents: number;
    static readonly RULE_eventRegistration: number;
    static readonly RULE_events: number;
    static readonly RULE_listenerMethodName: number;
    static readonly RULE_listenerMethod: number;
    static readonly RULE_listenerBody: number;
    static readonly RULE_envvar: number;
    static readonly RULE_path: number;
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
    comment(): CommentContext;
    botDefinition(): BotDefinitionContext;
    botBody(): BotBodyContext;
    addListener(): AddListenerContext;
    addEmitter(): AddEmitterContext;
    serviceName(): ServiceNameContext;
    serviceConstructor(): ServiceConstructorContext;
    serviceConstructorPair(): ServiceConstructorPairContext;
    requestServiceEvents(): RequestServiceEventsContext;
    eventRegistration(): EventRegistrationContext;
    events(): EventsContext;
    listenerMethodName(): ListenerMethodNameContext;
    listenerMethod(): ListenerMethodContext;
    listenerBody(): ListenerBodyContext;
    envvar(): EnvvarContext;
    path(): PathContext;
    static readonly _serializedATN: string;
    static __ATN: ATN;
    static readonly _ATN: ATN;
}
export declare class InitContext extends ParserRuleContext {
    botDefinition(): BotDefinitionContext | undefined;
    comment(): CommentContext | undefined;
    EOF(): TerminalNode | undefined;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class CommentContext extends ParserRuleContext {
    COMMENT(): TerminalNode | undefined;
    LINE_COMMENT(): TerminalNode | undefined;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class BotDefinitionContext extends ParserRuleContext {
    ALPHA(): TerminalNode;
    botBody(): BotBodyContext[];
    botBody(i: number): BotBodyContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class BotBodyContext extends ParserRuleContext {
    comment(): CommentContext | undefined;
    addListener(): AddListenerContext | undefined;
    addEmitter(): AddEmitterContext | undefined;
    requestServiceEvents(): RequestServiceEventsContext | undefined;
    listenerMethod(): ListenerMethodContext | undefined;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class AddListenerContext extends ParserRuleContext {
    serviceName(): ServiceNameContext;
    ALPHA(): TerminalNode | undefined;
    serviceConstructor(): ServiceConstructorContext[];
    serviceConstructor(i: number): ServiceConstructorContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class AddEmitterContext extends ParserRuleContext {
    serviceName(): ServiceNameContext;
    serviceConstructor(): ServiceConstructorContext | undefined;
    ALPHA(): TerminalNode | undefined;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class ServiceNameContext extends ParserRuleContext {
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class ServiceConstructorContext extends ParserRuleContext {
    serviceConstructorPair(): ServiceConstructorPairContext[];
    serviceConstructorPair(i: number): ServiceConstructorPairContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class ServiceConstructorPairContext extends ParserRuleContext {
    ALPHA(): TerminalNode[];
    ALPHA(i: number): TerminalNode;
    INT(): TerminalNode | undefined;
    HEX(): TerminalNode | undefined;
    path(): PathContext | undefined;
    serviceConstructor(): ServiceConstructorContext | undefined;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class RequestServiceEventsContext extends ParserRuleContext {
    serviceName(): ServiceNameContext;
    eventRegistration(): EventRegistrationContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class EventRegistrationContext extends ParserRuleContext {
    events(): EventsContext;
    listenerMethodName(): ListenerMethodNameContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class EventsContext extends ParserRuleContext {
    ALPHANUMERIC(): TerminalNode[];
    ALPHANUMERIC(i: number): TerminalNode;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class ListenerMethodNameContext extends ParserRuleContext {
    ALPHA(): TerminalNode;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class ListenerMethodContext extends ParserRuleContext {
    ALPHA(): TerminalNode;
    listenerBody(): ListenerBodyContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class ListenerBodyContext extends ParserRuleContext {
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class EnvvarContext extends ParserRuleContext {
    ALPHA(): TerminalNode;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class PathContext extends ParserRuleContext {
    ALPHA(): TerminalNode | undefined;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
