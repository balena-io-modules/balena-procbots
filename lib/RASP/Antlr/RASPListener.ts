// Generated from lib/RASP/Antlr/RASP.g4 by ANTLR 4.6-SNAPSHOT


import { ParseTreeListener } from 'antlr4ts/tree/ParseTreeListener';

import { InitContext } from './RASPParser';
import { BotDefinitionContext } from './RASPParser';
import { BotBodyContext } from './RASPParser';
import { AddListenerContext } from './RASPParser';
import { ServiceNameContext } from './RASPParser';
import { ServiceConstructorContext } from './RASPParser';
import { GithubConstructorContext } from './RASPParser';
import { GithubConstructorTypeContext } from './RASPParser';


/**
 * This interface defines a complete listener for a parse tree produced by
 * `RASPParser`.
 */
export interface RASPListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by `RASPParser.init`.
	 * @param ctx the parse tree
	 */
	enterInit?: (ctx: InitContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.init`.
	 * @param ctx the parse tree
	 */
	exitInit?: (ctx: InitContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.botDefinition`.
	 * @param ctx the parse tree
	 */
	enterBotDefinition?: (ctx: BotDefinitionContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.botDefinition`.
	 * @param ctx the parse tree
	 */
	exitBotDefinition?: (ctx: BotDefinitionContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.botBody`.
	 * @param ctx the parse tree
	 */
	enterBotBody?: (ctx: BotBodyContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.botBody`.
	 * @param ctx the parse tree
	 */
	exitBotBody?: (ctx: BotBodyContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.addListener`.
	 * @param ctx the parse tree
	 */
	enterAddListener?: (ctx: AddListenerContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.addListener`.
	 * @param ctx the parse tree
	 */
	exitAddListener?: (ctx: AddListenerContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.serviceName`.
	 * @param ctx the parse tree
	 */
	enterServiceName?: (ctx: ServiceNameContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.serviceName`.
	 * @param ctx the parse tree
	 */
	exitServiceName?: (ctx: ServiceNameContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.serviceConstructor`.
	 * @param ctx the parse tree
	 */
	enterServiceConstructor?: (ctx: ServiceConstructorContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.serviceConstructor`.
	 * @param ctx the parse tree
	 */
	exitServiceConstructor?: (ctx: ServiceConstructorContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.githubConstructor`.
	 * @param ctx the parse tree
	 */
	enterGithubConstructor?: (ctx: GithubConstructorContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.githubConstructor`.
	 * @param ctx the parse tree
	 */
	exitGithubConstructor?: (ctx: GithubConstructorContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.githubConstructorType`.
	 * @param ctx the parse tree
	 */
	enterGithubConstructorType?: (ctx: GithubConstructorTypeContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.githubConstructorType`.
	 * @param ctx the parse tree
	 */
	exitGithubConstructorType?: (ctx: GithubConstructorTypeContext) => void;
}

