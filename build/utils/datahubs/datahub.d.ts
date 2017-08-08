import * as Promise from 'bluebird';
export interface DataHub {
    fetchValue(user: string, service: string, key: string): Promise<string>;
}
export declare function createDataHub(name: string, data: any): DataHub;
