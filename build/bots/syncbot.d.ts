import { ProcBot } from '../framework/procbot';
export declare class SyncBot extends ProcBot {
    constructor(name?: string);
    private createRouter(from, to);
    private getEquivalentUsername(from, to, username);
}
export declare function createBot(): SyncBot;
