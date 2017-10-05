import * as Promise from 'bluebird';
import { DataHub } from './datahub';
export declare class ConfigurationDataHub implements DataHub {
    private prefix;
    constructor(prefix: string);
    fetchValue(user: string, service: string, key: string): Promise<string>;
}
export declare function createDataHub(prefix: string): DataHub;
