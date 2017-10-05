import TypedError = require('typed-error');
import * as Promise from 'bluebird';
export declare const enum DataHubErrorCode {
    ValueNotFound = 0,
}
export declare class DataHubError extends TypedError {
    code: DataHubErrorCode;
    constructor(code: DataHubErrorCode, message: string);
}
export interface DataHub {
    fetchValue(user: string, service: string, key: string): Promise<string>;
}
export declare function createDataHub(name: string, data: any): DataHub;
