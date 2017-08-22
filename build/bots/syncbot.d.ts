import { ProcBot } from '../framework/procbot';
export declare class SyncBot extends ProcBot {
    private static makeRouter(from, to, messenger, logger);
    private static createComment(to, messenger, data);
    private static readConnectedThread(to, messenger, data);
    private static createThreadAndConnect(to, messenger, data);
    constructor(name?: string);
}
export declare function createBot(): SyncBot;
