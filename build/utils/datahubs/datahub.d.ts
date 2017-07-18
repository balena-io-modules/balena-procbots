export interface DataHub {
    fetchValue(user: string, value: string): Promise<string>;
}
export declare function createDataHub(name: string, data: any): DataHub;
