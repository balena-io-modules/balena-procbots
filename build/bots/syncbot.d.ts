import { ProcBot } from '../framework/procbot';
export declare class SyncBot extends ProcBot {
    private static makeRouter(from, to, emitter, logger);
    private static createThreadAndConnect(from, to, emitter, event);
    constructor(name?: string);
}
export declare function createBot(): SyncBot;
