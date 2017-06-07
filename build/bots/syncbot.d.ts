import { ProcBot } from '../framework/procbot';
export declare class SyncBot extends ProcBot {
    private messengers;
    private hub;
    constructor(name?: string);
    private register(from, to);
    private createRouter(from, to);
    private handleError(error, event);
    private getMessageService(key, data?);
    private getDataHub(key, data?);
    private createConnection(event, type);
    private create(event);
    private logSuccess(event);
    private logError(error, event);
    private useHubOrGeneric(event, type);
    private useProvided(event, type);
    private useGeneric(event, type);
    private useSystem(event, type);
    private useConnected(event, type);
    private useHub(event, type);
}
export declare function createBot(): SyncBot;
