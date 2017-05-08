import * as Promise from 'bluebird';
import { ServiceEmitRequest, ServiceEmitResponse, ServiceEmitter, ServiceListener } from '../services/service-types';
import { Logger } from '../utils/logger';
import { ProcBotConfiguration } from './procbot-types';
export declare class ProcBot {
    protected _botname: string;
    protected logger: Logger;
    private emitters;
    private listeners;
    private nodeBinPath;
    constructor(name?: string);
    getNodeBinPath(): Promise<string>;
    protected processConfiguration(configFile: string): ProcBotConfiguration | void;
    protected retrieveConfiguration(source: string, location: string | ServiceEmitRequest): Promise<ProcBotConfiguration | ServiceEmitResponse | void>;
    protected addServiceListener(name: string, data?: any): ServiceListener | void;
    protected addServiceEmitter(name: string, data?: any): ServiceEmitter | void;
    protected getListener(name: string): ServiceListener | void;
    protected getEmitter(name: string): ServiceEmitter | void;
    protected dispatchToAllEmitters(data: ServiceEmitRequest): Promise<ServiceEmitResponse[]>;
    protected dispatchToEmitter(name: string, data: ServiceEmitRequest): Promise<ServiceEmitResponse>;
    private getService(name);
}
