import { ProcBot } from '../framework/procbot';
export declare class SyncBot extends ProcBot {
    private static getEquivalentUsername(from, to, username);
    private static makeRouter(from, to, emitter);
    constructor(name?: string);
}
export declare function createBot(): SyncBot;
