interface FlowdockStream {
	on(event: string, callback: (response: any) => void): void;
}

declare module 'flowdock' {
	class Session {
		constructor(token: string);
		public get(path: string, data: {}, callback: (error: Error, body: any, result: any) => void): void;
		public flows(callback: (error: Error, body: any, result: any) => void): void;
		public stream(ids: string[]): FlowdockStream;
		public on(event: string, callback: (error: Error) => void): void;
		public removeListener(event: string, callback: (error: Error) => void): void;
	}
}
