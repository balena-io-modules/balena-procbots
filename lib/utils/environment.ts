/*
Copyright 2016-2017 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import * as Promise from 'bluebird';
import { spawn } from 'child_process';

export interface CommandOptions {
	/** The CWD to run the command in. */
	cwd?: string;
	/**
	 * How many retry attempts should occur if the command fails. Any value less than
	 * one will result in no retries.
	 */
	retries?: number;
}

/** Used to create external command to run on the environment hosting VersionBot. */
export interface Command {
	/** The command to run. */
	command: string;
	/** The arguments to pass to the command as an array. */
	args: string[];
	/** Any relevant options for the command. */
	options?: CommandOptions;
}

/**
 * Build a new environment command object.
 *
 * @param command  The name of the command to execute.
 * @param args     An array of arguments to pass to the command.
 * @param options  A CommandOptions structure containing options required when the command is executed.
 * @returns        A Command object which can be passed to the RunCommand method.
 */
export function BuildCommand(command: string, args?: string[], options?: CommandOptions): Command {
	let builtOptions: CommandOptions | undefined;
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
};

/**
 * Executes an environment command.
 * The command will be executed via the `child_process.spawn` command. This ensures that
 * a new process is used to run the command, thus ensuring no access to the local shell.
 * The command will be attempted based on the value of the `options.retry` property in the
 * passed Command object. Should no retries be specified, command execution will only
 * be attempted once.
 *
 * @param params  A Command object detailing the command to execute.
 * @returns       A Promise containing a string from `stdout`. If output from `stderr` occurred, this will be used
 *                instead.
 * @throws        An error containing a message from the failed command's `stderr` output.
 */
export function ExecuteCommand(command: Command): Promise<{}> {
	let tries = ((command.options || {}).retries || 0) + 1;
	const callCommand = (): Promise<{}> => {
		return new Promise((resolve, reject) => {
			const child = spawn(command.command, command.args, command.options);
			let stdout: string;
			let stderr: string;

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
			// If there's any stderr output, we send that instead of stdout.
			child.addListener('close', () => resolve(stderr ? stderr : stdout));
			child.addListener('error', (err: Error) => reject(err));
		}).catch((err: Error) => {
			// Keep trying until we exhaust retries.
			tries--;
			if (tries > 0) {
				return Promise.delay(1000).then(callCommand);
			}

			throw err;
		});
	};

	// Attempt to carry out a number of retries until success or retry exhaustion.
	return callCommand();
};