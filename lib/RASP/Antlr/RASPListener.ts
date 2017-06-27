// Generated from lib/RASP/Antlr/RASP.g4 by ANTLR 4.6-SNAPSHOT


import { ParseTreeListener } from 'antlr4ts/tree/ParseTreeListener';

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
	 * Enter a parse tree produced by `RASPParser.comment`.
	 * @param ctx the parse tree
	 */
	enterComment?: (ctx: CommentContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.comment`.
	 * @param ctx the parse tree
	 */
	exitComment?: (ctx: CommentContext) => void;

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
	 * Enter a parse tree produced by `RASPParser.addEmitter`.
	 * @param ctx the parse tree
	 */
	enterAddEmitter?: (ctx: AddEmitterContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.addEmitter`.
	 * @param ctx the parse tree
	 */
	exitAddEmitter?: (ctx: AddEmitterContext) => void;

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
	 * Enter a parse tree produced by `RASPParser.serviceConstructorPair`.
	 * @param ctx the parse tree
	 */
	enterServiceConstructorPair?: (ctx: ServiceConstructorPairContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.serviceConstructorPair`.
	 * @param ctx the parse tree
	 */
	exitServiceConstructorPair?: (ctx: ServiceConstructorPairContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.requestServiceEvents`.
	 * @param ctx the parse tree
	 */
	enterRequestServiceEvents?: (ctx: RequestServiceEventsContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.requestServiceEvents`.
	 * @param ctx the parse tree
	 */
	exitRequestServiceEvents?: (ctx: RequestServiceEventsContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.eventRegistration`.
	 * @param ctx the parse tree
	 */
	enterEventRegistration?: (ctx: EventRegistrationContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.eventRegistration`.
	 * @param ctx the parse tree
	 */
	exitEventRegistration?: (ctx: EventRegistrationContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.events`.
	 * @param ctx the parse tree
	 */
	enterEvents?: (ctx: EventsContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.events`.
	 * @param ctx the parse tree
	 */
	exitEvents?: (ctx: EventsContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.listenerMethodName`.
	 * @param ctx the parse tree
	 */
	enterListenerMethodName?: (ctx: ListenerMethodNameContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.listenerMethodName`.
	 * @param ctx the parse tree
	 */
	exitListenerMethodName?: (ctx: ListenerMethodNameContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.listenerMethod`.
	 * @param ctx the parse tree
	 */
	enterListenerMethod?: (ctx: ListenerMethodContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.listenerMethod`.
	 * @param ctx the parse tree
	 */
	exitListenerMethod?: (ctx: ListenerMethodContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.listenerBody`.
	 * @param ctx the parse tree
	 */
	enterListenerBody?: (ctx: ListenerBodyContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.listenerBody`.
	 * @param ctx the parse tree
	 */
	exitListenerBody?: (ctx: ListenerBodyContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.envvar`.
	 * @param ctx the parse tree
	 */
	enterEnvvar?: (ctx: EnvvarContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.envvar`.
	 * @param ctx the parse tree
	 */
	exitEnvvar?: (ctx: EnvvarContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.path`.
	 * @param ctx the parse tree
	 */
	enterPath?: (ctx: PathContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.path`.
	 * @param ctx the parse tree
	 */
	exitPath?: (ctx: PathContext) => void;
}

