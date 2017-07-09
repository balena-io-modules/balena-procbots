import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as FS from 'fs';
import { sep } from 'path';
import { Expression, ExpressionOp, ObjectExpression, PropertyExpression } from './parser-types';

const fs: any = Promise.promisifyAll(FS);

export function MatchAssignByKeyword(keyword: string, value: string, assignTo: any, assignValue: any) {
    if (_.startsWith(value, keyword)) {
        assignTo[keyword] = assignValue.text;
    }
}

export function GetSingletonFromRulePotentials(...potentials: any[]) {
    // This assumes that there can only be one match in the potentials.
    for (let index = 0; index < potentials.length; index++) {
        if (potentials[index]) {
            return potentials[index];
        }
    }
}

export function FindAllFiles(dir: string, level: number = 0, filter: string | undefined, excludeDirs: string[] = []): Promise<string[]> {
    let files: string[] = [];

    // We keep trawling directories and finding files. We only add files
    // that are level 'level' under the first directory given or deeper.
    const findEntries = (directory: string, dirLevel: number): Promise<string[]> => {
        // Get all entries and find files in it. If we find a directory, add a
        // new object and go into it.
        return fs.readdirAsync(directory).map((entry: any) => {
            // Is this a file or a directory?
            const abEntry = `${directory}${sep}${entry}`;
            return fs.lstatAsync(abEntry).then((stats: FS.Stats) => {
                if (stats.isDirectory()) {
                    if (!_.find(excludeDirs, (lookupDir) => lookupDir === entry)) {
                        return findEntries(abEntry, dirLevel + 1);
                    }
                } else if (stats.isFile()) {
                    // We don't deal with links if they're not transparent.
                    // Ensure that the suffix matches.
                    if (filter) {
                        const extIndex = abEntry.indexOf('.');
                        if (!extIndex) {
                            return;
                        }

                        const suffix = abEntry.substring(extIndex);
                        if (filter !== suffix) {
                            return;
                        }
                    }
                    if (dirLevel >= level) {
                        files.push(abEntry);
                    }
                }
            });
        });
    }

    return findEntries(dir, 0).return(files);
}

export function DebugExpression(expr: Expression, indent: number = 0) {
    // Print the type
    const lookupType = (id: ExpressionOp) => {
        switch (id) {
            case ExpressionOp.Object:
                return 'Object';
            case ExpressionOp.Property:
                return 'Property';
            case ExpressionOp.Variable:
                return 'Variable';
            case ExpressionOp.NUMBER:
                return 'NUMBER';
            case ExpressionOp.BOOLEAN:
                return 'BOOLEAN';
            case ExpressionOp.STRING:
                return 'STRING';

        }
    }

    const print = (message: string) => {
        let finalMessage = '';
        for (let loop = 0; loop < indent; loop++) {
            finalMessage += ' ';
        }
        console.log(`${finalMessage}${message}`);
    }

    print(`| ${lookupType(expr.type)}`);

    // Determine how to get the children, if any.
    switch (expr.type) {
        case ExpressionOp.Object:
            const objExpr = <ObjectExpression>expr;
            for (let prop of objExpr.properties) {
                DebugExpression(prop, indent + 1);
            }
            break;

        case ExpressionOp.Property:
            const propExpr = <PropertyExpression>expr;
            print(`\\ ${propExpr.name}:`);
            DebugExpression(propExpr.value, indent + 1);
            break;

        case ExpressionOp.NUMBER:
        case ExpressionOp.BOOLEAN:
        case ExpressionOp.STRING:
            print(`- ${expr.value}`);
            break;

        default:
            console.log(`Don't know how to deal with this type: ${expr.type}`);
    }
}