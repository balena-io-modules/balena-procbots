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
            this.state = 20;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case RASPParser.T__0:
                    this.enterOuterAlt(_localctx, 1);
                    {
                        this.state = 18;
                        this.botDefinition();
                    }
                    break;
                case RASPParser.EOF:
                    this.enterOuterAlt(_localctx, 2);
                    {
                        this.state = 19;
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
    botDefinition() {
        let _localctx = new BotDefinitionContext(this._ctx, this.state);
        this.enterRule(_localctx, 2, RASPParser.RULE_botDefinition);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 22;
                this.match(RASPParser.T__0);
                this.state = 23;
                this.botName();
                this.state = 24;
                this.match(RASPParser.T__1);
                this.state = 25;
                this.match(RASPParser.T__2);
                this.state = 26;
                this.botBody();
                this.state = 27;
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
        this.enterRule(_localctx, 4, RASPParser.RULE_botBody);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 29;
                this.addListener();
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
    botName() {
        let _localctx = new BotNameContext(this._ctx, this.state);
        this.enterRule(_localctx, 6, RASPParser.RULE_botName);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 31;
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
    addListener() {
        let _localctx = new AddListenerContext(this._ctx, this.state);
        this.enterRule(_localctx, 8, RASPParser.RULE_addListener);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 33;
                this.match(RASPParser.T__4);
                this.state = 34;
                this.serviceName();
                {
                    this.state = 35;
                    this.match(RASPParser.T__5);
                    this.state = 36;
                    this.serviceConstructor();
                }
                this.state = 38;
                this.match(RASPParser.T__6);
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
        this.enterRule(_localctx, 10, RASPParser.RULE_serviceName);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 40;
                this.match(RASPParser.T__7);
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
        this.enterRule(_localctx, 12, RASPParser.RULE_serviceConstructor);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 42;
                this.githubConstructor();
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
    githubConstructor() {
        let _localctx = new GithubConstructorContext(this._ctx, this.state);
        this.enterRule(_localctx, 14, RASPParser.RULE_githubConstructor);
        let _la;
        try {
            this.state = 57;
            this._errHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this._input, 2, this._ctx)) {
                case 1:
                    this.enterOuterAlt(_localctx, 1);
                    {
                        this.state = 44;
                        this.match(RASPParser.T__2);
                        this.state = 45;
                        this.githubConstructorType();
                        this.state = 50;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        while (_la === RASPParser.T__5) {
                            {
                                {
                                    this.state = 46;
                                    this.match(RASPParser.T__5);
                                    this.state = 47;
                                    this.githubConstructorType();
                                }
                            }
                            this.state = 52;
                            this._errHandler.sync(this);
                            _la = this._input.LA(1);
                        }
                        this.state = 53;
                        this.match(RASPParser.T__3);
                    }
                    break;
                case 2:
                    this.enterOuterAlt(_localctx, 2);
                    {
                        this.state = 55;
                        this.match(RASPParser.T__2);
                        this.state = 56;
                        this.match(RASPParser.T__3);
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
    githubConstructorType() {
        let _localctx = new GithubConstructorTypeContext(this._ctx, this.state);
        this.enterRule(_localctx, 16, RASPParser.RULE_githubConstructorType);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 59;
                _la = this._input.LA(1);
                if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << RASPParser.T__8) | (1 << RASPParser.T__9) | (1 << RASPParser.T__10))) !== 0))) {
                    this._errHandler.recoverInline(this);
                }
                else {
                    if (this._input.LA(1) === Token_1.Token.EOF) {
                        this.matchedEOF = true;
                    }
                    this._errHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 60;
                this.match(RASPParser.T__11);
                this.state = 61;
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
RASPParser.ALPHA = 13;
RASPParser.INT = 14;
RASPParser.WS = 15;
RASPParser.RULE_init = 0;
RASPParser.RULE_botDefinition = 1;
RASPParser.RULE_botBody = 2;
RASPParser.RULE_botName = 3;
RASPParser.RULE_addListener = 4;
RASPParser.RULE_serviceName = 5;
RASPParser.RULE_serviceConstructor = 6;
RASPParser.RULE_githubConstructor = 7;
RASPParser.RULE_githubConstructorType = 8;
RASPParser.ruleNames = [
    "init", "botDefinition", "botBody", "botName", "addListener", "serviceName",
    "serviceConstructor", "githubConstructor", "githubConstructorType"
];
RASPParser._LITERAL_NAMES = [
    undefined, "'bot('", "')'", "'{'", "'}'", "'AddListener('", "','", "')\n'",
    "'github'", "'appId'", "'secret'", "'pem'", "':'"
];
RASPParser._SYMBOLIC_NAMES = [
    undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, "ALPHA",
    "INT", "WS"
];
RASPParser.VOCABULARY = new VocabularyImpl_1.VocabularyImpl(RASPParser._LITERAL_NAMES, RASPParser._SYMBOLIC_NAMES, []);
RASPParser._serializedATN = "\x03\uAF6F\u8320\u479D\uB75C\u4880\u1605\u191C\uAB37\x03\x11B\x04\x02" +
    "\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07" +
    "\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x03\x02\x03\x02\x05\x02\x17\n\x02" +
    "\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x04\x03\x04" +
    "\x03\x05\x03\x05\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06" +
    "\x03\x07\x03\x07\x03\b\x03\b\x03\t\x03\t\x03\t\x03\t\x07\t3\n\t\f\t\x0E" +
    "\t6\v\t\x03\t\x03\t\x03\t\x03\t\x05\t<\n\t\x03\n\x03\n\x03\n\x03\n\x03" +
    "\n\x02\x02\x02\v\x02\x02\x04\x02\x06\x02\b\x02\n\x02\f\x02\x0E\x02\x10" +
    "\x02\x12\x02\x02\x03\x03\x02\v\r;\x02\x16\x03\x02\x02\x02\x04\x18\x03" +
    "\x02\x02\x02\x06\x1F\x03\x02\x02\x02\b!\x03\x02\x02\x02\n#\x03\x02\x02" +
    "\x02\f*\x03\x02\x02\x02\x0E,\x03\x02\x02\x02\x10;\x03\x02\x02\x02\x12" +
    "=\x03\x02\x02\x02\x14\x17\x05\x04\x03\x02\x15\x17\x07\x02\x02\x03\x16" +
    "\x14\x03\x02\x02\x02\x16\x15\x03\x02\x02\x02\x17\x03\x03\x02\x02\x02\x18" +
    "\x19\x07\x03\x02\x02\x19\x1A\x05\b\x05\x02\x1A\x1B\x07\x04\x02\x02\x1B" +
    "\x1C\x07\x05\x02\x02\x1C\x1D\x05\x06\x04\x02\x1D\x1E\x07\x06\x02\x02\x1E" +
    "\x05\x03\x02\x02\x02\x1F \x05\n\x06\x02 \x07\x03\x02\x02\x02!\"\x07\x0F" +
    "\x02\x02\"\t\x03\x02\x02\x02#$\x07\x07\x02\x02$%\x05\f\x07\x02%&\x07\b" +
    "\x02\x02&\'\x05\x0E\b\x02\'(\x03\x02\x02\x02()\x07\t\x02\x02)\v\x03\x02" +
    "\x02\x02*+\x07\n\x02\x02+\r\x03\x02\x02\x02,-\x05\x10\t\x02-\x0F\x03\x02" +
    "\x02\x02./\x07\x05\x02\x02/4\x05\x12\n\x0201\x07\b\x02\x0213\x05\x12\n" +
    "\x0220\x03\x02\x02\x0236\x03\x02\x02\x0242\x03\x02\x02\x0245\x03\x02\x02" +
    "\x0257\x03\x02\x02\x0264\x03\x02\x02\x0278\x07\x06\x02\x028<\x03\x02\x02" +
    "\x029:\x07\x05\x02\x02:<\x07\x06\x02\x02;.\x03\x02\x02\x02;9\x03\x02\x02" +
    "\x02<\x11\x03\x02\x02\x02=>\t\x02\x02\x02>?\x07\x0E\x02\x02?@\x07\x0F" +
    "\x02\x02@\x13\x03\x02\x02\x02\x05\x164;";
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
], RASPParser.prototype, "botDefinition", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "botBody", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "botName", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "addListener", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "serviceName", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "serviceConstructor", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "githubConstructor", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "githubConstructorType", null);
exports.RASPParser = RASPParser;
class InitContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    botDefinition() {
        return this.tryGetRuleContext(0, BotDefinitionContext);
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
class BotDefinitionContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    botName() {
        return this.getRuleContext(0, BotNameContext);
    }
    botBody() {
        return this.getRuleContext(0, BotBodyContext);
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
    addListener() {
        return this.getRuleContext(0, AddListenerContext);
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
class BotNameContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    ALPHA() { return this.getToken(RASPParser.ALPHA, 0); }
    get ruleIndex() { return RASPParser.RULE_botName; }
    enterRule(listener) {
        if (listener.enterBotName)
            listener.enterBotName(this);
    }
    exitRule(listener) {
        if (listener.exitBotName)
            listener.exitBotName(this);
    }
    accept(visitor) {
        if (visitor.visitBotName)
            return visitor.visitBotName(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], BotNameContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], BotNameContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], BotNameContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], BotNameContext.prototype, "accept", null);
exports.BotNameContext = BotNameContext;
class AddListenerContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    serviceName() {
        return this.getRuleContext(0, ServiceNameContext);
    }
    serviceConstructor() {
        return this.tryGetRuleContext(0, ServiceConstructorContext);
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
    githubConstructor() {
        return this.getRuleContext(0, GithubConstructorContext);
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
class GithubConstructorContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    githubConstructorType(i) {
        if (i === undefined) {
            return this.getRuleContexts(GithubConstructorTypeContext);
        }
        else {
            return this.getRuleContext(i, GithubConstructorTypeContext);
        }
    }
    get ruleIndex() { return RASPParser.RULE_githubConstructor; }
    enterRule(listener) {
        if (listener.enterGithubConstructor)
            listener.enterGithubConstructor(this);
    }
    exitRule(listener) {
        if (listener.exitGithubConstructor)
            listener.exitGithubConstructor(this);
    }
    accept(visitor) {
        if (visitor.visitGithubConstructor)
            return visitor.visitGithubConstructor(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], GithubConstructorContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], GithubConstructorContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], GithubConstructorContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], GithubConstructorContext.prototype, "accept", null);
exports.GithubConstructorContext = GithubConstructorContext;
class GithubConstructorTypeContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    ALPHA() { return this.getToken(RASPParser.ALPHA, 0); }
    get ruleIndex() { return RASPParser.RULE_githubConstructorType; }
    enterRule(listener) {
        if (listener.enterGithubConstructorType)
            listener.enterGithubConstructorType(this);
    }
    exitRule(listener) {
        if (listener.exitGithubConstructorType)
            listener.exitGithubConstructorType(this);
    }
    accept(visitor) {
        if (visitor.visitGithubConstructorType)
            return visitor.visitGithubConstructorType(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], GithubConstructorTypeContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], GithubConstructorTypeContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], GithubConstructorTypeContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], GithubConstructorTypeContext.prototype, "accept", null);
exports.GithubConstructorTypeContext = GithubConstructorTypeContext;

//# sourceMappingURL=RASPParser.js.map
