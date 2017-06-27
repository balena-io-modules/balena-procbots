"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ATNDeserializer_1 = require("antlr4ts/atn/ATNDeserializer");
const Decorators_1 = require("antlr4ts/Decorators");
const NoViableAltException_1 = require("antlr4ts/NoViableAltException");
const Decorators_2 = require("antlr4ts/Decorators");
const Parser_1 = require("antlr4ts/Parser");
const ParserRuleContext_1 = require("antlr4ts/ParserRuleContext");
const ParserATNSimulator_1 = require("antlr4ts/atn/ParserATNSimulator");
const RecognitionException_1 = require("antlr4ts/RecognitionException");
const RuleVersion_1 = require("antlr4ts/RuleVersion");
const Token_1 = require("antlr4ts/Token");
const VocabularyImpl_1 = require("antlr4ts/VocabularyImpl");
const Utils = require("antlr4ts/misc/Utils");
class RASPParser extends Parser_1.Parser {
    constructor(input) {
        super(input);
        this._interp = new ParserATNSimulator_1.ParserATNSimulator(RASPParser._ATN, this);
    }
    get vocabulary() {
        return RASPParser.VOCABULARY;
    }
    get grammarFileName() { return "RASP.g4"; }
    get ruleNames() { return RASPParser.ruleNames; }
    get serializedATN() { return RASPParser._serializedATN; }
    init() {
        let _localctx = new InitContext(this._ctx, this.state);
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
                    throw new NoViableAltException_1.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    comment() {
        let _localctx = new CommentContext(this._ctx, this.state);
        this.enterRule(_localctx, 2, RASPParser.RULE_comment);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 39;
                _la = this._input.LA(1);
                if (!(_la === RASPParser.COMMENT || _la === RASPParser.LINE_COMMENT)) {
                    this._errHandler.recoverInline(this);
                }
                else {
                    if (this._input.LA(1) === Token_1.Token.EOF) {
                        this.matchedEOF = true;
                    }
                    this._errHandler.reportMatch(this);
                    this.consume();
                }
            }
        }
        catch (re) {
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    botDefinition() {
        let _localctx = new BotDefinitionContext(this._ctx, this.state);
        this.enterRule(_localctx, 4, RASPParser.RULE_botDefinition);
        let _la;
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
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    botBody() {
        let _localctx = new BotBodyContext(this._ctx, this.state);
        this.enterRule(_localctx, 6, RASPParser.RULE_botBody);
        try {
            this.state = 59;
            this._errHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this._input, 2, this._ctx)) {
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
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    addListener() {
        let _localctx = new AddListenerContext(this._ctx, this.state);
        this.enterRule(_localctx, 8, RASPParser.RULE_addListener);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 63;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === RASPParser.ALPHA) {
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
                while (_la === RASPParser.T__6) {
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
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    addEmitter() {
        let _localctx = new AddEmitterContext(this._ctx, this.state);
        this.enterRule(_localctx, 10, RASPParser.RULE_addEmitter);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 78;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === RASPParser.ALPHA) {
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
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    serviceName() {
        let _localctx = new ServiceNameContext(this._ctx, this.state);
        this.enterRule(_localctx, 12, RASPParser.RULE_serviceName);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 87;
                _la = this._input.LA(1);
                if (!(_la === RASPParser.T__8 || _la === RASPParser.T__9)) {
                    this._errHandler.recoverInline(this);
                }
                else {
                    if (this._input.LA(1) === Token_1.Token.EOF) {
                        this.matchedEOF = true;
                    }
                    this._errHandler.reportMatch(this);
                    this.consume();
                }
            }
        }
        catch (re) {
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    serviceConstructor() {
        let _localctx = new ServiceConstructorContext(this._ctx, this.state);
        this.enterRule(_localctx, 14, RASPParser.RULE_serviceConstructor);
        let _la;
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
                while (_la === RASPParser.T__6) {
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
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    serviceConstructorPair() {
        let _localctx = new ServiceConstructorPairContext(this._ctx, this.state);
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
                        throw new NoViableAltException_1.NoViableAltException(this);
                }
            }
        }
        catch (re) {
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    requestServiceEvents() {
        let _localctx = new RequestServiceEventsContext(this._ctx, this.state);
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
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    eventRegistration() {
        let _localctx = new EventRegistrationContext(this._ctx, this.state);
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
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    events() {
        let _localctx = new EventsContext(this._ctx, this.state);
        this.enterRule(_localctx, 22, RASPParser.RULE_events);
        let _la;
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
                while (_la === RASPParser.T__6) {
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
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    listenerMethodName() {
        let _localctx = new ListenerMethodNameContext(this._ctx, this.state);
        this.enterRule(_localctx, 24, RASPParser.RULE_listenerMethodName);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 130;
                this.match(RASPParser.ALPHA);
            }
        }
        catch (re) {
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    listenerMethod() {
        let _localctx = new ListenerMethodContext(this._ctx, this.state);
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
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    listenerBody() {
        let _localctx = new ListenerBodyContext(this._ctx, this.state);
        this.enterRule(_localctx, 28, RASPParser.RULE_listenerBody);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
            }
        }
        catch (re) {
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    envvar() {
        let _localctx = new EnvvarContext(this._ctx, this.state);
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
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    path() {
        let _localctx = new PathContext(this._ctx, this.state);
        this.enterRule(_localctx, 32, RASPParser.RULE_path);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 144;
                this.match(RASPParser.T__16);
                this.state = 146;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === RASPParser.ALPHA) {
                    {
                        this.state = 145;
                        this.match(RASPParser.ALPHA);
                    }
                }
            }
        }
        catch (re) {
            if (re instanceof RecognitionException_1.RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    static get _ATN() {
        if (!RASPParser.__ATN) {
            RASPParser.__ATN = new ATNDeserializer_1.ATNDeserializer().deserialize(Utils.toCharArray(RASPParser._serializedATN));
        }
        return RASPParser.__ATN;
    }
}
RASPParser.T__0 = 1;
RASPParser.T__1 = 2;
RASPParser.T__2 = 3;
RASPParser.T__3 = 4;
RASPParser.T__4 = 5;
RASPParser.T__5 = 6;
RASPParser.T__6 = 7;
RASPParser.T__7 = 8;
RASPParser.T__8 = 9;
RASPParser.T__9 = 10;
RASPParser.T__10 = 11;
RASPParser.T__11 = 12;
RASPParser.T__12 = 13;
RASPParser.T__13 = 14;
RASPParser.T__14 = 15;
RASPParser.T__15 = 16;
RASPParser.T__16 = 17;
RASPParser.INT = 18;
RASPParser.ALPHA = 19;
RASPParser.HEX = 20;
RASPParser.ALPHANUMERIC = 21;
RASPParser.COMMENT = 22;
RASPParser.LINE_COMMENT = 23;
RASPParser.WS = 24;
RASPParser.RULE_init = 0;
RASPParser.RULE_comment = 1;
RASPParser.RULE_botDefinition = 2;
RASPParser.RULE_botBody = 3;
RASPParser.RULE_addListener = 4;
RASPParser.RULE_addEmitter = 5;
RASPParser.RULE_serviceName = 6;
RASPParser.RULE_serviceConstructor = 7;
RASPParser.RULE_serviceConstructorPair = 8;
RASPParser.RULE_requestServiceEvents = 9;
RASPParser.RULE_eventRegistration = 10;
RASPParser.RULE_events = 11;
RASPParser.RULE_listenerMethodName = 12;
RASPParser.RULE_listenerMethod = 13;
RASPParser.RULE_listenerBody = 14;
RASPParser.RULE_envvar = 15;
RASPParser.RULE_path = 16;
RASPParser.ruleNames = [
    "init", "comment", "botDefinition", "botBody", "addListener", "addEmitter",
    "serviceName", "serviceConstructor", "serviceConstructorPair", "requestServiceEvents",
    "eventRegistration", "events", "listenerMethodName", "listenerMethod",
    "listenerBody", "envvar", "path"
];
RASPParser._LITERAL_NAMES = [
    undefined, "'bot('", "')'", "'{'", "'}'", "'='", "'AddListener('", "','",
    "'AddEmitter('", "'github'", "'flowdock'", "':'", "'RequestEvents('",
    "'['", "']'", "'envar'", "'('", "'/'"
];
RASPParser._SYMBOLIC_NAMES = [
    undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, "INT", "ALPHA", "HEX", "ALPHANUMERIC",
    "COMMENT", "LINE_COMMENT", "WS"
];
RASPParser.VOCABULARY = new VocabularyImpl_1.VocabularyImpl(RASPParser._LITERAL_NAMES, RASPParser._SYMBOLIC_NAMES, []);
RASPParser._serializedATN = "\x03\uAF6F\u8320\u479D\uB75C\u4880\u1605\u191C\uAB37\x03\x1A\x97\x04\x02" +
    "\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07" +
    "\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r\x04" +
    "\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04\x11\t\x11\x04\x12\t\x12\x03" +
    "\x02\x03\x02\x03\x02\x05\x02(\n\x02\x03\x03\x03\x03\x03\x04\x03\x04\x03" +
    "\x04\x03\x04\x03\x04\x03\x04\x07\x042\n\x04\f\x04\x0E\x045\v\x04\x03\x04" +
    "\x03\x04\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05\x05\x05>\n\x05\x03\x06" +
    "\x03\x06\x05\x06B\n\x06\x03\x06\x03\x06\x03\x06\x03\x06\x07\x06H\n\x06" +
    "\f\x06\x0E\x06K\v\x06\x03\x06\x03\x06\x03\x07\x03\x07\x05\x07Q\n\x07\x03" +
    "\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\b\x03\b\x03\t" +
    "\x03\t\x03\t\x03\t\x07\t`\n\t\f\t\x0E\tc\v\t\x03\t\x03\t\x03\n\x03\n\x03" +
    "\n\x03\n\x03\n\x03\n\x03\n\x05\nn\n\n\x03\v\x03\v\x03\v\x03\v\x03\v\x03" +
    "\v\x03\f\x03\f\x03\f\x03\f\x03\r\x03\r\x03\r\x03\r\x07\r~\n\r\f\r\x0E" +
    "\r\x81\v\r\x03\r\x03\r\x03\x0E\x03\x0E\x03\x0F\x03\x0F\x03\x0F\x03\x0F" +
    "\x03\x0F\x03\x10\x03\x10\x03\x11\x03\x11\x03\x11\x03\x11\x03\x11\x03\x12" +
    "\x03\x12\x05\x12\x95\n\x12\x03\x12\x02\x02\x02\x13\x02\x02\x04\x02\x06" +
    "\x02\b\x02\n\x02\f\x02\x0E\x02\x10\x02\x12\x02\x14\x02\x16\x02\x18\x02" +
    "\x1A\x02\x1C\x02\x1E\x02 \x02\"\x02\x02\x04\x03\x02\x18\x19\x03\x02\v" +
    "\f\x96\x02\'\x03\x02\x02\x02\x04)\x03\x02\x02\x02\x06+\x03\x02\x02\x02" +
    "\b=\x03\x02\x02\x02\nA\x03\x02\x02\x02\fP\x03\x02\x02\x02\x0EY\x03\x02" +
    "\x02\x02\x10[\x03\x02\x02\x02\x12f\x03\x02\x02\x02\x14o\x03\x02\x02\x02" +
    "\x16u\x03\x02\x02\x02\x18y\x03\x02\x02\x02\x1A\x84\x03\x02\x02\x02\x1C" +
    "\x86\x03\x02\x02\x02\x1E\x8B\x03\x02\x02\x02 \x8D\x03\x02\x02\x02\"\x92" +
    "\x03\x02\x02\x02$(\x05\x06\x04\x02%(\x05\x04\x03\x02&(\x07\x02\x02\x03" +
    "\'$\x03\x02\x02\x02\'%\x03\x02\x02\x02\'&\x03\x02\x02\x02(\x03\x03\x02" +
    "\x02\x02)*\t\x02\x02\x02*\x05\x03\x02\x02\x02+,\x07\x03\x02\x02,-\x07" +
    "\x15\x02\x02-.\x07\x04\x02\x02./\x07\x05\x02\x02/3\x05\b\x05\x0202\x05" +
    "\b\x05\x0210\x03\x02\x02\x0225\x03\x02\x02\x0231\x03\x02\x02\x0234\x03" +
    "\x02\x02\x0246\x03\x02\x02\x0253\x03\x02\x02\x0267\x07\x06\x02\x027\x07" +
    "\x03\x02\x02\x028>\x05\x04\x03\x029>\x05\n\x06\x02:>\x05\f\x07\x02;>\x05" +
    "\x14\v\x02<>\x05\x1C\x0F\x02=8\x03\x02\x02\x02=9\x03\x02\x02\x02=:\x03" +
    "\x02\x02\x02=;\x03\x02\x02\x02=<\x03\x02\x02\x02>\t\x03\x02\x02\x02?@" +
    "\x07\x15\x02\x02@B\x07\x07\x02\x02A?\x03\x02\x02\x02AB\x03\x02\x02\x02" +
    "BC\x03\x02\x02\x02CD\x07\b\x02\x02DI\x05\x0E\b\x02EF\x07\t\x02\x02FH\x05" +
    "\x10\t\x02GE\x03\x02\x02\x02HK\x03\x02\x02\x02IG\x03\x02\x02\x02IJ\x03" +
    "\x02\x02\x02JL\x03\x02\x02\x02KI\x03\x02\x02\x02LM\x07\x04\x02\x02M\v" +
    "\x03\x02\x02\x02NO\x07\x15\x02\x02OQ\x07\x07\x02\x02PN\x03\x02\x02\x02" +
    "PQ\x03\x02\x02\x02QR\x03\x02\x02\x02RS\x07\n\x02\x02ST\x05\x0E\b\x02T" +
    "U\x07\t\x02\x02UV\x05\x10\t\x02VW\x03\x02\x02\x02WX\x07\x04\x02\x02X\r" +
    "\x03\x02\x02\x02YZ\t\x03\x02\x02Z\x0F\x03\x02\x02\x02[\\\x07\x05\x02\x02" +
    "\\a\x05\x12\n\x02]^\x07\t\x02\x02^`\x05\x12\n\x02_]\x03\x02\x02\x02`c" +
    "\x03\x02\x02\x02a_\x03\x02\x02\x02ab\x03\x02\x02\x02bd\x03\x02\x02\x02" +
    "ca\x03\x02\x02\x02de\x07\x06\x02\x02e\x11\x03\x02\x02\x02fg\x07\x15\x02" +
    "\x02gm\x07\r\x02\x02hn\x07\x15\x02\x02in\x07\x14\x02\x02jn\x07\x16\x02" +
    "\x02kn\x05\"\x12\x02ln\x05\x10\t\x02mh\x03\x02\x02\x02mi\x03\x02\x02\x02" +
    "mj\x03\x02\x02\x02mk\x03\x02\x02\x02ml\x03\x02\x02\x02n\x13\x03\x02\x02" +
    "\x02op\x07\x0E\x02\x02pq\x05\x0E\b\x02qr\x07\t\x02\x02rs\x05\x16\f\x02" +
    "st\x07\x04\x02\x02t\x15\x03\x02\x02\x02uv\x05\x18\r\x02vw\x07\t\x02\x02" +
    "wx\x05\x1A\x0E\x02x\x17\x03\x02\x02\x02yz\x07\x0F\x02\x02z\x7F\x07\x17" +
    "\x02\x02{|\x07\t\x02\x02|~\x07\x17\x02\x02}{\x03\x02\x02\x02~\x81\x03" +
    "\x02\x02\x02\x7F}\x03\x02\x02\x02\x7F\x80\x03\x02\x02\x02\x80\x82\x03" +
    "\x02\x02\x02\x81\x7F\x03\x02\x02\x02\x82\x83\x07\x10\x02\x02\x83\x19\x03" +
    "\x02\x02\x02\x84\x85\x07\x15\x02\x02\x85\x1B\x03\x02\x02\x02\x86\x87\x07" +
    "\x15\x02\x02\x87\x88\x07\x05\x02\x02\x88\x89\x05\x1E\x10\x02\x89\x8A\x07" +
    "\x06\x02\x02\x8A\x1D\x03\x02\x02\x02\x8B\x8C\x03\x02\x02\x02\x8C\x1F\x03" +
    "\x02\x02\x02\x8D\x8E\x07\x11\x02\x02\x8E\x8F\x07\x12\x02\x02\x8F\x90\x07" +
    "\x15\x02\x02\x90\x91\x07\x04\x02\x02\x91!\x03\x02\x02\x02\x92\x94\x07" +
    "\x13\x02\x02\x93\x95\x07\x15\x02\x02\x94\x93\x03\x02\x02\x02\x94\x95\x03" +
    "\x02\x02\x02\x95#\x03\x02\x02\x02\f\'3=AIPam\x7F\x94";
__decorate([
    Decorators_2.Override,
    Decorators_1.NotNull
], RASPParser.prototype, "vocabulary", null);
__decorate([
    Decorators_2.Override
], RASPParser.prototype, "grammarFileName", null);
__decorate([
    Decorators_2.Override
], RASPParser.prototype, "ruleNames", null);
__decorate([
    Decorators_2.Override
], RASPParser.prototype, "serializedATN", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "init", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "comment", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "botDefinition", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "botBody", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "addListener", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "addEmitter", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "serviceName", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "serviceConstructor", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "serviceConstructorPair", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "requestServiceEvents", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "eventRegistration", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "events", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "listenerMethodName", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "listenerMethod", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "listenerBody", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "envvar", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "path", null);
exports.RASPParser = RASPParser;
class InitContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    botDefinition() {
        return this.tryGetRuleContext(0, BotDefinitionContext);
    }
    comment() {
        return this.tryGetRuleContext(0, CommentContext);
    }
    EOF() { return this.tryGetToken(RASPParser.EOF, 0); }
    get ruleIndex() { return RASPParser.RULE_init; }
    enterRule(listener) {
        if (listener.enterInit)
            listener.enterInit(this);
    }
    exitRule(listener) {
        if (listener.exitInit)
            listener.exitInit(this);
    }
    accept(visitor) {
        if (visitor.visitInit)
            return visitor.visitInit(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], InitContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], InitContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], InitContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], InitContext.prototype, "accept", null);
exports.InitContext = InitContext;
class CommentContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    COMMENT() { return this.tryGetToken(RASPParser.COMMENT, 0); }
    LINE_COMMENT() { return this.tryGetToken(RASPParser.LINE_COMMENT, 0); }
    get ruleIndex() { return RASPParser.RULE_comment; }
    enterRule(listener) {
        if (listener.enterComment)
            listener.enterComment(this);
    }
    exitRule(listener) {
        if (listener.exitComment)
            listener.exitComment(this);
    }
    accept(visitor) {
        if (visitor.visitComment)
            return visitor.visitComment(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], CommentContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], CommentContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], CommentContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], CommentContext.prototype, "accept", null);
exports.CommentContext = CommentContext;
class BotDefinitionContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    ALPHA() { return this.getToken(RASPParser.ALPHA, 0); }
    botBody(i) {
        if (i === undefined) {
            return this.getRuleContexts(BotBodyContext);
        }
        else {
            return this.getRuleContext(i, BotBodyContext);
        }
    }
    get ruleIndex() { return RASPParser.RULE_botDefinition; }
    enterRule(listener) {
        if (listener.enterBotDefinition)
            listener.enterBotDefinition(this);
    }
    exitRule(listener) {
        if (listener.exitBotDefinition)
            listener.exitBotDefinition(this);
    }
    accept(visitor) {
        if (visitor.visitBotDefinition)
            return visitor.visitBotDefinition(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], BotDefinitionContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], BotDefinitionContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], BotDefinitionContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], BotDefinitionContext.prototype, "accept", null);
exports.BotDefinitionContext = BotDefinitionContext;
class BotBodyContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    comment() {
        return this.tryGetRuleContext(0, CommentContext);
    }
    addListener() {
        return this.tryGetRuleContext(0, AddListenerContext);
    }
    addEmitter() {
        return this.tryGetRuleContext(0, AddEmitterContext);
    }
    requestServiceEvents() {
        return this.tryGetRuleContext(0, RequestServiceEventsContext);
    }
    listenerMethod() {
        return this.tryGetRuleContext(0, ListenerMethodContext);
    }
    get ruleIndex() { return RASPParser.RULE_botBody; }
    enterRule(listener) {
        if (listener.enterBotBody)
            listener.enterBotBody(this);
    }
    exitRule(listener) {
        if (listener.exitBotBody)
            listener.exitBotBody(this);
    }
    accept(visitor) {
        if (visitor.visitBotBody)
            return visitor.visitBotBody(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], BotBodyContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], BotBodyContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], BotBodyContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], BotBodyContext.prototype, "accept", null);
exports.BotBodyContext = BotBodyContext;
class AddListenerContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    serviceName() {
        return this.getRuleContext(0, ServiceNameContext);
    }
    ALPHA() { return this.tryGetToken(RASPParser.ALPHA, 0); }
    serviceConstructor(i) {
        if (i === undefined) {
            return this.getRuleContexts(ServiceConstructorContext);
        }
        else {
            return this.getRuleContext(i, ServiceConstructorContext);
        }
    }
    get ruleIndex() { return RASPParser.RULE_addListener; }
    enterRule(listener) {
        if (listener.enterAddListener)
            listener.enterAddListener(this);
    }
    exitRule(listener) {
        if (listener.exitAddListener)
            listener.exitAddListener(this);
    }
    accept(visitor) {
        if (visitor.visitAddListener)
            return visitor.visitAddListener(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], AddListenerContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], AddListenerContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], AddListenerContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], AddListenerContext.prototype, "accept", null);
exports.AddListenerContext = AddListenerContext;
class AddEmitterContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    serviceName() {
        return this.getRuleContext(0, ServiceNameContext);
    }
    serviceConstructor() {
        return this.tryGetRuleContext(0, ServiceConstructorContext);
    }
    ALPHA() { return this.tryGetToken(RASPParser.ALPHA, 0); }
    get ruleIndex() { return RASPParser.RULE_addEmitter; }
    enterRule(listener) {
        if (listener.enterAddEmitter)
            listener.enterAddEmitter(this);
    }
    exitRule(listener) {
        if (listener.exitAddEmitter)
            listener.exitAddEmitter(this);
    }
    accept(visitor) {
        if (visitor.visitAddEmitter)
            return visitor.visitAddEmitter(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], AddEmitterContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], AddEmitterContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], AddEmitterContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], AddEmitterContext.prototype, "accept", null);
exports.AddEmitterContext = AddEmitterContext;
class ServiceNameContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    get ruleIndex() { return RASPParser.RULE_serviceName; }
    enterRule(listener) {
        if (listener.enterServiceName)
            listener.enterServiceName(this);
    }
    exitRule(listener) {
        if (listener.exitServiceName)
            listener.exitServiceName(this);
    }
    accept(visitor) {
        if (visitor.visitServiceName)
            return visitor.visitServiceName(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], ServiceNameContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], ServiceNameContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], ServiceNameContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], ServiceNameContext.prototype, "accept", null);
exports.ServiceNameContext = ServiceNameContext;
class ServiceConstructorContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    serviceConstructorPair(i) {
        if (i === undefined) {
            return this.getRuleContexts(ServiceConstructorPairContext);
        }
        else {
            return this.getRuleContext(i, ServiceConstructorPairContext);
        }
    }
    get ruleIndex() { return RASPParser.RULE_serviceConstructor; }
    enterRule(listener) {
        if (listener.enterServiceConstructor)
            listener.enterServiceConstructor(this);
    }
    exitRule(listener) {
        if (listener.exitServiceConstructor)
            listener.exitServiceConstructor(this);
    }
    accept(visitor) {
        if (visitor.visitServiceConstructor)
            return visitor.visitServiceConstructor(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], ServiceConstructorContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], ServiceConstructorContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], ServiceConstructorContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], ServiceConstructorContext.prototype, "accept", null);
exports.ServiceConstructorContext = ServiceConstructorContext;
class ServiceConstructorPairContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    ALPHA(i) {
        if (i === undefined) {
            return this.getTokens(RASPParser.ALPHA);
        }
        else {
            return this.getToken(RASPParser.ALPHA, i);
        }
    }
    INT() { return this.tryGetToken(RASPParser.INT, 0); }
    HEX() { return this.tryGetToken(RASPParser.HEX, 0); }
    path() {
        return this.tryGetRuleContext(0, PathContext);
    }
    serviceConstructor() {
        return this.tryGetRuleContext(0, ServiceConstructorContext);
    }
    get ruleIndex() { return RASPParser.RULE_serviceConstructorPair; }
    enterRule(listener) {
        if (listener.enterServiceConstructorPair)
            listener.enterServiceConstructorPair(this);
    }
    exitRule(listener) {
        if (listener.exitServiceConstructorPair)
            listener.exitServiceConstructorPair(this);
    }
    accept(visitor) {
        if (visitor.visitServiceConstructorPair)
            return visitor.visitServiceConstructorPair(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], ServiceConstructorPairContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], ServiceConstructorPairContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], ServiceConstructorPairContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], ServiceConstructorPairContext.prototype, "accept", null);
exports.ServiceConstructorPairContext = ServiceConstructorPairContext;
class RequestServiceEventsContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    serviceName() {
        return this.getRuleContext(0, ServiceNameContext);
    }
    eventRegistration() {
        return this.getRuleContext(0, EventRegistrationContext);
    }
    get ruleIndex() { return RASPParser.RULE_requestServiceEvents; }
    enterRule(listener) {
        if (listener.enterRequestServiceEvents)
            listener.enterRequestServiceEvents(this);
    }
    exitRule(listener) {
        if (listener.exitRequestServiceEvents)
            listener.exitRequestServiceEvents(this);
    }
    accept(visitor) {
        if (visitor.visitRequestServiceEvents)
            return visitor.visitRequestServiceEvents(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], RequestServiceEventsContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], RequestServiceEventsContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], RequestServiceEventsContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], RequestServiceEventsContext.prototype, "accept", null);
exports.RequestServiceEventsContext = RequestServiceEventsContext;
class EventRegistrationContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    events() {
        return this.getRuleContext(0, EventsContext);
    }
    listenerMethodName() {
        return this.getRuleContext(0, ListenerMethodNameContext);
    }
    get ruleIndex() { return RASPParser.RULE_eventRegistration; }
    enterRule(listener) {
        if (listener.enterEventRegistration)
            listener.enterEventRegistration(this);
    }
    exitRule(listener) {
        if (listener.exitEventRegistration)
            listener.exitEventRegistration(this);
    }
    accept(visitor) {
        if (visitor.visitEventRegistration)
            return visitor.visitEventRegistration(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], EventRegistrationContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], EventRegistrationContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], EventRegistrationContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], EventRegistrationContext.prototype, "accept", null);
exports.EventRegistrationContext = EventRegistrationContext;
class EventsContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    ALPHANUMERIC(i) {
        if (i === undefined) {
            return this.getTokens(RASPParser.ALPHANUMERIC);
        }
        else {
            return this.getToken(RASPParser.ALPHANUMERIC, i);
        }
    }
    get ruleIndex() { return RASPParser.RULE_events; }
    enterRule(listener) {
        if (listener.enterEvents)
            listener.enterEvents(this);
    }
    exitRule(listener) {
        if (listener.exitEvents)
            listener.exitEvents(this);
    }
    accept(visitor) {
        if (visitor.visitEvents)
            return visitor.visitEvents(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], EventsContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], EventsContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], EventsContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], EventsContext.prototype, "accept", null);
exports.EventsContext = EventsContext;
class ListenerMethodNameContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    ALPHA() { return this.getToken(RASPParser.ALPHA, 0); }
    get ruleIndex() { return RASPParser.RULE_listenerMethodName; }
    enterRule(listener) {
        if (listener.enterListenerMethodName)
            listener.enterListenerMethodName(this);
    }
    exitRule(listener) {
        if (listener.exitListenerMethodName)
            listener.exitListenerMethodName(this);
    }
    accept(visitor) {
        if (visitor.visitListenerMethodName)
            return visitor.visitListenerMethodName(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], ListenerMethodNameContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], ListenerMethodNameContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], ListenerMethodNameContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], ListenerMethodNameContext.prototype, "accept", null);
exports.ListenerMethodNameContext = ListenerMethodNameContext;
class ListenerMethodContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    ALPHA() { return this.getToken(RASPParser.ALPHA, 0); }
    listenerBody() {
        return this.getRuleContext(0, ListenerBodyContext);
    }
    get ruleIndex() { return RASPParser.RULE_listenerMethod; }
    enterRule(listener) {
        if (listener.enterListenerMethod)
            listener.enterListenerMethod(this);
    }
    exitRule(listener) {
        if (listener.exitListenerMethod)
            listener.exitListenerMethod(this);
    }
    accept(visitor) {
        if (visitor.visitListenerMethod)
            return visitor.visitListenerMethod(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], ListenerMethodContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], ListenerMethodContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], ListenerMethodContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], ListenerMethodContext.prototype, "accept", null);
exports.ListenerMethodContext = ListenerMethodContext;
class ListenerBodyContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    get ruleIndex() { return RASPParser.RULE_listenerBody; }
    enterRule(listener) {
        if (listener.enterListenerBody)
            listener.enterListenerBody(this);
    }
    exitRule(listener) {
        if (listener.exitListenerBody)
            listener.exitListenerBody(this);
    }
    accept(visitor) {
        if (visitor.visitListenerBody)
            return visitor.visitListenerBody(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], ListenerBodyContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], ListenerBodyContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], ListenerBodyContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], ListenerBodyContext.prototype, "accept", null);
exports.ListenerBodyContext = ListenerBodyContext;
class EnvvarContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    ALPHA() { return this.getToken(RASPParser.ALPHA, 0); }
    get ruleIndex() { return RASPParser.RULE_envvar; }
    enterRule(listener) {
        if (listener.enterEnvvar)
            listener.enterEnvvar(this);
    }
    exitRule(listener) {
        if (listener.exitEnvvar)
            listener.exitEnvvar(this);
    }
    accept(visitor) {
        if (visitor.visitEnvvar)
            return visitor.visitEnvvar(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], EnvvarContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], EnvvarContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], EnvvarContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], EnvvarContext.prototype, "accept", null);
exports.EnvvarContext = EnvvarContext;
class PathContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    ALPHA() { return this.tryGetToken(RASPParser.ALPHA, 0); }
    get ruleIndex() { return RASPParser.RULE_path; }
    enterRule(listener) {
        if (listener.enterPath)
            listener.enterPath(this);
    }
    exitRule(listener) {
        if (listener.exitPath)
            listener.exitPath(this);
    }
    accept(visitor) {
        if (visitor.visitPath)
            return visitor.visitPath(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], PathContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], PathContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], PathContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], PathContext.prototype, "accept", null);
exports.PathContext = PathContext;

//# sourceMappingURL=RASPParser.js.map
