import { ANTLRInputStream, CommonTokenStream, BailErrorStrategy } from 'antlr4ts';
import * as Promise from 'bluebird';
import { RASPLexer } from './Antlr/RASPLexer';
import { RASPParser, RequestServiceEventsContext } from './Antlr/RASPParser';
import { RASPListener } from './Antlr/RASPListener';
import { ParseTreeWalker } from 'antlr4ts/tree/ParseTreeWalker';
//import { ParserRuleContext } from 'antlr4ts/ParserRuleContext';
//import { ParseTreeListener } from 'antlr4ts/tree/ParseTreeListener';
//import { RuleNode } from 'antlr4ts/tree/RuleNode';
import { FindAllFiles } from './helpers';
import { BotDetails } from './parser-types';
import { ProcBotGenerator } from './framework/procbot';
import { ServiceGenerator } from './services/service';
import * as _ from 'lodash';
import * as fs from 'fs';

const definition: BotDetails = {};

// This is a bit.. well. We implement a RASPListener which knows nothing
// about any of the grammar it needs to listen to.
// We then dynamically trawl through all of the subdirectories that make up
// our grammar types, and call 'addListenerMethods' on each of those modules.
// This will add all of the required methods to the listener, which is then
// instanced and starts a parse.
// It's got several downsides, but a wonderful upside is we can just add new
// listener modules/methods and not have to update this file.
export class ExtRASPListener implements RASPListener {
    // Yes, yes. I should be shot.
    [method: string]: object;
}

// Create the lexer and parser
const fileData = fs.readFileSync('/Work/git/resin-procbots/fortuneNoComments.rasp', { encoding: 'utf8' });
const inputStream = new ANTLRInputStream(fileData);

let lexer = new RASPLexer(inputStream);
let tokenStream = new CommonTokenStream(lexer);
let parser = new RASPParser(tokenStream);
parser.buildParseTree = true;
parser.errorHandler = new BailErrorStrategy();

// Parse the input, where `compilationUnit` is whatever entry point you defined
let tree = parser.init();
const listener = new ExtRASPListener();

// Add all of the required methods dynamically.
FindAllFiles(__dirname, 1, '.js', [ 'Antlr' ]).then((files) => {
    // Require them, and if they have an addListenerMethods method, call it
    // on the parser.
    return Promise.map(files, (file: string) => {
        let parserExtension = require(file);
        if (parserExtension.addListenerMethods) {
            parserExtension.addListenerMethods(listener, definition);
        }
    });
}).then(() => {
    // Let's go!
    ParseTreeWalker.DEFAULT.walk(listener, tree);
    console.log(definition);
});

