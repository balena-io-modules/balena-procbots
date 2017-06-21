import { ParseTreeVisitor } from 'antlr4ts/tree/ParseTreeVisitor';
import { InitContext } from './RASPParser';
import { BotDefinitionContext } from './RASPParser';
import { BotBodyContext } from './RASPParser';
import { BotNameContext } from './RASPParser';
import { AddListenerContext } from './RASPParser';
import { ServiceNameContext } from './RASPParser';
import { ServiceConstructorContext } from './RASPParser';
import { GithubConstructorContext } from './RASPParser';
import { GithubConstructorTypeContext } from './RASPParser';
export interface RASPVisitor<Result> extends ParseTreeVisitor<Result> {
    visitInit?: (ctx: InitContext) => Result;
    visitBotDefinition?: (ctx: BotDefinitionContext) => Result;
    visitBotBody?: (ctx: BotBodyContext) => Result;
    visitBotName?: (ctx: BotNameContext) => Result;
    visitAddListener?: (ctx: AddListenerContext) => Result;
    visitServiceName?: (ctx: ServiceNameContext) => Result;
    visitServiceConstructor?: (ctx: ServiceConstructorContext) => Result;
    visitGithubConstructor?: (ctx: GithubConstructorContext) => Result;
    visitGithubConstructorType?: (ctx: GithubConstructorTypeContext) => Result;
}
