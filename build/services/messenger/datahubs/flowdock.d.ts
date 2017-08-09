import * as Promise from 'bluebird';
import { FlowdockConnectionDetails } from '../../flowdock-types';
import { DataHub } from './datahub';
export declare class FlowdockDataHub implements DataHub {
    private session;
    private organization;
    constructor(data: FlowdockConnectionDetails);
    fetchValue(user: string, service: string, key: string): Promise<string>;
    private fetchPrivateMessages(username, filter);
    private fetchUserId;
    private fetchFromSession;
}
export declare function createDataHub(data: FlowdockConnectionDetails): DataHub;
