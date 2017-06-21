// Generated from lib/RASP/Antlr/RASP.g4 by ANTLR 4.6-SNAPSHOT


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


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `RASPParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export interface RASPVisitor<Result> extends ParseTreeVisitor<Result> {
	/**
	 * Visit a parse tree produced by `RASPParser.init`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitInit?: (ctx: InitContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.botDefinition`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitBotDefinition?: (ctx: BotDefinitionContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.botBody`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitBotBody?: (ctx: BotBodyContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.botName`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitBotName?: (ctx: BotNameContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.addListener`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAddListener?: (ctx: AddListenerContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.serviceName`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitServiceName?: (ctx: ServiceNameContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.serviceConstructor`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitServiceConstructor?: (ctx: ServiceConstructorContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.githubConstructor`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitGithubConstructor?: (ctx: GithubConstructorContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.githubConstructorType`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitGithubConstructorType?: (ctx: GithubConstructorTypeContext) => Result;
}

