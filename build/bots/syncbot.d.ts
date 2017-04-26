import { ProcBot } from '../framework/procbot';
export declare class SyncBot extends ProcBot {
    private messengers;
    private rooms;
    private genericAccounts;
    private systemAccounts;
    constructor(name?: string);
    private register(from, to, type);
    private createRouter(from, to);
    private handleThread(event);
    private handleMessage(event);
    private handleError(error, event);
    private getMessageService(key, data?);
    private createConnection(event, type);
    private create(event, type);
    private logSuccess(event);
    private logError(event, message?);
    private searchPrivateExistingOrGeneric(event, type);
    private searchPrivateOrGeneric(event, type);
    private searchPairs(event, type);
    private searchExisting(event, type);
    private searchGeneric(event, type);
    private searchSystem(event, type);
    private searchHistory(event, type, attemptsLeft?);
    private searchPrivate(event, type);
}
export declare function createBot(): SyncBot;
