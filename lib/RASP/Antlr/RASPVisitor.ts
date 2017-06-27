// Generated from lib/RASP/Antlr/RASP.g4 by ANTLR 4.6-SNAPSHOT


import { ParseTreeVisitor } from 'antlr4ts/tree/ParseTreeVisitor';

import { InitContext } from './RASPParser';
import { CommentContext } from './RASPParser';
import { BotDefinitionContext } from './RASPParser';
import { BotBodyContext } from './RASPParser';
import { AddListenerContext } from './RASPParser';
import { AddEmitterContext } from './RASPParser';
import { ServiceNameContext } from './RASPParser';
import { ServiceConstructorContext } from './RASPParser';
import { ServiceConstructorPairContext } from './RASPParser';
import { RequestServiceEventsContext } from './RASPParser';
import { EventRegistrationContext } from './RASPParser';
import { EventsContext } from './RASPParser';
import { ListenerMethodNameContext } from './RASPParser';
import { ListenerMethodContext } from './RASPParser';
import { ListenerBodyContext } from './RASPParser';
import { EnvvarContext } from './RASPParser';
import { PathContext } from './RASPParser';


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
	 * Visit a parse tree produced by `RASPParser.comment`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitComment?: (ctx: CommentContext) => Result;

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
	 * Visit a parse tree produced by `RASPParser.addListener`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAddListener?: (ctx: AddListenerContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.addEmitter`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAddEmitter?: (ctx: AddEmitterContext) => Result;

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
	 * Visit a parse tree produced by `RASPParser.serviceConstructorPair`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitServiceConstructorPair?: (ctx: ServiceConstructorPairContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.requestServiceEvents`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitRequestServiceEvents?: (ctx: RequestServiceEventsContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.eventRegistration`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitEventRegistration?: (ctx: EventRegistrationContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.events`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitEvents?: (ctx: EventsContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.listenerMethodName`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitListenerMethodName?: (ctx: ListenerMethodNameContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.listenerMethod`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitListenerMethod?: (ctx: ListenerMethodContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.listenerBody`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitListenerBody?: (ctx: ListenerBodyContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.envvar`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitEnvvar?: (ctx: EnvvarContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.path`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitPath?: (ctx: PathContext) => Result;
}

