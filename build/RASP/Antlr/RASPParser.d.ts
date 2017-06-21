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
    static readonly ALPHA: number;
    static readonly INT: number;
    static readonly WS: number;
    static readonly RULE_init: number;
    static readonly RULE_botDefinition: number;
    static readonly RULE_botBody: number;
    static readonly RULE_botName: number;
    static readonly RULE_addListener: number;
    static readonly RULE_serviceName: number;
    static readonly RULE_serviceConstructor: number;
    static readonly RULE_githubConstructor: number;
    static readonly RULE_githubConstructorType: number;
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
    botName(): BotNameContext;
    addListener(): AddListenerContext;
    serviceName(): ServiceNameContext;
    serviceConstructor(): ServiceConstructorContext;
    githubConstructor(): GithubConstructorContext;
    githubConstructorType(): GithubConstructorTypeContext;
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
    botName(): BotNameContext;
    botBody(): BotBodyContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class BotBodyContext extends ParserRuleContext {
    addListener(): AddListenerContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class BotNameContext extends ParserRuleContext {
    ALPHA(): TerminalNode;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class AddListenerContext extends ParserRuleContext {
    serviceName(): ServiceNameContext;
    serviceConstructor(): ServiceConstructorContext | undefined;
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
    githubConstructor(): GithubConstructorContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class GithubConstructorContext extends ParserRuleContext {
    githubConstructorType(): GithubConstructorTypeContext[];
    githubConstructorType(i: number): GithubConstructorTypeContext;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
export declare class GithubConstructorTypeContext extends ParserRuleContext {
    ALPHA(): TerminalNode;
    constructor(parent: ParserRuleContext, invokingState: number);
    readonly ruleIndex: number;
    enterRule(listener: RASPListener): void;
    exitRule(listener: RASPListener): void;
    accept<Result>(visitor: RASPVisitor<Result>): Result;
}
