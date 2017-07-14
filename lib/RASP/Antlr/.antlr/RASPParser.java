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
		T__9=10, T__10=11, T__11=12, T__12=13, T__13=14, T__14=15, T__15=16, BOT=17, 
		EVENT=18, EVENTS=19, RECEIVER=20, RECEIVES=21, FROM=22, SEND=23, QUERIES=24, 
		TO=25, SET=26, AS=27, ADDED=28, SUBTRACTED=29, MULTIPLIED=30, DIVIDED=31, 
		BY=32, AND=33, OR=34, IS=35, NOT=36, QUERY=37, METHOD=38, ERRORMETHOD=39, 
		STRING=40, ESC=41, ID=42, BOOLEAN=43, NUMBER=44, FLOAT=45, INT=46, HEXNUMBER=47, 
		COMMENT=48, LINE_COMMENT=49, WS=50;
	public static final int
		RULE_init = 0, RULE_botDefinition = 1, RULE_botBody = 2, RULE_addListener = 3, 
		RULE_addEmitter = 4, RULE_requestServiceEvents = 5, RULE_events = 6, RULE_setServiceAs = 7, 
		RULE_setIdFrom = 8, RULE_listenerMethod = 9, RULE_listenerEventReceiver = 10, 
		RULE_listenerError = 11, RULE_statement = 12, RULE_assignment = 13, RULE_r_if = 14, 
		RULE_r_while = 15, RULE_loop = 16, RULE_print = 17, RULE_end = 18, RULE_sendQuery = 19, 
		RULE_expr = 20, RULE_serviceName = 21, RULE_variable = 22, RULE_object = 23, 
		RULE_array = 24, RULE_property = 25, RULE_method = 26, RULE_methodList = 27, 
		RULE_stringMethod = 28, RULE_envvar = 29;
	public static final String[] ruleNames = {
		"init", "botDefinition", "botBody", "addListener", "addEmitter", "requestServiceEvents", 
		"events", "setServiceAs", "setIdFrom", "listenerMethod", "listenerEventReceiver", 
		"listenerError", "statement", "assignment", "r_if", "r_while", "loop", 
		"print", "end", "sendQuery", "expr", "serviceName", "variable", "object", 
		"array", "property", "method", "methodList", "stringMethod", "envvar"
	};

	private static final String[] _LITERAL_NAMES = {
		null, "'('", "')'", "'['", "','", "']'", "'if'", "'else'", "'while'", 
		"'loop'", "'print'", "'end'", "'.'", "'{'", "'}'", "':'", "'envar'", "'bot'", 
		"'event'", "'events'", "'receiver'", "'receives'", "'from'", "'send'", 
		"'queries'", "'to'", "'set'", "'as'", "'added'", "'subtracted'", "'multiplied'", 
		"'divided'", "'by'", "'and'", "'or'", "'is'", "'not'", "'query'", "'listenerMethod'", 
		"'listenerErrorMethod'"
	};
	private static final String[] _SYMBOLIC_NAMES = {
		null, null, null, null, null, null, null, null, null, null, null, null, 
		null, null, null, null, null, "BOT", "EVENT", "EVENTS", "RECEIVER", "RECEIVES", 
		"FROM", "SEND", "QUERIES", "TO", "SET", "AS", "ADDED", "SUBTRACTED", "MULTIPLIED", 
		"DIVIDED", "BY", "AND", "OR", "IS", "NOT", "QUERY", "METHOD", "ERRORMETHOD", 
		"STRING", "ESC", "ID", "BOOLEAN", "NUMBER", "FLOAT", "INT", "HEXNUMBER", 
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
			setState(62);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case BOT:
				enterOuterAlt(_localctx, 1);
				{
				setState(60);
				botDefinition();
				}
				break;
			case EOF:
				enterOuterAlt(_localctx, 2);
				{
				setState(61);
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

	public static class BotDefinitionContext extends ParserRuleContext {
		public TerminalNode BOT() { return getToken(RASPParser.BOT, 0); }
		public TerminalNode ID() { return getToken(RASPParser.ID, 0); }
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
		enterRule(_localctx, 2, RULE_botDefinition);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(64);
			match(BOT);
			setState(65);
			match(T__0);
			setState(66);
			match(ID);
			setState(67);
			match(T__1);
			setState(71);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while ((((_la) & ~0x3f) == 0 && ((1L << _la) & ((1L << EVENT) | (1L << SEND) | (1L << SET) | (1L << METHOD) | (1L << ERRORMETHOD) | (1L << ID))) != 0)) {
				{
				{
				setState(68);
				botBody();
				}
				}
				setState(73);
				_errHandler.sync(this);
				_la = _input.LA(1);
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

	public static class BotBodyContext extends ParserRuleContext {
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
		public ListenerErrorContext listenerError() {
			return getRuleContext(ListenerErrorContext.class,0);
		}
		public MethodContext method() {
			return getRuleContext(MethodContext.class,0);
		}
		public AssignmentContext assignment() {
			return getRuleContext(AssignmentContext.class,0);
		}
		public BotBodyContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_botBody; }
	}

	public final BotBodyContext botBody() throws RecognitionException {
		BotBodyContext _localctx = new BotBodyContext(_ctx, getState());
		enterRule(_localctx, 4, RULE_botBody);
		try {
			setState(81);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,2,_ctx) ) {
			case 1:
				enterOuterAlt(_localctx, 1);
				{
				setState(74);
				addListener();
				}
				break;
			case 2:
				enterOuterAlt(_localctx, 2);
				{
				setState(75);
				addEmitter();
				}
				break;
			case 3:
				enterOuterAlt(_localctx, 3);
				{
				setState(76);
				requestServiceEvents();
				}
				break;
			case 4:
				enterOuterAlt(_localctx, 4);
				{
				setState(77);
				listenerMethod();
				}
				break;
			case 5:
				enterOuterAlt(_localctx, 5);
				{
				setState(78);
				listenerError();
				}
				break;
			case 6:
				enterOuterAlt(_localctx, 6);
				{
				setState(79);
				method();
				}
				break;
			case 7:
				enterOuterAlt(_localctx, 7);
				{
				setState(80);
				assignment();
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
		public TerminalNode EVENT() { return getToken(RASPParser.EVENT, 0); }
		public TerminalNode RECEIVER() { return getToken(RASPParser.RECEIVER, 0); }
		public TerminalNode FROM() { return getToken(RASPParser.FROM, 0); }
		public ServiceNameContext serviceName() {
			return getRuleContext(ServiceNameContext.class,0);
		}
		public SetServiceAsContext setServiceAs() {
			return getRuleContext(SetServiceAsContext.class,0);
		}
		public ObjectContext object() {
			return getRuleContext(ObjectContext.class,0);
		}
		public VariableContext variable() {
			return getRuleContext(VariableContext.class,0);
		}
		public AddListenerContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_addListener; }
	}

	public final AddListenerContext addListener() throws RecognitionException {
		AddListenerContext _localctx = new AddListenerContext(_ctx, getState());
		enterRule(_localctx, 6, RULE_addListener);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(84);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==SET) {
				{
				setState(83);
				setServiceAs();
				}
			}

			setState(86);
			match(EVENT);
			setState(87);
			match(RECEIVER);
			setState(88);
			match(FROM);
			setState(89);
			serviceName();
			setState(92);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,4,_ctx) ) {
			case 1:
				{
				setState(90);
				object();
				}
				break;
			case 2:
				{
				setState(91);
				variable();
				}
				break;
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

	public static class AddEmitterContext extends ParserRuleContext {
		public TerminalNode SEND() { return getToken(RASPParser.SEND, 0); }
		public TerminalNode QUERIES() { return getToken(RASPParser.QUERIES, 0); }
		public TerminalNode TO() { return getToken(RASPParser.TO, 0); }
		public ServiceNameContext serviceName() {
			return getRuleContext(ServiceNameContext.class,0);
		}
		public SetServiceAsContext setServiceAs() {
			return getRuleContext(SetServiceAsContext.class,0);
		}
		public ObjectContext object() {
			return getRuleContext(ObjectContext.class,0);
		}
		public VariableContext variable() {
			return getRuleContext(VariableContext.class,0);
		}
		public AddEmitterContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_addEmitter; }
	}

	public final AddEmitterContext addEmitter() throws RecognitionException {
		AddEmitterContext _localctx = new AddEmitterContext(_ctx, getState());
		enterRule(_localctx, 8, RULE_addEmitter);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(95);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==SET) {
				{
				setState(94);
				setServiceAs();
				}
			}

			setState(97);
			match(SEND);
			setState(98);
			match(QUERIES);
			setState(99);
			match(TO);
			setState(100);
			serviceName();
			setState(103);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,6,_ctx) ) {
			case 1:
				{
				setState(101);
				object();
				}
				break;
			case 2:
				{
				setState(102);
				variable();
				}
				break;
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
		public TerminalNode SEND() { return getToken(RASPParser.SEND, 0); }
		public EventsContext events() {
			return getRuleContext(EventsContext.class,0);
		}
		public TerminalNode EVENTS() { return getToken(RASPParser.EVENTS, 0); }
		public TerminalNode FROM() { return getToken(RASPParser.FROM, 0); }
		public ServiceNameContext serviceName() {
			return getRuleContext(ServiceNameContext.class,0);
		}
		public TerminalNode TO() { return getToken(RASPParser.TO, 0); }
		public TerminalNode ID() { return getToken(RASPParser.ID, 0); }
		public RequestServiceEventsContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_requestServiceEvents; }
	}

	public final RequestServiceEventsContext requestServiceEvents() throws RecognitionException {
		RequestServiceEventsContext _localctx = new RequestServiceEventsContext(_ctx, getState());
		enterRule(_localctx, 10, RULE_requestServiceEvents);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(105);
			match(SEND);
			setState(106);
			events();
			setState(107);
			match(EVENTS);
			setState(108);
			match(FROM);
			setState(109);
			serviceName();
			setState(110);
			match(TO);
			setState(111);
			match(ID);
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
		public List<TerminalNode> ID() { return getTokens(RASPParser.ID); }
		public TerminalNode ID(int i) {
			return getToken(RASPParser.ID, i);
		}
		public EventsContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_events; }
	}

	public final EventsContext events() throws RecognitionException {
		EventsContext _localctx = new EventsContext(_ctx, getState());
		enterRule(_localctx, 12, RULE_events);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(113);
			match(T__2);
			setState(114);
			match(ID);
			setState(119);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==T__3) {
				{
				{
				setState(115);
				match(T__3);
				setState(116);
				match(ID);
				}
				}
				setState(121);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(122);
			match(T__4);
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

	public static class SetServiceAsContext extends ParserRuleContext {
		public TerminalNode SET() { return getToken(RASPParser.SET, 0); }
		public TerminalNode ID() { return getToken(RASPParser.ID, 0); }
		public TerminalNode AS() { return getToken(RASPParser.AS, 0); }
		public SetServiceAsContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_setServiceAs; }
	}

	public final SetServiceAsContext setServiceAs() throws RecognitionException {
		SetServiceAsContext _localctx = new SetServiceAsContext(_ctx, getState());
		enterRule(_localctx, 14, RULE_setServiceAs);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(124);
			match(SET);
			setState(125);
			match(ID);
			setState(126);
			match(AS);
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

	public static class SetIdFromContext extends ParserRuleContext {
		public TerminalNode SET() { return getToken(RASPParser.SET, 0); }
		public TerminalNode ID() { return getToken(RASPParser.ID, 0); }
		public TerminalNode FROM() { return getToken(RASPParser.FROM, 0); }
		public SetIdFromContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_setIdFrom; }
	}

	public final SetIdFromContext setIdFrom() throws RecognitionException {
		SetIdFromContext _localctx = new SetIdFromContext(_ctx, getState());
		enterRule(_localctx, 16, RULE_setIdFrom);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(128);
			match(SET);
			setState(129);
			match(ID);
			setState(130);
			match(FROM);
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
		public TerminalNode METHOD() { return getToken(RASPParser.METHOD, 0); }
		public TerminalNode ID() { return getToken(RASPParser.ID, 0); }
		public TerminalNode RECEIVES() { return getToken(RASPParser.RECEIVES, 0); }
		public List<ListenerEventReceiverContext> listenerEventReceiver() {
			return getRuleContexts(ListenerEventReceiverContext.class);
		}
		public ListenerEventReceiverContext listenerEventReceiver(int i) {
			return getRuleContext(ListenerEventReceiverContext.class,i);
		}
		public List<StatementContext> statement() {
			return getRuleContexts(StatementContext.class);
		}
		public StatementContext statement(int i) {
			return getRuleContext(StatementContext.class,i);
		}
		public ListenerMethodContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_listenerMethod; }
	}

	public final ListenerMethodContext listenerMethod() throws RecognitionException {
		ListenerMethodContext _localctx = new ListenerMethodContext(_ctx, getState());
		enterRule(_localctx, 18, RULE_listenerMethod);
		int _la;
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(132);
			match(METHOD);
			setState(133);
			match(ID);
			setState(143);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==RECEIVES) {
				{
				setState(134);
				match(RECEIVES);
				setState(135);
				listenerEventReceiver();
				setState(140);
				_errHandler.sync(this);
				_la = _input.LA(1);
				while (_la==T__3) {
					{
					{
					setState(136);
					match(T__3);
					setState(137);
					listenerEventReceiver();
					}
					}
					setState(142);
					_errHandler.sync(this);
					_la = _input.LA(1);
				}
				}
			}

			setState(148);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,10,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(145);
					statement();
					}
					} 
				}
				setState(150);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,10,_ctx);
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

	public static class ListenerEventReceiverContext extends ParserRuleContext {
		public EventsContext events() {
			return getRuleContext(EventsContext.class,0);
		}
		public TerminalNode EVENTS() { return getToken(RASPParser.EVENTS, 0); }
		public TerminalNode FROM() { return getToken(RASPParser.FROM, 0); }
		public ServiceNameContext serviceName() {
			return getRuleContext(ServiceNameContext.class,0);
		}
		public ListenerEventReceiverContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_listenerEventReceiver; }
	}

	public final ListenerEventReceiverContext listenerEventReceiver() throws RecognitionException {
		ListenerEventReceiverContext _localctx = new ListenerEventReceiverContext(_ctx, getState());
		enterRule(_localctx, 20, RULE_listenerEventReceiver);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(151);
			events();
			setState(152);
			match(EVENTS);
			setState(153);
			match(FROM);
			setState(154);
			serviceName();
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

	public static class ListenerErrorContext extends ParserRuleContext {
		public TerminalNode ERRORMETHOD() { return getToken(RASPParser.ERRORMETHOD, 0); }
		public TerminalNode ID() { return getToken(RASPParser.ID, 0); }
		public List<StatementContext> statement() {
			return getRuleContexts(StatementContext.class);
		}
		public StatementContext statement(int i) {
			return getRuleContext(StatementContext.class,i);
		}
		public ListenerErrorContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_listenerError; }
	}

	public final ListenerErrorContext listenerError() throws RecognitionException {
		ListenerErrorContext _localctx = new ListenerErrorContext(_ctx, getState());
		enterRule(_localctx, 22, RULE_listenerError);
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(156);
			match(ERRORMETHOD);
			setState(157);
			match(ID);
			setState(161);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,11,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(158);
					statement();
					}
					} 
				}
				setState(163);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,11,_ctx);
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

	public static class StatementContext extends ParserRuleContext {
		public MethodContext method() {
			return getRuleContext(MethodContext.class,0);
		}
		public AssignmentContext assignment() {
			return getRuleContext(AssignmentContext.class,0);
		}
		public R_ifContext r_if() {
			return getRuleContext(R_ifContext.class,0);
		}
		public R_whileContext r_while() {
			return getRuleContext(R_whileContext.class,0);
		}
		public LoopContext loop() {
			return getRuleContext(LoopContext.class,0);
		}
		public PrintContext print() {
			return getRuleContext(PrintContext.class,0);
		}
		public SendQueryContext sendQuery() {
			return getRuleContext(SendQueryContext.class,0);
		}
		public EndContext end() {
			return getRuleContext(EndContext.class,0);
		}
		public StatementContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_statement; }
	}

	public final StatementContext statement() throws RecognitionException {
		StatementContext _localctx = new StatementContext(_ctx, getState());
		enterRule(_localctx, 24, RULE_statement);
		try {
			setState(172);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,12,_ctx) ) {
			case 1:
				enterOuterAlt(_localctx, 1);
				{
				setState(164);
				method();
				}
				break;
			case 2:
				enterOuterAlt(_localctx, 2);
				{
				setState(165);
				assignment();
				}
				break;
			case 3:
				enterOuterAlt(_localctx, 3);
				{
				setState(166);
				r_if();
				}
				break;
			case 4:
				enterOuterAlt(_localctx, 4);
				{
				setState(167);
				r_while();
				}
				break;
			case 5:
				enterOuterAlt(_localctx, 5);
				{
				setState(168);
				loop();
				}
				break;
			case 6:
				enterOuterAlt(_localctx, 6);
				{
				setState(169);
				print();
				}
				break;
			case 7:
				enterOuterAlt(_localctx, 7);
				{
				setState(170);
				sendQuery();
				}
				break;
			case 8:
				enterOuterAlt(_localctx, 8);
				{
				setState(171);
				end();
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

	public static class AssignmentContext extends ParserRuleContext {
		public VariableContext variable() {
			return getRuleContext(VariableContext.class,0);
		}
		public ExprContext expr() {
			return getRuleContext(ExprContext.class,0);
		}
		public AssignmentContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_assignment; }
	}

	public final AssignmentContext assignment() throws RecognitionException {
		AssignmentContext _localctx = new AssignmentContext(_ctx, getState());
		enterRule(_localctx, 26, RULE_assignment);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(174);
			match(SET);
			setState(175);
			variable();
			setState(176);
			match(AS);
			setState(177);
			expr(0);
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

	public static class R_ifContext extends ParserRuleContext {
		public ExprContext expr() {
			return getRuleContext(ExprContext.class,0);
		}
		public List<StatementContext> statement() {
			return getRuleContexts(StatementContext.class);
		}
		public StatementContext statement(int i) {
			return getRuleContext(StatementContext.class,i);
		}
		public R_ifContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_r_if; }
	}

	public final R_ifContext r_if() throws RecognitionException {
		R_ifContext _localctx = new R_ifContext(_ctx, getState());
		enterRule(_localctx, 28, RULE_r_if);
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(179);
			match(T__5);
			setState(180);
			expr(0);
			setState(181);
			statement();
			setState(187);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,13,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(182);
					match(T__6);
					setState(183);
					match(T__5);
					setState(184);
					statement();
					}
					} 
				}
				setState(189);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,13,_ctx);
			}
			setState(192);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,14,_ctx) ) {
			case 1:
				{
				setState(190);
				match(T__6);
				setState(191);
				statement();
				}
				break;
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

	public static class R_whileContext extends ParserRuleContext {
		public ExprContext expr() {
			return getRuleContext(ExprContext.class,0);
		}
		public StatementContext statement() {
			return getRuleContext(StatementContext.class,0);
		}
		public R_whileContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_r_while; }
	}

	public final R_whileContext r_while() throws RecognitionException {
		R_whileContext _localctx = new R_whileContext(_ctx, getState());
		enterRule(_localctx, 30, RULE_r_while);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(194);
			match(T__7);
			setState(195);
			expr(0);
			setState(196);
			statement();
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

	public static class LoopContext extends ParserRuleContext {
		public List<ExprContext> expr() {
			return getRuleContexts(ExprContext.class);
		}
		public ExprContext expr(int i) {
			return getRuleContext(ExprContext.class,i);
		}
		public LoopContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_loop; }
	}

	public final LoopContext loop() throws RecognitionException {
		LoopContext _localctx = new LoopContext(_ctx, getState());
		enterRule(_localctx, 32, RULE_loop);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(198);
			match(T__8);
			setState(199);
			match(FROM);
			setState(200);
			expr(0);
			setState(201);
			match(TO);
			setState(202);
			expr(0);
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

	public static class PrintContext extends ParserRuleContext {
		public ExprContext expr() {
			return getRuleContext(ExprContext.class,0);
		}
		public PrintContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_print; }
	}

	public final PrintContext print() throws RecognitionException {
		PrintContext _localctx = new PrintContext(_ctx, getState());
		enterRule(_localctx, 34, RULE_print);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(204);
			match(T__9);
			setState(205);
			expr(0);
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

	public static class EndContext extends ParserRuleContext {
		public EndContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_end; }
	}

	public final EndContext end() throws RecognitionException {
		EndContext _localctx = new EndContext(_ctx, getState());
		enterRule(_localctx, 36, RULE_end);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(207);
			match(T__10);
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

	public static class SendQueryContext extends ParserRuleContext {
		public TerminalNode QUERY() { return getToken(RASPParser.QUERY, 0); }
		public ObjectContext object() {
			return getRuleContext(ObjectContext.class,0);
		}
		public SetIdFromContext setIdFrom() {
			return getRuleContext(SetIdFromContext.class,0);
		}
		public List<TerminalNode> ID() { return getTokens(RASPParser.ID); }
		public TerminalNode ID(int i) {
			return getToken(RASPParser.ID, i);
		}
		public SendQueryContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_sendQuery; }
	}

	public final SendQueryContext sendQuery() throws RecognitionException {
		SendQueryContext _localctx = new SendQueryContext(_ctx, getState());
		enterRule(_localctx, 38, RULE_sendQuery);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(210);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==SET) {
				{
				setState(209);
				setIdFrom();
				}
			}

			setState(212);
			match(QUERY);
			setState(216);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==ID) {
				{
				{
				setState(213);
				match(ID);
				}
				}
				setState(218);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(219);
			object();
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

	public static class ExprContext extends ParserRuleContext {
		public ArrayContext array() {
			return getRuleContext(ArrayContext.class,0);
		}
		public MethodContext method() {
			return getRuleContext(MethodContext.class,0);
		}
		public StringMethodContext stringMethod() {
			return getRuleContext(StringMethodContext.class,0);
		}
		public VariableContext variable() {
			return getRuleContext(VariableContext.class,0);
		}
		public ObjectContext object() {
			return getRuleContext(ObjectContext.class,0);
		}
		public TerminalNode NUMBER() { return getToken(RASPParser.NUMBER, 0); }
		public TerminalNode STRING() { return getToken(RASPParser.STRING, 0); }
		public TerminalNode BOOLEAN() { return getToken(RASPParser.BOOLEAN, 0); }
		public List<ExprContext> expr() {
			return getRuleContexts(ExprContext.class);
		}
		public ExprContext expr(int i) {
			return getRuleContext(ExprContext.class,i);
		}
		public TerminalNode MULTIPLIED() { return getToken(RASPParser.MULTIPLIED, 0); }
		public TerminalNode BY() { return getToken(RASPParser.BY, 0); }
		public TerminalNode DIVIDED() { return getToken(RASPParser.DIVIDED, 0); }
		public TerminalNode ADDED() { return getToken(RASPParser.ADDED, 0); }
		public TerminalNode TO() { return getToken(RASPParser.TO, 0); }
		public TerminalNode SUBTRACTED() { return getToken(RASPParser.SUBTRACTED, 0); }
		public TerminalNode AND() { return getToken(RASPParser.AND, 0); }
		public TerminalNode OR() { return getToken(RASPParser.OR, 0); }
		public TerminalNode IS() { return getToken(RASPParser.IS, 0); }
		public TerminalNode NOT() { return getToken(RASPParser.NOT, 0); }
		public ExprContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_expr; }
	}

	public final ExprContext expr() throws RecognitionException {
		return expr(0);
	}

	private ExprContext expr(int _p) throws RecognitionException {
		ParserRuleContext _parentctx = _ctx;
		int _parentState = getState();
		ExprContext _localctx = new ExprContext(_ctx, _parentState);
		ExprContext _prevctx = _localctx;
		int _startState = 40;
		enterRecursionRule(_localctx, 40, RULE_expr, _p);
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(230);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,17,_ctx) ) {
			case 1:
				{
				setState(222);
				array();
				}
				break;
			case 2:
				{
				setState(223);
				method();
				}
				break;
			case 3:
				{
				setState(224);
				stringMethod();
				}
				break;
			case 4:
				{
				setState(225);
				variable();
				}
				break;
			case 5:
				{
				setState(226);
				object();
				}
				break;
			case 6:
				{
				setState(227);
				match(NUMBER);
				}
				break;
			case 7:
				{
				setState(228);
				match(STRING);
				}
				break;
			case 8:
				{
				setState(229);
				match(BOOLEAN);
				}
				break;
			}
			_ctx.stop = _input.LT(-1);
			setState(263);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,19,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					if ( _parseListeners!=null ) triggerExitRuleEvent();
					_prevctx = _localctx;
					{
					setState(261);
					_errHandler.sync(this);
					switch ( getInterpreter().adaptivePredict(_input,18,_ctx) ) {
					case 1:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						pushNewRecursionContext(_localctx, _startState, RULE_expr);
						setState(232);
						if (!(precpred(_ctx, 16))) throw new FailedPredicateException(this, "precpred(_ctx, 16)");
						setState(233);
						match(MULTIPLIED);
						setState(234);
						match(BY);
						setState(235);
						expr(17);
						}
						break;
					case 2:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						pushNewRecursionContext(_localctx, _startState, RULE_expr);
						setState(236);
						if (!(precpred(_ctx, 15))) throw new FailedPredicateException(this, "precpred(_ctx, 15)");
						setState(237);
						match(DIVIDED);
						setState(238);
						match(BY);
						setState(239);
						expr(16);
						}
						break;
					case 3:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						pushNewRecursionContext(_localctx, _startState, RULE_expr);
						setState(240);
						if (!(precpred(_ctx, 14))) throw new FailedPredicateException(this, "precpred(_ctx, 14)");
						setState(241);
						match(ADDED);
						setState(242);
						match(TO);
						setState(243);
						expr(15);
						}
						break;
					case 4:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						pushNewRecursionContext(_localctx, _startState, RULE_expr);
						setState(244);
						if (!(precpred(_ctx, 13))) throw new FailedPredicateException(this, "precpred(_ctx, 13)");
						setState(245);
						match(SUBTRACTED);
						setState(246);
						match(BY);
						setState(247);
						expr(14);
						}
						break;
					case 5:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						pushNewRecursionContext(_localctx, _startState, RULE_expr);
						setState(248);
						if (!(precpred(_ctx, 12))) throw new FailedPredicateException(this, "precpred(_ctx, 12)");
						setState(249);
						match(AND);
						setState(250);
						expr(13);
						}
						break;
					case 6:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						pushNewRecursionContext(_localctx, _startState, RULE_expr);
						setState(251);
						if (!(precpred(_ctx, 11))) throw new FailedPredicateException(this, "precpred(_ctx, 11)");
						setState(252);
						match(OR);
						setState(253);
						expr(12);
						}
						break;
					case 7:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						pushNewRecursionContext(_localctx, _startState, RULE_expr);
						setState(254);
						if (!(precpred(_ctx, 10))) throw new FailedPredicateException(this, "precpred(_ctx, 10)");
						setState(255);
						match(IS);
						setState(256);
						expr(11);
						}
						break;
					case 8:
						{
						_localctx = new ExprContext(_parentctx, _parentState);
						pushNewRecursionContext(_localctx, _startState, RULE_expr);
						setState(257);
						if (!(precpred(_ctx, 9))) throw new FailedPredicateException(this, "precpred(_ctx, 9)");
						setState(258);
						match(IS);
						setState(259);
						match(NOT);
						setState(260);
						expr(10);
						}
						break;
					}
					} 
				}
				setState(265);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,19,_ctx);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			unrollRecursionContexts(_parentctx);
		}
		return _localctx;
	}

	public static class ServiceNameContext extends ParserRuleContext {
		public TerminalNode ID() { return getToken(RASPParser.ID, 0); }
		public ServiceNameContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_serviceName; }
	}

	public final ServiceNameContext serviceName() throws RecognitionException {
		ServiceNameContext _localctx = new ServiceNameContext(_ctx, getState());
		enterRule(_localctx, 42, RULE_serviceName);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(266);
			match(ID);
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

	public static class VariableContext extends ParserRuleContext {
		public List<TerminalNode> ID() { return getTokens(RASPParser.ID); }
		public TerminalNode ID(int i) {
			return getToken(RASPParser.ID, i);
		}
		public VariableContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_variable; }
	}

	public final VariableContext variable() throws RecognitionException {
		VariableContext _localctx = new VariableContext(_ctx, getState());
		enterRule(_localctx, 44, RULE_variable);
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(268);
			match(ID);
			setState(273);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,20,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(269);
					match(T__11);
					setState(270);
					match(ID);
					}
					} 
				}
				setState(275);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,20,_ctx);
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

	public static class ObjectContext extends ParserRuleContext {
		public List<PropertyContext> property() {
			return getRuleContexts(PropertyContext.class);
		}
		public PropertyContext property(int i) {
			return getRuleContext(PropertyContext.class,i);
		}
		public ObjectContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_object; }
	}

	public final ObjectContext object() throws RecognitionException {
		ObjectContext _localctx = new ObjectContext(_ctx, getState());
		enterRule(_localctx, 46, RULE_object);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(276);
			match(T__12);
			setState(277);
			property();
			setState(282);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==T__3) {
				{
				{
				setState(278);
				match(T__3);
				setState(279);
				property();
				}
				}
				setState(284);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(285);
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

	public static class ArrayContext extends ParserRuleContext {
		public List<ExprContext> expr() {
			return getRuleContexts(ExprContext.class);
		}
		public ExprContext expr(int i) {
			return getRuleContext(ExprContext.class,i);
		}
		public TerminalNode ID() { return getToken(RASPParser.ID, 0); }
		public ArrayContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_array; }
	}

	public final ArrayContext array() throws RecognitionException {
		ArrayContext _localctx = new ArrayContext(_ctx, getState());
		enterRule(_localctx, 48, RULE_array);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(288);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==ID) {
				{
				setState(287);
				match(ID);
				}
			}

			setState(290);
			match(T__2);
			setState(291);
			expr(0);
			setState(296);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==T__3) {
				{
				{
				setState(292);
				match(T__3);
				setState(293);
				expr(0);
				}
				}
				setState(298);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(299);
			match(T__4);
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

	public static class PropertyContext extends ParserRuleContext {
		public TerminalNode ID() { return getToken(RASPParser.ID, 0); }
		public List<ExprContext> expr() {
			return getRuleContexts(ExprContext.class);
		}
		public ExprContext expr(int i) {
			return getRuleContext(ExprContext.class,i);
		}
		public PropertyContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_property; }
	}

	public final PropertyContext property() throws RecognitionException {
		PropertyContext _localctx = new PropertyContext(_ctx, getState());
		enterRule(_localctx, 50, RULE_property);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(301);
			match(ID);
			setState(306);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==T__14) {
				{
				{
				setState(302);
				match(T__14);
				setState(303);
				expr(0);
				}
				}
				setState(308);
				_errHandler.sync(this);
				_la = _input.LA(1);
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

	public static class MethodContext extends ParserRuleContext {
		public VariableContext variable() {
			return getRuleContext(VariableContext.class,0);
		}
		public List<MethodListContext> methodList() {
			return getRuleContexts(MethodListContext.class);
		}
		public MethodListContext methodList(int i) {
			return getRuleContext(MethodListContext.class,i);
		}
		public MethodContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_method; }
	}

	public final MethodContext method() throws RecognitionException {
		MethodContext _localctx = new MethodContext(_ctx, getState());
		enterRule(_localctx, 52, RULE_method);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(309);
			variable();
			setState(310);
			match(T__0);
			setState(314);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while ((((_la) & ~0x3f) == 0 && ((1L << _la) & ((1L << T__2) | (1L << T__12) | (1L << STRING) | (1L << ID) | (1L << BOOLEAN) | (1L << NUMBER))) != 0)) {
				{
				{
				setState(311);
				methodList();
				}
				}
				setState(316);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			setState(317);
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

	public static class MethodListContext extends ParserRuleContext {
		public List<ExprContext> expr() {
			return getRuleContexts(ExprContext.class);
		}
		public ExprContext expr(int i) {
			return getRuleContext(ExprContext.class,i);
		}
		public MethodListContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_methodList; }
	}

	public final MethodListContext methodList() throws RecognitionException {
		MethodListContext _localctx = new MethodListContext(_ctx, getState());
		enterRule(_localctx, 54, RULE_methodList);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(319);
			expr(0);
			setState(324);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==T__3) {
				{
				{
				setState(320);
				match(T__3);
				setState(321);
				expr(0);
				}
				}
				setState(326);
				_errHandler.sync(this);
				_la = _input.LA(1);
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

	public static class StringMethodContext extends ParserRuleContext {
		public TerminalNode STRING() { return getToken(RASPParser.STRING, 0); }
		public MethodContext method() {
			return getRuleContext(MethodContext.class,0);
		}
		public StringMethodContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_stringMethod; }
	}

	public final StringMethodContext stringMethod() throws RecognitionException {
		StringMethodContext _localctx = new StringMethodContext(_ctx, getState());
		enterRule(_localctx, 56, RULE_stringMethod);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(327);
			match(STRING);
			setState(328);
			match(T__11);
			setState(329);
			method();
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
		public TerminalNode ID() { return getToken(RASPParser.ID, 0); }
		public EnvvarContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_envvar; }
	}

	public final EnvvarContext envvar() throws RecognitionException {
		EnvvarContext _localctx = new EnvvarContext(_ctx, getState());
		enterRule(_localctx, 58, RULE_envvar);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(331);
			match(T__15);
			setState(332);
			match(ID);
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

	public boolean sempred(RuleContext _localctx, int ruleIndex, int predIndex) {
		switch (ruleIndex) {
		case 20:
			return expr_sempred((ExprContext)_localctx, predIndex);
		}
		return true;
	}
	private boolean expr_sempred(ExprContext _localctx, int predIndex) {
		switch (predIndex) {
		case 0:
			return precpred(_ctx, 16);
		case 1:
			return precpred(_ctx, 15);
		case 2:
			return precpred(_ctx, 14);
		case 3:
			return precpred(_ctx, 13);
		case 4:
			return precpred(_ctx, 12);
		case 5:
			return precpred(_ctx, 11);
		case 6:
			return precpred(_ctx, 10);
		case 7:
			return precpred(_ctx, 9);
		}
		return true;
	}

	public static final String _serializedATN =
		"\3\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786\u5964\3\64\u0151\4\2\t\2"+
		"\4\3\t\3\4\4\t\4\4\5\t\5\4\6\t\6\4\7\t\7\4\b\t\b\4\t\t\t\4\n\t\n\4\13"+
		"\t\13\4\f\t\f\4\r\t\r\4\16\t\16\4\17\t\17\4\20\t\20\4\21\t\21\4\22\t\22"+
		"\4\23\t\23\4\24\t\24\4\25\t\25\4\26\t\26\4\27\t\27\4\30\t\30\4\31\t\31"+
		"\4\32\t\32\4\33\t\33\4\34\t\34\4\35\t\35\4\36\t\36\4\37\t\37\3\2\3\2\5"+
		"\2A\n\2\3\3\3\3\3\3\3\3\3\3\7\3H\n\3\f\3\16\3K\13\3\3\4\3\4\3\4\3\4\3"+
		"\4\3\4\3\4\5\4T\n\4\3\5\5\5W\n\5\3\5\3\5\3\5\3\5\3\5\3\5\5\5_\n\5\3\6"+
		"\5\6b\n\6\3\6\3\6\3\6\3\6\3\6\3\6\5\6j\n\6\3\7\3\7\3\7\3\7\3\7\3\7\3\7"+
		"\3\7\3\b\3\b\3\b\3\b\7\bx\n\b\f\b\16\b{\13\b\3\b\3\b\3\t\3\t\3\t\3\t\3"+
		"\n\3\n\3\n\3\n\3\13\3\13\3\13\3\13\3\13\3\13\7\13\u008d\n\13\f\13\16\13"+
		"\u0090\13\13\5\13\u0092\n\13\3\13\7\13\u0095\n\13\f\13\16\13\u0098\13"+
		"\13\3\f\3\f\3\f\3\f\3\f\3\r\3\r\3\r\7\r\u00a2\n\r\f\r\16\r\u00a5\13\r"+
		"\3\16\3\16\3\16\3\16\3\16\3\16\3\16\3\16\5\16\u00af\n\16\3\17\3\17\3\17"+
		"\3\17\3\17\3\20\3\20\3\20\3\20\3\20\3\20\7\20\u00bc\n\20\f\20\16\20\u00bf"+
		"\13\20\3\20\3\20\5\20\u00c3\n\20\3\21\3\21\3\21\3\21\3\22\3\22\3\22\3"+
		"\22\3\22\3\22\3\23\3\23\3\23\3\24\3\24\3\25\5\25\u00d5\n\25\3\25\3\25"+
		"\7\25\u00d9\n\25\f\25\16\25\u00dc\13\25\3\25\3\25\3\26\3\26\3\26\3\26"+
		"\3\26\3\26\3\26\3\26\3\26\5\26\u00e9\n\26\3\26\3\26\3\26\3\26\3\26\3\26"+
		"\3\26\3\26\3\26\3\26\3\26\3\26\3\26\3\26\3\26\3\26\3\26\3\26\3\26\3\26"+
		"\3\26\3\26\3\26\3\26\3\26\3\26\3\26\3\26\3\26\7\26\u0108\n\26\f\26\16"+
		"\26\u010b\13\26\3\27\3\27\3\30\3\30\3\30\7\30\u0112\n\30\f\30\16\30\u0115"+
		"\13\30\3\31\3\31\3\31\3\31\7\31\u011b\n\31\f\31\16\31\u011e\13\31\3\31"+
		"\3\31\3\32\5\32\u0123\n\32\3\32\3\32\3\32\3\32\7\32\u0129\n\32\f\32\16"+
		"\32\u012c\13\32\3\32\3\32\3\33\3\33\3\33\7\33\u0133\n\33\f\33\16\33\u0136"+
		"\13\33\3\34\3\34\3\34\7\34\u013b\n\34\f\34\16\34\u013e\13\34\3\34\3\34"+
		"\3\35\3\35\3\35\7\35\u0145\n\35\f\35\16\35\u0148\13\35\3\36\3\36\3\36"+
		"\3\36\3\37\3\37\3\37\3\37\2\3* \2\4\6\b\n\f\16\20\22\24\26\30\32\34\36"+
		" \"$&(*,.\60\62\64\668:<\2\2\2\u0166\2@\3\2\2\2\4B\3\2\2\2\6S\3\2\2\2"+
		"\bV\3\2\2\2\na\3\2\2\2\fk\3\2\2\2\16s\3\2\2\2\20~\3\2\2\2\22\u0082\3\2"+
		"\2\2\24\u0086\3\2\2\2\26\u0099\3\2\2\2\30\u009e\3\2\2\2\32\u00ae\3\2\2"+
		"\2\34\u00b0\3\2\2\2\36\u00b5\3\2\2\2 \u00c4\3\2\2\2\"\u00c8\3\2\2\2$\u00ce"+
		"\3\2\2\2&\u00d1\3\2\2\2(\u00d4\3\2\2\2*\u00e8\3\2\2\2,\u010c\3\2\2\2."+
		"\u010e\3\2\2\2\60\u0116\3\2\2\2\62\u0122\3\2\2\2\64\u012f\3\2\2\2\66\u0137"+
		"\3\2\2\28\u0141\3\2\2\2:\u0149\3\2\2\2<\u014d\3\2\2\2>A\5\4\3\2?A\7\2"+
		"\2\3@>\3\2\2\2@?\3\2\2\2A\3\3\2\2\2BC\7\23\2\2CD\7\3\2\2DE\7,\2\2EI\7"+
		"\4\2\2FH\5\6\4\2GF\3\2\2\2HK\3\2\2\2IG\3\2\2\2IJ\3\2\2\2J\5\3\2\2\2KI"+
		"\3\2\2\2LT\5\b\5\2MT\5\n\6\2NT\5\f\7\2OT\5\24\13\2PT\5\30\r\2QT\5\66\34"+
		"\2RT\5\34\17\2SL\3\2\2\2SM\3\2\2\2SN\3\2\2\2SO\3\2\2\2SP\3\2\2\2SQ\3\2"+
		"\2\2SR\3\2\2\2T\7\3\2\2\2UW\5\20\t\2VU\3\2\2\2VW\3\2\2\2WX\3\2\2\2XY\7"+
		"\24\2\2YZ\7\26\2\2Z[\7\30\2\2[^\5,\27\2\\_\5\60\31\2]_\5.\30\2^\\\3\2"+
		"\2\2^]\3\2\2\2^_\3\2\2\2_\t\3\2\2\2`b\5\20\t\2a`\3\2\2\2ab\3\2\2\2bc\3"+
		"\2\2\2cd\7\31\2\2de\7\32\2\2ef\7\33\2\2fi\5,\27\2gj\5\60\31\2hj\5.\30"+
		"\2ig\3\2\2\2ih\3\2\2\2ij\3\2\2\2j\13\3\2\2\2kl\7\31\2\2lm\5\16\b\2mn\7"+
		"\25\2\2no\7\30\2\2op\5,\27\2pq\7\33\2\2qr\7,\2\2r\r\3\2\2\2st\7\5\2\2"+
		"ty\7,\2\2uv\7\6\2\2vx\7,\2\2wu\3\2\2\2x{\3\2\2\2yw\3\2\2\2yz\3\2\2\2z"+
		"|\3\2\2\2{y\3\2\2\2|}\7\7\2\2}\17\3\2\2\2~\177\7\34\2\2\177\u0080\7,\2"+
		"\2\u0080\u0081\7\35\2\2\u0081\21\3\2\2\2\u0082\u0083\7\34\2\2\u0083\u0084"+
		"\7,\2\2\u0084\u0085\7\30\2\2\u0085\23\3\2\2\2\u0086\u0087\7(\2\2\u0087"+
		"\u0091\7,\2\2\u0088\u0089\7\27\2\2\u0089\u008e\5\26\f\2\u008a\u008b\7"+
		"\6\2\2\u008b\u008d\5\26\f\2\u008c\u008a\3\2\2\2\u008d\u0090\3\2\2\2\u008e"+
		"\u008c\3\2\2\2\u008e\u008f\3\2\2\2\u008f\u0092\3\2\2\2\u0090\u008e\3\2"+
		"\2\2\u0091\u0088\3\2\2\2\u0091\u0092\3\2\2\2\u0092\u0096\3\2\2\2\u0093"+
		"\u0095\5\32\16\2\u0094\u0093\3\2\2\2\u0095\u0098\3\2\2\2\u0096\u0094\3"+
		"\2\2\2\u0096\u0097\3\2\2\2\u0097\25\3\2\2\2\u0098\u0096\3\2\2\2\u0099"+
		"\u009a\5\16\b\2\u009a\u009b\7\25\2\2\u009b\u009c\7\30\2\2\u009c\u009d"+
		"\5,\27\2\u009d\27\3\2\2\2\u009e\u009f\7)\2\2\u009f\u00a3\7,\2\2\u00a0"+
		"\u00a2\5\32\16\2\u00a1\u00a0\3\2\2\2\u00a2\u00a5\3\2\2\2\u00a3\u00a1\3"+
		"\2\2\2\u00a3\u00a4\3\2\2\2\u00a4\31\3\2\2\2\u00a5\u00a3\3\2\2\2\u00a6"+
		"\u00af\5\66\34\2\u00a7\u00af\5\34\17\2\u00a8\u00af\5\36\20\2\u00a9\u00af"+
		"\5 \21\2\u00aa\u00af\5\"\22\2\u00ab\u00af\5$\23\2\u00ac\u00af\5(\25\2"+
		"\u00ad\u00af\5&\24\2\u00ae\u00a6\3\2\2\2\u00ae\u00a7\3\2\2\2\u00ae\u00a8"+
		"\3\2\2\2\u00ae\u00a9\3\2\2\2\u00ae\u00aa\3\2\2\2\u00ae\u00ab\3\2\2\2\u00ae"+
		"\u00ac\3\2\2\2\u00ae\u00ad\3\2\2\2\u00af\33\3\2\2\2\u00b0\u00b1\7\34\2"+
		"\2\u00b1\u00b2\5.\30\2\u00b2\u00b3\7\35\2\2\u00b3\u00b4\5*\26\2\u00b4"+
		"\35\3\2\2\2\u00b5\u00b6\7\b\2\2\u00b6\u00b7\5*\26\2\u00b7\u00bd\5\32\16"+
		"\2\u00b8\u00b9\7\t\2\2\u00b9\u00ba\7\b\2\2\u00ba\u00bc\5\32\16\2\u00bb"+
		"\u00b8\3\2\2\2\u00bc\u00bf\3\2\2\2\u00bd\u00bb\3\2\2\2\u00bd\u00be\3\2"+
		"\2\2\u00be\u00c2\3\2\2\2\u00bf\u00bd\3\2\2\2\u00c0\u00c1\7\t\2\2\u00c1"+
		"\u00c3\5\32\16\2\u00c2\u00c0\3\2\2\2\u00c2\u00c3\3\2\2\2\u00c3\37\3\2"+
		"\2\2\u00c4\u00c5\7\n\2\2\u00c5\u00c6\5*\26\2\u00c6\u00c7\5\32\16\2\u00c7"+
		"!\3\2\2\2\u00c8\u00c9\7\13\2\2\u00c9\u00ca\7\30\2\2\u00ca\u00cb\5*\26"+
		"\2\u00cb\u00cc\7\33\2\2\u00cc\u00cd\5*\26\2\u00cd#\3\2\2\2\u00ce\u00cf"+
		"\7\f\2\2\u00cf\u00d0\5*\26\2\u00d0%\3\2\2\2\u00d1\u00d2\7\r\2\2\u00d2"+
		"\'\3\2\2\2\u00d3\u00d5\5\22\n\2\u00d4\u00d3\3\2\2\2\u00d4\u00d5\3\2\2"+
		"\2\u00d5\u00d6\3\2\2\2\u00d6\u00da\7\'\2\2\u00d7\u00d9\7,\2\2\u00d8\u00d7"+
		"\3\2\2\2\u00d9\u00dc\3\2\2\2\u00da\u00d8\3\2\2\2\u00da\u00db\3\2\2\2\u00db"+
		"\u00dd\3\2\2\2\u00dc\u00da\3\2\2\2\u00dd\u00de\5\60\31\2\u00de)\3\2\2"+
		"\2\u00df\u00e0\b\26\1\2\u00e0\u00e9\5\62\32\2\u00e1\u00e9\5\66\34\2\u00e2"+
		"\u00e9\5:\36\2\u00e3\u00e9\5.\30\2\u00e4\u00e9\5\60\31\2\u00e5\u00e9\7"+
		".\2\2\u00e6\u00e9\7*\2\2\u00e7\u00e9\7-\2\2\u00e8\u00df\3\2\2\2\u00e8"+
		"\u00e1\3\2\2\2\u00e8\u00e2\3\2\2\2\u00e8\u00e3\3\2\2\2\u00e8\u00e4\3\2"+
		"\2\2\u00e8\u00e5\3\2\2\2\u00e8\u00e6\3\2\2\2\u00e8\u00e7\3\2\2\2\u00e9"+
		"\u0109\3\2\2\2\u00ea\u00eb\f\22\2\2\u00eb\u00ec\7 \2\2\u00ec\u00ed\7\""+
		"\2\2\u00ed\u0108\5*\26\23\u00ee\u00ef\f\21\2\2\u00ef\u00f0\7!\2\2\u00f0"+
		"\u00f1\7\"\2\2\u00f1\u0108\5*\26\22\u00f2\u00f3\f\20\2\2\u00f3\u00f4\7"+
		"\36\2\2\u00f4\u00f5\7\33\2\2\u00f5\u0108\5*\26\21\u00f6\u00f7\f\17\2\2"+
		"\u00f7\u00f8\7\37\2\2\u00f8\u00f9\7\"\2\2\u00f9\u0108\5*\26\20\u00fa\u00fb"+
		"\f\16\2\2\u00fb\u00fc\7#\2\2\u00fc\u0108\5*\26\17\u00fd\u00fe\f\r\2\2"+
		"\u00fe\u00ff\7$\2\2\u00ff\u0108\5*\26\16\u0100\u0101\f\f\2\2\u0101\u0102"+
		"\7%\2\2\u0102\u0108\5*\26\r\u0103\u0104\f\13\2\2\u0104\u0105\7%\2\2\u0105"+
		"\u0106\7&\2\2\u0106\u0108\5*\26\f\u0107\u00ea\3\2\2\2\u0107\u00ee\3\2"+
		"\2\2\u0107\u00f2\3\2\2\2\u0107\u00f6\3\2\2\2\u0107\u00fa\3\2\2\2\u0107"+
		"\u00fd\3\2\2\2\u0107\u0100\3\2\2\2\u0107\u0103\3\2\2\2\u0108\u010b\3\2"+
		"\2\2\u0109\u0107\3\2\2\2\u0109\u010a\3\2\2\2\u010a+\3\2\2\2\u010b\u0109"+
		"\3\2\2\2\u010c\u010d\7,\2\2\u010d-\3\2\2\2\u010e\u0113\7,\2\2\u010f\u0110"+
		"\7\16\2\2\u0110\u0112\7,\2\2\u0111\u010f\3\2\2\2\u0112\u0115\3\2\2\2\u0113"+
		"\u0111\3\2\2\2\u0113\u0114\3\2\2\2\u0114/\3\2\2\2\u0115\u0113\3\2\2\2"+
		"\u0116\u0117\7\17\2\2\u0117\u011c\5\64\33\2\u0118\u0119\7\6\2\2\u0119"+
		"\u011b\5\64\33\2\u011a\u0118\3\2\2\2\u011b\u011e\3\2\2\2\u011c\u011a\3"+
		"\2\2\2\u011c\u011d\3\2\2\2\u011d\u011f\3\2\2\2\u011e\u011c\3\2\2\2\u011f"+
		"\u0120\7\20\2\2\u0120\61\3\2\2\2\u0121\u0123\7,\2\2\u0122\u0121\3\2\2"+
		"\2\u0122\u0123\3\2\2\2\u0123\u0124\3\2\2\2\u0124\u0125\7\5\2\2\u0125\u012a"+
		"\5*\26\2\u0126\u0127\7\6\2\2\u0127\u0129\5*\26\2\u0128\u0126\3\2\2\2\u0129"+
		"\u012c\3\2\2\2\u012a\u0128\3\2\2\2\u012a\u012b\3\2\2\2\u012b\u012d\3\2"+
		"\2\2\u012c\u012a\3\2\2\2\u012d\u012e\7\7\2\2\u012e\63\3\2\2\2\u012f\u0134"+
		"\7,\2\2\u0130\u0131\7\21\2\2\u0131\u0133\5*\26\2\u0132\u0130\3\2\2\2\u0133"+
		"\u0136\3\2\2\2\u0134\u0132\3\2\2\2\u0134\u0135\3\2\2\2\u0135\65\3\2\2"+
		"\2\u0136\u0134\3\2\2\2\u0137\u0138\5.\30\2\u0138\u013c\7\3\2\2\u0139\u013b"+
		"\58\35\2\u013a\u0139\3\2\2\2\u013b\u013e\3\2\2\2\u013c\u013a\3\2\2\2\u013c"+
		"\u013d\3\2\2\2\u013d\u013f\3\2\2\2\u013e\u013c\3\2\2\2\u013f\u0140\7\4"+
		"\2\2\u0140\67\3\2\2\2\u0141\u0146\5*\26\2\u0142\u0143\7\6\2\2\u0143\u0145"+
		"\5*\26\2\u0144\u0142\3\2\2\2\u0145\u0148\3\2\2\2\u0146\u0144\3\2\2\2\u0146"+
		"\u0147\3\2\2\2\u01479\3\2\2\2\u0148\u0146\3\2\2\2\u0149\u014a\7*\2\2\u014a"+
		"\u014b\7\16\2\2\u014b\u014c\5\66\34\2\u014c;\3\2\2\2\u014d\u014e\7\22"+
		"\2\2\u014e\u014f\7,\2\2\u014f=\3\2\2\2\35@ISV^aiy\u008e\u0091\u0096\u00a3"+
		"\u00ae\u00bd\u00c2\u00d4\u00da\u00e8\u0107\u0109\u0113\u011c\u0122\u012a"+
		"\u0134\u013c\u0146";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}