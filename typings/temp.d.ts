interface TempInterface {
	mkdir: (prefix: string, cb: (err: Error, dirPath: string) => void) => void;
}

declare module 'temp' {
	export interface CleanupStats {
		files: number;
		dirs?: number;
	}

	function track(): TempInterface;
	function cleanup(cb: (err: Error, stats: CleanupStats) => void): void;
}
