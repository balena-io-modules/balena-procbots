import { FrontConnectionDetails, FrontEmitMethod, FrontEndpointDefinition, FrontHandle } from './front-types';
import { ServiceEmitter, ServiceListener } from './service-types';
import { ServiceUtilities } from './service-utilities';
export declare class FrontService extends ServiceUtilities implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private session;
    protected connect(data: FrontConnectionDetails): void;
    protected startListening(): void;
    protected verify(): boolean;
    protected getEmitter(data: FrontEndpointDefinition): FrontEmitMethod;
    readonly serviceName: string;
    readonly apiHandle: FrontHandle;
}
export declare function createServiceListener(data: FrontConnectionDetails): ServiceListener;
export declare function createServiceEmitter(data: FrontConnectionDetails): ServiceEmitter;
