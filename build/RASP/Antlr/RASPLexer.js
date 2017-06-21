"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ATNDeserializer_1 = require("antlr4ts/atn/ATNDeserializer");
const Lexer_1 = require("antlr4ts/Lexer");
const LexerATNSimulator_1 = require("antlr4ts/atn/LexerATNSimulator");
const Decorators_1 = require("antlr4ts/Decorators");
const Decorators_2 = require("antlr4ts/Decorators");
const VocabularyImpl_1 = require("antlr4ts/VocabularyImpl");
const Utils = require("antlr4ts/misc/Utils");
class RASPLexer extends Lexer_1.Lexer {
    constructor(input) {
        super(input);
        this._interp = new LexerATNSimulator_1.LexerATNSimulator(RASPLexer._ATN, this);
    }
    get vocabulary() {
        return RASPLexer.VOCABULARY;
    }
    get grammarFileName() { return "RASP.g4"; }
    get ruleNames() { return RASPLexer.ruleNames; }
    get serializedATN() { return RASPLexer._serializedATN; }
    get modeNames() { return RASPLexer.modeNames; }
    static get _ATN() {
        if (!RASPLexer.__ATN) {
            RASPLexer.__ATN = new ATNDeserializer_1.ATNDeserializer().deserialize(Utils.toCharArray(RASPLexer._serializedATN));
        }
        return RASPLexer.__ATN;
    }
}
RASPLexer.T__0 = 1;
RASPLexer.T__1 = 2;
RASPLexer.T__2 = 3;
RASPLexer.T__3 = 4;
RASPLexer.T__4 = 5;
RASPLexer.T__5 = 6;
RASPLexer.T__6 = 7;
RASPLexer.T__7 = 8;
RASPLexer.T__8 = 9;
RASPLexer.T__9 = 10;
RASPLexer.T__10 = 11;
RASPLexer.T__11 = 12;
RASPLexer.ALPHA = 13;
RASPLexer.INT = 14;
RASPLexer.WS = 15;
RASPLexer.modeNames = [
    "DEFAULT_MODE"
];
RASPLexer.ruleNames = [
    "T__0", "T__1", "T__2", "T__3", "T__4", "T__5", "T__6", "T__7", "T__8",
    "T__9", "T__10", "T__11", "ALPHA", "INT", "WS"
];
RASPLexer._LITERAL_NAMES = [
    undefined, "'bot('", "')'", "'{'", "'}'", "'AddListener('", "','", "')\n'",
    "'github'", "'appId'", "'secret'", "'pem'", "':'"
];
RASPLexer._SYMBOLIC_NAMES = [
    undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, "ALPHA",
    "INT", "WS"
];
RASPLexer.VOCABULARY = new VocabularyImpl_1.VocabularyImpl(RASPLexer._LITERAL_NAMES, RASPLexer._SYMBOLIC_NAMES, []);
RASPLexer._serializedATN = "\x03\uAF6F\u8320\u479D\uB75C\u4880\u1605\u191C\uAB37\x02\x11i\b\x01\x04" +
    "\x02\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04" +
    "\x07\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r" +
    "\x04\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x03\x02\x03\x02\x03\x02\x03" +
    "\x02\x03\x02\x03\x03\x03\x03\x03\x04\x03\x04\x03\x05\x03\x05\x03\x06\x03" +
    "\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03" +
    "\x06\x03\x06\x03\x06\x03\x07\x03\x07\x03\b\x03\b\x03\b\x03\t\x03\t\x03" +
    "\t\x03\t\x03\t\x03\t\x03\t\x03\n\x03\n\x03\n\x03\n\x03\n\x03\n\x03\v\x03" +
    "\v\x03\v\x03\v\x03\v\x03\v\x03\v\x03\f\x03\f\x03\f\x03\f\x03\r\x03\r\x03" +
    "\x0E\x06\x0EZ\n\x0E\r\x0E\x0E\x0E[\x03\x0F\x06\x0F_\n\x0F\r\x0F\x0E\x0F" +
    "`\x03\x10\x06\x10d\n\x10\r\x10\x0E\x10e\x03\x10\x03\x10\x02\x02\x02\x11" +
    "\x03\x02\x03\x05\x02\x04\x07\x02\x05\t\x02\x06\v\x02\x07\r\x02\b\x0F\x02" +
    "\t\x11\x02\n\x13\x02\v\x15\x02\f\x17\x02\r\x19\x02\x0E\x1B\x02\x0F\x1D" +
    "\x02\x10\x1F\x02\x11\x03\x02\x05\x04\x02C\\c|\x03\x022;\x05\x02\v\f\x0F" +
    "\x0F\"\"k\x02\x03\x03\x02\x02\x02\x02\x05\x03\x02\x02\x02\x02\x07\x03" +
    "\x02\x02\x02\x02\t\x03\x02\x02\x02\x02\v\x03\x02\x02\x02\x02\r\x03\x02" +
    "\x02\x02\x02\x0F\x03\x02\x02\x02\x02\x11\x03\x02\x02\x02\x02\x13\x03\x02" +
    "\x02\x02\x02\x15\x03\x02\x02\x02\x02\x17\x03\x02\x02\x02\x02\x19\x03\x02" +
    "\x02\x02\x02\x1B\x03\x02\x02\x02\x02\x1D\x03\x02\x02\x02\x02\x1F\x03\x02" +
    "\x02\x02\x03!\x03\x02\x02\x02\x05&\x03\x02\x02\x02\x07(\x03\x02\x02\x02" +
    "\t*\x03\x02\x02\x02\v,\x03\x02\x02\x02\r9\x03\x02\x02\x02\x0F;\x03\x02" +
    "\x02\x02\x11>\x03\x02\x02\x02\x13E\x03\x02\x02\x02\x15K\x03\x02\x02\x02" +
    "\x17R\x03\x02\x02\x02\x19V\x03\x02\x02\x02\x1BY\x03\x02\x02\x02\x1D^\x03" +
    "\x02\x02\x02\x1Fc\x03\x02\x02\x02!\"\x07d\x02\x02\"#\x07q\x02\x02#$\x07" +
    "v\x02\x02$%\x07*\x02\x02%\x04\x03\x02\x02\x02&\'\x07+\x02\x02\'\x06\x03" +
    "\x02\x02\x02()\x07}\x02\x02)\b\x03\x02\x02\x02*+\x07\x7F\x02\x02+\n\x03" +
    "\x02\x02\x02,-\x07C\x02\x02-.\x07f\x02\x02./\x07f\x02\x02/0\x07N\x02\x02" +
    "01\x07k\x02\x0212\x07u\x02\x0223\x07v\x02\x0234\x07g\x02\x0245\x07p\x02" +
    "\x0256\x07g\x02\x0267\x07t\x02\x0278\x07*\x02\x028\f\x03\x02\x02\x029" +
    ":\x07.\x02\x02:\x0E\x03\x02\x02\x02;<\x07+\x02\x02<=\x07\f\x02\x02=\x10" +
    "\x03\x02\x02\x02>?\x07i\x02\x02?@\x07k\x02\x02@A\x07v\x02\x02AB\x07j\x02" +
    "\x02BC\x07w\x02\x02CD\x07d\x02\x02D\x12\x03\x02\x02\x02EF\x07c\x02\x02" +
    "FG\x07r\x02\x02GH\x07r\x02\x02HI\x07K\x02\x02IJ\x07f\x02\x02J\x14\x03" +
    "\x02\x02\x02KL\x07u\x02\x02LM\x07g\x02\x02MN\x07e\x02\x02NO\x07t\x02\x02" +
    "OP\x07g\x02\x02PQ\x07v\x02\x02Q\x16\x03\x02\x02\x02RS\x07r\x02\x02ST\x07" +
    "g\x02\x02TU\x07o\x02\x02U\x18\x03\x02\x02\x02VW\x07<\x02\x02W\x1A\x03" +
    "\x02\x02\x02XZ\t\x02\x02\x02YX\x03\x02\x02\x02Z[\x03\x02\x02\x02[Y\x03" +
    "\x02\x02\x02[\\\x03\x02\x02\x02\\\x1C\x03\x02\x02\x02]_\t\x03\x02\x02" +
    "^]\x03\x02\x02\x02_`\x03\x02\x02\x02`^\x03\x02\x02\x02`a\x03\x02\x02\x02" +
    "a\x1E\x03\x02\x02\x02bd\t\x04\x02\x02cb\x03\x02\x02\x02de\x03\x02\x02" +
    "\x02ec\x03\x02\x02\x02ef\x03\x02\x02\x02fg\x03\x02\x02\x02gh\b\x10\x02" +
    "\x02h \x03\x02\x02\x02\x06\x02[`e\x03\b\x02\x02";
__decorate([
    Decorators_2.Override,
    Decorators_1.NotNull
], RASPLexer.prototype, "vocabulary", null);
__decorate([
    Decorators_2.Override
], RASPLexer.prototype, "grammarFileName", null);
__decorate([
    Decorators_2.Override
], RASPLexer.prototype, "ruleNames", null);
__decorate([
    Decorators_2.Override
], RASPLexer.prototype, "serializedATN", null);
__decorate([
    Decorators_2.Override
], RASPLexer.prototype, "modeNames", null);
exports.RASPLexer = RASPLexer;

//# sourceMappingURL=RASPLexer.js.map
