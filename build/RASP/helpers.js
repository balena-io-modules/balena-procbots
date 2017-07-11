"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const FS = require("fs");
const path_1 = require("path");
const fs = Promise.promisifyAll(FS);
function MatchAssignByKeyword(keyword, value, assignTo, assignValue) {
    if (_.startsWith(value, keyword)) {
        assignTo[keyword] = assignValue.text;
    }
}
exports.MatchAssignByKeyword = MatchAssignByKeyword;
function GetSingletonFromRulePotentials(...potentials) {
    for (let index = 0; index < potentials.length; index++) {
        if (potentials[index]) {
            return potentials[index];
        }
    }
}
exports.GetSingletonFromRulePotentials = GetSingletonFromRulePotentials;
function FindAllFiles(dir, level = 0, filter, excludeDirs = []) {
    let files = [];
    const findEntries = (directory, dirLevel) => {
        return fs.readdirAsync(directory).map((entry) => {
            const abEntry = `${directory}${path_1.sep}${entry}`;
            return fs.lstatAsync(abEntry).then((stats) => {
                if (stats.isDirectory()) {
                    if (!_.find(excludeDirs, (lookupDir) => lookupDir === entry)) {
                        return findEntries(abEntry, dirLevel + 1);
                    }
                }
                else if (stats.isFile()) {
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
    };
    return findEntries(dir, 0).return(files);
}
exports.FindAllFiles = FindAllFiles;
function DebugExpression(expr, indent = 0) {
    const lookupType = (id) => {
        switch (id) {
            case 2:
                return 'Object';
            case 1:
                return 'Property';
            case 0:
                return 'Variable';
            case 3:
                return 'Array';
            case 0:
                return 'Variable';
            case 10:
                return '+';
            case 11:
                return '-';
            case 12:
                return '*';
            case 13:
                return '/';
            case 41:
                return 'NUMBER';
            case 43:
                return 'BOOLEAN';
            case 42:
                return 'STRING';
        }
    };
    const print = (message) => {
        let finalMessage = '';
        for (let loop = 0; loop < indent; loop++) {
            finalMessage += ' ';
        }
        console.log(`${finalMessage}${message}`);
    };
    print(`| ${lookupType(expr.type)}`);
    switch (expr.type) {
        case 2:
            const objExpr = expr;
            for (let prop of objExpr.properties) {
                DebugExpression(prop, indent + 1);
            }
            break;
        case 1:
            const propExpr = expr;
            print(`\\ ${propExpr.name}:`);
            DebugExpression(propExpr.value, indent + 1);
            break;
        case 3:
            const arrayExpr = expr;
            for (let value of arrayExpr.values) {
                DebugExpression(value, indent + 1);
            }
            break;
        case 0:
            const varExpr = expr;
            print(`\\ ${varExpr.name}:`);
            if (varExpr.value) {
                DebugExpression(varExpr.value, indent + 1);
            }
            break;
        case 10:
        case 11:
        case 12:
        case 13:
            const arithmeticExpr = expr;
            DebugExpression(arithmeticExpr.operandOne, indent + 1);
            DebugExpression(arithmeticExpr.operandTwo, indent + 1);
            break;
        case 41:
        case 43:
        case 42:
            print(`- ${expr.value}`);
            break;
        default:
            console.log(`Don't know how to deal with this type: ${expr.type}`);
    }
}
exports.DebugExpression = DebugExpression;

//# sourceMappingURL=helpers.js.map
