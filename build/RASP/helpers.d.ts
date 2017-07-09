import * as Promise from 'bluebird';
import { Expression } from './parser-types';
export declare function MatchAssignByKeyword(keyword: string, value: string, assignTo: any, assignValue: any): void;
export declare function GetSingletonFromRulePotentials(...potentials: any[]): any;
export declare function FindAllFiles(dir: string, level: number | undefined, filter: string | undefined, excludeDirs?: string[]): Promise<string[]>;
export declare function DebugExpression(expr: Expression, indent?: number): void;
