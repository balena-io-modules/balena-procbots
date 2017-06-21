"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const antlr4ts_1 = require("antlr4ts");
const RASPLexer_1 = require("./Antlr/RASPLexer");
const RASPParser_1 = require("./Antlr/RASPParser");
const ParseTreeWalker_1 = require("antlr4ts/tree/ParseTreeWalker");
const procbot_1 = require("../framework/procbot");
const _ = require("lodash");
const definition = {};
class TreeShapeListener {
    constructor() {
        this.enterBotDefinition = _.partial(procbot_1.ProcBot.enterBotDefinition, _, definition);
        this.exitBotDefinition = _.partial(procbot_1.ProcBot.exitBotDefinition, _, definition);
    }
}
let inputStream = new antlr4ts_1.ANTLRInputStream(`
bot(Hello) { AddListener(github, { appId: hello, appId: goodbye}); }
`);
let lexer = new RASPLexer_1.RASPLexer(inputStream);
let tokenStream = new antlr4ts_1.CommonTokenStream(lexer);
let parser = new RASPParser_1.RASPParser(tokenStream);
parser.buildParseTree = true;
let tree = parser.init();
console.log(tree.toStringTree());
const listener = new TreeShapeListener();
ParseTreeWalker_1.ParseTreeWalker.DEFAULT.walk(listener, tree);
console.log(definition);

//# sourceMappingURL=generator.js.map
