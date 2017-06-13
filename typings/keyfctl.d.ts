declare module 'keyfctl' {
	export class Service {
		public errors: any[];
		public _revision: string;
		public _name: string;
		public version: string;
		public image: string;
		public target: string;
		public valid: boolean;
		public action: string;
	}

	export interface LintResponse {
		valid: boolean;
		messages: any[];
		frames: any[];
	}

	export interface LintError extends Error {
		message: string;
		parsedLine: number;
		snippet: string;
	}

	function lint(base: string, head: string, workDir: string): LintResponse;
}
