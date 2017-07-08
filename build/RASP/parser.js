"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const antlr4ts_1 = require("antlr4ts");
const RASPLexer_1 = require("./Antlr/RASPLexer");
const RASPParser_1 = require("./Antlr/RASPParser");
const ParseTreeWalker_1 = require("antlr4ts/tree/ParseTreeWalker");
const fs = require("fs");
const definition = {};
class TreeShapeListener {
}
const fileData = fs.readFileSync('/Work/git/resin-procbots/fortunebot.rasp', { encoding: 'utf8' });
const inputStream = new antlr4ts_1.ANTLRInputStream(fileData);
let lexer = new RASPLexer_1.RASPLexer(inputStream);
let tokenStream = new antlr4ts_1.CommonTokenStream(lexer);
let parser = new RASPParser_1.RASPParser(tokenStream);
parser.buildParseTree = true;
parser.errorHandler = new antlr4ts_1.BailErrorStrategy();
let tree = parser.init();
const listener = new TreeShapeListener();
ParseTreeWalker_1.ParseTreeWalker.DEFAULT.walk(listener, tree);
console.log(definition);

//# sourceMappingURL=parser.js.map
