// Generated from lib/RASP/Antlr/RASP.g4 by ANTLR 4.6-SNAPSHOT


import { ParseTreeListener } from 'antlr4ts/tree/ParseTreeListener';

import { InitContext } from './RASPParser';
import { BotDefinitionContext } from './RASPParser';
import { BotBodyContext } from './RASPParser';
import { AddListenerContext } from './RASPParser';
import { AddEmitterContext } from './RASPParser';
import { RequestServiceEventsContext } from './RASPParser';
import { EventsContext } from './RASPParser';
import { SetIdAsContext } from './RASPParser';
import { SetIdFromContext } from './RASPParser';
import { ListenerMethodContext } from './RASPParser';
import { ListenerEventReceiverContext } from './RASPParser';
import { ListenerErrorContext } from './RASPParser';
import { StatementContext } from './RASPParser';
import { ExprContext } from './RASPParser';
import { ServiceNameContext } from './RASPParser';
import { VariableContext } from './RASPParser';
import { ObjectContext } from './RASPParser';
import { ArrayContext } from './RASPParser';
import { PropertyContext } from './RASPParser';
import { AssignmentContext } from './RASPParser';
import { R_ifContext } from './RASPParser';
import { R_whileContext } from './RASPParser';
import { LoopContext } from './RASPParser';
import { PrintContext } from './RASPParser';
import { EndContext } from './RASPParser';
import { SendQueryContext } from './RASPParser';
import { MethodContext } from './RASPParser';
import { MethodListContext } from './RASPParser';
import { StringMethodContext } from './RASPParser';
import { EnvvarContext } from './RASPParser';


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
	 * Enter a parse tree produced by `RASPParser.setIdAs`.
	 * @param ctx the parse tree
	 */
	enterSetIdAs?: (ctx: SetIdAsContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.setIdAs`.
	 * @param ctx the parse tree
	 */
	exitSetIdAs?: (ctx: SetIdAsContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.setIdFrom`.
	 * @param ctx the parse tree
	 */
	enterSetIdFrom?: (ctx: SetIdFromContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.setIdFrom`.
	 * @param ctx the parse tree
	 */
	exitSetIdFrom?: (ctx: SetIdFromContext) => void;

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
	 * Enter a parse tree produced by `RASPParser.listenerEventReceiver`.
	 * @param ctx the parse tree
	 */
	enterListenerEventReceiver?: (ctx: ListenerEventReceiverContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.listenerEventReceiver`.
	 * @param ctx the parse tree
	 */
	exitListenerEventReceiver?: (ctx: ListenerEventReceiverContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.listenerError`.
	 * @param ctx the parse tree
	 */
	enterListenerError?: (ctx: ListenerErrorContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.listenerError`.
	 * @param ctx the parse tree
	 */
	exitListenerError?: (ctx: ListenerErrorContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.statement`.
	 * @param ctx the parse tree
	 */
	enterStatement?: (ctx: StatementContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.statement`.
	 * @param ctx the parse tree
	 */
	exitStatement?: (ctx: StatementContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.expr`.
	 * @param ctx the parse tree
	 */
	enterExpr?: (ctx: ExprContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.expr`.
	 * @param ctx the parse tree
	 */
	exitExpr?: (ctx: ExprContext) => void;

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
	 * Enter a parse tree produced by `RASPParser.variable`.
	 * @param ctx the parse tree
	 */
	enterVariable?: (ctx: VariableContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.variable`.
	 * @param ctx the parse tree
	 */
	exitVariable?: (ctx: VariableContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.object`.
	 * @param ctx the parse tree
	 */
	enterObject?: (ctx: ObjectContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.object`.
	 * @param ctx the parse tree
	 */
	exitObject?: (ctx: ObjectContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.array`.
	 * @param ctx the parse tree
	 */
	enterArray?: (ctx: ArrayContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.array`.
	 * @param ctx the parse tree
	 */
	exitArray?: (ctx: ArrayContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.property`.
	 * @param ctx the parse tree
	 */
	enterProperty?: (ctx: PropertyContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.property`.
	 * @param ctx the parse tree
	 */
	exitProperty?: (ctx: PropertyContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.assignment`.
	 * @param ctx the parse tree
	 */
	enterAssignment?: (ctx: AssignmentContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.assignment`.
	 * @param ctx the parse tree
	 */
	exitAssignment?: (ctx: AssignmentContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.r_if`.
	 * @param ctx the parse tree
	 */
	enterR_if?: (ctx: R_ifContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.r_if`.
	 * @param ctx the parse tree
	 */
	exitR_if?: (ctx: R_ifContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.r_while`.
	 * @param ctx the parse tree
	 */
	enterR_while?: (ctx: R_whileContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.r_while`.
	 * @param ctx the parse tree
	 */
	exitR_while?: (ctx: R_whileContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.loop`.
	 * @param ctx the parse tree
	 */
	enterLoop?: (ctx: LoopContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.loop`.
	 * @param ctx the parse tree
	 */
	exitLoop?: (ctx: LoopContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.print`.
	 * @param ctx the parse tree
	 */
	enterPrint?: (ctx: PrintContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.print`.
	 * @param ctx the parse tree
	 */
	exitPrint?: (ctx: PrintContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.end`.
	 * @param ctx the parse tree
	 */
	enterEnd?: (ctx: EndContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.end`.
	 * @param ctx the parse tree
	 */
	exitEnd?: (ctx: EndContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.sendQuery`.
	 * @param ctx the parse tree
	 */
	enterSendQuery?: (ctx: SendQueryContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.sendQuery`.
	 * @param ctx the parse tree
	 */
	exitSendQuery?: (ctx: SendQueryContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.method`.
	 * @param ctx the parse tree
	 */
	enterMethod?: (ctx: MethodContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.method`.
	 * @param ctx the parse tree
	 */
	exitMethod?: (ctx: MethodContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.methodList`.
	 * @param ctx the parse tree
	 */
	enterMethodList?: (ctx: MethodListContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.methodList`.
	 * @param ctx the parse tree
	 */
	exitMethodList?: (ctx: MethodListContext) => void;

	/**
	 * Enter a parse tree produced by `RASPParser.stringMethod`.
	 * @param ctx the parse tree
	 */
	enterStringMethod?: (ctx: StringMethodContext) => void;
	/**
	 * Exit a parse tree produced by `RASPParser.stringMethod`.
	 * @param ctx the parse tree
	 */
	exitStringMethod?: (ctx: StringMethodContext) => void;

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
}

