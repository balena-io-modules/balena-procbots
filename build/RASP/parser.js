"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const antlr4ts_1 = require("antlr4ts");
const Promise = require("bluebird");
const RASPLexer_1 = require("./Antlr/RASPLexer");
const RASPParser_1 = require("./Antlr/RASPParser");
const ParseTreeWalker_1 = require("antlr4ts/tree/ParseTreeWalker");
const helpers_1 = require("./helpers");
const fs = require("fs");
const definition = {};
class ExtRASPListener {
}
exports.ExtRASPListener = ExtRASPListener;
const fileData = fs.readFileSync('/Work/git/resin-procbots/fortuneNoComments.rasp', { encoding: 'utf8' });
const inputStream = new antlr4ts_1.ANTLRInputStream(fileData);
let lexer = new RASPLexer_1.RASPLexer(inputStream);
let tokenStream = new antlr4ts_1.CommonTokenStream(lexer);
let parser = new RASPParser_1.RASPParser(tokenStream);
parser.buildParseTree = true;
parser.errorHandler = new antlr4ts_1.BailErrorStrategy();
let tree = parser.init();
const listener = new ExtRASPListener();
helpers_1.FindAllFiles(__dirname, 1, '.js', ['Antlr']).then((files) => {
    return Promise.map(files, (file) => {
        let parserExtension = require(file);
        if (parserExtension.addListenerMethods) {
            parserExtension.addListenerMethods(listener, definition);
        }
    });
}).then(() => {
    ParseTreeWalker_1.ParseTreeWalker.DEFAULT.walk(listener, tree);
    console.log(definition);
});

//# sourceMappingURL=parser.js.map
