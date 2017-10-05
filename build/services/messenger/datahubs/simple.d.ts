import * as Promise from 'bluebird';
import { DataHub } from './datahub';
export declare class SimpleDataHub implements DataHub {
    private values;
    constructor(values: {
        [key: string]: string;
    });
    fetchValue(user: string, service: string, key: string): Promise<string>;
}
export declare function createDataHub(values: {
    [key: string]: string;
}): DataHub;
