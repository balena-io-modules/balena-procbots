import * as Promise from 'bluebird';
export interface CommandOptions {
    cwd?: string;
    retries?: number;
    delay?: number;
}
export interface Command {
    command: string;
    args: string[];
    options: CommandOptions;
}
export declare function BuildCommand(command: string, args?: string[], options?: CommandOptions): Command;
export declare function ExecuteCommand(command: Command): Promise<string>;
