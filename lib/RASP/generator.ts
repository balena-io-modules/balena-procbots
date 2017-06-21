import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { RASPLexer } from './Antlr/RASPLexer';
import { RASPParser, BotDefinitionContext } from './Antlr/RASPParser';
import { RASPListener } from './Antlr/RASPListener';
import { ParseTreeWalker } from 'antlr4ts/tree/ParseTreeWalker';
//import { ParserRuleContext } from 'antlr4ts/ParserRuleContext';
//import { ParseTreeListener } from 'antlr4ts/tree/ParseTreeListener';
//import { RuleNode } from 'antlr4ts/tree/RuleNode';
import { ProcBot } from '../framework/procbot';
import * as _ from 'lodash';

interface BotDefinition {
    botName: string;
}

const definition: BotDefinition = {};

class TreeShapeListener implements RASPListener {

    enterBotDefinition = _.partial(ProcBot.enterBotDefinition, _, definition);
    exitBotDefinition = _.partial(ProcBot.exitBotDefinition, _, definition);
}

// Create the lexer and parser
let inputStream = new ANTLRInputStream(`
bot(Hello) { AddListener(github, { appId: hello, appId: goodbye}); }
`);
let lexer = new RASPLexer(inputStream);
let tokenStream = new CommonTokenStream(lexer);
let parser = new RASPParser(tokenStream);
parser.buildParseTree = true;

// Parse the input, where `compilationUnit` is whatever entry point you defined
let tree = parser.init();
console.log(tree.toStringTree());
const listener = new TreeShapeListener();
ParseTreeWalker.DEFAULT.walk(listener, tree);
console.log(definition);
