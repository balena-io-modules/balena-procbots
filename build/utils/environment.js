"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const child_process_1 = require("child_process");
function BuildCommand(command, args, options) {
    let builtOptions;
    if (options) {
        builtOptions = {
            cwd: options.cwd,
            retries: options.retries
        };
    }
    return {
        command,
        args: args || [],
        options: builtOptions
    };
}
exports.BuildCommand = BuildCommand;
;
function ExecuteCommand(command) {
    let tries = ((command.options || {}).retries || 0) + 1;
    const callCommand = () => {
        return new Promise((resolve, reject) => {
            const child = child_process_1.spawn(command.command, command.args, command.options);
            let stdout;
            let stderr;
            child.stdout.on('data', (data) => {
                if (!stdout) {
                    stdout = '';
                }
                stdout += data.toString();
            });
            child.stderr.on('data', (data) => {
                if (!stderr) {
                    stderr = '';
                }
                stderr += data.toString();
            });
            child.addListener('close', () => resolve(stderr ? stderr : stdout));
            child.addListener('error', (err) => reject(err));
        }).catch((err) => {
            tries--;
            if (tries > 0) {
                return Promise.delay(1000).then(callCommand);
            }
            throw err;
        });
    };
    return callCommand();
}
exports.ExecuteCommand = ExecuteCommand;
;

//# sourceMappingURL=environment.js.map
