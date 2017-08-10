import { ProcBot } from '../framework/procbot';
export declare class SyncBot extends ProcBot {
    private static makeRouter(from, to, emitter, logger?);
    constructor(name?: string);
}
export declare function createBot(): SyncBot;
