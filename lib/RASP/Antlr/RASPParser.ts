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
	public static readonly T__12=13;
	public static readonly T__13=14;
	public static readonly T__14=15;
	public static readonly T__15=16;
	public static readonly T__16=17;
	public static readonly INT=18;
	public static readonly ALPHA=19;
	public static readonly HEX=20;
	public static readonly ALPHANUMERIC=21;
	public static readonly COMMENT=22;
	public static readonly LINE_COMMENT=23;
	public static readonly WS=24;
	public static readonly RULE_init = 0;
	public static readonly RULE_comment = 1;
	public static readonly RULE_botDefinition = 2;
	public static readonly RULE_botBody = 3;
	public static readonly RULE_addListener = 4;
	public static readonly RULE_addEmitter = 5;
	public static readonly RULE_serviceName = 6;
	public static readonly RULE_serviceConstructor = 7;
	public static readonly RULE_serviceConstructorPair = 8;
	public static readonly RULE_requestServiceEvents = 9;
	public static readonly RULE_eventRegistration = 10;
	public static readonly RULE_events = 11;
	public static readonly RULE_listenerMethodName = 12;
	public static readonly RULE_listenerMethod = 13;
	public static readonly RULE_listenerBody = 14;
	public static readonly RULE_envvar = 15;
	public static readonly RULE_path = 16;
	public static readonly ruleNames: string[] = [
		"init", "comment", "botDefinition", "botBody", "addListener", "addEmitter", 
		"serviceName", "serviceConstructor", "serviceConstructorPair", "requestServiceEvents", 
		"eventRegistration", "events", "listenerMethodName", "listenerMethod", 
		"listenerBody", "envvar", "path"
	];

	private static readonly _LITERAL_NAMES: (string | undefined)[] = [
		undefined, "'bot('", "')'", "'{'", "'}'", "'='", "'AddListener('", "','", 
		"'AddEmitter('", "'github'", "'flowdock'", "':'", "'RequestEvents('", 
		"'['", "']'", "'envar'", "'('", "'/'"
	];
	private static readonly _SYMBOLIC_NAMES: (string | undefined)[] = [
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, "INT", "ALPHA", "HEX", "ALPHANUMERIC", 
		"COMMENT", "LINE_COMMENT", "WS"
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
			this.state = 37;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case RASPParser.T__0:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 34;
				this.botDefinition();
				}
				break;
			case RASPParser.COMMENT:
			case RASPParser.LINE_COMMENT:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 35;
				this.comment();
				}
				break;
			case RASPParser.EOF:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 36;
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
	public comment(): CommentContext {
		let _localctx: CommentContext = new CommentContext(this._ctx, this.state);
		this.enterRule(_localctx, 2, RASPParser.RULE_comment);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 39;
			_la = this._input.LA(1);
			if ( !(_la===RASPParser.COMMENT || _la===RASPParser.LINE_COMMENT) ) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
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
		this.enterRule(_localctx, 4, RASPParser.RULE_botDefinition);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 41;
			this.match(RASPParser.T__0);
			this.state = 42;
			this.match(RASPParser.ALPHA);
			this.state = 43;
			this.match(RASPParser.T__1);
			this.state = 44;
			this.match(RASPParser.T__2);
			this.state = 45;
			this.botBody();
			this.state = 49;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << RASPParser.T__5) | (1 << RASPParser.T__7) | (1 << RASPParser.T__11) | (1 << RASPParser.ALPHA) | (1 << RASPParser.COMMENT) | (1 << RASPParser.LINE_COMMENT))) !== 0)) {
				{
				{
				this.state = 46;
				this.botBody();
				}
				}
				this.state = 51;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 52;
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
		this.enterRule(_localctx, 6, RASPParser.RULE_botBody);
		try {
			this.state = 59;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input,2,this._ctx) ) {
			case 1:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 54;
				this.comment();
				}
				break;

			case 2:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 55;
				this.addListener();
				}
				break;

			case 3:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 56;
				this.addEmitter();
				}
				break;

			case 4:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 57;
				this.requestServiceEvents();
				}
				break;

			case 5:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 58;
				this.listenerMethod();
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
	public addListener(): AddListenerContext {
		let _localctx: AddListenerContext = new AddListenerContext(this._ctx, this.state);
		this.enterRule(_localctx, 8, RASPParser.RULE_addListener);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 63;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===RASPParser.ALPHA) {
				{
				this.state = 61;
				this.match(RASPParser.ALPHA);
				this.state = 62;
				this.match(RASPParser.T__4);
				}
			}

			this.state = 65;
			this.match(RASPParser.T__5);
			this.state = 66;
			this.serviceName();
			this.state = 71;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===RASPParser.T__6) {
				{
				{
				this.state = 67;
				this.match(RASPParser.T__6);
				this.state = 68;
				this.serviceConstructor();
				}
				}
				this.state = 73;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 74;
			this.match(RASPParser.T__1);
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
	public addEmitter(): AddEmitterContext {
		let _localctx: AddEmitterContext = new AddEmitterContext(this._ctx, this.state);
		this.enterRule(_localctx, 10, RASPParser.RULE_addEmitter);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 78;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===RASPParser.ALPHA) {
				{
				this.state = 76;
				this.match(RASPParser.ALPHA);
				this.state = 77;
				this.match(RASPParser.T__4);
				}
			}

			this.state = 80;
			this.match(RASPParser.T__7);
			this.state = 81;
			this.serviceName();
			{
			this.state = 82;
			this.match(RASPParser.T__6);
			this.state = 83;
			this.serviceConstructor();
			}
			this.state = 85;
			this.match(RASPParser.T__1);
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
		this.enterRule(_localctx, 12, RASPParser.RULE_serviceName);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 87;
			_la = this._input.LA(1);
			if ( !(_la===RASPParser.T__8 || _la===RASPParser.T__9) ) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
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
		this.enterRule(_localctx, 14, RASPParser.RULE_serviceConstructor);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 89;
			this.match(RASPParser.T__2);
			this.state = 90;
			this.serviceConstructorPair();
			this.state = 95;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===RASPParser.T__6) {
				{
				{
				this.state = 91;
				this.match(RASPParser.T__6);
				this.state = 92;
				this.serviceConstructorPair();
				}
				}
				this.state = 97;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 98;
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
	public serviceConstructorPair(): ServiceConstructorPairContext {
		let _localctx: ServiceConstructorPairContext = new ServiceConstructorPairContext(this._ctx, this.state);
		this.enterRule(_localctx, 16, RASPParser.RULE_serviceConstructorPair);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 100;
			this.match(RASPParser.ALPHA);
			this.state = 101;
			this.match(RASPParser.T__10);
			this.state = 107;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case RASPParser.ALPHA:
				{
				this.state = 102;
				this.match(RASPParser.ALPHA);
				}
				break;
			case RASPParser.INT:
				{
				this.state = 103;
				this.match(RASPParser.INT);
				}
				break;
			case RASPParser.HEX:
				{
				this.state = 104;
				this.match(RASPParser.HEX);
				}
				break;
			case RASPParser.T__16:
				{
				this.state = 105;
				this.path();
				}
				break;
			case RASPParser.T__2:
				{
				this.state = 106;
				this.serviceConstructor();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
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
	public requestServiceEvents(): RequestServiceEventsContext {
		let _localctx: RequestServiceEventsContext = new RequestServiceEventsContext(this._ctx, this.state);
		this.enterRule(_localctx, 18, RASPParser.RULE_requestServiceEvents);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 109;
			this.match(RASPParser.T__11);
			this.state = 110;
			this.serviceName();
			this.state = 111;
			this.match(RASPParser.T__6);
			this.state = 112;
			this.eventRegistration();
			this.state = 113;
			this.match(RASPParser.T__1);
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
	public eventRegistration(): EventRegistrationContext {
		let _localctx: EventRegistrationContext = new EventRegistrationContext(this._ctx, this.state);
		this.enterRule(_localctx, 20, RASPParser.RULE_eventRegistration);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 115;
			this.events();
			this.state = 116;
			this.match(RASPParser.T__6);
			this.state = 117;
			this.listenerMethodName();
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
	public events(): EventsContext {
		let _localctx: EventsContext = new EventsContext(this._ctx, this.state);
		this.enterRule(_localctx, 22, RASPParser.RULE_events);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 119;
			this.match(RASPParser.T__12);
			this.state = 120;
			this.match(RASPParser.ALPHANUMERIC);
			this.state = 125;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===RASPParser.T__6) {
				{
				{
				this.state = 121;
				this.match(RASPParser.T__6);
				this.state = 122;
				this.match(RASPParser.ALPHANUMERIC);
				}
				}
				this.state = 127;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 128;
			this.match(RASPParser.T__13);
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
	public listenerMethodName(): ListenerMethodNameContext {
		let _localctx: ListenerMethodNameContext = new ListenerMethodNameContext(this._ctx, this.state);
		this.enterRule(_localctx, 24, RASPParser.RULE_listenerMethodName);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 130;
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
	@RuleVersion(0)
	public listenerMethod(): ListenerMethodContext {
		let _localctx: ListenerMethodContext = new ListenerMethodContext(this._ctx, this.state);
		this.enterRule(_localctx, 26, RASPParser.RULE_listenerMethod);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 132;
			this.match(RASPParser.ALPHA);
			this.state = 133;
			this.match(RASPParser.T__2);
			this.state = 134;
			this.listenerBody();
			this.state = 135;
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
	public listenerBody(): ListenerBodyContext {
		let _localctx: ListenerBodyContext = new ListenerBodyContext(this._ctx, this.state);
		this.enterRule(_localctx, 28, RASPParser.RULE_listenerBody);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
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
	public envvar(): EnvvarContext {
		let _localctx: EnvvarContext = new EnvvarContext(this._ctx, this.state);
		this.enterRule(_localctx, 30, RASPParser.RULE_envvar);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 139;
			this.match(RASPParser.T__14);
			this.state = 140;
			this.match(RASPParser.T__15);
			this.state = 141;
			this.match(RASPParser.ALPHA);
			this.state = 142;
			this.match(RASPParser.T__1);
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
	public path(): PathContext {
		let _localctx: PathContext = new PathContext(this._ctx, this.state);
		this.enterRule(_localctx, 32, RASPParser.RULE_path);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 144;
			this.match(RASPParser.T__16);
			this.state = 146;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===RASPParser.ALPHA) {
				{
				this.state = 145;
				this.match(RASPParser.ALPHA);
				}
			}

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
		"\x03\uAF6F\u8320\u479D\uB75C\u4880\u1605\u191C\uAB37\x03\x1A\x97\x04\x02"+
		"\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07"+
		"\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r\x04"+
		"\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04\x11\t\x11\x04\x12\t\x12\x03"+
		"\x02\x03\x02\x03\x02\x05\x02(\n\x02\x03\x03\x03\x03\x03\x04\x03\x04\x03"+
		"\x04\x03\x04\x03\x04\x03\x04\x07\x042\n\x04\f\x04\x0E\x045\v\x04\x03\x04"+
		"\x03\x04\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05\x05\x05>\n\x05\x03\x06"+
		"\x03\x06\x05\x06B\n\x06\x03\x06\x03\x06\x03\x06\x03\x06\x07\x06H\n\x06"+
		"\f\x06\x0E\x06K\v\x06\x03\x06\x03\x06\x03\x07\x03\x07\x05\x07Q\n\x07\x03"+
		"\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\b\x03\b\x03\t"+
		"\x03\t\x03\t\x03\t\x07\t`\n\t\f\t\x0E\tc\v\t\x03\t\x03\t\x03\n\x03\n\x03"+
		"\n\x03\n\x03\n\x03\n\x03\n\x05\nn\n\n\x03\v\x03\v\x03\v\x03\v\x03\v\x03"+
		"\v\x03\f\x03\f\x03\f\x03\f\x03\r\x03\r\x03\r\x03\r\x07\r~\n\r\f\r\x0E"+
		"\r\x81\v\r\x03\r\x03\r\x03\x0E\x03\x0E\x03\x0F\x03\x0F\x03\x0F\x03\x0F"+
		"\x03\x0F\x03\x10\x03\x10\x03\x11\x03\x11\x03\x11\x03\x11\x03\x11\x03\x12"+
		"\x03\x12\x05\x12\x95\n\x12\x03\x12\x02\x02\x02\x13\x02\x02\x04\x02\x06"+
		"\x02\b\x02\n\x02\f\x02\x0E\x02\x10\x02\x12\x02\x14\x02\x16\x02\x18\x02"+
		"\x1A\x02\x1C\x02\x1E\x02 \x02\"\x02\x02\x04\x03\x02\x18\x19\x03\x02\v"+
		"\f\x96\x02\'\x03\x02\x02\x02\x04)\x03\x02\x02\x02\x06+\x03\x02\x02\x02"+
		"\b=\x03\x02\x02\x02\nA\x03\x02\x02\x02\fP\x03\x02\x02\x02\x0EY\x03\x02"+
		"\x02\x02\x10[\x03\x02\x02\x02\x12f\x03\x02\x02\x02\x14o\x03\x02\x02\x02"+
		"\x16u\x03\x02\x02\x02\x18y\x03\x02\x02\x02\x1A\x84\x03\x02\x02\x02\x1C"+
		"\x86\x03\x02\x02\x02\x1E\x8B\x03\x02\x02\x02 \x8D\x03\x02\x02\x02\"\x92"+
		"\x03\x02\x02\x02$(\x05\x06\x04\x02%(\x05\x04\x03\x02&(\x07\x02\x02\x03"+
		"\'$\x03\x02\x02\x02\'%\x03\x02\x02\x02\'&\x03\x02\x02\x02(\x03\x03\x02"+
		"\x02\x02)*\t\x02\x02\x02*\x05\x03\x02\x02\x02+,\x07\x03\x02\x02,-\x07"+
		"\x15\x02\x02-.\x07\x04\x02\x02./\x07\x05\x02\x02/3\x05\b\x05\x0202\x05"+
		"\b\x05\x0210\x03\x02\x02\x0225\x03\x02\x02\x0231\x03\x02\x02\x0234\x03"+
		"\x02\x02\x0246\x03\x02\x02\x0253\x03\x02\x02\x0267\x07\x06\x02\x027\x07"+
		"\x03\x02\x02\x028>\x05\x04\x03\x029>\x05\n\x06\x02:>\x05\f\x07\x02;>\x05"+
		"\x14\v\x02<>\x05\x1C\x0F\x02=8\x03\x02\x02\x02=9\x03\x02\x02\x02=:\x03"+
		"\x02\x02\x02=;\x03\x02\x02\x02=<\x03\x02\x02\x02>\t\x03\x02\x02\x02?@"+
		"\x07\x15\x02\x02@B\x07\x07\x02\x02A?\x03\x02\x02\x02AB\x03\x02\x02\x02"+
		"BC\x03\x02\x02\x02CD\x07\b\x02\x02DI\x05\x0E\b\x02EF\x07\t\x02\x02FH\x05"+
		"\x10\t\x02GE\x03\x02\x02\x02HK\x03\x02\x02\x02IG\x03\x02\x02\x02IJ\x03"+
		"\x02\x02\x02JL\x03\x02\x02\x02KI\x03\x02\x02\x02LM\x07\x04\x02\x02M\v"+
		"\x03\x02\x02\x02NO\x07\x15\x02\x02OQ\x07\x07\x02\x02PN\x03\x02\x02\x02"+
		"PQ\x03\x02\x02\x02QR\x03\x02\x02\x02RS\x07\n\x02\x02ST\x05\x0E\b\x02T"+
		"U\x07\t\x02\x02UV\x05\x10\t\x02VW\x03\x02\x02\x02WX\x07\x04\x02\x02X\r"+
		"\x03\x02\x02\x02YZ\t\x03\x02\x02Z\x0F\x03\x02\x02\x02[\\\x07\x05\x02\x02"+
		"\\a\x05\x12\n\x02]^\x07\t\x02\x02^`\x05\x12\n\x02_]\x03\x02\x02\x02`c"+
		"\x03\x02\x02\x02a_\x03\x02\x02\x02ab\x03\x02\x02\x02bd\x03\x02\x02\x02"+
		"ca\x03\x02\x02\x02de\x07\x06\x02\x02e\x11\x03\x02\x02\x02fg\x07\x15\x02"+
		"\x02gm\x07\r\x02\x02hn\x07\x15\x02\x02in\x07\x14\x02\x02jn\x07\x16\x02"+
		"\x02kn\x05\"\x12\x02ln\x05\x10\t\x02mh\x03\x02\x02\x02mi\x03\x02\x02\x02"+
		"mj\x03\x02\x02\x02mk\x03\x02\x02\x02ml\x03\x02\x02\x02n\x13\x03\x02\x02"+
		"\x02op\x07\x0E\x02\x02pq\x05\x0E\b\x02qr\x07\t\x02\x02rs\x05\x16\f\x02"+
		"st\x07\x04\x02\x02t\x15\x03\x02\x02\x02uv\x05\x18\r\x02vw\x07\t\x02\x02"+
		"wx\x05\x1A\x0E\x02x\x17\x03\x02\x02\x02yz\x07\x0F\x02\x02z\x7F\x07\x17"+
		"\x02\x02{|\x07\t\x02\x02|~\x07\x17\x02\x02}{\x03\x02\x02\x02~\x81\x03"+
		"\x02\x02\x02\x7F}\x03\x02\x02\x02\x7F\x80\x03\x02\x02\x02\x80\x82\x03"+
		"\x02\x02\x02\x81\x7F\x03\x02\x02\x02\x82\x83\x07\x10\x02\x02\x83\x19\x03"+
		"\x02\x02\x02\x84\x85\x07\x15\x02\x02\x85\x1B\x03\x02\x02\x02\x86\x87\x07"+
		"\x15\x02\x02\x87\x88\x07\x05\x02\x02\x88\x89\x05\x1E\x10\x02\x89\x8A\x07"+
		"\x06\x02\x02\x8A\x1D\x03\x02\x02\x02\x8B\x8C\x03\x02\x02\x02\x8C\x1F\x03"+
		"\x02\x02\x02\x8D\x8E\x07\x11\x02\x02\x8E\x8F\x07\x12\x02\x02\x8F\x90\x07"+
		"\x15\x02\x02\x90\x91\x07\x04\x02\x02\x91!\x03\x02\x02\x02\x92\x94\x07"+
		"\x13\x02\x02\x93\x95\x07\x15\x02\x02\x94\x93\x03\x02\x02\x02\x94\x95\x03"+
		"\x02\x02\x02\x95#\x03\x02\x02\x02\f\'3=AIPam\x7F\x94";
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
	public comment(): CommentContext | undefined {
		return this.tryGetRuleContext(0, CommentContext);
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


export class CommentContext extends ParserRuleContext {
	public COMMENT(): TerminalNode | undefined { return this.tryGetToken(RASPParser.COMMENT, 0); }
	public LINE_COMMENT(): TerminalNode | undefined { return this.tryGetToken(RASPParser.LINE_COMMENT, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_comment; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterComment) listener.enterComment(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitComment) listener.exitComment(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitComment) return visitor.visitComment(this);
		else return visitor.visitChildren(this);
	}
}


export class BotDefinitionContext extends ParserRuleContext {
	public ALPHA(): TerminalNode { return this.getToken(RASPParser.ALPHA, 0); }
	public botBody(): BotBodyContext[];
	public botBody(i: number): BotBodyContext;
	public botBody(i?: number): BotBodyContext | BotBodyContext[] {
		if (i === undefined) {
			return this.getRuleContexts(BotBodyContext);
		} else {
			return this.getRuleContext(i, BotBodyContext);
		}
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
	public comment(): CommentContext | undefined {
		return this.tryGetRuleContext(0, CommentContext);
	}
	public addListener(): AddListenerContext | undefined {
		return this.tryGetRuleContext(0, AddListenerContext);
	}
	public addEmitter(): AddEmitterContext | undefined {
		return this.tryGetRuleContext(0, AddEmitterContext);
	}
	public requestServiceEvents(): RequestServiceEventsContext | undefined {
		return this.tryGetRuleContext(0, RequestServiceEventsContext);
	}
	public listenerMethod(): ListenerMethodContext | undefined {
		return this.tryGetRuleContext(0, ListenerMethodContext);
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
	public ALPHA(): TerminalNode | undefined { return this.tryGetToken(RASPParser.ALPHA, 0); }
	public serviceConstructor(): ServiceConstructorContext[];
	public serviceConstructor(i: number): ServiceConstructorContext;
	public serviceConstructor(i?: number): ServiceConstructorContext | ServiceConstructorContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ServiceConstructorContext);
		} else {
			return this.getRuleContext(i, ServiceConstructorContext);
		}
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


export class AddEmitterContext extends ParserRuleContext {
	public serviceName(): ServiceNameContext {
		return this.getRuleContext(0, ServiceNameContext);
	}
	public serviceConstructor(): ServiceConstructorContext | undefined {
		return this.tryGetRuleContext(0, ServiceConstructorContext);
	}
	public ALPHA(): TerminalNode | undefined { return this.tryGetToken(RASPParser.ALPHA, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_addEmitter; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterAddEmitter) listener.enterAddEmitter(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitAddEmitter) listener.exitAddEmitter(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitAddEmitter) return visitor.visitAddEmitter(this);
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
	public serviceConstructorPair(): ServiceConstructorPairContext[];
	public serviceConstructorPair(i: number): ServiceConstructorPairContext;
	public serviceConstructorPair(i?: number): ServiceConstructorPairContext | ServiceConstructorPairContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ServiceConstructorPairContext);
		} else {
			return this.getRuleContext(i, ServiceConstructorPairContext);
		}
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


export class ServiceConstructorPairContext extends ParserRuleContext {
	public ALPHA(): TerminalNode[];
	public ALPHA(i: number): TerminalNode;
	public ALPHA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(RASPParser.ALPHA);
		} else {
			return this.getToken(RASPParser.ALPHA, i);
		}
	}
	public INT(): TerminalNode | undefined { return this.tryGetToken(RASPParser.INT, 0); }
	public HEX(): TerminalNode | undefined { return this.tryGetToken(RASPParser.HEX, 0); }
	public path(): PathContext | undefined {
		return this.tryGetRuleContext(0, PathContext);
	}
	public serviceConstructor(): ServiceConstructorContext | undefined {
		return this.tryGetRuleContext(0, ServiceConstructorContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_serviceConstructorPair; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterServiceConstructorPair) listener.enterServiceConstructorPair(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitServiceConstructorPair) listener.exitServiceConstructorPair(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitServiceConstructorPair) return visitor.visitServiceConstructorPair(this);
		else return visitor.visitChildren(this);
	}
}


export class RequestServiceEventsContext extends ParserRuleContext {
	public serviceName(): ServiceNameContext {
		return this.getRuleContext(0, ServiceNameContext);
	}
	public eventRegistration(): EventRegistrationContext {
		return this.getRuleContext(0, EventRegistrationContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_requestServiceEvents; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterRequestServiceEvents) listener.enterRequestServiceEvents(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitRequestServiceEvents) listener.exitRequestServiceEvents(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitRequestServiceEvents) return visitor.visitRequestServiceEvents(this);
		else return visitor.visitChildren(this);
	}
}


export class EventRegistrationContext extends ParserRuleContext {
	public events(): EventsContext {
		return this.getRuleContext(0, EventsContext);
	}
	public listenerMethodName(): ListenerMethodNameContext {
		return this.getRuleContext(0, ListenerMethodNameContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_eventRegistration; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterEventRegistration) listener.enterEventRegistration(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitEventRegistration) listener.exitEventRegistration(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitEventRegistration) return visitor.visitEventRegistration(this);
		else return visitor.visitChildren(this);
	}
}


export class EventsContext extends ParserRuleContext {
	public ALPHANUMERIC(): TerminalNode[];
	public ALPHANUMERIC(i: number): TerminalNode;
	public ALPHANUMERIC(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(RASPParser.ALPHANUMERIC);
		} else {
			return this.getToken(RASPParser.ALPHANUMERIC, i);
		}
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_events; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterEvents) listener.enterEvents(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitEvents) listener.exitEvents(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitEvents) return visitor.visitEvents(this);
		else return visitor.visitChildren(this);
	}
}


export class ListenerMethodNameContext extends ParserRuleContext {
	public ALPHA(): TerminalNode { return this.getToken(RASPParser.ALPHA, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_listenerMethodName; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterListenerMethodName) listener.enterListenerMethodName(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitListenerMethodName) listener.exitListenerMethodName(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitListenerMethodName) return visitor.visitListenerMethodName(this);
		else return visitor.visitChildren(this);
	}
}


export class ListenerMethodContext extends ParserRuleContext {
	public ALPHA(): TerminalNode { return this.getToken(RASPParser.ALPHA, 0); }
	public listenerBody(): ListenerBodyContext {
		return this.getRuleContext(0, ListenerBodyContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_listenerMethod; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterListenerMethod) listener.enterListenerMethod(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitListenerMethod) listener.exitListenerMethod(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitListenerMethod) return visitor.visitListenerMethod(this);
		else return visitor.visitChildren(this);
	}
}


export class ListenerBodyContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_listenerBody; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterListenerBody) listener.enterListenerBody(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitListenerBody) listener.exitListenerBody(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitListenerBody) return visitor.visitListenerBody(this);
		else return visitor.visitChildren(this);
	}
}


export class EnvvarContext extends ParserRuleContext {
	public ALPHA(): TerminalNode { return this.getToken(RASPParser.ALPHA, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_envvar; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterEnvvar) listener.enterEnvvar(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitEnvvar) listener.exitEnvvar(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitEnvvar) return visitor.visitEnvvar(this);
		else return visitor.visitChildren(this);
	}
}


export class PathContext extends ParserRuleContext {
	public ALPHA(): TerminalNode | undefined { return this.tryGetToken(RASPParser.ALPHA, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return RASPParser.RULE_path; }
	@Override
	public enterRule(listener: RASPListener): void {
		if (listener.enterPath) listener.enterPath(this);
	}
	@Override
	public exitRule(listener: RASPListener): void {
		if (listener.exitPath) listener.exitPath(this);
	}
	@Override
	public accept<Result>(visitor: RASPVisitor<Result>): Result {
		if (visitor.visitPath) return visitor.visitPath(this);
		else return visitor.visitChildren(this);
	}
}


