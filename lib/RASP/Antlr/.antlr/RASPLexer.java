// Generated from /Work/git/resin-procbots/lib/RASP/Antlr/RASP.g4 by ANTLR 4.7
import org.antlr.v4.runtime.Lexer;
import org.antlr.v4.runtime.CharStream;
import org.antlr.v4.runtime.Token;
import org.antlr.v4.runtime.TokenStream;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.atn.*;
import org.antlr.v4.runtime.dfa.DFA;
import org.antlr.v4.runtime.misc.*;

@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast"})
public class RASPLexer extends Lexer {
	static { RuntimeMetaData.checkVersion("4.7", RuntimeMetaData.VERSION); }

	protected static final DFA[] _decisionToDFA;
	protected static final PredictionContextCache _sharedContextCache =
		new PredictionContextCache();
	public static final int
		T__0=1, T__1=2, T__2=3, T__3=4, T__4=5, T__5=6, T__6=7, T__7=8, T__8=9, 
		T__9=10, T__10=11, T__11=12, T__12=13, T__13=14, T__14=15, T__15=16, T__16=17, 
		INT=18, ALPHA=19, HEX=20, ALPHANUMERIC=21, COMMENT=22, LINE_COMMENT=23, 
		WS=24;
	public static String[] channelNames = {
		"DEFAULT_TOKEN_CHANNEL", "HIDDEN"
	};

	public static String[] modeNames = {
		"DEFAULT_MODE"
	};

	public static final String[] ruleNames = {
		"T__0", "T__1", "T__2", "T__3", "T__4", "T__5", "T__6", "T__7", "T__8", 
		"T__9", "T__10", "T__11", "T__12", "T__13", "T__14", "T__15", "T__16", 
		"INT", "ALPHA", "HEX", "ALPHANUMERIC", "COMMENT", "LINE_COMMENT", "WS"
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


	public RASPLexer(CharStream input) {
		super(input);
		_interp = new LexerATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);
	}

	@Override
	public String getGrammarFileName() { return "RASP.g4"; }

	@Override
	public String[] getRuleNames() { return ruleNames; }

	@Override
	public String getSerializedATN() { return _serializedATN; }

	@Override
	public String[] getChannelNames() { return channelNames; }

	@Override
	public String[] getModeNames() { return modeNames; }

	@Override
	public ATN getATN() { return _ATN; }

	public static final String _serializedATN =
		"\3\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786\u5964\2\32\u00c3\b\1\4\2"+
		"\t\2\4\3\t\3\4\4\t\4\4\5\t\5\4\6\t\6\4\7\t\7\4\b\t\b\4\t\t\t\4\n\t\n\4"+
		"\13\t\13\4\f\t\f\4\r\t\r\4\16\t\16\4\17\t\17\4\20\t\20\4\21\t\21\4\22"+
		"\t\22\4\23\t\23\4\24\t\24\4\25\t\25\4\26\t\26\4\27\t\27\4\30\t\30\4\31"+
		"\t\31\3\2\3\2\3\2\3\2\3\2\3\3\3\3\3\4\3\4\3\5\3\5\3\6\3\6\3\7\3\7\3\7"+
		"\3\7\3\7\3\7\3\7\3\7\3\7\3\7\3\7\3\7\3\7\3\b\3\b\3\t\3\t\3\t\3\t\3\t\3"+
		"\t\3\t\3\t\3\t\3\t\3\t\3\t\3\n\3\n\3\n\3\n\3\n\3\n\3\n\3\13\3\13\3\13"+
		"\3\13\3\13\3\13\3\13\3\13\3\13\3\f\3\f\3\r\3\r\3\r\3\r\3\r\3\r\3\r\3\r"+
		"\3\r\3\r\3\r\3\r\3\r\3\r\3\r\3\16\3\16\3\17\3\17\3\20\3\20\3\20\3\20\3"+
		"\20\3\20\3\21\3\21\3\22\3\22\3\23\6\23\u008c\n\23\r\23\16\23\u008d\3\24"+
		"\6\24\u0091\n\24\r\24\16\24\u0092\3\25\6\25\u0096\n\25\r\25\16\25\u0097"+
		"\3\26\6\26\u009b\n\26\r\26\16\26\u009c\3\27\3\27\3\27\3\27\7\27\u00a3"+
		"\n\27\f\27\16\27\u00a6\13\27\3\27\3\27\3\27\3\27\3\27\3\30\3\30\3\30\3"+
		"\30\7\30\u00b1\n\30\f\30\16\30\u00b4\13\30\3\30\5\30\u00b7\n\30\3\30\3"+
		"\30\3\30\3\30\3\31\6\31\u00be\n\31\r\31\16\31\u00bf\3\31\3\31\4\u00a4"+
		"\u00b2\2\32\3\3\5\4\7\5\t\6\13\7\r\b\17\t\21\n\23\13\25\f\27\r\31\16\33"+
		"\17\35\20\37\21!\22#\23%\24\'\25)\26+\27-\30/\31\61\32\3\2\7\3\2\62;\4"+
		"\2C\\c|\5\2\62;CHch\b\2//\62;C\\aac|~~\5\2\13\f\17\17\"\"\2\u00ca\2\3"+
		"\3\2\2\2\2\5\3\2\2\2\2\7\3\2\2\2\2\t\3\2\2\2\2\13\3\2\2\2\2\r\3\2\2\2"+
		"\2\17\3\2\2\2\2\21\3\2\2\2\2\23\3\2\2\2\2\25\3\2\2\2\2\27\3\2\2\2\2\31"+
		"\3\2\2\2\2\33\3\2\2\2\2\35\3\2\2\2\2\37\3\2\2\2\2!\3\2\2\2\2#\3\2\2\2"+
		"\2%\3\2\2\2\2\'\3\2\2\2\2)\3\2\2\2\2+\3\2\2\2\2-\3\2\2\2\2/\3\2\2\2\2"+
		"\61\3\2\2\2\3\63\3\2\2\2\58\3\2\2\2\7:\3\2\2\2\t<\3\2\2\2\13>\3\2\2\2"+
		"\r@\3\2\2\2\17M\3\2\2\2\21O\3\2\2\2\23[\3\2\2\2\25b\3\2\2\2\27k\3\2\2"+
		"\2\31m\3\2\2\2\33|\3\2\2\2\35~\3\2\2\2\37\u0080\3\2\2\2!\u0086\3\2\2\2"+
		"#\u0088\3\2\2\2%\u008b\3\2\2\2\'\u0090\3\2\2\2)\u0095\3\2\2\2+\u009a\3"+
		"\2\2\2-\u009e\3\2\2\2/\u00ac\3\2\2\2\61\u00bd\3\2\2\2\63\64\7d\2\2\64"+
		"\65\7q\2\2\65\66\7v\2\2\66\67\7*\2\2\67\4\3\2\2\289\7+\2\29\6\3\2\2\2"+
		":;\7}\2\2;\b\3\2\2\2<=\7\177\2\2=\n\3\2\2\2>?\7?\2\2?\f\3\2\2\2@A\7C\2"+
		"\2AB\7f\2\2BC\7f\2\2CD\7N\2\2DE\7k\2\2EF\7u\2\2FG\7v\2\2GH\7g\2\2HI\7"+
		"p\2\2IJ\7g\2\2JK\7t\2\2KL\7*\2\2L\16\3\2\2\2MN\7.\2\2N\20\3\2\2\2OP\7"+
		"C\2\2PQ\7f\2\2QR\7f\2\2RS\7G\2\2ST\7o\2\2TU\7k\2\2UV\7v\2\2VW\7v\2\2W"+
		"X\7g\2\2XY\7t\2\2YZ\7*\2\2Z\22\3\2\2\2[\\\7i\2\2\\]\7k\2\2]^\7v\2\2^_"+
		"\7j\2\2_`\7w\2\2`a\7d\2\2a\24\3\2\2\2bc\7h\2\2cd\7n\2\2de\7q\2\2ef\7y"+
		"\2\2fg\7f\2\2gh\7q\2\2hi\7e\2\2ij\7m\2\2j\26\3\2\2\2kl\7<\2\2l\30\3\2"+
		"\2\2mn\7T\2\2no\7g\2\2op\7s\2\2pq\7w\2\2qr\7g\2\2rs\7u\2\2st\7v\2\2tu"+
		"\7G\2\2uv\7x\2\2vw\7g\2\2wx\7p\2\2xy\7v\2\2yz\7u\2\2z{\7*\2\2{\32\3\2"+
		"\2\2|}\7]\2\2}\34\3\2\2\2~\177\7_\2\2\177\36\3\2\2\2\u0080\u0081\7g\2"+
		"\2\u0081\u0082\7p\2\2\u0082\u0083\7x\2\2\u0083\u0084\7c\2\2\u0084\u0085"+
		"\7t\2\2\u0085 \3\2\2\2\u0086\u0087\7*\2\2\u0087\"\3\2\2\2\u0088\u0089"+
		"\7\61\2\2\u0089$\3\2\2\2\u008a\u008c\t\2\2\2\u008b\u008a\3\2\2\2\u008c"+
		"\u008d\3\2\2\2\u008d\u008b\3\2\2\2\u008d\u008e\3\2\2\2\u008e&\3\2\2\2"+
		"\u008f\u0091\t\3\2\2\u0090\u008f\3\2\2\2\u0091\u0092\3\2\2\2\u0092\u0090"+
		"\3\2\2\2\u0092\u0093\3\2\2\2\u0093(\3\2\2\2\u0094\u0096\t\4\2\2\u0095"+
		"\u0094\3\2\2\2\u0096\u0097\3\2\2\2\u0097\u0095\3\2\2\2\u0097\u0098\3\2"+
		"\2\2\u0098*\3\2\2\2\u0099\u009b\t\5\2\2\u009a\u0099\3\2\2\2\u009b\u009c"+
		"\3\2\2\2\u009c\u009a\3\2\2\2\u009c\u009d\3\2\2\2\u009d,\3\2\2\2\u009e"+
		"\u009f\7\61\2\2\u009f\u00a0\7,\2\2\u00a0\u00a4\3\2\2\2\u00a1\u00a3\13"+
		"\2\2\2\u00a2\u00a1\3\2\2\2\u00a3\u00a6\3\2\2\2\u00a4\u00a5\3\2\2\2\u00a4"+
		"\u00a2\3\2\2\2\u00a5\u00a7\3\2\2\2\u00a6\u00a4\3\2\2\2\u00a7\u00a8\7,"+
		"\2\2\u00a8\u00a9\7\61\2\2\u00a9\u00aa\3\2\2\2\u00aa\u00ab\b\27\2\2\u00ab"+
		".\3\2\2\2\u00ac\u00ad\7\61\2\2\u00ad\u00ae\7\61\2\2\u00ae\u00b2\3\2\2"+
		"\2\u00af\u00b1\13\2\2\2\u00b0\u00af\3\2\2\2\u00b1\u00b4\3\2\2\2\u00b2"+
		"\u00b3\3\2\2\2\u00b2\u00b0\3\2\2\2\u00b3\u00b6\3\2\2\2\u00b4\u00b2\3\2"+
		"\2\2\u00b5\u00b7\7\17\2\2\u00b6\u00b5\3\2\2\2\u00b6\u00b7\3\2\2\2\u00b7"+
		"\u00b8\3\2\2\2\u00b8\u00b9\7\f\2\2\u00b9\u00ba\3\2\2\2\u00ba\u00bb\b\30"+
		"\2\2\u00bb\60\3\2\2\2\u00bc\u00be\t\6\2\2\u00bd\u00bc\3\2\2\2\u00be\u00bf"+
		"\3\2\2\2\u00bf\u00bd\3\2\2\2\u00bf\u00c0\3\2\2\2\u00c0\u00c1\3\2\2\2\u00c1"+
		"\u00c2\b\31\2\2\u00c2\62\3\2\2\2\13\2\u008d\u0092\u0097\u009c\u00a4\u00b2"+
		"\u00b6\u00bf\3\b\2\2";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}