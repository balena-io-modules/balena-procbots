import * as Promise from 'bluebird';
import { ServiceEmitRequest, ServiceEmitter, ServiceListener } from '../services/service-types';
import { Logger } from '../utils/logger';
import { ConfigurationLocation, ProcBotConfiguration } from './procbot-types';
export declare class ProcBot {
    protected _botname: string;
    protected logger: Logger;
    private listeners;
    private emitters;
    private nodeBinPath;
    constructor(name?: string);
    getNodeBinPath(): Promise<string>;
    protected processConfiguration(configFile: string): ProcBotConfiguration | void;
    protected retrieveConfiguration(details: ConfigurationLocation): Promise<ProcBotConfiguration | void>;
    protected addServiceListener(name: string, data?: any): ServiceListener | void;
    protected addServiceEmitter(name: string, data?: any): ServiceEmitter | void;
    protected getListener(handle: string): ServiceListener | void;
    protected getEmitter(handle: string): ServiceEmitter | void;
    protected dispatchToAllEmitters(data: ServiceEmitRequest): Promise<any[]>;
    protected dispatchToEmitter(handle: string, data: any): Promise<any>;
    private getService(name);
    private addService(type, name, data?);
}
