import * as Promise from 'bluebird';
import { FlowdockConnectionDetails } from '../../services/flowdock-types';
import { DataHub } from './datahub';
export declare class FlowdockDataHub implements DataHub {
    private session;
    private organization;
    constructor(data: FlowdockConnectionDetails);
    fetchValue(user: string, key: string): Promise<string>;
    private fetchPrivateMessages(username, filter);
    private fetchUserId;
    private fetchFromSession;
}
export declare function createTranslator(data: FlowdockConnectionDetails): DataHub;
