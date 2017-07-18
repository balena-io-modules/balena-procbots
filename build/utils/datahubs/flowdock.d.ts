import { FlowdockConnectionDetails } from '../../services/flowdock-types';
import { DataHub } from './datahub';
export declare class FlowdockDataHub implements DataHub {
    private session;
    private organization;
    constructor(data: FlowdockConnectionDetails);
    fetchValue(_user: string, _value: string): Promise<string>;
}
export declare function createTranslator(data: FlowdockConnectionDetails): DataHub;
