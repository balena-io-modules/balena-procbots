"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ATN_1 = require("antlr4ts/atn/ATN");
const ATNDeserializer_1 = require("antlr4ts/atn/ATNDeserializer");
const FailedPredicateException_1 = require("antlr4ts/FailedPredicateException");
const Decorators_1 = require("antlr4ts/Decorators");
const NoViableAltException_1 = require("antlr4ts/NoViableAltException");
const Decorators_2 = require("antlr4ts/Decorators");
const Parser_1 = require("antlr4ts/Parser");
const ParserRuleContext_1 = require("antlr4ts/ParserRuleContext");
const ParserATNSimulator_1 = require("antlr4ts/atn/ParserATNSimulator");
const RecognitionException_1 = require("antlr4ts/RecognitionException");
const RuleVersion_1 = require("antlr4ts/RuleVersion");
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
            this.state = 62;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case RASPParser.BOT:
                    this.enterOuterAlt(_localctx, 1);
                    {
                        this.state = 60;
                        this.botDefinition();
                    }
                    break;
                case RASPParser.EOF:
                    this.enterOuterAlt(_localctx, 2);
                    {
                        this.state = 61;
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
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 64;
                this.match(RASPParser.BOT);
                this.state = 65;
                this.match(RASPParser.T__0);
                this.state = 66;
                this.match(RASPParser.ID);
                this.state = 67;
                this.match(RASPParser.T__1);
                this.state = 71;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (((((_la - 25)) & ~0x1F) === 0 && ((1 << (_la - 25)) & ((1 << (RASPParser.EVENT - 25)) | (1 << (RASPParser.SEND - 25)) | (1 << (RASPParser.SET - 25)) | (1 << (RASPParser.METHOD - 25)) | (1 << (RASPParser.ERRORMETHOD - 25)) | (1 << (RASPParser.ID - 25)))) !== 0)) {
                    {
                        {
                            this.state = 68;
                            this.botBody();
                        }
                    }
                    this.state = 73;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
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
    botBody() {
        let _localctx = new BotBodyContext(this._ctx, this.state);
        this.enterRule(_localctx, 4, RASPParser.RULE_botBody);
        try {
            this.state = 81;
            this._errHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this._input, 2, this._ctx)) {
                case 1:
                    this.enterOuterAlt(_localctx, 1);
                    {
                        this.state = 74;
                        this.addListener();
                    }
                    break;
                case 2:
                    this.enterOuterAlt(_localctx, 2);
                    {
                        this.state = 75;
                        this.addEmitter();
                    }
                    break;
                case 3:
                    this.enterOuterAlt(_localctx, 3);
                    {
                        this.state = 76;
                        this.requestServiceEvents();
                    }
                    break;
                case 4:
                    this.enterOuterAlt(_localctx, 4);
                    {
                        this.state = 77;
                        this.listenerMethod();
                    }
                    break;
                case 5:
                    this.enterOuterAlt(_localctx, 5);
                    {
                        this.state = 78;
                        this.listenerError();
                    }
                    break;
                case 6:
                    this.enterOuterAlt(_localctx, 6);
                    {
                        this.state = 79;
                        this.method();
                    }
                    break;
                case 7:
                    this.enterOuterAlt(_localctx, 7);
                    {
                        this.state = 80;
                        this.assignment();
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
        this.enterRule(_localctx, 6, RASPParser.RULE_addListener);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 84;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === RASPParser.SET) {
                    {
                        this.state = 83;
                        this.setServiceAs();
                    }
                }
                this.state = 86;
                this.match(RASPParser.EVENT);
                this.state = 87;
                this.match(RASPParser.RECEIVER);
                this.state = 88;
                this.match(RASPParser.FROM);
                this.state = 89;
                this.serviceName();
                this.state = 92;
                this._errHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this._input, 4, this._ctx)) {
                    case 1:
                        {
                            this.state = 90;
                            this.object();
                        }
                        break;
                    case 2:
                        {
                            this.state = 91;
                            this.variable();
                        }
                        break;
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
    addEmitter() {
        let _localctx = new AddEmitterContext(this._ctx, this.state);
        this.enterRule(_localctx, 8, RASPParser.RULE_addEmitter);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 95;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === RASPParser.SET) {
                    {
                        this.state = 94;
                        this.setServiceAs();
                    }
                }
                this.state = 97;
                this.match(RASPParser.SEND);
                this.state = 98;
                this.match(RASPParser.QUERIES);
                this.state = 99;
                this.match(RASPParser.TO);
                this.state = 100;
                this.serviceName();
                this.state = 103;
                this._errHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this._input, 6, this._ctx)) {
                    case 1:
                        {
                            this.state = 101;
                            this.object();
                        }
                        break;
                    case 2:
                        {
                            this.state = 102;
                            this.variable();
                        }
                        break;
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
        this.enterRule(_localctx, 10, RASPParser.RULE_requestServiceEvents);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 105;
                this.match(RASPParser.SEND);
                this.state = 106;
                this.events();
                this.state = 107;
                this.match(RASPParser.EVENTS);
                this.state = 108;
                this.match(RASPParser.FROM);
                this.state = 109;
                this.serviceName();
                this.state = 110;
                this.match(RASPParser.TO);
                this.state = 111;
                this.match(RASPParser.ID);
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
        this.enterRule(_localctx, 12, RASPParser.RULE_events);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 113;
                this.match(RASPParser.T__2);
                this.state = 114;
                this.match(RASPParser.ID);
                this.state = 119;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === RASPParser.T__3) {
                    {
                        {
                            this.state = 115;
                            this.match(RASPParser.T__3);
                            this.state = 116;
                            this.match(RASPParser.ID);
                        }
                    }
                    this.state = 121;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                }
                this.state = 122;
                this.match(RASPParser.T__4);
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
    setServiceAs() {
        let _localctx = new SetServiceAsContext(this._ctx, this.state);
        this.enterRule(_localctx, 14, RASPParser.RULE_setServiceAs);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 124;
                this.match(RASPParser.SET);
                this.state = 125;
                this.match(RASPParser.ID);
                this.state = 126;
                this.match(RASPParser.AS);
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
    setIdFrom() {
        let _localctx = new SetIdFromContext(this._ctx, this.state);
        this.enterRule(_localctx, 16, RASPParser.RULE_setIdFrom);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 128;
                this.match(RASPParser.SET);
                this.state = 129;
                this.match(RASPParser.ID);
                this.state = 130;
                this.match(RASPParser.FROM);
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
        this.enterRule(_localctx, 18, RASPParser.RULE_listenerMethod);
        let _la;
        try {
            let _alt;
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 132;
                this.match(RASPParser.METHOD);
                this.state = 133;
                this.match(RASPParser.ID);
                this.state = 143;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === RASPParser.RECEIVES) {
                    {
                        this.state = 134;
                        this.match(RASPParser.RECEIVES);
                        this.state = 135;
                        this.listenerEventReceiver();
                        this.state = 140;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                        while (_la === RASPParser.T__3) {
                            {
                                {
                                    this.state = 136;
                                    this.match(RASPParser.T__3);
                                    this.state = 137;
                                    this.listenerEventReceiver();
                                }
                            }
                            this.state = 142;
                            this._errHandler.sync(this);
                            _la = this._input.LA(1);
                        }
                    }
                }
                this.state = 148;
                this._errHandler.sync(this);
                _alt = this.interpreter.adaptivePredict(this._input, 10, this._ctx);
                while (_alt !== 2 && _alt !== ATN_1.ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 145;
                                this.statement();
                            }
                        }
                    }
                    this.state = 150;
                    this._errHandler.sync(this);
                    _alt = this.interpreter.adaptivePredict(this._input, 10, this._ctx);
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
    listenerEventReceiver() {
        let _localctx = new ListenerEventReceiverContext(this._ctx, this.state);
        this.enterRule(_localctx, 20, RASPParser.RULE_listenerEventReceiver);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 151;
                this.events();
                this.state = 152;
                this.match(RASPParser.EVENTS);
                this.state = 153;
                this.match(RASPParser.FROM);
                this.state = 154;
                this.serviceName();
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
    listenerError() {
        let _localctx = new ListenerErrorContext(this._ctx, this.state);
        this.enterRule(_localctx, 22, RASPParser.RULE_listenerError);
        try {
            let _alt;
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 156;
                this.match(RASPParser.ERRORMETHOD);
                this.state = 157;
                this.match(RASPParser.ID);
                this.state = 161;
                this._errHandler.sync(this);
                _alt = this.interpreter.adaptivePredict(this._input, 11, this._ctx);
                while (_alt !== 2 && _alt !== ATN_1.ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 158;
                                this.statement();
                            }
                        }
                    }
                    this.state = 163;
                    this._errHandler.sync(this);
                    _alt = this.interpreter.adaptivePredict(this._input, 11, this._ctx);
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
    statement() {
        let _localctx = new StatementContext(this._ctx, this.state);
        this.enterRule(_localctx, 24, RASPParser.RULE_statement);
        try {
            this.state = 172;
            this._errHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this._input, 12, this._ctx)) {
                case 1:
                    this.enterOuterAlt(_localctx, 1);
                    {
                        this.state = 164;
                        this.method();
                    }
                    break;
                case 2:
                    this.enterOuterAlt(_localctx, 2);
                    {
                        this.state = 165;
                        this.assignment();
                    }
                    break;
                case 3:
                    this.enterOuterAlt(_localctx, 3);
                    {
                        this.state = 166;
                        this.r_if();
                    }
                    break;
                case 4:
                    this.enterOuterAlt(_localctx, 4);
                    {
                        this.state = 167;
                        this.r_while();
                    }
                    break;
                case 5:
                    this.enterOuterAlt(_localctx, 5);
                    {
                        this.state = 168;
                        this.loop();
                    }
                    break;
                case 6:
                    this.enterOuterAlt(_localctx, 6);
                    {
                        this.state = 169;
                        this.print();
                    }
                    break;
                case 7:
                    this.enterOuterAlt(_localctx, 7);
                    {
                        this.state = 170;
                        this.sendQuery();
                    }
                    break;
                case 8:
                    this.enterOuterAlt(_localctx, 8);
                    {
                        this.state = 171;
                        this.end();
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
    expr(_p) {
        if (_p === undefined) {
            _p = 0;
        }
        let _parentctx = this._ctx;
        let _parentState = this.state;
        let _localctx = new ExprContext(this._ctx, _parentState);
        let _prevctx = _localctx;
        let _startState = 26;
        this.enterRecursionRule(_localctx, 26, RASPParser.RULE_expr, _p);
        try {
            let _alt;
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 183;
                this._errHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this._input, 13, this._ctx)) {
                    case 1:
                        {
                            this.state = 175;
                            this.array();
                        }
                        break;
                    case 2:
                        {
                            this.state = 176;
                            this.method();
                        }
                        break;
                    case 3:
                        {
                            this.state = 177;
                            this.stringMethod();
                        }
                        break;
                    case 4:
                        {
                            this.state = 178;
                            this.variable();
                        }
                        break;
                    case 5:
                        {
                            this.state = 179;
                            this.object();
                        }
                        break;
                    case 6:
                        {
                            this.state = 180;
                            this.match(RASPParser.NUMBER);
                        }
                        break;
                    case 7:
                        {
                            this.state = 181;
                            this.match(RASPParser.STRING);
                        }
                        break;
                    case 8:
                        {
                            this.state = 182;
                            this.match(RASPParser.BOOLEAN);
                        }
                        break;
                }
                this._ctx._stop = this._input.tryLT(-1);
                this.state = 216;
                this._errHandler.sync(this);
                _alt = this.interpreter.adaptivePredict(this._input, 15, this._ctx);
                while (_alt !== 2 && _alt !== ATN_1.ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        if (this._parseListeners != null)
                            this.triggerExitRuleEvent();
                        _prevctx = _localctx;
                        {
                            this.state = 214;
                            this._errHandler.sync(this);
                            switch (this.interpreter.adaptivePredict(this._input, 14, this._ctx)) {
                                case 1:
                                    {
                                        _localctx = new ExprContext(_parentctx, _parentState);
                                        this.pushNewRecursionContext(_localctx, _startState, RASPParser.RULE_expr);
                                        this.state = 185;
                                        if (!(this.precpred(this._ctx, 16)))
                                            throw new FailedPredicateException_1.FailedPredicateException(this, "this.precpred(this._ctx, 16)");
                                        this.state = 186;
                                        this.match(RASPParser.T__5);
                                        this.state = 187;
                                        this.match(RASPParser.TO);
                                        this.state = 188;
                                        this.expr(17);
                                    }
                                    break;
                                case 2:
                                    {
                                        _localctx = new ExprContext(_parentctx, _parentState);
                                        this.pushNewRecursionContext(_localctx, _startState, RASPParser.RULE_expr);
                                        this.state = 189;
                                        if (!(this.precpred(this._ctx, 15)))
                                            throw new FailedPredicateException_1.FailedPredicateException(this, "this.precpred(this._ctx, 15)");
                                        this.state = 190;
                                        this.match(RASPParser.T__6);
                                        this.state = 191;
                                        this.match(RASPParser.T__7);
                                        this.state = 192;
                                        this.expr(16);
                                    }
                                    break;
                                case 3:
                                    {
                                        _localctx = new ExprContext(_parentctx, _parentState);
                                        this.pushNewRecursionContext(_localctx, _startState, RASPParser.RULE_expr);
                                        this.state = 193;
                                        if (!(this.precpred(this._ctx, 14)))
                                            throw new FailedPredicateException_1.FailedPredicateException(this, "this.precpred(this._ctx, 14)");
                                        this.state = 194;
                                        this.match(RASPParser.T__8);
                                        this.state = 195;
                                        this.match(RASPParser.T__7);
                                        this.state = 196;
                                        this.expr(15);
                                    }
                                    break;
                                case 4:
                                    {
                                        _localctx = new ExprContext(_parentctx, _parentState);
                                        this.pushNewRecursionContext(_localctx, _startState, RASPParser.RULE_expr);
                                        this.state = 197;
                                        if (!(this.precpred(this._ctx, 13)))
                                            throw new FailedPredicateException_1.FailedPredicateException(this, "this.precpred(this._ctx, 13)");
                                        this.state = 198;
                                        this.match(RASPParser.T__9);
                                        this.state = 199;
                                        this.match(RASPParser.T__7);
                                        this.state = 200;
                                        this.expr(14);
                                    }
                                    break;
                                case 5:
                                    {
                                        _localctx = new ExprContext(_parentctx, _parentState);
                                        this.pushNewRecursionContext(_localctx, _startState, RASPParser.RULE_expr);
                                        this.state = 201;
                                        if (!(this.precpred(this._ctx, 12)))
                                            throw new FailedPredicateException_1.FailedPredicateException(this, "this.precpred(this._ctx, 12)");
                                        this.state = 202;
                                        this.match(RASPParser.T__10);
                                        this.state = 203;
                                        this.expr(13);
                                    }
                                    break;
                                case 6:
                                    {
                                        _localctx = new ExprContext(_parentctx, _parentState);
                                        this.pushNewRecursionContext(_localctx, _startState, RASPParser.RULE_expr);
                                        this.state = 204;
                                        if (!(this.precpred(this._ctx, 11)))
                                            throw new FailedPredicateException_1.FailedPredicateException(this, "this.precpred(this._ctx, 11)");
                                        this.state = 205;
                                        this.match(RASPParser.T__11);
                                        this.state = 206;
                                        this.expr(12);
                                    }
                                    break;
                                case 7:
                                    {
                                        _localctx = new ExprContext(_parentctx, _parentState);
                                        this.pushNewRecursionContext(_localctx, _startState, RASPParser.RULE_expr);
                                        this.state = 207;
                                        if (!(this.precpred(this._ctx, 10)))
                                            throw new FailedPredicateException_1.FailedPredicateException(this, "this.precpred(this._ctx, 10)");
                                        this.state = 208;
                                        this.match(RASPParser.IS);
                                        this.state = 209;
                                        this.expr(11);
                                    }
                                    break;
                                case 8:
                                    {
                                        _localctx = new ExprContext(_parentctx, _parentState);
                                        this.pushNewRecursionContext(_localctx, _startState, RASPParser.RULE_expr);
                                        this.state = 210;
                                        if (!(this.precpred(this._ctx, 9)))
                                            throw new FailedPredicateException_1.FailedPredicateException(this, "this.precpred(this._ctx, 9)");
                                        this.state = 211;
                                        this.match(RASPParser.IS);
                                        this.state = 212;
                                        this.match(RASPParser.NOT);
                                        this.state = 213;
                                        this.expr(10);
                                    }
                                    break;
                            }
                        }
                    }
                    this.state = 218;
                    this._errHandler.sync(this);
                    _alt = this.interpreter.adaptivePredict(this._input, 15, this._ctx);
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
            this.unrollRecursionContexts(_parentctx);
        }
        return _localctx;
    }
    serviceName() {
        let _localctx = new ServiceNameContext(this._ctx, this.state);
        this.enterRule(_localctx, 28, RASPParser.RULE_serviceName);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 219;
                this.match(RASPParser.ID);
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
    variable() {
        let _localctx = new VariableContext(this._ctx, this.state);
        this.enterRule(_localctx, 30, RASPParser.RULE_variable);
        try {
            let _alt;
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 221;
                this.match(RASPParser.ID);
                this.state = 226;
                this._errHandler.sync(this);
                _alt = this.interpreter.adaptivePredict(this._input, 16, this._ctx);
                while (_alt !== 2 && _alt !== ATN_1.ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 222;
                                this.match(RASPParser.T__12);
                                this.state = 223;
                                this.match(RASPParser.ID);
                            }
                        }
                    }
                    this.state = 228;
                    this._errHandler.sync(this);
                    _alt = this.interpreter.adaptivePredict(this._input, 16, this._ctx);
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
    object() {
        let _localctx = new ObjectContext(this._ctx, this.state);
        this.enterRule(_localctx, 32, RASPParser.RULE_object);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 229;
                this.match(RASPParser.T__13);
                this.state = 230;
                this.property();
                this.state = 235;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === RASPParser.T__3) {
                    {
                        {
                            this.state = 231;
                            this.match(RASPParser.T__3);
                            this.state = 232;
                            this.property();
                        }
                    }
                    this.state = 237;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                }
                this.state = 238;
                this.match(RASPParser.T__14);
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
    array() {
        let _localctx = new ArrayContext(this._ctx, this.state);
        this.enterRule(_localctx, 34, RASPParser.RULE_array);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 241;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === RASPParser.ID) {
                    {
                        this.state = 240;
                        this.match(RASPParser.ID);
                    }
                }
                this.state = 243;
                this.match(RASPParser.T__2);
                this.state = 244;
                this.expr(0);
                this.state = 249;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === RASPParser.T__3) {
                    {
                        {
                            this.state = 245;
                            this.match(RASPParser.T__3);
                            this.state = 246;
                            this.expr(0);
                        }
                    }
                    this.state = 251;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                }
                this.state = 252;
                this.match(RASPParser.T__4);
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
    property() {
        let _localctx = new PropertyContext(this._ctx, this.state);
        this.enterRule(_localctx, 36, RASPParser.RULE_property);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 254;
                this.match(RASPParser.ID);
                this.state = 259;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === RASPParser.T__15) {
                    {
                        {
                            this.state = 255;
                            this.match(RASPParser.T__15);
                            this.state = 256;
                            this.expr(0);
                        }
                    }
                    this.state = 261;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
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
    assignment() {
        let _localctx = new AssignmentContext(this._ctx, this.state);
        this.enterRule(_localctx, 38, RASPParser.RULE_assignment);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 262;
                this.match(RASPParser.SET);
                this.state = 263;
                this.variable();
                this.state = 264;
                this.match(RASPParser.AS);
                this.state = 265;
                this.expr(0);
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
    r_if() {
        let _localctx = new R_ifContext(this._ctx, this.state);
        this.enterRule(_localctx, 40, RASPParser.RULE_r_if);
        try {
            let _alt;
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 267;
                this.match(RASPParser.T__16);
                this.state = 268;
                this.expr(0);
                this.state = 269;
                this.statement();
                this.state = 274;
                this._errHandler.sync(this);
                _alt = this.interpreter.adaptivePredict(this._input, 21, this._ctx);
                while (_alt !== 2 && _alt !== ATN_1.ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 270;
                                this.match(RASPParser.T__17);
                                this.state = 271;
                                this.statement();
                            }
                        }
                    }
                    this.state = 276;
                    this._errHandler.sync(this);
                    _alt = this.interpreter.adaptivePredict(this._input, 21, this._ctx);
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
    r_while() {
        let _localctx = new R_whileContext(this._ctx, this.state);
        this.enterRule(_localctx, 42, RASPParser.RULE_r_while);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 277;
                this.match(RASPParser.T__18);
                this.state = 278;
                this.expr(0);
                this.state = 279;
                this.statement();
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
    loop() {
        let _localctx = new LoopContext(this._ctx, this.state);
        this.enterRule(_localctx, 44, RASPParser.RULE_loop);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 281;
                this.match(RASPParser.T__19);
                this.state = 282;
                this.match(RASPParser.FROM);
                this.state = 283;
                this.expr(0);
                this.state = 284;
                this.match(RASPParser.TO);
                this.state = 285;
                this.expr(0);
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
    print() {
        let _localctx = new PrintContext(this._ctx, this.state);
        this.enterRule(_localctx, 46, RASPParser.RULE_print);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 287;
                this.match(RASPParser.T__20);
                this.state = 288;
                this.expr(0);
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
    end() {
        let _localctx = new EndContext(this._ctx, this.state);
        this.enterRule(_localctx, 48, RASPParser.RULE_end);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 290;
                this.match(RASPParser.T__21);
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
    sendQuery() {
        let _localctx = new SendQueryContext(this._ctx, this.state);
        this.enterRule(_localctx, 50, RASPParser.RULE_sendQuery);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 293;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === RASPParser.SET) {
                    {
                        this.state = 292;
                        this.setIdFrom();
                    }
                }
                this.state = 295;
                this.match(RASPParser.QUERY);
                this.state = 299;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === RASPParser.ID) {
                    {
                        {
                            this.state = 296;
                            this.match(RASPParser.ID);
                        }
                    }
                    this.state = 301;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                }
                this.state = 302;
                this.object();
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
    method() {
        let _localctx = new MethodContext(this._ctx, this.state);
        this.enterRule(_localctx, 52, RASPParser.RULE_method);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 304;
                this.variable();
                this.state = 305;
                this.match(RASPParser.T__0);
                this.state = 309;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === RASPParser.T__2 || _la === RASPParser.T__13 || ((((_la - 40)) & ~0x1F) === 0 && ((1 << (_la - 40)) & ((1 << (RASPParser.STRING - 40)) | (1 << (RASPParser.ID - 40)) | (1 << (RASPParser.BOOLEAN - 40)) | (1 << (RASPParser.NUMBER - 40)))) !== 0)) {
                    {
                        {
                            this.state = 306;
                            this.methodList();
                        }
                    }
                    this.state = 311;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                }
                this.state = 312;
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
    methodList() {
        let _localctx = new MethodListContext(this._ctx, this.state);
        this.enterRule(_localctx, 54, RASPParser.RULE_methodList);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 314;
                this.expr(0);
                this.state = 319;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === RASPParser.T__3) {
                    {
                        {
                            this.state = 315;
                            this.match(RASPParser.T__3);
                            this.state = 316;
                            this.expr(0);
                        }
                    }
                    this.state = 321;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
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
    stringMethod() {
        let _localctx = new StringMethodContext(this._ctx, this.state);
        this.enterRule(_localctx, 56, RASPParser.RULE_stringMethod);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 322;
                this.match(RASPParser.STRING);
                this.state = 323;
                this.match(RASPParser.T__12);
                this.state = 324;
                this.method();
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
        this.enterRule(_localctx, 58, RASPParser.RULE_envvar);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 326;
                this.match(RASPParser.T__22);
                this.state = 327;
                this.match(RASPParser.ID);
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
    sempred(_localctx, ruleIndex, predIndex) {
        switch (ruleIndex) {
            case 13:
                return this.expr_sempred(_localctx, predIndex);
        }
        return true;
    }
    expr_sempred(_localctx, predIndex) {
        switch (predIndex) {
            case 0:
                return this.precpred(this._ctx, 16);
            case 1:
                return this.precpred(this._ctx, 15);
            case 2:
                return this.precpred(this._ctx, 14);
            case 3:
                return this.precpred(this._ctx, 13);
            case 4:
                return this.precpred(this._ctx, 12);
            case 5:
                return this.precpred(this._ctx, 11);
            case 6:
                return this.precpred(this._ctx, 10);
            case 7:
                return this.precpred(this._ctx, 9);
        }
        return true;
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
RASPParser.T__17 = 18;
RASPParser.T__18 = 19;
RASPParser.T__19 = 20;
RASPParser.T__20 = 21;
RASPParser.T__21 = 22;
RASPParser.T__22 = 23;
RASPParser.BOT = 24;
RASPParser.EVENT = 25;
RASPParser.EVENTS = 26;
RASPParser.RECEIVER = 27;
RASPParser.RECEIVES = 28;
RASPParser.FROM = 29;
RASPParser.SEND = 30;
RASPParser.QUERIES = 31;
RASPParser.TO = 32;
RASPParser.SET = 33;
RASPParser.AS = 34;
RASPParser.IS = 35;
RASPParser.NOT = 36;
RASPParser.QUERY = 37;
RASPParser.METHOD = 38;
RASPParser.ERRORMETHOD = 39;
RASPParser.STRING = 40;
RASPParser.ESC = 41;
RASPParser.ID = 42;
RASPParser.BOOLEAN = 43;
RASPParser.NUMBER = 44;
RASPParser.FLOAT = 45;
RASPParser.INT = 46;
RASPParser.HEXNUMBER = 47;
RASPParser.COMMENT = 48;
RASPParser.LINE_COMMENT = 49;
RASPParser.WS = 50;
RASPParser.RULE_init = 0;
RASPParser.RULE_botDefinition = 1;
RASPParser.RULE_botBody = 2;
RASPParser.RULE_addListener = 3;
RASPParser.RULE_addEmitter = 4;
RASPParser.RULE_requestServiceEvents = 5;
RASPParser.RULE_events = 6;
RASPParser.RULE_setServiceAs = 7;
RASPParser.RULE_setIdFrom = 8;
RASPParser.RULE_listenerMethod = 9;
RASPParser.RULE_listenerEventReceiver = 10;
RASPParser.RULE_listenerError = 11;
RASPParser.RULE_statement = 12;
RASPParser.RULE_expr = 13;
RASPParser.RULE_serviceName = 14;
RASPParser.RULE_variable = 15;
RASPParser.RULE_object = 16;
RASPParser.RULE_array = 17;
RASPParser.RULE_property = 18;
RASPParser.RULE_assignment = 19;
RASPParser.RULE_r_if = 20;
RASPParser.RULE_r_while = 21;
RASPParser.RULE_loop = 22;
RASPParser.RULE_print = 23;
RASPParser.RULE_end = 24;
RASPParser.RULE_sendQuery = 25;
RASPParser.RULE_method = 26;
RASPParser.RULE_methodList = 27;
RASPParser.RULE_stringMethod = 28;
RASPParser.RULE_envvar = 29;
RASPParser.ruleNames = [
    "init", "botDefinition", "botBody", "addListener", "addEmitter", "requestServiceEvents",
    "events", "setServiceAs", "setIdFrom", "listenerMethod", "listenerEventReceiver",
    "listenerError", "statement", "expr", "serviceName", "variable", "object",
    "array", "property", "assignment", "r_if", "r_while", "loop", "print",
    "end", "sendQuery", "method", "methodList", "stringMethod", "envvar"
];
RASPParser._LITERAL_NAMES = [
    undefined, "'('", "')'", "'['", "','", "']'", "'added'", "'subtracted'",
    "'by'", "'multiplied'", "'divided'", "'and'", "'or'", "'.'", "'{'", "'}'",
    "':'", "'if'", "'else'", "'while'", "'loop'", "'print'", "'end'", "'envar'",
    "'bot'", "'event'", "'events'", "'receiver'", "'receives'", "'from'",
    "'send'", "'queries'", "'to'", "'set'", "'as'", "'is'", "'not'", "'query'",
    "'listenerMethod'", "'listenerErrorMethod'"
];
RASPParser._SYMBOLIC_NAMES = [
    undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, "BOT", "EVENT", "EVENTS", "RECEIVER",
    "RECEIVES", "FROM", "SEND", "QUERIES", "TO", "SET", "AS", "IS", "NOT",
    "QUERY", "METHOD", "ERRORMETHOD", "STRING", "ESC", "ID", "BOOLEAN", "NUMBER",
    "FLOAT", "INT", "HEXNUMBER", "COMMENT", "LINE_COMMENT", "WS"
];
RASPParser.VOCABULARY = new VocabularyImpl_1.VocabularyImpl(RASPParser._LITERAL_NAMES, RASPParser._SYMBOLIC_NAMES, []);
RASPParser._serializedATN = "\x03\uAF6F\u8320\u479D\uB75C\u4880\u1605\u191C\uAB37\x034\u014C\x04\x02" +
    "\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07" +
    "\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r\x04" +
    "\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04\x11\t\x11\x04\x12\t\x12\x04" +
    "\x13\t\x13\x04\x14\t\x14\x04\x15\t\x15\x04\x16\t\x16\x04\x17\t\x17\x04" +
    "\x18\t\x18\x04\x19\t\x19\x04\x1A\t\x1A\x04\x1B\t\x1B\x04\x1C\t\x1C\x04" +
    "\x1D\t\x1D\x04\x1E\t\x1E\x04\x1F\t\x1F\x03\x02\x03\x02\x05\x02A\n\x02" +
    "\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x07\x03H\n\x03\f\x03\x0E\x03" +
    "K\v\x03\x03\x04\x03\x04\x03\x04\x03\x04\x03\x04\x03\x04\x03\x04\x05\x04" +
    "T\n\x04\x03\x05\x05\x05W\n\x05\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05" +
    "\x03\x05\x05\x05_\n\x05\x03\x06\x05\x06b\n\x06\x03\x06\x03\x06\x03\x06" +
    "\x03\x06\x03\x06\x03\x06\x05\x06j\n\x06\x03\x07\x03\x07\x03\x07\x03\x07" +
    "\x03\x07\x03\x07\x03\x07\x03\x07\x03\b\x03\b\x03\b\x03\b\x07\bx\n\b\f" +
    "\b\x0E\b{\v\b\x03\b\x03\b\x03\t\x03\t\x03\t\x03\t\x03\n\x03\n\x03\n\x03" +
    "\n\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x07\v\x8D\n\v\f\v\x0E\v\x90\v\v" +
    "\x05\v\x92\n\v\x03\v\x07\v\x95\n\v\f\v\x0E\v\x98\v\v\x03\f\x03\f\x03\f" +
    "\x03\f\x03\f\x03\r\x03\r\x03\r\x07\r\xA2\n\r\f\r\x0E\r\xA5\v\r\x03\x0E" +
    "\x03\x0E\x03\x0E\x03\x0E\x03\x0E\x03\x0E\x03\x0E\x03\x0E\x05\x0E\xAF\n" +
    "\x0E\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03" +
    "\x0F\x05\x0F\xBA\n\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F" +
    "\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F" +
    "\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F" +
    "\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x07\x0F\xD9\n\x0F\f\x0F\x0E\x0F" +
    "\xDC\v\x0F\x03\x10\x03\x10\x03\x11\x03\x11\x03\x11\x07\x11\xE3\n\x11\f" +
    "\x11\x0E\x11\xE6\v\x11\x03\x12\x03\x12\x03\x12\x03\x12\x07\x12\xEC\n\x12" +
    "\f\x12\x0E\x12\xEF\v\x12\x03\x12\x03\x12\x03\x13\x05\x13\xF4\n\x13\x03" +
    "\x13\x03\x13\x03\x13\x03\x13\x07\x13\xFA\n\x13\f\x13\x0E\x13\xFD\v\x13" +
    "\x03\x13\x03\x13\x03\x14\x03\x14\x03\x14\x07\x14\u0104\n\x14\f\x14\x0E" +
    "\x14\u0107\v\x14\x03\x15\x03\x15\x03\x15\x03\x15\x03\x15\x03\x16\x03\x16" +
    "\x03\x16\x03\x16\x03\x16\x07\x16\u0113\n\x16\f\x16\x0E\x16\u0116\v\x16" +
    "\x03\x17\x03\x17\x03\x17\x03\x17\x03\x18\x03\x18\x03\x18\x03\x18\x03\x18" +
    "\x03\x18\x03\x19\x03\x19\x03\x19\x03\x1A\x03\x1A\x03\x1B\x05\x1B\u0128" +
    "\n\x1B\x03\x1B\x03\x1B\x07\x1B\u012C\n\x1B\f\x1B\x0E\x1B\u012F\v\x1B\x03" +
    "\x1B\x03\x1B\x03\x1C\x03\x1C\x03\x1C\x07\x1C\u0136\n\x1C\f\x1C\x0E\x1C" +
    "\u0139\v\x1C\x03\x1C\x03\x1C\x03\x1D\x03\x1D\x03\x1D\x07\x1D\u0140\n\x1D" +
    "\f\x1D\x0E\x1D\u0143\v\x1D\x03\x1E\x03\x1E\x03\x1E\x03\x1E\x03\x1F\x03" +
    "\x1F\x03\x1F\x03\x1F\x02\x02\x03\x1C \x02\x02\x04\x02\x06\x02\b\x02\n" +
    "\x02\f\x02\x0E\x02\x10\x02\x12\x02\x14\x02\x16\x02\x18\x02\x1A\x02\x1C" +
    "\x02\x1E\x02 \x02\"\x02$\x02&\x02(\x02*\x02,\x02.\x020\x022\x024\x026" +
    "\x028\x02:\x02<\x02\x02\x02\u0160\x02@\x03\x02\x02\x02\x04B\x03\x02\x02" +
    "\x02\x06S\x03\x02\x02\x02\bV\x03\x02\x02\x02\na\x03\x02\x02\x02\fk\x03" +
    "\x02\x02\x02\x0Es\x03\x02\x02\x02\x10~\x03\x02\x02\x02\x12\x82\x03\x02" +
    "\x02\x02\x14\x86\x03\x02\x02\x02\x16\x99\x03\x02\x02\x02\x18\x9E\x03\x02" +
    "\x02\x02\x1A\xAE\x03\x02\x02\x02\x1C\xB9\x03\x02\x02\x02\x1E\xDD\x03\x02" +
    "\x02\x02 \xDF\x03\x02\x02\x02\"\xE7\x03\x02\x02\x02$\xF3\x03\x02\x02\x02" +
    "&\u0100\x03\x02\x02\x02(\u0108\x03\x02\x02\x02*\u010D\x03\x02\x02\x02" +
    ",\u0117\x03\x02\x02\x02.\u011B\x03\x02\x02\x020\u0121\x03\x02\x02\x02" +
    "2\u0124\x03\x02\x02\x024\u0127\x03\x02\x02\x026\u0132\x03\x02\x02\x02" +
    "8\u013C\x03\x02\x02\x02:\u0144\x03\x02\x02\x02<\u0148\x03\x02\x02\x02" +
    ">A\x05\x04\x03\x02?A\x07\x02\x02\x03@>\x03\x02\x02\x02@?\x03\x02\x02\x02" +
    "A\x03\x03\x02\x02\x02BC\x07\x1A\x02\x02CD\x07\x03\x02\x02DE\x07,\x02\x02" +
    "EI\x07\x04\x02\x02FH\x05\x06\x04\x02GF\x03\x02\x02\x02HK\x03\x02\x02\x02" +
    "IG\x03\x02\x02\x02IJ\x03\x02\x02\x02J\x05\x03\x02\x02\x02KI\x03\x02\x02" +
    "\x02LT\x05\b\x05\x02MT\x05\n\x06\x02NT\x05\f\x07\x02OT\x05\x14\v\x02P" +
    "T\x05\x18\r\x02QT\x056\x1C\x02RT\x05(\x15\x02SL\x03\x02\x02\x02SM\x03" +
    "\x02\x02\x02SN\x03\x02\x02\x02SO\x03\x02\x02\x02SP\x03\x02\x02\x02SQ\x03" +
    "\x02\x02\x02SR\x03\x02\x02\x02T\x07\x03\x02\x02\x02UW\x05\x10\t\x02VU" +
    "\x03\x02\x02\x02VW\x03\x02\x02\x02WX\x03\x02\x02\x02XY\x07\x1B\x02\x02" +
    "YZ\x07\x1D\x02\x02Z[\x07\x1F\x02\x02[^\x05\x1E\x10\x02\\_\x05\"\x12\x02" +
    "]_\x05 \x11\x02^\\\x03\x02\x02\x02^]\x03\x02\x02\x02^_\x03\x02\x02\x02" +
    "_\t\x03\x02\x02\x02`b\x05\x10\t\x02a`\x03\x02\x02\x02ab\x03\x02\x02\x02" +
    "bc\x03\x02\x02\x02cd\x07 \x02\x02de\x07!\x02\x02ef\x07\"\x02\x02fi\x05" +
    "\x1E\x10\x02gj\x05\"\x12\x02hj\x05 \x11\x02ig\x03\x02\x02\x02ih\x03\x02" +
    "\x02\x02ij\x03\x02\x02\x02j\v\x03\x02\x02\x02kl\x07 \x02\x02lm\x05\x0E" +
    "\b\x02mn\x07\x1C\x02\x02no\x07\x1F\x02\x02op\x05\x1E\x10\x02pq\x07\"\x02" +
    "\x02qr\x07,\x02\x02r\r\x03\x02\x02\x02st\x07\x05\x02\x02ty\x07,\x02\x02" +
    "uv\x07\x06\x02\x02vx\x07,\x02\x02wu\x03\x02\x02\x02x{\x03\x02\x02\x02" +
    "yw\x03\x02\x02\x02yz\x03\x02\x02\x02z|\x03\x02\x02\x02{y\x03\x02\x02\x02" +
    "|}\x07\x07\x02\x02}\x0F\x03\x02\x02\x02~\x7F\x07#\x02\x02\x7F\x80\x07" +
    ",\x02\x02\x80\x81\x07$\x02\x02\x81\x11\x03\x02\x02\x02\x82\x83\x07#\x02" +
    "\x02\x83\x84\x07,\x02\x02\x84\x85\x07\x1F\x02\x02\x85\x13\x03\x02\x02" +
    "\x02\x86\x87\x07(\x02\x02\x87\x91\x07,\x02\x02\x88\x89\x07\x1E\x02\x02" +
    "\x89\x8E\x05\x16\f\x02\x8A\x8B\x07\x06\x02\x02\x8B\x8D\x05\x16\f\x02\x8C" +
    "\x8A\x03\x02\x02\x02\x8D\x90\x03\x02\x02\x02\x8E\x8C\x03\x02\x02\x02\x8E" +
    "\x8F\x03\x02\x02\x02\x8F\x92\x03\x02\x02\x02\x90\x8E\x03\x02\x02\x02\x91" +
    "\x88\x03\x02\x02\x02\x91\x92\x03\x02\x02\x02\x92\x96\x03\x02\x02\x02\x93" +
    "\x95\x05\x1A\x0E\x02\x94\x93\x03\x02\x02\x02\x95\x98\x03\x02\x02\x02\x96" +
    "\x94\x03\x02\x02\x02\x96\x97\x03\x02\x02\x02\x97\x15\x03\x02\x02\x02\x98" +
    "\x96\x03\x02\x02\x02\x99\x9A\x05\x0E\b\x02\x9A\x9B\x07\x1C\x02\x02\x9B" +
    "\x9C\x07\x1F\x02\x02\x9C\x9D\x05\x1E\x10\x02\x9D\x17\x03\x02\x02\x02\x9E" +
    "\x9F\x07)\x02\x02\x9F\xA3\x07,\x02\x02\xA0\xA2\x05\x1A\x0E\x02\xA1\xA0" +
    "\x03\x02\x02\x02\xA2\xA5\x03\x02\x02\x02\xA3\xA1\x03\x02\x02\x02\xA3\xA4" +
    "\x03\x02\x02\x02\xA4\x19\x03\x02\x02\x02\xA5\xA3\x03\x02\x02\x02\xA6\xAF" +
    "\x056\x1C\x02\xA7\xAF\x05(\x15\x02\xA8\xAF\x05*\x16\x02\xA9\xAF\x05,\x17" +
    "\x02\xAA\xAF\x05.\x18\x02\xAB\xAF\x050\x19\x02\xAC\xAF\x054\x1B\x02\xAD" +
    "\xAF\x052\x1A\x02\xAE\xA6\x03\x02\x02\x02\xAE\xA7\x03\x02\x02\x02\xAE" +
    "\xA8\x03\x02\x02\x02\xAE\xA9\x03\x02\x02\x02\xAE\xAA\x03\x02\x02\x02\xAE" +
    "\xAB\x03\x02\x02\x02\xAE\xAC\x03\x02\x02\x02\xAE\xAD\x03\x02\x02\x02\xAF" +
    "\x1B\x03\x02\x02\x02\xB0\xB1\b\x0F\x01\x02\xB1\xBA\x05$\x13\x02\xB2\xBA" +
    "\x056\x1C\x02\xB3\xBA\x05:\x1E\x02\xB4\xBA\x05 \x11\x02\xB5\xBA\x05\"" +
    "\x12\x02\xB6\xBA\x07.\x02\x02\xB7\xBA\x07*\x02\x02\xB8\xBA\x07-\x02\x02" +
    "\xB9\xB0\x03\x02\x02\x02\xB9\xB2\x03\x02\x02\x02\xB9\xB3\x03\x02\x02\x02" +
    "\xB9\xB4\x03\x02\x02\x02\xB9\xB5\x03\x02\x02\x02\xB9\xB6\x03\x02\x02\x02" +
    "\xB9\xB7\x03\x02\x02\x02\xB9\xB8\x03\x02\x02\x02\xBA\xDA\x03\x02\x02\x02" +
    "\xBB\xBC\f\x12\x02\x02\xBC\xBD\x07\b\x02\x02\xBD\xBE\x07\"\x02\x02\xBE" +
    "\xD9\x05\x1C\x0F\x13\xBF\xC0\f\x11\x02\x02\xC0\xC1\x07\t\x02\x02\xC1\xC2" +
    "\x07\n\x02\x02\xC2\xD9\x05\x1C\x0F\x12\xC3\xC4\f\x10\x02\x02\xC4\xC5\x07" +
    "\v\x02\x02\xC5\xC6\x07\n\x02\x02\xC6\xD9\x05\x1C\x0F\x11\xC7\xC8\f\x0F" +
    "\x02\x02\xC8\xC9\x07\f\x02\x02\xC9\xCA\x07\n\x02\x02\xCA\xD9\x05\x1C\x0F" +
    "\x10\xCB\xCC\f\x0E\x02\x02\xCC\xCD\x07\r\x02\x02\xCD\xD9\x05\x1C\x0F\x0F" +
    "\xCE\xCF\f\r\x02\x02\xCF\xD0\x07\x0E\x02\x02\xD0\xD9\x05\x1C\x0F\x0E\xD1" +
    "\xD2\f\f\x02\x02\xD2\xD3\x07%\x02\x02\xD3\xD9\x05\x1C\x0F\r\xD4\xD5\f" +
    "\v\x02\x02\xD5\xD6\x07%\x02\x02\xD6\xD7\x07&\x02\x02\xD7\xD9\x05\x1C\x0F" +
    "\f\xD8\xBB\x03\x02\x02\x02\xD8\xBF\x03\x02\x02\x02\xD8\xC3\x03\x02\x02" +
    "\x02\xD8\xC7\x03\x02\x02\x02\xD8\xCB\x03\x02\x02\x02\xD8\xCE\x03\x02\x02" +
    "\x02\xD8\xD1\x03\x02\x02\x02\xD8\xD4\x03\x02\x02\x02\xD9\xDC\x03\x02\x02" +
    "\x02\xDA\xD8\x03\x02\x02\x02\xDA\xDB\x03\x02\x02\x02\xDB\x1D\x03\x02\x02" +
    "\x02\xDC\xDA\x03\x02\x02\x02\xDD\xDE\x07,\x02\x02\xDE\x1F\x03\x02\x02" +
    "\x02\xDF\xE4\x07,\x02\x02\xE0\xE1\x07\x0F\x02\x02\xE1\xE3\x07,\x02\x02" +
    "\xE2\xE0\x03\x02\x02\x02\xE3\xE6\x03\x02\x02\x02\xE4\xE2\x03\x02\x02\x02" +
    "\xE4\xE5\x03\x02\x02\x02\xE5!\x03\x02\x02\x02\xE6\xE4\x03\x02\x02\x02" +
    "\xE7\xE8\x07\x10\x02\x02\xE8\xED\x05&\x14\x02\xE9\xEA\x07\x06\x02\x02" +
    "\xEA\xEC\x05&\x14\x02\xEB\xE9\x03\x02\x02\x02\xEC\xEF\x03\x02\x02\x02" +
    "\xED\xEB\x03\x02\x02\x02\xED\xEE\x03\x02\x02\x02\xEE\xF0\x03\x02\x02\x02" +
    "\xEF\xED\x03\x02\x02\x02\xF0\xF1\x07\x11\x02\x02\xF1#\x03\x02\x02\x02" +
    "\xF2\xF4\x07,\x02\x02\xF3\xF2\x03\x02\x02\x02\xF3\xF4\x03\x02\x02\x02" +
    "\xF4\xF5\x03\x02\x02\x02\xF5\xF6\x07\x05\x02\x02\xF6\xFB\x05\x1C\x0F\x02" +
    "\xF7\xF8\x07\x06\x02\x02\xF8\xFA\x05\x1C\x0F\x02\xF9\xF7\x03\x02\x02\x02" +
    "\xFA\xFD\x03\x02\x02\x02\xFB\xF9\x03\x02\x02\x02\xFB\xFC\x03\x02\x02\x02" +
    "\xFC\xFE\x03\x02\x02\x02\xFD\xFB\x03\x02\x02\x02\xFE\xFF\x07\x07\x02\x02" +
    "\xFF%\x03\x02\x02\x02\u0100\u0105\x07,\x02\x02\u0101\u0102\x07\x12\x02" +
    "\x02\u0102\u0104\x05\x1C\x0F\x02\u0103\u0101\x03\x02\x02\x02\u0104\u0107" +
    "\x03\x02\x02\x02\u0105\u0103\x03\x02\x02\x02\u0105\u0106\x03\x02\x02\x02" +
    "\u0106\'\x03\x02\x02\x02\u0107\u0105\x03\x02\x02\x02\u0108\u0109\x07#" +
    "\x02\x02\u0109\u010A\x05 \x11\x02\u010A\u010B\x07$\x02\x02\u010B\u010C" +
    "\x05\x1C\x0F\x02\u010C)\x03\x02\x02\x02\u010D\u010E\x07\x13\x02\x02\u010E" +
    "\u010F\x05\x1C\x0F\x02\u010F\u0114\x05\x1A\x0E\x02\u0110\u0111\x07\x14" +
    "\x02\x02\u0111\u0113\x05\x1A\x0E\x02\u0112\u0110\x03\x02\x02\x02\u0113" +
    "\u0116\x03\x02\x02\x02\u0114\u0112\x03\x02\x02\x02\u0114\u0115\x03\x02" +
    "\x02\x02\u0115+\x03\x02\x02\x02\u0116\u0114\x03\x02\x02\x02\u0117\u0118" +
    "\x07\x15\x02\x02\u0118\u0119\x05\x1C\x0F\x02\u0119\u011A\x05\x1A\x0E\x02" +
    "\u011A-\x03\x02\x02\x02\u011B\u011C\x07\x16\x02\x02\u011C\u011D\x07\x1F" +
    "\x02\x02\u011D\u011E\x05\x1C\x0F\x02\u011E\u011F\x07\"\x02\x02\u011F\u0120" +
    "\x05\x1C\x0F\x02\u0120/\x03\x02\x02\x02\u0121\u0122\x07\x17\x02\x02\u0122" +
    "\u0123\x05\x1C\x0F\x02\u01231\x03\x02\x02\x02\u0124\u0125\x07\x18\x02" +
    "\x02\u01253\x03\x02\x02\x02\u0126\u0128\x05\x12\n\x02\u0127\u0126\x03" +
    "\x02\x02\x02\u0127\u0128\x03\x02\x02\x02\u0128\u0129\x03\x02\x02\x02\u0129" +
    "\u012D\x07\'\x02\x02\u012A\u012C\x07,\x02\x02\u012B\u012A\x03\x02\x02" +
    "\x02\u012C\u012F\x03\x02\x02\x02\u012D\u012B\x03\x02\x02\x02\u012D\u012E" +
    "\x03\x02\x02\x02\u012E\u0130\x03\x02\x02\x02\u012F\u012D\x03\x02\x02\x02" +
    "\u0130\u0131\x05\"\x12\x02\u01315\x03\x02\x02\x02\u0132\u0133\x05 \x11" +
    "\x02\u0133\u0137\x07\x03\x02\x02\u0134\u0136\x058\x1D\x02\u0135\u0134" +
    "\x03\x02\x02\x02\u0136\u0139\x03\x02\x02\x02\u0137\u0135\x03\x02\x02\x02" +
    "\u0137\u0138\x03\x02\x02\x02\u0138\u013A\x03\x02\x02\x02\u0139\u0137\x03" +
    "\x02\x02\x02\u013A\u013B\x07\x04\x02\x02\u013B7\x03\x02\x02\x02\u013C" +
    "\u0141\x05\x1C\x0F\x02\u013D\u013E\x07\x06\x02\x02\u013E\u0140\x05\x1C" +
    "\x0F\x02\u013F\u013D\x03\x02\x02\x02\u0140\u0143\x03\x02\x02\x02\u0141" +
    "\u013F\x03\x02\x02\x02\u0141\u0142\x03\x02\x02\x02\u01429\x03\x02\x02" +
    "\x02\u0143\u0141\x03\x02\x02\x02\u0144\u0145\x07*\x02\x02\u0145\u0146" +
    "\x07\x0F\x02\x02\u0146\u0147\x056\x1C\x02\u0147;\x03\x02\x02\x02\u0148" +
    "\u0149\x07\x19\x02\x02\u0149\u014A\x07,\x02\x02\u014A=\x03\x02\x02\x02" +
    "\x1C@ISV^aiy\x8E\x91\x96\xA3\xAE\xB9\xD8\xDA\xE4\xED\xF3\xFB\u0105\u0114" +
    "\u0127\u012D\u0137\u0141";
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
], RASPParser.prototype, "addListener", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "addEmitter", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "requestServiceEvents", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "events", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "setServiceAs", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "setIdFrom", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "listenerMethod", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "listenerEventReceiver", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "listenerError", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "statement", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "expr", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "serviceName", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "variable", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "object", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "array", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "property", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "assignment", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "r_if", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "r_while", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "loop", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "print", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "end", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "sendQuery", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "method", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "methodList", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "stringMethod", null);
__decorate([
    RuleVersion_1.RuleVersion(0)
], RASPParser.prototype, "envvar", null);
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
    BOT() { return this.getToken(RASPParser.BOT, 0); }
    ID() { return this.getToken(RASPParser.ID, 0); }
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
    listenerError() {
        return this.tryGetRuleContext(0, ListenerErrorContext);
    }
    method() {
        return this.tryGetRuleContext(0, MethodContext);
    }
    assignment() {
        return this.tryGetRuleContext(0, AssignmentContext);
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
    EVENT() { return this.getToken(RASPParser.EVENT, 0); }
    RECEIVER() { return this.getToken(RASPParser.RECEIVER, 0); }
    FROM() { return this.getToken(RASPParser.FROM, 0); }
    serviceName() {
        return this.getRuleContext(0, ServiceNameContext);
    }
    setServiceAs() {
        return this.tryGetRuleContext(0, SetServiceAsContext);
    }
    object() {
        return this.tryGetRuleContext(0, ObjectContext);
    }
    variable() {
        return this.tryGetRuleContext(0, VariableContext);
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
    SEND() { return this.getToken(RASPParser.SEND, 0); }
    QUERIES() { return this.getToken(RASPParser.QUERIES, 0); }
    TO() { return this.getToken(RASPParser.TO, 0); }
    serviceName() {
        return this.getRuleContext(0, ServiceNameContext);
    }
    setServiceAs() {
        return this.tryGetRuleContext(0, SetServiceAsContext);
    }
    object() {
        return this.tryGetRuleContext(0, ObjectContext);
    }
    variable() {
        return this.tryGetRuleContext(0, VariableContext);
    }
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
class RequestServiceEventsContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    SEND() { return this.getToken(RASPParser.SEND, 0); }
    events() {
        return this.getRuleContext(0, EventsContext);
    }
    EVENTS() { return this.getToken(RASPParser.EVENTS, 0); }
    FROM() { return this.getToken(RASPParser.FROM, 0); }
    serviceName() {
        return this.getRuleContext(0, ServiceNameContext);
    }
    TO() { return this.getToken(RASPParser.TO, 0); }
    ID() { return this.getToken(RASPParser.ID, 0); }
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
class EventsContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    ID(i) {
        if (i === undefined) {
            return this.getTokens(RASPParser.ID);
        }
        else {
            return this.getToken(RASPParser.ID, i);
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
class SetServiceAsContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    SET() { return this.getToken(RASPParser.SET, 0); }
    ID() { return this.getToken(RASPParser.ID, 0); }
    AS() { return this.getToken(RASPParser.AS, 0); }
    get ruleIndex() { return RASPParser.RULE_setServiceAs; }
    enterRule(listener) {
        if (listener.enterSetServiceAs)
            listener.enterSetServiceAs(this);
    }
    exitRule(listener) {
        if (listener.exitSetServiceAs)
            listener.exitSetServiceAs(this);
    }
    accept(visitor) {
        if (visitor.visitSetServiceAs)
            return visitor.visitSetServiceAs(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], SetServiceAsContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], SetServiceAsContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], SetServiceAsContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], SetServiceAsContext.prototype, "accept", null);
exports.SetServiceAsContext = SetServiceAsContext;
class SetIdFromContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    SET() { return this.getToken(RASPParser.SET, 0); }
    ID() { return this.getToken(RASPParser.ID, 0); }
    FROM() { return this.getToken(RASPParser.FROM, 0); }
    get ruleIndex() { return RASPParser.RULE_setIdFrom; }
    enterRule(listener) {
        if (listener.enterSetIdFrom)
            listener.enterSetIdFrom(this);
    }
    exitRule(listener) {
        if (listener.exitSetIdFrom)
            listener.exitSetIdFrom(this);
    }
    accept(visitor) {
        if (visitor.visitSetIdFrom)
            return visitor.visitSetIdFrom(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], SetIdFromContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], SetIdFromContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], SetIdFromContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], SetIdFromContext.prototype, "accept", null);
exports.SetIdFromContext = SetIdFromContext;
class ListenerMethodContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    METHOD() { return this.getToken(RASPParser.METHOD, 0); }
    ID() { return this.getToken(RASPParser.ID, 0); }
    RECEIVES() { return this.tryGetToken(RASPParser.RECEIVES, 0); }
    listenerEventReceiver(i) {
        if (i === undefined) {
            return this.getRuleContexts(ListenerEventReceiverContext);
        }
        else {
            return this.getRuleContext(i, ListenerEventReceiverContext);
        }
    }
    statement(i) {
        if (i === undefined) {
            return this.getRuleContexts(StatementContext);
        }
        else {
            return this.getRuleContext(i, StatementContext);
        }
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
class ListenerEventReceiverContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    events() {
        return this.getRuleContext(0, EventsContext);
    }
    EVENTS() { return this.getToken(RASPParser.EVENTS, 0); }
    FROM() { return this.getToken(RASPParser.FROM, 0); }
    serviceName() {
        return this.getRuleContext(0, ServiceNameContext);
    }
    get ruleIndex() { return RASPParser.RULE_listenerEventReceiver; }
    enterRule(listener) {
        if (listener.enterListenerEventReceiver)
            listener.enterListenerEventReceiver(this);
    }
    exitRule(listener) {
        if (listener.exitListenerEventReceiver)
            listener.exitListenerEventReceiver(this);
    }
    accept(visitor) {
        if (visitor.visitListenerEventReceiver)
            return visitor.visitListenerEventReceiver(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], ListenerEventReceiverContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], ListenerEventReceiverContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], ListenerEventReceiverContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], ListenerEventReceiverContext.prototype, "accept", null);
exports.ListenerEventReceiverContext = ListenerEventReceiverContext;
class ListenerErrorContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    ERRORMETHOD() { return this.getToken(RASPParser.ERRORMETHOD, 0); }
    ID() { return this.getToken(RASPParser.ID, 0); }
    statement(i) {
        if (i === undefined) {
            return this.getRuleContexts(StatementContext);
        }
        else {
            return this.getRuleContext(i, StatementContext);
        }
    }
    get ruleIndex() { return RASPParser.RULE_listenerError; }
    enterRule(listener) {
        if (listener.enterListenerError)
            listener.enterListenerError(this);
    }
    exitRule(listener) {
        if (listener.exitListenerError)
            listener.exitListenerError(this);
    }
    accept(visitor) {
        if (visitor.visitListenerError)
            return visitor.visitListenerError(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], ListenerErrorContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], ListenerErrorContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], ListenerErrorContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], ListenerErrorContext.prototype, "accept", null);
exports.ListenerErrorContext = ListenerErrorContext;
class StatementContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    method() {
        return this.tryGetRuleContext(0, MethodContext);
    }
    assignment() {
        return this.tryGetRuleContext(0, AssignmentContext);
    }
    r_if() {
        return this.tryGetRuleContext(0, R_ifContext);
    }
    r_while() {
        return this.tryGetRuleContext(0, R_whileContext);
    }
    loop() {
        return this.tryGetRuleContext(0, LoopContext);
    }
    print() {
        return this.tryGetRuleContext(0, PrintContext);
    }
    sendQuery() {
        return this.tryGetRuleContext(0, SendQueryContext);
    }
    end() {
        return this.tryGetRuleContext(0, EndContext);
    }
    get ruleIndex() { return RASPParser.RULE_statement; }
    enterRule(listener) {
        if (listener.enterStatement)
            listener.enterStatement(this);
    }
    exitRule(listener) {
        if (listener.exitStatement)
            listener.exitStatement(this);
    }
    accept(visitor) {
        if (visitor.visitStatement)
            return visitor.visitStatement(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], StatementContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], StatementContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], StatementContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], StatementContext.prototype, "accept", null);
exports.StatementContext = StatementContext;
class ExprContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    expr(i) {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext);
        }
        else {
            return this.getRuleContext(i, ExprContext);
        }
    }
    IS() { return this.tryGetToken(RASPParser.IS, 0); }
    NOT() { return this.tryGetToken(RASPParser.NOT, 0); }
    array() {
        return this.tryGetRuleContext(0, ArrayContext);
    }
    method() {
        return this.tryGetRuleContext(0, MethodContext);
    }
    stringMethod() {
        return this.tryGetRuleContext(0, StringMethodContext);
    }
    variable() {
        return this.tryGetRuleContext(0, VariableContext);
    }
    object() {
        return this.tryGetRuleContext(0, ObjectContext);
    }
    NUMBER() { return this.tryGetToken(RASPParser.NUMBER, 0); }
    STRING() { return this.tryGetToken(RASPParser.STRING, 0); }
    BOOLEAN() { return this.tryGetToken(RASPParser.BOOLEAN, 0); }
    get ruleIndex() { return RASPParser.RULE_expr; }
    enterRule(listener) {
        if (listener.enterExpr)
            listener.enterExpr(this);
    }
    exitRule(listener) {
        if (listener.exitExpr)
            listener.exitExpr(this);
    }
    accept(visitor) {
        if (visitor.visitExpr)
            return visitor.visitExpr(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], ExprContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], ExprContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], ExprContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], ExprContext.prototype, "accept", null);
exports.ExprContext = ExprContext;
class ServiceNameContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    ID() { return this.getToken(RASPParser.ID, 0); }
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
class VariableContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    ID(i) {
        if (i === undefined) {
            return this.getTokens(RASPParser.ID);
        }
        else {
            return this.getToken(RASPParser.ID, i);
        }
    }
    get ruleIndex() { return RASPParser.RULE_variable; }
    enterRule(listener) {
        if (listener.enterVariable)
            listener.enterVariable(this);
    }
    exitRule(listener) {
        if (listener.exitVariable)
            listener.exitVariable(this);
    }
    accept(visitor) {
        if (visitor.visitVariable)
            return visitor.visitVariable(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], VariableContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], VariableContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], VariableContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], VariableContext.prototype, "accept", null);
exports.VariableContext = VariableContext;
class ObjectContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    property(i) {
        if (i === undefined) {
            return this.getRuleContexts(PropertyContext);
        }
        else {
            return this.getRuleContext(i, PropertyContext);
        }
    }
    get ruleIndex() { return RASPParser.RULE_object; }
    enterRule(listener) {
        if (listener.enterObject)
            listener.enterObject(this);
    }
    exitRule(listener) {
        if (listener.exitObject)
            listener.exitObject(this);
    }
    accept(visitor) {
        if (visitor.visitObject)
            return visitor.visitObject(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], ObjectContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], ObjectContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], ObjectContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], ObjectContext.prototype, "accept", null);
exports.ObjectContext = ObjectContext;
class ArrayContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    expr(i) {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext);
        }
        else {
            return this.getRuleContext(i, ExprContext);
        }
    }
    ID() { return this.tryGetToken(RASPParser.ID, 0); }
    get ruleIndex() { return RASPParser.RULE_array; }
    enterRule(listener) {
        if (listener.enterArray)
            listener.enterArray(this);
    }
    exitRule(listener) {
        if (listener.exitArray)
            listener.exitArray(this);
    }
    accept(visitor) {
        if (visitor.visitArray)
            return visitor.visitArray(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], ArrayContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], ArrayContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], ArrayContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], ArrayContext.prototype, "accept", null);
exports.ArrayContext = ArrayContext;
class PropertyContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    ID() { return this.getToken(RASPParser.ID, 0); }
    expr(i) {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext);
        }
        else {
            return this.getRuleContext(i, ExprContext);
        }
    }
    get ruleIndex() { return RASPParser.RULE_property; }
    enterRule(listener) {
        if (listener.enterProperty)
            listener.enterProperty(this);
    }
    exitRule(listener) {
        if (listener.exitProperty)
            listener.exitProperty(this);
    }
    accept(visitor) {
        if (visitor.visitProperty)
            return visitor.visitProperty(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], PropertyContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], PropertyContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], PropertyContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], PropertyContext.prototype, "accept", null);
exports.PropertyContext = PropertyContext;
class AssignmentContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    variable() {
        return this.getRuleContext(0, VariableContext);
    }
    expr() {
        return this.getRuleContext(0, ExprContext);
    }
    get ruleIndex() { return RASPParser.RULE_assignment; }
    enterRule(listener) {
        if (listener.enterAssignment)
            listener.enterAssignment(this);
    }
    exitRule(listener) {
        if (listener.exitAssignment)
            listener.exitAssignment(this);
    }
    accept(visitor) {
        if (visitor.visitAssignment)
            return visitor.visitAssignment(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], AssignmentContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], AssignmentContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], AssignmentContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], AssignmentContext.prototype, "accept", null);
exports.AssignmentContext = AssignmentContext;
class R_ifContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    expr() {
        return this.getRuleContext(0, ExprContext);
    }
    statement(i) {
        if (i === undefined) {
            return this.getRuleContexts(StatementContext);
        }
        else {
            return this.getRuleContext(i, StatementContext);
        }
    }
    get ruleIndex() { return RASPParser.RULE_r_if; }
    enterRule(listener) {
        if (listener.enterR_if)
            listener.enterR_if(this);
    }
    exitRule(listener) {
        if (listener.exitR_if)
            listener.exitR_if(this);
    }
    accept(visitor) {
        if (visitor.visitR_if)
            return visitor.visitR_if(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], R_ifContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], R_ifContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], R_ifContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], R_ifContext.prototype, "accept", null);
exports.R_ifContext = R_ifContext;
class R_whileContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    expr() {
        return this.getRuleContext(0, ExprContext);
    }
    statement() {
        return this.getRuleContext(0, StatementContext);
    }
    get ruleIndex() { return RASPParser.RULE_r_while; }
    enterRule(listener) {
        if (listener.enterR_while)
            listener.enterR_while(this);
    }
    exitRule(listener) {
        if (listener.exitR_while)
            listener.exitR_while(this);
    }
    accept(visitor) {
        if (visitor.visitR_while)
            return visitor.visitR_while(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], R_whileContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], R_whileContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], R_whileContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], R_whileContext.prototype, "accept", null);
exports.R_whileContext = R_whileContext;
class LoopContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    expr(i) {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext);
        }
        else {
            return this.getRuleContext(i, ExprContext);
        }
    }
    get ruleIndex() { return RASPParser.RULE_loop; }
    enterRule(listener) {
        if (listener.enterLoop)
            listener.enterLoop(this);
    }
    exitRule(listener) {
        if (listener.exitLoop)
            listener.exitLoop(this);
    }
    accept(visitor) {
        if (visitor.visitLoop)
            return visitor.visitLoop(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], LoopContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], LoopContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], LoopContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], LoopContext.prototype, "accept", null);
exports.LoopContext = LoopContext;
class PrintContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    expr() {
        return this.getRuleContext(0, ExprContext);
    }
    get ruleIndex() { return RASPParser.RULE_print; }
    enterRule(listener) {
        if (listener.enterPrint)
            listener.enterPrint(this);
    }
    exitRule(listener) {
        if (listener.exitPrint)
            listener.exitPrint(this);
    }
    accept(visitor) {
        if (visitor.visitPrint)
            return visitor.visitPrint(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], PrintContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], PrintContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], PrintContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], PrintContext.prototype, "accept", null);
exports.PrintContext = PrintContext;
class EndContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    get ruleIndex() { return RASPParser.RULE_end; }
    enterRule(listener) {
        if (listener.enterEnd)
            listener.enterEnd(this);
    }
    exitRule(listener) {
        if (listener.exitEnd)
            listener.exitEnd(this);
    }
    accept(visitor) {
        if (visitor.visitEnd)
            return visitor.visitEnd(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], EndContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], EndContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], EndContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], EndContext.prototype, "accept", null);
exports.EndContext = EndContext;
class SendQueryContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    QUERY() { return this.getToken(RASPParser.QUERY, 0); }
    object() {
        return this.getRuleContext(0, ObjectContext);
    }
    setIdFrom() {
        return this.tryGetRuleContext(0, SetIdFromContext);
    }
    ID(i) {
        if (i === undefined) {
            return this.getTokens(RASPParser.ID);
        }
        else {
            return this.getToken(RASPParser.ID, i);
        }
    }
    get ruleIndex() { return RASPParser.RULE_sendQuery; }
    enterRule(listener) {
        if (listener.enterSendQuery)
            listener.enterSendQuery(this);
    }
    exitRule(listener) {
        if (listener.exitSendQuery)
            listener.exitSendQuery(this);
    }
    accept(visitor) {
        if (visitor.visitSendQuery)
            return visitor.visitSendQuery(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], SendQueryContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], SendQueryContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], SendQueryContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], SendQueryContext.prototype, "accept", null);
exports.SendQueryContext = SendQueryContext;
class MethodContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    variable() {
        return this.getRuleContext(0, VariableContext);
    }
    methodList(i) {
        if (i === undefined) {
            return this.getRuleContexts(MethodListContext);
        }
        else {
            return this.getRuleContext(i, MethodListContext);
        }
    }
    get ruleIndex() { return RASPParser.RULE_method; }
    enterRule(listener) {
        if (listener.enterMethod)
            listener.enterMethod(this);
    }
    exitRule(listener) {
        if (listener.exitMethod)
            listener.exitMethod(this);
    }
    accept(visitor) {
        if (visitor.visitMethod)
            return visitor.visitMethod(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], MethodContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], MethodContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], MethodContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], MethodContext.prototype, "accept", null);
exports.MethodContext = MethodContext;
class MethodListContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    expr(i) {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext);
        }
        else {
            return this.getRuleContext(i, ExprContext);
        }
    }
    get ruleIndex() { return RASPParser.RULE_methodList; }
    enterRule(listener) {
        if (listener.enterMethodList)
            listener.enterMethodList(this);
    }
    exitRule(listener) {
        if (listener.exitMethodList)
            listener.exitMethodList(this);
    }
    accept(visitor) {
        if (visitor.visitMethodList)
            return visitor.visitMethodList(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], MethodListContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], MethodListContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], MethodListContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], MethodListContext.prototype, "accept", null);
exports.MethodListContext = MethodListContext;
class StringMethodContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    STRING() { return this.getToken(RASPParser.STRING, 0); }
    method() {
        return this.getRuleContext(0, MethodContext);
    }
    get ruleIndex() { return RASPParser.RULE_stringMethod; }
    enterRule(listener) {
        if (listener.enterStringMethod)
            listener.enterStringMethod(this);
    }
    exitRule(listener) {
        if (listener.exitStringMethod)
            listener.exitStringMethod(this);
    }
    accept(visitor) {
        if (visitor.visitStringMethod)
            return visitor.visitStringMethod(this);
        else
            return visitor.visitChildren(this);
    }
}
__decorate([
    Decorators_2.Override
], StringMethodContext.prototype, "ruleIndex", null);
__decorate([
    Decorators_2.Override
], StringMethodContext.prototype, "enterRule", null);
__decorate([
    Decorators_2.Override
], StringMethodContext.prototype, "exitRule", null);
__decorate([
    Decorators_2.Override
], StringMethodContext.prototype, "accept", null);
exports.StringMethodContext = StringMethodContext;
class EnvvarContext extends ParserRuleContext_1.ParserRuleContext {
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    ID() { return this.getToken(RASPParser.ID, 0); }
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

//# sourceMappingURL=RASPParser.js.map
