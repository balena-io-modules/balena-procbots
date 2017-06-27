// Generated from /Work/git/resin-procbots/lib/RASP/Antlr/RASP.g4 by ANTLR 4.7
import org.antlr.v4.runtime.atn.*;
import org.antlr.v4.runtime.dfa.DFA;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.misc.*;
import org.antlr.v4.runtime.tree.*;
import java.util.List;
import java.util.Iterator;
import java.util.ArrayList;

@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast"})
public class RASPParser extends Parser {
	static { RuntimeMetaData.checkVersion("4.7", RuntimeMetaData.VERSION); }

	protected static final DFA[] _decisionToDFA;
	protected static final PredictionContextCache _sharedContextCache =
		new PredictionContextCache();
	public static final int
		T__0=1, T__1=2, T__2=3, T__3=4, T__4=5, T__5=6, T__6=7, T__7=8, T__8=9, 
		T__9=10, T__10=11, T__11=12, T__12=13, T__13=14, T__14=15, T__15=16, T__16=17, 
		INT=18, ALPHA=19, HEX=20, ALPHANUMERIC=21, COMMENT=22, LINE_COMMENT=23, 
		WS=24;
	public static final int
		RULE_init = 0, RULE_comment = 1, RULE_botDefinition = 2, RULE_botBody = 3, 
		RULE_addListener = 4, RULE_addEmitter = 5, RULE_serviceName = 6, RULE_serviceConstructor = 7, 
		RULE_serviceConstructorPair = 8, RULE_requestServiceEvents = 9, RULE_eventRegistration = 10, 
		RULE_events = 11, RULE_listenerMethodName = 12, RULE_listenerMethod = 13, 
		RULE_listenerBody = 14, RULE_envvar = 15, RULE_path = 16;
	public static final String[] ruleNames = {
		"init", "comment", "botDefinition", "botBody", "addListener", "addEmitter", 
		"serviceName", "serviceConstructor", "serviceConstructorPair", "requestServiceEvents", 
		"eventRegistration", "events", "listenerMethodName", "listenerMethod", 
		"listenerBody", "envvar", "path"
	};

	private static final String[] _LITERAL_NAMES = {
		null, "'bot('", "')'", "'{'", "'}'", "'='", "'AddListener('", "','", "'AddEmitter('", 
		"'github'", "'flowdock'", "':'", "'RequestEvents('", "'['", "']'", "'envar'", 
		"'('", "'/'"
	};
	private static final String[] _SYMBOLIC_NAMES = {
		null, null, null, null, null, null, null, null, null, null, null, null, 
		null, null, null, null, null, null, "INT", "ALPHA", "HEX", "ALPHANUMERIC", 
		"COMMENT", "LINE_COMMENT", "WS"
	};
	public static final Vocabulary VOCABULARY = new VocabularyImpl(_LITERAL_NAMES, _SYMBOLIC_NAMES);

	/**
	 * @deprecated Use {@link #VOCABULARY} instead.
	 */
	@Deprecated
	public static final String[] tokenNames;
	static {
		tokenNames = new String[_SYMBOLIC_NAMES.length];
		for (int i = 0; i < tokenNames.length; i++) {
			tokenNames[i] = VOCABULARY.getLiteralName(i);
			if (tokenNames[i] == null) {
				tokenNames[i] = VOCABULARY.getSymbolicName(i);
			}

			if (tokenNames[i] == null) {
				tokenNames[i] = "<INVALID>";
			}
		}
	}

	@Override
	@Deprecated
	public String[] getTokenNames() {
		return tokenNames;
	}

	@Override

	public Vocabulary getVocabulary() {
		return VOCABULARY;
	}

	@Override
	public String getGrammarFileName() { return "RASP.g4"; }

	@Override
	public String[] getRuleNames() { return ruleNames; }

	@Override
	public String getSerializedATN() { return _serializedATN; }

	@Override
	public ATN getATN() { return _ATN; }

	public RASPParser(TokenStream input) {
		super(input);
		_interp = new ParserATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);
	}
	public static class InitContext extends ParserRuleContext {
		public BotDefinitionContext botDefinition() {
			return getRuleContext(BotDefinitionContext.class,0);
		}
		public CommentContext comment() {
			return getRuleContext(CommentContext.class,0);
		}
		public TerminalNode EOF() { return getToken(RASPParser.EOF, 0); }
		public InitContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_init; }
	}

	public final InitContext init() throws RecognitionException {
		InitContext _localctx = new InitContext(_ctx, getState());
		enterRule(_localctx, 0, RULE_init);
		try {
			setState(37);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case T__0:
				enterOuterAlt(_localctx, 1);
				{
				setState(34);
				botDefinition();
				}
				break;
			case COMMENT:
			case LINE_COMMENT:
				enterOuterAlt(_localctx, 2);
				{
				setState(35);
				comment();
				}
				break;
			case EOF:
				enterOuterAlt(_localctx, 3);
				{
				setState(36);
				match(EOF);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class CommentContext extends ParserRuleContext {
		public TerminalNode COMMENT() { return getToken(RASPParser.COMMENT, 0); }
		public TerminalNode LINE_COMMENT() { return getToken(RASPParser.LINE_COMMENT, 0); }
		public CommentContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_comment; }
	}

	public final CommentContext comment() throws RecognitionException {
		CommentContext _localctx = new CommentContext(_ctx, getState());
		enterRule(_localctx, 2, RULE_comment);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(39);
			_la = _input.LA(1);
			if ( !(_la==COMMENT || _la==LINE_COMMENT) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class BotDefinitionContext extends ParserRuleContext {
		public TerminalNode ALPHA() { return getToken(RASPParser.ALPHA, 0); }
		public List<BotBodyContext> botBody() {
			return getRuleContexts(BotBodyContext.class);
		}
		public BotBodyContext botBody(int i) {
			return getRuleContext(BotBodyContext.class,i);
		}
		public BotDefinitionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_botDefinition; }
	}

	public final BotDefinitionContext botDefinition() throws RecognitionException {
		BotDefinitionContext _localctx = new BotDefinitionContext(_ctx, getState());
		enterRule(_localctx, 4, RULE_botDefinition);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(41);
			match(T__0);
			setState(42);
			match(ALPHA);
			setState(43);
			match(T__1);
			setState(44);
			match(T__2);
			setState(45);
			botBody();
			setState(49);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while ((((_la) & ~0x3f) == 0 && ((1L << _la) & ((1L << T__5) | (1L << T__7) | (1L << T__11) | (1L << ALPHA) | (1L << COMMENT) | (1L << LINE_COMMENT))) != 0)) {
				{
				{
				setState(46);
				botBody();
				}
				}
				setState(51);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(52);
			match(T__3);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class BotBodyContext extends ParserRuleContext {
		public CommentContext comment() {
			return getRuleContext(CommentContext.class,0);
		}
		public AddListenerContext addListener() {
			return getRuleContext(AddListenerContext.class,0);
		}
		public AddEmitterContext addEmitter() {
			return getRuleContext(AddEmitterContext.class,0);
		}
		public RequestServiceEventsContext requestServiceEvents() {
			return getRuleContext(RequestServiceEventsContext.class,0);
		}
		public ListenerMethodContext listenerMethod() {
			return getRuleContext(ListenerMethodContext.class,0);
		}
		public BotBodyContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_botBody; }
	}

	public final BotBodyContext botBody() throws RecognitionException {
		BotBodyContext _localctx = new BotBodyContext(_ctx, getState());
		enterRule(_localctx, 6, RULE_botBody);
		try {
			setState(59);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,2,_ctx) ) {
			case 1:
				enterOuterAlt(_localctx, 1);
				{
				setState(54);
				comment();
				}
				break;
			case 2:
				enterOuterAlt(_localctx, 2);
				{
				setState(55);
				addListener();
				}
				break;
			case 3:
				enterOuterAlt(_localctx, 3);
				{
				setState(56);
				addEmitter();
				}
				break;
			case 4:
				enterOuterAlt(_localctx, 4);
				{
				setState(57);
				requestServiceEvents();
				}
				break;
			case 5:
				enterOuterAlt(_localctx, 5);
				{
				setState(58);
				listenerMethod();
				}
				break;
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class AddListenerContext extends ParserRuleContext {
		public ServiceNameContext serviceName() {
			return getRuleContext(ServiceNameContext.class,0);
		}
		public TerminalNode ALPHA() { return getToken(RASPParser.ALPHA, 0); }
		public List<ServiceConstructorContext> serviceConstructor() {
			return getRuleContexts(ServiceConstructorContext.class);
		}
		public ServiceConstructorContext serviceConstructor(int i) {
			return getRuleContext(ServiceConstructorContext.class,i);
		}
		public AddListenerContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_addListener; }
	}

	public final AddListenerContext addListener() throws RecognitionException {
		AddListenerContext _localctx = new AddListenerContext(_ctx, getState());
		enterRule(_localctx, 8, RULE_addListener);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(63);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==ALPHA) {
				{
				setState(61);
				match(ALPHA);
				setState(62);
				match(T__4);
				}
			}

			setState(65);
			match(T__5);
			setState(66);
			serviceName();
			setState(71);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==T__6) {
				{
				{
				setState(67);
				match(T__6);
				setState(68);
				serviceConstructor();
				}
				}
				setState(73);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(74);
			match(T__1);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class AddEmitterContext extends ParserRuleContext {
		public ServiceNameContext serviceName() {
			return getRuleContext(ServiceNameContext.class,0);
		}
		public ServiceConstructorContext serviceConstructor() {
			return getRuleContext(ServiceConstructorContext.class,0);
		}
		public TerminalNode ALPHA() { return getToken(RASPParser.ALPHA, 0); }
		public AddEmitterContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_addEmitter; }
	}

	public final AddEmitterContext addEmitter() throws RecognitionException {
		AddEmitterContext _localctx = new AddEmitterContext(_ctx, getState());
		enterRule(_localctx, 10, RULE_addEmitter);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(78);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==ALPHA) {
				{
				setState(76);
				match(ALPHA);
				setState(77);
				match(T__4);
				}
			}

			setState(80);
			match(T__7);
			setState(81);
			serviceName();
			{
			setState(82);
			match(T__6);
			setState(83);
			serviceConstructor();
			}
			setState(85);
			match(T__1);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class ServiceNameContext extends ParserRuleContext {
		public ServiceNameContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_serviceName; }
	}

	public final ServiceNameContext serviceName() throws RecognitionException {
		ServiceNameContext _localctx = new ServiceNameContext(_ctx, getState());
		enterRule(_localctx, 12, RULE_serviceName);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(87);
			_la = _input.LA(1);
			if ( !(_la==T__8 || _la==T__9) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class ServiceConstructorContext extends ParserRuleContext {
		public List<ServiceConstructorPairContext> serviceConstructorPair() {
			return getRuleContexts(ServiceConstructorPairContext.class);
		}
		public ServiceConstructorPairContext serviceConstructorPair(int i) {
			return getRuleContext(ServiceConstructorPairContext.class,i);
		}
		public ServiceConstructorContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_serviceConstructor; }
	}

	public final ServiceConstructorContext serviceConstructor() throws RecognitionException {
		ServiceConstructorContext _localctx = new ServiceConstructorContext(_ctx, getState());
		enterRule(_localctx, 14, RULE_serviceConstructor);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(89);
			match(T__2);
			setState(90);
			serviceConstructorPair();
			setState(95);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==T__6) {
				{
				{
				setState(91);
				match(T__6);
				setState(92);
				serviceConstructorPair();
				}
				}
				setState(97);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(98);
			match(T__3);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class ServiceConstructorPairContext extends ParserRuleContext {
		public List<TerminalNode> ALPHA() { return getTokens(RASPParser.ALPHA); }
		public TerminalNode ALPHA(int i) {
			return getToken(RASPParser.ALPHA, i);
		}
		public TerminalNode INT() { return getToken(RASPParser.INT, 0); }
		public TerminalNode HEX() { return getToken(RASPParser.HEX, 0); }
		public PathContext path() {
			return getRuleContext(PathContext.class,0);
		}
		public ServiceConstructorContext serviceConstructor() {
			return getRuleContext(ServiceConstructorContext.class,0);
		}
		public ServiceConstructorPairContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_serviceConstructorPair; }
	}

	public final ServiceConstructorPairContext serviceConstructorPair() throws RecognitionException {
		ServiceConstructorPairContext _localctx = new ServiceConstructorPairContext(_ctx, getState());
		enterRule(_localctx, 16, RULE_serviceConstructorPair);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(100);
			match(ALPHA);
			setState(101);
			match(T__10);
			setState(107);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case ALPHA:
				{
				setState(102);
				match(ALPHA);
				}
				break;
			case INT:
				{
				setState(103);
				match(INT);
				}
				break;
			case HEX:
				{
				setState(104);
				match(HEX);
				}
				break;
			case T__16:
				{
				setState(105);
				path();
				}
				break;
			case T__2:
				{
				setState(106);
				serviceConstructor();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class RequestServiceEventsContext extends ParserRuleContext {
		public ServiceNameContext serviceName() {
			return getRuleContext(ServiceNameContext.class,0);
		}
		public EventRegistrationContext eventRegistration() {
			return getRuleContext(EventRegistrationContext.class,0);
		}
		public RequestServiceEventsContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_requestServiceEvents; }
	}

	public final RequestServiceEventsContext requestServiceEvents() throws RecognitionException {
		RequestServiceEventsContext _localctx = new RequestServiceEventsContext(_ctx, getState());
		enterRule(_localctx, 18, RULE_requestServiceEvents);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(109);
			match(T__11);
			setState(110);
			serviceName();
			setState(111);
			match(T__6);
			setState(112);
			eventRegistration();
			setState(113);
			match(T__1);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class EventRegistrationContext extends ParserRuleContext {
		public EventsContext events() {
			return getRuleContext(EventsContext.class,0);
		}
		public ListenerMethodNameContext listenerMethodName() {
			return getRuleContext(ListenerMethodNameContext.class,0);
		}
		public EventRegistrationContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_eventRegistration; }
	}

	public final EventRegistrationContext eventRegistration() throws RecognitionException {
		EventRegistrationContext _localctx = new EventRegistrationContext(_ctx, getState());
		enterRule(_localctx, 20, RULE_eventRegistration);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(115);
			events();
			setState(116);
			match(T__6);
			setState(117);
			listenerMethodName();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class EventsContext extends ParserRuleContext {
		public List<TerminalNode> ALPHANUMERIC() { return getTokens(RASPParser.ALPHANUMERIC); }
		public TerminalNode ALPHANUMERIC(int i) {
			return getToken(RASPParser.ALPHANUMERIC, i);
		}
		public EventsContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_events; }
	}

	public final EventsContext events() throws RecognitionException {
		EventsContext _localctx = new EventsContext(_ctx, getState());
		enterRule(_localctx, 22, RULE_events);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(119);
			match(T__12);
			setState(120);
			match(ALPHANUMERIC);
			setState(125);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==T__6) {
				{
				{
				setState(121);
				match(T__6);
				setState(122);
				match(ALPHANUMERIC);
				}
				}
				setState(127);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(128);
			match(T__13);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class ListenerMethodNameContext extends ParserRuleContext {
		public TerminalNode ALPHA() { return getToken(RASPParser.ALPHA, 0); }
		public ListenerMethodNameContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_listenerMethodName; }
	}

	public final ListenerMethodNameContext listenerMethodName() throws RecognitionException {
		ListenerMethodNameContext _localctx = new ListenerMethodNameContext(_ctx, getState());
		enterRule(_localctx, 24, RULE_listenerMethodName);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(130);
			match(ALPHA);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class ListenerMethodContext extends ParserRuleContext {
		public TerminalNode ALPHA() { return getToken(RASPParser.ALPHA, 0); }
		public ListenerBodyContext listenerBody() {
			return getRuleContext(ListenerBodyContext.class,0);
		}
		public ListenerMethodContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_listenerMethod; }
	}

	public final ListenerMethodContext listenerMethod() throws RecognitionException {
		ListenerMethodContext _localctx = new ListenerMethodContext(_ctx, getState());
		enterRule(_localctx, 26, RULE_listenerMethod);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(132);
			match(ALPHA);
			setState(133);
			match(T__2);
			setState(134);
			listenerBody();
			setState(135);
			match(T__3);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class ListenerBodyContext extends ParserRuleContext {
		public ListenerBodyContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_listenerBody; }
	}

	public final ListenerBodyContext listenerBody() throws RecognitionException {
		ListenerBodyContext _localctx = new ListenerBodyContext(_ctx, getState());
		enterRule(_localctx, 28, RULE_listenerBody);
		try {
			enterOuterAlt(_localctx, 1);
			{
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class EnvvarContext extends ParserRuleContext {
		public TerminalNode ALPHA() { return getToken(RASPParser.ALPHA, 0); }
		public EnvvarContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_envvar; }
	}

	public final EnvvarContext envvar() throws RecognitionException {
		EnvvarContext _localctx = new EnvvarContext(_ctx, getState());
		enterRule(_localctx, 30, RULE_envvar);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(139);
			match(T__14);
			setState(140);
			match(T__15);
			setState(141);
			match(ALPHA);
			setState(142);
			match(T__1);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class PathContext extends ParserRuleContext {
		public TerminalNode ALPHA() { return getToken(RASPParser.ALPHA, 0); }
		public PathContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_path; }
	}

	public final PathContext path() throws RecognitionException {
		PathContext _localctx = new PathContext(_ctx, getState());
		enterRule(_localctx, 32, RULE_path);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(144);
			match(T__16);
			setState(146);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==ALPHA) {
				{
				setState(145);
				match(ALPHA);
				}
			}

			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static final String _serializedATN =
		"\3\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786\u5964\3\32\u0097\4\2\t\2"+
		"\4\3\t\3\4\4\t\4\4\5\t\5\4\6\t\6\4\7\t\7\4\b\t\b\4\t\t\t\4\n\t\n\4\13"+
		"\t\13\4\f\t\f\4\r\t\r\4\16\t\16\4\17\t\17\4\20\t\20\4\21\t\21\4\22\t\22"+
		"\3\2\3\2\3\2\5\2(\n\2\3\3\3\3\3\4\3\4\3\4\3\4\3\4\3\4\7\4\62\n\4\f\4\16"+
		"\4\65\13\4\3\4\3\4\3\5\3\5\3\5\3\5\3\5\5\5>\n\5\3\6\3\6\5\6B\n\6\3\6\3"+
		"\6\3\6\3\6\7\6H\n\6\f\6\16\6K\13\6\3\6\3\6\3\7\3\7\5\7Q\n\7\3\7\3\7\3"+
		"\7\3\7\3\7\3\7\3\7\3\b\3\b\3\t\3\t\3\t\3\t\7\t`\n\t\f\t\16\tc\13\t\3\t"+
		"\3\t\3\n\3\n\3\n\3\n\3\n\3\n\3\n\5\nn\n\n\3\13\3\13\3\13\3\13\3\13\3\13"+
		"\3\f\3\f\3\f\3\f\3\r\3\r\3\r\3\r\7\r~\n\r\f\r\16\r\u0081\13\r\3\r\3\r"+
		"\3\16\3\16\3\17\3\17\3\17\3\17\3\17\3\20\3\20\3\21\3\21\3\21\3\21\3\21"+
		"\3\22\3\22\5\22\u0095\n\22\3\22\2\2\23\2\4\6\b\n\f\16\20\22\24\26\30\32"+
		"\34\36 \"\2\4\3\2\30\31\3\2\13\f\2\u0096\2\'\3\2\2\2\4)\3\2\2\2\6+\3\2"+
		"\2\2\b=\3\2\2\2\nA\3\2\2\2\fP\3\2\2\2\16Y\3\2\2\2\20[\3\2\2\2\22f\3\2"+
		"\2\2\24o\3\2\2\2\26u\3\2\2\2\30y\3\2\2\2\32\u0084\3\2\2\2\34\u0086\3\2"+
		"\2\2\36\u008b\3\2\2\2 \u008d\3\2\2\2\"\u0092\3\2\2\2$(\5\6\4\2%(\5\4\3"+
		"\2&(\7\2\2\3\'$\3\2\2\2\'%\3\2\2\2\'&\3\2\2\2(\3\3\2\2\2)*\t\2\2\2*\5"+
		"\3\2\2\2+,\7\3\2\2,-\7\25\2\2-.\7\4\2\2./\7\5\2\2/\63\5\b\5\2\60\62\5"+
		"\b\5\2\61\60\3\2\2\2\62\65\3\2\2\2\63\61\3\2\2\2\63\64\3\2\2\2\64\66\3"+
		"\2\2\2\65\63\3\2\2\2\66\67\7\6\2\2\67\7\3\2\2\28>\5\4\3\29>\5\n\6\2:>"+
		"\5\f\7\2;>\5\24\13\2<>\5\34\17\2=8\3\2\2\2=9\3\2\2\2=:\3\2\2\2=;\3\2\2"+
		"\2=<\3\2\2\2>\t\3\2\2\2?@\7\25\2\2@B\7\7\2\2A?\3\2\2\2AB\3\2\2\2BC\3\2"+
		"\2\2CD\7\b\2\2DI\5\16\b\2EF\7\t\2\2FH\5\20\t\2GE\3\2\2\2HK\3\2\2\2IG\3"+
		"\2\2\2IJ\3\2\2\2JL\3\2\2\2KI\3\2\2\2LM\7\4\2\2M\13\3\2\2\2NO\7\25\2\2"+
		"OQ\7\7\2\2PN\3\2\2\2PQ\3\2\2\2QR\3\2\2\2RS\7\n\2\2ST\5\16\b\2TU\7\t\2"+
		"\2UV\5\20\t\2VW\3\2\2\2WX\7\4\2\2X\r\3\2\2\2YZ\t\3\2\2Z\17\3\2\2\2[\\"+
		"\7\5\2\2\\a\5\22\n\2]^\7\t\2\2^`\5\22\n\2_]\3\2\2\2`c\3\2\2\2a_\3\2\2"+
		"\2ab\3\2\2\2bd\3\2\2\2ca\3\2\2\2de\7\6\2\2e\21\3\2\2\2fg\7\25\2\2gm\7"+
		"\r\2\2hn\7\25\2\2in\7\24\2\2jn\7\26\2\2kn\5\"\22\2ln\5\20\t\2mh\3\2\2"+
		"\2mi\3\2\2\2mj\3\2\2\2mk\3\2\2\2ml\3\2\2\2n\23\3\2\2\2op\7\16\2\2pq\5"+
		"\16\b\2qr\7\t\2\2rs\5\26\f\2st\7\4\2\2t\25\3\2\2\2uv\5\30\r\2vw\7\t\2"+
		"\2wx\5\32\16\2x\27\3\2\2\2yz\7\17\2\2z\177\7\27\2\2{|\7\t\2\2|~\7\27\2"+
		"\2}{\3\2\2\2~\u0081\3\2\2\2\177}\3\2\2\2\177\u0080\3\2\2\2\u0080\u0082"+
		"\3\2\2\2\u0081\177\3\2\2\2\u0082\u0083\7\20\2\2\u0083\31\3\2\2\2\u0084"+
		"\u0085\7\25\2\2\u0085\33\3\2\2\2\u0086\u0087\7\25\2\2\u0087\u0088\7\5"+
		"\2\2\u0088\u0089\5\36\20\2\u0089\u008a\7\6\2\2\u008a\35\3\2\2\2\u008b"+
		"\u008c\3\2\2\2\u008c\37\3\2\2\2\u008d\u008e\7\21\2\2\u008e\u008f\7\22"+
		"\2\2\u008f\u0090\7\25\2\2\u0090\u0091\7\4\2\2\u0091!\3\2\2\2\u0092\u0094"+
		"\7\23\2\2\u0093\u0095\7\25\2\2\u0094\u0093\3\2\2\2\u0094\u0095\3\2\2\2"+
		"\u0095#\3\2\2\2\f\'\63=AIPam\177\u0094";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}