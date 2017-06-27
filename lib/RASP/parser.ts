import { ANTLRInputStream, CommonTokenStream, BailErrorStrategy } from 'antlr4ts';
import { RASPLexer } from './Antlr/RASPLexer';
import { RASPParser, RequestServiceEventsContext } from './Antlr/RASPParser';
import { RASPListener } from './Antlr/RASPListener';
import { ParseTreeWalker } from 'antlr4ts/tree/ParseTreeWalker';
//import { ParserRuleContext } from 'antlr4ts/ParserRuleContext';
//import { ParseTreeListener } from 'antlr4ts/tree/ParseTreeListener';
//import { RuleNode } from 'antlr4ts/tree/RuleNode';
import { BotDetails } from './parser-types';
import { ProcBotGenerator } from './framework/procbot';
import { ServiceGenerator } from './services/service';
import * as _ from 'lodash';
import * as fs from 'fs';

const definition: BotDetails = {};

class TreeShapeListener implements RASPListener {
    enterBotDefinition = _.partial(ProcBotGenerator.enterBotDefinition, _, definition);
    exitBotDefinition = _.partial(ProcBotGenerator.exitBotDefinition, _, definition);
    
    enterAddListener = _.partial(ServiceGenerator.enterAddService, _, definition);
    exitAddListener = _.partial(ServiceGenerator.exitAddService, _, definition);
    enterAddEmitter = _.partial(ServiceGenerator.enterAddService, _, definition);
    exitAddEmitter = _.partial(ServiceGenerator.exitAddService, _, definition);
    enterServiceName = _.partial(ServiceGenerator.enterServiceName, _, definition);

    enterServiceConstructor = _.partial(ServiceGenerator.enterServiceConstructor, _, definition);
    enterServiceConstructorPair = _.partial(ServiceGenerator.enterServiceConstructorPair, _, definition);

    enterRequestEvents(ctx: RequestServiceEventsContext) {
        console.log('enter request');
    }
}

// Create the lexer and parser
const fileData = fs.readFileSync('/Work/git/resin-procbots/fortunebot.rasp', { encoding: 'utf8' });
const inputStream = new ANTLRInputStream(fileData);

let lexer = new RASPLexer(inputStream);
let tokenStream = new CommonTokenStream(lexer);
let parser = new RASPParser(tokenStream);
parser.buildParseTree = true;
parser.errorHandler = new BailErrorStrategy();

// Parse the input, where `compilationUnit` is whatever entry point you defined
let tree = parser.init();
const listener = new TreeShapeListener();
ParseTreeWalker.DEFAULT.walk(listener, tree);
console.log(definition);
