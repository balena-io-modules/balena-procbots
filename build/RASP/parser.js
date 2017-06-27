"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const antlr4ts_1 = require("antlr4ts");
const RASPLexer_1 = require("./Antlr/RASPLexer");
const RASPParser_1 = require("./Antlr/RASPParser");
const ParseTreeWalker_1 = require("antlr4ts/tree/ParseTreeWalker");
const procbot_1 = require("./framework/procbot");
const service_1 = require("./services/service");
const _ = require("lodash");
const fs = require("fs");
const definition = {};
class TreeShapeListener {
    constructor() {
        this.enterBotDefinition = _.partial(procbot_1.ProcBotGenerator.enterBotDefinition, _, definition);
        this.exitBotDefinition = _.partial(procbot_1.ProcBotGenerator.exitBotDefinition, _, definition);
        this.enterAddListener = _.partial(service_1.ServiceGenerator.enterAddService, _, definition);
        this.exitAddListener = _.partial(service_1.ServiceGenerator.exitAddService, _, definition);
        this.enterAddEmitter = _.partial(service_1.ServiceGenerator.enterAddService, _, definition);
        this.exitAddEmitter = _.partial(service_1.ServiceGenerator.exitAddService, _, definition);
        this.enterServiceName = _.partial(service_1.ServiceGenerator.enterServiceName, _, definition);
        this.enterServiceConstructor = _.partial(service_1.ServiceGenerator.enterServiceConstructor, _, definition);
        this.enterServiceConstructorPair = _.partial(service_1.ServiceGenerator.enterServiceConstructorPair, _, definition);
    }
    enterRequestEvents(ctx) {
        console.log('enter request');
    }
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
