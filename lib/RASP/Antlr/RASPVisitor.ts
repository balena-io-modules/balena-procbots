// Generated from lib/RASP/Antlr/RASP.g4 by ANTLR 4.6-SNAPSHOT


import { ParseTreeVisitor } from 'antlr4ts/tree/ParseTreeVisitor';

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
	 * Visit a parse tree produced by `RASPParser.requestServiceEvents`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitRequestServiceEvents?: (ctx: RequestServiceEventsContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.events`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitEvents?: (ctx: EventsContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.setIdAs`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitSetIdAs?: (ctx: SetIdAsContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.setIdFrom`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitSetIdFrom?: (ctx: SetIdFromContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.listenerMethod`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitListenerMethod?: (ctx: ListenerMethodContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.listenerEventReceiver`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitListenerEventReceiver?: (ctx: ListenerEventReceiverContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.listenerError`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitListenerError?: (ctx: ListenerErrorContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.statement`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitStatement?: (ctx: StatementContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.expr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExpr?: (ctx: ExprContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.serviceName`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitServiceName?: (ctx: ServiceNameContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.variable`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitVariable?: (ctx: VariableContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.object`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitObject?: (ctx: ObjectContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.array`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitArray?: (ctx: ArrayContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.property`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitProperty?: (ctx: PropertyContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.assignment`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAssignment?: (ctx: AssignmentContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.r_if`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitR_if?: (ctx: R_ifContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.r_while`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitR_while?: (ctx: R_whileContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.loop`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitLoop?: (ctx: LoopContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.print`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitPrint?: (ctx: PrintContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.end`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitEnd?: (ctx: EndContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.sendQuery`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitSendQuery?: (ctx: SendQueryContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.method`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitMethod?: (ctx: MethodContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.methodList`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitMethodList?: (ctx: MethodListContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.stringMethod`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitStringMethod?: (ctx: StringMethodContext) => Result;

	/**
	 * Visit a parse tree produced by `RASPParser.envvar`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitEnvvar?: (ctx: EnvvarContext) => Result;
}

