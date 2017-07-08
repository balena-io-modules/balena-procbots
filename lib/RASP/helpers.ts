import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as FS from 'fs';
import { sep } from 'path';

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
