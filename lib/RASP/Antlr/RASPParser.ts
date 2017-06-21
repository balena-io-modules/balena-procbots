// Generated from lib/RASP/Antlr/RASP.g4 by ANTLR 4.6-SNAPSHOT


import { ATN } from 'antlr4ts/atn/ATN';
import { ATNDeserializer } from 'antlr4ts/atn/ATNDeserializer';
import { FailedPredicateException } from 'antlr4ts/FailedPredicateException';
import { NotNull } from 'antlr4ts/Decorators';
import { NoViableAltException } from 'antlr4ts/NoViableAltException';
import { Override } from 'antlr4ts/Decorators';
import { Parser } from 'antlr4ts/Parser';
import { ParserRuleContext } from 'antlr4ts/ParserRuleContext';
import { ParserATNSimulator } from 'antlr4ts/atn/ParserATNSimulator';
import { ParseTreeListener } from 'antlr4ts/tree/ParseTreeListener';
import { ParseTreeVisitor } from 'antlr4ts/tree/ParseTreeVisitor';
import { RecognitionException } from 'antlr4ts/RecognitionException';
import { RuleContext } from 'antlr4ts/RuleContext';
import { RuleVersion } from 'antlr4ts/RuleVersion';
import { TerminalNode } from 'antlr4ts/tree/TerminalNode';
import { Token } from 'antlr4ts/Token';
import { TokenStream } from 'antlr4ts/TokenStream';
import { Vocabulary } from 'antlr4ts/Vocabulary';
import { VocabularyImpl } from 'antlr4ts/VocabularyImpl';

import * as Utils from 'antlr4ts/misc/Utils';

import { RASPListener } from './RASPListener';
import { RASPVisitor } from './RASPVisitor';


export class RASPParser extends Parser {
	public static readonly T__0=1;
	public static readonly T__1=2;
	public static readonly T__2=3;
	public static readonly T__3=4;
	public static readonly T__4=5;
	public static readonly T__5=6;
	public static readonly T__6=7;
	public static readonly T__7=8;
	public static readonly T__8=9;
	public static readonly T__9=10;
	public static readonly T__10=11;
	public static readonly T__11=12;
	public static readonly ALPHA=13;
	public static readonly INT=14;
	public static readonly WS=15;
	public static readonly RULE_init = 0;
	public static readonly RULE_botDefinition = 1;
	public static readonly RULE_botBody = 2;
	public static readonly RULE_addListener = 3;
	public static readonly RULE_serviceName = 4;
	public static readonly RULE_serviceConstructor = 5;
	public static readonly RULE_githubConstructor = 6;
	public static readonly RULE_githubConstructorType = 7;
	public static readonly ruleNames: string[] = [
		"init", "botDefinition", "botBody", "addListener", "serviceName", "serviceConstructor", 
		"githubConstructor", "githubConstructorType"
	];

	private static readonly _LITERAL_NAMES: (string | undefined)[] = [
		undefined, "'bot('", "')'", "'{'", "'}'", "'AddListener('", "','", "')\n'", 
		"'github'", "'appId'", "'secret'", "'pem'", "':'"
	];
	private static readonly _SYMBOLIC_NAMES: (string | undefined)[] = [
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, undefined, undefined, "ALPHA", 
		"INT", "WS"
	];
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(RASPParser._LITERAL_NAMES, RASPParser._SYMBOLIC_NAMES, []);

	@Override
	@NotNull
	public get vocabulary(): Vocabulary {
		return RASPParser.VOCABULARY;
	}

	@Override
	public get grammarFileName(): string { return "RASP.g4"; }

	@Override
	public get ruleNames(): string[] { return RASPParser.ruleNames; }

	@Override
	public get serializedATN(): string { return RASPParser._serializedATN; }

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(RASPParser._ATN, this);
	}
	@RuleVersion(0)
	public init(): InitContext {
		let _localctx: InitContext = new InitContext(this._ctx, this.state);
		this.enterRule(_localctx, 0, RASPParser.RULE_init);
		try {
			this.state = 18;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case RASPParser.T__0:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 16;
				this.botDefinition();
				}
				break;
			case RASPParser.EOF:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 17;
				this.match(RASPParser.EOF);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public botDefinition(): BotDefinitionContext {
		let _localctx: BotDefinitionContext = new BotDefinitionContext(this._ctx, this.state);
		this.enterRule(_localctx, 2, RASPParser.RULE_botDefinition);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 20;
			this.match(RASPParser.T__0);
			this.state = 21;
			this.match(RASPParser.ALPHA);
			this.state = 22;
			this.match(RASPParser.T__1);
			this.state = 23;
			this.match(RASPParser.T__2);
			this.state = 24;
			this.botBody();
			this.state = 25;
			this.match(RASPParser.T__3);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public botBody(): BotBodyContext {
		let _localctx: BotBodyContext = new BotBodyContext(this._ctx, this.state);
		this.enterRule(_localctx, 4, RASPParser.RULE_botBody);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 27;
			this.addListener();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public addListener(): AddListenerContext {
		let _localctx: AddListenerContext = new AddListenerContext(this._ctx, this.state);
		this.enterRule(_localctx, 6, RASPParser.RULE_addListener);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 29;
			this.match(RASPParser.T__4);
			this.state = 30;
			this.serviceName();
			{
			this.state = 31;
			this.match(RASPParser.T__5);
			this.state = 32;
			this.serviceConstructor();
			}
			this.state = 34;
			this.match(RASPParser.T__6);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public serviceName(): ServiceNameContext {
		let _localctx: ServiceNameContext = new ServiceNameContext(this._ctx, this.state);
		this.enterRule(_localctx, 8, RASPParser.RULE_serviceName);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 36;
			this.match(RASPParser.T__7);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public serviceConstructor(): ServiceConstructorContext {
		let _localctx: ServiceConstructorContext = new ServiceConstructorContext(this._ctx, this.state);
		this.enterRule(_localctx, 10, RASPParser.RULE_serviceConstructor);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 38;
			this.githubConstructor();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public githubConstructor(): GithubConstructorContext {
		let _localctx: GithubConstructorContext = new GithubConstructorContext(this._ctx, this.state);
		this.enterRule(_localctx, 12, RASPParser.RULE_githubConstructor);
		let _la: number;
		try {
			this.state = 53;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input,2,this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 40;
				this.match(RASPParser.T__2);
				this.state = 41;
				this.githubConstructorType();
				this.state = 46;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la===RASPParser.T__5) {
					{
					{
					this.state = 42;
					this.match(RASPParser.T__5);
					this.state = 43;
					this.githubConstructorType();
					}
					}
					this.state = 48;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 49;
				this.match(RASPParser.T__3);
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 51;
				this.match(RASPParser.T__2);
				this.state = 52;
				this.match(RASPParser.T__3);
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public githubConstructorType(): GithubConstructorTypeContext {
		let _localctx: GithubConstructorTypeContext = new GithubConstructorTypeContext(this._ctx, this.state);
		this.enterRule(_localctx, 14, RASPParser.RULE_githubConstructorType);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 55;
			_la = this._input.LA(1);
			if ( !((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << RASPParser.T__8) | (1 << RASPParser.T__9) | (1 << RASPParser.T__10))) !== 0)) ) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			this.state = 56;
			this.match(RASPParser.T__11);
			this.state = 57;
			this.match(RASPParser.ALPHA);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public static readonly _serializedATN: string =
		"\x03\uAF6F\u8320\u479D\uB75C\u4880\u1605\u191C\uAB37\x03\x11>\x04\x02"+
		"\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07"+
		"\t\x07\x04\b\t\b\x04\t\t\t\x03\x02\x03\x02\x05\x02\x15\n\x02\x03\x03\x03"+
		"\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x04\x03\x04\x03\x05\x03"+
		"\x05\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05\x03\x06\x03\x06\x03\x07\x03"+
		"\x07\x03\b\x03\b\x03\b\x03\b\x07\b/\n\b\f\b\x0E\b2\v\b\x03\b\x03\b\x03"+
		"\b\x03\b\x05\b8\n\b\x03\t\x03\t\x03\t\x03\t\x03\t\x02\x02\x02\n\x02\x02"+
		"\x04\x02\x06\x02\b\x02\n\x02\f\x02\x0E\x02\x10\x02\x02\x03\x03\x02\v\r"+
		"8\x02\x14\x03\x02\x02\x02\x04\x16\x03\x02\x02\x02\x06\x1D\x03\x02\x02"+
		"\x02\b\x1F\x03\x02\x02\x02\n&\x03\x02\x02\x02\f(\x03\x02\x02\x02\x0E7"+
		"\x03\x02\x02\x02\x109\x03\x02\x02\x02\x12\x15\x05\x04\x03\x02\x13\x15"+
		"\x07\x02\x02\x03\x14\x12\x03\x02\x02\x02\x14\x13\x03\x02\x02\x02\x15\x03"+
		"\x03\x02\x02\x02\x16\x17\x07\x03\x02\x02\x17\x18\x07\x0F\x02\x02\x18\x19"+
		"\x07\x04\x02\x02\x19\x1A\x07\x05\x02\x02\x1A\x1B\x05\x06\x04\x02\x1B\x1C"+
		"\x07\x06\x02\x02\x1C\x05\x03\x02\x02\x02\x1D\x1E\x05\b\x05\x02\x1E\x07"+
		"\x03\x02\x02\x02\x1F \x07\x07\x02\x02 !\x05\n\x06\x02!\"\x07\b\x02\x02"+
		"\"#\x05\f\x07\x02#$\x03\x02\x02\x02$%\x07\t\x02\x02%\t\x03\x02\x02\x02"+
		"&\'\x07\n\x02\x02\'\v\x03\x02\x02\x02()\x05\x0E\b\x02)\r\x03\x02\x02\x02"+
		"*+\x07\x05\x02\x02+0\x05\x10\t\x02,-\x07\b\x02\x02-/\x05\x10\t\x02.,\x03"+
		"\x02\x02\x02/2\x03\x02\x02\x020.\x03\x02\x02\x0201\x03\x02\x02\x0213\x03"+
		"\x02\x02\x0220\x03\x02\x02\x0234\x07\x06\x02\x0248\x03\x02\x02\x0256\x07"+
		"\x05\x02\x0268\x07\x06\x02\x027*\x03\x02\x02\x0275\x03\x02\x02\x028\x0F"+
		"\x03\x02\x02\x029:\t\x02\x02\x02:;\x07\x0E\x02\x02;<\x07\x0F\x02\x02<"+
		"\x11\x03\x02\x02\x02\x05\x1407";
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!RASPParser.__ATN) {
			RASPParser.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(RASPParser._serializedATN));
		}

		return RASPParser.__ATN;
	}

}

export class InitContext extends ParserRuleContext {
	public botDefinition(): BotDefinitionContext | undefined {
		return this.tryGetRuleContext(0, BotDefinitionContext);
	}
	public EOF(): TerminalNode | undefined { return this.tryGetToken(RASPParser.EOF, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_init; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterInit) listener.enterInit(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitInit) listener.exitInit(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitInit) return visitor.visitInit(this);
		else return visitor.visitChildren(this);
	}
}


export class BotDefinitionContext extends ParserRuleContext {
	public ALPHA(): TerminalNode { return this.getToken(RASPParser.ALPHA, 0); }
	public botBody(): BotBodyContext {
		return this.getRuleContext(0, BotBodyContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_botDefinition; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterBotDefinition) listener.enterBotDefinition(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitBotDefinition) listener.exitBotDefinition(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitBotDefinition) return visitor.visitBotDefinition(this);
		else return visitor.visitChildren(this);
	}
}


export class BotBodyContext extends ParserRuleContext {
	public addListener(): AddListenerContext {
		return this.getRuleContext(0, AddListenerContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_botBody; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterBotBody) listener.enterBotBody(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitBotBody) listener.exitBotBody(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitBotBody) return visitor.visitBotBody(this);
		else return visitor.visitChildren(this);
	}
}


export class AddListenerContext extends ParserRuleContext {
	public serviceName(): ServiceNameContext {
		return this.getRuleContext(0, ServiceNameContext);
	}
	public serviceConstructor(): ServiceConstructorContext | undefined {
		return this.tryGetRuleContext(0, ServiceConstructorContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_addListener; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterAddListener) listener.enterAddListener(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitAddListener) listener.exitAddListener(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitAddListener) return visitor.visitAddListener(this);
		else return visitor.visitChildren(this);
	}
}


export class ServiceNameContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_serviceName; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterServiceName) listener.enterServiceName(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitServiceName) listener.exitServiceName(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitServiceName) return visitor.visitServiceName(this);
		else return visitor.visitChildren(this);
	}
}


export class ServiceConstructorContext extends ParserRuleContext {
	public githubConstructor(): GithubConstructorContext {
		return this.getRuleContext(0, GithubConstructorContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_serviceConstructor; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterServiceConstructor) listener.enterServiceConstructor(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitServiceConstructor) listener.exitServiceConstructor(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitServiceConstructor) return visitor.visitServiceConstructor(this);
		else return visitor.visitChildren(this);
	}
}


export class GithubConstructorContext extends ParserRuleContext {
	public githubConstructorType(): GithubConstructorTypeContext[];
	public githubConstructorType(i: number): GithubConstructorTypeContext;
	public githubConstructorType(i?: number): GithubConstructorTypeContext | GithubConstructorTypeContext[] {
		if (i === undefined) {
			return this.getRuleContexts(GithubConstructorTypeContext);
		} else {
			return this.getRuleContext(i, GithubConstructorTypeContext);
		}
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_githubConstructor; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterGithubConstructor) listener.enterGithubConstructor(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitGithubConstructor) listener.exitGithubConstructor(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitGithubConstructor) return visitor.visitGithubConstructor(this);
		else return visitor.visitChildren(this);
	}
}


export class GithubConstructorTypeContext extends ParserRuleContext {
	public ALPHA(): TerminalNode { return this.getToken(RASPParser.ALPHA, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_githubConstructorType; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterGithubConstructorType) listener.enterGithubConstructorType(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitGithubConstructorType) listener.exitGithubConstructorType(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitGithubConstructorType) return visitor.visitGithubConstructorType(this);
		else return visitor.visitChildren(this);
	}
}


