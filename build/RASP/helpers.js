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

//# sourceMappingURL=helpers.js.map
