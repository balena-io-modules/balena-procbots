import { ProcBot } from '../framework/procbot';
export declare class SyncBot extends ProcBot {
    private static makeRouter(from, to, messenger, logger);
    private static createErrorComment(to, messenger, data, error);
    private static getErrorSolution(service, message);
    private static updateTags(to, messenger, data);
    private static createComment(to, messenger, data);
    private static readConnectedThread(to, messenger, data);
    private static createThreadAndConnect(to, messenger, data);
    private static makeDataHubs();
    private static makeMessenger();
    private static makeMappings();
    constructor(name?: string);
}
export declare function createBot(): SyncBot;
